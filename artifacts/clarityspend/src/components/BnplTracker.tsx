import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Trash2, Plus, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BnplTracker() {
  const { budget, bnplItems, addBnplItem, removeBnplItem } = useSpendStore();

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [error, setError] = useState('');

  const totalMonthly = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);

  const monthlyPreview = (() => {
    const t = parseFloat(totalAmount);
    const n = parseInt(installments, 10);
    if (!isNaN(t) && t > 0 && !isNaN(n) && n >= 1) {
      return t / n;
    }
    return null;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const t = parseFloat(totalAmount);
    const n = parseInt(installments, 10);
    if (!name.trim()) { setError('Please enter an item name.'); return; }
    if (isNaN(t) || t <= 0) { setError('Enter a valid total amount.'); return; }
    if (isNaN(n) || n < 1 || n > 120) { setError('Installments must be between 1 and 120 months.'); return; }
    addBnplItem({ name: name.trim(), totalAmount: t, installments: n });
    setName('');
    setTotalAmount('');
    setInstallments('');
  };

  const budgetWarning = budget !== null && totalMonthly > budget * 0.5;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-sky-400" />
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">BNPL Tracker</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Track Buy Now, Pay Later plans and see how they affect your monthly budget.
        </p>

        {/* Add form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Item Name</label>
              <Input
                placeholder="e.g. MacBook Air"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Total Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => { setTotalAmount(e.target.value); setError(''); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-14"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Installments (months)</label>
              <Input
                type="number"
                placeholder="e.g. 12"
                min="1"
                max="120"
                step="1"
                value={installments}
                onChange={(e) => { setInstallments(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {/* Monthly preview */}
          <AnimatePresence>
            {monthlyPreview !== null && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200"
              >
                <CalendarClock className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="text-sm text-sky-700">
                  Monthly payment: <span className="font-bold">{formatRM(monthlyPreview)}</span>
                  {installments && ` × ${installments} months`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white"
            disabled={!name.trim() || !totalAmount || !installments}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add BNPL Plan
          </Button>
        </form>

        {/* List */}
        <AnimatePresence>
          {bnplItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Active Plans <span className="text-muted-foreground font-normal">({bnplItems.length})</span>
                </p>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {bnplItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRM(item.totalAmount)} total · {item.installments} months
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-sky-700">{formatRM(item.monthlyPayment)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                      </div>
                      <button
                        onClick={() => removeBnplItem(item.id)}
                        className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        aria-label="Remove plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Total commitment summary */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
                budgetWarning
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-sky-50 border-sky-200'
              }`}>
                <div>
                  <p className={`text-sm font-bold ${budgetWarning ? 'text-orange-800' : 'text-sky-800'}`}>
                    Total Monthly Commitment
                  </p>
                  <p className={`text-xs mt-0.5 ${budgetWarning ? 'text-orange-600' : 'text-sky-600'}`}>
                    {budgetWarning
                      ? 'BNPL plans are taking over 50% of your budget'
                      : `Locked-in monthly obligation across ${bnplItems.length} plan${bnplItems.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${budgetWarning ? 'text-orange-700' : 'text-sky-700'}`}>
                  {formatRM(totalMonthly)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
