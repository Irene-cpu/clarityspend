import React from 'react';
import { useSpendStore, calcMonthlyIncome } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet, TrendingDown, PiggyBank, AlertCircle,
  CheckCircle2, TrendingUp, AlertTriangle, CalendarDays,
  Landmark, ArrowRight, Smile, Flame, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatCard({
  icon, label, value, subtext, colorScheme, delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorScheme: 'blue' | 'amber' | 'green' | 'orange' | 'red' | 'violet' | 'emerald' | 'indigo';
  delay?: number;
}) {
  const schemes = {
    blue:    { card: 'bg-white', icon: 'bg-blue-50 text-blue-600',       value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-blue-500' },
    amber:   { card: 'bg-white', icon: 'bg-amber-50 text-amber-600',     value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-amber-500' },
    violet:  { card: 'bg-white', icon: 'bg-violet-50 text-violet-600',   value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-violet-500' },
    emerald: { card: 'bg-white', icon: 'bg-emerald-50 text-emerald-600', value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-emerald-500' },
    indigo:  { card: 'bg-white', icon: 'bg-indigo-50 text-indigo-600',   value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-indigo-500' },
    green:   { card: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-800', subtext: 'text-emerald-600/80', accent: 'bg-emerald-500' },
    orange:  { card: 'bg-orange-50 border-orange-200',  icon: 'bg-orange-100 text-orange-700',   value: 'text-orange-800',  subtext: 'text-orange-600/80',  accent: 'bg-orange-500' },
    red:     { card: 'bg-red-50 border-red-200',         icon: 'bg-red-100 text-red-700',         value: 'text-red-800',     subtext: 'text-red-600/80',     accent: 'bg-red-500' },
  };
  const s = schemes[colorScheme];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: 'easeOut' }}>
      <Card className={`overflow-hidden border transition-all duration-500 ${s.card}`}>
        <div className={`h-1 w-full ${s.accent} transition-colors duration-500`} />
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${s.icon}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wide transition-colors duration-500 ${s.subtext}`}>{label}</p>
            <AnimatePresence mode="wait">
              <motion.h4
                key={value}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className={`text-lg sm:text-2xl font-bold mt-0.5 leading-tight transition-colors duration-500 ${s.value}`}
              >
                {value}
              </motion.h4>
            </AnimatePresence>
            {subtext && <p className={`text-xs mt-1 transition-colors duration-500 ${s.subtext}`}>{subtext}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardStats() {
  const { budget, expenses, bnplItems, commitments, incomeEntries } = useSpendStore();

  const now = new Date();
  const cm  = now.getMonth();
  const cy  = now.getFullYear();

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === cm && d.getFullYear() === cy;
  });

  const totalSpent         = monthExpenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);
  const totalBnplMonthly   = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);
  const totalCommitments   = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyIncome = calcMonthlyIncome(incomeEntries);
  const hasIncome          = incomeEntries.length > 0;

  const totalObligations     = totalCommitments + totalBnplMonthly;
  const availableAfterCommit = totalMonthlyIncome - totalObligations;
  const remainingMoney       = availableAfterCommit - totalSpent;

  const todayStr      = now.toDateString();
  const todayExpenses = monthExpenses.filter((e) => new Date(e.date).toDateString() === todayStr);
  const todaySpent    = todayExpenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);

  const isOverall    = remainingMoney < 0;
  const isAvailNeg   = availableAfterCommit < 0;
  const progressBase = hasIncome ? totalMonthlyIncome : (budget ?? 0);

  const percentageUsed = progressBase > 0
    ? ((totalSpent + totalObligations) / progressBase) * 100
    : 0;

  const isWarning = !isOverall && percentageUsed >= 80;

  const availScheme: 'green' | 'orange' | 'red' = isAvailNeg ? 'red' : availableAfterCommit < totalMonthlyIncome * 0.2 ? 'orange' : 'green';
  const remainScheme: 'green' | 'orange' | 'red' = isOverall ? 'red' : remainingMoney < totalMonthlyIncome * 0.1 ? 'orange' : 'green';

  // ── Segmented bar percentages ─────────────────────────────────────────────
  const commitPct  = progressBase > 0 ? Math.min((totalObligations / progressBase) * 100, 100) : 0;
  const expensePct = progressBase > 0 ? Math.min((totalSpent / progressBase) * 100, Math.max(0, 100 - commitPct)) : 0;
  const remainPct  = Math.max(0, 100 - commitPct - expensePct);

  // ── Insight message ───────────────────────────────────────────────────────
  const { insightMsg, insightBg, insightText, insightIconNode } = (() => {
    if (progressBase === 0) {
      return { insightMsg: 'Add income to get spending insights.', insightBg: 'bg-blue-50', insightText: 'text-blue-700', insightIconNode: <Wallet className="w-3.5 h-3.5" /> };
    }
    if (isOverall) {
      return { insightMsg: `You're ${formatRM(Math.abs(remainingMoney))} over budget. Review your expenses to get back on track.`, insightBg: 'bg-red-50', insightText: 'text-red-700', insightIconNode: <AlertCircle className="w-3.5 h-3.5" /> };
    }
    const commitRatio  = totalObligations / progressBase;
    const remainRatio  = remainingMoney / progressBase;

    if (remainRatio >= 0.5) {
      return { insightMsg: "You're in great shape — over half your income is still available.", insightBg: 'bg-emerald-50', insightText: 'text-emerald-700', insightIconNode: <Smile className="w-3.5 h-3.5" /> };
    }
    if (commitRatio >= 0.5) {
      return { insightMsg: 'Your commitments take up a large portion of your income.', insightBg: 'bg-blue-50', insightText: 'text-blue-700', insightIconNode: <Landmark className="w-3.5 h-3.5" /> };
    }
    if (percentageUsed >= 90) {
      return { insightMsg: "You've used most of your flexible spending for this month.", insightBg: 'bg-orange-50', insightText: 'text-orange-700', insightIconNode: <Flame className="w-3.5 h-3.5" /> };
    }
    if (percentageUsed >= 70) {
      return { insightMsg: 'Getting close — watch your spending for the rest of the month.', insightBg: 'bg-amber-50', insightText: 'text-amber-700', insightIconNode: <AlertTriangle className="w-3.5 h-3.5" /> };
    }
    return { insightMsg: `You have ${formatRM(remainingMoney)} available for the rest of the month.`, insightBg: 'bg-emerald-50', insightText: 'text-emerald-700', insightIconNode: <Zap className="w-3.5 h-3.5" /> };
  })();

  // ── Remaining value color ─────────────────────────────────────────────────
  const remainValueColor = isOverall
    ? 'text-red-600'
    : remainingMoney < totalMonthlyIncome * 0.1
    ? 'text-orange-500'
    : 'text-emerald-600';

  // ── No income + no budget: minimal view ──────────────────────────────────
  if (!hasIncome && budget === null) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Spent This Month" value={formatRM(totalSpent)}
            subtext={monthExpenses.length === 0 ? 'No expenses this month' : `Across ${monthExpenses.length} ${monthExpenses.length === 1 ? 'expense' : 'expenses'}`}
            colorScheme="amber" delay={0} />
          <StatCard icon={<CalendarDays className="w-5 h-5" />} label="Today's Spending" value={formatRM(todaySpent)}
            subtext={todayExpenses.length === 0 ? 'No expenses today' : `${todayExpenses.length} ${todayExpenses.length === 1 ? 'expense' : 'expenses'} today`}
            colorScheme="violet" delay={0.05} />
        </div>
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Set up your income to unlock full insights</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Add income sources in the Income section to automatically calculate how much is available after commitments and what's remaining after expenses.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Row 1: Income & Commitments */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Monthly Income"
          value={formatRM(totalMonthlyIncome)}
          subtext={`${incomeEntries.filter((e) => e.recurring).length} recurring + one-time`}
          colorScheme="emerald"
          delay={0}
        />
        <StatCard
          icon={<Landmark className="w-5 h-5" />}
          label="Total Commitments"
          value={formatRM(totalObligations)}
          subtext={`${commitments.length} commitment${commitments.length !== 1 ? 's' : ''} + ${bnplItems.length} BNPL`}
          colorScheme="indigo"
          delay={0.05}
        />
      </div>

      {/* Flow indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-1"
      >
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2">
          <ArrowRight className="w-3.5 h-3.5" />
          Income minus commitments
          <ArrowRight className="w-3.5 h-3.5" />
          minus expenses
        </div>
        <div className="flex-1 h-px bg-border" />
      </motion.div>

      {/* Row 2: Available After Commitments & Remaining Money */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Available After Commitments"
          value={`${isAvailNeg ? '−' : ''}${formatRM(Math.abs(availableAfterCommit))}`}
          subtext={
            isAvailNeg
              ? 'Commitments exceed income'
              : `Income ${formatRM(totalMonthlyIncome)} − Commitments ${formatRM(totalObligations)}`
          }
          colorScheme={availScheme}
          delay={0.12}
        />
        <StatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label={isOverall ? 'Deficit' : 'Remaining Money'}
          value={`${isOverall ? '−' : ''}${formatRM(Math.abs(remainingMoney))}`}
          subtext={
            isOverall
              ? `Overspent by ${formatRM(Math.abs(remainingMoney))}`
              : `After expenses ${formatRM(totalSpent)}`
          }
          colorScheme={remainScheme}
          delay={0.17}
        />
      </div>

      {/* Row 3: Total Spent & Today */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Spent This Month"
          value={formatRM(totalSpent)}
          subtext={`${monthExpenses.length} expense${monthExpenses.length !== 1 ? 's' : ''} this month`}
          colorScheme="amber"
          delay={0.22}
        />
        <StatCard
          icon={<CalendarDays className="w-5 h-5" />}
          label="Today's Spending"
          value={formatRM(todaySpent)}
          subtext={todayExpenses.length === 0 ? 'No expenses today' : `${todayExpenses.length} expense${todayExpenses.length !== 1 ? 's' : ''} today`}
          colorScheme="violet"
          delay={0.27}
        />
      </div>

      {/* Warning / over-budget banner */}
      <AnimatePresence>
        {(isWarning || isOverall) && (
          <motion.div
            key={isOverall ? 'over-banner' : 'warning-banner'}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className={`relative overflow-hidden rounded-2xl border-2 px-5 py-4 ${isOverall ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOverall ? 'bg-red-500' : 'bg-orange-500'}`} />
              <div className="flex items-start gap-3 pl-2">
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOverall ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {isOverall ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    className={`absolute inset-0 rounded-xl ${isOverall ? 'bg-red-400' : 'bg-orange-400'}`}
                    style={{ zIndex: -1 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-snug ${isOverall ? 'text-red-800' : 'text-orange-800'}`}>
                    {isOverall
                      ? 'Your expenses exceed what\'s available after commitments.'
                      : 'You have used more than 80% of your income.'}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${isOverall ? 'text-red-600' : 'text-orange-600'}`}>
                    {isOverall
                      ? `You're ${formatRM(Math.abs(remainingMoney))} in deficit. Review your expenses to get back on track.`
                      : `${percentageUsed.toFixed(1)}% used · ${formatRM(remainingMoney)} remaining after all outgoings.`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── This Month's Usage — redesigned ─────────────────────────────── */}
      {progressBase > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
        >
          <Card className="overflow-hidden bg-white border">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-orange-400 to-emerald-500" />
            <CardContent className="p-5 space-y-4">

              {/* Header: title left, remaining right (most prominent) */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">This Month's Usage</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on {formatRM(progressBase)} income
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {isOverall ? 'Deficit' : 'Remaining'}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={remainingMoney}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl font-bold tabular-nums leading-none ${remainValueColor}`}
                    >
                      {isOverall ? `−${formatRM(Math.abs(remainingMoney))}` : formatRM(remainingMoney)}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Segmented bar */}
              <div>
                <div className="h-5 w-full rounded-full overflow-hidden flex bg-gray-100">
                  {/* Commitments — blue */}
                  <motion.div
                    animate={{ width: `${commitPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-blue-500 shrink-0"
                    style={{ borderRadius: expensePct === 0 && remainPct === 0 ? '9999px' : '9999px 0 0 9999px' }}
                  />
                  {/* Gap */}
                  {commitPct > 0 && expensePct > 0 && <div className="w-px h-full bg-white/60 shrink-0" />}
                  {/* Expenses — orange */}
                  <motion.div
                    animate={{ width: `${expensePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-orange-400 shrink-0"
                    style={{ borderRadius: remainPct === 0 ? '0 9999px 9999px 0' : 0 }}
                  />
                  {/* Gap */}
                  {expensePct > 0 && remainPct > 0 && <div className="w-px h-full bg-white/60 shrink-0" />}
                  {/* Remaining — green or red */}
                  <motion.div
                    animate={{ width: `${remainPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full shrink-0 ${isOverall ? 'bg-red-400' : 'bg-emerald-400'}`}
                    style={{ borderRadius: commitPct === 0 && expensePct === 0 ? '9999px' : '0 9999px 9999px 0' }}
                  />
                </div>
              </div>

              {/* Breakdown: 3 columns */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {/* Commitments */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium truncate">Commitments</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={totalObligations} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className="text-sm font-bold text-foreground tabular-nums">
                      {formatRM(totalObligations)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground">{commitPct.toFixed(0)}% of income</p>
                </div>

                {/* Expenses */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium truncate">Expenses</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={totalSpent} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className="text-sm font-bold text-foreground tabular-nums">
                      {formatRM(totalSpent)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground">{expensePct.toFixed(0)}% of income</p>
                </div>

                {/* Remaining */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${isOverall ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="text-xs text-muted-foreground font-medium truncate">
                      {isOverall ? 'Deficit' : 'Remaining'}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={remainingMoney} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className={`text-sm font-bold tabular-nums ${remainValueColor}`}>
                      {isOverall ? `−${formatRM(Math.abs(remainingMoney))}` : formatRM(remainingMoney)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground">{remainPct.toFixed(0)}% of income</p>
                </div>
              </div>

              {/* Insight message */}
              <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${insightBg}`}>
                <div className={`shrink-0 ${insightText}`}>
                  {insightIconNode}
                </div>
                <p className={`text-xs font-medium leading-relaxed ${insightText}`}>
                  {insightMsg}
                </p>
                {!isOverall && (
                  <div className="ml-auto shrink-0">
                    {percentageUsed < 60
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : percentageUsed < 85
                      ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                      : <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
