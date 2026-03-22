import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Landmark, Trash2, Plus, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const COMMITMENT_SUGGESTIONS = ['Rent', 'Credit Card', 'Insurance', 'Car Loan', 'Utilities', 'Internet', 'Gym'];

export function MonthlyCommitments() {
  const { budget, commitments, addCommitment, removeCommitment } = useSpendStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const budgetWarning = budget !== null && totalCommitments > budget * 0.6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!name.trim()) { setError('Please enter a commitment name.'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    addCommitment({ name: name.trim(), amount: amt, dueDate: dueDate || undefined });
    setName('');
    setAmount('');
    setDueDate('');
  };

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-teal-400" />
      <CardContent className="p-6">

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Monthly Commitments</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Fixed recurring payments deducted from your available money each month.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {COMMITMENT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Commitment Name</label>
              <Input
                placeholder="e.g. Rent, Credit Card"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Monthly Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-14"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Due Date <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            disabled={!name.trim() || !amount}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Commitment
          </Button>
        </form>

        <AnimatePresence>
          {commitments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">
                Active Commitments <span className="text-muted-foreground font-normal">({commitments.length})</span>
              </p>

              <div className="space-y-2">
                <AnimatePresence>
                  {commitments.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                        <Landmark className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          {c.dueDate
                            ? <><CalendarDays className="w-3 h-3" />{format(parseISO(c.dueDate), 'd MMM yyyy')}</>
                            : 'No due date set'
                          }
                        </p>
                      </div>
                      <p className="text-sm font-bold text-teal-700 shrink-0">
                        {formatRM(c.amount)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                      <button
                        onClick={() => removeCommitment(c.id)}
                        className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        aria-label="Remove commitment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
                budgetWarning ? 'bg-orange-50 border-orange-200' : 'bg-teal-50 border-teal-200'
              }`}>
                <div>
                  <p className={`text-sm font-bold ${budgetWarning ? 'text-orange-800' : 'text-teal-800'}`}>
                    Total Monthly Commitments
                  </p>
                  <p className={`text-xs mt-0.5 ${budgetWarning ? 'text-orange-600' : 'text-teal-600'}`}>
                    {budgetWarning
                      ? 'Commitments exceed 60% of your budget'
                      : `Recurring obligations across ${commitments.length} item${commitments.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${budgetWarning ? 'text-orange-700' : 'text-teal-700'}`}>
                  {formatRM(totalCommitments)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
