// Commission & Payroll System (Fixed Add + Payout + Payroll PDF + Schedule Table)

import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

import {
  Plus,
  Search,
  ShieldCheck,
  Filter,
  Calendar,
  FileText,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Download,
  X,
  AlertCircle,
  Wallet,
  CreditCard,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { notifyCommissionEarned } from "../services/notificationService";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ------------------------------------
   COMMISSION + PAYROLL MANAGEMENT
------------------------------------ */

export const CommissionPage = () => {
  const { currentUser, userRole } = useAuth();

  const isAdmin = userRole === "admin";
  const isFinance = userRole === "finance_manager";
  const isSales = userRole === "sales_member";

  const hasAccess = isAdmin || isFinance || isSales;

  /* ---------------- STATE ---------------- */

  const [users, setUsers] = useState([]);
  const [commissions, setCommissions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState("pending");

  const [payrollUser, setPayrollUser] = useState("");

  const [form, setForm] = useState({
    userId: "",
    offer: "",
    amount: "",
  });

  /* ---------------- HELPERS ---------------- */

  const today = () => new Date().toISOString().split("T")[0];

  const getPayoutDate = (date) => {
    const d = new Date(date);
    const day = d.getDate();

    if (day <= 14) d.setDate(15);
    else {
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }

    return d.toISOString().split("T")[0];
  };

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    if (hasAccess) loadAll();
  }, [hasAccess]);

  const loadAll = async () => {
    setLoading(true);

    try {
      const [uSnap, cSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "commissions")),
      ]);

      setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCommissions(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  /* ---------------- ADD COMMISSION (FIXED) ---------------- */

  const submit = async (e) => {
    e.preventDefault();

    if (!form.userId || !form.amount) {
      alert("Fill all required fields");
      return;
    }

    const user = users.find((u) => u.id === form.userId);

    if (!user) return alert("User not found");

    const payoutDate = getPayoutDate(today());

    setLoading(true);

    try {
      await addDoc(collection(db, "commissions"), {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,

        offerName: form.offer,
        commissionAmount: Number(form.amount),

        status: "unpaid",
        approved: false,

        payoutDate,

        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        paidAt: null,
      });

      // Send commission notification to user
      try {
        await notifyCommissionEarned(user.id, {
          id: user.id,
          amount: Number(form.amount),
          dealName: form.offer || 'Commission'
        });
      } catch (notifError) {
        console.error('Error sending commission notification:', notifError);
      }

      setForm({ userId: "", offer: "", amount: "" });
      setShowForm(false);

      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to add commission");
    }

    setLoading(false);
  };

  /* ---------------- APPROVE ---------------- */

  const approve = async (c) => {
    if (!isAdmin) return;

    await updateDoc(doc(db, "commissions", c.id), {
      approved: true,
      approvedAt: serverTimestamp(),
      approvedBy: currentUser.uid,
    });

    loadAll();
  };

  /* ---------------- PAY + FINANCE ---------------- */

  const markPaid = async (c) => {
    if (!c.approved) return alert("Approve first");

    if (!window.confirm("Confirm payment?")) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "finances"), {
        type: "expense",
        category: "Commission",
        description: `Commission - ${c.name}`,
        amount: c.commissionAmount,
        date: today(),
        status: "completed",
        createdAt: serverTimestamp(),
        referenceId: c.id,
      });

      await updateDoc(doc(db, "commissions", c.id), {
        status: "paid",
        paidAt: serverTimestamp(),
      });

      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Payment failed");
    }

    setLoading(false);
  };

  /* ---------------- RUN PAYOUT (FIXED QUERY) ---------------- */

  const runPayout = async () => {
    if (!isAdmin && !isFinance) return;

    if (!window.confirm("Run scheduled payroll now?")) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "commissions"),
        where("status", "==", "unpaid"),
        where("approved", "==", true)
      );

      const snap = await getDocs(q);
      const now = today();

      for (const d of snap.docs) {
        const c = { id: d.id, ...d.data() };

        if (c.payoutDate > now) continue;

        await addDoc(collection(db, "finances"), {
          type: "expense",
          category: "Commission",
          description: `Scheduled - ${c.name}`,
          amount: c.commissionAmount,
          date: now,
          status: "completed",
          referenceId: c.id,
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, "commissions", c.id), {
          status: "paid",
          paidAt: serverTimestamp(),
        });
      }

      await loadAll();

      alert("Payroll completed");
    } catch (e) {
      console.error(e);
      alert("Payout failed");
    }

    setLoading(false);
  };

  /* ---------------- PAYROLL PDF ---------------- */

  const generatePayroll = () => {
    if (!payrollUser) return alert("Select employee");

    const user = users.find((u) => u.id === payrollUser);

    const list = commissions.filter(
      (c) => c.userId === payrollUser && c.status === "paid"
    );

    const total = list.reduce(
      (s, c) => s + c.commissionAmount,
      0
    );

    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Employee Payroll Report", 14, 20);

    pdf.setFontSize(11);
    pdf.text(`Name: ${user.firstName} ${user.lastName}`, 14, 30);
    pdf.text(`Role: ${user.role}`, 14, 36);
    pdf.text(`Generated: ${today()}`, 14, 42);

    autoTable(pdf, {
      startY: 50,
      head: [["Offer", "Amount", "Paid Date", "Payout Date"]],
      body: list.map((c) => [
        c.offerName,
        formatCurrency(c.commissionAmount),
        c.paidAt?.toDate?.().toLocaleDateString() || "-",
        c.payoutDate,
      ]),
    });

    pdf.text(
      `Total Paid: ${formatCurrency(total)}`,
      14,
      pdf.lastAutoTable.finalY + 10
    );

    pdf.save(`${user.firstName}_payroll.pdf`);
  };

  /* ---------------- FILTER ---------------- */

  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        if (!c.name?.toLowerCase().includes(s)) return false;
      }

      if (isSales && c.userId !== currentUser.uid) return false;

      const status = (c.status || "").toLowerCase();
      const isPaid = status === "paid" || status === "completed";
      const isUnpaid = status === "unpaid" || status === "pending" || !status;

      if (viewFilter === "pending" && !isUnpaid) return false;
      if (viewFilter === "paid" && !isPaid) return false;

      return true;
    });
  }, [commissions, search, isSales, currentUser, viewFilter]);

  /* ---------------- STATS ---------------- */

  const stats = useMemo(() => {
    const totalPaid = filtered
      .filter((c) => c.status === "paid")
      .reduce((s, c) => s + c.commissionAmount, 0);

    const totalPending = filtered
      .filter((c) => c.status === "unpaid")
      .reduce((s, c) => s + c.commissionAmount, 0);

    const approvedCount = filtered.filter((c) => c.approved).length;
    const pendingApproval = filtered.filter((c) => !c.approved && c.status === "unpaid").length;

    return { totalPaid, totalPending, approvedCount, pendingApproval };
  }, [filtered]);

  /* ---------------- ACCESS ---------------- */

  if (!hasAccess)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page</p>
        </div>
      </div>
    );

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span>Finance Suite</span>
              <span className="text-xs">/</span>
              <span className="text-slate-900 font-semibold">Commissions Ledger</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight">Sales Payouts</h1>
            <p className="text-slate-500 mt-1">Manage and track commissions for Jonix Air sales representatives.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(isAdmin || isFinance) && (
                <button
                  onClick={runPayout}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={18} />
                  <span>Run Payroll</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-400 text-slate-900 rounded-xl font-semibold shadow-sm hover:opacity-90"
                >
                  <Plus size={18} />
                  <span>Add Commission</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-[280px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-500">Total Commission Due</span>
              <Wallet className="text-emerald-400" size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                {formatCurrency(stats.totalPending)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EGP</span>
            </div>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            icon={CheckCircle2}
            color="green"
            subtitle="Completed payments"
          />
          <StatCard
            title="Pending Payout"
            value={formatCurrency(stats.totalPending)}
            icon={Clock}
            color="yellow"
            subtitle="Awaiting payment"
          />
          <StatCard
            title="Approved"
            value={stats.approvedCount}
            icon={ShieldCheck}
            color="blue"
            subtitle="Ready for payout"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval}
            icon={AlertCircle}
            color="orange"
            subtitle="Needs admin approval"
          />
        </div>

        {/* PAYROLL EXPORT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Employee Payroll Report</h3>
              <p className="text-sm text-slate-500">Generate PDF reports for employees</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={payrollUser}
                onChange={(e) => setPayrollUser(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Employee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generatePayroll}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-400 text-slate-900 rounded-xl font-semibold shadow-sm hover:opacity-90 whitespace-nowrap"
            >
              <Download size={18} />
              <span>Generate PDF</span>
            </button>
          </div>
        </div>

      {/* ADD FORM MODAL */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add New Commission">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Employee *
              </label>
              <select
                required
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Employee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Offer/Deal Name
              </label>
              <input
                placeholder="e.g., Q4 Sales Deal"
                value={form.offer}
                onChange={(e) => setForm({ ...form, offer: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Commission Amount *
              </label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Automatic Payout Scheduling</p>
                  <p>Commissions created before the 15th will be paid on the 15th. Commissions created after the 15th will be paid on the 1st of next month.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Commission'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

        {/* FILTERS */}
        <section className="bg-white/70 border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg">
              <button
                onClick={() => setViewFilter("pending")}
                className={`px-6 py-2 text-sm font-bold rounded-md transition ${
                  viewFilter === "pending"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setViewFilter("paid")}
                className={`px-6 py-2 text-sm font-bold rounded-md transition ${
                  viewFilter === "paid"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Paid History
              </button>
              <button
                onClick={() => setViewFilter("all")}
                className={`px-6 py-2 text-sm font-bold rounded-md transition ${
                  viewFilter === "all"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All Transactions
              </button>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-grow lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  placeholder="Search representatives..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-emerald-200 focus:border-emerald-400"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-white hover:bg-slate-50">
                <Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </section>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Processing...</p>
        </div>
      )}

      {/* COMMISSIONS TABLE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No commissions found</h3>
          <p className="text-slate-500 mb-6">
            {search
              ? 'Try adjusting your search terms'
              : 'Get started by adding a new commission'
            }
          </p>
          {!search && isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-400 text-slate-900 rounded-xl font-semibold shadow-sm hover:opacity-90 transition"
            >
              Add First Commission
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>Employee</Th>
                  <Th>Offer/Deal</Th>
                  <Th>Amount</Th>
                  <Th>Payout Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-sm text-slate-500">{c.role}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-900">{c.offerName || '-'}</p>
                    </Td>
                    <Td>
                      <p className="font-bold text-slate-900 text-lg">{formatCurrency(c.commissionAmount)}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{c.payoutDate}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-2">
                        <Badge status={c.status} />
                        {!c.approved && c.status === "unpaid" && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Needs approval</span>
                          </div>
                        )}
                        {c.approved && c.status === "unpaid" && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </div>
                        )}
                      </div>
                    </Td>

                    <Td>
                        <div className="flex gap-2">
                          {isAdmin && !c.approved && (
                            <button
                              onClick={() => approve(c)}
                              className="flex items-center gap-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-medium transition-all"
                              title="Approve commission"
                            >
                              <ShieldCheck size={16} strokeWidth={2.5} />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                          )}

                          {(isAdmin || isFinance) && c.status === "unpaid" && c.approved && (
                            <button
                              onClick={() => markPaid(c)}
                              className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-medium transition-all"
                              title="Mark as paid"
                            >
                              <CreditCard size={16} strokeWidth={2.5} />
                              <span className="hidden sm:inline">Pay</span>
                            </button>
                          )}

                          {c.status === "paid" && (
                            <div className="flex items-center gap-1 px-3 py-2 text-emerald-600 text-sm">
                              <CheckCircle2 size={16} />
                              <span className="hidden sm:inline">Completed</span>
                            </div>
                          )}
                        </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filtered.length}</span> commission{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-slate-600">Total Pending: </span>
                  <span className="font-bold text-orange-600">{formatCurrency(stats.totalPending)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">Total Paid: </span>
                  <span className="font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CommissionPage;

/* ---------------- UI COMPONENTS ---------------- */

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};

const Th = ({ children }) => (
  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-6 py-4 ${className}`}>{children}</td>
);

const Badge = ({ status }) => {
  const config = {
    paid: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle2,
      label: 'Paid'
    },
    unpaid: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: Clock,
      label: 'Unpaid'
    }
  };

  const { bg, text, border, icon: Icon, label } = config[status] || config.unpaid;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${bg} ${text} ${border}`}>
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      {label}
    </span>
  );
};

const Modal = ({ children, onClose, title }) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Finance Suite</p>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="p-6 bg-slate-50/40">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
