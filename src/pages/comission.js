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
  Bell,
  Calendar,
  FileText,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

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

      return true;
    });
  }, [commissions, search, isSales, currentUser]);

  /* ---------------- ACCESS ---------------- */

  if (!hasAccess)
    return <div className="p-10 text-center">Access Denied</div>;

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row justify-between gap-3">
        <h1 className="text-2xl font-bold">Commission & Payroll</h1>

        <div className="flex gap-2 flex-wrap">
          {(isAdmin || isFinance) && (
            <button
              onClick={runPayout}
              className="bg-green-600 text-white px-3 py-2 rounded-lg"
            >
              <Calendar size={16} /> Run Payroll
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg"
            >
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>

      {/* PAYROLL EXPORT */}

      <div className="bg-white p-4 rounded-xl shadow space-y-2">
        <h3 className="font-semibold">Employee Payroll</h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={payrollUser}
            onChange={(e) => setPayrollUser(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>

          <button
            onClick={generatePayroll}
            className="bg-blue-600 text-white px-4 rounded"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* ADD FORM */}

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white p-4 rounded-xl shadow space-y-3"
        >
          <h3 className="font-semibold">Add Commission</h3>

          <select
            required
            value={form.userId}
            onChange={(e) =>
              setForm({ ...form, userId: e.target.value })
            }
            className="border p-2 w-full"
          >
            <option value="">Select Employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>

          <input
            placeholder="Offer"
            value={form.offer}
            onChange={(e) =>
              setForm({ ...form, offer: e.target.value })
            }
            className="border p-2 w-full"
          />

          <input
            type="number"
            placeholder="Amount"
            required
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
            className="border p-2 w-full"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border px-3 py-1 rounded"
            >
              Cancel
            </button>

            <button className="bg-indigo-600 text-white px-3 py-1 rounded">
              Save
            </button>
          </div>
        </form>
      )}

      {/* SEARCH */}

      <div className="bg-white p-3 rounded shadow flex gap-2">
        <Search size={18} />
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none"
        />
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <Th>Name</Th>
              <Th>Offer</Th>
              <Th>Amount</Th>
              <Th>Payout</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t">
                <Td>{c.name}</Td>
                <Td>{c.offerName}</Td>
                <Td>{formatCurrency(c.commissionAmount)}</Td>
                <Td>{c.payoutDate}</Td>
                <Td>
                  <Badge status={c.status} />
                </Td>

                <Td className="space-x-2">
                  {isAdmin && !c.approved && (
                    <button
                      onClick={() => approve(c)}
                      className="text-orange-600"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  )}

                  {(isAdmin || isFinance) && c.status === "unpaid" && (
                    <button
                      onClick={() => markPaid(c)}
                      className="text-green-600"
                    >
                      Pay
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-3 text-center text-gray-400">Processing...</div>
        )}
      </div>
    </div>
  );
};

export default CommissionPage;

/* ---------------- UI ---------------- */

const Th = ({ children }) => (
  <th className="p-3 text-left">{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`p-3 ${className}`}>{children}</td>
);

const Badge = ({ status }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs ${
      status === "paid"
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {status}
  </span>
);
