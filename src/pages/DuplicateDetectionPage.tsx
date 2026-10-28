import React, { useState } from 'react';
import {
  CopyCheck,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Info,
  Calendar,
  Building,
  CreditCard,
  Hash,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { DuplicateMatchPair, Transaction } from '../types/ledger';
import { FormatINR, StatusBadge } from '../components/common/Badge';
import { MergeRecordsModal } from '../components/modals/MergeRecordsModal';

export const DuplicateDetectionPage: React.FC<{
  onInspectTransaction: (txn: Transaction) => void;
}> = ({ onInspectTransaction }) => {
  const {
    duplicatePairs,
    dismissDuplicate,
    retainBothDuplicates,
    mergeDuplicates,
  } = useLedger();

  const [activeMergePair, setActiveMergePair] = useState<DuplicateMatchPair | null>(null);

  const activePairs = duplicatePairs.filter((p) => p.status === 'active');
  const dismissedPairs = duplicatePairs.filter((p) => p.status === 'dismissed');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Duplicate Record Review
            </h1>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                activePairs.length > 0
                  ? 'text-rose-700 bg-rose-50'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {activePairs.length} Active {activePairs.length === 1 ? 'Alert' : 'Alerts'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic fuzzy matching on amount, vendor similarity, date window, and invoice references.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Zero Auto-Deletion Policy</span>
        </div>
      </div>

      {/* Fraud Distinction Policy Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            Compliance Note: Duplicate Entry vs. Fraud
          </div>
          <p className="leading-relaxed">
            A duplicate record warning indicates a likely accidental double-entry (e.g. automatic corporate card statement feed + manual paper invoice entry, or recurring billing mis-entry). TrustLedger never automatically deletes financial transactions without explicit controller authorization.
          </p>
        </div>
      </div>

      {/* Active Alerts List */}
      {activePairs.length > 0 ? (
        <div className="space-y-6">
          {activePairs.map((pair) => {
            const t1 = pair.primaryTransaction;
            const t2 = pair.suspectedDuplicate;

            return (
              <div
                key={pair.id}
                className="p-6 rounded-xl bg-white border border-rose-200/90 shadow-2xs space-y-5"
              >
                {/* Header: Score & Reasons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Suspected Duplicate Detected
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100">
                          {pair.matchScore}% Confidence
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {pair.reasons.map((r, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span aria-hidden="true">·</span>}
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => dismissDuplicate(pair.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Dismiss alert without modifying records"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => retainBothDuplicates(pair.id)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
                      title="Mark both records as legitimate independent transactions"
                    >
                      Retain Both Records
                    </button>
                    <button
                      onClick={() => setActiveMergePair(pair)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Merge Records</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Record 1 */}
                  <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-700">
                        Master Record: {t1.id}
                      </span>
                      <StatusBadge status={t1.status} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 font-medium">{t1.vendor}</div>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        <FormatINR amount={t1.amount} />
                      </div>
                      <div className="text-xs text-slate-700">{t1.description}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Date
                        </span>
                        <span className="font-mono font-medium text-slate-800">{t1.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Payment Method
                        </span>
                        <span className="font-medium text-slate-800">{t1.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Invoice Ref
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {t1.invoiceNumber || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Supporting Evidence
                        </span>
                        <span className={t1.hasEvidence ? 'text-emerald-700 font-medium' : 'text-amber-600 font-medium'}>
                          {t1.hasEvidence ? 'Attached' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Record 2 */}
                  <div className="p-4 rounded-lg bg-rose-50/40 border border-rose-200/70 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-rose-700">
                        Suspected Duplicate: {t2.id}
                      </span>
                      <StatusBadge status={t2.status} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 font-medium">{t2.vendor}</div>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        <FormatINR amount={t2.amount} />
                      </div>
                      <div className="text-xs text-slate-700">{t2.description}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Date
                        </span>
                        <span className="font-mono font-medium text-slate-800">{t2.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Payment Method
                        </span>
                        <span className="font-medium text-slate-800">{t2.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Invoice Ref
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {t2.invoiceNumber || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Supporting Evidence
                        </span>
                        <span className={t2.hasEvidence ? 'text-emerald-700 font-medium' : 'text-amber-600 font-medium'}>
                          {t2.hasEvidence ? 'Attached' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Duplicate Conflicts Detected
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All transaction entries across vendors, invoice references, and date windows are unique and reconciled.
          </p>
        </div>
      )}

      {/* Dismissed / Previously Resolved Pairs */}
      {dismissedPairs.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Previously Resolved or Dismissed Alerts ({dismissedPairs.length})
          </h3>
          <div className="space-y-2 text-xs">
            {dismissedPairs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-600">{p.id}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-800 font-medium">
                    {p.primaryTransaction.vendor} (₹{p.primaryTransaction.amount.toLocaleString('en-IN')})
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Marked as Legitimate / Dismissed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Modal */}
      <MergeRecordsModal
        pair={activeMergePair}
        isOpen={Boolean(activeMergePair)}
        onClose={() => setActiveMergePair(null)}
        onConfirmMerge={mergeDuplicates}
      />
    </div>
  );
};
