export type TransactionStatus = 'Verified' | 'Pending' | 'Flagged';
export type TransactionType = 'Expense' | 'Income';

export type TransactionCategory =
  | 'Cloud Infrastructure'
  | 'Office Supplies'
  | 'Consulting & Legal'
  | 'Marketing & Ads'
  | 'Logistics & Travel'
  | 'Hardware & Equipment'
  | 'Utilities & Rent'
  | 'Software Subscriptions'
  | 'Client Invoicing'
  | 'Software Services';

export type PaymentMethod =
  | 'UPI'
  | 'NEFT/RTGS'
  | 'Corporate Card'
  | 'Net Banking'
  | 'Cash';

export interface Transaction {
  id: string; // e.g., 'TXN-2026-1042'
  description: string;
  vendor: string;
  amount: number; // in INR
  date: string; // YYYY-MM-DD
  category: TransactionCategory;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  status: TransactionStatus;
  invoiceNumber?: string;
  linkedEvidenceId?: string;
  hasEvidence: boolean;
  notes?: string;
  taxAmount?: number;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EvidenceDocument {
  id: string; // e.g., 'DOC-2026-081'
  fileName: string;
  fileType: 'PDF' | 'PNG' | 'JPG';
  fileSize: string;
  uploadDate: string;
  linkedTransactionId?: string;
  vendor: string;
  invoiceNumber: string;
  amount: number;
  taxAmount?: number;
  gstin?: string;
  ocrExtracted: boolean;
  sha256Hash: string;
  lineItems?: LineItem[];
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'VERIFY'
    | 'UNVERIFY'
    | 'LINK_EVIDENCE'
    | 'UNLINK_EVIDENCE'
    | 'MERGE_DUPLICATE'
    | 'DISMISS_DUPLICATE'
    | 'DELETE'
    | 'OCR_INGEST'
    | 'AI_PARSE';
  recordId: string;
  description: string;
  operator: string;
  category: 'Transaction' | 'Evidence' | 'Duplicate' | 'System';
}

export interface DuplicateMatchPair {
  id: string;
  primaryTransaction: Transaction;
  suspectedDuplicate: Transaction;
  matchScore: number; // 0 - 100 percentage
  reasons: string[];
  status: 'active' | 'dismissed' | 'merged';
  detectedAt: string;
}

export interface WorkspaceSettings {
  companyName: string;
  legalEntity: string;
  financialYear: string;
  gstin: string;
  currency: string;
  currencySymbol: string;
  duplicateAmountThresholdPercent: number;
  duplicateDateWindowDays: number;
  autoFlagMissingEvidence: boolean;
}
