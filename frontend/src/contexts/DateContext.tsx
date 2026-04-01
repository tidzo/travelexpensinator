import { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

interface DateProviderProps {
  children: ReactNode;
}

export function DateProvider({ children }: DateProviderProps) {
  const [selectedMonth, setSelectedMonthState] = useState<number>(() => {
    const stored = localStorage.getItem('selectedMonth');
    return stored ? parseInt(stored) : new Date().getMonth() + 1;
  });

  const [selectedYear, setSelectedYearState] = useState<number>(() => {
    const stored = localStorage.getItem('selectedYear');
    return stored ? parseInt(stored) : new Date().getFullYear();
  });

  const setSelectedMonth = (month: number) => {
    setSelectedMonthState(month);
    localStorage.setItem('selectedMonth', month.toString());
  };

  const setSelectedYear = (year: number) => {
    setSelectedYearState(year);
    localStorage.setItem('selectedYear', year.toString());
  };

  const value = {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
}