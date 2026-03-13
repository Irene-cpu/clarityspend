import React from 'react';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, History, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  Food: 'bg-green-100 text-green-700 border-green-200',
  Transportation: 'bg-blue-100 text-blue-700 border-blue-200',
  Shopping: 'bg-purple-100 text-purple-700 border-purple-200',
  Bills: 'bg-orange-100 text-orange-700 border-orange-200',
  Entertainment: 'bg-pink-100 text-pink-700 border-pink-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function ExpenseHistory() {
  const { expenses, removeExpense, clearExpenses } = useSpendStore();

  return (
    <Card className="border-none shadow-md shadow-black/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Recent Expenses
        </CardTitle>
        {expenses.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearExpenses} className="text-muted-foreground hover:text-destructive">
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h4 className="text-lg font-medium text-foreground">No expenses yet</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              When you add an expense, it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${CATEGORY_STYLES[expense.category]}`}>
                        {expense.category}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expense.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(expense.date), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-foreground font-display">
                        {formatRM(expense.amount)}
                      </p>
                      <button
                        onClick={() => removeExpense(expense.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
