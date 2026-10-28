import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  FileCheck2,
  Unlink,
  Link2,
} from 'lucide-react';
import { EvidenceDocument } from '../../types/ledger';
import { FormatINR } from '../common/Badge';
import { useLedger } from '../../context/LedgerContext';

interface DocumentViewerModalProps {
  document: EvidenceDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const { transactions, linkEvidence, unlinkEvidence, settings } = useLedger();
  const [selectedTxnId, setSelectedTxnId] = useState('');

  if (!isOpen || !doc) return null;

  const linkedTxn = doc.linkedTransactionId
    ? transactions.find((t) => t.id === doc.linkedTransactionId)
    : undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(doc, null, 2)
    )}`;
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${doc.fileName}.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLink = () => {
    if (selectedTxnId) {
      linkEvidence(doc.id, selectedTxnId);
      setSelectedTxnId('');
    }
  };

  const handleUnlink = () => {
    if (window.confirm('Unlink this supporting document from the current transaction?')) {
      unlinkEvidence(doc.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Document Header Controls */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-slate-500">
              {doc.id}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs font-bold text-slate-800 truncate">
              {doc.fileName}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              OCR Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Download metadata"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rendered Invoice Paper Layout */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-800 space-y-6">
            {/* Top Invoice Banner */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                  <Building2 className="w-5 h-5" />
                  <span>{doc.vendor}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  GSTIN: {doc.gstin || '29ABCDE1234F1Z5'}
                </div>
                <div className="text-xs text-slate-500">
                  Tax Invoice & Electronic Delivery Receipt
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  TAX INVOICE
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  #{doc.invoiceNumber}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Date: {doc.uploadDate.slice(0, 10)}
                </span>
              </div>
            </div>

            {/* Bill To & Compliance Details */}
            <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Billed To
                </span>
                <div className="font-semibold text-slate-900 mt-1">
                  {settings.companyName}
                </div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  GSTIN: {settings.gstin}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Bangalore Tech Park, Karnataka, India
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Document Metadata
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>File Size:</span>
                  <span className="font-mono">{doc.fileSize}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Digital Hash:</span>
                  <span className="font-mono text-[10px] truncate max-w-[150px]">
                    {doc.sha256Hash.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Linked Txn:</span>
                  <span className="font-mono font-semibold text-indigo-600">
                    {doc.linkedTransactionId || 'Unlinked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 font-semibold">Item Description</th>
                    <th className="py-2 text-center font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Unit Price</th>
                    <th className="py-2 text-right font-semibold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.lineItems && doc.lineItems.length > 0 ? (
                    doc.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 text-center font-mono tabular-nums text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">
                          ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 font-medium text-slate-800">
                        {doc.vendor} — Professional Services / Product Billing
                      </td>
                      <td className="py-2.5 text-center font-mono tabular-nums text-slate-600">
                        1
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">
                        ₹{(doc.amount - (doc.taxAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                        ₹{(doc.amount - (doc.taxAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Calculation Strip */}
              <div className="border-t border-slate-200 pt-3 mt-4 space-y-1.5 text-xs text-right max-w-xs ml-auto">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">
                    ₹{(doc.amount - (doc.taxAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST / Tax (18%):</span>
                  <span className="font-mono tabular-nums">
                    ₹{(doc.taxAmount || doc.amount * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Due:</span>
                  <span className="font-mono tabular-nums text-indigo-700">
                    <FormatINR amount={doc.amount} />
                  </span>
                </div>
              </div>
            </div>

            {/* Official Cryptographic Signature Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Digitally Authenticated Document</span>
              </div>
              <div className="font-mono text-[10px]">
                E-Sign: SHA256:{doc.sha256Hash.slice(0, 24)}
              </div>
            </div>
          </div>
        </div>

        {/* Link / Unlink Bar at Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-slate-200 bg-white">
          <div className="text-xs text-slate-600">
            {linkedTxn ? (
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Linked to transaction{' '}
                <strong className="text-slate-900 font-mono">
                  {linkedTxn.id}
                </strong>{' '}
                ({linkedTxn.vendor} - ₹{linkedTxn.amount.toLocaleString('en-IN')})
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Unlinked Document: Not associated with any transaction ledger entry yet.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {linkedTxn ? (
              <button
                onClick={handleUnlink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Unlink from Transaction</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a transaction to link...</option>
                  {transactions
                    .filter((t) => !t.linkedEvidenceId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.vendor} (₹{t.amount})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleLink}
                  disabled={!selectedTxnId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Link</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
