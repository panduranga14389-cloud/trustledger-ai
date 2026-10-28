import React, { useState } from 'react';
import {
  FileScan,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Hash,
  Sparkles,
  Link2,
  Trash2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { LineItem, TransactionCategory, PaymentMethod } from '../types/ledger';
import { FormatINR } from '../components/common/Badge';

interface OcrExtractedData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  gstin?: string;
  totalAmount: number;
  taxAmount?: number;
  category?: string;
  paymentMethod?: string;
  lineItems: LineItem[];
}

export const InvoiceOcrPage: React.FC<{
  onRecordCreated: () => void;
}> = ({ onRecordCreated }) => {
  const { addTransaction, addEvidenceDocument } = useLedger();

  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: 'PDF' | 'PNG' | 'JPG';
    base64?: string;
  } | null>(null);
  const [extractedData, setExtractedData] = useState<OcrExtractedData | null>(null);
  const [ocrEngineTag, setOcrEngineTag] = useState<string>('Pre-Verified Sample Engine');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sample Documents for immediate 1-click test
  const sampleInvoices = [
    {
      id: 'techcorp',
      label: 'Sample 1: TechCorp IT Solutions (PDF)',
      fileName: 'TechCorp_Security_INV8842.pdf',
      size: '840 KB',
      vendor: 'TechCorp Solutions Pvt. Ltd.',
      amount: 18450,
    },
    {
      id: 'cloudscale',
      label: 'Sample 2: CloudScale Services (PDF)',
      fileName: 'CloudScale_CSI_OCT_9901_TaxInvoice.pdf',
      size: '1.2 MB',
      vendor: 'CloudScale Infrastructure Services',
      amount: 14500,
    },
    {
      id: 'deltoffice',
      label: 'Sample 3: Delta Supplies Receipt (PNG)',
      fileName: 'Delta_Supplies_Receipt_DEL4421.png',
      size: '2.4 MB',
      vendor: 'Delta Office Supplies & Logistics',
      amount: 6850,
    },
  ];

  // Process sample document
  const handleSelectSample = async (sampleId: string) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessToast(null);

    const sample = sampleInvoices.find((s) => s.id === sampleId);
    if (sample) {
      setSelectedFile({
        name: sample.fileName,
        size: sample.size,
        type: sample.fileName.endsWith('.pdf') ? 'PDF' : 'PNG',
      });
    }

    try {
      const res = await fetch('/api/ai/ocr-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setExtractedData(data.data);
        setOcrEngineTag(data.model || 'Verified OCR Engine');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to process sample invoice document');
    } finally {
      setLoading(false);
    }
  };

  // Handle local user file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a PDF, PNG, or JPG invoice.');
      return;
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('File size exceeds 8MB limit. Please provide a compressed document.');
      return;
    }

    setErrorMessage(null);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const docType: 'PDF' | 'PNG' | 'JPG' = file.type === 'application/pdf' ? 'PDF' : 'PNG';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        type: docType,
        base64,
      });

      // Submit to backend
      setLoading(true);
      try {
        const res = await fetch('/api/ai/ocr-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            fileName: file.name,
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setExtractedData(data.data);
          setOcrEngineTag(data.model || 'Gemini Multimodal OCR');
        } else {
          setErrorMessage('Unable to extract text from document. Please review file readability.');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Server connection error during OCR extraction.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Transaction and Save Document to Vault
  const handleCreateAndVault = () => {
    if (!extractedData || !selectedFile) return;

    // 1. Add evidence document to vault first
    const newDoc = addEvidenceDocument({
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      vendor: extractedData.vendorName,
      invoiceNumber: extractedData.invoiceNumber,
      amount: extractedData.totalAmount,
      taxAmount: extractedData.taxAmount,
      gstin: extractedData.gstin,
      ocrExtracted: true,
      lineItems: extractedData.lineItems,
    });

    // 2. Add transaction to ledger linked to the new document
    addTransaction({
      vendor: extractedData.vendorName,
      amount: extractedData.totalAmount,
      description: `${extractedData.vendorName} Invoice #${extractedData.invoiceNumber}`,
      date: extractedData.invoiceDate,
      category: (extractedData.category as TransactionCategory) || 'Office Supplies',
      paymentMethod: (extractedData.paymentMethod as PaymentMethod) || 'NEFT/RTGS',
      type: 'Expense',
      status: 'Verified',
      invoiceNumber: extractedData.invoiceNumber,
      taxAmount: extractedData.taxAmount,
      gstin: extractedData.gstin,
      linkedEvidenceId: newDoc.id,
      hasEvidence: true,
      notes: `Extracted automatically via OCR from ${selectedFile.name}`,
    });

    setSuccessToast(`Successfully verified & vaulted ${selectedFile.name} as a linked transaction!`);
    setExtractedData(null);
    setSelectedFile(null);
    onRecordCreated();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Invoice OCR & Document Parsing
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Computer Vision
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload PDF tax invoices or receipt images. Automatically extract line items, amounts, and tax breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>GSTIN & Tax Compliance Guard</span>
        </div>
      </div>

      {/* Error or Success notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Zone & Preset Samples Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Dropzone (2 Cols) */}
        <div className="md:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Upload Document (PDF, PNG, JPG)
          </label>
          <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center transition-colors bg-slate-50/50 hover:bg-indigo-50/20 group">
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-white shadow-2xs text-indigo-600 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                Click to browse or drag and drop invoice here
              </div>
              <p className="text-[11px] text-slate-400">
                Supports GST Tax Invoices, scanned vendor slips, and PDF receipts up to 8MB
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Test Invoices (1 Col) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instant Test Samples</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              No files handy? Click any pre-loaded business invoice to run the OCR extraction pipeline immediately:
            </p>

            <div className="space-y-2">
              {sampleInvoices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s.id)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors text-xs space-y-0.5"
                >
                  <div className="font-semibold text-slate-900 truncate">
                    {s.vendor}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{s.fileName}</span>
                    <span className="font-mono font-medium">₹{s.amount.toLocaleString('en-IN')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Engine status: Pre-configured with automatic GST and tax parsing.
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            Running Document Vision & Extraction Pipeline...
          </h4>
          <p className="text-xs text-slate-500">
            Parsing document structure, reading vendor headers, extracting GSTIN and calculating item totals.
          </p>
        </div>
      )}

      {/* Extracted Document Split View */}
      {extractedData && selectedFile && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left: Rendered Document View (1 Col) */}
          <div className="p-6 rounded-xl bg-slate-900 text-white shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-semibold truncate max-w-[170px]">
                  {selectedFile.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-sm border border-emerald-800">
                SCANNED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Detected Vendor
                </span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {extractedData.vendorName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Invoice #</span>
                  <span className="font-mono text-slate-200">
                    {extractedData.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Invoice Date</span>
                  <span className="font-mono text-slate-200">
                    {extractedData.invoiceDate}
                  </span>
                </div>
              </div>

              {extractedData.gstin && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor GSTIN</span>
                  <span className="font-mono text-xs text-indigo-300">
                    {extractedData.gstin}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Total Extracted Amount
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                  ₹{extractedData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {extractedData.taxAmount && (
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Includes ₹{extractedData.taxAmount.toLocaleString('en-IN')} GST
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 font-mono">
              Engine: {ocrEngineTag}
            </div>
          </div>

          {/* Right: Editable Extracted Fields & Line Items (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Extracted Financial Data Review
                </h3>
                <p className="text-xs text-slate-500">
                  Verify or edit values before adding to the transaction ledger.
                </p>
              </div>

              <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                Ready for Staging
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={extractedData.vendorName}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, vendorName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={extractedData.invoiceNumber}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Amount (INR ₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={extractedData.totalAmount}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      totalAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax / GST Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={extractedData.taxAmount || 0}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      taxAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Line items review table */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Extracted Line Items ({extractedData.lineItems?.length || 0})
              </label>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedData.lineItems && extractedData.lineItems.length > 0 ? (
                      extractedData.lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-slate-400 text-center">
                          Single lump-sum line item extracted.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commit Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setExtractedData(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleCreateAndVault}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Link2 className="w-4 h-4" />
                <span>Create Transaction & Vault Evidence</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
