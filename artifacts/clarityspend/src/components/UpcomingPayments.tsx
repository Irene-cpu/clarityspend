import React from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, Landmark, CreditCard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInCalendarDays, startOfDay } from 'date-fns';

interface PaymentEntry {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  type: 'commitment' | 'bnpl';
  daysUntil: number;
}

function urgencyStyle(daysUntil: number) {
  if (daysUntil < 0)  return { badge: 'bg-red-100 text-red-700 border-red-200',    row: 'border-red-100 bg-red-50/40',    dot: 'bg-red-500', label: 'Overdue' };
  if (daysUntil === 0) return { badge: 'bg-red-100 text-red-700 border-red-200',   row: 'border-red-100 bg-red-50/40',    dot: 'bg-red-500', label: 'Due today' };
  if (daysUntil === 1) return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-100 bg-orange-50/40', dot: 'bg-orange-500', label: 'Tomorrow' };
  if (daysUntil <= 3)  return { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-100 bg-orange-50/40', dot: 'bg-orange-400', label: `In ${daysUntil} days` };
  if (daysUntil <= 7)  return { badge: 'bg-amber-100 text-amber-700 border-amber-200',  row: 'border-slate-100 bg-slate-50',       dot: 'bg-amber-400', label: `In ${daysUntil} days` };
  return                        { badge: 'bg-slate-100 text-slate-600 border-slate-200',  row: 'border-slate-100 bg-slate-50',       dot: 'bg-slate-400', label: `In ${daysUntil} days` };
}

export function UpcomingPayments() {
  const { commitments, bnplItems } = useSpendStore();

  const today = startOfDay(new Date());

  const entries: PaymentEntry[] = [
    ...commitments
      .filter((c) => !!c.dueDate)
      .map((c) => ({
        id: c.id,
        name: c.name,
        amount: c.amount,
        dueDate: c.dueDate!,
        type: 'commitment' as const,
        daysUntil: differenceInCalendarDays(startOfDay(parseISO(c.dueDate!)), today),
      })),
    ...bnplItems
      .filter((b) => !!b.dueDate)
      .map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.monthlyPayment,
        dueDate: b.dueDate!,
        type: 'bnpl' as const,
        daysUntil: differenceInCalendarDays(startOfDay(parseISO(b.dueDate!)), today),
      })),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  const sevenDayEntries = entries.filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7);
  const sevenDayTotal = sevenDayEntries.reduce((sum, e) => sum + e.amount, 0);
  const overdueEntries = entries.filter((e) => e.daysUntil < 0);
  const overdueTotal = overdueEntries.reduce((sum, e) => sum + e.amount, 0);

  const hasAny = entries.length > 0;
  const hasDue = sevenDayEntries.length > 0 || overdueEntries.length > 0;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-indigo-400" />
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Upcoming Payments</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Payments due from your commitments and BNPL plans, sorted by nearest date.
        </p>

        {/* 7-day + overdue summary row */}
        <AnimatePresence>
          {hasDue && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
            >
              {sevenDayEntries.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                  <div>
                    <p className="text-sm font-bold text-indigo-800">Upcoming Payments Total</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {sevenDayEntries.length} payment{sevenDayEntries.length > 1 ? 's' : ''} due within 7 days
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-indigo-700">{formatRM(sevenDayTotal)}</p>
                </div>
              )}
              {overdueEntries.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200">
                  <div>
                    <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Overdue
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

        {/* Empty state */}
        {!hasAny && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No upcoming payments</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add due dates to your commitments or BNPL plans to see them here.
            </p>
          </div>
        )}

        {/* Payment list */}
        {hasAny && (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, i) => {
                const s = urgencyStyle(entry.daysUntil);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.row}`}
                  >
                    {/* Type icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.type === 'bnpl' ? 'bg-sky-100 text-sky-600' : 'bg-teal-100 text-teal-600'
                    }`}>
                      {entry.type === 'bnpl'
                        ? <CreditCard className="w-3.5 h-3.5" />
                        : <Landmark className="w-3.5 h-3.5" />
                      }
                    </div>

                    {/* Name + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(entry.dueDate), 'EEE, d MMM yyyy')}
                        {' · '}
                        <span className="capitalize">{entry.type === 'bnpl' ? 'BNPL' : 'Commitment'}</span>
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {formatRM(entry.amount)}
                    </p>

                    {/* Urgency badge */}
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
