import { createContext, useContext } from "react";

export type Language = "ru" | "en";

export const LanguageContext = createContext<Language>("ru");

export function useLanguage() {
  return useContext(LanguageContext);
}
