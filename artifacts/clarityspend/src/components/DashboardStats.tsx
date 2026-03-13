import React from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingDown, PiggyBank, AlertCircle, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatCard({
  icon,
  label,
  value,
  subtext,
  colorScheme,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorScheme: 'blue' | 'amber' | 'green' | 'orange' | 'red';
  delay?: number;
}) {
  const schemes = {
    blue: {
      card: 'bg-white',
      icon: 'bg-blue-50 text-blue-600',
      value: 'text-foreground',
      subtext: 'text-muted-foreground',
      accent: 'bg-blue-500',
    },
    amber: {
      card: 'bg-white',
      icon: 'bg-amber-50 text-amber-600',
      value: 'text-foreground',
      subtext: 'text-muted-foreground',
      accent: 'bg-amber-500',
    },
    green: {
      card: 'bg-emerald-50 border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-800',
      subtext: 'text-emerald-600/80',
      accent: 'bg-emerald-500',
    },
    orange: {
      card: 'bg-orange-50 border-orange-200',
      icon: 'bg-orange-100 text-orange-700',
      value: 'text-orange-800',
      subtext: 'text-orange-600/80',
      accent: 'bg-orange-500',
    },
    red: {
      card: 'bg-red-50 border-red-200',
      icon: 'bg-red-100 text-red-700',
      value: 'text-red-800',
      subtext: 'text-red-600/80',
      accent: 'bg-red-500',
    },
  };

  const s = schemes[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <Card className={`overflow-hidden border transition-all duration-500 ${s.card}`}>
        <div className={`h-1 w-full ${s.accent} transition-colors duration-500`} />
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${s.icon}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wide transition-colors duration-500 ${s.subtext}`}>
              {label}
            </p>
            <AnimatePresence mode="wait">
              <motion.h4
                key={value}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className={`text-2xl font-bold mt-0.5 leading-tight transition-colors duration-500 ${s.value}`}
              >
                {value}
              </motion.h4>
            </AnimatePresence>
            {subtext && (
              <p className={`text-xs mt-1 transition-colors duration-500 ${s.subtext}`}>{subtext}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardStats() {
  const { budget, expenses } = useSpendStore();

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = (budget ?? 0) - totalSpent;
  const percentageUsed = budget ? (totalSpent / budget) * 100 : 0;
  const clampedPct = Math.min(percentageUsed, 100);

  const isOverBudget = remaining < 0;

  // Progress bar colour thresholds: green <60%, orange 60–90%, red ≥90%
  const barLevel: 'green' | 'orange' | 'red' =
    percentageUsed >= 90 || isOverBudget ? 'red'
    : percentageUsed >= 60 ? 'orange'
    : 'green';

  // Warning banner still triggers at 80% (prior feature)
  const isWarning = !isOverBudget && percentageUsed >= 80;

  const remainingScheme = isOverBudget ? 'red' : barLevel === 'red' ? 'red' : barLevel === 'orange' ? 'orange' : 'green';

  const progressColor =
    barLevel === 'red'    ? 'bg-red-500'
    : barLevel === 'orange' ? 'bg-orange-400'
    : 'bg-emerald-500';

  const progressTrack =
    barLevel === 'red'    ? 'bg-red-100'
    : barLevel === 'orange' ? 'bg-orange-100'
    : 'bg-emerald-100';

  const pctTextColor =
    barLevel === 'red'    ? 'text-red-600'
    : barLevel === 'orange' ? 'text-orange-500'
    : 'text-emerald-600';

  const statusTextColor =
    barLevel === 'red'    ? 'text-red-600'
    : barLevel === 'orange' ? 'text-orange-500'
    : 'text-emerald-600';

  if (budget === null) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Monthly Budget"
          value={formatRM(budget)}
          subtext="Your set spending limit"
          colorScheme="blue"
          delay={0}
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Total Spent"
          value={formatRM(totalSpent)}
          subtext={`${Math.min(percentageUsed, 999).toFixed(1)}% of budget used`}
          colorScheme="amber"
          delay={0.05}
        />
        <StatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label={isOverBudget ? 'Over Budget By' : 'Remaining Budget'}
          value={formatRM(Math.abs(remaining))}
          subtext={
            isOverBudget
              ? 'You have exceeded your limit'
              : isWarning
              ? 'Approaching your limit'
              : 'Available to spend'
          }
          colorScheme={remainingScheme}
          delay={0.1}
        />
      </div>

      {/* Warning banner — shown at ≥80% */}
      <AnimatePresence>
        {(isWarning || isOverBudget) && (
          <motion.div
            key="warning-banner"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
              isOverBudget
                ? 'bg-red-50 border-red-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                isOverBudget ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {isOverBudget
                  ? <AlertCircle className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />
                }
              </div>
              <div>
                <p className={`text-sm font-bold ${isOverBudget ? 'text-red-800' : 'text-orange-800'}`}>
                  {isOverBudget ? 'Budget exceeded!' : 'Heads up — you\'re close to your limit'}
                </p>
                <p className={`text-sm mt-0.5 ${isOverBudget ? 'text-red-700' : 'text-orange-700'}`}>
                  {isOverBudget
                    ? `You've gone ${formatRM(Math.abs(remaining))} over your monthly budget. Consider reviewing your expenses.`
                    : `You've used ${percentageUsed.toFixed(1)}% of your budget. Only ${formatRM(remaining)} remains — spend carefully.`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden bg-white">
          <CardContent className="p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Monthly Budget Usage</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRM(totalSpent)} spent of {formatRM(budget)}
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

            {/* Track */}
            <div className={`relative h-5 w-full rounded-full overflow-hidden transition-colors duration-500 ${progressTrack}`}>
              <motion.div
                animate={{ width: `${clampedPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors duration-500 ${progressColor}`}
              />
              {/* 60% threshold marker */}
              <div className="absolute top-0 bottom-0 w-px bg-black/20" style={{ left: '60%' }} />
              {/* 90% threshold marker */}
              <div className="absolute top-0 bottom-0 w-px bg-black/20" style={{ left: '90%' }} />
            </div>

            {/* Scale labels with threshold annotations */}
            <div className="relative mt-2 h-4">
              <span className="absolute left-0 text-xs text-muted-foreground">RM 0</span>
              <span className="absolute text-xs font-semibold text-emerald-500 whitespace-nowrap -translate-x-1/2" style={{ left: '60%' }}>60%</span>
              <span className="absolute text-xs font-semibold text-red-400 whitespace-nowrap -translate-x-1/2" style={{ left: '90%' }}>90%</span>
              <span className="absolute right-0 text-xs text-muted-foreground">{formatRM(budget)}</span>
            </div>

            {/* Colour legend */}
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
                {barLevel === 'red'
                  ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  : barLevel === 'orange'
                  ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                }
                {isOverBudget
                  ? `Over budget by ${formatRM(Math.abs(remaining))}`
                  : barLevel === 'red'
                  ? `${(100 - percentageUsed).toFixed(1)}% left — high spending`
                  : barLevel === 'orange'
                  ? `${(100 - percentageUsed).toFixed(1)}% remaining`
                  : `${formatRM(remaining)} left to spend`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
