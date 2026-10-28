import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building,
  CheckCircle2,
  Cpu,
  Eye,
  RotateCcw,
  Lock,
  Server,
  FileCheck,
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToSampleData } = useLedger();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [legalEntity, setLegalEntity] = useState(settings.legalEntity);
  const [gstin, setGstin] = useState(settings.gstin);
  const [financialYear, setFinancialYear] = useState(settings.financialYear);
  const [amountThreshold, setAmountThreshold] = useState(
    settings.duplicateAmountThresholdPercent.toString()
  );
  const [dateWindow, setDateWindow] = useState(
    settings.duplicateDateWindowDays.toString()
  );

  const [serverStatus, setServerStatus] = useState<{
    status: string;
    hasGeminiKey: boolean;
    activeModel: string;
  } | null>(null);

  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch(() => {
        setServerStatus({
          status: 'online',
          hasGeminiKey: false,
          activeModel: 'gemini-3.8-flash',
        });
      });
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      legalEntity,
      gstin,
      financialYear,
      duplicateAmountThresholdPercent: parseFloat(amountThreshold) || 2,
      duplicateDateWindowDays: parseInt(dateWindow, 10) || 7,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Workspace & System Settings
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
              Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise parameters, GST compliance profiles, duplicate heuristic thresholds, and AI connection status.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Restore initial demo dataset? All transactions and documents will be re-initialized.')) {
              resetToSampleData();
              alert('Ledger re-initialized to default demo state.');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Restore Demo Ledger</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Workspace preferences updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Entity & Currency Details */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Entity Profile & Currency</span>
            </h3>
            <p className="text-xs text-slate-500">
              Company information displayed on verified reports and audit exports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Legal Entity Type
              </label>
              <input
                type="text"
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GSTIN / Tax Identification
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Active Financial Year
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value="Indian Rupee (INR — ₹)"
                className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Standard Tax / GST Rate
              </label>
              <input
                type="text"
                disabled
                value="18% GST (CGST 9% + SGST 9%)"
                className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Duplicate Detection Heuristics */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Duplicate Detection Heuristics</span>
            </h3>
            <p className="text-xs text-slate-500">
              Customize algorithmic sensitivity for flagging accidental double-entries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount Variance Window (%)
              </label>
              <input
                type="number"
                value={amountThreshold}
                onChange={(e) => setAmountThreshold(e.target.value)}
                min="0"
                max="10"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Matches transactions within this % amount variation (Default: 2%)
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date Proximity Window (Days)
              </label>
              <input
                type="number"
                value={dateWindow}
                onChange={(e) => setDateWindow(e.target.value)}
                min="1"
                max="30"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Flags duplicate entries within this number of days (Default: 7 days)
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Section 3: AI & OCR Pipeline Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Engine Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>AI Extraction Engine</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-semibold">
              READY
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Model Architecture:</span>
              <span className="font-mono font-medium text-slate-900">
                {serverStatus?.activeModel || 'gemini-3.8-flash'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gemini Server Key:</span>
              <span className="font-mono font-medium text-slate-900">
                {serverStatus?.hasGeminiKey ? 'Active (Connected)' : 'Fallback Rules Active'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Offline Rule Engine:</span>
              <span className="font-mono text-emerald-600">Deterministic v1.2</span>
            </div>
          </div>
        </div>

        {/* OCR Engine Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Document Vision OCR</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-semibold">
              READY
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Supported Formats:</span>
              <span className="font-mono text-slate-900">PDF, PNG, JPG (8MB)</span>
            </div>
            <div className="flex justify-between">
              <span>GSTIN Parser:</span>
              <span className="font-mono text-emerald-600">15-digit Pan-India</span>
            </div>
            <div className="flex justify-between">
              <span>Line-Item Deconstruction:</span>
              <span className="font-mono text-slate-900">Automated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Data Privacy & Security Assurance */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>Data Privacy & Zero-Retention Architecture</span>
        </div>
        <p className="leading-relaxed">
          TrustLedger AI enforces zero-retention data transmission. All uploaded documents, financial figures, and vendor information reside within the client application container and authenticated server routes. No customer financial ledger entries are ever sold or used for public AI training without explicit consent.
        </p>
      </div>
    </div>
  );
};
