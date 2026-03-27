// Budget constants for both phases
// Total allocated: 490 PHP, remaining 10 PHP auto-routes to Savings
export const FIXED_INCOME = 500;
export const AUTO_SOBRA = 10;

export const PHASE_BUDGET = {
  1: {
    label: 'Phase 1 (Weeks 1-2)',
    items: [
      { id: 'lunch',       label: 'School Fund',       amount: 40 },
      { id: 'monthsary',   label: 'Monthsary Fund',    amount: 50 },
      { id: 'credit',      label: 'Credit Payment',    amount: 250 },
      { id: 'debt',        label: 'Short-term Debt',   amount: 100 },
      { id: 'contingency', label: 'Contingency Fund',  amount: 50 },
    ],
  },
  2: {
    label: 'Phase 2 (Weeks 3-4)',
    items: [
      { id: 'lunch',       label: 'School Fund',       amount: 40 },
      { id: 'monthsary',   label: 'Monthsary Fund',    amount: 50 },
      { id: 'credit',      label: 'Credit Payment',    amount: 250 },
      { id: 'debt',        label: 'Short-term Debt',   amount: 0 },
      { id: 'contingency', label: 'Contingency Fund',  amount: 150 },
    ],
  },
};
