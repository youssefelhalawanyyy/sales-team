import React, { useEffect, useState, useMemo } from 'react';
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
import {
  Users, UserPlus, Search, Filter, Mail, Lock,
  X, Check, RotateCcw, Edit2, Activity,
  Shield, UserCheck, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════ */
const ROLES = ['admin','sales_manager','team_leader','sales_member','finance_manager'];

const ROLE_META = {
  admin:           { label:'Admin',          color:'#d97706', bg:'rgba(245,158,11,0.1)',   text:'#d97706' },
  sales_manager:   { label:'Sales Manager',  color:'#7c3aed', bg:'rgba(139,92,246,0.1)',   text:'#7c3aed' },
  team_leader:     { label:'Team Leader',    color:'#0891b2', bg:'rgba(6,182,212,0.1)',    text:'#0891b2' },
  sales_member:    { label:'Sales Member',   color:'#059669', bg:'rgba(16,185,129,0.1)',   text:'#059669' },
  finance_manager: { label:'Finance Manager',color:'#db2777', bg:'rgba(236,72,153,0.1)',   text:'#db2777' },
};

const AVATAR_COLORS = ['#0d9488','#7c3aed','#d97706','#db2777','#0891b2','#059669','#e11d48','#4f46e5'];
/* ═══════════════════════════════════════════ */

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', password:'', role:'sales_member'
  });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function createUser(e) {
    e.preventDefault();
    if (!form.password || form.password.length < 6) { alert('Password min 6 chars'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid  = cred.user.uid;
      await setDoc(doc(db, 'users', uid), {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, role: form.role, isActive: true,
        createdBy: currentUser.uid, createdAt: serverTimestamp()
      });
      alert('User created');
      setForm({ firstName:'', lastName:'', email:'', password:'', role:'sales_member' });
      setShowForm(false);
      loadUsers();
    } catch (err) {
      alert(err.code === 'auth/email-already-in-use' ? 'Email already exists' : err.message);
      console.error(err);
    }
    setLoading(false);
  }

  async function updateUser(id, data) {
    try {
      await updateDoc(doc(db, 'users', id), {
        firstName: data.firstName, lastName: data.lastName,
        role: data.role, isActive: data.isActive
      });
      alert('Updated');
      loadUsers();
    } catch (err) { alert('Update failed'); console.error(err); }
  }

  async function resetPassword(email) {
    if (!window.confirm('Send reset email?')) return;
    try { await sendPasswordResetEmail(auth, email); alert('Reset email sent'); }
    catch (err) { alert(err.message); }
  }

  /* ─── Derived ─── */
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !s ||
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const activeCount   = users.filter(u => u.isActive).length;
  const disabledCount = users.length - activeCount;
  const roleCounts    = useMemo(() => {
    const m = {};
    ROLES.forEach(r => { m[r] = users.filter(u => u.role === r).length; });
    return m;
  }, [users]);

  /* ═══════════════════════════════════════════ */
  return (
    <div className="aup-root">
      {/* ─── Header ─── */}
      <div className="aup-header">
        <div className="aup-header-left">
          <div className="aup-header-icon"><Users size={22}/></div>
          <div>
            <h1 className="aup-title">User Management</h1>
            <p className="aup-subtitle">Manage team members, roles &amp; permissions</p>
          </div>
        </div>
        <button className="aup-btn-add" onClick={() => setShowForm(true)}>
          <UserPlus size={17}/><span>Add User</span>
        </button>
      </div>

      {/* ─── Analytics Cards ─── */}
      <div className="aup-analytics">
        <StatCard icon={<Users size={20}/>}     label="Total Users"  value={users.length}    accent="#0d9488" sub={`${activeCount} active`}/>
        <StatCard icon={<UserCheck size={20}/>} label="Active"       value={activeCount}     accent="#059669" sub="currently enabled"/>
        <StatCard icon={<Shield size={20}/>}    label="Disabled"     value={disabledCount}   accent="#d97706" sub="access restricted"/>
        <StatCard icon={<Activity size={20}/>}  label="Admins"       value={roleCounts.admin||0} accent="#db2777" sub="full access"/>
      </div>

      {/* ─── Role Breakdown ─── */}
      <div className="aup-role-bar">
        {ROLES.map(r => {
          const pct = users.length ? (roleCounts[r] / users.length)*100 : 0;
          const m = ROLE_META[r];
          return (
            <div key={r} className="aup-role-item">
              <div className="aup-role-header">
                <span className="aup-role-dot" style={{background:m.color}}/>
                <span className="aup-role-name">{m.label}</span>
                <span className="aup-role-count">{roleCounts[r]}</span>
              </div>
              <div className="aup-role-track">
                <div className="aup-role-fill" style={{width:`${pct}%`, background:m.color}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="aup-toolbar">
        <div className="aup-search-wrap">
          <Search size={16} className="aup-search-icon"/>
          <input className="aup-search" placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="aup-filter-wrap">
          <Filter size={15} className="aup-filter-icon"/>
          <select className="aup-filter" value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
          </select>
          <ChevronDown size={14} className="aup-filter-chevron"/>
        </div>
        <span className="aup-count-label">{filtered.length} user{filtered.length!==1?'s':''}</span>
      </div>

      {/* ─── Table ─── */}
      <div className="aup-table-wrap">
        <table className="aup-table">
          <thead>
            <tr>
              <th className="aup-th">Member</th>
              <th className="aup-th">Email</th>
              <th className="aup-th">Role</th>
              <th className="aup-th">Status</th>
              <th className="aup-th aup-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="aup-empty">
                <Users size={32} className="aup-empty-icon"/>
                <p>No users match your criteria</p>
              </td></tr>
            ) : filtered.map((u,i) => (
              <UserRow key={u.id} user={u} index={i} onSave={updateUser} onReset={resetPassword}/>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Modal ─── */}
      {showForm && (
        <div className="aup-overlay" onClick={()=>setShowForm(false)}>
          <div className="aup-modal" onClick={e=>e.stopPropagation()}>
            <div className="aup-modal-head">
              <div className="aup-modal-title-row">
                <div className="aup-modal-icon"><UserPlus size={20}/></div>
                <h2 className="aup-modal-title">Create New User</h2>
              </div>
              <button className="aup-modal-close" onClick={()=>setShowForm(false)}><X size={18}/></button>
            </div>
            <form onSubmit={createUser} className="aup-modal-body">
              <div className="aup-modal-row">
                <ModalField label="First Name" placeholder="e.g. Ahmed">
                  <input required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/>
                </ModalField>
                <ModalField label="Last Name" placeholder="e.g. Hassan">
                  <input required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/>
                </ModalField>
              </div>
              <ModalField label="Email Address" placeholder="ahmed@company.com" icon={<Mail size={15}/>}>
                <input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
              </ModalField>
              <ModalField label="Password" placeholder="Min 6 characters" icon={<Lock size={15}/>}>
                <input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
              </ModalField>
              <ModalField label="Role">
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_META[r].label}</option>)}
                </select>
              </ModalField>
              <div className="aup-modal-actions">
                <button type="button" className="aup-btn-cancel" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="aup-btn-create" disabled={loading}>
                  {loading ? <span className="aup-spinner"/> : <Check size={16}/>}
                  <span>{loading?'Creating…':'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .aup-root {
          min-height: 100%;
          background: #f0f4f8;
          color: #374151;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ─── Header ─── */
        .aup-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
        .aup-header-left { display:flex; align-items:center; gap:16px; }
        .aup-header-icon {
          width:48px; height:48px; border-radius:14px;
          background:#fff;
          border:1px solid #e2e8f0;
          display:flex; align-items:center; justify-content:center;
          color:#0d9488; box-shadow:0 2px 8px rgba(0,0,0,0.06);
        }
        .aup-title { font-size:22px; font-weight:600; color:#1e293b; letter-spacing:-0.3px; }
        .aup-subtitle { font-size:13px; color:#64748b; margin-top:2px; }
        .aup-btn-add {
          display:flex; align-items:center; gap:8px;
          padding:10px 22px; background:linear-gradient(135deg,#0d9488,#14b8a6);
          border:none; border-radius:10px; color:#fff; font-size:14px; font-weight:600;
          cursor:pointer; box-shadow:0 3px 12px rgba(13,148,136,0.3);
          transition:transform .15s, box-shadow .2s;
        }
        .aup-btn-add:hover { transform:translateY(-1px); box-shadow:0 5px 18px rgba(13,148,136,0.4); }

        /* ─── Stat Cards ─── */
        .aup-analytics { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .stat-card {
          background:#fff;
          border:1px solid #e2e8f0; border-radius:16px;
          padding:22px 20px; display:flex; align-items:flex-start; gap:16px;
          position:relative; overflow:hidden;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
          transition:border-color .2s, box-shadow .2s;
        }
        .stat-card:hover { border-color:#cbd5e1; box-shadow:0 4px 16px rgba(0,0,0,0.08); }
        .stat-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:var(--accent); border-radius:16px 16px 0 0;
        }
        .stat-icon {
          width:40px; height:40px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; background:var(--accent-bg); color:var(--accent);
        }
        .stat-info { flex:1; }
        .stat-value { font-size:28px; font-weight:700; color:#1e293b; line-height:1; margin-bottom:4px; }
        .stat-label { font-size:13px; color:#64748b; font-weight:500; }
        .stat-sub { font-size:11px; color:#94a3b8; margin-top:4px; }

        /* ─── Role Bar ─── */
        .aup-role-bar {
          display:grid; grid-template-columns:repeat(5,1fr); gap:12px;
          background:#fff;
          border:1px solid #e2e8f0; border-radius:14px;
          padding:18px 20px;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
        }
        .aup-role-item { display:flex; flex-direction:column; gap:8px; }
        .aup-role-header { display:flex; align-items:center; gap:7px; }
        .aup-role-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .aup-role-name { font-size:11px; color:#64748b; flex:1; }
        .aup-role-count { font-size:12px; font-weight:600; color:#1e293b; }
        .aup-role-track { height:4px; border-radius:2px; background:#f1f5f9; overflow:hidden; }
        .aup-role-fill { height:100%; border-radius:2px; transition:width .4s ease; }

        /* ─── Toolbar ─── */
        .aup-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .aup-search-wrap { position:relative; flex:1; min-width:200px; max-width:340px; }
        .aup-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
        .aup-search {
          width:100%; padding:10px 16px 10px 40px;
          background:#fff; border:1px solid #e2e8f0;
          border-radius:10px; color:#1e293b; font-size:13px;
          outline:none; transition:border-color .2s, box-shadow .2s; caret-color:#0d9488;
          box-shadow:0 1px 3px rgba(0,0,0,0.04);
        }
        .aup-search::placeholder { color:#94a3b8; }
        .aup-search:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.12); }
        .aup-filter-wrap { position:relative; display:flex; align-items:center; }
        .aup-filter-icon { position:absolute; left:12px; color:#94a3b8; pointer-events:none; }
        .aup-filter-chevron { position:absolute; right:12px; color:#94a3b8; pointer-events:none; }
        .aup-filter {
          appearance:none; -webkit-appearance:none;
          padding:10px 36px 10px 34px;
          background:#fff; border:1px solid #e2e8f0;
          border-radius:10px; color:#1e293b; font-size:13px;
          cursor:pointer; outline:none; transition:border-color .2s;
          box-shadow:0 1px 3px rgba(0,0,0,0.04);
        }
        .aup-filter:focus { border-color:#0d9488; }
        .aup-filter option { background:#fff; color:#1e293b; }
        .aup-count-label { margin-left:auto; font-size:12px; color:#94a3b8; }

        /* ─── Table ─── */
        .aup-table-wrap {
          background:#fff;
          border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
        }
        .aup-table { width:100%; border-collapse:collapse; }
        .aup-th {
          text-align:left; padding:14px 20px;
          font-size:11px; font-weight:600; color:#64748b;
          text-transform:uppercase; letter-spacing:0.8px;
          border-bottom:1px solid #f1f5f9; white-space:nowrap;
          background:#fafbfc;
        }
        .aup-th-actions { text-align:right; }
        .aup-tr { border-bottom:1px solid #f1f5f9; transition:background .15s; }
        .aup-tr:last-child { border-bottom:none; }
        .aup-tr:hover { background:#f8fafc; }
        .aup-td { padding:14px 20px; vertical-align:middle; font-size:13px; }
        .aup-member { display:flex; align-items:center; gap:12px; }
        .aup-avatar {
          width:36px; height:36px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:600; color:#fff;
          flex-shrink:0; letter-spacing:-0.5px;
        }
        .aup-member-name { color:#1e293b; font-weight:500; }
        .aup-member-email { font-size:11px; color:#94a3b8; margin-top:1px; }
        .aup-email { color:#64748b; font-size:13px; }
        .aup-role-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 11px; border-radius:20px;
          font-size:11px; font-weight:600; letter-spacing:0.3px;
        }
        .aup-role-badge-dot { width:6px; height:6px; border-radius:50%; }
        .aup-status { display:flex; align-items:center; gap:7px; font-size:13px; color:#374151; }
        .aup-status-dot { width:8px; height:8px; border-radius:50%; }
        .aup-status-active .aup-status-dot { background:#10b981; box-shadow:0 0 6px rgba(16,185,129,0.35); }
        .aup-status-disabled .aup-status-dot { background:#cbd5e1; }
        .aup-actions { display:flex; align-items:center; gap:4px; justify-content:flex-end; }
        .aup-act-btn {
          width:34px; height:34px; border-radius:8px;
          border:1px solid #e2e8f0;
          background:#fff; color:#64748b;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .15s, color .15s, border-color .15s;
          box-shadow:0 1px 2px rgba(0,0,0,0.04);
        }
        .aup-act-btn:hover { background:#f0fdfc; color:#0d9488; border-color:#a7f3d0; }
        .aup-act-btn.save { background:#edfbf7; color:#059669; border-color:#a7f3d0; }
        .aup-act-btn.save:hover { background:#d1fae5; }
        .aup-act-btn.cancel-edit { background:#f8fafc; color:#64748b; border-color:#e2e8f0; }
        .aup-edit-input {
          background:#f8fafc; border:1px solid #e2e8f0;
          border-radius:8px; padding:6px 10px;
          color:#1e293b; font-size:13px; outline:none;
          width:100%; max-width:150px; caret-color:#0d9488;
          transition:border-color .15s;
        }
        .aup-edit-input:focus { border-color:#0d9488; box-shadow:0 0 0 2px rgba(13,148,136,0.1); }
        .aup-edit-input option { background:#fff; }
        .aup-empty { text-align:center; padding:56px 20px; color:#94a3b8; font-size:14px; }
        .aup-empty-icon { margin:0 auto 12px; color:#cbd5e1; }

        /* ─── Modal ─── */
        .aup-overlay {
          position:fixed; inset:0; z-index:50;
          background:rgba(15,23,42,0.4); backdrop-filter:blur(4px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .aup-modal {
          position:relative; width:100%; max-width:480px;
          background:#fff;
          border:1px solid #e2e8f0; border-radius:20px;
          box-shadow:0 20px 60px rgba(0,0,0,0.12); overflow:hidden;
          animation:modalIn .25s cubic-bezier(.22,1,.36,1);
        }
        @keyframes modalIn { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .aup-modal-head { display:flex; align-items:center; justify-content:space-between; padding:24px 28px 0; }
        .aup-modal-title-row { display:flex; align-items:center; gap:12px; }
        .aup-modal-icon {
          width:38px; height:38px; border-radius:10px;
          background:#f0fdfc; border:1px solid #a7f3d0;
          display:flex; align-items:center; justify-content:center; color:#0d9488;
        }
        .aup-modal-title { font-size:17px; font-weight:600; color:#1e293b; }
        .aup-modal-close {
          width:32px; height:32px; border-radius:8px;
          border:1px solid #e2e8f0;
          background:#f8fafc; color:#64748b;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .15s, color .15s;
        }
        .aup-modal-close:hover { background:#f0fdfc; color:#0d9488; border-color:#a7f3d0; }
        .aup-modal-body { padding:28px; display:flex; flex-direction:column; gap:18px; }
        .aup-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .mf { display:flex; flex-direction:column; gap:6px; }
        .mf-label { font-size:11px; font-weight:600; color:#64748b; letter-spacing:0.5px; text-transform:uppercase; }
        .mf-wrap { position:relative; }
        .mf-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#0d9488; pointer-events:none; opacity:0.5; }
        .mf input, .mf select {
          width:100%; padding:11px 14px;
          background:#f8fafc; border:1px solid #e2e8f0;
          border-radius:10px; color:#1e293b; font-size:13px;
          outline:none; caret-color:#0d9488;
          transition:border-color .2s, box-shadow .2s;
          appearance:none; -webkit-appearance:none;
        }
        .mf input:focus, .mf select:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.12); background:#fff; }
        .mf input::placeholder { color:#94a3b8; }
        .mf select option { background:#fff; color:#1e293b; }
        .mf.has-icon input { padding-left:38px; }
        .aup-modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }
        .aup-btn-cancel {
          padding:10px 20px; border-radius:10px;
          border:1px solid #e2e8f0;
          background:#f8fafc; color:#64748b;
          font-size:13px; font-weight:500; cursor:pointer; transition:background .15s;
        }
        .aup-btn-cancel:hover { background:#f1f5f9; }
        .aup-btn-create {
          display:flex; align-items:center; gap:8px;
          padding:10px 24px; border-radius:10px; border:none;
          background:linear-gradient(135deg,#0d9488,#14b8a6);
          color:#fff; font-size:13px; font-weight:600; cursor:pointer;
          box-shadow:0 3px 12px rgba(13,148,136,0.3);
          transition:transform .15s, box-shadow .2s;
        }
        .aup-btn-create:hover { transform:translateY(-1px); box-shadow:0 5px 18px rgba(13,148,136,0.4); }
        .aup-btn-create:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .aup-spinner {
          width:16px; height:16px;
          border:2px solid rgba(255,255,255,0.3); border-top-color:#fff;
          border-radius:50%; animation:spin .55s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* ─── Responsive ─── */
        @media(max-width:900px){
          .aup-analytics{grid-template-columns:repeat(2,1fr)}
          .aup-role-bar{grid-template-columns:repeat(3,1fr)}
        }
        @media(max-width:600px){
          .aup-root{padding:16px}
          .aup-analytics{grid-template-columns:repeat(2,1fr)}
          .aup-role-bar{grid-template-columns:repeat(2,1fr)}
          .aup-table-wrap{overflow-x:auto}
          .aup-modal-row{grid-template-columns:1fr}
        }
      `}</style>
    </div>
  );
}

/* ═══ Stat Card ═══ */
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div className="stat-card" style={{'--accent':accent,'--accent-bg':accent+'1a'}}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ═══ Modal Field ═══ */
function ModalField({ label, placeholder, icon, children }) {
  const hasIcon = !!icon;
  const child = React.Children.only(children);
  const enhanced = React.cloneElement(child, { placeholder: placeholder || '' });
  return (
    <div className={`mf ${hasIcon?'has-icon':''}`}>
      <label className="mf-label">{label}</label>
      <div className="mf-wrap">
        {hasIcon && <span className="mf-icon">{icon}</span>}
        {enhanced}
      </div>
    </div>
  );
}

/* ═══ User Row ═══ */
function UserRow({ user, index, onSave, onReset }) {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({ ...user });

  const initials = ((user.firstName||'')[0]+(user.lastName||'')[0]).toUpperCase();
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const roleMeta = ROLE_META[user.role] || ROLE_META.sales_member;

  return (
    <tr className="aup-tr">
      <td className="aup-td">
        {edit ? (
          <div style={{display:'flex',gap:8}}>
            <input className="aup-edit-input" value={data.firstName} onChange={e=>setData({...data,firstName:e.target.value})} placeholder="First"/>
            <input className="aup-edit-input" value={data.lastName}  onChange={e=>setData({...data,lastName:e.target.value})}  placeholder="Last"/>
          </div>
        ) : (
          <div className="aup-member">
            <div className="aup-avatar" style={{background:avatarColor}}>{initials}</div>
            <div>
              <div className="aup-member-name">{user.firstName} {user.lastName}</div>
              <div className="aup-member-email">{user.email}</div>
            </div>
          </div>
        )}
      </td>
      <td className="aup-td"><span className="aup-email">{user.email}</span></td>
      <td className="aup-td">
        {edit ? (
          <select className="aup-edit-input" value={data.role} onChange={e=>setData({...data,role:e.target.value})}>
            {ROLES.map(r=><option key={r} value={r}>{ROLE_META[r].label}</option>)}
          </select>
        ) : (
          <span className="aup-role-badge" style={{background:roleMeta.bg,color:roleMeta.text}}>
            <span className="aup-role-badge-dot" style={{background:roleMeta.color}}/>
            {roleMeta.label}
          </span>
        )}
      </td>
      <td className="aup-td">
        {edit ? (
          <select className="aup-edit-input" value={String(data.isActive)} onChange={e=>setData({...data,isActive:e.target.value==='true'})}>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        ) : (
          <span className={`aup-status ${user.isActive?'aup-status-active':'aup-status-disabled'}`}>
            <span className="aup-status-dot"/>
            {user.isActive?'Active':'Disabled'}
          </span>
        )}
      </td>
      <td className="aup-td">
        <div className="aup-actions">
          {edit ? (
            <>
              <button className="aup-act-btn save" title="Save" onClick={()=>{onSave(user.id,data);setEdit(false)}}><Check size={15}/></button>
              <button className="aup-act-btn cancel-edit" title="Cancel" onClick={()=>{setEdit(false);setData(user)}}><X size={15}/></button>
            </>
          ) : (
            <>
              <button className="aup-act-btn" title="Edit" onClick={()=>setEdit(true)}><Edit2 size={15}/></button>
              <button className="aup-act-btn" title="Reset Password" onClick={()=>onReset(user.email)}><RotateCcw size={15}/></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}