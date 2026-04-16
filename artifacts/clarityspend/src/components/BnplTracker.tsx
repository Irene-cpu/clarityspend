import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Trash2, Plus, CalendarClock, CalendarDays, Pencil, X, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export function BnplTracker() {
  const { budget, bnplItems, addBnplItem, updateBnplItem, removeBnplItem, toggleBnplPaid, bnplPaidAtMissing } = useSpendStore();

  function isPaidThisMonth(paidAt?: string): boolean {
    if (!paidAt) return false;
    const d = new Date(paidAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditing = editingId !== null;
  const totalMonthly = bnplItems.reduce((sum, b) => sum + b.monthlyPayment, 0);

  const monthlyPreview = (() => {
    const t = parseFloat(totalAmount);
    const n = parseInt(installments, 10);
    if (!isNaN(t) && t > 0 && !isNaN(n) && n >= 1) return t / n;
    return null;
  })();

  const startEdit = (id: string) => {
    const item = bnplItems.find((b) => b.id === id);
    if (!item) return;
    setEditingId(id);
    setName(item.name);
    setTotalAmount(String(item.totalAmount));
    setInstallments(String(item.installments));
    setDueDate(item.dueDate ?? '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setTotalAmount('');
    setInstallments('');
    setDueDate('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const t = parseFloat(totalAmount);
    const n = parseInt(installments, 10);
    if (!name.trim()) { setError('Please enter an item name.'); return; }
    if (isNaN(t) || t <= 0) { setError('Enter a valid total amount.'); return; }
    if (isNaN(n) || n < 1 || n > 120) { setError('Installments must be between 1 and 120 months.'); return; }

    if (isEditing && editingId) {
      updateBnplItem(editingId, { name: name.trim(), totalAmount: t, installments: n, dueDate: dueDate || undefined });
      cancelEdit();
    } else {
      addBnplItem({ name: name.trim(), totalAmount: t, installments: n, dueDate: dueDate || undefined });
      setName('');
      setTotalAmount('');
      setInstallments('');
      setDueDate('');
    }
  };

  const budgetWarning = budget !== null && totalMonthly > budget * 0.5;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-sky-400" />
      <CardContent className="p-6">

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">BNPL Tracker</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Track Buy Now, Pay Later plans. Set a due date so upcoming payments are tracked automatically.
        </p>

        {/* paid_at column missing warning */}
        {bnplPaidAtMissing && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">Paid status can't be saved</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  The <code className="bg-amber-100 rounded px-1">paid_at</code> column is missing from your
                  Supabase <code className="bg-amber-100 rounded px-1">bnpl_items</code> table.
                  Run this SQL in your{' '}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                    className="underline font-medium">Supabase SQL Editor</a>:
                </p>
                <pre className="mt-2 text-[10px] bg-amber-100 rounded-lg p-2.5 overflow-x-auto text-amber-900 leading-relaxed select-all">{
`ALTER TABLE bnpl_items ADD COLUMN IF NOT EXISTS paid_at timestamptz;`
                }</pre>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Editing BNPL plan</span>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
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
                className="pl-11"
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
            <div className="col-span-2 sm:col-span-1">
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
              className={`flex-1 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
              disabled={!name.trim() || !totalAmount || !installments}
            >
              {isEditing
                ? <><Pencil className="w-4 h-4 mr-1.5" /> Save Changes</>
                : <><Plus className="w-4 h-4 mr-1.5" /> Add BNPL Plan</>
              }
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {bnplItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">
                Active Plans <span className="text-muted-foreground font-normal">({bnplItems.length})</span>
              </p>

              <div className="space-y-2">
                <AnimatePresence>
                  {bnplItems.map((item) => {
                    const isBeingEdited = editingId === item.id;
                    const paid = isPaidThisMonth(item.paidAt);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-150 ${
                          isBeingEdited
                            ? 'bg-amber-50 border-amber-300'
                            : paid
                            ? 'bg-emerald-50 border-emerald-200 opacity-75'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isBeingEdited ? 'bg-amber-100 text-amber-600'
                          : paid ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-sky-100 text-sky-600'
                        }`}>
                          {paid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-col sm:flex-row sm:items-center sm:flex-wrap">
                            <p className={`text-sm font-semibold whitespace-normal leading-tight min-w-[120px] ${paid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {item.name}
                            </p>
                            {paid && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                                Paid this month
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            {item.dueDate
                              ? <><CalendarDays className="w-3 h-3 shrink-0" />{format(parseISO(item.dueDate), 'd MMM yyyy')} · {item.installments} months</>
                              : `${formatRM(item.totalAmount)} total · ${item.installments} months`
                            }
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${paid ? 'text-muted-foreground' : 'text-sky-700'}`}>
                            {formatRM(item.monthlyPayment)}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </p>
                        </div>
                        {/* Mark as paid / undo */}
                        <button
                          onClick={() => toggleBnplPaid(item.id)}
                          aria-label={paid ? 'Undo paid' : 'Mark as paid'}
                          title={paid ? 'Undo paid' : 'Mark as paid'}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            paid
                              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                              : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {paid ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => startEdit(item.id)}
                          aria-label="Edit plan"
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isBeingEdited
                              ? 'bg-amber-200 text-amber-700'
                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeBnplItem(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          aria-label="Remove plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
                budgetWarning ? 'bg-orange-50 border-orange-200' : 'bg-sky-50 border-sky-200'
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
