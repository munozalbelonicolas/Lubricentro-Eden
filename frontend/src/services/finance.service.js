import API from './api';

export const financeService = {
  getStats: async () => {
    const res = await API.get('/finance/stats');
    return res.data;
  },
  
  getTransactions: async (params = {}) => {
    const res = await API.get('/finance/transactions', { params });
    return res.data;
  },
  
  createExpense: async (data) => {
    const res = await API.post('/finance/expenses', data);
    return res.data;
  },
  
  deleteExpense: async (id) => {
    const res = await API.delete(`/finance/expenses/${id}`);
    return res.data;
  }
};
