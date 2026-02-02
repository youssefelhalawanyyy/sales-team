import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy
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
  Download,
  Search,
  Eye,
  Save,
  BarChart3,
  PieChart,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

const INCOME_SOURCES = [
  'Sales',
  'Social Media Management',
  'Media Production',
  'Consulting',
  'Subscription',
  'Commission',
  'Other'
];

const EXPENSE_CATEGORIES = [
  'Marketing',
  'Salaries',
  'Equipment',
  'Software',
  'Office Supplies',
  'Utilities',
  'Travel',
  'Entertainment',
  'Owner Transfer',
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
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  
  // UI States
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, income, expenses
  const [viewMode, setViewMode] = useState('table'); // table, cards
  
  // Filter States
  const [incomeFilter, setIncomeFilter] = useState({
    search: '',
    source: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [expenseFilter, setExpenseFilter] = useState({
    search: '',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Form States
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

  const hasFinanceAccess = userRole === 'admin' || userRole === 'finance_manager';

  useEffect(() => {
    if (!hasFinanceAccess) return;
    fetchFinancialData();
  }, [hasFinanceAccess]);

  useEffect(() => {
    filterIncomes();
  }, [incomes, incomeFilter]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, expenseFilter]);

  const fetchFinancialData = async () => {
    try {
      const financesRef = collection(db, 'finances');
      const financesSnap = await getDocs(query(financesRef, orderBy('date', 'desc')));
      
      const incomesList = [];
      const expensesList = [];
      let totalIncome = 0;
      let totalExpenses = 0;

      financesSnap.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        const amount = data.amount || 0;
        
        if (data.type === 'income' || data.type === 'commission') {
          incomesList.push(data);
          totalIncome += amount;
        } else if (data.type === 'expense') {
          expensesList.push(data);
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
      setFinancialData({
        totalIncome: 0,
        totalExpenses: 0,
        availableMoney: 0
      });
    }
  };

  const filterIncomes = () => {
    let filtered = [...incomes];

    if (incomeFilter.search) {
      filtered = filtered.filter(income => 
        income.description?.toLowerCase().includes(incomeFilter.search.toLowerCase()) ||
        income.source?.toLowerCase().includes(incomeFilter.search.toLowerCase())
      );
    }

    if (incomeFilter.source !== 'all') {
      filtered = filtered.filter(income => income.source === incomeFilter.source);
    }

    if (incomeFilter.dateFrom) {
      filtered = filtered.filter(income => income.date >= incomeFilter.dateFrom);
    }

    if (incomeFilter.dateTo) {
      filtered = filtered.filter(income => income.date <= incomeFilter.dateTo);
    }

    setFilteredIncomes(filtered);
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (expenseFilter.search) {
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(expenseFilter.search.toLowerCase()) ||
        expense.category?.toLowerCase().includes(expenseFilter.search.toLowerCase())
      );
    }

    if (expenseFilter.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === expenseFilter.category);
    }

    if (expenseFilter.dateFrom) {
      filtered = filtered.filter(expense => expense.date >= expenseFilter.dateFrom);
    }

    if (expenseFilter.dateTo) {
      filtered = filtered.filter(expense => expense.date <= expenseFilter.dateTo);
    }

    setFilteredExpenses(filtered);
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.source || !incomeForm.amount) return;

    setLoading(true);
    try {
      if (editingIncome) {
        await updateDoc(doc(db, 'finances', editingIncome.id), {
          source: incomeForm.source,
          amount: parseFloat(incomeForm.amount),
          description: incomeForm.description,
          date: incomeForm.date,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
      } else {
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
      }

      resetIncomeForm();
      fetchFinancialData();
    } catch (error) {
      console.error('Error saving income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    setLoading(true);
    try {
      if (editingExpense) {
        await updateDoc(doc(db, 'finances', editingExpense.id), {
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
      } else {
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
      }

      resetExpenseForm();
      fetchFinancialData();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToOwner = async (e) => {
    e.preventDefault();
    if (!transferForm.owner || !transferForm.amount) return;

    setLoading(true);
    try {
      const ownerName = OWNERS.find(o => o.id === transferForm.owner)?.name;
      
      await addDoc(collection(db, 'finances'), {
        type: 'expense',
        description: `Transfer to ${ownerName}`,
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

  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setIncomeForm({
      source: income.source,
      amount: income.amount.toString(),
      description: income.description || '',
      date: income.date
    });
    setShowIncomeForm(true);
    setShowExpenseForm(false);
    setShowTransferForm(false);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || '',
      date: expense.date
    });
    setShowExpenseForm(true);
    setShowIncomeForm(false);
    setShowTransferForm(false);
  };

  const handleDeleteIncome = async (id) => {
    try {
      await deleteDoc(doc(db, 'finances', id));
      setShowDeleteConfirm(null);
      fetchFinancialData();
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'finances', id));
      setShowDeleteConfirm(null);
      fetchFinancialData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      source: 'Sales',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingIncome(null);
    setShowIncomeForm(false);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const exportToCSV = (type) => {
    const data = type === 'income' ? filteredIncomes : filteredExpenses;
    const headers = type === 'income' 
      ? ['Date', 'Source', 'Amount', 'Description']
      : ['Date', 'Description', 'Category', 'Amount'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (type === 'income') {
          return [item.date, item.source, item.amount, item.description || ''].join(',');
        } else {
          return [item.date, item.description, item.category || '', item.amount].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!hasFinanceAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-md border-2 border-red-100">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-60 sm:w-96 h-60 sm:h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Finance Management</h1>
                </div>
                <p className="text-blue-100 text-sm lg:text-base">Monitor income, expenses, and financial health</p>
              </div>
              
              <button
                onClick={fetchFinancialData}
                className="self-start sm:self-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Total Income */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Income</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatCurrency(financialData.totalIncome)}
                  </p>
                </div>
                
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-green-600 font-semibold">{incomes.length} transactions</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Expenses</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {formatCurrency(financialData.totalExpenses)}
                  </p>
                </div>
                
                <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                <span className="text-red-600 font-semibold">{expenses.length} transactions</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Available Money */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Available Money</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br ${financialData.availableMoney >= 0 ? 'from-blue-600 to-indigo-600' : 'from-red-600 to-pink-600'} bg-clip-text text-transparent`}>
                    {formatCurrency(financialData.availableMoney)}
                  </p>
                </div>
                
                <div className={`p-2 sm:p-3 bg-gradient-to-br ${financialData.availableMoney >= 0 ? 'from-blue-500 to-indigo-500' : 'from-red-500 to-pink-500'} rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <DollarSign className={`w-3 h-3 sm:w-4 sm:h-4 ${financialData.availableMoney >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                <span className={`${financialData.availableMoney >= 0 ? 'text-blue-600' : 'text-red-600'} font-semibold`}>Net Balance</span>
              </div>

              <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${financialData.availableMoney >= 0 ? 'from-blue-500 to-indigo-500' : 'from-red-500 to-pink-500'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Profit Margin</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profitMargin}%
                  </p>
                </div>
                
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                <span className="text-purple-600 font-semibold">Health Score</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          
          <button
            onClick={() => {
              setShowIncomeForm(!showIncomeForm);
              setShowExpenseForm(false);
              setShowTransferForm(false);
              setEditingIncome(null);
            }}
            className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-500/30 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold">Add Income</span>
          </button>

          <button
            onClick={() => {
              setShowExpenseForm(!showExpenseForm);
              setShowIncomeForm(false);
              setShowTransferForm(false);
              setEditingExpense(null);
            }}
            className="group relative bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/30 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold">Add Expense</span>
          </button>

          <button
            onClick={() => {
              setShowTransferForm(!showTransferForm);
              setShowIncomeForm(false);
              setShowExpenseForm(false);
            }}
            className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold hidden sm:inline">Transfer to Owner</span>
            <span className="font-semibold sm:hidden">Transfer</span>
          </button>

        </div>

        {/* Income Form */}
        {showIncomeForm && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-green-100 overflow-hidden animate-slideDown">
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  {editingIncome ? <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />}
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">{editingIncome ? 'Edit' : 'Add New'} Income</h2>
              </div>
              
              <button
                onClick={resetIncomeForm}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Income Source *
                  </label>
                  <select
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    {INCOME_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="number"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 sm:left-4 top-3 sm:top-1/2 sm:-translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <textarea
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      placeholder="Optional description"
                      rows="2"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                    />
                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {editingIncome ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (editingIncome ? 'Update Income' : 'Add Income')}
                </button>
                
                <button
                  type="button"
                  onClick={resetIncomeForm}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden animate-slideDown">
            
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  {editingExpense ? <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />}
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">{editingExpense ? 'Edit' : 'Add New'} Expense</h2>
              </div>
              
              <button
                onClick={resetExpenseForm}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Description *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 sm:left-4 top-3 sm:top-1/2 sm:-translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="Expense description"
                      rows="2"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    <option value="">Select category</option>
                    {EXPENSE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                    />
                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {editingExpense ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (editingExpense ? 'Update Expense' : 'Add Expense')}
                </button>
                
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-purple-100 overflow-hidden animate-slideDown">
            
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Transfer to Owner</h2>
              </div>
              
              <button
                onClick={() => setShowTransferForm(false)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleTransferToOwner} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Select Owner *
                  </label>
                  <select
                    value={transferForm.owner}
                    onChange={(e) => setTransferForm({ ...transferForm, owner: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                    required
                  >
                    <option value="">Choose owner...</option>
                    {OWNERS.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="date"
                      value={transferForm.date}
                      onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                    />
                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : 'Complete Transfer'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowTransferForm(false)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-1.5 sm:p-2 inline-flex gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'income'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${
              activeTab === 'expenses'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Expenses
          </button>
        </div>

        {/* Income Section */}
        {activeTab === 'income' && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filter Income</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={incomeFilter.search}
                    onChange={(e) => setIncomeFilter({ ...incomeFilter, search: e.target.value })}
                    placeholder="Search..."
                    className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <select
                  value={incomeFilter.source}
                  onChange={(e) => setIncomeFilter({ ...incomeFilter, source: e.target.value })}
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                >
                  <option value="all">All Sources</option>
                  {INCOME_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={incomeFilter.dateFrom}
                  onChange={(e) => setIncomeFilter({ ...incomeFilter, dateFrom: e.target.value })}
                  placeholder="From Date"
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                />

                <input
                  type="date"
                  value={incomeFilter.dateTo}
                  onChange={(e) => setIncomeFilter({ ...incomeFilter, dateTo: e.target.value })}
                  placeholder="To Date"
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-4">
                <button
                  onClick={() => setIncomeFilter({ search: '', source: 'all', dateFrom: '', dateTo: '' })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                >
                  Clear Filters
                </button>
                
                <button
                  onClick={() => exportToCSV('income')}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl flex items-center gap-2 font-semibold transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                <span className="text-sm text-gray-600 sm:ml-auto">
                  Showing <span className="font-bold text-gray-900">{filteredIncomes.length}</span> of <span className="font-bold text-gray-900">{incomes.length}</span> records
                </span>
              </div>
            </div>

            {/* Incomes Table/Cards */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Income Records</h2>
                  </div>
                  
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full text-xs sm:text-sm font-semibold text-green-600 shadow-sm self-start sm:self-auto">
                    {filteredIncomes.length} total
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Description</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredIncomes.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
                              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium text-sm sm:text-base">No income records found</p>
                            <p className="text-xs sm:text-sm text-gray-400">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredIncomes.map((income) => (
                        <tr key={income.id} className="hover:bg-green-50/50 transition-colors duration-150">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{income.source}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap">
                              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              {formatCurrency(income.amount)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                            {income.description || '—'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 font-medium">
                            {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditIncome(income)}
                                className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:text-blue-700" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'income', id: income.id })}
                                className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 group-hover:text-red-700" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Expenses Section */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filter Expenses</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={expenseFilter.search}
                    onChange={(e) => setExpenseFilter({ ...expenseFilter, search: e.target.value })}
                    placeholder="Search..."
                    className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <select
                  value={expenseFilter.category}
                  onChange={(e) => setExpenseFilter({ ...expenseFilter, category: e.target.value })}
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm sm:text-base"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={expenseFilter.dateFrom}
                  onChange={(e) => setExpenseFilter({ ...expenseFilter, dateFrom: e.target.value })}
                  placeholder="From Date"
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm sm:text-base"
                />

                <input
                  type="date"
                  value={expenseFilter.dateTo}
                  onChange={(e) => setExpenseFilter({ ...expenseFilter, dateTo: e.target.value })}
                  placeholder="To Date"
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-4">
                <button
                  onClick={() => setExpenseFilter({ search: '', category: 'all', dateFrom: '', dateTo: '' })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                >
                  Clear Filters
                </button>
                
                <button
                  onClick={() => exportToCSV('expense')}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl flex items-center gap-2 font-semibold transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                <span className="text-sm text-gray-600 sm:ml-auto">
                  Showing <span className="font-bold text-gray-900">{filteredExpenses.length}</span> of <span className="font-bold text-gray-900">{expenses.length}</span> records
                </span>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-red-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg sm:rounded-xl">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Expense Records</h2>
                  </div>
                  
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full text-xs sm:text-sm font-semibold text-red-600 shadow-sm self-start sm:self-auto">
                    {filteredExpenses.length} total
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Category</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
                              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium text-sm sm:text-base">No expense records found</p>
                            <p className="text-xs sm:text-sm text-gray-400">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-red-50/50 transition-colors duration-150">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{expense.description}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                              {expense.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap">
                              <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              {formatCurrency(expense.amount)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 font-medium">
                            {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:text-blue-700" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'expense', id: expense.id })}
                                className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 group-hover:text-red-700" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Overview Section */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Recent Income */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Recent Income
                  </h3>
                  <button
                    onClick={() => setActiveTab('income')}
                    className="text-sm text-green-600 hover:text-green-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="space-y-3">
                  {incomes.slice(0, 5).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{income.source}</p>
                        <p className="text-xs text-gray-600 truncate">{income.description || 'No description'}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-green-600 text-sm">{formatCurrency(income.amount)}</p>
                        <p className="text-xs text-gray-500">{new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                  
                  {incomes.length === 0 && (
                    <p className="text-center text-gray-500 py-8 text-sm">No income records yet</p>
                  )}
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    Recent Expenses
                  </h3>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-gray-600 truncate">{expense.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-red-600 text-sm">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                  
                  {expenses.length === 0 && (
                    <p className="text-center text-gray-500 py-8 text-sm">No expense records yet</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {showDeleteConfirm.type} record? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === 'income') {
                    handleDeleteIncome(showDeleteConfirm.id);
                  } else {
                    handleDeleteExpense(showDeleteConfirm.id);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

    </div>
  );
};