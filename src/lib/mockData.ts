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

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    amount: 5000,
    category: 'Others',
    date: '2026-06-01',
    note: 'Monthly pocket money from parents',
    type: 'income',
    recurring: false
  },
  {
    id: 't2',
    amount: 8000,
    category: 'Others',
    date: '2026-06-03',
    note: 'Stipend for software dev internship',
    type: 'income',
    recurring: false
  },
  {
    id: 't3',
    amount: 2500,
    category: 'Rent/Hostel',
    date: '2026-06-01',
    note: 'June mess food & hostel room bill',
    type: 'expense',
    recurring: true
  },
  {
    id: 't4',
    amount: 600,
    category: 'Academics',
    date: '2026-06-02',
    note: 'DBMS and OS textbooks from library store',
    type: 'expense',
    recurring: false
  },
  {
    id: 't5',
    amount: 300,
    category: 'Travel',
    date: '2026-06-04',
    note: 'Metro card topup for office travel',
    type: 'expense',
    recurring: false
  },
  {
    id: 't6',
    amount: 450,
    category: 'Food',
    date: '2026-06-05',
    note: 'Late night Pizza delivery with roommates',
    type: 'expense',
    recurring: false
  },
  {
    id: 't7',
    amount: 120,
    category: 'Food',
    date: '2026-06-07',
    note: 'Chai & samosas at campus tapri',
    type: 'expense',
    recurring: false
  },
  {
    id: 't8',
    amount: 350,
    category: 'Entertainment',
    date: '2026-06-09',
    note: 'Movie tickets at PVR Mall',
    type: 'expense',
    recurring: false
  },
  {
    id: 't9',
    amount: 80,
    category: 'Travel',
    date: '2026-06-11',
    note: 'Auto rickshaw ride to metro station',
    type: 'expense',
    recurring: false
  },
  {
    id: 't10',
    amount: 119,
    category: 'Entertainment',
    date: '2026-06-12',
    note: 'Spotify Premium Student Plan subscription',
    type: 'expense',
    recurring: true
  },
  {
    id: 't11',
    amount: 90,
    category: 'Food',
    date: '2026-06-13',
    note: 'Nescafe Canteen Maggie and Iced Coffee',
    type: 'expense',
    recurring: false
  },
  {
    id: 't12',
    amount: 300,
    category: 'Academics',
    date: '2026-06-14',
    note: 'Tech society club event t-shirt',
    type: 'expense',
    recurring: false
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food', limit: 3000 },
  { category: 'Rent/Hostel', limit: 3000 },
  { category: 'Travel', limit: 1200 },
  { category: 'Entertainment', limit: 1500 },
  { category: 'Academics', limit: 2000 },
  { category: 'Others', limit: 1000 }
];
