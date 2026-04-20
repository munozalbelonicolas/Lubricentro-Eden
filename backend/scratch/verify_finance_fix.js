require('dotenv').config();
const mongoose = require('mongoose');
const FinanceController = require('../src/controllers/finance.controller');

// Mock req, res
const mockReq = (query = {}) => ({
  user: { tenantId: new mongoose.Types.ObjectId('69d2f3e5e85e559ce87e9d19') },
  query
});

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // 1. Test getFinanceStats (no filters)
    console.log('\n--- Testing getFinanceStats (All) ---');
    const res1 = mockRes();
    await FinanceController.getFinanceStats(mockReq(), res1, (err) => console.error('Next called with:', err));
    console.log('Total Income:', res1.body.data.totalIncome);
    console.log('Total Expenses:', res1.body.data.totalExpenses);

    // 2. Test getTransactions (no filters)
    console.log('\n--- Testing getTransactions (All) ---');
    const res2 = mockRes();
    await FinanceController.getTransactions(mockReq(), res2, (err) => console.error('Next called with:', err));
    const localSaleTx = res2.body.data.transactions.filter(t => t.source === 'venta_local');
    console.log(`Found ${localSaleTx.length} local sales in transactions.`);
    if (localSaleTx.length > 0) {
      console.log('Latest Local Sale:', localSaleTx[0].description, '$', localSaleTx[0].amount);
    }

    // 3. Test getTransactions (with date filter for today)
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    console.log(`\n--- Testing getTransactions (Filter: ${startStr}) ---`);
    const res3 = mockRes();
    await FinanceController.getTransactions(mockReq({ startDate: startStr }), res3, (err) => console.error('Next called with:', err));
    const todaySales = res3.body.data.transactions.filter(t => t.source === 'venta_local');
    console.log(`Found ${todaySales.length} local sales for today.`);

  } catch (err) {
    console.error('Test FAILED:', err);
  } finally {
    await mongoose.connection.close();
  }
}

test();
