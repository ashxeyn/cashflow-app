const BASE = process.env.EXPO_PUBLIC_API_URL;

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return res.json();
};

export const api = {
  // State
  getState:       ()           => req('GET',   '/api/state'),
  patchState:     (fields)     => req('PATCH', '/api/state', fields),

  // Checklist
  getChecklist:   ()           => req('GET',   '/api/checklist'),
  resetChecklist: (items)      => req('POST',  '/api/checklist/reset', { items }),
  toggleItem:     (itemId)     => req('PATCH', `/api/checklist/${itemId}/toggle`),

  // Savings goals
  getSavings:     ()           => req('GET',   '/api/savings'),
  addSaving:      (label, goal_amount) => req('POST', '/api/savings', { label, goal_amount }),
  editSaving:     (id, label, goal_amount) => req('PATCH', `/api/savings/${id}`, { label, goal_amount }),
  withdrawFromGoal: (id, amount) => req('PATCH', `/api/savings/${id}/withdraw`, { amount }),
  returnFromGoal:   (id, amount) => req('PATCH', `/api/savings/${id}/return`, { amount }),
  fundSaving:     (id, amount) => req('PATCH', `/api/savings/${id}/fund`, { amount }),
  deleteSaving:   (id)         => req('DELETE',`/api/savings/${id}`),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = Object.entries(params).filter(([,v]) => v).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return req('GET', `/api/transactions${qs ? '?' + qs : ''}`);
  },
  logTransaction:  (data)      => req('POST',  '/api/transactions', data),

  // Gemini chat
  getGeminiMessages: ()              => req('GET',    '/api/gemini'),
  saveGeminiMessage: (role, text)    => req('POST',   '/api/gemini', { role, text }),
  clearGeminiChat:   ()              => req('DELETE', '/api/gemini'),
};
