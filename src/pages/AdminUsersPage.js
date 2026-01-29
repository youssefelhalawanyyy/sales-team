// Admin Users Page – Improved Interface (UI Only)

import React, { useState, useEffect } from "react";
import { db, auth, secondaryAuth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import {
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  Lock,
  UserX,
  Users,
} from "lucide-react";

/* ------------------------------------
   USER MANAGEMENT – MODERN UI
------------------------------------ */

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "team_leader", label: "Team Leader" },
  { value: "sales_member", label: "Sales Member" },
];

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "sales_member",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));

    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (editingUser) {
        await updateDoc(doc(db, "users", editingUser.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          updatedAt: serverTimestamp(),
        });

        setSuccessMessage("User updated successfully");
      } else {
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email,
          formData.password
        );

        await addDoc(collection(db, "users"), {
          uid: cred.user.uid,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: true,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid,
        });

        await signOut(secondaryAuth);

        setSuccessMessage("User created successfully");
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "sales_member",
    });

    setEditingUser(null);
    setShowForm(false);

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  /* ---------------- ACTIONS ---------------- */

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);

    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
    });
  };

  const toggleUserStatus = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      isActive: !user.isActive,
      updatedAt: serverTimestamp(),
    });

    fetchUsers();
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  /* ---------------- PERMISSIONS ---------------- */

  const canManageUsers =
    users.find((u) => u.uid === auth.currentUser?.uid)?.role === "admin";

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="text-indigo-600" />
          <h1 className="text-2xl md:text-3xl font-bold">
            User Management
          </h1>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow"
          >
            <Plus size={18} />
            {editingUser ? "Edit User" : "Add User"}
          </button>
        )}
      </div>

      {/* ALERTS */}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex gap-2 text-sm">
          <CheckCircle className="text-green-600" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex gap-2 text-sm">
          <AlertCircle className="text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* FORM */}

      {showForm && canManageUsers && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold text-lg mb-4">
            {editingUser ? "Edit User" : "Create New User"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
              className="input"
            />

            <input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
              className="input"
            />

            <input
              placeholder="Email"
              type="email"
              value={formData.email}
              disabled={!!editingUser}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="input"
            />

            {!editingUser && (
              <input
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="input"
              />
            )}

            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
              >
                {editingUser ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}

      <div className="bg-white shadow rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <Td>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                </Td>

                <Td>{user.email}</Td>

                <Td className="capitalize">
                  {user.role.replace("_", " ")}
                </Td>

                <Td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Disabled"}
                  </span>
                </Td>

                <Td className="flex justify-end gap-2 p-2">
                  {canManageUsers && (
                    <>
                      <IconBtn
                        onClick={() => handleEdit(user)}
                        color="text-blue-600"
                      >
                        <Edit2 size={16} />
                      </IconBtn>

                      <IconBtn
                        onClick={() => toggleUserStatus(user)}
                        color="text-orange-600"
                      >
                        <UserX size={16} />
                      </IconBtn>

                      <IconBtn
                        onClick={() => resetPassword(user.email)}
                        color="text-purple-600"
                      >
                        <Lock size={16} />
                      </IconBtn>
                    </>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INPUT STYLE */}
      <style>{`
        .input {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          width: 100%;
          outline: none;
        }

        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }
      `}</style>
    </div>
  );
};

/* ---------------- SMALL UI COMPONENTS ---------------- */

const Th = ({ children, align = "left" }) => (
  <th className={`p-3 text-${align} font-medium`}>{children}</th>
);

const Td = ({ children }) => <td className="p-3">{children}</td>;

const IconBtn = ({ children, onClick, color }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded hover:bg-gray-100 ${color}`}
  >
    {children}
  </button>
);
