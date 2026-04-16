import React, { useState } from 'react';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Receipt, ReceiptText, Users, Heart, Pencil, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isYesterday, startOfMonth, subMonths, addMonths, isSameMonth, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_STYLES_MAP: Partial<Record<string, { badge: string; dot: string }>> = {
  Food:           { badge: 'bg-green-100 text-green-700 border-green-200',      dot: 'bg-green-400' },
  Transportation: { badge: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-400' },
  Shopping:       { badge: 'bg-purple-100 text-purple-700 border-purple-200',   dot: 'bg-purple-400' },
  Bills:          { badge: 'bg-orange-100 text-orange-700 border-orange-200',   dot: 'bg-orange-400' },
  Entertainment:  { badge: 'bg-pink-100 text-pink-700 border-pink-200',        dot: 'bg-pink-400' },
  Other:          { badge: 'bg-gray-100 text-gray-600 border-gray-200',        dot: 'bg-gray-400' },
  // Legacy — kept so old 'Savings' expense rows from DB still render
  Savings:        { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};
const FALLBACK_STYLE = { badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
function getCategoryStyle(category: string) {
  return CATEGORY_STYLES_MAP[category] ?? FALLBACK_STYLE;
}

export function ExpenseHistory() {
  const { expenses, removeExpense, clearExpenses, editingExpenseId, setEditingExpenseId } = useSpendStore();

  const [viewDate, setViewDate] = useState<Date>(() => startOfMonth(new Date()));

  const now = new Date();
  const isCurrentMonth = isSameMonth(viewDate, now);

  const goPrev = () => setViewDate((d) => startOfMonth(subMonths(d, 1)));
  const goNext = () => { if (!isCurrentMonth) setViewDate((d) => startOfMonth(addMonths(d, 1))); };

  // All expenses sorted newest-first, then filtered to the viewed month
  const allSorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const monthExpenses = allSorted.filter((e) => isSameMonth(parseISO(e.date), viewDate));

  const handleEdit = (id: string) => {
    setEditingExpenseId(id);
    document.getElementById('add-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const groupedExpensesList = React.useMemo(() => {
    const map = new Map<string, typeof monthExpenses>();
    for (const e of monthExpenses) {
      const key = e.date.substring(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((k, index) => {
      const dateObj = parseISO(k);
      const dailyTotal = map.get(k)!.reduce((sum, exp) => sum + (exp.userShare ?? exp.amount), 0);
      return { 
        dateKey: k,
        dateObj,
        expenses: map.get(k)!, 
        index,
        dailyTotal 
      };
    });
  }, [monthExpenses]);

  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleCollapse = (dateKey: string, index: number) => {
    setCollapsedDates(prev => {
      const isCurrentlyExpanded = prev[dateKey] !== undefined ? !prev[dateKey] : index < 2;
      return { ...prev, [dateKey]: isCurrentlyExpanded }; // We set it to true (collapsed) if it was currently expanded
    });
  };

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-slate-300" />
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">Expense History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'}
                {expenses.length !== monthExpenses.length && (
                  <span className="ml-1 opacity-60">· {expenses.length} total</span>
                )}
              </p>
            </div>
          </div>
          {expenses.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-8 px-3"
                >
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all expenses?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your expense entries across all months. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearExpenses}
                    className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600"
                  >
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-slate-50/60">
          <button
            onClick={goPrev}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200 transition-colors duration-150"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-foreground">
            {format(viewDate, 'MMMM yyyy')}
            {isCurrentMonth && (
              <span className="ml-1.5 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                This month
              </span>
            )}
          </span>

          <button
            onClick={goNext}
            disabled={isCurrentMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Empty state — no expenses at all */}
        {expenses.length === 0 && (
          <div className="py-14 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-foreground">No expenses yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
              Add your first expense above and it will appear here.
            </p>
          </div>
        )}

        {/* Empty state — no expenses this month but other months have data */}
        {expenses.length > 0 && monthExpenses.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-foreground">No expenses in {format(viewDate, 'MMMM yyyy')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isCurrentMonth ? 'Add an expense above to get started.' : 'Use the arrows to browse other months.'}
            </p>
          </div>
        )}

        {/* List — filtered to viewed month, sorted newest first */}
        {groupedExpensesList.length > 0 && (
          <div className="divide-y divide-border">
            {groupedExpensesList.map((group) => {
              const isCollapsed = collapsedDates[group.dateKey] !== undefined 
                ? collapsedDates[group.dateKey] 
                : group.index >= 2;
                
              const label = isToday(group.dateObj) ? 'Today' 
                          : isYesterday(group.dateObj) ? 'Yesterday' 
                          : format(group.dateObj, 'MMM d');
              
              return (
                <div key={group.dateKey} className="flex flex-col">
                  {/* Header */}
                  <button 
                    onClick={() => toggleCollapse(group.dateKey, group.index)}
                    className="flex flex-row items-center justify-between w-full px-5 py-3 bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{label}</span>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" /> : <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{formatRM(group.dailyTotal)}</span>
                  </button>
                  
                  {/* Expenses List */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.ul 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="divide-y divide-border overflow-hidden"
                      >
                        {group.expenses.map((expense, index) => {
                          const style       = getCategoryStyle(expense.category);
                          const expenseDate = new Date(expense.date);
                          const showTime    = isToday(expenseDate);
                          const isSplit     = expense.paymentType === 'SplitBill';
                          const isTreat     = expense.paymentType === 'Treat';
                          const displayAmt  = expense.userShare ?? expense.amount;
                          const isBeingEdited = editingExpenseId === expense.id;

                          return (
                            <motion.li
                              key={expense.id}
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -12, height: 0 }}
                              transition={{ duration: 0.22, delay: index === 0 ? 0 : 0 }}
                              className={`flex items-start gap-3 px-5 py-3.5 transition-colors duration-150 ${
                                isBeingEdited
                                  ? 'bg-amber-50 border-l-2 border-amber-400'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Color dot */}
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${style.dot}`} />

                              {/* Name + date + tags */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                                    {expense.name}
                                  </p>
                                  {isSplit && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                                      <Users className="w-2.5 h-2.5" />
                                      Split {expense.splitPeople}
                                    </span>
                                  )}
                                  {isTreat && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700 border border-pink-200 shrink-0">
                                      <Heart className="w-2.5 h-2.5" />
                                      Treat
                                    </span>
                                  )}
                                  {isBeingEdited && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                      <Pencil className="w-2.5 h-2.5" />
                                      Editing
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {showTime ? (
                                    format(expenseDate, 'h:mm a')
                                  ) : (
                                    format(expenseDate, 'MMM d')
                                  )}
                                  {isSplit && expense.splitPeople && (
                                    <>
                                      <span className="mx-1 opacity-40">·</span>
                                      Full: {formatRM(expense.amount)}
                                    </>
                                  )}
                                </p>
                              </div>

                              {/* Category badge */}
                              <span className={`hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${style.badge}`}>
                                {expense.category}
                              </span>

                              {/* Amount */}
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-foreground tabular-nums">
                                  {formatRM(displayAmt)}
                                </p>
                                {isSplit && (
                                  <p className="text-[10px] text-muted-foreground tabular-nums">
                                    your share
                                  </p>
                                )}
                              </div>

                              {/* Edit */}
                              <button
                                onClick={() => handleEdit(expense.id)}
                                aria-label={`Edit ${expense.name}`}
                                className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors duration-150 mt-0.5 ml-1 ${
                                  isBeingEdited
                                    ? 'bg-amber-200 text-amber-700'
                                    : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-500'
                                }`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => removeExpense(expense.id)}
                                aria-label={`Delete ${expense.name}`}
                                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors duration-150 mt-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
