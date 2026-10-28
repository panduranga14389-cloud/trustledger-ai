import React, { useState } from 'react';
import { X, GitMerge, AlertCircle, Check } from 'lucide-react';
import { Transaction, DuplicateMatchPair } from '../../types/ledger';
import { FormatINR } from '../common/Badge';

interface MergeRecordsModalProps {
  pair: DuplicateMatchPair | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmMerge: (
    alertId: string,
    primaryId: string,
    duplicateId: string,
    chosenValues: Partial<Transaction>
  ) => void;
}

export const MergeRecordsModal: React.FC<MergeRecordsModalProps> = ({
  pair,
  isOpen,
  onClose,
  onConfirmMerge,
}) => {
  if (!isOpen || !pair) return null;

  const t1 = pair.primaryTransaction;
  const t2 = pair.suspectedDuplicate;

  const [chosenVendor, setChosenVendor] = useState(t1.vendor);
  const [chosenDescription, setChosenDescription] = useState(t1.description);
  const [chosenAmount, setChosenAmount] = useState(t1.amount);
  const [chosenDate, setChosenDate] = useState(t1.date);
  const [chosenPaymentMethod, setChosenPaymentMethod] = useState(t1.paymentMethod);
  const [chosenCategory, setChosenCategory] = useState(t1.category);
  const [chosenInvoiceNumber, setChosenInvoiceNumber] = useState(
    t1.invoiceNumber || t2.invoiceNumber || ''
  );

  const handleMerge = () => {
    onConfirmMerge(pair.id, t1.id, t2.id, {
      vendor: chosenVendor,
      description: chosenDescription,
      amount: chosenAmount,
      date: chosenDate,
      paymentMethod: chosenPaymentMethod,
      category: chosenCategory,
      invoiceNumber: chosenInvoiceNumber || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Consolidate & Merge Records
              </h3>
              <p className="text-xs text-slate-500">
                Select which field values to retain in the consolidated ledger entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Safety Guarantee:</strong> Merging will preserve{' '}
              <span className="font-mono font-medium">{t1.id}</span> as the master
              record and retire <span className="font-mono font-medium">{t2.id}</span>.
              Any attached evidence documents will be re-linked automatically.
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Vendor Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Vendor / Entity Name
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChosenVendor(t1.vendor)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    chosenVendor === t1.vendor
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-mono text-[10px] text-slate-400">
                    From {t1.id}
                  </span>
                  <span className="font-semibold block mt-0.5">{t1.vendor}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChosenVendor(t2.vendor)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    chosenVendor === t2.vendor
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-mono text-[10px] text-slate-400">
                    From {t2.id}
                  </span>
                  <span className="font-semibold block mt-0.5">{t2.vendor}</span>
                </button>
              </div>
            </div>

            {/* Description Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChosenDescription(t1.description)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    chosenDescription === t1.description
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-mono text-[10px] text-slate-400">
                    From {t1.id}
                  </span>
                  <span className="block mt-0.5">{t1.description}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChosenDescription(t2.description)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    chosenDescription === t2.description
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-mono text-[10px] text-slate-400">
                    From {t2.id}
                  </span>
                  <span className="block mt-0.5">{t2.description}</span>
                </button>
              </div>
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Transaction Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChosenDate(t1.date)}
                    className={`p-2 rounded-lg border text-center font-mono transition-colors ${
                      chosenDate === t1.date
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t1.date}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenDate(t2.date)}
                    className={`p-2 rounded-lg border text-center font-mono transition-colors ${
                      chosenDate === t2.date
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t2.date}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChosenPaymentMethod(t1.paymentMethod)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      chosenPaymentMethod === t1.paymentMethod
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t1.paymentMethod}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenPaymentMethod(t2.paymentMethod)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      chosenPaymentMethod === t2.paymentMethod
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t2.paymentMethod}
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Ref */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Final Invoice Reference
              </label>
              <input
                type="text"
                value={chosenInvoiceNumber}
                onChange={(e) => setChosenInvoiceNumber(e.target.value)}
                placeholder="e.g. CSI-OCT-9901"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMerge}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Merge Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
