import React, { useState, useEffect } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, Landmark, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, parseISO, differenceInCalendarDays,
  startOfDay, getDate, setDate, addMonths, isBefore,
} from 'date-fns';

interface PaymentEntry {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
  type: 'commitment' | 'bnpl';
  frequency: string;
}

function isPaidThisMonth(paidAt?: string): boolean {
  if (!paidAt) return false;
  const d = new Date(paidAt);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function urgencyStyle(daysUntil: number) {
  if (daysUntil < 0)   return { badge: 'bg-red-100 text-red-700 border-red-200',         row: 'border-red-200 bg-red-50/50',       label: 'Overdue' };
  if (daysUntil === 0) return { badge: 'bg-red-100 text-red-700 border-red-200',          row: 'border-red-200 bg-red-50/50',       label: 'Due today' };
  if (daysUntil === 1) return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-200 bg-orange-50/50', label: 'Tomorrow' };
  if (daysUntil <= 3)  return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-100 bg-orange-50/30', label: `In ${daysUntil} days` };
  if (daysUntil <= 7)  return { badge: 'bg-amber-100 text-amber-700 border-amber-200',    row: 'border-slate-100 bg-slate-50',      label: `In ${daysUntil} days` };
  return                        { badge: 'bg-slate-100 text-slate-600 border-slate-200',   row: 'border-slate-100 bg-slate-50',      label: `In ${daysUntil} days` };
}

const WINDOW_OPTIONS = [7, 14] as const;

export function UpcomingPayments() {
  const {
    commitments, bnplItems,
    toggleCommitmentPaid, toggleBnplPaid,
    resetPaidCommitmentsForNewMonth, resetPaidBnplForNewMonth,
  } = useSpendStore();

  const [window, setWindow] = useState<7 | 14>(14);

  // Reset paid statuses if they're from a previous month
  useEffect(() => {
    resetPaidCommitmentsForNewMonth();
    resetPaidBnplForNewMonth();
  }, []);

  const today = startOfDay(new Date());

  const allEntries: PaymentEntry[] = [
    ...commitments
      .filter((c) => !!c.dueDate && !isPaidThisMonth(c.paidAt))
      .map((c) => {
        const storedDate = parseISO(c.dueDate!);
        const dayOfMonth = getDate(storedDate);
        const thisMonthDue = startOfDay(setDate(today, dayOfMonth));
        const effectiveDate = isBefore(thisMonthDue, today)
          ? addMonths(thisMonthDue, 1)
          : thisMonthDue;
        return {
          id: c.id,
          name: c.name,
          amount: c.amount,
          dueDate: format(effectiveDate, 'yyyy-MM-dd'),
          daysUntil: differenceInCalendarDays(effectiveDate, today),
          type: 'commitment' as const,
          frequency: 'Monthly commitment',
        };
      }),
    ...bnplItems
      .filter((b) => !!b.dueDate && !isPaidThisMonth(b.paidAt))
      .map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.monthlyPayment,
        dueDate: b.dueDate!,
        daysUntil: differenceInCalendarDays(startOfDay(parseISO(b.dueDate!)), today),
        type: 'bnpl' as const,
        frequency: `BNPL · ${b.installments} months`,
      })),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  const entries          = allEntries.filter((e) => e.daysUntil <= window);
  const overdueEntries   = entries.filter((e) => e.daysUntil < 0);
  const upcomingEntries  = entries.filter((e) => e.daysUntil >= 0);
  const sevenDayEntries  = entries.filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7);

  const overdueTotal  = overdueEntries.reduce((sum, e) => sum + e.amount, 0);
  const windowTotal   = upcomingEntries.reduce((sum, e) => sum + e.amount, 0);
  const sevenDayTotal = sevenDayEntries.reduce((sum, e) => sum + e.amount, 0);

  const paidThisMonthCount =
    commitments.filter((c) => isPaidThisMonth(c.paidAt)).length +
    bnplItems.filter((b) => isPaidThisMonth(b.paidAt)).length;

  const hasItems = commitments.some((c) => c.dueDate) || bnplItems.some((b) => b.dueDate);
  const hasDue   = entries.length > 0;

  const handleMarkPaid = (entry: PaymentEntry) => {
    if (entry.type === 'commitment') toggleCommitmentPaid(entry.id);
    else toggleBnplPaid(entry.id);
  };

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
          Auto-generated from your commitments and BNPL plans. Mark items as paid to hide them until next month.
        </p>

        {/* Paid this month badge */}
        {paidThisMonthCount > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-medium text-emerald-700">
              {paidThisMonthCount} payment{paidThisMonthCount > 1 ? 's' : ''} marked as paid this month — will reappear next month.
            </p>
          </div>
        )}

        {/* Summary totals */}
        <AnimatePresence>
          {hasDue && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
            >
              {upcomingEntries.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                  <div>
                    <p className="text-sm font-bold text-indigo-800">Upcoming Total</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {upcomingEntries.length} payment{upcomingEntries.length > 1 ? 's' : ''} due within {window} days
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-indigo-700">{formatRM(windowTotal)}</p>
                </div>
              )}
              {window === 14 && sevenDayEntries.length > 0 && (
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
              {overdueEntries.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200">
                  <div>
                    <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />Overdue
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {overdueEntries.length} payment{overdueEntries.length > 1 ? 's' : ''} past due date
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-red-700">{formatRM(overdueTotal)}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — no due dates set at all */}
        {!hasItems && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No upcoming payments</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Set a due date on any commitment or BNPL plan and it will appear here automatically.
            </p>
          </div>
        )}

        {/* Has due dates but nothing in current window (could be all paid or out of window) */}
        {hasItems && !hasDue && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {paidThisMonthCount > 0 ? 'All payments handled!' : `All clear for the next ${window} days`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {paidThisMonthCount > 0
                ? 'Every upcoming payment in this window is marked as paid.'
                : 'No payments due in this window.'
              }
            </p>
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
                    exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
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
                        {format(parseISO(entry.dueDate), 'EEE, d MMM yyyy')} · {entry.frequency}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {formatRM(entry.amount)}
                    </p>

                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline ${s.badge}`}>
                      {s.label}
                    </span>

                    {/* Mark as Paid button */}
                    <button
                      onClick={() => handleMarkPaid(entry)}
                      title="Mark as paid"
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 active:scale-95 transition-all duration-150 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Paid</span>
                    </button>
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
