
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import {
  doc as firestoreDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';

import {
  Transaction,
  EvidenceDocument,
  AuditLogEntry,
  DuplicateMatchPair,
  WorkspaceSettings,
} from '../types/ledger';

import { INITIAL_SETTINGS } from '../data/initialData';

interface LedgerContextType {
  transactions: Transaction[];
  evidenceDocs: EvidenceDocument[];
  auditLogs: AuditLogEntry[];
  settings: WorkspaceSettings;
  duplicatePairs: DuplicateMatchPair[];
  activeDuplicatesCount: number;
  stats: {
    totalLedgerValue: number;
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    pendingCount: number;
    verifiedCount: number;
    flaggedCount: number;
    missingEvidenceCount: number;
    documentsCount: number;
    unlinkedDocsCount: number;
  };
  addTransaction: (
    txn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  verifyTransaction: (id: string) => void;
  unverifyTransaction: (id: string) => void;
  addEvidenceDocument: (
    doc: Omit<EvidenceDocument, 'id' | 'uploadDate' | 'sha256Hash'>
  ) => EvidenceDocument;
  deleteEvidenceDocument: (id: string) => void;
  linkEvidence: (docId: string, txnId: string) => void;
  unlinkEvidence: (docId: string) => void;
  dismissDuplicate: (alertId: string) => void;
  retainBothDuplicates: (alertId: string) => void;
  mergeDuplicates: (
    alertId: string,
    primaryId: string,
    duplicateId: string,
    keptValues: Partial<Transaction>
  ) => void;
  exportTransactionsCSV: (txnsToExport?: Transaction[]) => void;
  exportSummaryReportCSV: () => void;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
  resetToSampleData: () => void;
  currentOperator: string;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

const emptySettings = (): WorkspaceSettings => ({ ...INITIAL_SETTINGS });

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  // Track which user's cloud data has finished loading.
  // This prevents one user's state being saved into another user's document.
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<EvidenceDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(emptySettings);
  const [dismissedPairIds, setDismissedPairIds] = useState<string[]>([]);

  const currentOperator = user?.email ?? 'Unknown User';

  // Listen for sign-in and sign-out.
  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setLoadedUid(null);
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  // Load the current user's ledger from Firestore.
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const loadLedger = async () => {
      setLoadedUid(null);

      if (!user) {
        setTransactions([]);
        setEvidenceDocs([]);
        setAuditLogs([]);
        setSettings(emptySettings());
        setDismissedPairIds([]);
        return;
      }

      try {
        const ledgerRef = firestoreDoc(
          db,
          'users',
          user.uid,
          'ledger',
          'main'
        );

        const snapshot = await getDoc(ledgerRef);

        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          setTransactions(data.transactions ?? []);
          setEvidenceDocs(data.evidenceDocs ?? []);
          setAuditLogs(data.auditLogs ?? []);
          setSettings(data.settings ?? emptySettings());
          setDismissedPairIds(data.dismissedPairIds ?? []);
        } else {
          setTransactions([]);
          setEvidenceDocs([]);
          setAuditLogs([]);
          setSettings(emptySettings());
          setDismissedPairIds([]);
        }

        // Enable saving only after this user's data has loaded successfully.
        setLoadedUid(user.uid);
      } catch (error) {
        console.error('Failed to load ledger from Firestore:', error);
      }
    };

    void loadLedger();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, authReady]);

  // Save the ledger to the signed-in user's own Firestore document.
  useEffect(() => {
    if (!authReady || !user || loadedUid !== user.uid) return;

    const saveLedger = async () => {
      try {
        const ledgerRef = firestoreDoc(
          db,
          'users',
          user.uid,
          'ledger',
          'main'
        );

        await setDoc(ledgerRef, {
          transactions,
          evidenceDocs,
          auditLogs,
          settings,
          dismissedPairIds,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to save ledger to Firestore:', error);
      }
    };

    void saveLedger();
  }, [
    user?.uid,
    authReady,
    loadedUid,
    transactions,
    evidenceDocs,
    auditLogs,
    settings,
    dismissedPairIds,
  ]);

  const logAudit = useCallback(
    (
      action: AuditLogEntry['action'],
      recordId: string,
      description: string,
      category: AuditLogEntry['category'] = 'Transaction'
    ) => {
      const entry: AuditLogEntry = {
        id: createId('AUD'),
        timestamp: new Date().toISOString(),
        action,
        recordId,
        description,
        operator: user?.email ?? 'Unknown User',
        category,
      };

      setAuditLogs((prev) => [entry, ...prev]);
    },
    [user?.email]
  );

  // Detect likely duplicate transactions.
  const duplicatePairs = useMemo<DuplicateMatchPair[]>(() => {
    const pairs: DuplicateMatchPair[] = [];

    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const t1 = transactions[i];
        const t2 = transactions[j];

        if (t1.type !== t2.type) continue;

        let score = 0;
        const reasons: string[] = [];

        const amountDifference = Math.abs(t1.amount - t2.amount);
        const maxAmount = Math.max(t1.amount, t2.amount);
        const variance =
          maxAmount > 0 ? (amountDifference / maxAmount) * 100 : 0;

        if (amountDifference === 0) {
          score += 40;
          reasons.push(
            `Exact amount match (₹${t1.amount.toLocaleString('en-IN')})`
          );
        } else if (variance <= settings.duplicateAmountThresholdPercent) {
          score += 25;
          reasons.push(`Amount within ${variance.toFixed(1)}% variance`);
        }

        const vendor1 = t1.vendor.trim().toLowerCase();
        const vendor2 = t2.vendor.trim().toLowerCase();

        if (vendor1 && vendor1 === vendor2) {
          score += 30;
          reasons.push(`Identical vendor: "${t1.vendor}"`);
        } else if (
          vendor1 &&
          vendor2 &&
          (vendor1.includes(vendor2) || vendor2.includes(vendor1))
        ) {
          score += 20;
          reasons.push(
            `Close vendor similarity ("${t1.vendor}" vs "${t2.vendor}")`
          );
        }

        const date1 = new Date(t1.date).getTime();
        const date2 = new Date(t2.date).getTime();
        const daysApart = Math.abs(date1 - date2) / 86400000;

        if (
          Number.isFinite(daysApart) &&
          daysApart <= settings.duplicateDateWindowDays
        ) {
          if (daysApart === 0) {
            score += 15;
            reasons.push('Recorded on the exact same date');
          } else {
            score += Math.max(5, 15 - Math.floor(daysApart) * 2);
            reasons.push(`Recorded within ${Math.ceil(daysApart)} days`);
          }
        }

        if (
          t1.invoiceNumber &&
          t2.invoiceNumber &&
          t1.invoiceNumber.trim().toLowerCase() ===
            t2.invoiceNumber.trim().toLowerCase()
        ) {
          score += 15;
          reasons.push(`Identical invoice number "${t1.invoiceNumber}"`);
        }

        if (
          t1.description.trim().toLowerCase() ===
          t2.description.trim().toLowerCase()
        ) {
          score += 10;
          reasons.push('Identical transaction description');
        }

        if (score >= 50) {
          const pairId = [t1.id, t2.id].sort().join('_');

          pairs.push({
            id: pairId,
            primaryTransaction: t1.createdAt < t2.createdAt ? t1 : t2,
            suspectedDuplicate: t1.createdAt < t2.createdAt ? t2 : t1,
            matchScore: Math.min(100, score),
            reasons,
            status: dismissedPairIds.includes(pairId) ? 'dismissed' : 'active',
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    return pairs;
  }, [
    transactions,
    settings.duplicateAmountThresholdPercent,
    settings.duplicateDateWindowDays,
    dismissedPairIds,
  ]);

  const activeDuplicatesCount = useMemo(
    () => duplicatePairs.filter((pair) => pair.status === 'active').length,
    [duplicatePairs]
  );

  const stats = useMemo(() => {
    let totalLedgerValue = 0;
    let totalIncome = 0;
    let totalExpenses = 0;
    let pendingCount = 0;
    let verifiedCount = 0;
    let flaggedCount = 0;
    let missingEvidenceCount = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'Income') totalIncome += transaction.amount;
      else totalExpenses += transaction.amount;

      totalLedgerValue += transaction.amount;

      if (transaction.status === 'Pending') pendingCount++;
      else if (transaction.status === 'Verified') verifiedCount++;
      else if (transaction.status === 'Flagged') flaggedCount++;

      if (!transaction.hasEvidence) missingEvidenceCount++;
    }

    return {
      totalLedgerValue,
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      pendingCount,
      verifiedCount,
      flaggedCount,
      missingEvidenceCount,
      documentsCount: evidenceDocs.length,
      unlinkedDocsCount: evidenceDocs.filter(
        (document) => !document.linkedTransactionId
      ).length,
    };
  }, [transactions, evidenceDocs]);

  const addTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();

      const transaction: Transaction = {
        ...data,
        id: createId('TXN'),
        createdAt: now,
        updatedAt: now,
        hasEvidence: Boolean(data.linkedEvidenceId),
      };

      setTransactions((prev) => [transaction, ...prev]);

      logAudit(
        'CREATE',
        transaction.id,
        `Added transaction ${transaction.id} for ₹${data.amount.toLocaleString('en-IN')} to ${data.vendor} (${data.category})`
      );

      return transaction;
    },
    [logAudit]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                ...updates,
                updatedAt: new Date().toISOString(),
                hasEvidence:
                  updates.linkedEvidenceId !== undefined
                    ? Boolean(updates.linkedEvidenceId)
                    : transaction.hasEvidence,
              }
            : transaction
        )
      );

      logAudit('UPDATE', id, `Updated record details for ${id}`);
    },
    [logAudit]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const existing = transactions.find((transaction) => transaction.id === id);
      if (!existing) return;

      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id)
      );

      setEvidenceDocs((prev) =>
        prev.map((document) =>
          document.linkedTransactionId === id
            ? { ...document, linkedTransactionId: undefined }
            : document
        )
      );

      logAudit(
        'DELETE',
        id,
        `Deleted transaction ${id} (${existing.vendor} - ₹${existing.amount.toLocaleString('en-IN')})`
      );
    },
    [transactions, logAudit]
  );

  const verifyTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                status: 'Verified',
                updatedAt: new Date().toISOString(),
              }
            : transaction
        )
      );

      logAudit('VERIFY', id, `Transaction ${id} marked as Verified`);
    },
    [logAudit]
  );

  const unverifyTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                status: 'Pending',
                updatedAt: new Date().toISOString(),
              }
            : transaction
        )
      );

      logAudit('UNVERIFY', id, `Transaction ${id} returned to Pending verification`);
    },
    [logAudit]
  );

  const addEvidenceDocument = useCallback(
    (
      data: Omit<EvidenceDocument, 'id' | 'uploadDate' | 'sha256Hash'>
    ) => {
      const now = new Date().toISOString();

      // Placeholder only; replace with a real SHA-256 calculation for integrity checks.
      const hash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const document: EvidenceDocument = {
        ...data,
        id: createId('DOC'),
        uploadDate: now,
        sha256Hash: hash,
      };

      setEvidenceDocs((prev) => [document, ...prev]);

      if (data.linkedTransactionId) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === data.linkedTransactionId
              ? {
                  ...transaction,
                  linkedEvidenceId: document.id,
                  hasEvidence: true,
                  updatedAt: now,
                }
              : transaction
          )
        );
      }

      logAudit(
        'LINK_EVIDENCE',
        document.id,
        `Uploaded document ${document.fileName}${
          data.linkedTransactionId
            ? ` and linked to ${data.linkedTransactionId}`
            : ''
        }`,
        'Evidence'
      );

      return document;
    },
    [logAudit]
  );

  const deleteEvidenceDocument = useCallback(
    (docId: string) => {
      const existing = evidenceDocs.find((document) => document.id === docId);
      if (!existing) return;

      setEvidenceDocs((prev) =>
        prev.filter((document) => document.id !== docId)
      );

      if (existing.linkedTransactionId) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === existing.linkedTransactionId
              ? {
                  ...transaction,
                  linkedEvidenceId: undefined,
                  hasEvidence: false,
                  updatedAt: new Date().toISOString(),
                }
              : transaction
          )
        );
      }

      logAudit(
        'UNLINK_EVIDENCE',
        docId,
        `Removed evidence document ${existing.fileName} from vault`,
        'Evidence'
      );
    },
    [evidenceDocs, logAudit]
  );

  const linkEvidence = useCallback(
    (docId: string, txnId: string) => {
      setEvidenceDocs((prev) =>
        prev.map((document) =>
          document.id === docId
            ? { ...document, linkedTransactionId: txnId }
            : document
        )
      );

      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === txnId
            ? {
                ...transaction,
                linkedEvidenceId: docId,
                hasEvidence: true,
                updatedAt: new Date().toISOString(),
              }
            : transaction
        )
      );

      logAudit(
        'LINK_EVIDENCE',
        txnId,
        `Linked document ${docId} to transaction ${txnId}`,
        'Evidence'
      );
    },
    [logAudit]
  );

  const unlinkEvidence = useCallback(
    (docId: string) => {
      const existing = evidenceDocs.find((document) => document.id === docId);
      const txnId = existing?.linkedTransactionId;

      setEvidenceDocs((prev) =>
        prev.map((document) =>
          document.id === docId
            ? { ...document, linkedTransactionId: undefined }
            : document
        )
      );

      if (txnId) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === txnId
              ? {
                  ...transaction,
                  linkedEvidenceId: undefined,
                  hasEvidence: false,
                  updatedAt: new Date().toISOString(),
                }
              : transaction
          )
        );

        logAudit(
          'UNLINK_EVIDENCE',
          txnId,
          `Unlinked document ${docId} from transaction ${txnId}`,
          'Evidence'
        );
      }
    },
    [evidenceDocs, logAudit]
  );

  const dismissDuplicate = useCallback(
    (alertId: string) => {
      setDismissedPairIds((prev) =>
        prev.includes(alertId) ? prev : [...prev, alertId]
      );

      logAudit(
        'DISMISS_DUPLICATE',
        alertId,
        `Dismissed duplicate alert pair ${alertId}`,
        'Duplicate'
      );
    },
    [logAudit]
  );

  const retainBothDuplicates = useCallback(
    (alertId: string) => {
      setDismissedPairIds((prev) =>
        prev.includes(alertId) ? prev : [...prev, alertId]
      );

      const ids = alertId.split('_');

      setTransactions((prev) =>
        prev.map((transaction) =>
          ids.includes(transaction.id)
            ? {
                ...transaction,
                status:
                  transaction.status === 'Flagged'
                    ? 'Verified'
                    : transaction.status,
              }
            : transaction
        )
      );

      logAudit(
        'DISMISS_DUPLICATE',
        alertId,
        'Marked both transactions as legitimate independent records',
        'Duplicate'
      );
    },
    [logAudit]
  );

  const mergeDuplicates = useCallback(
    (
      alertId: string,
      primaryId: string,
      duplicateId: string,
      keptValues: Partial<Transaction>
    ) => {
      setTransactions((prev) =>
        prev
          .map((transaction) =>
            transaction.id === primaryId
              ? {
                  ...transaction,
                  ...keptValues,
                  status: 'Verified' as const,
                  updatedAt: new Date().toISOString(),
                  notes: `${transaction.notes || ''} [Merged duplicate ${duplicateId} on ${new Date().toLocaleDateString()}]`.trim(),
                }
              : transaction
          )
          .filter((transaction) => transaction.id !== duplicateId)
      );

      setEvidenceDocs((prev) =>
        prev.map((document) =>
          document.linkedTransactionId === duplicateId
            ? { ...document, linkedTransactionId: primaryId }
            : document
        )
      );

      setDismissedPairIds((prev) =>
        prev.includes(alertId) ? prev : [...prev, alertId]
      );

      logAudit(
        'MERGE_DUPLICATE',
        primaryId,
        `Merged duplicate record ${duplicateId} into primary transaction ${primaryId}. Retained audit history.`,
        'Duplicate'
      );
    },
    [logAudit]
  );

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportTransactionsCSV = useCallback(
    (txnsToExport?: Transaction[]) => {
      const list = txnsToExport ?? transactions;

      const headers = [
        'Transaction ID',
        'Date',
        'Vendor / Payee',
        'Description',
        'Category',
        'Type',
        'Amount (INR)',
        'Tax Amount (INR)',
        'Payment Method',
        'Status',
        'Invoice Number',
        'Linked Evidence ID',
        'Has Evidence',
        'Notes',
      ];

      const escapeCsv = (value: unknown) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`;

      const rows = list.map((transaction) =>
        [
          transaction.id,
          transaction.date,
          transaction.vendor,
          transaction.description,
          transaction.category,
          transaction.type,
          transaction.amount,
          transaction.taxAmount || 0,
          transaction.paymentMethod,
          transaction.status,
          transaction.invoiceNumber || '',
          transaction.linkedEvidenceId || '',
          transaction.hasEvidence ? 'Yes' : 'No',
          transaction.notes || '',
        ]
          .map(escapeCsv)
          .join(',')
      );

      downloadCSV(
        `TrustLedger_Transactions_${new Date().toISOString().slice(0, 10)}.csv`,
        [headers.join(','), ...rows].join('\r\n')
      );

      logAudit(
        'CREATE',
        'EXPORT',
        `Exported ${list.length} transaction records to CSV`,
        'System'
      );
    },
    [transactions, logAudit]
  );

  const exportSummaryReportCSV = useCallback(() => {
    const categories: Record<string, { count: number; total: number }> = {};
    let totalExpenses = 0;
    let totalIncome = 0;

    for (const transaction of transactions) {
      categories[transaction.category] ??= { count: 0, total: 0 };
      categories[transaction.category].count++;
      categories[transaction.category].total += transaction.amount;

      if (transaction.type === 'Income') totalIncome += transaction.amount;
      else totalExpenses += transaction.amount;
    }

    const lines = [
      'TRUSTLEDGER AI - FINANCIAL REPORT SUMMARY',
      `Generated On,"${new Date().toLocaleString()}"`,
      `Company,"${settings.companyName}"`,
      `Financial Year,"${settings.financialYear}"`,
      `GSTIN,"${settings.gstin}"`,
      '',
      'KEY METRICS',
      `Total Transactions,${transactions.length}`,
      `Total Inflow (INR),${totalIncome}`,
      `Total Outflow (INR),${totalExpenses}`,
      `Net Ledger Balance (INR),${totalIncome - totalExpenses}`,
      `Evidence Completeness,${(
        (transactions.filter((t) => t.hasEvidence).length /
          (transactions.length || 1)) *
        100
      ).toFixed(1)}%`,
      `Active Duplicate Alerts,${activeDuplicatesCount}`,
      '',
      'CATEGORY WISE BREAKDOWN',
      'Category,Transaction Count,Total Amount (INR)',
      ...Object.entries(categories).map(
        ([category, data]) =>
          `"${category.replace(/"/g, '""')}",${data.count},${data.total}`
      ),
    ];

    downloadCSV(
      `TrustLedger_Summary_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.join('\r\n')
    );

    logAudit(
      'CREATE',
      'REPORT',
      'Exported Financial Summary & Category Breakdown to CSV',
      'System'
    );
  }, [transactions, settings, activeDuplicatesCount, logAudit]);

  const updateSettings = useCallback(
    (newSettings: Partial<WorkspaceSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));

      logAudit(
        'UPDATE',
        'SETTINGS',
        'Updated workspace financial preferences',
        'System'
      );
    },
    [logAudit]
  );

  // Compatibility with the existing interface: clears this user's ledger.
  // It does not insert sample transactions.
  const resetToSampleData = useCallback(() => {
    setTransactions([]);
    setEvidenceDocs([]);
    setAuditLogs([]);
    setSettings(emptySettings());
    setDismissedPairIds([]);
  }, []);

  return (
    <LedgerContext.Provider
      value={{
        transactions,
        evidenceDocs,
        auditLogs,
        settings,
        duplicatePairs,
        activeDuplicatesCount,
        stats,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        verifyTransaction,
        unverifyTransaction,
        addEvidenceDocument,
        deleteEvidenceDocument,
        linkEvidence,
        unlinkEvidence,
        dismissDuplicate,
        retainBothDuplicates,
        mergeDuplicates,
        exportTransactionsCSV,
        exportSummaryReportCSV,
        updateSettings,
        resetToSampleData,
        currentOperator,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);

  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }

  return context;
};
