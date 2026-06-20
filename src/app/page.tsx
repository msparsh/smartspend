"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Utensils,
  Home,
  Car,
  Film,
  BookOpen,
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Bot,
  Sparkles,
  Send,
  User as UserIcon,
  LogOut,
  ChevronRight,
  PieChart as ChartIcon,
  PiggyBank,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Transaction, CategoryName, CategoryInfo, AIMessage, TransactionType, Budget, User } from "@/lib/types";
import { CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_BUDGETS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmartSpendApp() {
  const [isMounted, setIsMounted] = useState(false);

  // Auth / Onboarding State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>({
    name: "Local Student",
    college: "State University",
    email: "local@university.edu",
    isLoggedIn: false,
    authProvider: "guest",
    allowance: 15000,
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "budgets" | "ai">("dashboard");

  // Financial States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dbStatus, setDbStatus] = useState<"offline" | "connecting" | "supabase">("offline");

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form states for adding/editing transaction
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Food");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);

  // Budget slider/edit state
  const [editingCategoryBudget, setEditingCategoryBudget] = useState<string | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState("");

  // AI Chat states
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter state for transactions tab
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Categories & custom adding state
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>(CATEGORIES);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [newCategoryLimit, setNewCategoryLimit] = useState("2000");

  // Set default date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
    setIsMounted(true);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiTyping]);

  // Load Initial Data (Supabase or LocalStorage)
  useEffect(() => {
    const loadInitialData = async () => {
      // Load login status
      const savedAuth = localStorage.getItem("ss_auth");
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          setUser(authData);
          setIsLoggedIn(authData.isLoggedIn);
        } catch (e) {
          console.error(e);
        }
      }

      // Load Budgets
      const savedBudgets = localStorage.getItem("ss_budgets");
      if (savedBudgets) {
        try {
          setBudgets(JSON.parse(savedBudgets));
        } catch (e) {
          setBudgets(INITIAL_BUDGETS);
        }
      } else {
        setBudgets(INITIAL_BUDGETS);
        localStorage.setItem("ss_budgets", JSON.stringify(INITIAL_BUDGETS));
      }

      // Load Categories
      const savedCategories = localStorage.getItem("ss_categories");
      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch (e) {
          setCategories(CATEGORIES);
        }
      } else {
        setCategories(CATEGORIES);
        localStorage.setItem("ss_categories", JSON.stringify(CATEGORIES));
      }

      // Load Transactions
      if (supabase) {
        setDbStatus("connecting");
        try {
          const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });

          if (!error && data && data.length > 0) {
            setTransactions(data as Transaction[]);
            setDbStatus("supabase");
            return;
          }
        } catch (err) {
          console.error("Supabase error, using local fallback", err);
        }
      }

      setDbStatus("offline");
      const savedTx = localStorage.getItem("ss_transactions");
      if (savedTx) {
        try {
          setTransactions(JSON.parse(savedTx));
        } catch (e) {
          setTransactions(INITIAL_TRANSACTIONS);
        }
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem("ss_transactions", JSON.stringify(INITIAL_TRANSACTIONS));
      }
    };

    loadInitialData();
  }, []);

  // Save transactions to local storage helper
  const saveTransactionsLocal = (updatedTx: Transaction[]) => {
    setTransactions(updatedTx);
    localStorage.setItem("ss_transactions", JSON.stringify(updatedTx));
  };

  // Auth Operations
  const handleLogin = (provider: "google" | "email" | "guest", name = "Local User") => {
    const updatedUser: User = {
      name,
      college: provider === "guest" ? "Local Device Database" : "State Tech College",
      email: provider === "guest" ? "local@device.db" : `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      isLoggedIn: true,
      authProvider: provider,
      allowance: 12000,
    };
    setUser(updatedUser);
    setIsLoggedIn(true);
    localStorage.setItem("ss_auth", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    const loggedOutUser = { ...user, isLoggedIn: false };
    setUser(loggedOutUser);
    setIsLoggedIn(false);
    localStorage.removeItem("ss_auth");
  };

  // Add & Edit Transactions
  const openAddModal = () => {
    setEditingTransaction(null);
    setFormAmount("");
    setFormCategory("Food");
    setFormType("expense");
    setFormNote("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormRecurring(false);
    setShowAddEditModal(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormType(tx.type);
    setFormNote(tx.note || "");
    setFormDate(tx.date);
    setFormRecurring(tx.recurring || false);
    setShowAddEditModal(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount))) return;

    const txData: Transaction = {
      id: editingTransaction ? editingTransaction.id : "t_" + Date.now(),
      amount: Number(formAmount),
      category: formCategory,
      date: formDate,
      note: formNote || undefined,
      type: formType,
      recurring: formRecurring,
    };

    let updatedTx: Transaction[] = [];

    if (editingTransaction) {
      updatedTx = transactions.map((t) => (t.id === editingTransaction.id ? txData : t));
    } else {
      updatedTx = [txData, ...transactions];
    }

    saveTransactionsLocal(updatedTx);
    setShowAddEditModal(false);

    // Sync to Supabase
    if (supabase && dbStatus === "supabase") {
      try {
        if (editingTransaction) {
          await supabase.from("transactions").update(txData).eq("id", txData.id);
        } else {
          await supabase.from("transactions").insert([txData]);
        }
      } catch (err) {
        console.error("Supabase sync failed:", err);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updatedTx = transactions.filter((t) => t.id !== id);
    saveTransactionsLocal(updatedTx);

    if (supabase && dbStatus === "supabase") {
      try {
        await supabase.from("transactions").delete().eq("id", id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Budget setting
  const handleUpdateBudget = (category: string, limit: number) => {
    const updatedBudgets = budgets.map((b) => (b.category === category ? { ...b, limit } : b));
    setBudgets(updatedBudgets);
    localStorage.setItem("ss_budgets", JSON.stringify(updatedBudgets));
    setEditingCategoryBudget(null);
  };

  const openAddCategoryModal = () => {
    setNewCategoryName("");
    setNewCategoryColor("#6366f1");
    setNewCategoryLimit("2000");
    setShowAddCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const trimmedName = newCategoryName.trim();

    if (categories[trimmedName]) {
      alert("This category already exists!");
      return;
    }

    const info: CategoryInfo = {
      name: trimmedName,
      icon: "Coins",
      color: newCategoryColor,
      bgLight: "bg-slate-50/70",
      bgDark: "bg-slate-950/20",
      isCustom: true,
    };

    const updatedCategories = {
      ...categories,
      [trimmedName]: info,
    };
    setCategories(updatedCategories);
    localStorage.setItem("ss_categories", JSON.stringify(updatedCategories));

    const newBudget: Budget = {
      category: trimmedName,
      limit: Number(newCategoryLimit) || 0,
    };
    const updatedBudgets = [...budgets, newBudget];
    setBudgets(updatedBudgets);
    localStorage.setItem("ss_budgets", JSON.stringify(updatedBudgets));

    setShowAddCategoryModal(false);
    setNewCategoryName("");
    setNewCategoryColor("#6366f1");
    setNewCategoryLimit("2000");
  };

  // Financial calculations
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const savings = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.min(100, Math.round((savings / income) * 100))) : 0;

    return {
      income,
      expense,
      balance: savings,
      savingsRate,
    };
  }, [transactions]);

  // Expenses grouped by Category
  const categoryExpenses = useMemo(() => {
    const sums: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      sums[t.category] = (sums[t.category] || 0) + t.amount;
    });
    return sums;
  }, [transactions]);

  // Safe to Spend Today calculation
  const safeToSpendToday = useMemo(() => {
    // Default to the user's allowance if no specific income logs exist yet
    const totalFunds = summary.income > 0 ? summary.income : user.allowance;
    const remainingFunds = Math.max(0, totalFunds - summary.expense);

    const today = new Date();
    // Get the last day of the current month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // Calculate days remaining (adding 1 to include today)
    const daysLeft = endOfMonth.getDate() - today.getDate() + 1;

    return Math.floor(remainingFunds / daysLeft);
  }, [summary.income, summary.expense, user.allowance]);


  // Sparkline/trend data (last 7 days containing expenses)
  const trendDays = useMemo(() => {
    const daySums: Record<string, number> = {};
    // Get last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      daySums[dateStr] = 0;
    }

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (daySums[t.date] !== undefined) {
          daySums[t.date] += t.amount;
        }
      });

    return Object.entries(daySums).map(([date, amount]) => {
      const dayLabel = new Date(date).toLocaleDateString([], { weekday: "short" });
      return { label: dayLabel, amount };
    });
  }, [transactions]);

  // Initial Greet Message for Coach
  useEffect(() => {
    if (aiMessages.length === 0) {
      setAiMessages([
        {
          id: "greet",
          sender: "ai",
          text: `👋 Hey there! I'm your SmartSpend Advisor.\n\nI can analyze your transactions and help you keep your budget on track. Ask me questions like:\n• Am I spending too much on Food?\n• How is my savings rate doing?\n• Give me a quick summary of this month's expenses.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [aiMessages]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMsg: AIMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: aiQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    const currentQuery = aiQuery;
    setAiQuery("");
    setIsAiTyping(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          transactions,
          budgets,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: "msg_reply_" + Date.now(),
            sender: "ai",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "No response");
      }
    } catch (err) {
      // Local fallback advisor answers
      let replyText = "I couldn't reach the backend server. Here is an analysis of your local logs: ";
      const q = currentQuery.toLowerCase();
      if (q.includes("food") || q.includes("eat")) {
        const foodExp = categoryExpenses["Food"] || 0;
        const foodBud = budgets.find((b) => b.category === "Food")?.limit || 1;
        const pct = Math.round((foodExp / foodBud) * 100);
        replyText += `🍔 You spent ₹${foodExp.toLocaleString()} on Food, which is ${pct}% of your budget limit (₹${foodBud.toLocaleString()}). ${pct > 80 ? "You are close to overspending! Better cook at home." : "You have some room left."}`;
      } else if (q.includes("save") || q.includes("saving") || q.includes("rate")) {
        replyText += `💰 Your current Savings Rate is ${summary.savingsRate}%. Total income is ₹${summary.income.toLocaleString()} and expenses are ₹${summary.expense.toLocaleString()}. ${summary.savingsRate > 20 ? "Excellent job saving!" : "Try to reduce non-essential subscription costs."}`;
      } else {
        const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
          replyText += `📊 Your biggest spending category is *${topCategory[0]}* at ₹${topCategory[1].toLocaleString()}. Try planning custom budget caps to curb impulse purchases there.`;
        } else {
          replyText += `You have no expense transactions loaded yet. Log a transaction first so I can analyze it!`;
        }
      }

      setTimeout(() => {
        setAiMessages((prev) => [
          ...prev,
          {
            id: "msg_reply_" + Date.now(),
            sender: "ai",
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsAiTyping(false);
      }, 750);
      return;
    }
    setIsAiTyping(false);
  };

  // Grouped search and filter transactions
  const processedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        (t.note || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterType === "all" ||
        (filterType === "income" && t.type === "income") ||
        (filterType === "expense" && t.type === "expense");
      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, filterType]);

  if (!isMounted) return null;

  // Render Landing / Onboarding Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {/* Mobile View Wrapper Frame */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden min-h-[680px]">
          {/* Top Hero Banner */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden flex-1 flex flex-col justify-center items-center">
            {/* Ambient Background Circles */}
            <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-purple-300/10 rounded-full blur-xl" />

            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-bounce">
              <Wallet className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight mb-2">SmartSpend</h1>
            <p className="text-indigo-100 text-sm max-w-xs font-light">
              Your AI-powered pocket-money companion. Track, budget, and chat with your financial coach.
            </p>
          </div>

          {/* Value Propositions Carousels */}
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">AI Co-pilot Insights</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Receive smart tips and direct feedback on your food and travel spend.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl mt-0.5">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Sleek Budget Planning</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Set thresholds on categories and watch progress bars fill as you spend.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl mt-0.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Recurring logs & PWA</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Never forget subscriptions. Fully installable app on your home screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleLogin("google", "Alex Rivera")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-2xl flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer transition-colors"
              >
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleLogin("guest", "Local User")}
                className="w-full border border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 font-semibold py-3 rounded-2xl flex flex-col items-center justify-center text-sm cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Go Local (Offline Mode)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">100% Private • Stores data locally on your device</span>
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-medium">
              By continuing, you agree to our SmartSpend terms of service.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pre-calculated Top Spending Category name for Dashboard
  const topSpendingCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6">
      {/* Mobile Screen Wrapper Frame */}
      <div className="w-full max-w-md bg-slate-50 sm:border sm:border-slate-200 sm:rounded-3xl shadow-xl flex flex-col h-[100dvh] sm:h-[812px] relative overflow-hidden">
        {/* App Header */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium leading-none mb-0.5">Welcome back,</span>
              <h2 className="text-sm font-bold text-slate-800 leading-none">{user.name}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${dbStatus === "supabase"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
              <span className={`h-1 w-1 rounded-full mr-1 ${dbStatus === "supabase" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {dbStatus === "supabase" ? "Cloud" : "Local"}
            </span>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 flex flex-col">          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Financial Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-slate-100 shadow-sm bg-white">
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold tracking-wide uppercase">Income</span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mt-1">₹{summary.income.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm bg-white">
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold tracking-wide uppercase">Expense</span>
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mt-1">₹{summary.expense.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="col-span-2 border-slate-100 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Savings Rate</span>
                      <p className="text-2xl font-black text-indigo-900 mt-0.5">{summary.savingsRate}%</p>
                      <p className="text-[11px] text-indigo-600/80 mt-1">Balance: ₹{summary.balance.toLocaleString()}</p>
                    </div>

                    {/* Ring progress simulation */}
                    <div className="relative h-14 w-14 flex items-center justify-center bg-white rounded-full shadow-inner border border-indigo-100">
                      <PiggyBank className="h-6 w-6 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-100 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      Safe to Spend Today
                    </span>
                    <p className="text-2xl font-black text-emerald-900 mt-0.5">
                      ₹{safeToSpendToday.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 mt-1">
                      To stay under your monthly limit
                    </p>
                  </div>

                  {/* Visual Icon Badge */}
                  <div className="relative h-14 w-14 flex items-center justify-center bg-white rounded-full shadow-inner border border-emerald-100">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>


              {/* Monthly Trend Chart (SVG / HTML-based for lightweight visual perfection) */}
              <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader className="p-3.5 pb-0">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wide">Expense Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-4">
                  <div className="flex items-end justify-between h-24 pt-4 px-2">
                    {trendDays.map((day) => {
                      // Max amount for scaling
                      const maxVal = Math.max(...trendDays.map(t => t.amount), 500);
                      const heightPct = Math.max(8, Math.min(100, (day.amount / maxVal) * 100));
                      return (
                        <div key={day.label} className="flex flex-col items-center flex-1 space-y-1.5 group">
                          <div className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                            {day.amount > 0 ? `₹${day.amount}` : "0"}
                          </div>
                          <div className="w-5 bg-slate-100 rounded-t-md relative overflow-hidden h-14 flex items-end">
                            <div
                              className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t-md cursor-pointer"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Categories Card */}
              <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader className="p-3.5 pb-2">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wide">Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 space-y-3">
                  {Object.keys(categoryExpenses).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No expenses registered yet.</p>
                  ) : (
                    Object.entries(categoryExpenses)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([name, sum]) => {
                        const info = categories[name] || { color: "#6366f1", icon: "Coins" };
                        const limit = budgets.find((b) => b.category === name)?.limit || 1000;
                        const ratio = Math.min(100, Math.round((sum / limit) * 100));

                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                                <span>{name}</span>
                              </span>
                              <span className="text-slate-500 font-bold">₹{sum.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ ₹{limit}</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${ratio}%`,
                                  backgroundColor: ratio > 90 ? "#ef4444" : ratio > 60 ? "#f59e0b" : info.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </CardContent>
              </Card>

              {/* Quick AI Quote widget */}
              <div className="bg-indigo-600/5 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
                <Bot className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950">AI Fast Tip</h4>
                  <p className="text-[11px] text-indigo-800 text-sm leading-normal font-light">
                    {topSpendingCategory
                      ? `Your highest expenditure is currently on **${topSpendingCategory[0]}** (₹${topSpendingCategory[1].toLocaleString()}). Log in to the Budget Planner tab to reduce your cap.`
                      : "No data is logged. Tap the bottom plus icon to insert your first wallet transaction!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSACTIONS LOG */}
          {activeTab === "transactions" && (
            <div className="space-y-3.5 animate-fadeIn">

              {/* Toolbar & Filters */}
              <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-3">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <div className="flex-1 items-center space-x-1.5">
                  {(["all", "income", "expense"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-1 transition-all border-0 cursor-pointer ${filterType === type
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                      {type === "all" ? "All" : type === "income" ? "Inflow" : "Outflow"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-2">                {processedTransactions.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                  <p className="text-xs text-slate-400">No records found matching filters.</p>
                </div>
              ) : (
                processedTransactions.map((t) => {
                  const info = categories[t.category] || { icon: "Coins", color: "#64748b" };
                  return (
                    <div
                      key={t.id}
                      className="bg-white border border-slate-100 hover:border-slate-200/80 p-3 rounded-2xl flex items-center justify-between shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ backgroundColor: `${info.color}15`, color: info.color }}
                        >
                          {t.category.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {t.note || t.category}
                          </h4>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span>{t.category}</span>
                            <span>•</span>
                            <span>{t.date}</span>
                            {t.recurring && (
                              <span className="bg-indigo-50 text-indigo-600 px-1 rounded-sm text-[8px] font-semibold">
                                Recur
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`text-xs font-extrabold ${t.type === "income" ? "text-emerald-600" : "text-slate-800"
                            }`}
                        >
                          {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                        </span>

                        <div className="flex items-center border-l border-slate-100 pl-2 space-x-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET PLANNER */}
          {activeTab === "budgets" && (
            <div className="space-y-4 animate-fadeIn">              <div className="  bg-gradient-to-tr from-indigo-500 to-indigo-600 p-4 rounded-2xl text-white shadow-md">
              <h3 className="text-sm font-bold">Category Budgets</h3>
              <p className="text-[11px] text-indigo-100 font-light mt-1">
                Adjust limits to control monthly expenses. Click any card to edit details.
              </p>
            </div>

              <div className="space-y-3 ">
                {budgets.map((b) => {
                  const info = categories[b.category] || { color: "#64748b" };
                  const expSum = categoryExpenses[b.category] || 0;
                  const ratio = Math.min(100, Math.round((expSum / b.limit) * 100));

                  return (
                    <Card
                      key={b.category}
                      onClick={() => {
                        setEditingCategoryBudget(b.category);
                        setBudgetLimitInput(b.limit.toString());
                      }}
                      className="border-slate-100 bg-white shadow-sm hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div>
                            <span className="font-bold text-slate-800 block">{b.category}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              Spent: ₹{expSum.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded">
                            Limit: ₹{b.limit.toLocaleString()}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${ratio}%`,
                              backgroundColor: ratio > 90 ? "#ef4444" : ratio > 75 ? "#f59e0b" : info.color || "#6366f1",
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center mt-1.5 text-[9px] font-semibold text-slate-400">
                          <span>{ratio}% Used</span>
                          <span className={ratio > 90 ? "text-rose-500 font-bold" : ""}>
                            {b.limit - expSum >= 0 ? `₹${(b.limit - expSum).toLocaleString()} Left` : `₹${Math.abs(b.limit - expSum).toLocaleString()} Over`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AI INSIGHTS */}
          {activeTab === "ai" && (
            <div className="flex flex-col flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
              {/* Sub-Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center space-x-2 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Finance AI Coach</h3>
                  <span className="text-[9px] text-slate-400">Gemini Pro API integration</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-grow overflow-y-auto p-3.5 space-y-3.5">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                        }`}
                    >
                      <p className="whitespace-pre-line font-medium">{msg.text}</p>
                      <span className="block text-[8px] text-slate-400 text-right mt-1.5">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3">
                      <span className="flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Form */}
              <form
                onSubmit={handleAiSubmit}
                className="p-2 border-t border-slate-100 bg-slate-50 flex items-center space-x-1.5 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Ask advisor..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  className="h-8.5 w-8.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl shrink-0 flex items-center justify-center text-white border-0 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </main>

        {/* Global Floating Actions Add Button */}
        {(activeTab === "transactions" || activeTab === "budgets") && (
          <button
            onClick={activeTab === "budgets" ? openAddCategoryModal : openAddModal}
            className="absolute bottom-18 right-5 h-12 w-12 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 transition-all z-20 border-0 cursor-pointer"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Bottom Tab Bar Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-30 w-full shrink-0">          <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 border-0 bg-transparent cursor-pointer ${activeTab === "dashboard" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
        >
          <ChartIcon className="h-4.5 w-4.5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Home</span>
        </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 border-0 bg-transparent cursor-pointer ${activeTab === "transactions" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("budgets")}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 border-0 bg-transparent cursor-pointer ${activeTab === "budgets" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <CheckCircle className="h-4.5 w-4.5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Budget</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 border-0 bg-transparent cursor-pointer ${activeTab === "ai" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Insights</span>
          </button>
        </nav>

        {/* Add/Edit Modal Dialog */}
        {showAddEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
            <Card className="bg-white border-slate-100 max-w-sm w-full shadow-2xl relative animate-scaleIn">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">
                  {editingTransaction ? "Edit Transaction" : "Add Record"}
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400 font-medium">
                  Log your income or expense logs.
                </CardDescription>
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold border-0 bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 350"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as TransactionType)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-semibold"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-semibold"
                      >
                        {Object.keys(categories).map((catName) => (
                          <option key={catName} value={catName}>
                            {catName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Metro card / Canteen snacks"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="recur_cb"
                      checked={formRecurring}
                      onChange={(e) => setFormRecurring(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="recur_cb" className="text-[11px] font-semibold text-slate-500 cursor-pointer">
                      Recurring Subscription Monthly
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEditModal(false)}
                      className="border border-slate-200 text-slate-400 hover:bg-slate-50 rounded-xl text-xs py-1.5 px-3 bg-transparent cursor-pointer font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-1.5 px-4 shadow-md border-0 cursor-pointer font-semibold"
                    >
                      {editingTransaction ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Edit Modal Dialog */}
        {editingCategoryBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
            <Card className="bg-white border-slate-100 max-w-sm w-full shadow-2xl relative animate-scaleIn">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Edit Category Budget
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400 font-medium">
                  Rename this category or adjust its monthly spending limit.
                </CardDescription>
                <button
                  onClick={() => setEditingCategoryBudget(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold border-0 bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const targetInput = document.getElementById("budget_cat_name_input") as HTMLInputElement;
                    const limitVal = Number(budgetLimitInput) || 500;
                    const currentCatName = editingCategoryBudget;
                    const newCatName = targetInput?.value?.trim() || currentCatName;

                    const updatedBudgets = budgets.map((b) => {
                      if (b.category === currentCatName) {
                        return { ...b, category: newCatName, limit: limitVal };
                      }
                      return b;
                    });

                    if (newCatName !== currentCatName) {
                      const updatedTx = transactions.map((t) => {
                        if (t.category === currentCatName) {
                          return { ...t, category: newCatName };
                        }
                        return t;
                      });
                      saveTransactionsLocal(updatedTx);
                    }

                    setBudgets(updatedBudgets);
                    localStorage.setItem("ss_budgets", JSON.stringify(updatedBudgets));
                    setEditingCategoryBudget(null);
                  }}
                  className="space-y-4 text-xs text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Category Name</label>
                    <input
                      type="text"
                      id="budget_cat_name_input"
                      required
                      defaultValue={editingCategoryBudget}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Limit (₹)</label>
                    <input
                      type="number"
                      required
                      value={budgetLimitInput}
                      onChange={(e) => setBudgetLimitInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-bold"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategoryBudget(null)}
                      className="border border-slate-200 text-slate-400 hover:bg-slate-50 rounded-xl text-xs py-1.5 px-3 bg-transparent cursor-pointer font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-1.5 px-4 shadow-md border-0 cursor-pointer font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Custom Category Budget Modal Dialog */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
            <Card className="bg-white border-slate-100 max-w-sm w-full shadow-2xl relative animate-scaleIn">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Add Category Budget
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400 font-medium">
                  Create a new category and set its monthly budget limit.
                </CardDescription>
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold border-0 bg-transparent cursor-pointer"
                >
                  &times;
                </button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shopping, Health"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Budget Limit (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2000"
                      value={newCategoryLimit}
                      onChange={(e) => setNewCategoryLimit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Theme Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        "#6366f1", // Indigo
                        "#10b981", // Emerald
                        "#f43f5e", // Rose
                        "#eab308", // Amber
                        "#8b5cf6", // Violet
                        "#0ea5e9", // Sky
                        "#d946ef", // Fuchsia
                        "#f97316", // Orange
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCategoryColor(color)}
                          className={`h-6 w-6 rounded-full border-2 cursor-pointer transition-all ${newCategoryColor === color ? "border-slate-800 scale-110" : "border-transparent"
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl border-0 cursor-pointer shadow-md shadow-indigo-600/20 text-xs transition-colors"
                    >
                      Create Budget Category
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}