import React, { useState } from 'react';
import { useSpendStore, calcMonthlyIncome } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Verdict = 'manageable' | 'tight' | 'stretching';

export function InstalmentCalculator() {
  const { budget, expenses, bnplItems, commitments, incomeEntries } = useSpendStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [months, setMonths] = useState('12');
  const [interest, setInterest] = useState('');
  
  const [result, setResult] = useState<{
    monthly: number;
    total: number;
    verdict: Verdict;
    remainingAfter: number;
    currentCommitPercent: number;
    newCommitPercent: number;
  } | null>(null);

  const now = new Date();
  const cm  = now.getMonth();
  const cy  = now.getFullYear();
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === cm && d.getFullYear() === cy;
  });

  const totalSpent         = monthExpenses.reduce((sum, e) => sum + (e.userShare ?? e.amount), 0);
  const totalBnplMonthly   = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);
  const totalCommitments   = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyIncome = calcMonthlyIncome(incomeEntries);
  const hasIncome          = incomeEntries.length > 0;

  const primaryBase = hasIncome ? totalMonthlyIncome : (budget ?? 0);
  // Free to spend (remaining) based on purely fixed + spent:
  const freeToSpend = primaryBase - totalSpent - totalBnplMonthly - totalCommitments;
  const noBasis     = !hasIncome && budget === null;

  const evaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (noBasis) return;
    const p = parseFloat(price);
    const m = parseInt(months, 10);
    const ir = parseFloat(interest) || 0;
    
    if (isNaN(p) || p <= 0 || isNaN(m) || m <= 0) return;

    // Assuming interest is total interest percentage on the principal
    const totalPaid = p * (1 + ir / 100);
    const monthly   = totalPaid / m;
    
    const remainingAfter = freeToSpend - monthly;
    const currentCommitTotal = totalBnplMonthly + totalCommitments;
    const newCommitTotal = currentCommitTotal + monthly;
    
    const currentCommitPercent = primaryBase > 0 ? (currentCommitTotal / primaryBase) * 100 : 0;
    const newCommitPercent = primaryBase > 0 ? (newCommitTotal / primaryBase) * 100 : 0;

    let verdict: Verdict = 'manageable';
    if (remainingAfter <= 0 || newCommitPercent > 60) {
      verdict = 'stretching';
    } else if (monthly > freeToSpend * 0.5 || newCommitPercent > 40) {
      verdict = 'tight';
    }

    setResult({ monthly, total: totalPaid, verdict, remainingAfter, currentCommitPercent, newCommitPercent });
  };

  const reset = () => { setName(''); setPrice(''); setMonths('12'); setInterest(''); setResult(null); };

  const canSubmit = !noBasis && price !== '' && !isNaN(parseFloat(price)) && parseFloat(price) > 0;

  const verdictConfig: Record<Verdict, {
    icon: React.ReactNode;
    label: string;
    card: string;
    headline: string;
    bar: string;
  }> = {
    manageable: { icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />, label: 'Manageable', card: 'bg-emerald-50 border-emerald-200', headline: 'text-emerald-800', bar: 'bg-emerald-400' },
    tight:      { icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,  label: 'Tight',      card: 'bg-amber-50 border-amber-200',   headline: 'text-amber-800',   bar: 'bg-amber-400' },
    stretching: { icon: <XCircle className="w-6 h-6 text-red-500" />,          label: 'Stretching your budget', card: 'bg-red-50 border-red-200', headline: 'text-red-800', bar: 'bg-red-500' },
  };

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-violet-400" />
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Instalment Calculator</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          See how much a purchase will add to your monthly commitments.
        </p>

        <form onSubmit={evaluate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Item Name <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                placeholder="e.g. iPhone 16"
                value={name}
                onChange={(e) => { setName(e.target.value); setResult(null); }}
                disabled={noBasis}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Total Price</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setResult(null); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-14"
                disabled={noBasis}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Instalment Months</label>
              <Select value={months} onValueChange={(v) => { setMonths(v); setResult(null); }} disabled={noBasis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                  <SelectItem value="36">36 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Total Interest % <span className="text-muted-foreground font-normal">(Optional, e.g. 0% for CC instalment)</span></label>
              <Input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={interest}
                onChange={(e) => { setInterest(e.target.value); setResult(null); }}
                icon={<span className="font-bold text-foreground text-sm">%</span>}
                className="pl-12"
                disabled={noBasis}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" disabled={!canSubmit}>
              Calculate
            </Button>
            {result && (
              <Button type="button" variant="outline" onClick={reset} className="shrink-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {noBasis && (
            <p className="text-sm text-center text-muted-foreground">
              Please add income sources or set a monthly budget first.
            </p>
          )}
        </form>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mt-6"
            >
              <div className={`rounded-2xl border p-5 ${verdictConfig[result.verdict].card} transition-all duration-300`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">{verdictConfig[result.verdict].icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-3">
                      <p className={`text-sm font-semibold uppercase tracking-wide opacity-80 ${verdictConfig[result.verdict].headline}`}>
                        {verdictConfig[result.verdict].label}
                      </p>
                      <h4 className={`text-3xl font-black tracking-tight mt-1 ${verdictConfig[result.verdict].headline}`}>
                        {formatRM(result.monthly)} <span className="text-base font-medium opacity-70">/mo</span>
                      </h4>
                    </div>
                    
                    <p className={`text-sm leading-relaxed opacity-90 ${verdictConfig[result.verdict].headline}`}>
                      {result.total > parseFloat(price) 
                        ? `Total paid is ${formatRM(result.total)} (includes interest). ` 
                        : `Total paid is ${formatRM(result.total)}. `}
                      {result.remainingAfter < 0 
                        ? `This puts your free-to-spend balance in a deficit of ${formatRM(Math.abs(result.remainingAfter))}.` 
                        : `Leaves you with ${formatRM(result.remainingAfter)} free to spend this month.`}
                    </p>

                    <div className="mt-5 space-y-2">
                       <div className="flex justify-between text-xs font-semibold" style={{ color: 'inherit', opacity: 0.8 }}>
                        <span>Commitments vs Income</span>
                        <span>{Math.min(result.newCommitPercent, 100).toFixed(1)}% Usage</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-black/10 overflow-hidden flex">
                        {/* Current commitments */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(result.currentCommitPercent, 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-violet-500"
                        />
                        {/* The new instalment */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(result.newCommitPercent - result.currentCommitPercent, Math.max(0, 100 - result.currentCommitPercent))}%` }}
                          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                          className={`h-full opacity-80 ${verdictConfig[result.verdict].bar}`}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ opacity: 0.7 }}>
                          <div className="w-2 h-2 rounded bg-violet-500" /> Current
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ opacity: 0.7 }}>
                          <div className={`w-2 h-2 rounded opacity-80 ${verdictConfig[result.verdict].bar}`} /> New
                        </div>
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
