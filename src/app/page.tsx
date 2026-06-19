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
  Bot,
  Sparkles,
  Send,
  User as UserIcon,
} from "lucide-react";
import { DonutChart } from "@tremor/react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction, CategoryName, AIMessage, TransactionType } from "@/lib/types";
import { CATEGORIES, INITIAL_TRANSACTIONS } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

export default function SmartSpendApp() {
  const [isMounted, setIsMounted] = useState(false);

  // Core App states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbStatus, setDbStatus] = useState<"offline" | "connecting" | "supabase">("offline");

  // Form states for new transaction
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Food");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState("");

  // AI Chat states
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  // Get current date formatted for form default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
  }, []);

  // --- Initial Mount & Supabase / LocalStorage load ---
  useEffect(() => {
    setIsMounted(true);

    const loadData = async () => {
      if (supabase) {
        setDbStatus("connecting");
        try {
          const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            setTransactions(data as Transaction[]);
          } else {
            // Seed Supabase with initial mock transactions if empty
            const { error: seedError } = await supabase.from("transactions").insert(INITIAL_TRANSACTIONS);
            if (!seedError) {
              setTransactions(INITIAL_TRANSACTIONS);
            } else {
              setTransactions([]);
            }
          }
          setDbStatus("supabase");
          return;
        } catch (err) {
          console.error("Supabase fetch failed, falling back to LocalStorage:", err);
        }
      }

      // LocalStorage Fallback
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

    loadData();
  }, []);

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount))) return;

    const newTransaction: Transaction = {
      id: "t_" + Date.now(),
      amount: Number(formAmount),
      category: formCategory,
      date: formDate,
      note: formNote || undefined,
      type: formType,
      recurring: false,
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    setShowAddModal(false);

    // Reset form
    setFormAmount("");
    setFormNote("");

    if (supabase && dbStatus === "supabase") {
      try {
        const { error } = await supabase.from("transactions").insert([newTransaction]);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to insert into Supabase, saving to local fallback:", err);
        localStorage.setItem("ss_transactions", JSON.stringify(updated));
      }
    } else {
      localStorage.setItem("ss_transactions", JSON.stringify(updated));
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);

    if (supabase && dbStatus === "supabase") {
      try {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to delete from Supabase, updating local fallback:", err);
        localStorage.setItem("ss_transactions", JSON.stringify(updated));
      }
    } else {
      localStorage.setItem("ss_transactions", JSON.stringify(updated));
    }
  };

  // Scroll AI chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiTyping]);

  // Initial AI Greet message
  useEffect(() => {
    if (aiMessages.length === 0) {
      setAiMessages([
        {
          id: "greet",
          sender: "ai",
          text: `👋 Hi! I am your SmartSpend AI Coach. I analyze your spending and help you manage your allowance. Ask me anything about your expenses!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [aiMessages]);

  // Handle AI Query
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMsg: AIMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: aiQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    const queryToSend = aiQuery;
    setAiQuery("");
    setIsAiTyping(true);

    try {
      // Query the API route that utilizes Gemini API
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToSend,
          transactions,
          budgets: [],
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
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed response");
      }
    } catch (err: any) {
      // Offline / No-API-Key local fallback answers
      let fallbackText = "I couldn't connect to my AI brains. Please check if GEMINI_API_KEY is configured in your environmental variables!";
      
      const queryLower = queryToSend.toLowerCase();
      if (queryLower.includes("food") || queryLower.includes("eat") || queryLower.includes("canteen")) {
        fallbackText = "🍔 Based on your local logs, Food is one of your main categories. Try splitting meals or checking campus canteen discounts!";
      } else if (queryLower.includes("budget") || queryLower.includes("save")) {
        fallbackText = "💰 student budgeting tip: Keep at least 20% of your income saved first, then divide your categories!";
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: "msg_reply_" + Date.now(),
          sender: "ai",
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // --- Financial Calculations ---
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  // Donut chart data calculations
  const chartData = useMemo(() => {
    const categoriesSum: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === "expense") {
        categoriesSum[t.category] = (categoriesSum[t.category] || 0) + t.amount;
      }
    });

    return Object.entries(categoriesSum).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === "income") return t.type === "income";
      if (filterType === "expense") return t.type === "expense";
      return true;
    });
  }, [transactions, filterType]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] font-sans antialiased selection:bg-indigo-500/30">
      {/* Background gradients for rich aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.06),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">SmartSpend</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">AI Finance Co-pilot</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              dbStatus === "supabase" 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                : dbStatus === "connecting"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                dbStatus === "supabase" ? "bg-indigo-400 animate-pulse" : dbStatus === "connecting" ? "bg-amber-400 animate-pulse" : "bg-slate-400"
              }`} />
              <span>{dbStatus === "supabase" ? "Supabase Cloud" : dbStatus === "connecting" ? "Connecting..." : "Local Storage DB"}</span>
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>PWA Ready</span>
            </span>
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns - Dashboard Financials & Transactions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl shadow-slate-950/50 hover:border-indigo-500/30 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Total Balance</span>
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    ₹{totals.balance.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Available Funds</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl shadow-slate-950/50 hover:border-emerald-500/30 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Total Income</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold tracking-tight text-emerald-400">
                    ₹{totals.income.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Total Inflow</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl shadow-slate-950/50 hover:border-rose-500/30 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Total Expense</span>
                  <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold tracking-tight text-rose-400">
                    ₹{totals.expense.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Total Outflow</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          {chartData.length > 0 && (
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-white">Expense Distribution</CardTitle>
                <CardDescription className="text-xs text-slate-400">Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center justify-around py-4">
                <DonutChart
                  className="h-44 w-44"
                  data={chartData}
                  category="value"
                  index="name"
                  colors={["rose", "blue", "amber", "purple", "emerald", "slate"]}
                  valueFormatter={(number) => `₹${number}`}
                  showLabel={true}
                />
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 sm:mt-0">
                  {chartData.map((item, index) => {
                    const colors = ["bg-rose-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-emerald-500", "bg-slate-500"];
                    return (
                      <div key={item.name} className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                        <span className="text-xs text-slate-500">₹{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions Log Section */}
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-800/60">
              <div>
                <CardTitle className="text-base font-semibold text-white">Transactions</CardTitle>
                <CardDescription className="text-xs text-slate-400">Log and manage your expenses</CardDescription>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-xs px-3.5 py-2 flex items-center space-x-1.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Record</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  onClick={() => setFilterType("all")}
                  variant={filterType === "all" ? "default" : "outline"}
                  className={`text-xs px-3 py-1.5 h-auto rounded-lg ${filterType === "all" ? "bg-slate-800 text-white border-transparent" : "border-slate-800 text-slate-400 hover:bg-slate-800/40"}`}
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilterType("income")}
                  variant={filterType === "income" ? "default" : "outline"}
                  className={`text-xs px-3 py-1.5 h-auto rounded-lg ${filterType === "income" ? "bg-emerald-500/20 text-emerald-400 border-transparent" : "border-slate-800 text-slate-400 hover:bg-emerald-500/10"}`}
                >
                  Inflow
                </Button>
                <Button
                  onClick={() => setFilterType("expense")}
                  variant={filterType === "expense" ? "default" : "outline"}
                  className={`text-xs px-3 py-1.5 h-auto rounded-lg ${filterType === "expense" ? "bg-rose-500/20 text-rose-400 border-transparent" : "border-slate-800 text-slate-400 hover:bg-rose-500/10"}`}
                >
                  Outflow
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">No transactions found.</p>
                ) : (
                  filteredTransactions.map((t) => {
                    const catInfo = CATEGORIES[t.category] || { icon: "Coins", color: "#64748b" };
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800/80 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: `${catInfo.color}20`, color: catInfo.color }}
                          >
                            <Coins className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{t.note || t.category}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                              <span>{t.category}</span>
                              <span>•</span>
                              <span>{t.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-bold ${t.type === "income" ? "text-emerald-400" : "text-slate-300"}`}>
                            {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - AI Assistant panel */}
        <div className="space-y-8">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col h-[580px] hover:border-indigo-500/20 transition-all duration-300">
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white flex items-center space-x-1.5">
                    <span>AI Financial Coach</span>
                    <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400">Gemini-powered insights</CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="block text-[8px] text-slate-500 text-right mt-1.5">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/80 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                    <span className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAiSubmit} className="p-3 border-t border-slate-800/60 bg-slate-950/30 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask about your spending..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center shrink-0"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </Button>
            </form>
          </Card>
        </div>

      </main>

      {/* Add Transaction Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-md w-full shadow-2xl relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-white">Add Record</CardTitle>
              <CardDescription className="text-xs text-slate-400">Log a new finance item</CardDescription>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as TransactionType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="expense">Expense (Outflow)</option>
                      <option value="income">Income (Inflow)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1.5">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {Object.keys(CATEGORIES).map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Campus pizza lunch"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="border-slate-800 text-slate-400 hover:bg-slate-800/40 rounded-xl text-xs py-2 px-4 h-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-2 px-4 h-auto shadow-lg shadow-indigo-600/20"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}