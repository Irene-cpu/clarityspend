import React, { useEffect, useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM, getRollingDueDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Trash2, Plus, CalendarDays, Pencil, X, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const COMMITMENT_SUGGESTIONS = ['Rent', 'Credit Card', 'Insurance', 'Car Loan', 'Utilities', 'Internet', 'Gym'];

export function MonthlyCommitments() {
  const {
    budget,
    commitments,
    addCommitment,
    updateCommitment,
    removeCommitment,
    toggleCommitmentPaid,
    resetPaidCommitmentsForNewMonth,
  } = useSpendStore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleTogglePaid = async (id: string) => {
    if (togglingId) return;   // prevent double-click
    setTogglingId(id);
    try {
      await toggleCommitmentPaid(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update paid status.';
      toast({
        variant: 'destructive',
        title: 'Could not save paid status',
        description: msg,
      });
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    resetPaidCommitmentsForNewMonth();
  }, []);

  const isEditing = editingId !== null;
  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const budgetWarning = budget !== null && totalCommitments > budget * 0.6;
  const paidCount = commitments.filter((c) => !!c.paidAt).length;
  const allPaid = commitments.length > 0 && paidCount === commitments.length;

  const startEdit = (id: string) => {
    const c = commitments.find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    setName(c.name);
    setAmount(String(c.amount));
    setDueDate(c.dueDate ?? '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setDueDate('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!name.trim()) { setError('Please enter a commitment name.'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }

    if (isEditing && editingId) {
      updateCommitment(editingId, { name: name.trim(), amount: amt, dueDate: dueDate || undefined });
      cancelEdit();
    } else {
      addCommitment({ name: name.trim(), amount: amt, dueDate: dueDate || undefined });
      setName('');
      setAmount('');
      setDueDate('');
    }
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
          Fixed recurring payments. Set a due date so upcoming payments are tracked automatically.
        </p>

        {!isEditing && (
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
        )}

        {isEditing && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Editing commitment</span>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        )}

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
                className="pl-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Due Date <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            {isEditing && (
              <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className={`flex-1 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
              disabled={!name.trim() || !amount}
            >
              {isEditing
                ? <><Pencil className="w-4 h-4 mr-1.5" /> Save Changes</>
                : <><Plus className="w-4 h-4 mr-1.5" /> Add Commitment</>
              }
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {commitments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              {/* Header row with paid counter */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Active Commitments <span className="text-muted-foreground font-normal">({commitments.length})</span>
                </p>
                {commitments.length > 0 && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    allPaid
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : paidCount > 0
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {paidCount}/{commitments.length} paid this month
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {commitments.map((c) => {
                    const isBeingEdited = editingId === c.id;
                    const isPaid = !!c.paidAt;

                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-200 ${
                          isBeingEdited
                            ? 'bg-amber-50 border-amber-300'
                            : isPaid
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {/* Mark as Paid toggle */}
                        <button
                          onClick={() => handleTogglePaid(c.id)}
                          disabled={!!togglingId}
                          aria-label={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                          title={isPaid ? 'Click to unmark' : 'Mark as paid'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isBeingEdited
                              ? 'bg-amber-100 text-amber-500 cursor-default pointer-events-none'
                              : togglingId === c.id
                              ? 'bg-slate-100 text-slate-400 cursor-wait'
                              : isPaid
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-teal-100 hover:text-teal-600'
                          }`}
                        >
                          {togglingId === c.id ? (
                            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : isPaid ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Name + date */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate leading-snug transition-colors duration-200 ${
                            isPaid ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {c.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            {isPaid
                              ? <><CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /><span className="text-green-600">Paid {format(new Date(c.paidAt!), 'd MMM')}</span></>
                              : c.dueDate
                              ? <><CalendarDays className="w-3 h-3 shrink-0" />{format(getRollingDueDate(c.dueDate), 'd MMM yyyy')}</>
                              : 'No due date set'
                            }
                          </p>
                        </div>

                        {/* Amount */}
                        <p className={`text-sm font-bold shrink-0 transition-colors duration-200 ${isPaid ? 'text-muted-foreground' : 'text-teal-700'}`}>
                          {formatRM(c.amount)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                        </p>

                        {/* Edit */}
                        <button
                          onClick={() => startEdit(c.id)}
                          aria-label="Edit commitment"
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isBeingEdited
                              ? 'bg-amber-200 text-amber-700'
                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => removeCommitment(c.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          aria-label="Remove commitment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* All-paid celebration banner */}
              <AnimatePresence>
                {allPaid && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-800">All commitments paid this month!</p>
                      <p className="text-xs text-green-600 mt-0.5">Great job staying on top of your bills.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Total row */}
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
