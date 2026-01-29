import React, { useEffect, useState } from 'react';

import { db } from '../firebase';

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';

import { Plus, Trash2, Edit } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

import { formatCurrency } from '../utils/currency';

/* ============================= */

const STATUSES = [
  { value: 'potential_client', label: 'Potential Client' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' }
];

/* ============================= */

export default function SalesDealsPage() {
  console.log('SALES PAGE LOADED');

  const { currentUser, userRole } = useAuth();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState(null);

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    phoneNumber: '',
    status: 'potential_client',
    price: '',
    notes: ''
  });

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid) loadDeals();
  }, [currentUser]);

  /* ============================= */

  async function loadDeals() {
    try {
      setLoading(true);

      const q = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setDeals(list.filter(d => !d.archived));

    } catch (e) {
      console.error(e);
      alert('Failed loading deals');
    }

    setLoading(false);
  }

  /* ============================= */

  async function createDeal(e) {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'sales'), {
        ...form,

        price: Number(form.price) || 0,

        createdBy: currentUser.uid,
        createdByName:
          currentUser.firstName + ' ' + currentUser.lastName,

        archived: false,

        createdAt: serverTimestamp()
      });

      setForm({
        businessName: '',
        contactPerson: '',
        phoneNumber: '',
        status: 'potential_client',
        price: '',
        notes: ''
      });

      setShowForm(false);

      loadDeals();

    } catch (e) {
      alert('Create failed');
      console.error(e);
    }
  }

  /* ============================= */

  async function saveEdit() {
    try {
      await updateDoc(
        doc(db, 'sales', editDeal.id),
        {
          ...editDeal,
          price: Number(editDeal.price) || 0
        }
      );

      setEditDeal(null);

      loadDeals();

    } catch (e) {
      alert('Update failed');
    }
  }

  /* ============================= */

  async function archiveDeal(id) {
    if (!window.confirm('Archive deal?')) return;

    await updateDoc(doc(db, 'sales', id), {
      archived: true
    });

    loadDeals();
  }

  /* ============================= */

  async function deleteDeal(id) {
    if (userRole !== 'admin') return;

    if (!window.confirm('DELETE FOREVER?')) return;

    await deleteDoc(doc(db, 'sales', id));

    loadDeals();
  }

  /* ============================= */

  const filtered = deals.filter(d => {
    const s =
      d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      d.contactPerson?.toLowerCase().includes(search.toLowerCase());

    const f = filter === 'all' || d.status === filter;

    return s && f;
  });

  /* ============================= */

  const totalRevenue = filtered
    .filter(d => d.status === 'closed')
    .reduce((s, d) => s + (d.price || 0), 0);

  /* ============================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold text-slate-900">
          Sales Deals
        </h1>

        <button
          onClick={() => setShowForm(true)}
          className="btn-blue flex gap-2 items-center"
        >
          <Plus size={18} /> Add
        </button>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Stat title="Deals" value={filtered.length} />
        <Stat title="Closed" value={
          filtered.filter(d => d.status === 'closed').length
        } />
        <Stat title="Revenue" value={
          formatCurrency(totalRevenue)
        } />
        <Stat title="Pending" value={
          filtered.filter(d => d.status === 'pending_approval').length
        } />

      </div>

      {/* FILTERS */}

      <div className="flex gap-3 flex-wrap">

        <input
          placeholder="Search..."
          className="input w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="input"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All</option>

          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}

        </select>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="loader"></div>
        </div>
      )}

      {/* TABLE */}

      {!loading && (

        <div className="bg-white rounded shadow overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(d => (

                <tr key={d.id} className="border-t">

                  <td>{d.businessName}</td>
                  <td>{d.contactPerson}</td>

                  <td>
                    <span className={`badge ${
                      d.status === 'closed'
                        ? 'badge-green'
                        : d.status === 'pending_approval'
                        ? 'badge-yellow'
                        : d.status === 'lost'
                        ? 'badge-red'
                        : 'badge-blue'
                    }`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td>{formatCurrency(d.price || 0)}</td>

                  <td className="flex gap-2 py-2">

                    <button
                      onClick={() => setEditDeal(d)}
                      className="text-blue-600"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => archiveDeal(d.id)}
                      className="text-yellow-600"
                    >
                      Archive
                    </button>

                    {userRole === 'admin' && (

                      <button
                        onClick={() => deleteDeal(d.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* CREATE */}

      {showForm && (

        <Modal onClose={() => setShowForm(false)}>

          <h2 className="font-bold mb-3">New Deal</h2>

          <form onSubmit={createDeal} className="space-y-2">

            <input
              className="input"
              placeholder="Business"
              required
              value={form.businessName}
              onChange={e =>
                setForm({ ...form, businessName: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Contact"
              required
              value={form.contactPerson}
              onChange={e =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Phone"
              required
              value={form.phoneNumber}
              onChange={e =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />

            <select
              className="input"
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >

              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}

            </select>

            <input
              className="input"
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={e =>
                setForm({ ...form, price: e.target.value })
              }
            />

            <textarea
              className="input"
              placeholder="Notes"
              value={form.notes}
              onChange={e =>
                setForm({ ...form, notes: e.target.value })
              }
            />

            <div className="flex gap-2 justify-end">

              <button className="btn-blue">
                Create
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-gray"
              >
                Cancel
              </button>

            </div>

          </form>

        </Modal>

      )}

      {/* EDIT */}

      {editDeal && (

        <Modal onClose={() => setEditDeal(null)}>

          <h2 className="font-bold mb-3">Edit Deal</h2>

          <div className="space-y-2">

            <input
              className="input"
              value={editDeal.businessName}
              onChange={e =>
                setEditDeal({
                  ...editDeal,
                  businessName: e.target.value
                })
              }
            />

            <input
              className="input"
              value={editDeal.contactPerson}
              onChange={e =>
                setEditDeal({
                  ...editDeal,
                  contactPerson: e.target.value
                })
              }
            />

            <input
              className="input"
              value={editDeal.phoneNumber}
              onChange={e =>
                setEditDeal({
                  ...editDeal,
                  phoneNumber: e.target.value
                })
              }
            />

            <select
              className="input"
              value={editDeal.status}
              onChange={e =>
                setEditDeal({
                  ...editDeal,
                  status: e.target.value
                })
              }
            >

              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}

            </select>

            <input
              className="input"
              type="number"
              value={editDeal.price}
              onChange={e =>
                setEditDeal({
                  ...editDeal,
                  price: e.target.value
                })
              }
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={saveEdit}
                className="btn-blue"
              >
                Save
              </button>

              <button
                onClick={() => setEditDeal(null)}
                className="btn-gray"
              >
                Cancel
              </button>

            </div>

          </div>

        </Modal>

      )}

    </div>
  );
}

/* ============================= */

function Stat({ title, value }) {
  return (
    <div className="kpi-card">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* ============================= */

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
