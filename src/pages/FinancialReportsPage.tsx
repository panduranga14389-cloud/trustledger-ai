import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderLock,
  TrendingUp,
  TrendingDown,
  Scale,
  FileSpreadsheet,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { FormatINR } from '../components/common/Badge';

export const FinancialReportsPage: React.FC = () => {
  const {
    transactions,
    stats,
    activeDuplicatesCount,
    exportTransactionsCSV,
    exportSummaryReportCSV,
    settings,
  } = useLedger();

  const [timeRange, setTimeRange] = useState<'ALL' | 'OCT2026' | 'Q32026'>('ALL');

  // Filter transactions based on selected timeframe
  const filteredTxns = useMemo(() => {
    if (timeRange === 'OCT2026') {
      return transactions.filter((t) => t.date.startsWith('2026-10'));
    }
    if (timeRange === 'Q32026') {
      return transactions.filter(
        (t) =>
          t.date.startsWith('2026-07') ||
          t.date.startsWith('2026-08') ||
          t.date.startsWith('2026-09')
      );
    }
    return transactions;
  }, [transactions, timeRange]);

  // Compute metrics from the active filtered set
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let taxPaid = 0;
    const catMap: Record<string, number> = {};

    for (const t of filteredTxns) {
      if (t.type === 'Income') income += t.amount;
      else expense += t.amount;

      if (t.taxAmount) taxPaid += t.taxAmount;

      if (t.type === 'Expense') {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    }

    const net = income - expense;
    const verified = filteredTxns.filter((t) => t.status === 'Verified').length;
    const pending = filteredTxns.filter((t) => t.status === 'Pending').length;
    const withEvidence = filteredTxns.filter((t) => t.hasEvidence).length;

    return {
      income,
      expense,
      net,
      taxPaid,
      catMap,
      verified,
      pending,
      withEvidence,
      totalCount: filteredTxns.length,
      complianceRate: filteredTxns.length > 0 ? (verified / filteredTxns.length) * 100 : 0,
      evidenceRate: filteredTxns.length > 0 ? (withEvidence / filteredTxns.length) * 100 : 0,
    };
  }, [filteredTxns]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Financial Reporting & Analytics
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Live Aggregations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audited cash flow, category distributions, compliance health, and tax figures.
          </p>
        </div>

        {/* Timeframe & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTimeRange('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                timeRange === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('OCT2026')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                timeRange === 'OCT2026'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oct 2026
            </button>
            <button
              onClick={() => setTimeRange('Q32026')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                timeRange === 'Q32026'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Q3 2026
            </button>
          </div>

          <button
            onClick={() => exportTransactionsCSV(filteredTxns)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export View CSV</span>
          </button>
          <button
            onClick={exportSummaryReportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Summary Report CSV</span>
          </button>
        </div>
      </div>

      {/* Net Position Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflow */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Inflow (Income)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
            +<FormatINR amount={metrics.income} />
          </div>
          <p className="text-[11px] text-slate-400">
            From verified client invoices and receivables
          </p>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Outflow (Expenses)</span>
            <TrendingDown className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            -<FormatINR amount={metrics.expense} />
          </div>
          <p className="text-[11px] text-slate-400">
            Across {filteredTxns.filter((t) => t.type === 'Expense').length} recorded expenditure line items
          </p>
        </div>

        {/* Net Cash Position */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Operating Balance</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              metrics.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {metrics.net >= 0 ? '+' : ''}
            <FormatINR amount={metrics.net} />
          </div>
          <p className="text-[11px] text-slate-400">
            GST Paid on Purchases: ₹{metrics.taxPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Compliance & Audit Health Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Verification Gauge */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Verification Compliance</span>
            <span className="font-mono font-semibold text-emerald-700">
              {metrics.complianceRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${metrics.complianceRate}%` }}
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.verified} Verified</span>
            <span>{metrics.pending} Pending Review</span>
          </div>
        </div>

        {/* Evidence Attached Gauge */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Evidence Completeness</span>
            <span className="font-mono font-semibold text-indigo-600">
              {metrics.evidenceRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${metrics.evidenceRate}%` }}
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.withEvidence} Documents Linked</span>
            <span className="text-amber-600 font-medium">
              {metrics.totalCount - metrics.withEvidence} Missing
            </span>
          </div>
        </div>

        {/* Duplicate Risk Metric */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Duplicate Risk Exposure</span>
            <span
              className={`font-mono font-semibold ${
                activeDuplicatesCount > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {activeDuplicatesCount > 0 ? `${activeDuplicatesCount} Flagged` : '0 Alerts'}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, activeDuplicatesCount * 35)}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                activeDuplicatesCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="text-[11px] text-slate-500">
            {activeDuplicatesCount > 0
              ? 'Potential accidental double-entries staged for review'
              : 'Zero duplicate entries detected across current transactions'}
          </div>
        </div>
      </div>

      {/* Category Expenses Breakdown */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Category Cost Breakdown ({timeRange})
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated from live transaction entries
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(metrics.catMap).length > 0 ? (
            Object.entries(metrics.catMap)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = ((amt / (metrics.expense || 1)) * 100).toFixed(1);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        ₹{amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}{' '}
                        <span className="text-slate-400 font-normal">({pct}%)</span>
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
              })
          ) : (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No expense records recorded in this timeframe.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
