import React from 'react';
import { useSpendStore, calcMonthlyIncome } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet, TrendingDown, PiggyBank, AlertCircle,
  CheckCircle2, TrendingUp, AlertTriangle, CalendarDays,
  Landmark, ArrowRight,
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

  // ── Core numbers ──────────────────────────────────────────────────────────────
  // Expenses: SplitBill counts user share only
  const totalSpent         = expenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);
  const totalBnplMonthly   = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);
  const totalCommitments   = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyIncome = calcMonthlyIncome(incomeEntries);
  const hasIncome          = incomeEntries.length > 0;

  // ── Two-step calculation ──────────────────────────────────────────────────────
  // All fixed obligations: monthly commitments + BNPL installments
  const totalObligations       = totalCommitments + totalBnplMonthly;
  // Step 1: what's left after paying commitments
  const availableAfterCommit   = totalMonthlyIncome - totalObligations;
  // Step 2: what's left after also paying variable expenses
  const remainingMoney         = availableAfterCommit - totalSpent;

  // ── Today's spending ─────────────────────────────────────────────────────────
  const todayStr      = new Date().toDateString();
  const todayExpenses = expenses.filter((e) => new Date(e.date).toDateString() === todayStr);
  const todaySpent    = todayExpenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);

  // ── Status thresholds ─────────────────────────────────────────────────────────
  const isOverall        = remainingMoney < 0;
  const isAvailNeg       = availableAfterCommit < 0;
  const progressBase     = hasIncome ? totalMonthlyIncome : (budget ?? 0);
  const percentageUsed   = progressBase > 0
    ? ((totalSpent + totalObligations) / progressBase) * 100
    : 0;
  const clampedPct = Math.min(percentageUsed, 100);

  const barLevel: 'green' | 'orange' | 'red' =
    percentageUsed >= 90 || isOverall ? 'red'
    : percentageUsed >= 60 ? 'orange'
    : 'green';

  const isWarning       = !isOverall && percentageUsed >= 80;
  const progressColor   = barLevel === 'red' ? 'bg-red-500' : barLevel === 'orange' ? 'bg-orange-400' : 'bg-emerald-500';
  const progressTrack   = barLevel === 'red' ? 'bg-red-100' : barLevel === 'orange' ? 'bg-orange-100' : 'bg-emerald-100';
  const pctTextColor    = barLevel === 'red' ? 'text-red-600' : barLevel === 'orange' ? 'text-orange-500' : 'text-emerald-600';
  const statusTextColor = pctTextColor;

  const availScheme: 'green' | 'orange' | 'red' = isAvailNeg ? 'red' : availableAfterCommit < totalMonthlyIncome * 0.2 ? 'orange' : 'green';
  const remainScheme: 'green' | 'orange' | 'red' = isOverall ? 'red' : remainingMoney < totalMonthlyIncome * 0.1 ? 'orange' : 'green';

  // ── No income, no budget: minimal view ───────────────────────────────────────
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
            <p className="text-sm font-semibold text-blue-800">Set up your income to unlock full insights</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Add income sources in the Income section to automatically calculate how much is available after commitments and what's remaining after expenses.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────────
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
          label="Total Spent (Expenses)"
          value={formatRM(totalSpent)}
          subtext={
            progressBase > 0
              ? `${Math.min(percentageUsed, 999).toFixed(1)}% of income used overall`
              : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} logged`
          }
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
                <span className={`shrink-0 self-start text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 ${isOverall ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                  {percentageUsed.toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {progressBase > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}>
          <Card className="overflow-hidden bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Monthly Income Usage</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Commitments {formatRM(totalObligations)} + Expenses {formatRM(totalSpent)} of {formatRM(progressBase)}
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

              {/* Stacked bar: commitments + expenses */}
              <div className={`relative h-5 w-full rounded-full overflow-hidden ${progressTrack}`}>
                {/* Commitments segment */}
                <motion.div
                  animate={{ width: `${Math.min((totalObligations / progressBase) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute h-full bg-indigo-400 rounded-l-full"
                />
                {/* Expenses segment */}
                <motion.div
                  animate={{
                    left: `${Math.min((totalObligations / progressBase) * 100, 100)}%`,
                    width: `${Math.min((totalSpent / progressBase) * 100, 100 - Math.min((totalObligations / progressBase) * 100, 100))}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`absolute h-full ${progressColor}`}
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

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">Commitments</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Expenses</span>
                </div>
                <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${statusTextColor}`}>
                  {isOverall ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    : barLevel === 'orange' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  {isOverall
                    ? `Deficit of ${formatRM(Math.abs(remainingMoney))}`
                    : barLevel === 'red' ? `${(100 - percentageUsed).toFixed(1)}% left — high spending`
                    : barLevel === 'orange' ? `${formatRM(remainingMoney)} remaining`
                    : `${formatRM(remainingMoney)} available`}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
