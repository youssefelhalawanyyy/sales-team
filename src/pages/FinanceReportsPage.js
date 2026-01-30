import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

import {
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

import { formatCurrency } from '../utils/currency';


/* ===============================
   DATE HANDLER
================================ */

const parseDate = (item) => {
  if (item?.date) {
    const d = new Date(item.date);
    if (!isNaN(d)) return d;
  }

  if (item?.createdAt?.seconds) {
    return new Date(item.createdAt.seconds * 1000);
  }

  if (item?.createdAt?.toDate) {
    return item.createdAt.toDate();
  }

  return null;
};


/* ===============================
   MAIN COMPONENT
================================ */

export const FinanceReportsPage = () => {

  const { userRole } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [includeInvalid, setIncludeInvalid] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const reportRef = useRef();


  const hasAccess =
    userRole === 'admin' ||
    userRole === 'finance_manager';


  /* ===============================
     FETCH DATA
  ================================ */

  useEffect(() => {
    if (!hasAccess) return;

    fetchAll();

  }, [hasAccess]);


  const fetchAll = async () => {

    try {

      const snap = await getDocs(collection(db, 'finances'));

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setData(list);

    } catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }

  };


  /* ===============================
     FILTER
  ================================ */

  const filtered = data.filter(item => {

    const d = parseDate(item);

    if (!d) return includeInvalid;

    if (start && d < new Date(start)) return false;
    if (end && d > new Date(end)) return false;

    return true;

  });


  /* ===============================
     CALCULATIONS
  ================================ */

  let totalIncome = 0;
  let totalExpense = 0;

  const monthly = {};
  const categories = {};
  const transfers = [];
  const incomeBySource = {};
  const daily = {};

  filtered.forEach(item => {

    const amt = Number(item.amount || 0);

    const d = parseDate(item);
    const monthKey = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : 'Invalid';

    const dayKey = d
      ? d.toISOString().split('T')[0]
      : 'Invalid';

    if (!monthly[monthKey]) {
      monthly[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
        profit: 0
      };
    }

    if (!daily[dayKey]) {
      daily[dayKey] = {
        day: dayKey,
        income: 0,
        expense: 0
      };
    }

    if (item.type === 'income' || item.type === 'commission') {

      totalIncome += amt;
      monthly[monthKey].income += amt;
      daily[dayKey].income += amt;

      const source = item.source || 'Other';
      incomeBySource[source] = (incomeBySource[source] || 0) + amt;

    }

    if (item.type === 'expense') {

      totalExpense += amt;
      monthly[monthKey].expense += amt;
      daily[dayKey].expense += amt;

      if (item.transferTo) {
        transfers.push(item);
      }

      if (item.category) {
        categories[item.category] =
          (categories[item.category] || 0) + amt;
      }

    }

    monthly[monthKey].profit = monthly[monthKey].income - monthly[monthKey].expense;

  });


  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;


  /* ===============================
     CHART DATA
  ================================ */

  const chartData =
    Object.values(monthly)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        monthName: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));


  const categoryData =
    Object.entries(categories)
      .map(([k, v]) => ({
        name: k,
        value: v
      }))
      .sort((a, b) => b.value - a.value);


  const incomeSourceData =
    Object.entries(incomeBySource)
      .map(([k, v]) => ({
        name: k,
        value: v
      }))
      .sort((a, b) => b.value - a.value);


  const dailyData =
    Object.values(daily)
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30);


  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];


  /* ===============================
     PDF EXPORT
  ================================ */

  const exportPDF = () => {

    const script = document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

    script.onload = () => {

      const element = reportRef.current;
      
      const opt = {
        margin: [10, 10],
        filename: `financial-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(opt).from(element).save();

    };

    document.body.appendChild(script);

  };


  const exportDetailedReport = (reportType) => {
    setSelectedReport(reportType);
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      
      script.onload = () => {
        const element = document.getElementById('detailed-report');
        const opt = {
          margin: [10, 10],
          filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(element).save().then(() => {
          setSelectedReport(null);
        });
      };
      
      document.body.appendChild(script);
    }, 100);
  };


  /* ===============================
     LOADING / ACCESS
  ================================ */

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-12 text-center rounded-2xl shadow-lg max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view financial reports.</p>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading financial data...</p>
      </div>
    );
  }


  /* ===============================
     RENDER
  ================================ */

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">

      <div className="max-w-7xl mx-auto space-y-6">


        {/* HEADER */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Financial Reports
              </h1>
              <p className="text-gray-500 text-sm">
                Comprehensive overview of your financial performance
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={fetchAll}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>

              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                <Download size={18} />
                <span>Export Overview</span>
              </button>

            </div>

          </div>

        </div>


        {/* FILTERS */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-gray-600" size={20} />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInvalid}
                  onChange={e => setIncludeInvalid(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Include invalid dates
                </span>
              </label>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filtered.length}</span> records found
              </div>
            </div>

          </div>

        </div>


        {/* CONTENT */}

        <div ref={reportRef}>


          {/* KPIS */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            <KPICard
              title="Total Income"
              value={totalIncome}
              icon={TrendingUp}
              trend={totalIncome > 0 ? 'up' : 'neutral'}
              color="emerald"
            />

            <KPICard
              title="Total Expenses"
              value={totalExpense}
              icon={TrendingDown}
              trend="down"
              color="rose"
            />

            <KPICard
              title="Net Profit"
              value={profit}
              subtitle={`${profitMargin.toFixed(1)}% margin`}
              icon={DollarSign}
              trend={profit > 0 ? 'up' : 'down'}
              color="blue"
            />

            <KPICard
              title="Total Records"
              value={filtered.length}
              icon={FileText}
              trend="neutral"
              color="purple"
              isCount
            />

          </div>


          {/* CHARTS ROW 1 */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* MONTHLY PERFORMANCE */}
            <ChartCard title="Monthly Performance" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    fill="url(#incomeGradient)"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    fill="url(#expenseGradient)"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* PROFIT TREND */}
            <ChartCard title="Profit Trend" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthName"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>


          {/* CHARTS ROW 2 */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* EXPENSE CATEGORIES */}
            <ChartCard title="Expenses by Category" icon={PieChartIcon}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-400">
                  No expense categories
                </div>
              )}
            </ChartCard>

            {/* INCOME SOURCES */}
            <ChartCard title="Income by Source" icon={TrendingUp}>
              {incomeSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeSourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-400">
                  No income sources
                </div>
              )}
            </ChartCard>

          </div>


          {/* TRANSFERS SECTION */}
          {transfers.length > 0 && (
            <div className="mb-6">
              <Section title="Owner Transfers" icon={ArrowUpRight}>
                <div className="space-y-2">
                  {transfers.map(t => (
                    <TransferRow
                      key={t.id}
                      transferTo={t.transferTo}
                      amount={t.amount}
                      date={parseDate(t)}
                      description={t.description}
                    />
                  ))}
                </div>
              </Section>
            </div>
          )}


          {/* DETAILED REPORTS */}
          <div className="mb-6">
            <Section title="Detailed Reports" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <ReportButton
                  title="Full Ledger Report"
                  description="Complete transaction history"
                  onClick={() => exportDetailedReport('ledger')}
                />

                <ReportButton
                  title="Category Breakdown"
                  description="Detailed expense analysis"
                  onClick={() => exportDetailedReport('category')}
                />

                <ReportButton
                  title="Monthly Summary"
                  description="Period-over-period analysis"
                  onClick={() => exportDetailedReport('monthly')}
                />

              </div>
            </Section>
          </div>


          {/* SUMMARY TABLE */}
          <Section title="Transaction Ledger" icon={Calendar}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Created By</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(item => {
                    const d = parseDate(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">
                          {d ? d.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Invalid'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.type === 'income' || item.type === 'commission'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {item.description || item.source || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.category || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.createdByName || '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

        </div>

      </div>


      {/* DETAILED REPORT MODAL */}
      {selectedReport && (
        <DetailedReportModal
          reportType={selectedReport}
          data={filtered}
          chartData={chartData}
          categoryData={categoryData}
          incomeSourceData={incomeSourceData}
          transfers={transfers}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          profit={profit}
          profitMargin={profitMargin}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>

  );

};


/* ===============================
   UI COMPONENTS
================================ */

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, isCount }) => {
  
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  const trendIcons = {
    up: <ArrowUpRight className="text-green-500" size={20} />,
    down: <ArrowDownRight className="text-red-500" size={20} />,
    neutral: null
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {trendIcons[trend]}
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-1">
        {title}
      </h3>
      
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {isCount ? value : formatCurrency(value)}
      </p>

      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};


const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-6">
      <Icon className="text-gray-600" size={20} />
      <h2 className="font-bold text-lg text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);


const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-6">
      {Icon && <Icon className="text-gray-600" size={20} />}
      <h2 className="font-bold text-lg text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);


const TransferRow = ({ transferTo, amount, date, description }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <ArrowUpRight className="text-red-500" size={16} />
        <p className="font-semibold text-gray-900">
          Transfer to {transferTo}
        </p>
      </div>
      {description && (
        <p className="text-sm text-gray-600 ml-6">
          {description}
        </p>
      )}
      <p className="text-xs text-gray-400 ml-6">
        {date?.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) || '—'}
      </p>
    </div>
    <p className="font-bold text-lg text-red-600">
      -{formatCurrency(amount)}
    </p>
  </div>
);


const ReportButton = ({ title, description, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all text-left group"
  >
    <div className="flex items-start justify-between mb-2">
      <FileText className="text-gray-400 group-hover:text-blue-600 transition-colors" size={24} />
      <Download className="text-gray-300 group-hover:text-blue-500 transition-colors" size={18} />
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-600">
      {description}
    </p>
  </button>
);


const DetailedReportModal = ({ 
  reportType, 
  data, 
  chartData, 
  categoryData,
  incomeSourceData,
  transfers,
  totalIncome,
  totalExpense,
  profit,
  profitMargin,
  onClose 
}) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Generating {reportType} report...
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          
          <div id="detailed-report" className="space-y-6 bg-white p-8">
            
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {reportType === 'ledger' ? 'Full Ledger Report' :
                 reportType === 'category' ? 'Category Breakdown Report' :
                 'Monthly Summary Report'}
              </h1>
              <p className="text-gray-600">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(profit)}</p>
                <p className="text-xs text-gray-500 mt-1">{profitMargin.toFixed(1)}% margin</p>
              </div>
            </div>

            {/* Report Content */}
            {reportType === 'ledger' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Complete Transaction History</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(item => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2">{parseDate(item)?.toLocaleDateString() || 'Invalid'}</td>
                        <td className="py-2">{item.type}</td>
                        <td className="py-2">{item.description || item.source || '—'}</td>
                        <td className="py-2">{item.category || '—'}</td>
                        <td className={`py-2 text-right font-semibold ${
                          item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'category' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Expense Category Analysis</h3>
                <table className="w-full text-sm border-collapse mb-6">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-right py-2">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map(cat => (
                      <tr key={cat.name} className="border-b border-gray-200">
                        <td className="py-2">{cat.name}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(cat.value)}</td>
                        <td className="py-2 text-right">{((cat.value / totalExpense) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-xl font-bold mb-4 mt-8">Income Source Analysis</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Source</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-right py-2">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeSourceData.map(source => (
                      <tr key={source.name} className="border-b border-gray-200">
                        <td className="py-2">{source.name}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(source.value)}</td>
                        <td className="py-2 text-right">{((source.value / totalIncome) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'monthly' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Monthly Performance Summary</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Income</th>
                      <th className="text-right py-2">Expenses</th>
                      <th className="text-right py-2">Profit</th>
                      <th className="text-right py-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map(month => (
                      <tr key={month.month} className="border-b border-gray-200">
                        <td className="py-2">{month.monthName}</td>
                        <td className="py-2 text-right text-green-600 font-semibold">
                          {formatCurrency(month.income)}
                        </td>
                        <td className="py-2 text-right text-red-600 font-semibold">
                          {formatCurrency(month.expense)}
                        </td>
                        <td className={`py-2 text-right font-semibold ${
                          month.profit >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(month.profit)}
                        </td>
                        <td className="py-2 text-right">
                          {month.income > 0 ? ((month.profit / month.income) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};