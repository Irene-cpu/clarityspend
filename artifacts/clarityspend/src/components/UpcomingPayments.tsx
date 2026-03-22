import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, Landmark, CreditCard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, differenceInCalendarDays, addMonths } from 'date-fns';

interface PaymentEntry {
  id: string;
  name: string;
  amount: number;
  nextDueDate: Date;
  daysUntil: number;
  type: 'commitment' | 'bnpl';
  frequency: string;
}

/**
 * Given a dayOfMonth, returns the next upcoming date (today or later).
 * If that day has already passed this month, returns next month's date.
 */
function getNextDueDate(dayOfMonth: number): Date {
  const today = startOfDay(new Date());
  const candidate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (candidate >= today) return candidate;
  return addMonths(candidate, 1);
}

function urgencyStyle(daysUntil: number) {
  if (daysUntil === 0)  return { badge: 'bg-red-100 text-red-700 border-red-200',    row: 'border-red-200 bg-red-50/50',      label: 'Due today' };
  if (daysUntil === 1)  return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-200 bg-orange-50/50', label: 'Tomorrow' };
  if (daysUntil <= 3)   return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-100 bg-orange-50/30', label: `In ${daysUntil} days` };
  if (daysUntil <= 7)   return { badge: 'bg-amber-100 text-amber-700 border-amber-200',   row: 'border-slate-100 bg-slate-50',     label: `In ${daysUntil} days` };
  return                         { badge: 'bg-slate-100 text-slate-600 border-slate-200',  row: 'border-slate-100 bg-slate-50',     label: `In ${daysUntil} days` };
}

const WINDOW_OPTIONS = [7, 14] as const;

export function UpcomingPayments() {
  const { commitments, bnplItems } = useSpendStore();
  const [window, setWindow] = useState<7 | 14>(14);

  const today = startOfDay(new Date());

  const entries: PaymentEntry[] = [
    ...commitments
      .filter((c) => c.dayOfMonth !== undefined)
      .map((c) => {
        const nextDueDate = getNextDueDate(c.dayOfMonth!);
        return {
          id: c.id,
          name: c.name,
          amount: c.amount,
          nextDueDate,
          daysUntil: differenceInCalendarDays(nextDueDate, today),
          type: 'commitment' as const,
          frequency: 'Monthly commitment',
        };
      }),
    ...bnplItems
      .filter((b) => b.dayOfMonth !== undefined)
      .map((b) => {
        const nextDueDate = getNextDueDate(b.dayOfMonth!);
        return {
          id: b.id,
          name: b.name,
          amount: b.monthlyPayment,
          nextDueDate,
          daysUntil: differenceInCalendarDays(nextDueDate, today),
          type: 'bnpl' as const,
          frequency: `BNPL · ${b.installments} months`,
        };
      }),
  ]
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= window)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const sevenDayEntries = entries.filter((e) => e.daysUntil <= 7);
  const sevenDayTotal   = sevenDayEntries.reduce((sum, e) => sum + e.amount, 0);
  const windowTotal     = entries.reduce((sum, e) => sum + e.amount, 0);

  const hasItems = commitments.some((c) => c.dayOfMonth) || bnplItems.some((b) => b.dayOfMonth);

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-indigo-400" />
      <CardContent className="p-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Upcoming Payments</h2>
          </div>
          {/* Window toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setWindow(opt)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                  window === opt
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt}d
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Auto-generated from your commitments and BNPL plans with due days set.
        </p>

        {/* Summary totals */}
        <AnimatePresence>
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`grid gap-3 mb-5 ${sevenDayEntries.length > 0 && window === 14 ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                <div>
                  <p className="text-sm font-bold text-indigo-800">Upcoming Payments Total</p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {entries.length} payment{entries.length > 1 ? 's' : ''} due within {window} days
                  </p>
                </div>
                <p className="text-xl font-bold tabular-nums text-indigo-700">{formatRM(windowTotal)}</p>
              </div>
              {sevenDayEntries.length > 0 && window === 14 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-200">
                  <div>
                    <p className="text-sm font-bold text-amber-800">Next 7 Days</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {sevenDayEntries.length} payment{sevenDayEntries.length > 1 ? 's' : ''} need attention
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-amber-700">{formatRM(sevenDayTotal)}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — no items with due days */}
        {!hasItems && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No upcoming payments</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Set a "Due Day" on any commitment or BNPL plan and upcoming payments will appear here automatically.
            </p>
          </div>
        )}

        {/* Has items with due days but none in the current window */}
        {hasItems && entries.length === 0 && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">All clear for the next {window} days</p>
            <p className="text-xs text-muted-foreground mt-1">No payments due in this window.</p>
          </div>
        )}

        {/* Payment list */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, i) => {
                const s = urgencyStyle(entry.daysUntil);
                return (
                  <motion.div
                    key={`${entry.id}-${window}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: i * 0.035 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.row}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.type === 'bnpl' ? 'bg-sky-100 text-sky-600' : 'bg-teal-100 text-teal-600'
                    }`}>
                      {entry.type === 'bnpl'
                        ? <CreditCard className="w-3.5 h-3.5" />
                        : <Landmark className="w-3.5 h-3.5" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(entry.nextDueDate, 'EEE, d MMM yyyy')} · {entry.frequency}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {formatRM(entry.amount)}
                    </p>

                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${s.badge}`}>
                      {s.label}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
