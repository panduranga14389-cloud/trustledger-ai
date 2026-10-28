import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  Transaction,
  TransactionCategory,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
} from '../../types/ledger';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Transaction | null;
}

const CATEGORIES: TransactionCategory[] = [
  'Cloud Infrastructure',
  'Office Supplies',
  'Consulting & Legal',
  'Marketing & Ads',
  'Logistics & Travel',
  'Hardware & Equipment',
  'Utilities & Rent',
  'Software Subscriptions',
  'Client Invoicing',
  'Software Services',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'NEFT/RTGS',
  'Corporate Card',
  'Net Banking',
  'Cash',
];

export const AddEditTransactionModal: React.FC<AddEditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-10-28');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Office Supplies');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [type, setType] = useState<TransactionType>('Expense');
  const [status, setStatus] = useState<TransactionStatus>('Pending');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setVendor(initialData.vendor);
      setAmount(initialData.amount.toString());
      setDate(initialData.date);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setPaymentMethod(initialData.paymentMethod);
      setType(initialData.type);
      setStatus(initialData.status);
      setInvoiceNumber(initialData.invoiceNumber || '');
      setTaxAmount(initialData.taxAmount ? initialData.taxAmount.toString() : '');
      setNotes(initialData.notes || '');
    } else {
      setVendor('');
      setAmount('');
      setDate('2026-10-28');
      setDescription('');
      setCategory('Office Supplies');
      setPaymentMethod('UPI');
      setType('Expense');
      setStatus('Pending');
      setInvoiceNumber('');
      setTaxAmount('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vendor.trim()) newErrors.vendor = 'Vendor name is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than ₹0';
    }
    if (!date) newErrors.date = 'Transaction date is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = parseFloat(amount);
    const parsedTax = taxAmount ? parseFloat(taxAmount) : undefined;

    onSubmit({
      vendor: vendor.trim(),
      amount: parsedAmount,
      date,
      description: description.trim(),
      category,
      paymentMethod,
      type,
      status,
      invoiceNumber: invoiceNumber.trim() || undefined,
      taxAmount: parsedTax,
      notes: notes.trim() || undefined,
      hasEvidence: initialData?.hasEvidence || false,
      linkedEvidenceId: initialData?.linkedEvidenceId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Record (${initialData?.id})` : 'New Financial Record'}
            </h3>
            <p className="text-xs text-slate-500">
              Enter verified transaction details into TrustLedger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type Segmented Tab */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Record Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  type === 'Expense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  type === 'Income'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (Inflow / Client Bill)
              </button>
            </div>
          </div>

          {/* Vendor & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Payee <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. AWS India, Delta Supplies"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  errors.vendor ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.vendor && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.vendor}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount in INR (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  className={`w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    errors.amount ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {errors.date && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly cloud compute cluster usage and backup"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                errors.description ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.description}</p>
            )}
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Pending">Pending Verification</option>
                <option value="Verified">Verified (Compliant)</option>
                <option value="Flagged">Flagged for Review</option>
              </select>
            </div>
          </div>

          {/* Optional: Invoice Number & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Reference # (Optional)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-8819"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Amount (GST ₹)
              </label>
              <input
                type="number"
                step="any"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="e.g. 450"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved under marketing budget allocation."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
