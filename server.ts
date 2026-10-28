
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Gemini is used for natural-language transaction parsing.
let ai: GoogleGenAI | null = null;

if (
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

// ======================================================
// LOCAL TRANSACTION PARSER
// ======================================================

function parseFinancialPromptLocally(prompt: string) {
  const clean = prompt.trim();
  let amount = 0;

  const amountMatch =
    clean.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i) ||
    clean.match(/([\d,]+(?:\.\d+)?)\s*(?:rupees|inr)/i) ||
    clean.match(
      /(?:paid|received|spent|billed)\s*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)/i
    );

  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  const isIncome =
    /\b(received|credited|refund|incoming|earned|invoiced to)\b/i.test(clean);

  const type: 'Expense' | 'Income' = isIncome ? 'Income' : 'Expense';

  let vendor = 'General Vendor';

  const vendorMatch = clean.match(
    /(?:paid to|to|from|at|vendor)\s+([A-Za-z0-9&.\- ]+?)(?:\s+for|\s+on|\s+via|\s+dated|\.|$)/i
  );

  if (vendorMatch?.[1]?.trim()) {
    vendor = vendorMatch[1].trim();
  }

  let date = '';

  const isoDateMatch = clean.match(/\b(20\d{2}-[01]\d-[0-3]\d)\b/);

  if (isoDateMatch) {
    date = isoDateMatch[1];
  } else {
    const textDateMatch = clean.match(
      /(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(20\d{2}))?/i
    );

    if (textDateMatch) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04',
        may: '05', jun: '06', jul: '07', aug: '08',
        sep: '09', oct: '10', nov: '11', dec: '12',
      };

      const month = months[textDateMatch[2].slice(0, 3).toLowerCase()];
      const year = textDateMatch[3] || String(new Date().getFullYear());

      date = `${year}-${month}-${textDateMatch[1].padStart(2, '0')}`;
    }
  }

  let category = 'Office Supplies';

  if (/aws|azure|cloud|hosting|server|digitalocean|domain/i.test(clean)) {
    category = 'Cloud Infrastructure';
  } else if (/consult|legal|retainer|lawyer|audit|advisory/i.test(clean)) {
    category = 'Consulting & Legal';
  } else if (/\b(ads?|marketing|campaign|google ads|meta|branding|pr)\b/i.test(clean)) {
    category = 'Marketing & Ads';
  } else if (/shipment|flight|uber|travel|cargo|freight|courier|delivery|blue dart/i.test(clean)) {
    category = 'Logistics & Travel';
  } else if (/laptop|monitor|printer|hardware|server rack|cable/i.test(clean)) {
    category = 'Hardware & Equipment';
  } else if (/electricity|water|maintenance|rent|broadband|airtel|jio/i.test(clean)) {
    category = 'Utilities & Rent';
  } else if (/saas|subscription|slack|github|zoom|figma|notion/i.test(clean)) {
    category = 'Software Subscriptions';
  } else if (/supply|stationery|paper|desk|chair|pantry|coffee/i.test(clean)) {
    category = 'Office Supplies';
  }

  let paymentMethod = 'UPI';

  if (/upi|gpay|phonepe|paytm/i.test(clean)) {
    paymentMethod = 'UPI';
  } else if (/neft|rtgs|bank transfer|wire/i.test(clean)) {
    paymentMethod = 'NEFT/RTGS';
  } else if (/card|credit|debit|corporate card|visa|mastercard/i.test(clean)) {
    paymentMethod = 'Corporate Card';
  } else if (/cash/i.test(clean)) {
    paymentMethod = 'Cash';
  } else if (/net banking|netbanking/i.test(clean)) {
    paymentMethod = 'Net Banking';
  }

  return {
    vendor,
    amount,
    currencyCode: /₹|\binr\b|rupees/i.test(clean) ? 'INR' : '',
    description: clean || 'Business transaction',
    date,
    category,
    paymentMethod,
    type,
    status: 'Pending' as const,
  };
}

// ======================================================
// SYSTEM STATUS
// ======================================================

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'TrustLedger AI',
    version: '1.3.0',
    hasGeminiKey: Boolean(ai),
    activeModel: ai
      ? 'Gemini (transaction parsing only)'
      : 'Local transaction rules',
    ocrEngine: 'Tesseract.js',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// ======================================================
