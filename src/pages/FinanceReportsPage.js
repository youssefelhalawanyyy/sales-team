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
  DollarSign
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
  Legend
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

  filtered.forEach(item => {

    const amt = Number(item.amount || 0);

    const d = parseDate(item);
    const key = d
      ? `${d.getFullYear()}-${d.getMonth() + 1}`
      : 'Invalid';

    if (!monthly[key]) {
      monthly[key] = {
        month: key,
        income: 0,
        expense: 0
      };
    }

    if (item.type === 'income' || item.type === 'commission') {

      totalIncome += amt;
      monthly[key].income += amt;

    }

    if (item.type === 'expense') {

      totalExpense += amt;
      monthly[key].expense += amt;

      if (item.transferTo) {
        transfers.push(item);
      }

      if (item.category) {
        categories[item.category] =
          (categories[item.category] || 0) + amt;
      }

    }

  });


  const profit = totalIncome - totalExpense;


  /* ===============================
     CHART DATA
  ================================ */

  const chartData =
    Object.values(monthly)
      .sort((a, b) => a.month.localeCompare(b.month));


  const categoryData =
    Object.entries(categories).map(([k, v]) => ({
      name: k,
      value: v
    }));


  /* ===============================
     PDF
  ================================ */

  const exportPDF = () => {

    const script = document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

    script.onload = () => {

      window.html2pdf()
        .from(reportRef.current)
        .set({
          filename: `finance-report-${Date.now()}.pdf`,
          margin: 10,
          scale: 2
        })
        .save();

    };

    document.body.appendChild(script);

  };


  /* ===============================
     LOADING / ACCESS
  ================================ */

  if (!hasAccess) {
    return (
      <div className="bg-white p-8 text-center rounded-xl shadow">
        No Access
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  /* ===============================
     RENDER
  ================================ */

  return (

    <div className="space-y-8">


      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold">
          Financial Reports
        </h1>

        <div className="flex gap-3">

          <button
            onClick={fetchAll}
            className="btn-blue"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={exportPDF}
            className="btn-green"
          >
            <Download size={16} />
            Export
          </button>

        </div>

      </div>


      {/* FILTERS */}

      <div className="bg-white p-6 rounded-xl shadow grid md:grid-cols-4 gap-4">

        <div>
          <label>From</label>
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label>To</label>
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="input"
          />
        </div>

        <div className="flex items-end gap-2">

          <input
            type="checkbox"
            checked={includeInvalid}
            onChange={e => setIncludeInvalid(e.target.checked)}
          />

          <span className="text-sm">
            Include invalid dates
          </span>

        </div>

      </div>


      {/* CONTENT */}

      <div ref={reportRef} className="space-y-8">


        {/* KPIS */}

        <div className="grid md:grid-cols-4 gap-4">

          <KPI
            title="Income"
            value={totalIncome}
            icon={TrendingUp}
            color="green"
          />

          <KPI
            title="Expenses"
            value={totalExpense}
            icon={TrendingDown}
            color="red"
          />

          <KPI
            title="Profit"
            value={profit}
            icon={DollarSign}
            color="blue"
          />

          <KPI
            title="Records"
            value={filtered.length}
            icon={Filter}
            color="purple"
          />

        </div>


        {/* MONTHLY CHART */}

        <Section title="Monthly Performance">

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                dataKey="income"
                stroke="#16a34a"
                strokeWidth={2}
              />

              <Line
                dataKey="expense"
                stroke="#dc2626"
                strokeWidth={2}
              />

            </LineChart>

          </ResponsiveContainer>

        </Section>


        {/* CATEGORY */}

        <Section title="Expenses by Category">

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={categoryData}>

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#ef4444"
              />

            </BarChart>

          </ResponsiveContainer>

        </Section>


        {/* TRANSFERS */}

        <Section title="Owner Transfers">

          {transfers.length === 0 && (
            <p className="text-gray-500">
              No transfers
            </p>
          )}

          {transfers.map(t => (

            <Row
              key={t.id}
              left={`To ${t.transferTo}`}
              right={t.amount}
              date={parseDate(t)}
            />

          ))}

        </Section>


        {/* FULL LEDGER */}

        <Section title="Full Ledger">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Amount</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map(item => {

                  const d = parseDate(item);

                  return (

                    <tr key={item.id} className="border-t">

                      <td>
                        {d
                          ? d.toLocaleDateString()
                          : 'Invalid'}
                      </td>

                      <td>{item.type}</td>

                      <td>
                        {item.description ||
                          item.source ||
                          '-'}
                      </td>

                      <td>{item.category || '-'}</td>

                      <td>{item.createdByName || '-'}</td>

                      <td
                        className={
                          item.type === 'expense'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {formatCurrency(item.amount)}
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

  );

};


/* ===============================
   UI COMPONENTS
================================ */

const KPI = ({ title, value, icon: Icon, color }) => (

  <div className="bg-white p-5 rounded-xl shadow flex justify-between">

    <div>

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <p className="text-2xl font-bold">
        {formatCurrency(value)}
      </p>

    </div>

    <Icon className={`text-${color}-600`} size={28} />

  </div>

);


const Section = ({ title, children }) => (

  <div className="bg-white p-6 rounded-xl shadow space-y-4">

    <h2 className="font-bold text-lg">
      {title}
    </h2>

    {children}

  </div>

);


const Row = ({ left, right, date }) => (

  <div className="flex justify-between border-b py-2 text-sm">

    <div>
      <p>{left}</p>
      <p className="text-gray-400 text-xs">
        {date?.toLocaleDateString() || '—'}
      </p>
    </div>

    <p className="font-semibold text-red-600">
      {formatCurrency(right)}
    </p>

  </div>

);
