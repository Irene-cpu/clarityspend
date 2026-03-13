import React from 'react';
import { useSpendStore } from '@/store/use-spend-store';
import { formatRM } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingDown, CircleDollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function DashboardStats() {
  const { budget, expenses } = useSpendStore();
  
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = (budget || 0) - totalSpent;
  const percentageUsed = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;
  
  const isOverBudget = remaining < 0;

  if (budget === null) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <Card className="overflow-hidden bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <h4 className="text-2xl font-bold text-foreground mt-1">{formatRM(budget)}</h4>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent Card */}
        <Card className="overflow-hidden bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <h4 className="text-2xl font-bold text-foreground mt-1">{formatRM(totalSpent)}</h4>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Card */}
        <Card className={`overflow-hidden transition-colors duration-300 ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-medium ${isOverBudget ? 'text-red-700/80' : 'text-green-700/80'}`}>
                {isOverBudget ? 'Over Budget By' : 'Remaining'}
              </p>
              <h4 className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                {formatRM(Math.abs(remaining))}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar Area */}
      <Card className="overflow-hidden bg-white border-none shadow-md shadow-black/5">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h4 className="font-semibold text-foreground">Budget Usage</h4>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                {isOverBudget ? (
                  <><AlertCircle className="w-4 h-4 text-destructive" /> You've exceeded your monthly budget.</>
                ) : (
                  <>You're within budget. Keep it up!</>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-display">{percentageUsed.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentageUsed}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
