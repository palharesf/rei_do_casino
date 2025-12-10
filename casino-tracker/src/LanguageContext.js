// LanguageContext.js - Manages language state across the app

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

// Create the context
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Provider component that wraps the app
export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage, default to English
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("appLanguage");
    return saved || "en";
  });

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  // Function to toggle between languages
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "pt" : "en"));
  };

  // Function to get a translation by key
  const t = (key) => {
    return translations[language][key] || key;
  };

  // Provide language, toggleLanguage, and t function to all children
  const value = {
    language,
    toggleLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
