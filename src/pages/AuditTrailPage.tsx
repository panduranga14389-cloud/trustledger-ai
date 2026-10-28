import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  FileCheck,
  AlertTriangle,
  GitMerge,
  Trash2,
  Plus,
  Edit2,
  Link2,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { AuditLogEntry } from '../types/ledger';

export const AuditTrailPage: React.FC = () => {
  const { auditLogs } = useLedger();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          log.recordId.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.operator.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, categoryFilter, searchTerm]);

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
            CREATE
          </span>
        );
      case 'VERIFY':
        return (
          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
            VERIFY
          </span>
        );
      case 'UPDATE':
        return (
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
            UPDATE
          </span>
        );
      case 'LINK_EVIDENCE':
        return (
          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
            LINK EVIDENCE
          </span>
        );
      case 'UNLINK_EVIDENCE':
        return (
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
            UNLINK EVIDENCE
          </span>
        );
      case 'MERGE_DUPLICATE':
        return (
          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-sm">
            MERGE DUPLICATE
          </span>
        );
      case 'DISMISS_DUPLICATE':
        return (
          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm">
            DISMISS
          </span>
        );
      case 'DELETE':
        return (
          <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">
            DELETE
          </span>
        );
      case 'OCR_INGEST':
        return (
          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
            OCR INGEST
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit Trail & Activity Log
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Session Traceability
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological record of transaction creation, edits, verification approvals, duplicate merges, and deletions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <History className="w-4 h-4 text-indigo-600" />
          <span>{auditLogs.length} Total Events Logged</span>
        </div>
      </div>

      {/* Audit Log Integrity Disclosure */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <strong>Integrity Disclosure:</strong> This log captures all user-initiated modifications and automated engine actions within the current workspace storage. All events retain the operator email, affected record ID, and exact timestamp.
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({auditLogs.length})
            </button>
            <button
              onClick={() => setCategoryFilter('Transaction')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                categoryFilter === 'Transaction'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setCategoryFilter('Evidence')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                categoryFilter === 'Evidence'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evidence Docs
            </button>
            <button
              onClick={() => setCategoryFilter('Duplicate')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                categoryFilter === 'Duplicate'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duplicate Reviews
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, operator, action..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Chronological Event Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const d = new Date(log.timestamp);
              const formattedDate = d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{getActionBadge(log.action)}</div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded-xs border border-indigo-100">
                          {log.recordId}
                        </span>
                        <span className="text-slate-700 font-medium truncate">
                          {log.description}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Operator: {log.operator}</span>
                        <span aria-hidden="true">·</span>
                        <span>Scope: {log.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-600 block">{formattedDate}</span>
                    <span className="block">{formattedTime}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400">
              No audit log entries found matching filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
