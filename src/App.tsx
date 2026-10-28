import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import { LedgerProvider, useLedger } from './context/LedgerContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { InvoiceOcrPage } from './pages/InvoiceOcrPage';
import { DuplicateDetectionPage } from './pages/DuplicateDetectionPage';
import { EvidenceVaultPage } from './pages/EvidenceVaultPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddEditTransactionModal } from './components/modals/AddEditTransactionModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { DocumentViewerModal } from './components/modals/DocumentViewerModal';
import { Transaction, EvidenceDocument } from './types/ledger';

const MainLayout: React.FC = () => {
  const { addTransaction, updateTransaction, deleteTransaction } = useLedger();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [inspectingTransaction, setInspectingTransaction] = useState<Transaction | null>(null);
  const [inspectingDocument, setInspectingDocument] = useState<EvidenceDocument | null>(null);

  // Handlers
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data);
    }
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddModal={handleOpenAdd}
          onSelectTab={setCurrentTab}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onSelectTab={setCurrentTab}
              onOpenAddModal={handleOpenAdd}
              onInspectTransaction={(txn) => setInspectingTransaction(txn)}
              onInspectEvidence={(doc) => setInspectingDocument(doc)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddModal={handleOpenAdd}
              onEditTransaction={handleEdit}
              onInspectTransaction={(txn) => setInspectingTransaction(txn)}
            />
          )}

          {currentTab === 'assistant' && (
            <AiAssistantPage
              onRecordCreated={() => setCurrentTab('transactions')}
            />
          )}

          {currentTab === 'ocr' && (
            <InvoiceOcrPage
              onRecordCreated={() => setCurrentTab('transactions')}
            />
          )}

          {currentTab === 'duplicates' && (
            <DuplicateDetectionPage
              onInspectTransaction={(txn) => setInspectingTransaction(txn)}
            />
          )}

          {currentTab === 'evidence' && (
            <EvidenceVaultPage
              onInspectDocument={(doc) => setInspectingDocument(doc)}
              onInspectTransaction={(txn) => setInspectingTransaction(txn)}
              onOpenOcr={() => setCurrentTab('ocr')}
            />
          )}

          {currentTab === 'reports' && <FinancialReportsPage />}

          {currentTab === 'audit' && <AuditTrailPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddEditTransactionModal
        isOpen={isAddModalOpen}
        initialData={editingTransaction}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        transaction={inspectingTransaction}
        isOpen={Boolean(inspectingTransaction)}
        onClose={() => setInspectingTransaction(null)}
        onEdit={(txn) => {
          setInspectingTransaction(null);
          handleEdit(txn);
        }}
        onDelete={(id) => {
          deleteTransaction(id);
          setInspectingTransaction(null);
        }}
        onViewEvidence={(doc) => {
          setInspectingTransaction(null);
          setInspectingDocument(doc);
        }}
      />

      {/* Evidence Document Viewer Modal */}
      <DocumentViewerModal
        document={inspectingDocument}
        isOpen={Boolean(inspectingDocument)}
        onClose={() => setInspectingDocument(null)}
      />
    </div>
  );
};


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <LanguageProvider>
      <LedgerProvider>
        {isLoggedIn ? (
          <MainLayout />
        ) : (
          <LoginPage onLogin={() => setIsLoggedIn(true)} />
        )}
      </LedgerProvider>
    </LanguageProvider>
  );
}
   
