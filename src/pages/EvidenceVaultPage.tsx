import React, { useState } from 'react';
import {
  FolderLock,
  UploadCloud,
  FileText,
  FileCheck2,
  Unlink,
  Link2,
  Trash2,
  Download,
  AlertTriangle,
  Eye,
  Plus,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { EvidenceDocument, Transaction } from '../types/ledger';
import { FormatINR } from '../components/common/Badge';

interface EvidenceVaultPageProps {
  onInspectDocument: (doc: EvidenceDocument) => void;
  onInspectTransaction: (txn: Transaction) => void;
  onOpenOcr: () => void;
}

export const EvidenceVaultPage: React.FC<EvidenceVaultPageProps> = ({
  onInspectDocument,
  onInspectTransaction,
  onOpenOcr,
}) => {
  const {
    evidenceDocs,
    transactions,
    addEvidenceDocument,
    deleteEvidenceDocument,
    linkEvidence,
    unlinkEvidence,
    stats,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<'ALL' | 'LINKED' | 'UNLINKED' | 'MISSING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [linkDocModal, setLinkDocModal] = useState<EvidenceDocument | null>(null);
  const [targetTxnId, setTargetTxnId] = useState('');

  // Transactions missing evidence
  const txnsMissingEvidence = transactions.filter((t) => !t.hasEvidence);

  // Filtered documents
  const filteredDocs = evidenceDocs.filter((doc) => {
    if (activeTab === 'LINKED' && !doc.linkedTransactionId) return false;
    if (activeTab === 'UNLINKED' && doc.linkedTransactionId) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        doc.fileName.toLowerCase().includes(q) ||
        doc.vendor.toLowerCase().includes(q) ||
        doc.invoiceNumber.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q) ||
        (doc.linkedTransactionId && doc.linkedTransactionId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleLinkSubmit = () => {
    if (linkDocModal && targetTxnId) {
      linkEvidence(linkDocModal.id, targetTxnId);
      setLinkDocModal(null);
      setTargetTxnId('');
    }
  };

  const handleDeleteDoc = (docId: string, name: string) => {
    if (window.confirm(`Delete evidence file "${name}" from the vault?`)) {
      deleteEvidenceDocument(docId);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Evidence & Document Vault
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Compliance Repository
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized storage for tax invoices, GST proofs, and electronic delivery slips with digital SHA-256 fingerprinting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOcr}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Storage Integrity Transparency Disclaimer */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Storage Disclosure:</strong> Documents and extracted line items are preserved in browser workspace storage with cryptographic hash verification. No unencrypted files are dispatched to third-party ad networks.
        </div>
      </div>

      {/* KPI Sub-strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Total Documents</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {evidenceDocs.length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Linked to Transactions</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
            {evidenceDocs.filter((d) => d.linkedTransactionId).length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Unlinked Documents</span>
          <span className="text-xl font-bold font-mono text-indigo-600 block mt-1">
            {stats.unlinkedDocsCount}
          </span>
        </div>
        <div
          onClick={() => setActiveTab('MISSING')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <span className="text-xs text-slate-500 font-medium block">Missing Evidence</span>
          <span className="text-xl font-bold font-mono text-amber-600 block mt-1">
            {stats.missingEvidenceCount} txns
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Documents ({evidenceDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('LINKED')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'LINKED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Linked ({evidenceDocs.filter((d) => d.linkedTransactionId).length})
            </button>
            <button
              onClick={() => setActiveTab('UNLINKED')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'UNLINKED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unlinked ({stats.unlinkedDocsCount})
            </button>
            <button
              onClick={() => setActiveTab('MISSING')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'MISSING'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions Missing Evidence ({stats.missingEvidenceCount})
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'MISSING' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search file name, vendor, hash..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* View 1: Documents Grid / Table */}
      {activeTab !== 'MISSING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Document / File</th>
                  <th className="py-3 px-4">Vendor & Invoice #</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Linked Transaction</th>
                  <th className="py-3 px-4 text-center">Cryptographic Hash</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate max-w-xs">
                              {doc.fileName}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {doc.id} · {doc.fileSize} · {doc.fileType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                          {doc.vendor}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 block">
                          #{doc.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        <FormatINR amount={doc.amount} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {doc.linkedTransactionId ? (
                          <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                            {doc.linkedTransactionId}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                            Unlinked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400">
                        sha256:{doc.sha256Hash.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onInspectDocument(doc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View document paper preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {doc.linkedTransactionId ? (
                            <button
                              onClick={() => unlinkEvidence(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Unlink from transaction"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setLinkDocModal(doc)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Link to a transaction"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Remove document from vault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No documents found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Transactions Missing Evidence Warning View */}
      {activeTab === 'MISSING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Transactions Without Supporting Evidence ({txnsMissingEvidence.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Auditors require supporting tax invoices or receipts for these entries.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txnsMissingEvidence.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {txn.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{txn.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{txn.vendor}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {txn.description}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      <FormatINR amount={txn.amount} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onInspectTransaction(txn)}
                        className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Inspect & Attach
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Link to Transaction Modal */}
      {linkDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Link Evidence to Ledger Entry
            </h3>
            <p className="text-xs text-slate-600">
              Choose the transaction to associate with{' '}
              <strong className="text-slate-900">{linkDocModal.fileName}</strong>:
            </p>

            <select
              value={targetTxnId}
              onChange={(e) => setTargetTxnId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Choose a transaction...</option>
              {transactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.vendor} (₹{t.amount.toLocaleString('en-IN')})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLinkDocModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!targetTxnId}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                Link Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
