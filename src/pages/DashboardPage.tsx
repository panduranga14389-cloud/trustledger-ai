import React, { useState } from 'react';
import {
  TrendingUp,
  ReceiptText,
  Clock,
  AlertTriangle,
  FolderLock,
  Plus,
  FileScan,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { FormatINR, StatusBadge } from '../components/common/Badge';
import { Transaction, EvidenceDocument } from '../types/ledger';
import { NavTab } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  onInspectTransaction: (txn: Transaction) => void;
  onInspectEvidence: (doc: EvidenceDocument) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectTab,
  onOpenAddModal,
  onInspectTransaction,
  onInspectEvidence,
}) => {
  const {
    transactions,
    evidenceDocs,
    stats,
    activeDuplicatesCount,
    verifyTransaction,
    exportTransactionsCSV,
    exportSummaryReportCSV,
    duplicatePairs,
  } = useLedger();

  const [activeChartMonth, setActiveChartMonth] = useState<string>('all');

  // Compute monthly activity for interactive bar chart
  const monthlyData = [
    { month: 'Aug 2026', short: 'Aug', income: 110000, expense: 78000 },
    { month: 'Sep 2026', short: 'Sep', income: 140000, expense: 92500 },
    { month: 'Oct 2026', short: 'Oct', income: stats.totalIncome, expense: stats.totalExpenses },
  ];

  // Top 5 recent transactions
  const recentTransactions = transactions.slice(0, 5);

  // Category breakdown for summary widget
  const categoryTotals = transactions.reduce<Record<string, number>>((acc, t) => {
    if (t.type === 'Expense') {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const highestExpense = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner & Quick Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Financial Integrity Console
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reconciliation, duplicate protection, and audit-ready document indexing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={() => onSelectTab('assistant')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Smart Entry</span>
          </button>
          <button
            onClick={() => onSelectTab('ocr')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileScan className="w-4 h-4 text-slate-500" />
            <span>Upload Invoice</span>
          </button>
          <button
            onClick={exportSummaryReportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            title="Download CSV financial summary"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Report CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ledger Value */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Ledger Outflow</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            <FormatINR amount={stats.totalExpenses} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              +<FormatINR amount={stats.totalIncome} /> Inflow
            </span>
            <span aria-hidden="true">·</span>
            <span>{stats.totalTransactions} records</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div
          onClick={() => onSelectTab('transactions')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Verification</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {stats.pendingCount}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-amber-700">
            <span>Awaiting compliance sign-off</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Potential Duplicates */}
        <div
          onClick={() => onSelectTab('duplicates')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-rose-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Duplicate Alerts</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {activeDuplicatesCount}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-rose-700">
            <span>Requires review to prevent double-pay</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Missing Evidence */}
        <div
          onClick={() => onSelectTab('evidence')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-indigo-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Evidence Vault</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FolderLock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {stats.documentsCount}{' '}
            <span className="text-xs font-normal text-slate-500">docs</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span className={stats.missingEvidenceCount > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600'}>
              {stats.missingEvidenceCount} txns missing receipts
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* AI Insights & Alerts Card */}
      <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>AI Ledger Integrity Advisory</span>
              <span className="text-[10px] font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded-sm border border-indigo-200">
                Active Guardian
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {activeDuplicatesCount > 0
                ? `Detected ${activeDuplicatesCount} high-probability duplicate transaction pairings (e.g. CloudScale Infrastructure ₹14,500). Please review and merge to maintain accurate ledger totals.`
                : 'All transactions currently verified with clean evidence lineage. 1 unlinked document is available in the vault for immediate matching.'}
            </p>
          </div>
        </div>

        {activeDuplicatesCount > 0 && (
          <button
            onClick={() => onSelectTab('duplicates')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
          >
            Review Duplicates Now
          </button>
        )}
      </div>

      {/* Main Grid: Interactive Financial Chart + Category Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Activity Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Inflow vs Outflow Trend
              </h3>
              <p className="text-xs text-slate-500">
                Audited cash flow and operational expenditure (INR ₹)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Inflow (Income)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                <span>Outflow (Expenses)</span>
              </div>
            </div>
          </div>

          {/* Responsive SVG Bar Visualization */}
          <div className="h-64 flex items-end justify-around gap-6 pt-6 pb-2 px-4 border-b border-slate-100">
            {monthlyData.map((item, idx) => {
              const maxVal = 180000;
              const incomeHeight = Math.max(12, Math.round((item.income / maxVal) * 200));
              const expenseHeight = Math.max(12, Math.round((item.expense / maxVal) * 200));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[11px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{item.expense.toLocaleString('en-IN')}
                  </div>
                  <div className="w-full max-w-[80px] flex items-end justify-center gap-2 h-48">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300 relative group/bar"
                      title={`Inflow: ₹${item.income.toLocaleString('en-IN')}`}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                        +₹{item.income.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expenseHeight}px` }}
                      className="w-1/2 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-all duration-300 relative group/bar"
                      title={`Outflow: ₹${item.expense.toLocaleString('en-IN')}`}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                        -₹{item.expense.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-2">
                    {item.short}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Illustrative historical data for Q3/Q4 2026</span>
            <button
              onClick={() => onSelectTab('reports')}
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Detailed Visual Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Category Expense Breakdown */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Expense by Category
              </h3>
              <p className="text-xs text-slate-500">
                Top operational cost drivers
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {sortedCategories.map(([catName, amt]) => {
                const pct = Math.round((amt / (stats.totalExpenses || 1)) * 100);
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">
                        {catName}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        ₹{amt.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Compliance Ratio</span>
            <span className="text-emerald-700 font-semibold font-mono">
              {Math.round((stats.verifiedCount / (stats.totalTransactions || 1)) * 100)}% Verified
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Evidence Vault Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-slate-500">
                Latest transactions recorded in October 2026
              </p>
            </div>
            <button
              onClick={() => onSelectTab('transactions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
            >
              <span>View All ({stats.totalTransactions})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">ID / Date</th>
                  <th className="py-2.5">Vendor & Description</th>
                  <th className="py-2.5 text-right">Amount (₹)</th>
                  <th className="py-2.5 text-center">Evidence</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 font-mono">
                      <span className="font-semibold text-slate-800 block">
                        {txn.id}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {txn.date}
                      </span>
                    </td>
                    <td className="py-3 max-w-[200px]">
                      <span className="font-semibold text-slate-900 block truncate">
                        {txn.vendor}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {txn.description}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      <span
                        className={
                          txn.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'
                        }
                      >
                        {txn.type === 'Income' ? '+' : ''}
                        <FormatINR amount={txn.amount} />
                      </span>
                    </td>
                    <td className="py-3 text-center">
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
                    <td className="py-3 text-center">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onInspectTransaction(txn)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evidence Vault Quick Access (1 Col) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Evidence Vault
              </h3>
              <p className="text-xs text-slate-500">
                Recent receipts & invoices
              </p>
            </div>
            <button
              onClick={() => onSelectTab('evidence')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Open Vault
            </button>
          </div>

          <div className="space-y-2.5">
            {evidenceDocs.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onInspectEvidence(doc)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {doc.fileName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{doc.vendor}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">₹{doc.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>

          <button
            onClick={() => onSelectTab('ocr')}
            className="w-full py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <FileScan className="w-3.5 h-3.5" />
            <span>Process New Invoice via OCR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
