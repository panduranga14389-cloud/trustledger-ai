import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  FileScan,
  CopyCheck,
  FolderLock,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useLedger } from '../../context/LedgerContext';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'assistant'
  | 'ocr'
  | 'duplicates'
  | 'evidence'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
}) => {
  const { activeDuplicatesCount, stats, resetToSampleData } = useLedger();

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} pending` : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      badge: 'Smart NLP',
      badgeColor: 'text-indigo-700 bg-indigo-50',
    },
    {
      id: 'ocr',
      label: 'Invoice OCR',
      icon: FileScan,
    },
    {
      id: 'duplicates',
      label: 'Duplicate Review',
      icon: CopyCheck,
      badge: activeDuplicatesCount > 0 ? `${activeDuplicatesCount} alerts` : undefined,
      badgeColor: 'text-rose-700 bg-rose-50',
    },
    {
      id: 'evidence',
      label: 'Evidence Vault',
      icon: FolderLock,
      badge: stats.missingEvidenceCount > 0 ? `${stats.missingEvidenceCount} missing` : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: BarChart3,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">
              TrustLedger AI
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Smart Financial Records
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm ${item.badgeColor || 'text-slate-500 bg-slate-100'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Reset & User */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <button
            onClick={() => {
              if (window.confirm('Reset all transactions, evidence, and alerts to initial demo dataset?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-3 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-white rounded-md border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
              P
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">
                Panduranga
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Finance Controller
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
