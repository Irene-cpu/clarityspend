import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PiggyBank, Trash2, Plus, Pencil, X, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SavingsGoals() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, removeSavingsGoal } = useSpendStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [error, setError] = useState('');

  // Which goal is being fully edited (name + amounts)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Inline "update progress" — just the saved amount field
  const [progressEditId, setProgressEditId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState('');

  const isEditing = editingId !== null;

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setSavedAmount('');
    setError('');
    setEditingId(null);
  };

  const startEdit = (id: string) => {
    const g = savingsGoals.find((x) => x.id === id);
    if (!g) return;
    setEditingId(id);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setSavedAmount(String(g.savedAmount));
    setError('');
    setProgressEditId(null);
  };

  const startProgressEdit = (id: string) => {
    const g = savingsGoals.find((x) => x.id === id);
    if (!g) return;
    setProgressEditId(id);
    setProgressValue(String(g.savedAmount));
    setEditingId(null);
    resetForm();
  };

  const saveProgress = (id: string) => {
    const val = parseFloat(progressValue);
    if (isNaN(val) || val < 0) return;
    const goal = savingsGoals.find((g) => g.id === id);
    if (!goal) return;
    updateSavingsGoal(id, { savedAmount: Math.min(val, goal.targetAmount) });
    setProgressEditId(null);
    setProgressValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const target = parseFloat(targetAmount);
    const saved  = parseFloat(savedAmount || '0');
    if (!name.trim())             { setError('Please enter a goal name.'); return; }
    if (isNaN(target) || target <= 0) { setError('Enter a valid target amount.'); return; }
    if (isNaN(saved)  || saved < 0)   { setError('Saved amount cannot be negative.'); return; }
    if (saved > target)           { setError('Saved amount cannot exceed target.'); return; }

    if (isEditing && editingId) {
      updateSavingsGoal(editingId, { name: name.trim(), targetAmount: target, savedAmount: saved });
      resetForm();
    } else {
      addSavingsGoal({ name: name.trim(), targetAmount: target, savedAmount: saved });
      resetForm();
    }
  };

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = savingsGoals.reduce((s, g) => s + g.savedAmount,  0);
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 w-full bg-emerald-400" />
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <PiggyBank className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Savings Goals</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 ml-[2.625rem]">
          Set a target, track your progress, and update your savings anytime.
        </p>

        {/* Edit banner */}
        {isEditing && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Editing goal</span>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Goal Name</label>
              <Input
                placeholder="e.g. Emergency Fund"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Target Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => { setTargetAmount(e.target.value); setError(''); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Currently Saved <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={savedAmount}
                onChange={(e) => { setSavedAmount(e.target.value); setError(''); }}
                icon={<span className="font-bold text-foreground text-sm">RM</span>}
                className="pl-11"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            {isEditing && (
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                <X className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            )}
            <Button
              type="submit"
              className={`flex-1 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              disabled={!name.trim() || !targetAmount}
            >
              {isEditing
                ? <><Pencil className="w-4 h-4 mr-1.5" /> Save Changes</>
                : <><Plus  className="w-4 h-4 mr-1.5" /> Add Goal</>
              }
            </Button>
          </div>
        </form>

        {/* Goal list */}
        <AnimatePresence>
          {savingsGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">
                Your Goals <span className="text-muted-foreground font-normal">({savingsGoals.length})</span>
              </p>

              <div className="space-y-3">
                <AnimatePresence>
                  {savingsGoals.map((goal) => {
                    const pct       = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
                    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
                    const completed = pct >= 100;
                    const beingEdited = editingId === goal.id;

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`rounded-xl border p-4 transition-colors duration-150 ${
                          beingEdited  ? 'bg-amber-50 border-amber-300'  :
                          completed    ? 'bg-emerald-50 border-emerald-300' :
                          'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {/* Title row */}
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            beingEdited ? 'bg-amber-100 text-amber-600' :
                            completed   ? 'bg-emerald-100 text-emerald-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {completed ? <CheckCircle2 className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground truncate">{goal.name}</p>
                              {completed && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                                  Completed!
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Target: <span className="font-medium text-foreground">{formatRM(goal.targetAmount)}</span>
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(goal.id)}
                              aria-label="Edit goal"
                              className={`p-1.5 rounded-lg transition-colors ${
                                beingEdited
                                  ? 'bg-amber-200 text-amber-700'
                                  : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeSavingsGoal(goal.id)}
                              aria-label="Remove goal"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">
                              Saved: <span className="font-semibold text-foreground">{formatRM(goal.savedAmount)}</span>
                            </span>
                            <span className={`font-bold ${completed ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-full ${completed ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                            />
                          </div>
                          {!completed && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRM(remaining)} remaining
                            </p>
                          )}
                        </div>

                        {/* Inline progress update */}
                        {progressEditId === goal.id ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={goal.targetAmount}
                              step="0.01"
                              value={progressValue}
                              onChange={(e) => setProgressValue(e.target.value)}
                              placeholder="New saved amount"
                              icon={<span className="font-bold text-foreground text-sm">RM</span>}
                              className="pl-11 h-8 text-sm flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); saveProgress(goal.id); }
                                if (e.key === 'Escape') { setProgressEditId(null); }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => saveProgress(goal.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setProgressEditId(null)}
                              className="h-8 px-2"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          !beingEdited && (
                            <button
                              onClick={() => startProgressEdit(goal.id)}
                              className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              Update progress
                            </button>
                          )
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Overall summary */}
              {savingsGoals.length > 1 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-emerald-50 border-emerald-200">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Overall Progress</p>
                    <p className="text-xs mt-0.5 text-emerald-600">
                      {formatRM(totalSaved)} saved of {formatRM(totalTarget)}
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-emerald-700">{overallPct}%</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
