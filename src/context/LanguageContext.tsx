
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type Language = 'en' | 'kn' | 'hi';

const translations = {
  en: {
    dashboard: 'Dashboard',
    overview: 'Financial Overview',
    transactions: 'Transactions',
    assistant: 'AI Assistant',
    ocr: 'Invoice OCR',
    duplicates: 'Duplicate Detection',
    evidence: 'Evidence Vault',
    reports: 'Financial Reports',
    audit: 'Audit Trail',
    settings: 'Settings',
    addTransaction: 'Add Transaction',
    exportCSV: 'Export CSV',
    ocrScan: 'OCR Scan',
    language: 'Language',
  },

  kn: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    overview: 'ಹಣಕಾಸಿನ ಅವಲೋಕನ',
    transactions: 'ವಹಿವಾಟುಗಳು',
    assistant: 'AI ಸಹಾಯಕ',
    ocr: 'ಇನ್‌ವಾಯ್ಸ್ OCR',
    duplicates: 'ನಕಲಿ ದಾಖಲೆ ಪತ್ತೆ',
    evidence: 'ದಾಖಲೆ ಸಂಗ್ರಹ',
    reports: 'ಹಣಕಾಸು ವರದಿಗಳು',
    audit: 'ಪರಿಶೀಲನಾ ದಾಖಲೆ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    addTransaction: 'ವಹಿವಾಟು ಸೇರಿಸಿ',
    exportCSV: 'CSV ರಫ್ತು',
    ocrScan: 'OCR ಸ್ಕ್ಯಾನ್',
    language: 'ಭಾಷೆ',
  },

  hi: {
    dashboard: 'डैशबोर्ड',
    overview: 'वित्तीय अवलोकन',
    transactions: 'लेन-देन',
    assistant: 'AI सहायक',
    ocr: 'इनवॉइस OCR',
    duplicates: 'डुप्लिकेट पहचान',
    evidence: 'दस्तावेज़ संग्रह',
    reports: 'वित्तीय रिपोर्ट',
    audit: 'ऑडिट रिकॉर्ड',
    settings: 'सेटिंग्स',
    addTransaction: 'लेन-देन जोड़ें',
    exportCSV: 'CSV निर्यात',
    ocrScan: 'OCR स्कैन',
    language: 'भाषा',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('trustledger-language');

    if (savedLanguage === 'kn' || savedLanguage === 'hi') {
      return savedLanguage;
    }

    return 'en';
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('trustledger-language', nextLanguage);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    );
  }

  return context;
};
