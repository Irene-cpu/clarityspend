import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ResultLevel = 'safe' | 'careful' | 'risky' | 'over';

interface EvalResult {
  level: ResultLevel;
  headline: string;
  message: string;
  remainingAfter: number;
  pricePercent: number;
}

function getLevel(price: number, remaining: number, budget: number): ResultLevel {
  if (remaining <= 0) return 'over';
  if (price > remaining) return 'risky';
  if (price / remaining > 0.5) return 'careful';
  return 'safe';
}

const levelConfig: Record<ResultLevel, {
  icon: React.ReactNode;
  label: string;
  card: string;
  headline: string;
  text: string;
  badge: string;
  bar: string;
}> = {
  safe: {
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    label: 'Safe to Spend',
    card: 'bg-emerald-50 border-emerald-200',
    headline: 'text-emerald-800',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-400',
  },
  careful: {
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    label: 'Be Careful',
    card: 'bg-orange-50 border-orange-200',
    headline: 'text-orange-800',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    bar: 'bg-orange-400',
  },
  risky: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    label: 'Risky Purchase',
    card: 'bg-red-50 border-red-200',
    headline: 'text-red-800',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    bar: 'bg-red-400',
  },
  over: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    label: 'Over Budget',
    card: 'bg-red-50 border-red-200',
    headline: 'text-red-800',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    bar: 'bg-red-500',
  },
};

export function DecisionAssistant() {
  const { budget, expenses } = useSpendStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = (budget ?? 0) - totalSpent;
  const noBudget = budget === null;

  const evaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget) return;
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) return;

    const level = getLevel(p, remaining, budget);
    const remainingAfter = remaining - p;
    const pricePercent = (p / budget) * 100;

    const messages: Record<ResultLevel, string> = {
      safe: `You can comfortably afford ${name || 'this'}. You'll have ${formatRM(remainingAfter)} left after this purchase.`,
      careful: `${name || 'This'} would use up more than half of your remaining budget. You'd have ${formatRM(remainingAfter)} left.`,
      risky: `${name || 'This'} costs ${formatRM(Math.abs(remainingAfter))} more than what you have left. Consider waiting.`,
      over: `You're already ${formatRM(Math.abs(remaining))} over your budget. Adding more spending isn't recommended.`,
    };

    setResult({ level, headline: levelConfig[level].label, message: messages[level], remainingAfter, pricePercent });
  };

  const reset = () => {
    setName('');
    setPrice('');
    setResult(null);
  };

  const cfg = result ? levelConfig[result.level] : null;
  const canSubmit = !noBudget && name.trim() !== '' && price !== '' && !isNaN(parseFloat(price)) && parseFloat(price) > 0;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-violet-400" />
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Should I Buy This?</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Enter a potential purchase to instantly see if it fits your budget.
        </p>

        <form onSubmit={evaluate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Purchase Name</label>
              <Input
                placeholder="e.g. New Headphones"
                value={name}
                onChange={(e) => { setName(e.target.value); setResult(null); }}
                disabled={noBudget}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Purchase Price</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setResult(null); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-14"
                disabled={noBudget}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" disabled={!canSubmit}>
              Evaluate Purchase
            </Button>
            {result && (
              <Button type="button" variant="outline" onClick={reset} className="shrink-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {noBudget && (
            <p className="text-sm text-center text-muted-foreground">
              Please set a monthly budget first.
            </p>
          )}
        </form>

        <AnimatePresence>
          {result && cfg && (
            <motion.div
              key={result.level + result.message}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mt-5"
            >
              <div className={`rounded-2xl border p-5 ${cfg.card} transition-all duration-300`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-base font-bold ${cfg.headline}`}>{result.headline}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {result.pricePercent.toFixed(1)}% of budget
                      </span>
                    </div>
                    <p className={`mt-1.5 text-sm leading-relaxed ${cfg.text}`}>{result.message}</p>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget used after purchase</span>
                        <span className={`font-semibold ${cfg.text}`}>
                          {budget ? Math.min(((totalSpent + parseFloat(price)) / budget) * 100, 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${budget ? Math.min(((totalSpent + parseFloat(price)) / budget) * 100, 100) : 0}%`,
                          }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${cfg.bar}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
