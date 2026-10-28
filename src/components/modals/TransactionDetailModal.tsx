import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  CreditCard,
  Hash,
  FileCheck,
} from 'lucide-react';
import { Transaction, EvidenceDocument } from '../../types/ledger';
import { StatusBadge, FormatINR } from '../common/Badge';
import { useLedger } from '../../context/LedgerContext';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
  onViewEvidence: (doc: EvidenceDocument) => void;
  onOpenLinkModal?: (txnId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewEvidence,
}) => {
  const {
    evidenceDocs,
    auditLogs,
    verifyTransaction,
    unverifyTransaction,
    duplicatePairs,
  } = useLedger();

  if (!isOpen || !transaction) return null;

  const linkedDoc = transaction.linkedEvidenceId
    ? evidenceDocs.find((d) => d.id === transaction.linkedEvidenceId)
    : undefined;

  const activeDuplicateAlert = duplicatePairs.find(
    (p) =>
      p.status === 'active' &&
      (p.primaryTransaction.id === transaction.id ||
        p.suspectedDuplicate.id === transaction.id)
  );

  const matchedAuditLogs = auditLogs.filter(
    (l) => l.recordId === transaction.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-slate-500">
              {transaction.id}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <StatusBadge status={transaction.status} />
            {transaction.type === 'Income' ? (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                Income / Credit
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                Expense / Outflow
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Amount & Vendor Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {transaction.vendor}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                <FormatINR amount={transaction.amount} />
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {transaction.description}
              </p>
            </div>
            <div className="flex sm:flex-col items-end justify-between sm:justify-center text-xs text-slate-500 shrink-0">
              <span className="font-mono tabular-nums">{transaction.date}</span>
              <span className="font-medium text-slate-700 mt-1">
                {transaction.paymentMethod}
              </span>
            </div>
          </div>

          {/* Potential Duplicate Alert Banner if flagged */}
          {activeDuplicateAlert && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Potential Duplicate Match ({activeDuplicateAlert.matchScore}% Confidence)
                </span>
              </div>
              <p className="text-xs text-rose-700 pl-6">
                Matched against{' '}
                <span className="font-mono font-medium">
                  {activeDuplicateAlert.primaryTransaction.id === transaction.id
                    ? activeDuplicateAlert.suspectedDuplicate.id
                    : activeDuplicateAlert.primaryTransaction.id}
                </span>{' '}
                ({activeDuplicateAlert.reasons.join(', ')})
              </p>
            </div>
          )}

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Category</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {transaction.category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Invoice Reference</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block truncate">
                {transaction.invoiceNumber || 'None Specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tax / GST (INR)</span>
              <span className="font-mono tabular-nums font-medium text-slate-800 mt-0.5 block">
                {transaction.taxAmount ? `₹${transaction.taxAmount.toLocaleString('en-IN')}` : '₹0.00'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Evidence State</span>
              <span className={`font-semibold mt-0.5 block ${transaction.hasEvidence ? 'text-emerald-700' : 'text-amber-600'}`}>
                {transaction.hasEvidence ? 'Document Linked' : 'Missing Receipt'}
              </span>
            </div>
          </div>

          {/* Linked Evidence Document Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Supporting Evidence & Receipt
              </h4>
              {transaction.hasEvidence && linkedDoc && (
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <FileCheck className="w-3.5 h-3.5" />
                  Audit Verified
                </span>
              )}
            </div>

            {linkedDoc ? (
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {linkedDoc.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{linkedDoc.fileSize}</span>
                      <span aria-hidden="true">·</span>
                      <span>{linkedDoc.fileType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono truncate max-w-[120px]">
                        sha256:{linkedDoc.sha256Hash.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onViewEvidence(linkedDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-slate-200 rounded-md hover:bg-indigo-50 transition-colors shadow-2xs whitespace-nowrap shrink-0 ml-3"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Document</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>No Evidence Attached</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Financial records without supporting invoices may fail compliance audits.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Audit History for this transaction */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Record Audit History
            </h4>
            {matchedAuditLogs.length > 0 ? (
              <div className="space-y-2">
                {matchedAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between text-xs p-2.5 rounded-md bg-slate-50 border border-slate-100"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="font-medium text-slate-800">
                        {log.description}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Operator: {log.operator}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Initial record creation recorded.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete(transaction.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {transaction.status === 'Verified' ? (
              <button
                onClick={() => verifyTransaction(transaction.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Move to Pending</span>
              </button>
            ) : (
              <button
                onClick={() => verifyTransaction(transaction.id)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
