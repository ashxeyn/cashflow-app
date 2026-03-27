import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { api } from '../utils/api';
import { AUTO_SOBRA, PHASE_BUDGET, FIXED_INCOME } from '../constants/budget';

const AppContext = createContext();

const initialState = {
  sobraBalance: 0,
  contingencyTotal: 0,
  monthsaryTotal: 0,
  creditDebtRemaining: 0,
  checklist: [],
  checklistActive: false,
  sobraWishlist: [],
  loading: true,
};

function buildChecklist(phase) {
  return PHASE_BUDGET[phase].items
    .filter((i) => i.amount > 0)
    .map((i) => ({ ...i, checked: false }));
}

// Map DB row → app state shape
function dbToState(row, checklist, savings) {
  return {
    sobraBalance: parseFloat(row.sobra_balance) || 0,
    contingencyTotal: parseFloat(row.contingency_total) || 0,
    monthsaryTotal: parseFloat(row.monthsary_total) || 0,
    creditDebtRemaining: parseFloat(row.credit_debt_remaining) || 0,
    checklistActive: !!row.checklist_active,
    fifteenthStartDate: row.fifteenth_start_date || null,
    fifteenthMonthsDone: row.fifteenth_months_done || 0,
    checklist: checklist.map((i) => ({
      id: i.item_id,
      label: i.label,
      amount: parseFloat(i.amount),
      checked: !!i.checked,
    })),
    sobraWishlist: savings.map((i) => ({
      id: i.id,
      label: i.label,
      goal: parseFloat(i.goal_amount),
      funded: parseFloat(i.funded_amount),
    })),
    loading: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CHECKLIST':
      return { ...state, checklist: action.payload, checklistActive: true };
    case 'UPDATE_CHECKLIST':
      return { ...state, checklist: action.payload };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    case 'SET_SAVINGS':
      return { ...state, sobraWishlist: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load everything from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const [dbState, checklist, savings] = await Promise.all([
          api.getState(),
          api.getChecklist(),
          api.getSavings(),
        ]);
        dispatch({ type: 'LOAD', payload: dbToState(dbState, checklist, savings) });
      } catch (e) {
        console.error('Failed to load from API', e);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const actions = {
    refreshState: async () => {
      const [dbState, checklist, savings] = await Promise.all([
        api.getState(),
        api.getChecklist(),
        api.getSavings(),
      ]);
      dispatch({ type: 'LOAD', payload: dbToState(dbState, checklist, savings) });
    },

    setPhase: async (phase) => {
      await api.patchState({ phase });
    },

    logIncome: async () => {
      const items = buildChecklist(state.phase);
      const [checklist] = await Promise.all([
        api.resetChecklist(items),
        api.patchState({ checklist_active: 1 }),
        api.logTransaction({ type: 'income', label: 'Fixed Income +500 PHP', amount: FIXED_INCOME }),
      ]);
      dispatch({
        type: 'SET_CHECKLIST',
        payload: checklist.map((i) => ({
          id: i.item_id, label: i.label,
          amount: parseFloat(i.amount), checked: !!i.checked,
        })),
      });
    },

    toggleItem: async (itemId) => {
      const item = state.checklist.find((i) => i.id === itemId);
      if (!item) return;

      const updatedChecklist = await api.toggleItem(itemId);
      const mapped = updatedChecklist.map((i) => ({
        id: i.item_id, label: i.label,
        amount: parseFloat(i.amount), checked: !!i.checked,
      }));

      // Compute new fund totals
      let { contingencyTotal, monthsaryTotal, creditDebtRemaining, sobraBalance } = state;
      const nowChecked = !item.checked;
      const delta = nowChecked ? item.amount : -item.amount;

      if (item.id === 'contingency') contingencyTotal = Math.max(0, contingencyTotal + delta);
      if (item.id === 'monthsary')   monthsaryTotal   = Math.max(0, monthsaryTotal + delta);
      if (item.id === 'credit')      creditDebtRemaining = Math.max(0, creditDebtRemaining + delta);

      // Auto-save ₱10 when all items checked
      const allChecked = mapped.every((i) => i.checked);
      const wasAllChecked = state.checklist.every((i) => i.checked);
      if (allChecked && !wasAllChecked) sobraBalance += AUTO_SOBRA;

      await api.patchState({
        contingency_total: contingencyTotal,
        monthsary_total: monthsaryTotal,
        credit_debt_remaining: creditDebtRemaining,
        sobra_balance: sobraBalance,
      });

      dispatch({
        type: 'UPDATE_STATE',
        payload: { checklist: mapped, contingencyTotal, monthsaryTotal, creditDebtRemaining, sobraBalance },
      });
    },

    logWindfall: async ({ debtCrusher, sobraAmount, bufferAmount }) => {
      const total = debtCrusher + sobraAmount + bufferAmount;
      const newDebt   = state.creditDebtRemaining + debtCrusher;
      const newSobra  = state.sobraBalance + sobraAmount;
      const newBuffer = state.contingencyTotal + bufferAmount;

      let newPaidThisMonth = 0;
      if (debtCrusher > 0) {
        try {
          const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
          const creditRes = await fetch(`${url}/api/credit/monthly`);
          if (creditRes.ok) {
            const creditData = await creditRes.json();
            newPaidThisMonth = creditData.paidThisMonth + debtCrusher;
          }
        } catch (e) {
          console.error('Failed to grab monthly credit for windfall', e);
        }
      }

      const updatePayload = {
        credit_debt_remaining: newDebt,
        sobra_balance: newSobra,
        contingency_total: newBuffer,
      };
      if (debtCrusher > 0 && newPaidThisMonth > 0) {
        updatePayload.credit_paid_this_month = newPaidThisMonth;
      }

      await Promise.all([
        api.patchState(updatePayload),
        api.logTransaction({ type: 'windfall', label: 'Windfall distributed', amount: total,
          meta: { debtCrusher, sobraAmount, bufferAmount } }),
      ]);

      dispatch({
        type: 'UPDATE_STATE',
        payload: { creditDebtRemaining: newDebt, sobraBalance: newSobra, contingencyTotal: newBuffer },
      });
    },

    spendFromFund: async (fund, amount, note) => {
      const BASE = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${BASE}/api/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fund, amount, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Refresh state from returned DB row
      const row = data.state;
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          sobraBalance:        parseFloat(row.sobra_balance) || 0,
          contingencyTotal:    parseFloat(row.contingency_total) || 0,
          monthsaryTotal:      parseFloat(row.monthsary_total) || 0,
          creditDebtRemaining: parseFloat(row.credit_debt_remaining) || 0,
        },
      });
    },

    editSavingsGoal: async (id, label, goal) => {
      const updated = await api.editSaving(id, label, goal);
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          sobraWishlist: state.sobraWishlist.map((i) =>
            i.id === id ? { ...i, label: updated.label, goal: parseFloat(updated.goal_amount) } : i
          ),
        },
      });
    },

    addSavingsGoal: async (label, goal) => {
      const item = await api.addSaving(label, goal);
      dispatch({
        type: 'SET_SAVINGS',
        payload: [...state.sobraWishlist, {
          id: item.id, label: item.label,
          goal: parseFloat(item.goal_amount), funded: parseFloat(item.funded_amount),
        }],
      });
    },

    withdrawFromGoal: async (id, amount) => {
      const res = await api.withdrawFromGoal(id, amount);
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          sobraWishlist: state.sobraWishlist.map((i) =>
            i.id === id ? { ...i, funded: parseFloat(res.goal.funded_amount) } : i
          ),
        },
      });
    },

    returnFromGoal: async (id, amount) => {
      const res = await api.returnFromGoal(id, amount);
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          sobraBalance: res.sobraBalance,
          sobraWishlist: state.sobraWishlist.map((i) =>
            i.id === id ? { ...i, funded: parseFloat(res.goal.funded_amount) } : i
          ),
        },
      });
    },

    fundSavingsGoal: async (id, amount) => {
      if (amount > state.sobraBalance) throw new Error('Insufficient savings');
      const updated = await api.fundSaving(id, amount);
      const newSobra = state.sobraBalance - amount;
      await api.patchState({ sobra_balance: newSobra });
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          sobraBalance: newSobra,
          sobraWishlist: state.sobraWishlist.map((i) =>
            i.id === id ? { ...i, funded: parseFloat(updated.funded_amount) } : i
          ),
        },
      });
    },

    removeSavingsGoal: async (id) => {
      await api.deleteSaving(id);
      dispatch({
        type: 'SET_SAVINGS',
        payload: state.sobraWishlist.filter((i) => i.id !== id),
      });
    },
  };

  const allocatedFunds = (state.contingencyTotal || 0) + (state.monthsaryTotal || 0);
  const totalBalance = allocatedFunds + (state.sobraBalance || 0);

  return (
    <AppContext.Provider value={{ state, actions, allocatedFunds, totalBalance }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
