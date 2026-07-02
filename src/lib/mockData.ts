import { CategoryInfo, CategoryName, Transaction, Budget } from './types';

export const CATEGORIES: Record<CategoryName, CategoryInfo> = {
  Food: {
    name: 'Food',
    icon: 'Utensils',
    color: '#f43f5e', // rose-500
    bgLight: 'bg-rose-50/70',
    bgDark: 'bg-rose-950/20'
  },
  'Rent/Hostel': {
    name: 'Rent/Hostel',
    icon: 'Home',
    color: '#3b82f6', // blue-500
    bgLight: 'bg-blue-50/70',
    bgDark: 'bg-blue-950/20'
  },
  Travel: {
    name: 'Travel',
    icon: 'Car',
    color: '#eab308', // amber-500
    bgLight: 'bg-amber-50/70',
    bgDark: 'bg-amber-950/20'
  },
  Entertainment: {
    name: 'Entertainment',
    icon: 'Film',
    color: '#a855f7', // purple-500
    bgLight: 'bg-purple-50/70',
    bgDark: 'bg-purple-950/20'
  },
  Academics: {
    name: 'Academics',
    icon: 'BookOpen',
    color: '#10b981', // emerald-500
    bgLight: 'bg-emerald-50/70',
    bgDark: 'bg-emerald-950/20'
  },
  Others: {
    name: 'Others',
    icon: 'Coins',
    color: '#64748b', // slate-500
    bgLight: 'bg-slate-50/70',
    bgDark: 'bg-slate-950/20'
  }
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food', limit: 3000 },
  { category: 'Rent/Hostel', limit: 3000 },
  { category: 'Travel', limit: 1200 },
  { category: 'Entertainment', limit: 1500 },
  { category: 'Academics', limit: 2000 },
  { category: 'Others', limit: 1000 }
];
