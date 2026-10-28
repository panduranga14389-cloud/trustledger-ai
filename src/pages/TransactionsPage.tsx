import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Eye,
  CheckCircle,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { FormatINR, StatusBadge } from '../components/common/Badge';
import { Transaction, TransactionCategory, TransactionStatus } from '../types/ledger';

interface TransactionsPageProps {
  onOpenAddModal: () => void;
  onEditTransaction: (txn: Transaction) => void;
  onInspectTransaction: (txn: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onInspectTransaction,
}) => {
  const {
    transactions,
    verifyTransaction,
    unverifyTransaction,
    deleteTransaction,
    exportTransactionsCSV,
  } = useLedger();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<string>('ALL'); // 'ALL' | 'WITH' | 'WITHOUT'
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion confirmation state
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null);

  // Available categories
  const categories: TransactionCategory[] = [
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

  // Filtering and Sorting
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search term matching ID, vendor, description, category, or amount
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matches =
            t.id.toLowerCase().includes(query) ||
            t.vendor.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query) ||
            t.amount.toString().includes(query) ||
            (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(query));
          if (!matches) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
          return false;
        }

        // Evidence filter
        if (selectedEvidence === 'WITH' && !t.hasEvidence) return false;
        if (selectedEvidence === 'WITHOUT' && t.hasEvidence) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const comp = new Date(b.date).getTime() - new Date(a.date).getTime();
          return sortOrder === 'desc' ? comp : -comp;
        } else {
          const comp = b.amount - a.amount;
          return sortOrder === 'desc' ? comp : -comp;
        }
      });
  }, [
    transactions,
    searchTerm,
    selectedCategory,
    selectedStatus,
    selectedEvidence,
    sortBy,
    sortOrder,
  ]);

  const toggleSort = (type: 'date' | 'amount') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const handleConfirmDelete = () => {
    if (deletingTxn) {
      deleteTransaction(deletingTxn.id);
      setDeletingTxn(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified entries, compliance tracking, and CSV export capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsCSV(filteredTransactions)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            title="Export currently filtered view to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV ({filteredTransactions.length})</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, vendor, description, amount, or invoice #..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Flagged">Flagged Review</option>
            </select>
          </div>
        </div>

        {/* Evidence state & Sort chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Evidence Filter:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
              <button
                onClick={() => setSelectedEvidence('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                  selectedEvidence === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedEvidence('WITH')}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                  selectedEvidence === 'WITH'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                With Evidence
              </button>
              <button
                onClick={() => setSelectedEvidence('WITHOUT')}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                  selectedEvidence === 'WITHOUT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Missing Receipts
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              Showing {filteredTransactions.length} of {transactions.length} records
            </span>
            {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedEvidence !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setSelectedEvidence('ALL');
                }}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* High-Density Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">
                  <button
                    onClick={() => toggleSort('date')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>ID & Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Vendor & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">
                  <button
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                  >
                    <span>Amount (INR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-800 block">
                        {txn.id}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {txn.date}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-semibold text-slate-900 block truncate">
                        {txn.vendor}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {txn.description}
                      </span>
                      {txn.invoiceNumber && (
                        <span className="font-mono text-[10px] text-slate-400">
                          Inv: {txn.invoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700 block truncate max-w-[130px]">
                        {txn.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      <span
                        className={
                          txn.type === 'Income'
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }
                      >
                        {txn.type === 'Income' ? '+' : ''}
                        <FormatINR amount={txn.amount} />
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="truncate block max-w-[90px]">
                        {txn.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {txn.hasEvidence ? (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Attached
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onInspectTransaction(txn)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="View transaction details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            txn.status === 'Verified'
                              ? unverifyTransaction(txn.id)
                              : verifyTransaction(txn.id)
                          }
                          className={`p-1.5 rounded-md transition-colors ${
                            txn.status === 'Verified'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                          title={
                            txn.status === 'Verified'
                              ? 'Verified (Click to move to pending)'
                              : 'Click to mark verified'
                          }
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditTransaction(txn)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxn(txn)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-600">
                      No matching transactions found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or reset filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete record{' '}
              <strong className="font-mono text-slate-900">{deletingTxn.id}</strong>{' '}
              ({deletingTxn.vendor} - ₹{deletingTxn.amount.toLocaleString('en-IN')})?
              This action will be logged in the immutable audit trail.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTxn(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
