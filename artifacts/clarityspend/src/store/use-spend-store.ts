import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpenseCategory = 'Food' | 'Transportation' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface BnplItem {
  id: string;
  name: string;
  totalAmount: number;
  installments: number;
  monthlyPayment: number;
  /** ISO date string (YYYY-MM-DD) for the next payment due date */
  dueDate?: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  /** ISO date string (YYYY-MM-DD) for the next payment due date */
  dueDate?: string;
}

interface SpendState {
  budget: number | null;
  expenses: Expense[];
  bnplItems: BnplItem[];
  commitments: Commitment[];
  setBudget: (amount: number) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
  addBnplItem: (item: Omit<BnplItem, 'id' | 'monthlyPayment'>) => void;
  removeBnplItem: (id: string) => void;
  addCommitment: (commitment: Omit<Commitment, 'id'>) => void;
  removeCommitment: (id: string) => void;
}

export const useSpendStore = create<SpendState>()(
  persist(
    (set) => ({
      budget: null,
      expenses: [],
      bnplItems: [],
      commitments: [],

      setBudget: (amount) => set({ budget: amount }),

      addExpense: (expense) => set((state) => ({
        expenses: [
          { ...expense, id: crypto.randomUUID(), date: new Date().toISOString() },
          ...state.expenses,
        ],
      })),

      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      })),

      clearExpenses: () => set({ expenses: [] }),

      addBnplItem: (item) => set((state) => ({
        bnplItems: [
          {
            ...item,
            id: crypto.randomUUID(),
            monthlyPayment: parseFloat((item.totalAmount / item.installments).toFixed(2)),
          },
          ...state.bnplItems,
        ],
      })),

      removeBnplItem: (id) => set((state) => ({
        bnplItems: state.bnplItems.filter((b) => b.id !== id),
      })),

      addCommitment: (commitment) => set((state) => ({
        commitments: [
          { ...commitment, id: crypto.randomUUID() },
          ...state.commitments,
        ],
      })),

      removeCommitment: (id) => set((state) => ({
        commitments: state.commitments.filter((c) => c.id !== id),
      })),
    }),
    { name: 'clarityspend-storage' }
  )
);
