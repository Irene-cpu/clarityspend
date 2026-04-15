import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export type ExpenseCategory = 'Food' | 'Transportation' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';
export type PaymentType = 'Normal' | 'SplitBill' | 'Treat';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentType?: PaymentType;
  splitPeople?: number;
  userShare?: number;
}

export interface BnplItem {
  id: string;
  name: string;
  totalAmount: number;
  installments: number;
  monthlyPayment: number;
  dueDate?: string;
  paidAt?: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  dueDate?: string;
  paidAt?: string;
}

export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}

export type CategoryBudgetMap = Partial<Record<ExpenseCategory, number>>;

// ─── DB row mappers ───────────────────────────────────────────────────────────

function mapDbExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: row.amount as number,
    category: row.category as ExpenseCategory,
    date: row.date as string,
    paymentType: row.payment_type as PaymentType | undefined,
    splitPeople: row.split_people as number | undefined,
    userShare: row.user_share as number | undefined,
  };
}

function mapDbBnpl(row: Record<string, unknown>): BnplItem {
  return {
    id: row.id as string,
    name: row.name as string,
    totalAmount: row.total_amount as number,
    installments: row.installments as number,
    monthlyPayment: row.monthly_payment as number,
    dueDate: row.due_date as string | undefined,
    paidAt: row.paid_at as string | undefined,
  };
}

function mapDbCommitment(row: Record<string, unknown>): Commitment {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: row.amount as number,
    dueDate: row.due_date as string | undefined,
    paidAt: row.paid_at as string | undefined,
  };
}

function mapDbIncome(row: Record<string, unknown>): IncomeEntry {
  return {
    id: row.id as string,
    source: row.source as string,
    amount: row.amount as number,
    date: row.date as string,
    recurring: row.recurring as boolean,
  };
}

function mapDbSavingsGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    id: row.id as string,
    name: row.name as string,
    targetAmount: row.target_amount as number,
    savedAmount: row.saved_amount as number,
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface SpendState {
  userId: string | null;
  isLoading: boolean;
  lastResetMonth: string | null;   // "YYYY-MM" of the last month resets ran
  budget: number | null;
  expenses: Expense[];
  bnplItems: BnplItem[];
  commitments: Commitment[];
  incomeEntries: IncomeEntry[];
  savingsGoals: SavingsGoal[];
  categoryBudgets: CategoryBudgetMap;
  editingExpenseId: string | null;

  loadAll: (userId: string) => Promise<void>;
  clearAll: () => void;

  setBudget: (amount: number) => void;
  setCategoryBudget: (category: ExpenseCategory, amount: number | null) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
  setEditingExpenseId: (id: string | null) => void;

  addBnplItem: (item: Omit<BnplItem, 'id' | 'monthlyPayment'>) => void;
  updateBnplItem: (id: string, updates: Omit<BnplItem, 'id' | 'monthlyPayment'>) => void;
  removeBnplItem: (id: string) => void;
  toggleBnplPaid: (id: string) => void;
  resetPaidBnplForNewMonth: () => void;

  addCommitment: (commitment: Omit<Commitment, 'id'>) => void;
  updateCommitment: (id: string, updates: Omit<Commitment, 'id'>) => void;
  removeCommitment: (id: string) => void;
  toggleCommitmentPaid: (id: string) => Promise<void>;
  resetPaidCommitmentsForNewMonth: () => void;

  addIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  removeIncome: (id: string) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id'>>) => void;
  removeSavingsGoal: (id: string) => void;

  runMonthlyResets: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSpendStore = create<SpendState>()(
  persist(
    (set, get) => ({
  userId: null,
  isLoading: false,
  lastResetMonth: null,
  budget: null,
  expenses: [],
  bnplItems: [],
  commitments: [],
  incomeEntries: [],
  savingsGoals: [],
  categoryBudgets: {},
  editingExpenseId: null,

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  loadAll: async (userId) => {
    set({ isLoading: true, userId });
    const [
      { data: expenses },
      { data: bnpl },
      { data: commitments },
      { data: income },
      { data: budget },
      { data: savingsGoals, error: savingsGoalsError },
      { data: catBudgets },
    ] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('bnpl_items').select('*').eq('user_id', userId),
      supabase.from('commitments').select('*').eq('user_id', userId),
      supabase.from('income_entries').select('*').eq('user_id', userId),
      supabase.from('budget').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('category_budgets').select('*').eq('user_id', userId),
    ]);
    // Snapshot local state before overwriting so we can preserve paid status
    // when the paid_at column doesn't yet exist in Supabase (column missing →
    // key is absent from SELECT * rows, vs. column exists + null → key is present with null value).
    const local = get();

    // Merge helper: if the Supabase row has no `paid_at` key at all (column not yet
    // added via ALTER TABLE), keep whatever paidAt is already in local/localStorage state.
    const mergeCommitment = (row: Record<string, unknown>): Commitment => {
      const mapped = mapDbCommitment(row);
      if (!('paid_at' in row)) {
        const localItem = local.commitments.find((c) => c.id === mapped.id);
        if (localItem?.paidAt) return { ...mapped, paidAt: localItem.paidAt };
      }
      return mapped;
    };

    const mergeBnpl = (row: Record<string, unknown>): BnplItem => {
      const mapped = mapDbBnpl(row);
      if (!('paid_at' in row)) {
        const localItem = local.bnplItems.find((b) => b.id === mapped.id);
        if (localItem?.paidAt) return { ...mapped, paidAt: localItem.paidAt };
      }
      return mapped;
    };

    // Build the Supabase-sourced update
    const update: Partial<SpendState> & { isLoading: boolean } = {
      expenses:      (expenses      ?? []).map(mapDbExpense),
      bnplItems:     (bnpl          ?? []).map((r) => mergeBnpl(r as Record<string, unknown>)),
      commitments:   (commitments   ?? []).map((r) => mergeCommitment(r as Record<string, unknown>)),
      incomeEntries: (income        ?? []).map(mapDbIncome),
      budget:        (budget as { amount: number } | null)?.amount ?? null,
      isLoading:     false,
    };

    // Only overwrite savingsGoals if the table exists and Supabase returned successfully.
    // If the table hasn't been created yet, keep whatever persist/localStorage already loaded.
    if (!savingsGoalsError && savingsGoals !== null) {
      update.savingsGoals = (savingsGoals as Record<string, unknown>[]).map(mapDbSavingsGoal);
    } else if (savingsGoalsError) {
      console.warn(
        'savings_goals table not found — keeping local state. Run the SQL in the store file to create it.',
        savingsGoalsError.message,
      );
    }

    // Only overwrite categoryBudgets if Supabase returned rows.
    // If the table doesn't exist yet, keep whatever persist/localStorage already loaded.
    if (catBudgets && catBudgets.length > 0) {
      const dbCatBudgets: CategoryBudgetMap = {};
      (catBudgets as Record<string, unknown>[]).forEach((row) => {
        dbCatBudgets[row.category as ExpenseCategory] = row.budget as number;
      });
      update.categoryBudgets = dbCatBudgets;
    }

    set(update);
  },

  clearAll: () => set({
    userId: null,
    budget: null,
    expenses: [],
    bnplItems: [],
    commitments: [],
    incomeEntries: [],
    savingsGoals: [],
    categoryBudgets: {},
    editingExpenseId: null,
  }),

  // ── Budget ─────────────────────────────────────────────────────────────────

  setBudget: (amount) => {
    set({ budget: amount });
    const { userId } = get();
    if (!userId) return;
    supabase.from('budget')
      .upsert({ user_id: userId, amount }, { onConflict: 'user_id' })
      .then(({ error }) => { if (error) console.error('setBudget:', error); });
  },

  setCategoryBudget: (category, amount) => {
    set((state) => {
      const next = { ...state.categoryBudgets };
      if (amount === null) {
        delete next[category];
      } else {
        next[category] = amount;
      }
      return { categoryBudgets: next };
    });
    const { userId } = get();
    if (!userId) return;
    if (amount === null) {
      supabase.from('category_budgets').delete()
        .eq('user_id', userId).eq('category', category)
        .then(({ error }) => { if (error) console.error('deleteCategoryBudget:', error); });
    } else {
      supabase.from('category_budgets')
        .upsert({ user_id: userId, category, budget: amount }, { onConflict: 'user_id,category' })
        .then(({ error }) => { if (error) console.error('setCategoryBudget:', error); });
    }
  },

  // ── Expenses ───────────────────────────────────────────────────────────────

  addExpense: (expense) => {
    const id = crypto.randomUUID();
    const full: Expense = { ...expense, id };
    set((state) => ({ expenses: [full, ...state.expenses] }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('expenses').insert({
      id,
      user_id:      userId,
      name:         full.name,
      amount:       full.amount,
      category:     full.category,
      date:         full.date,
      payment_type: full.paymentType,
      split_people: full.splitPeople,
      user_share:   full.userShare,
    }).then(({ error }) => { if (error) console.error('addExpense:', error); });
  },

  updateExpense: (id, updates) => {
    set((state) => ({
      expenses: state.expenses.map((e) => e.id === id ? { ...e, ...updates } : e),
      editingExpenseId: null,
    }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('expenses').update({
      name:         updates.name,
      amount:       updates.amount,
      category:     updates.category,
      date:         updates.date,
      payment_type: updates.paymentType,
      split_people: updates.splitPeople,
      user_share:   updates.userShare,
    }).eq('id', id).then(({ error }) => { if (error) console.error('updateExpense:', error); });
  },

  removeExpense: (id) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      editingExpenseId: state.editingExpenseId === id ? null : state.editingExpenseId,
    }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('expenses').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeExpense:', error); });
  },

  clearExpenses: () => {
    set({ expenses: [], editingExpenseId: null });
    const { userId } = get();
    if (!userId) return;
    supabase.from('expenses').delete().eq('user_id', userId)
      .then(({ error }) => { if (error) console.error('clearExpenses:', error); });
  },

  setEditingExpenseId: (id) => set({ editingExpenseId: id }),

  // ── BNPL ───────────────────────────────────────────────────────────────────

  addBnplItem: (item) => {
    const id = crypto.randomUUID();
    const monthlyPayment = parseFloat((item.totalAmount / item.installments).toFixed(2));
    const full: BnplItem = { ...item, id, monthlyPayment };
    set((state) => ({ bnplItems: [full, ...state.bnplItems] }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('bnpl_items').insert({
      id,
      user_id:         userId,
      name:            full.name,
      total_amount:    full.totalAmount,
      installments:    full.installments,
      monthly_payment: full.monthlyPayment,
      due_date:        full.dueDate,
    }).then(({ error }) => { if (error) console.error('addBnplItem:', error); });
  },

  updateBnplItem: (id, updates) => {
    const monthlyPayment = parseFloat((updates.totalAmount / updates.installments).toFixed(2));
    set((state) => ({
      bnplItems: state.bnplItems.map((b) =>
        b.id !== id ? b : { ...b, ...updates, monthlyPayment }
      ),
    }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('bnpl_items').update({
      name:            updates.name,
      total_amount:    updates.totalAmount,
      installments:    updates.installments,
      monthly_payment: monthlyPayment,
      due_date:        updates.dueDate,
    }).eq('id', id).then(({ error }) => { if (error) console.error('updateBnplItem:', error); });
  },

  removeBnplItem: (id) => {
    set((state) => ({ bnplItems: state.bnplItems.filter((b) => b.id !== id) }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('bnpl_items').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeBnplItem:', error); });
  },

  toggleBnplPaid: (id) => {
    const item = get().bnplItems.find((b) => b.id === id);
    if (!item) return;
    const prevPaidAt = item.paidAt;
    const newPaidAt = item.paidAt ? undefined : new Date().toISOString();
    set((state) => ({
      bnplItems: state.bnplItems.map((b) =>
        b.id === id ? { ...b, paidAt: newPaidAt } : b
      ),
    }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('bnpl_items')
      .update({ paid_at: newPaidAt ?? null })
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('toggleBnplPaid: Supabase update failed — paid_at column may need to be added. Run: ALTER TABLE bnpl_items ADD COLUMN IF NOT EXISTS paid_at timestamptz;', error);
          set((state) => ({
            bnplItems: state.bnplItems.map((b) =>
              b.id === id ? { ...b, paidAt: prevPaidAt } : b
            ),
          }));
        }
      });
  },

  resetPaidBnplForNewMonth: () => {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    const { bnplItems, userId } = get();
    const toReset = bnplItems.filter((b) => {
      if (!b.paidAt) return false;
      const paid = new Date(b.paidAt);
      return paid.getMonth() !== cm || paid.getFullYear() !== cy;
    });
    if (toReset.length === 0) return;
    set((state) => ({
      bnplItems: state.bnplItems.map((b) =>
        toReset.some((r) => r.id === b.id) ? { ...b, paidAt: undefined } : b
      ),
    }));
    if (!userId) return;
    Promise.all(
      toReset.map((b) =>
        supabase.from('bnpl_items').update({ paid_at: null }).eq('id', b.id)
      )
    ).then((results) => {
      results.forEach(({ error }, i) => {
        if (error) console.error(`resetPaidBnpl[${toReset[i].id}]:`, error);
      });
    });
  },

  // ── Commitments ────────────────────────────────────────────────────────────

  addCommitment: (commitment) => {
    const id = crypto.randomUUID();
    const full: Commitment = { ...commitment, id };
    set((state) => ({ commitments: [full, ...state.commitments] }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('commitments').insert({
      id,
      user_id:  userId,
      name:     full.name,
      amount:   full.amount,
      due_date: full.dueDate,
      paid_at:  full.paidAt,
    }).then(({ error }) => { if (error) console.error('addCommitment:', error); });
  },

  updateCommitment: (id, updates) => {
    set((state) => ({
      commitments: state.commitments.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('commitments').update({
      name:     updates.name,
      amount:   updates.amount,
      due_date: updates.dueDate,
    }).eq('id', id).then(({ error }) => { if (error) console.error('updateCommitment:', error); });
  },

  removeCommitment: (id) => {
    set((state) => ({ commitments: state.commitments.filter((c) => c.id !== id) }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('commitments').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeCommitment:', error); });
  },

  // ── IMPORTANT: paid_at column must exist in Supabase ──────────────────────
  //
  // If toggling paid status reverts immediately, the paid_at column is missing.
  // Run this SQL in your Supabase SQL Editor to fix it:
  //
  //   ALTER TABLE commitments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
  //   ALTER TABLE bnpl_items  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
  //
  // ──────────────────────────────────────────────────────────────────────────

  toggleCommitmentPaid: async (id) => {
    const commitment = get().commitments.find((c) => c.id === id);
    if (!commitment) return;
    const prevPaidAt = commitment.paidAt;
    const newPaidAt = commitment.paidAt ? undefined : new Date().toISOString();

    // Optimistic update
    set((state) => ({
      commitments: state.commitments.map((c) =>
        c.id === id ? { ...c, paidAt: newPaidAt } : c
      ),
    }));

    const { userId } = get();
    if (!userId) return;

    const { error } = await supabase
      .from('commitments')
      .update({ paid_at: newPaidAt ?? null })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      // Revert the optimistic update
      set((state) => ({
        commitments: state.commitments.map((c) =>
          c.id === id ? { ...c, paidAt: prevPaidAt } : c
        ),
      }));
      console.error(
        '[toggleCommitmentPaid] Supabase UPDATE failed.\n' +
        'If this keeps happening, run this SQL in your Supabase dashboard:\n' +
        '  ALTER TABLE commitments ADD COLUMN IF NOT EXISTS paid_at timestamptz;\n' +
        'Supabase error:', error
      );
      throw new Error(
        error.code === '42703'   // undefined_column
          ? 'The paid_at column is missing from the commitments table. Run the SQL migration shown in the browser console.'
          : `Supabase error (${error.code}): ${error.message}`
      );
    }

    // Success — re-fetch to confirm DB state matches local state
    const { data: rows } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId);

    if (rows) {
      set({ commitments: (rows as Record<string, unknown>[]).map(mapDbCommitment) });
    }
  },

  resetPaidCommitmentsForNewMonth: () => {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    const { commitments, userId } = get();
    const toReset = commitments.filter((c) => {
      if (!c.paidAt) return false;
      const paid = new Date(c.paidAt);
      return paid.getMonth() !== cm || paid.getFullYear() !== cy;
    });
    if (toReset.length === 0) return;
    set((state) => ({
      commitments: state.commitments.map((c) =>
        toReset.some((r) => r.id === c.id) ? { ...c, paidAt: undefined } : c
      ),
    }));
    if (!userId) return;
    Promise.all(
      toReset.map((c) =>
        supabase.from('commitments').update({ paid_at: null }).eq('id', c.id)
      )
    ).then((results) => {
      results.forEach(({ error }, i) => {
        if (error) console.error(`resetPaidCommitment[${toReset[i].id}]:`, error);
      });
    });
  },

  // ── Income ─────────────────────────────────────────────────────────────────

  addIncome: (entry) => {
    const id = crypto.randomUUID();
    const full: IncomeEntry = { ...entry, id };
    set((state) => ({ incomeEntries: [full, ...state.incomeEntries] }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('income_entries').insert({
      id,
      user_id:   userId,
      source:    full.source,
      amount:    full.amount,
      date:      full.date,
      recurring: full.recurring,
    }).then(({ error }) => { if (error) console.error('addIncome:', error); });
  },

  removeIncome: (id) => {
    set((state) => ({ incomeEntries: state.incomeEntries.filter((e) => e.id !== id) }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('income_entries').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeIncome:', error); });
  },

  // ── Savings Goals ──────────────────────────────────────────────────────────
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  SUPABASE SETUP — run this once in the Supabase SQL Editor:             │
  // │                                                                         │
  // │  CREATE TABLE savings_goals (                                           │
  // │    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),            │
  // │    user_id       uuid REFERENCES auth.users NOT NULL,                   │
  // │    name          text NOT NULL,                                         │
  // │    target_amount numeric NOT NULL DEFAULT 0,                            │
  // │    saved_amount  numeric NOT NULL DEFAULT 0,                            │
  // │    created_at    timestamptz DEFAULT now()                              │
  // │  );                                                                     │
  // │  ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;                  │
  // │  CREATE POLICY "Users manage their own savings goals"                   │
  // │    ON savings_goals FOR ALL                                             │
  // │    USING (auth.uid() = user_id);                                        │
  // │                                                                         │
  // │  -- Also run these if paid_at resets on refresh:                       │
  // │  ALTER TABLE bnpl_items    ADD COLUMN IF NOT EXISTS paid_at timestamptz;│
  // │  ALTER TABLE commitments   ADD COLUMN IF NOT EXISTS paid_at timestamptz;│
  // └─────────────────────────────────────────────────────────────────────────┘

  addSavingsGoal: (goal) => {
    const id = crypto.randomUUID();
    const full: SavingsGoal = { ...goal, id };
    set((state) => ({ savingsGoals: [...state.savingsGoals, full] }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('savings_goals').insert({
      id,
      user_id:       userId,
      name:          full.name,
      target_amount: full.targetAmount,
      saved_amount:  full.savedAmount,
    }).then(({ error }) => {
      if (error) {
        console.error('addSavingsGoal: Supabase insert failed. Make sure the savings_goals table exists (see SQL comment above).', error);
        set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) }));
      }
    });
  },

  updateSavingsGoal: (id, updates) => {
    const prev = get().savingsGoals.find((g) => g.id === id);
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) => g.id === id ? { ...g, ...updates } : g),
    }));
    const { userId } = get();
    if (!userId) return;
    const patch: Record<string, unknown> = {};
    if (updates.name          !== undefined) patch.name          = updates.name;
    if (updates.targetAmount  !== undefined) patch.target_amount = updates.targetAmount;
    if (updates.savedAmount   !== undefined) patch.saved_amount  = updates.savedAmount;
    supabase.from('savings_goals')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('updateSavingsGoal:', error);
          if (prev) set((state) => ({ savingsGoals: state.savingsGoals.map((g) => g.id === id ? prev : g) }));
        }
      });
  },

  removeSavingsGoal: (id) => {
    const prev = get().savingsGoals.find((g) => g.id === id);
    set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) }));
    const { userId } = get();
    if (!userId) return;
    supabase.from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('removeSavingsGoal:', error);
          if (prev) set((state) => ({ savingsGoals: [...state.savingsGoals, prev] }));
        }
      });
  },
  // ── Monthly Resets ─────────────────────────────────────────────────────────
  //
  // Called once per login, after loadAll() resolves. Checks whether the
  // current calendar month differs from the last recorded reset month and,
  // if so, clears paid_at on commitments and BNPL items (both locally and
  // in Supabase) so they appear unpaid for the new month.

  runMonthlyResets: () => {
    const now  = new Date();
    const key  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { lastResetMonth, resetPaidCommitmentsForNewMonth, resetPaidBnplForNewMonth } = get();
    if (lastResetMonth === key) return;   // already ran for this month
    resetPaidCommitmentsForNewMonth();
    resetPaidBnplForNewMonth();
    set({ lastResetMonth: key });
  },
}),
{
  name: 'clarityspend-data',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    lastResetMonth:  state.lastResetMonth,
    budget:          state.budget,
    expenses:        state.expenses,
    bnplItems:       state.bnplItems,
    commitments:     state.commitments,
    incomeEntries:   state.incomeEntries,
    savingsGoals:    state.savingsGoals,
    categoryBudgets: state.categoryBudgets,
  }),
}
));

// ─── Helper ───────────────────────────────────────────────────────────────────

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
