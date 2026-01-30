"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/app/lib/translations';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('task_compass_theme') as Theme;
    const savedLang = localStorage.getItem('task_compass_lang') as Language;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
    
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_lang', language);
    }
  }, [language, isHydrated]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key];
  };

  return (
    <SettingsContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
