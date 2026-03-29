import React from 'react';
import { useSpendStore, calcMonthlyIncome } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet, TrendingDown, PiggyBank, AlertCircle, CheckCircle2,
  TrendingUp, AlertTriangle, CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatCard({
  icon, label, value, subtext, colorScheme, delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorScheme: 'blue' | 'amber' | 'green' | 'orange' | 'red' | 'violet' | 'emerald';
  delay?: number;
}) {
  const schemes = {
    blue:    { card: 'bg-white', icon: 'bg-blue-50 text-blue-600',     value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-blue-500' },
    amber:   { card: 'bg-white', icon: 'bg-amber-50 text-amber-600',   value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-amber-500' },
    violet:  { card: 'bg-white', icon: 'bg-violet-50 text-violet-600', value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-violet-500' },
    emerald: { card: 'bg-white', icon: 'bg-emerald-50 text-emerald-600', value: 'text-foreground', subtext: 'text-muted-foreground', accent: 'bg-emerald-500' },
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

  // For totals, SplitBill expenses count only the user's share; Normal and Treat use full amount
  const totalSpent         = expenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);
  const totalBnplMonthly   = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);
  const totalCommitments   = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyIncome = calcMonthlyIncome(incomeEntries);
  const hasIncome          = incomeEntries.length > 0;

  const todayStr       = new Date().toDateString();
  const todayExpenses  = expenses.filter((e) => new Date(e.date).toDateString() === todayStr);
  const todaySpent     = todayExpenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);

  // Primary figure: income if set, otherwise budget
  const primaryBase    = hasIncome ? totalMonthlyIncome : (budget ?? 0);
  const effectiveRemaining = primaryBase - totalSpent - totalBnplMonthly - totalCommitments;
  const isOverBudget   = effectiveRemaining < 0;

  // Progress bar thresholds (against budget if set, otherwise against income)
  const progressBase   = budget ?? (hasIncome ? totalMonthlyIncome : 0);
  const percentageUsed = progressBase > 0
    ? ((totalSpent + totalBnplMonthly + totalCommitments) / progressBase) * 100
    : 0;
  const clampedPct = Math.min(percentageUsed, 100);

  const barLevel: 'green' | 'orange' | 'red' =
    percentageUsed >= 90 || isOverBudget ? 'red'
    : percentageUsed >= 60 ? 'orange'
    : 'green';

  const isWarning        = !isOverBudget && percentageUsed >= 80;
  const remainingScheme  = isOverBudget ? 'red' : barLevel === 'red' ? 'red' : barLevel === 'orange' ? 'orange' : 'green';
  const progressColor    = barLevel === 'red' ? 'bg-red-500' : barLevel === 'orange' ? 'bg-orange-400' : 'bg-emerald-500';
  const progressTrack    = barLevel === 'red' ? 'bg-red-100' : barLevel === 'orange' ? 'bg-orange-100' : 'bg-emerald-100';
  const pctTextColor     = barLevel === 'red' ? 'text-red-600' : barLevel === 'orange' ? 'text-orange-500' : 'text-emerald-600';
  const statusTextColor  = barLevel === 'red' ? 'text-red-600' : barLevel === 'orange' ? 'text-orange-500' : 'text-emerald-600';

  // ── No income, no budget: minimal view ──────────────────────────────────────
  if (!hasIncome && budget === null) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Total Spent This Month" value={formatRM(totalSpent)}
            subtext={expenses.length === 0 ? 'No expenses logged yet' : `Across ${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}`}
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
            <p className="text-sm font-semibold text-blue-800">No income or budget set</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Add income sources below or set a monthly budget above to unlock spending insights and remaining money tracking.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Main 4-card view ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Income (if set) or Budget */}
        {hasIncome ? (
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Monthly Income"
            value={formatRM(totalMonthlyIncome)}
            subtext={`${incomeEntries.filter((e) => e.recurring).length} recurring + one-time`}
            colorScheme="emerald"
            delay={0}
          />
        ) : (
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Monthly Budget"
            value={formatRM(budget ?? 0)}
            subtext="Your set spending limit"
            colorScheme="blue"
            delay={0}
          />
        )}

        {/* Card 2: Total Spent */}
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Total Spent"
          value={formatRM(totalSpent)}
          subtext={progressBase > 0 ? `${Math.min(percentageUsed, 999).toFixed(1)}% of ${hasIncome ? 'income' : 'budget'} used` : undefined}
          colorScheme="amber"
          delay={0.05}
        />

        {/* Card 3: Remaining / Over */}
        <StatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label={isOverBudget ? (hasIncome ? 'Income Deficit' : 'Over Budget By') : 'Remaining Money'}
          value={formatRM(Math.abs(effectiveRemaining))}
          subtext={
            isOverBudget
              ? `${hasIncome ? 'Income' : 'Budget'}, commitments & expenses exceeded`
              : (totalCommitments > 0 || totalBnplMonthly > 0)
              ? `After expenses, commitments & BNPL`
              : isWarning ? 'Approaching your limit'
              : hasIncome ? 'Income minus all outgoings' : 'Budget minus all spending'
          }
          colorScheme={remainingScheme}
          delay={0.1}
        />

        {/* Card 4: Today's Spending */}
        <StatCard
          icon={<CalendarDays className="w-5 h-5" />}
          label="Today's Spending"
          value={formatRM(todaySpent)}
          subtext={todayExpenses.length === 0 ? 'No expenses today' : `${todayExpenses.length} ${todayExpenses.length === 1 ? 'expense' : 'expenses'} today`}
          colorScheme="violet"
          delay={0.15}
        />
      </div>

      {/* Warning/over-budget banner */}
      <AnimatePresence>
        {(isWarning || isOverBudget) && (
          <motion.div
            key={isOverBudget ? 'over-banner' : 'warning-banner'}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className={`relative overflow-hidden rounded-2xl border-2 px-5 py-4 ${isOverBudget ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOverBudget ? 'bg-red-500' : 'bg-orange-500'}`} />
              <div className="flex items-start gap-3 pl-2">
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {isOverBudget ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    className={`absolute inset-0 rounded-xl ${isOverBudget ? 'bg-red-400' : 'bg-orange-400'}`}
                    style={{ zIndex: -1 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-snug ${isOverBudget ? 'text-red-800' : 'text-orange-800'}`}>
                    {isOverBudget
                      ? `Warning: Your spending exceeds your monthly ${hasIncome ? 'income' : 'budget'}!`
                      : `Warning: You have used more than 80% of your monthly ${hasIncome ? 'income' : 'budget'}.`
                    }
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${isOverBudget ? 'text-red-600' : 'text-orange-600'}`}>
                    {isOverBudget
                      ? `You're ${formatRM(Math.abs(effectiveRemaining))} over. Review your expenses to get back on track.`
                      : `${percentageUsed.toFixed(1)}% used · ${formatRM(effectiveRemaining)} remaining.`
                    }
                  </p>
                </div>
                <span className={`shrink-0 self-start text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 ${isOverBudget ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                  {percentageUsed.toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar — only shown when budget or income is set */}
      {progressBase > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}>
          <Card className="overflow-hidden bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {hasIncome ? 'Monthly Income Usage' : 'Monthly Budget Usage'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRM(totalSpent)} spent of {formatRM(progressBase)}
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={clampedPct.toFixed(1)}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className={`text-2xl font-bold tabular-nums transition-colors duration-300 ${pctTextColor}`}
                  >
                    {clampedPct.toFixed(1)}%
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className={`relative h-5 w-full rounded-full overflow-hidden transition-colors duration-500 ${progressTrack}`}>
                <motion.div
                  animate={{ width: `${clampedPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-colors duration-500 ${progressColor}`}
                />
                <div className="absolute top-0 bottom-0 w-px bg-black/20" style={{ left: '60%' }} />
                <div className="absolute top-0 bottom-0 w-px bg-black/20" style={{ left: '90%' }} />
              </div>

              <div className="relative mt-2 h-4">
                <span className="absolute left-0 text-xs text-muted-foreground">RM 0</span>
                <span className="absolute hidden min-[480px]:inline text-xs font-semibold text-emerald-500 whitespace-nowrap -translate-x-1/2" style={{ left: '60%' }}>60%</span>
                <span className="absolute hidden min-[480px]:inline text-xs font-semibold text-red-400 whitespace-nowrap -translate-x-1/2" style={{ left: '90%' }}>90%</span>
                <span className="absolute right-0 text-xs text-muted-foreground">{formatRM(progressBase)}</span>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Under 60%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">60–90%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Over 90%</span>
                </div>
                <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${statusTextColor}`}>
                  {barLevel === 'red' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    : barLevel === 'orange' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  {isOverBudget
                    ? `Over by ${formatRM(Math.abs(effectiveRemaining))}`
                    : barLevel === 'red' ? `${(100 - percentageUsed).toFixed(1)}% left — high spending`
                    : barLevel === 'orange' ? `${(100 - percentageUsed).toFixed(1)}% remaining`
                    : `${formatRM(effectiveRemaining)} available`}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
