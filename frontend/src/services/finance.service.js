import API from './api';

export const financeService = {
  getStats: async (params = {}) => {
    const res = await API.get('/finance/stats', { params });
    return res.data;
  },
  
  getTransactions: async (params = {}) => {
    const res = await API.get('/finance/transactions', { params });
    return res.data;
  },

  getBestSellers: async () => {
    const res = await API.get('/finance/stats/best-sellers');
    return res.data;
  },

  getFinanceEvolution: async () => {
    const res = await API.get('/finance/stats/evolution');
    return res.data;
  },

  getProductEvolution: async (productId) => {
    const res = await API.get(`/finance/stats/product/${productId}`);
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
