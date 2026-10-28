
import React from 'react';
import { Menu, Plus, FileUp, Download, Languages } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useLedger } from '../../context/LedgerContext';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
  onSelectTab: (tab: NavTab) => void;
}

const TAB_TITLES: Record<NavTab, { title: string; category: string }> = {
  dashboard: { title: 'Financial Overview', category: 'Dashboard' },
  transactions: { title: 'Transaction Ledger', category: 'Records' },
  assistant: { title: 'AI Transaction Assistant', category: 'Automation' },
  ocr: { title: 'Invoice OCR & Extraction', category: 'Documents' },
  duplicates: { title: 'Duplicate Record Review', category: 'Integrity' },
  evidence: { title: 'Evidence Vault', category: 'Compliance' },
  reports: { title: 'Financial Analytics & Reports', category: 'Intelligence' },
  audit: { title: 'System Audit Trail', category: 'Security' },
  settings: { title: 'Workspace Settings', category: 'Configuration' },
};

const TAB_TRANSLATION_KEYS: Record<NavTab, 'overview' | 'transactions' | 'assistant' | 'ocr' | 'duplicates' | 'evidence' | 'reports' | 'audit' | 'settings'> = {
  dashboard: 'overview',
  transactions: 'transactions',
  assistant: 'assistant',
  ocr: 'ocr',
  duplicates: 'duplicates',
  evidence: 'evidence',
  reports: 'reports',
  audit: 'audit',
  settings: 'settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddModal,
  onSelectTab,
}) => {
  const { settings, exportTransactionsCSV } = useLedger();
  const { language, setLanguage, t } = useLanguage();

  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Dashboard',
    category: 'Overview',
  };

  const categoryKey: Record<NavTab, 'dashboard' | 'transactions' | 'assistant' | 'ocr' | 'duplicates' | 'evidence' | 'reports' | 'audit' | 'settings'> = {
    dashboard: 'dashboard',
    transactions: 'transactions',
    assistant: 'assistant',
    ocr: 'ocr',
    duplicates: 'duplicates',
    evidence: 'evidence',
    reports: 'reports',
    audit: 'audit',
    settings: 'settings',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 bg-white border-b border-slate-200">
      {/* Mobile menu and page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1 text-slate-500 rounded-lg hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
          <span className="font-medium text-slate-400">
            {t(categoryKey[currentTab] || 'dashboard')}
          </span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-900 truncate">
            {t(TAB_TRANSLATION_KEYS[currentTab] || 'overview')}
          </span>
        </div>
      </div>

      {/* Workspace details */}
      <div className="hidden xl:flex items-center gap-3 text-xs text-slate-500 font-medium">
        <span>{settings.companyName}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono">
          {settings.currency} (₹)
        </span>
        <span aria-hidden="true">·</span>
        <span>{settings.financialYear}</span>
      </div>

      {/* Language and action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
          <Languages className="w-4 h-4 text-indigo-600" />

          <select
            aria-label="Select language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as 'en' | 'kn' | 'hi')
            }
            className="max-w-24 bg-transparent text-xs font-medium text-slate-700 outline-none"
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>

        <button
          onClick={() => exportTransactionsCSV()}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          title="Export records to CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('exportCSV')}</span>
        </button>

        <button
          onClick={() => onSelectTab('ocr')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <FileUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t('ocrScan')}</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addTransaction')}</span>
        </button>
      </div>
    </header>
  );
};
