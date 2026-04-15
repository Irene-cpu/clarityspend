import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, DollarSign } from 'lucide-react';
import { formatRM } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function BudgetSetup() {
  const { budget, setBudget } = useSpendStore();
  const [amount, setAmount] = useState(budget ? budget.toString() : '');
  const [isEditing, setIsEditing] = useState(budget === null);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      setBudget(val);
      setIsEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  return (
    <Card className="relative overflow-hidden border-none shadow-lg shadow-primary/5">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader>
        <CardTitle>Budget Setup</CardTitle>
        <CardDescription>Set your monthly spending limit to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pb-2 sm:pb-0">
            <div className="relative flex-1 w-full">
              <Input
                type="number"
                placeholder="e.g. 2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={<span className="font-bold text-foreground">RM</span>}
                className="pl-14 text-lg font-medium"
                autoFocus
              />
              <p className="absolute -bottom-5 left-2 text-[10.5px] text-muted-foreground whitespace-nowrap">This is your total monthly spending limit</p>
            </div>
            <Button type="submit" className="w-full sm:w-auto mt-6 sm:mt-0" disabled={!amount || isNaN(parseFloat(amount))}>
              Set Budget
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Monthly Budget</p>
                <p className="text-xl font-bold text-foreground">{formatRM(budget!)}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        )}
        
        <AnimatePresence>
          {justSaved && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-3 text-sm text-primary font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Budget successfully updated
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
