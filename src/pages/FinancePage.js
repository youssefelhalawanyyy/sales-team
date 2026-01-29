import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  sum,
  onSnapshot
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

const INCOME_SOURCES = [
  'Sales',
  'Social Media Management',
  'Media Production',
  'Other'
];

const OWNERS = [
  { name: 'Youssef', id: 'youssef' },
  { name: 'Baraa', id: 'baraa' },
  { name: 'Rady', id: 'rady' }
];

export const FinancePage = () => {
  const { currentUser, userRole } = useAuth();
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    availableMoney: 0
  });
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    source: 'Sales',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [transferForm, setTransferForm] = useState({
    owner: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Check if user has access to finance
  const hasFinanceAccess = userRole === 'admin' || userRole === 'finance_manager';

  useEffect(() => {
    if (!hasFinanceAccess) return;
    fetchFinancialData();
  }, [hasFinanceAccess]);

  const fetchFinancialData = async () => {
    try {
      // Fetch all finances (incomes, expenses, commissions, transfers)
      const financesRef = collection(db, 'finances');
      const financesSnap = await getDocs(financesRef);
      
      const incomesList = [];
      const expensesList = [];
      let totalIncome = 0;
      let totalExpenses = 0;

      financesSnap.docs.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        
        if (data.type === 'income' || data.type === 'commission') {
          // Income and commissions are added
          incomesList.push({ id: doc.id, ...data });
          totalIncome += amount;
        } else if (data.type === 'expense') {
          // Expenses are subtracted
          expensesList.push({ id: doc.id, ...data });
          totalExpenses += amount;
        }
      });

      setIncomes(incomesList);
      setExpenses(expensesList);

      const availableMoney = totalIncome - totalExpenses;
      setFinancialData({
        totalIncome,
        totalExpenses,
        availableMoney
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Initialize empty if collection doesn't exist
      setFinancialData({
        totalIncome: 0,
        totalExpenses: 0,
        availableMoney: 0
      });
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.source || !incomeForm.amount) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'finances'), {
        type: 'income',
        source: incomeForm.source,
        amount: parseFloat(incomeForm.amount),
        description: incomeForm.description,
        date: incomeForm.date,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: currentUser.firstName + ' ' + currentUser.lastName,
        status: 'completed'
      });

      setIncomeForm({
        source: 'Sales',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowIncomeForm(false);
      fetchFinancialData();
    } catch (error) {
      console.error('Error adding income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'finances'), {
        type: 'expense',
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: currentUser.firstName + ' ' + currentUser.lastName,
        status: 'completed'
      });

      setExpenseForm({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowExpenseForm(false);
      fetchFinancialData();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToOwner = async (e) => {
    e.preventDefault();
    if (!transferForm.owner || !transferForm.amount) return;

    setLoading(true);
    try {
      // Add transfer as expense
      const ownerName = OWNERS.find(o => o.id === transferForm.owner)?.name;
      
      await addDoc(collection(db, 'finances'), {
        type: 'expense',
        description: `Transfer to owner: ${ownerName}`,
        amount: parseFloat(transferForm.amount),
        category: 'Owner Transfer',
        transferTo: transferForm.owner,
        date: transferForm.date,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: currentUser.firstName + ' ' + currentUser.lastName,
        status: 'completed'
      });

      setTransferForm({
        owner: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowTransferForm(false);
      fetchFinancialData();
    } catch (error) {
      console.error('Error transferring to owner:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasFinanceAccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">You don't have access to the Finance module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(financialData.totalIncome)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(financialData.totalExpenses)}
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Available Money</p>
              <p className={`text-2xl font-bold mt-2 ${financialData.availableMoney >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(financialData.availableMoney)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowIncomeForm(!showIncomeForm);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Income
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowExpenseForm(!showExpenseForm);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTransferForm(!showTransferForm);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
        >
          <Send className="w-5 h-5" />
          Transfer to Owner
        </button>
      </div>

      {/* Income Form */}
      {showIncomeForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Income</h2>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Source
                </label>
                <select
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {INCOME_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  placeholder="Amount (EGP)"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Adding...' : 'Add Income'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowIncomeForm(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Form */}
      {showExpenseForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Expense description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="Amount (EGP)"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  placeholder="Expense category"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowExpenseForm(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Form */}
      {showTransferForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transfer to Owner</h2>
          <form onSubmit={handleTransferToOwner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <select
                  value={transferForm.owner}
                  onChange={(e) => setTransferForm({ ...transferForm, owner: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Owner</option>
                  {OWNERS.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  placeholder="Amount (EGP)"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Transferring...' : 'Transfer'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTransferForm(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incomes Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Income Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No income records
                  </td>
                </tr>
              ) : (
                incomes.map(income => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{income.source}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(income.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {income.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(income.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Expense Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No expense records
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{expense.category}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
