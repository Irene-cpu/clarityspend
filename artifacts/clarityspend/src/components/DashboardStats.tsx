import React from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingDown, PiggyBank, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
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
  const isWarning = !isOverBudget && percentageUsed >= 75;
  const isHealthy = !isOverBudget && !isWarning;

  const remainingScheme = isOverBudget ? 'red' : isWarning ? 'orange' : 'green';

  const statusMessage = isOverBudget
    ? `Over budget by ${formatRM(Math.abs(remaining))}`
    : isWarning
    ? `${(100 - percentageUsed).toFixed(1)}% of budget left — watch your spending`
    : `You're within budget. Keep it up!`;

  const progressColor = isOverBudget
    ? 'bg-red-500'
    : isWarning
    ? 'bg-orange-400'
    : 'bg-emerald-500';

  const progressTrack = isOverBudget
    ? 'bg-red-100'
    : isWarning
    ? 'bg-orange-100'
    : 'bg-emerald-100';

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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isOverBudget ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : isWarning ? (
                  <TrendingUp className="w-4 h-4 text-orange-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isOverBudget ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-emerald-700'
                }`}>
                  {statusMessage}
                </p>
              </div>
              <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
                isOverBudget ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-emerald-600'
              }`}>
                {clampedPct.toFixed(1)}%
              </span>
            </div>

            <div className={`h-3 w-full rounded-full overflow-hidden transition-colors duration-500 ${progressTrack}`}>
              <motion.div
                animate={{ width: `${clampedPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors duration-500 ${progressColor}`}
              />
            </div>

            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">RM 0</span>
              <span className="text-xs text-muted-foreground">{formatRM(budget)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
