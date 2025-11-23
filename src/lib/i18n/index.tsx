import React, { createContext, useContext, useMemo } from "react";
import { en } from "./en";
import { zh } from "./zh";

export type Locale = "en" | "zh";
type Messages = typeof en;

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
}

const messageMap: Record<Locale, Messages> = {
  en,
  zh,
};

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  messages: en,
});

export const useTranslation = () => useContext(I18nContext);

export interface TranslationProviderProps {
  locale?: Locale;
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  locale = "en",
  children,
}) => {
  const value = useMemo<I18nContextValue>(() => {
    const messages = messageMap[locale] ?? en;
    return { locale, messages };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
