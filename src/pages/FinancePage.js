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
import { 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Send,
  X,
  Calendar,
  FileText,
  PiggyBank,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Filter,
  Download
} from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md border-2 border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the Finance module.</p>
        </div>
      </div>
    );
  }

  const profitMargin = financialData.totalIncome > 0 
    ? ((financialData.availableMoney / financialData.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      
      <div className="space-y-8">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden animate-fadeInDown">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl lg:text-4xl font-bold">Finance Management</h1>
            </div>
            <p className="text-blue-100 text-sm lg:text-base">Monitor income, expenses, and financial health</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          
          {/* Total Income */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Income</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatCurrency(financialData.totalIncome)}
                  </p>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-semibold">{incomes.length} transactions</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {formatCurrency(financialData.totalExpenses)}
                  </p>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingDown className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span className="text-red-600 font-semibold">{expenses.length} transactions</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Available Money */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Available Money</p>
                  <p className={`text-3xl font-bold bg-gradient-to-br ${financialData.availableMoney >= 0 ? 'from-blue-600 to-indigo-600' : 'from-red-600 to-pink-600'} bg-clip-text text-transparent`}>
                    {formatCurrency(financialData.availableMoney)}
                  </p>
                </div>
                
                <div className={`p-3 bg-gradient-to-br ${financialData.availableMoney >= 0 ? 'from-blue-500 to-indigo-500' : 'from-red-500 to-pink-500'} rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className={`w-4 h-4 ${financialData.availableMoney >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                <span className={`${financialData.availableMoney >= 0 ? 'text-blue-600' : 'text-red-600'} font-semibold`}>Net Balance</span>
              </div>

              <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${financialData.availableMoney >= 0 ? 'from-blue-500 to-indigo-500' : 'from-red-500 to-pink-500'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Profit Margin</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profitMargin}%
                  </p>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <PiggyBank className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-purple-600 font-semibold">Financial Health</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowIncomeForm(!showIncomeForm);
              setShowExpenseForm(false);
              setShowTransferForm(false);
            }}
            className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-500/30 transform hover:scale-105 active:scale-95"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold">Add Income</span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowExpenseForm(!showExpenseForm);
              setShowIncomeForm(false);
              setShowTransferForm(false);
            }}
            className="group relative bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/30 transform hover:scale-105 active:scale-95"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold">Add Expense</span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTransferForm(!showTransferForm);
              setShowIncomeForm(false);
              setShowExpenseForm(false);
            }}
            className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 active:scale-95"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Send className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold">Transfer to Owner</span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </button>

        </div>

        {/* Income Form */}
        {showIncomeForm && (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-100 overflow-hidden animate-scaleIn">
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">Add New Income</h2>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowIncomeForm(false);
                }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Income Source *
                  </label>
                  <select
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium"
                  >
                    {INCOME_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : 'Add Income'}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowIncomeForm(false);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden animate-scaleIn">
            
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">Add New Expense</h2>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowExpenseForm(false);
                }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="Expense description"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      placeholder="Expense category"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : 'Add Expense'}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowExpenseForm(false);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-100 overflow-hidden animate-scaleIn">
            
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Send className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">Transfer to Owner</h2>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTransferForm(false);
                }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleTransferToOwner} className="p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Owner *
                  </label>
                  <select
                    value={transferForm.owner}
                    onChange={(e) => setTransferForm({ ...transferForm, owner: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium"
                    required
                  >
                    <option value="">Choose owner...</option>
                    {OWNERS.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={transferForm.date}
                      onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : 'Complete Transfer'}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTransferForm(false);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Incomes Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Income Records</h2>
              </div>
              
              <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-green-600 shadow-sm">
                {incomes.length} total
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No income records yet</p>
                        <p className="text-sm text-gray-400">Add your first income to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  incomes.map((income, idx) => (
                    <tr key={income.id} className="hover:bg-green-50/50 transition-colors duration-150" style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{income.source}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                          <ArrowUpRight className="w-4 h-4" />
                          {formatCurrency(income.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {income.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-8 py-6 border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Expense Records</h2>
              </div>
              
              <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-red-600 shadow-sm">
                {expenses.length} total
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <TrendingDown className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No expense records yet</p>
                        <p className="text-sm text-gray-400">Track your expenses here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense, idx) => (
                    <tr key={expense.id} className="hover:bg-red-50/50 transition-colors duration-150" style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{expense.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          {expense.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                          <ArrowDownRight className="w-4 h-4" />
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>

    </div>
  );
};