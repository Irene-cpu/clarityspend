import React from 'react';
import { BudgetSetup } from '@/components/BudgetSetup';
import { DashboardStats } from '@/components/DashboardStats';
import { AddExpense } from '@/components/AddExpense';
import { ExpenseHistory } from '@/components/ExpenseHistory';
import { DecisionAssistant } from '@/components/DecisionAssistant';
import { SpendingChart } from '@/components/SpendingChart';
import { BnplTracker } from '@/components/BnplTracker';
import { MonthlyCommitments } from '@/components/MonthlyCommitments';
import { UpcomingPayments } from '@/components/UpcomingPayments';
import { IncomeTracker } from '@/components/IncomeTracker';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header/Hero Section */}
      <div className="relative w-full h-[280px] lg:h-[320px] flex items-center justify-center overflow-hidden border-b border-primary/10">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/hero-bg.png')` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/40 to-background" />

        {/* User bar — top right */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <span className="hidden sm:block text-xs text-muted-foreground font-medium truncate max-w-[180px]">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            title="Sign out"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 backdrop-blur-sm border border-white/50 text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors duration-150 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
        
        <div className="relative z-20 text-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm text-primary font-medium text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Smart Spending
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl lg:text-6xl font-bold text-foreground font-display tracking-tight"
          >
            Clarity<span className="text-primary">Spend</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-4 text-lg text-muted-foreground font-medium max-w-lg mx-auto"
          >
            Make smarter spending decisions. Track expenses and instantly know if you can afford that next purchase.
          </motion.p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-30 space-y-8">
        {/* Budget Setup always visible at top */}
        <BudgetSetup />

        {/* The rest fades in smoothly */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-8"
        >
          <DashboardStats />
          <SpendingChart />
          <UpcomingPayments />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <IncomeTracker />
              <AddExpense />
              <MonthlyCommitments />
              <BnplTracker />
              <DecisionAssistant />
            </div>
            <div className="lg:col-span-5">
              <ExpenseHistory />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
