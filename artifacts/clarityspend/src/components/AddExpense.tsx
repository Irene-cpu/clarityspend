import React, { useState } from 'react';
import { useSpendStore, ExpenseCategory } from '@/store/use-spend-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Tag, Receipt } from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Other'];

export function AddExpense() {
  const { addExpense, budget } = useSpendStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (name.trim() && !isNaN(val) && val > 0) {
      addExpense({
        name: name.trim(),
        amount: val,
        category,
      });
      setName('');
      setAmount('');
      setCategory('Food');
    }
  };

  return (
    <Card className="border-none shadow-md shadow-black/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Log an Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Expense Name</label>
              <Input
                placeholder="e.g. Grab Food"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1.5 block text-foreground">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={<span className="font-bold text-foreground">RM</span>}
                className="pl-14"
              />
            </div>
            
            <div className="md:col-span-4">
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
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!name.trim() || !amount || isNaN(parseFloat(amount))}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
          
          {budget === null && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Tip: Set a monthly budget above to track your spending limits.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