// NATURAL-LANGUAGE TRANSACTION PARSER
// ======================================================

app.post(
  '/api/ai/parse-transaction',
  async (req: Request, res: Response) => {
    const { prompt } = req.body ?? {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt string is required',
      });
    }

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract transaction details from this user prompt:
"${prompt}"

Return numeric amount, ISO currencyCode, vendor, description, date,
category, paymentMethod, and type. Do not invent missing facts.
If currency or date is not explicit, return an empty string for it.

Categories: Cloud Infrastructure, Office Supplies, Consulting & Legal,
Marketing & Ads, Logistics & Travel, Hardware & Equipment,
Utilities & Rent, Software Subscriptions.

Payment methods: UPI, NEFT/RTGS, Corporate Card, Net Banking, Cash.`,
            config: {
              systemInstruction:
                'Return accurate JSON. Never invent details not supported by the prompt.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  vendor: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  currencyCode: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  category: { type: Type.STRING },
                  paymentMethod: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: [
                  'vendor',
                  'amount',
                  'currencyCode',
                  'description',
                  'date',
                  'category',
                  'paymentMethod',
                  'type',
                ],
              },
            },
          }),
          10000
        );

        const parsedText = response.text?.trim();

        if (parsedText) {
          const data = JSON.parse(parsedText);

          return res.json({
            success: true,
            source: 'gemini',
            model: 'gemini-2.5-flash',
            data: {
              ...data,
              status: 'Pending',
            },
          });
        }
      } catch (err) {
        console.warn(
          'Gemini transaction parser error:',
          err instanceof Error ? err.message : err
        );
      }
    }

    return res.json({
      success: true,
      source: 'smart_rules',
      model: 'TrustLedger Rule Engine',
      note: ai
        ? 'Gemini unavailable; used local fallback'
        : 'Gemini is not configured; used local fallback',
      data: parseFinancialPromptLocally(prompt),
    });
  }
);

// ======================================================
// DEMO INVOICE SAMPLES
// Illustrative examples only; not verified business records.
// ======================================================

const samples: Record<string, any> = {
  techcorp: {
    vendorName: 'TechCorp Solutions Pvt. Ltd.',
    invoiceNumber: 'INV-2026-8842',
    invoiceDate: '2026-10-24',
    dueDate: '2026-11-08',
    gstin: '',
    totalAmount: 18450,
    taxAmount: 2814.41,
    currencyCode: 'INR',
    category: 'Software Subscriptions',
    paymentMethod: 'NEFT/RTGS',
    lineItems: [],
  },
  cloudscale: {
    vendorName: 'CloudScale Infrastructure Services',
    invoiceNumber: 'CSI-OCT-9901',
    invoiceDate: '2026-10-26',
    dueDate: '2026-11-05',
    gstin: '',
    totalAmount: 14500,
    taxAmount: 2211.86,
    currencyCode: 'INR',
    category: 'Cloud Infrastructure',
    paymentMethod: 'Corporate Card',
    lineItems: [],
  },
  deltoffice: {
    vendorName: 'Delta Office Supplies & Logistics',
    invoiceNumber: 'DEL-INV-4421',
    invoiceDate: '2026-10-25',
    dueDate: '2026-10-31',
    gstin: '',
    totalAmount: 6850,
    taxAmount: 1044.92,
    currencyCode: 'INR',
    category: 'Office Supplies',
    paymentMethod: 'UPI',
    lineItems: [],
  },
};

// ======================================================
// INVOICE TEXT PARSING HELPERS
// ======================================================

function firstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function parseInvoiceMoney(raw: string): number | null {
  let value = raw.trim().replace(/[^\d.,'-]/g, '');

  if (!value) return null;

  // Support common European format: 1.234,56
  if (/,\d{2}$/.test(value) && value.includes('.')) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (/,\d{2}$/.test(value)) {
    value = value.replace(',', '.');
  } else {
    value = value.replace(/,/g, '');
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function moneyFromLine(line: string): number | null {
  const matches = [
    ...line.matchAll(
      /(?:CHF|EUR|USD|GBP|INR|Rs\.?|[$€£₹])?\s*(-?\d[\d'.,]*(?:\s\d{3})*)/gi
    ),
  ];

  if (!matches.length) return null;

  // Prefer the final amount on a total/tax line.
  for (let i = matches.length - 1; i >= 0; i--) {
    const amount = parseInvoiceMoney(matches[i][1]);
    if (amount !== null) return amount;
  }

  return null;
}

function parseInvoiceText(text: string, confidence: number) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const fullText = lines.join('\n');

  // --------------------------------------------------
  // CURRENCY
  // Preserve the invoice's original currency.
  // If several currencies appear, prefer CHF when the
  // receipt explicitly labels its grand total in CHF.
  // --------------------------------------------------

  const currencyCode = /\bCHF\b/i.test(fullText)
    ? 'CHF'
    : /€|\bEUR\b/i.test(fullText)
      ? 'EUR'
      : /£|\bGBP\b/i.test(fullText)
        ? 'GBP'
        : /\bUSD\b|\$\s*\d/i.test(fullText)
          ? 'USD'
          : /₹|\bINR\b|\bRs\.?\s*\d/i.test(fullText)
            ? 'INR'
            : '';

  // --------------------------------------------------
  // VENDOR
  // The first suitable text line is a best-effort guess.
  // --------------------------------------------------

  const vendorName =
    lines.find(
      (line) =>
        /[A-Za-zÄÖÜäöü]/.test(line) &&
        !/invoice|rechnung|bill to|ship to|date|datum|total|subtotal|tax|mwst|ust|amount due/i.test(
          line
        ) &&
        !/^\d[\d\s./:-]*$/.test(line)
    ) || '';

  // --------------------------------------------------
  // INVOICE / RECEIPT NUMBER
  // --------------------------------------------------

  const invoiceNumber = firstMatch(fullText, [
    /(?:invoice|receipt|rechnung)\s*(?:no\.?|number|nr\.?|#)?\s*[:.]?\s*([A-Z0-9][A-Z0-9\-\/]+)/i,
    /\brech\.?\s*nr\.?\s*[:.]?\s*([A-Z0-9\-\/]+)/i,
    /\binv\s*#?\s*[:.]?\s*([A-Z0-9\-\/]+)/i,
  ]);

  // --------------------------------------------------
  // DATES
  // Supports DD.MM.YYYY, DD/MM/YYYY, and YYYY-MM-DD.
  // --------------------------------------------------

  const dateMatch = fullText.match(
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b|\b(\d{4})-(\d{2})-(\d{2})\b/
  );

  let invoiceDate = '';

  if (dateMatch) {
    if (dateMatch[4]) {
      invoiceDate = `${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`;
    } else {
      const day = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const year = Number(dateMatch[3]);

      // The receipt date is treated as DD.MM.YYYY.
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        invoiceDate =
          `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // --------------------------------------------------
  // TOTAL, SUBTOTAL, AND TAX
  // Exclude currency conversion lines from total selection.
  // --------------------------------------------------

  const totalLine = lines.find(
    (line) =>
      /\b(grand\s*total|total\s*due|amount\s*due|balance\s*due|total)\b/i.test(line) &&
      !/\b(subtotal|tax total|total tax)\b/i.test(line) &&
      !/entspricht|equivalent|converted|exchange rate/i.test(line)
  );

  const subtotalLine = lines.find((line) =>
    /\b(subtotal|sub-total|net amount)\b/i.test(line)
  );

  const taxLine = lines.find(
    (line) =>
      /\b(sales\s*tax|vat|gst|tax|mwst|ust)\b/i.test(line) &&
      !/tax id|tax number|tax rate/i.test(line)
  );

  const totalAmount = totalLine ? moneyFromLine(totalLine) : null;
  const subtotalAmount = subtotalLine ? moneyFromLine(subtotalLine) : null;
  const taxAmount = taxLine ? moneyFromLine(taxLine) : null;

  // --------------------------------------------------
  // GSTIN
  // --------------------------------------------------

  const gstin = firstMatch(fullText, [
    /\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b/i,
  ]);

  // --------------------------------------------------
  // DUE DATE
  // --------------------------------------------------

  const dueDateRaw = firstMatch(fullText, [
    /due\s*date\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i,
  ]);

  let dueDate = '';

  if (dueDateRaw) {
    const parts = dueDateRaw.split(/[./-]/);

    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);

      if (year >= 1000 && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        dueDate =
          `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // --------------------------------------------------
  // LINE ITEMS
  // Exclude totals, tax, payment summaries, and conversions.
  // --------------------------------------------------

  const excludedLine =
    /\b(grand\s*total|total\s*due|amount\s*due|balance\s*due|subtotal|sub-total|tax|gst|vat|mwst|ust|invoice|rechnung|due\s*date|entspricht|equivalent|exchange\s*rate|including\s*tax|including\s*vat)\b/i;

  const lineItems = lines
    .filter((line) => {
      if (excludedLine.test(line)) return false;

      // Require an amount with two decimal places.
      if (!/\d+[.,]\d{2}\b/.test(line)) return false;

      // Exclude pure date/time metadata.
      if (
        /\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/.test(line) &&
        !/[A-Za-zÄÖÜäöü]/.test(line)
      ) {
        return false;
      }

      return true;
    })
    .slice(0, 30)
    .map((line) => {
      const amount = moneyFromLine(line) ?? 0;

      return {
        description: line,
        quantity: 1,
        unitPrice: amount,
        total: amount,
      };
    });

  return {
    vendorName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    gstin,
    currencyCode,
    totalAmount: totalAmount ?? 0,
    subtotalAmount: subtotalAmount ?? 0,
    taxAmount: taxAmount ?? 0,
    taxLabel: taxLine
      ? taxLine.match(/\b(sales\s*tax|vat|gst|mwst|ust|tax)\b/i)?.[0] || ''
      : '',
    category: 'Uncategorized',
    paymentMethod: '',
    lineItems,
    extractedText: fullText,
    confidence,
  };
}

// ======================================================
// INVOICE OCR — TESSERACT.JS
// ======================================================

app.post(
  '/api/ai/ocr-invoice',
  async (req: Request, res: Response) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      sampleId,
    } = req.body ?? {};

    if (sampleId) {
      const chosen = samples[String(sampleId)];

      if (!chosen) {
        return res.status(400).json({
          success: false,
          error: 'Unknown sample invoice ID',
        });
      }

      return res.json({
        success: true,
        source: 'sample',
        model: 'TrustLedger Demo Invoice Samples',
        data: chosen,
      });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Upload an invoice image or provide a valid sampleId.',
      });
    }

    const supportedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!supportedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Supported invoice formats: JPEG, PNG, and WEBP.',
      });
    }

    let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

    try {
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ''
      );

      if (!cleanBase64 || cleanBase64.length < 100) {
        return res.status(400).json({
          success: false,
          error: 'The uploaded image appears to be empty or invalid.',
        });
      }

      const imageBuffer = Buffer.from(cleanBase64, 'base64');

      if (!imageBuffer.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image data.',
        });
      }

      worker = await createWorker('eng');

      const result = await withTimeout(
        worker.recognize(imageBuffer),
        30000
      );

      const extractedText = result.data.text || '';
      const confidence = result.data.confidence || 0;

      if (!extractedText.trim()) {
        return res.status(422).json({
          success: false,
          source: 'tesseract',
          error: 'No readable text found. Upload a clearer invoice image.',
        });
      }

      const data = parseInvoiceText(extractedText, confidence);

      // Do not invent missing values. Return the OCR text for review.
      if (!data.vendorName || !data.totalAmount || !data.currencyCode) {
        return res.status(422).json({
          success: false,
          source: 'tesseract',
          error:
            'Text was extracted, but the vendor, total, or currency could not be identified reliably. Review the extracted text manually.',
          partialData: data,
        });
      }

      return res.json({
        success: true,
        source: 'tesseract',
        model: 'Tesseract.js OCR',
        data,
      });
    } catch (err) {
      console.error(
        'Tesseract invoice OCR failed:',
        err instanceof Error ? err.message : err
      );

      return res.status(500).json({
        success: false,
        source: 'ocr_unavailable',
        error:
          'Invoice extraction failed. Try a clear JPG or PNG image and check server logs.',
      });
    } finally {
      if (worker) {
        await worker.terminate().catch((err) => {
          console.error('Could not terminate OCR worker:', err);
        });
      }
    }
  }
);

// ======================================================
// VITE DEVELOPMENT / PRODUCTION STATIC FILES
// ======================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrustLedger AI server running on http://0.0.0.0:${PORT}`);
    console.log(`Gemini configured: ${Boolean(ai)}`);
    console.log('Invoice OCR engine: Tesseract.js');
  });
}

startServer().catch((err) => {
  console.error('Failed to start TrustLedger AI server:', err);
  process.exit(1);
});
