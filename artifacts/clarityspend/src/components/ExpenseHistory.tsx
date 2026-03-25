import React from 'react';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Receipt, ReceiptText, Users, Heart, Pencil } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_STYLES: Record<ExpenseCategory, { badge: string; dot: string }> = {
  Food:           { badge: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-400' },
  Transportation: { badge: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
  Shopping:       { badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  Bills:          { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  Entertainment:  { badge: 'bg-pink-100 text-pink-700 border-pink-200',      dot: 'bg-pink-400' },
  Other:          { badge: 'bg-gray-100 text-gray-600 border-gray-200',      dot: 'bg-gray-400' },
};

export function ExpenseHistory() {
  const { expenses, removeExpense, clearExpenses, editingExpenseId, setEditingExpenseId } = useSpendStore();

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleEdit = (id: string) => {
    setEditingExpenseId(id);
    document.getElementById('add-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              <h2 className="text-base font-bold text-foreground leading-none">Recent Expenses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          {expenses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearExpenses}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-8 px-3"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Empty state */}
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

        {/* List — sorted newest first */}
        {sorted.length > 0 && (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {sorted.map((expense, index) => {
                const style       = CATEGORY_STYLES[expense.category];
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
                        <p className="text-sm font-semibold text-foreground truncate leading-snug">
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
                        {format(expenseDate, 'MMM d, yyyy')}
                        {showTime && (
                          <>
                            <span className="mx-1 opacity-40">·</span>
                            {format(expenseDate, 'h:mm a')}
                          </>
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
                      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors duration-150 mt-0.5 ${
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
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
