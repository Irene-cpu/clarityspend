import React, { useState, useEffect, useRef } from 'react';
import { useSpendStore, ExpenseCategory, PaymentType } from '@/store/use-spend-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Tag, Receipt, Users, Heart, Banknote, Pencil, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatRM } from '@/lib/utils';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Other'];

const PAYMENT_TYPES: { type: PaymentType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'Normal',    label: 'Normal',     icon: <Banknote className="w-3.5 h-3.5" />, description: 'Paid by you' },
  { type: 'SplitBill', label: 'Split Bill', icon: <Users className="w-3.5 h-3.5" />,    description: 'Share cost' },
  { type: 'Treat',     label: 'Treat',      icon: <Heart className="w-3.5 h-3.5" />,    description: 'Paid for others' },
];

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function AddExpense() {
  const { addExpense, updateExpense, budget, expenses, editingExpenseId, setEditingExpenseId } = useSpendStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(todayStr());
  const [paymentType, setPaymentType] = useState<PaymentType>('Normal');
  const [splitPeople, setSplitPeople] = useState('2');

  const formRef = useRef<HTMLDivElement>(null);
  const isEditing = editingExpenseId !== null;

  // Populate form when an expense is selected for editing
  useEffect(() => {
    if (!editingExpenseId) return;
    const exp = expenses.find((e) => e.id === editingExpenseId);
    if (!exp) return;
    setName(exp.name);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDate(format(new Date(exp.date), 'yyyy-MM-dd'));
    setPaymentType(exp.paymentType ?? 'Normal');
    setSplitPeople(String(exp.splitPeople ?? 2));
    // Scroll into view smoothly
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [editingExpenseId]);

  const amountVal   = parseFloat(amount) || 0;
  const peopleCount = Math.max(2, parseInt(splitPeople) || 2);
  const userShare   = paymentType === 'SplitBill' ? parseFloat((amountVal / peopleCount).toFixed(2)) : amountVal;

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('Food');
    setDate(todayStr());
    setPaymentType('Normal');
    setSplitPeople('2');
    setEditingExpenseId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isNaN(amountVal) || amountVal <= 0) return;

    const isToday = date === todayStr();
    const isoDate = isToday
      ? (isEditing ? expenses.find((ex) => ex.id === editingExpenseId)?.date ?? new Date().toISOString() : new Date().toISOString())
      : date;

    const payload = {
      name: name.trim(),
      amount: amountVal,
      category,
      date: isoDate,
      paymentType,
      splitPeople: paymentType === 'SplitBill' ? peopleCount : undefined,
      userShare: paymentType === 'SplitBill' ? userShare : amountVal,
    };

    if (isEditing && editingExpenseId) {
      updateExpense(editingExpenseId, payload);
    } else {
      addExpense(payload);
    }
    resetForm();
  };

  return (
    <div ref={formRef} id="add-expense-form">
      <Card className={`border-none shadow-md shadow-black/5 transition-all duration-300 ${isEditing ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isEditing
                ? <><Pencil className="w-5 h-5 text-amber-500" /> Edit Expense</>
                : <><Receipt className="w-5 h-5 text-primary" /> Log an Expense</>
              }
            </CardTitle>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel edit
              </button>
            )}
          </div>
          {isEditing && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-1">
              Editing an existing expense — make your changes and click Save.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment type toggle */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_TYPES.map(({ type, label, icon, description }) => {
                  const active = paymentType === type;
                  const activeStyles: Record<PaymentType, string> = {
                    Normal:    'border-primary bg-primary/5 text-primary',
                    SplitBill: 'border-blue-500 bg-blue-50 text-blue-700',
                    Treat:     'border-pink-500 bg-pink-50 text-pink-700',
                  };
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 text-center transition-all duration-150 ${
                        active
                          ? activeStyles[type]
                          : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40'
                      }`}
                    >
                      <span className={active ? '' : 'opacity-60'}>{icon}</span>
                      <span className="text-xs font-semibold leading-none">{label}</span>
                      <span className="text-[10px] leading-none opacity-70 hidden sm:block">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main row: name, amount, category, date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-sm font-medium mb-1.5 block text-foreground">Expense Name</label>
                <Input
                  placeholder="e.g. Grab Food"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  icon={<span className="font-semibold text-foreground text-sm">RM</span>}
                  className="pl-11"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Category</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Tag className="w-4 h-4" />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full h-12 rounded-xl border-2 border-border bg-white px-4 pl-11 py-2 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-transparent border-r-transparent border-t-foreground border-l-[5px] border-r-[5px] border-t-[5px]" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Date</label>
                <Input
                  type="date"
                  value={date}
                  max={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Split bill details */}
            {paymentType === 'SplitBill' && (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium mb-1.5 block text-blue-800">
                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                    Number of People (including you)
                  </label>
                  <Input
                    type="number"
                    min="2"
                    step="1"
                    placeholder="2"
                    value={splitPeople}
                    onChange={(e) => setSplitPeople(e.target.value)}
                    className="bg-white border-blue-300 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                  />
                </div>
                <div className="sm:pb-0 w-full sm:w-auto">
                  <p className="text-xs text-blue-600 font-medium mb-1">Your share</p>
                  <div className="h-12 flex items-center justify-center sm:justify-start px-4 rounded-xl bg-white border-2 border-blue-300 min-w-[140px]">
                    {amountVal > 0 ? (
                      <span className="text-base font-bold text-blue-700 tabular-nums">
                        {formatRM(userShare)}
                      </span>
                    ) : (
                      <span className="text-sm text-blue-400">Enter amount</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Treat info */}
            {paymentType === 'Treat' && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-200">
                <Heart className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-pink-800">Treat — Paid for others</p>
                  <p className="text-xs text-pink-600 mt-0.5">The full amount counts toward your spending. The expense will be tagged as a treat in your history.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className={`flex-1 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                disabled={!name.trim() || !amount || isNaN(parseFloat(amount))}
              >
                {isEditing
                  ? <><Pencil className="w-4 h-4 mr-2" /> Save Changes</>
                  : <><Plus className="w-5 h-5 mr-2" /> Add Expense</>
                }
              </Button>
            </div>

            {!isEditing && budget === null && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Tip: Set a monthly budget above to track your spending limits.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
