import React, { useState } from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DecisionAssistant() {
  const { budget, expenses } = useSpendStore();
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [decision, setDecision] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
    percentage: number;
    remainingAfter: number;
  } | null>(null);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = (budget || 0) - totalSpent;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget) return;
    
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) return;

    const remainingAfter = remainingBudget - price;
    const percentage = (price / budget) * 100;

    let status: 'success' | 'warning' | 'error' = 'success';
    let message = '';

    if (remainingBudget <= 0) {
      status = 'error';
      message = "You're already over budget. Consider skipping this purchase.";
    } else if (remainingAfter >= 0) {
      status = 'success';
      message = `Yes, you can afford it! You'll have ${formatRM(remainingAfter)} remaining.`;
    } else {
      status = 'warning';
      message = `Tight budget! This would put you ${formatRM(Math.abs(remainingAfter))} over budget.`;
    }

    setDecision({ status, message, percentage, remainingAfter });
  };

  const handleReset = () => {
    setItemName('');
    setItemPrice('');
    setDecision(null);
  };

  const disabled = budget === null;

  return (
    <Card className="border-none bg-gradient-to-br from-primary/5 to-transparent shadow-md shadow-primary/5 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Purchase Decision Assistant
        </CardTitle>
        <CardDescription>
          Not sure if you should buy something? Let's check your budget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Item Name</label>
              <Input
                placeholder="e.g. New Headphones"
                value={itemName}
                onChange={(e) => { setItemName(e.target.value); setDecision(null); }}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Item Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => { setItemPrice(e.target.value); setDecision(null); }}
                icon={<span className="font-bold text-foreground">RM</span>}
                className="pl-14"
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={disabled || !itemName.trim() || !itemPrice || isNaN(parseFloat(itemPrice))}
            >
              Can I Afford It?
            </Button>
            {decision && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>

          {disabled && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please set a budget first.
            </p>
          )}
        </form>

        <AnimatePresence>
          {decision && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              <div className={`p-5 rounded-2xl border ${
                decision.status === 'success' ? 'bg-green-50 border-green-200' :
                decision.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {decision.status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                    {decision.status === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
                    {decision.status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${
                      decision.status === 'success' ? 'text-green-800' :
                      decision.status === 'warning' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {decision.status === 'success' ? 'Go for it!' :
                       decision.status === 'warning' ? 'Think twice' :
                       'Better not'}
                    </h4>
                    <p className={`mt-1 font-medium ${
                      decision.status === 'success' ? 'text-green-700' :
                      decision.status === 'warning' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {decision.message}
                    </p>
                    <div className="mt-4 pt-4 border-t border-black/5">
                      <p className={`text-sm ${
                        decision.status === 'success' ? 'text-green-700/80' :
                        decision.status === 'warning' ? 'text-yellow-700/80' :
                        'text-red-700/80'
                      }`}>
                        This item represents <strong className="font-bold">{decision.percentage.toFixed(1)}%</strong> of your monthly budget.
                      </p>
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
