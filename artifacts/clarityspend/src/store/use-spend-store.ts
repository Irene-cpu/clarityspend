import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpenseCategory = 'Food' | 'Transportation' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';
export type PaymentType = 'Normal' | 'SplitBill' | 'Treat';

export interface Expense {
  id: string;
  name: string;
  /** Full amount paid (before splitting) */
  amount: number;
  category: ExpenseCategory;
  date: string;
  /** How this expense was paid — defaults to 'Normal' for legacy entries */
  paymentType?: PaymentType;
  /** Number of people splitting (only for SplitBill) */
  splitPeople?: number;
  /** User's actual cost: amount / splitPeople for SplitBill, or amount for Normal/Treat */
  userShare?: number;
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

export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  /** ISO date string */
  date: string;
  /** If true, counted every month. If false, only counted in the month of its date. */
  recurring: boolean;
}

interface SpendState {
  budget: number | null;
  expenses: Expense[];
  bnplItems: BnplItem[];
  commitments: Commitment[];
  incomeEntries: IncomeEntry[];

  /** Transient (not persisted) — id of the expense currently being edited */
  editingExpenseId: string | null;

  setBudget: (amount: number) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
  setEditingExpenseId: (id: string | null) => void;

  addBnplItem: (item: Omit<BnplItem, 'id' | 'monthlyPayment'>) => void;
  updateBnplItem: (id: string, updates: Omit<BnplItem, 'id' | 'monthlyPayment'>) => void;
  removeBnplItem: (id: string) => void;

  addCommitment: (commitment: Omit<Commitment, 'id'>) => void;
  updateCommitment: (id: string, updates: Omit<Commitment, 'id'>) => void;
  removeCommitment: (id: string) => void;

  addIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  removeIncome: (id: string) => void;
}

export const useSpendStore = create<SpendState>()(
  persist(
    (set) => ({
      budget: null,
      expenses: [],
      bnplItems: [],
      commitments: [],
      incomeEntries: [],
      editingExpenseId: null,

      setBudget: (amount) => set({ budget: amount }),

      addExpense: (expense) => set((state) => ({
        expenses: [{ ...expense, id: crypto.randomUUID() }, ...state.expenses],
      })),

      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((e) => e.id === id ? { ...e, ...updates } : e),
        editingExpenseId: null,
      })),

      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        editingExpenseId: state.editingExpenseId === id ? null : state.editingExpenseId,
      })),

      clearExpenses: () => set({ expenses: [], editingExpenseId: null }),

      setEditingExpenseId: (id) => set({ editingExpenseId: id }),

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

      updateBnplItem: (id, updates) => set((state) => ({
        bnplItems: state.bnplItems.map((b) =>
          b.id !== id ? b : {
            ...b,
            ...updates,
            monthlyPayment: parseFloat((updates.totalAmount / updates.installments).toFixed(2)),
          }
        ),
      })),

      removeBnplItem: (id) => set((state) => ({
        bnplItems: state.bnplItems.filter((b) => b.id !== id),
      })),

      addCommitment: (commitment) => set((state) => ({
        commitments: [{ ...commitment, id: crypto.randomUUID() }, ...state.commitments],
      })),

      updateCommitment: (id, updates) => set((state) => ({
        commitments: state.commitments.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),

      removeCommitment: (id) => set((state) => ({
        commitments: state.commitments.filter((c) => c.id !== id),
      })),

      addIncome: (entry) => set((state) => ({
        incomeEntries: [{ ...entry, id: crypto.randomUUID() }, ...state.incomeEntries],
      })),

      removeIncome: (id) => set((state) => ({
        incomeEntries: state.incomeEntries.filter((e) => e.id !== id),
      })),
    }),
    {
      name: 'clarityspend-storage',
      // exclude transient UI state from localStorage
      partialize: (state) => ({
        budget: state.budget,
        expenses: state.expenses,
        bnplItems: state.bnplItems,
        commitments: state.commitments,
        incomeEntries: state.incomeEntries,
      }),
    }
  )
);

/** Helper — computes total monthly income from a list of entries. */
export function calcMonthlyIncome(entries: IncomeEntry[]): number {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  return entries.reduce((sum, e) => {
    if (e.recurring) return sum + e.amount;
    const d = new Date(e.date);
    return d.getMonth() === m && d.getFullYear() === y ? sum + e.amount : sum;
  }, 0);
}
