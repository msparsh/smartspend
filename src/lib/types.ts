export type TransactionType = 'income' | 'expense';

export type CategoryName = string; // Supports predefined and custom categories

export interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  category: CategoryName;
  date: string; // YYYY-MM-DD
  note?: string;
  type: TransactionType;
  recurring: boolean;
}

export interface Budget {
  category: CategoryName;
  limit: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // HH:MM AM/PM
}

export interface User {
  name: string;
  college: string;
  email: string;
  isLoggedIn: boolean;
  authProvider: 'google' | 'email' | 'guest';
  allowance: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  requirement: string;
}

