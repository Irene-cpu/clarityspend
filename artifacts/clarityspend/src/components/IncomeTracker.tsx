import React, { useState } from 'react';
import { useSpendStore, calcMonthlyIncome } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Trash2, Plus, RefreshCw, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, parseISO } from 'date-fns';

const INCOME_SUGGESTIONS = ['Salary', 'Part-time', 'Freelance', 'Business', 'Investment', 'Bonus'];

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function IncomeTracker() {
  const { incomeEntries, addIncome, removeIncome } = useSpendStore();

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState('');

  const totalMonthlyIncome = calcMonthlyIncome(incomeEntries);

  const sorted = [...incomeEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!source.trim()) { setError('Please enter an income source.'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    const isoDate = date === todayStr()
      ? new Date().toISOString()
      : new Date(date + 'T12:00:00').toISOString();
    addIncome({ source: source.trim(), amount: amt, date: isoDate, recurring });
    setSource('');
    setAmount('');
    setDate(todayStr());
    setRecurring(false);
  };

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-emerald-400" />
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Income Tracker</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Track your income sources. Recurring entries count every month; one-time entries count only in their month.
        </p>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {INCOME_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Income Source</label>
              <Input
                placeholder="e.g. Salary, Freelance"
                value={source}
                onChange={(e) => { setSource(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-14"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Date</label>
              <Input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <button
            type="button"
            onClick={() => setRecurring((r) => !r)}
            className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              recurring
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              recurring ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
            }`}>
              {recurring && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Recurring monthly income</span>
            {recurring && (
              <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Every month
              </span>
            )}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!source.trim() || !amount}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Income
          </Button>
        </form>

        {/* Income list */}
        <AnimatePresence>
          {incomeEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">
                Income Entries <span className="text-muted-foreground font-normal">({incomeEntries.length})</span>
              </p>

              <div className="space-y-2">
                <AnimatePresence>
                  {sorted.map((entry) => {
                    const d = new Date(entry.date);
                    const showTime = isToday(d);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{entry.source}</p>
                            {entry.recurring && (
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" />Monthly
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 shrink-0" />
                            {format(d, 'MMM d, yyyy')}
                            {showTime && <><span className="opacity-40">·</span>{format(d, 'h:mm a')}</>}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-700 tabular-nums shrink-0">
                          +{formatRM(entry.amount)}
                          {entry.recurring && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                        </p>
                        <button
                          onClick={() => removeIncome(entry.id)}
                          className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          aria-label="Remove income entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Monthly total */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                <div>
                  <p className="text-sm font-bold text-emerald-800">Total Monthly Income</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Recurring + this month's one-time income
                  </p>
                </div>
                <p className="text-xl font-bold tabular-nums text-emerald-700">
                  +{formatRM(totalMonthlyIncome)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
