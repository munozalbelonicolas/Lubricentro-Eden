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

  getBestSellers: async (params = {}) => {
    const res = await API.get('/finance/stats/best-sellers', { params });
    return res.data;
  },

  getFinanceEvolution: async (params = {}) => {
    const res = await API.get('/finance/stats/evolution', { params });
    return res.data;
  },

  getProductEvolution: async (productId) => {
    const res = await API.get(`/finance/stats/product/${productId}`);
    return res.data;
  },

  getSiteVisits: async (params = {}) => {
    const res = await API.get('/finance/stats/visits', { params });
    return res.data;
  },
  
  createExpense: async (data) => {
    const res = await API.post('/finance/expenses', data);
    return res.data;
  },
  
  deleteExpense: async (id) => {
    const res = await API.delete(`/finance/expenses/${id}`);
    return res.data;
  },

  createLocalSale: async (data) => {
    const res = await API.post('/finance/sales', data);
    return res.data;
  },
  
  getLocalSales: async (params = {}) => {
    const res = await API.get('/finance/sales', { params });
    return res.data;
  },

  deleteLocalSale: async (id) => {
    const res = await API.delete(`/finance/sales/${id}`);
    return res.data;
  }
};
