import React, { useEffect, useState } from 'react';

import { auth, db } from '../firebase';

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';

/* ============================= */

const ROLES = [
  'admin',
  'sales_manager',
  'team_leader',
  'sales_member',
  'finance_manager'
];

/* ============================= */

export default function AdminUsersPage() {

  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'sales_member'
  });

  /* ============================= */

  useEffect(() => {
    loadUsers();
  }, []);

  /* ============================= */

  async function loadUsers() {

    const snap = await getDocs(collection(db, 'users'));

    setUsers(
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
    );
  }

  /* ============================= */

  async function createUser(e) {
    e.preventDefault();

    if (!form.password || form.password.length < 6) {
      alert('Password min 6 chars');
      return;
    }

    setLoading(true);

    try {

      /* CREATE AUTH ACCOUNT */
      const cred =
        await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      const uid = cred.user.uid;

      /* CREATE FIRESTORE PROFILE */
      await setDoc(doc(db, 'users', uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,

        role: form.role,

        isActive: true,

        createdBy: currentUser.uid,

        createdAt: serverTimestamp()
      });

      alert('User created');

      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'sales_member'
      });

      setShowForm(false);

      loadUsers();

    } catch (err) {

      if (err.code === 'auth/email-already-in-use') {
        alert('Email already exists');
      } else {
        alert(err.message);
      }

      console.error(err);
    }

    setLoading(false);
  }

  /* ============================= */

  async function updateUser(id, data) {

    try {

      await updateDoc(doc(db, 'users', id), {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive
      });

      alert('Updated');

      loadUsers();

    } catch (err) {
      alert('Update failed');
      console.error(err);
    }
  }

  /* ============================= */

  async function resetPassword(email) {

    if (!window.confirm('Send reset email?')) return;

    try {

      await sendPasswordResetEmail(auth, email);

      alert('Reset email sent');

    } catch (err) {
      alert(err.message);
    }
  }

  /* ============================= */

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        User Management
      </h1>

      <button
        onClick={() => setShowForm(true)}
        className="btn-blue"
      >
        Add User
      </button>

      {/* USERS TABLE */}

      <div className="bg-white rounded shadow overflow-x-auto">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {users.map(u => (

              <UserRow
                key={u.id}
                user={u}
                onSave={updateUser}
                onReset={resetPassword}
              />

            ))}

          </tbody>

        </table>

      </div>

      {/* CREATE MODAL */}

      {showForm && (

        <Modal onClose={() => setShowForm(false)}>

          <h2 className="font-bold mb-3">
            New User
          </h2>

          <form onSubmit={createUser} className="space-y-2">

            <input
              className="input"
              placeholder="First Name"
              required
              value={form.firstName}
              onChange={e =>
                setForm({ ...form, firstName: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Last Name"
              required
              value={form.lastName}
              onChange={e =>
                setForm({ ...form, lastName: e.target.value })
              }
            />

            <input
              className="input"
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={e =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              className="input"
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={e =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <select
              className="input"
              value={form.role}
              onChange={e =>
                setForm({ ...form, role: e.target.value })
              }
            >

              {ROLES.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}

            </select>

            <div className="flex justify-end gap-2">

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

    </div>
  );
}

/* ============================= */

function UserRow({ user, onSave, onReset }) {

  const [edit, setEdit] = useState(false);

  const [data, setData] = useState({ ...user });

  return (
    <tr className="border-t">

      <td>
        {edit ? (
          <input
            className="input"
            value={data.firstName}
            onChange={e =>
              setData({ ...data, firstName: e.target.value })
            }
          />
        ) : (
          user.firstName + ' ' + user.lastName
        )}
      </td>

      <td>{user.email}</td>

      <td>
        {edit ? (

          <select
            className="input"
            value={data.role}
            onChange={e =>
              setData({ ...data, role: e.target.value })
            }
          >

            {ROLES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}

          </select>

        ) : (
          user.role
        )}
      </td>

      <td>
        {edit ? (

          <select
            className="input"
            value={data.isActive}
            onChange={e =>
              setData({
                ...data,
                isActive: e.target.value === 'true'
              })
            }
          >
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>

        ) : (
          user.isActive ? 'Active' : 'Disabled'
        )}
      </td>

      <td className="flex gap-2 py-2">

        {edit ? (

          <>

            <button
              onClick={() => {
                onSave(user.id, data);
                setEdit(false);
              }}
              className="btn-blue"
            >
              Save
            </button>

            <button
              onClick={() => {
                setEdit(false);
                setData(user);
              }}
              className="btn-gray"
            >
              Cancel
            </button>

          </>

        ) : (

          <>

            <button
              onClick={() => setEdit(true)}
              className="text-blue-600"
            >
              Edit
            </button>

            <button
              onClick={() => onReset(user.email)}
              className="text-purple-600"
            >
              Reset
            </button>

          </>

        )}

      </td>

    </tr>
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
