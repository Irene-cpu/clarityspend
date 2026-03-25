import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food:           '#34d399',
  Transportation: '#60a5fa',
  Shopping:       '#a78bfa',
  Bills:          '#fb923c',
  Entertainment:  '#f472b6',
  Other:          '#94a3b8',
};

interface ChartEntry {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

export function SpendingChart() {
  const { expenses } = useSpendStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (expenses.length === 0) return null;

  // Aggregate by category — use userShare for split bills so chart matches dashboard totals
  const totals = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.userShare ?? e.amount);
    return acc;
  }, {});

  const grandTotal = Object.values(totals).reduce((s, v) => s + (v ?? 0), 0);

  const data: ChartEntry[] = (Object.entries(totals) as [ExpenseCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
      color: CATEGORY_COLORS[category],
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden bg-white">
        <div className="h-1 w-full bg-violet-300" />
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">Spending by Category</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{data.length} {data.length === 1 ? 'category' : 'categories'} · {formatRM(grandTotal)} total</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut chart */}
            <div className="relative w-[180px] h-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={data.length > 1 ? 3 : 0}
                    dataKey="amount"
                    strokeWidth={0}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label — acts as the single tooltip on hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
                <AnimatePresence mode="wait">
                  {activeIndex !== null ? (
                    <motion.div
                      key={data[activeIndex].category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="text-center w-full"
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide truncate"
                        style={{ color: data[activeIndex].color }}
                      >
                        {data[activeIndex].category}
                      </p>
                      <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                        {formatRM(data[activeIndex].amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {data[activeIndex].percentage.toFixed(1)}%
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-center"
                    >
                      <p className="text-xs text-muted-foreground font-medium">Total</p>
                      <p className="text-sm font-bold text-foreground">{formatRM(grandTotal)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2.5 min-w-0">
              {data.map((entry, index) => (
                <motion.div
                  key={entry.category}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="group"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover:scale-125"
                      style={{ background: entry.color }}
                    />
                    <span className="text-xs font-semibold text-foreground flex-1">{entry.category}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{entry.percentage.toFixed(1)}%</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{formatRM(entry.amount)}</span>
                  </div>
                  <div className="ml-[18px] h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.percentage}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + index * 0.06, ease: 'easeOut' }}
                      className="h-full rounded-full transition-opacity duration-200"
                      style={{
                        background: entry.color,
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
