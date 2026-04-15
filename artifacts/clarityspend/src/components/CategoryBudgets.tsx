import React, { useState } from 'react';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Utensils, Car, ShoppingBag, Zap, Music, MoreHorizontal,
  Pencil, X, BarChart3, Trash2, CheckCircle2, AlertCircle, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Category metadata ─────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = [
  'Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Other',
];

const META: Record<ExpenseCategory, {
  icon: React.ElementType;
  accentBar: string;
  iconBg: string;
  iconText: string;
  overBg: string;
  overAccent: string;
  progressGreen: string;
  progressOrange: string;
  progressRed: string;
  trackGreen: string;
  trackOrange: string;
  trackRed: string;
}> = {
  Food:           { icon: Utensils,      accentBar: 'bg-green-400',   iconBg: 'bg-green-50',   iconText: 'text-green-600',   overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-green-400',   progressOrange: 'bg-orange-400', progressRed: 'bg-red-500', trackGreen: 'bg-green-100', trackOrange: 'bg-orange-100', trackRed: 'bg-red-100' },
  Transportation: { icon: Car,           accentBar: 'bg-blue-400',    iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-blue-400',    progressOrange: 'bg-orange-400', progressRed: 'bg-red-500', trackGreen: 'bg-blue-100',  trackOrange: 'bg-orange-100', trackRed: 'bg-red-100' },
  Shopping:       { icon: ShoppingBag,   accentBar: 'bg-purple-400',  iconBg: 'bg-purple-50',  iconText: 'text-purple-600',  overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-purple-400',  progressOrange: 'bg-orange-400', progressRed: 'bg-red-500', trackGreen: 'bg-purple-100', trackOrange: 'bg-orange-100', trackRed: 'bg-red-100' },
  Bills:          { icon: Zap,           accentBar: 'bg-orange-400',  iconBg: 'bg-orange-50',  iconText: 'text-orange-600',  overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-orange-400',  progressOrange: 'bg-orange-500', progressRed: 'bg-red-500', trackGreen: 'bg-orange-100', trackOrange: 'bg-orange-200', trackRed: 'bg-red-100' },
  Entertainment:  { icon: Music,         accentBar: 'bg-pink-400',    iconBg: 'bg-pink-50',    iconText: 'text-pink-600',    overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-pink-400',    progressOrange: 'bg-orange-400', progressRed: 'bg-red-500', trackGreen: 'bg-pink-100',  trackOrange: 'bg-orange-100', trackRed: 'bg-red-100' },
  Other:          { icon: MoreHorizontal,accentBar: 'bg-slate-400',   iconBg: 'bg-slate-50',   iconText: 'text-slate-500',   overBg: 'bg-red-50 border-red-200',   overAccent: 'bg-red-500',   progressGreen: 'bg-slate-400',   progressOrange: 'bg-orange-400', progressRed: 'bg-red-500', trackGreen: 'bg-slate-100', trackOrange: 'bg-orange-100', trackRed: 'bg-red-100' },
};

// ─── Single category row ───────────────────────────────────────────────────────

function CategoryRow({
  category,
  spent,
  budget,
  onSave,
  onRemove,
  delay,
}: {
  category: ExpenseCategory;
  spent: number;
  budget: number | undefined;
  onSave: (amount: number | null) => void;
  onRemove: () => void;
  delay: number;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const meta = META[category];
  const Icon = meta.icon;

  const hasBudget = budget !== undefined && budget > 0;
  const pct       = hasBudget ? (spent / budget) * 100 : 0;
  const isOver    = hasBudget && spent > budget;
  const isWarn    = hasBudget && !isOver && pct >= 80;

  const level: 'green' | 'orange' | 'red' =
    isOver ? 'red' : isWarn ? 'orange' : 'green';

  const progressColor = level === 'red' ? meta.progressRed : level === 'orange' ? meta.progressOrange : meta.progressGreen;
  const trackColor    = level === 'red' ? meta.trackRed    : level === 'orange' ? meta.trackOrange    : meta.trackGreen;
  const pctColor      = level === 'red' ? 'text-red-600'  : level === 'orange' ? 'text-orange-500'    : 'text-muted-foreground';

  const startEdit = () => {
    setInputVal(hasBudget ? String(budget) : '');
    setEditing(true);
  };

  const saveEdit = () => {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val > 0) {
      onSave(val);
    }
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
        isOver ? 'bg-red-50 border-red-200' : 'bg-white border-border'
      }`}
    >
      {/* Accent top bar */}
      <div className={`h-0.5 w-full ${isOver ? 'bg-red-500' : meta.accentBar}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isOver ? 'bg-red-100 text-red-600' : `${meta.iconBg} ${meta.iconText}`
          }`}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{category}</p>
              {isOver && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-200 text-red-800 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" /> Over budget
                </span>
              )}
              {isWarn && !isOver && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-800 flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> Near limit
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Spent: <span className={`font-semibold ${isOver ? 'text-red-700' : 'text-foreground'}`}>{formatRM(spent)}</span>
              {hasBudget && (
                <span className="ml-1 text-muted-foreground">of {formatRM(budget)}</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {hasBudget && (
              <button
                onClick={onRemove}
                title="Remove budget"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={startEdit}
              title={hasBudget ? 'Edit budget' : 'Set budget'}
              className={`p-1.5 rounded-lg transition-colors ${
                editing
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar — only if budget is set */}
        {hasBudget && (
          <div>
            <div className={`relative h-2 w-full rounded-full overflow-hidden transition-colors duration-300 ${trackColor}`}>
              <motion.div
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors duration-300 ${progressColor}`}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-muted-foreground">
                {isOver
                  ? `${formatRM(spent - budget)} over`
                  : `${formatRM(budget - spent)} left`}
              </span>
              <span className={`text-[11px] font-bold tabular-nums ${pctColor}`}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* No budget placeholder */}
        {!hasBudget && !editing && (
          <button
            onClick={startEdit}
            className="w-full mt-1 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Set a budget for {category}
          </button>
        )}

        {/* Inline edit */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Budget amount"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  icon={<span className="font-bold text-foreground text-sm">RM</span>}
                  className="pl-11 h-8 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  { e.preventDefault(); saveEdit(); }
                    if (e.key === 'Escape') { cancelEdit(); }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={saveEdit}
                  disabled={!inputVal || isNaN(parseFloat(inputVal)) || parseFloat(inputVal) <= 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="h-8 px-2"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CategoryBudgets() {
  const { expenses, categoryBudgets, setCategoryBudget } = useSpendStore();

  // Current month's expenses per category
  const now = new Date();
  const cm  = now.getMonth();
  const cy  = now.getFullYear();

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === cm && d.getFullYear() === cy;
  });

  const spentByCategory: Partial<Record<ExpenseCategory, number>> = {};
  monthExpenses.forEach((e) => {
    const amount = e.userShare ?? e.amount;
    spentByCategory[e.category] = (spentByCategory[e.category] ?? 0) + amount;
  });

  // Summary counts
  const categoriesWithBudget = CATEGORIES.filter((c) => categoryBudgets[c] !== undefined);
  const overBudgetCount      = categoriesWithBudget.filter((c) => {
    const b = categoryBudgets[c]!;
    const s = spentByCategory[c] ?? 0;
    return s > b;
  }).length;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-primary" />
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Category Budgets</h2>
          </div>
          {categoriesWithBudget.length > 0 && (
            <div className="flex items-center gap-2">
              {overBudgetCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {overBudgetCount} over
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {categoriesWithBudget.length} / {CATEGORIES.length} set
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Set a monthly budget per category. Updates automatically as you log expenses.
        </p>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat, i) => (
            <CategoryRow
              key={cat}
              category={cat}
              spent={spentByCategory[cat] ?? 0}
              budget={categoryBudgets[cat]}
              onSave={(amount) => setCategoryBudget(cat, amount)}
              onRemove={() => setCategoryBudget(cat, null)}
              delay={i * 0.04}
            />
          ))}
        </div>

        {/* Footer tip */}
        {categoriesWithBudget.length === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Click the pencil icon or the dashed button on any category to set a budget.
          </p>
        )}

      </CardContent>
    </Card>
  );
}
