import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail,
  Plus,
  Copy,
  Trash2,
  Edit,
  X,
  Search,
  Filter,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  Shield
} from 'lucide-react';

export default function EmailTemplatesPage() {
  const { currentUser, userRole } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState(null);
  const isAdmin = userRole === 'admin';

  const [form, setForm] = useState({
    name: '',
    category: 'general',
    subject: '',
    body: '',
    description: '',
    isAdminTemplate: true // Admin templates are available to all by default
  });

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closingdeals', label: 'Closing Deals' },
    { value: 'objections', label: 'Objections' },
    { value: 'introductions', label: 'Introductions' },
    { value: 'thankyou', label: 'Thank You' },
    { value: 'checkup', label: 'Check-up' }
  ];

  const defaultTemplates = [
    {
      name: 'Initial Contact',
      category: 'introductions',
      subject: 'Hello {{clientName}} - Your {{productService}} Solution',
      body: `Hi {{clientName}},

I hope this email finds you well. I wanted to reach out because I believe our {{productService}} solution could help {{company}} achieve {{goal}}.

With our solution, similar clients have seen:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

I'd love to discuss how we could support your goals. Are you free for a brief call next week?

Best regards,
{{senderName}}
{{senderTitle}}
{{senderCompany}}`,
      isAdminTemplate: true
    },
    {
      name: 'Follow-up After Meeting',
      category: 'followup',
      subject: 'Great meeting with you, {{clientName}} - Next steps',
      body: `Hi {{clientName}},

Thank you for taking the time to speak with me on {{meetingDate}}. I really enjoyed learning more about {{company}}'s goals.

As discussed, here are the key takeaways:
• {{takeaway1}}
• {{takeaway2}}
• {{takeaway3}}

I'll send over the {{documentType}} by {{dueDate}}. Please let me know if you have any questions in the meantime.

Looking forward to moving forward together.

Best regards,
{{senderName}}`,
      isAdminTemplate: true
    },
    {
      name: 'Proposal Sent',
      category: 'proposal',
      subject: 'Your Custom Proposal - {{company}}',
      body: `Hi {{clientName}},

I've attached a custom proposal tailored to {{company}}'s specific needs.

Key highlights:
• Investment: {{investment}}
• Implementation Timeline: {{timeline}}
• Expected ROI: {{roi}}

This proposal is valid until {{validDate}}. I'm happy to walk through any details or adjust anything to better fit your needs.

Can we schedule 15 minutes this week to discuss?

Best regards,
{{senderName}}`,
      isAdminTemplate: true
    },
    {
      name: 'Overcoming Objections',
      category: 'objections',
      subject: 'Re: Your concern about {{objection}}',
      body: `Hi {{clientName}},

Thank you for raising the concern about {{objection}}. This is a common question, and I'm glad you asked.

Here's how we address this:
{{objectiveResponse}}

In fact, our clients typically see {{result}} after the first {{timeframe}}.

I'd like to discuss how this specifically applies to {{company}}. Are you available for a quick call tomorrow or Wednesday?

Best regards,
{{senderName}}`,
      isAdminTemplate: true
    },
    {
      name: 'Closing/Next Steps',
      category: 'closingdeals',
      subject: 'Let\'s move forward - Next steps for {{company}}',
      body: `Hi {{clientName}},

Based on our conversations, I believe we have a great partnership opportunity. I'm excited to get started.

Here's what I suggest for next steps:
1. {{step1}} - {{step1Date}}
2. {{step2}} - {{step2Date}}
3. {{step3}} - {{step3Date}}

Once you're ready, I can have everything set up within {{timeframe}}.

Should I go ahead and get the paperwork started?

Best regards,
{{senderName}}`,
      isAdminTemplate: true
    },
    {
      name: 'Client Check-in',
      category: 'checkup',
      subject: 'Checking in - How are things going with {{productService}}?',
      body: `Hi {{clientName}},

I wanted to check in and see how things are going with {{productService}}. 

Specifically:
• {{question1}}
• {{question2}}
• {{question3}}

I'd love to hear about {{company}}'s experience so far and see if there's anything I can help improve.

Free for a quick call next week?

Best regards,
{{senderName}}`,
      isAdminTemplate: true
    },
    {
      name: 'Thank You After Close',
      category: 'thankyou',
      subject: 'Thank you for choosing us, {{clientName}}!',
      body: `Hi {{clientName}},

I just wanted to personally thank you for choosing us. We're thrilled to partner with {{company}}.

Your success is our success, and we're committed to delivering {{expectedOutcome}}.

Your account manager {{managerName}} will be in touch shortly to kick things off. They'll be your point of contact for any questions.

Welcome to the team!

Best regards,
{{senderName}}
{{senderTitle}}
{{senderCompany}}`,
      isAdminTemplate: true
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, [currentUser, userRole]);

  async function loadTemplates() {
    try {
      setLoading(true);
      let allTemplates = [];
      
      // Always load admin-created templates (available to everyone)
      const adminQuery = query(
        collection(db, 'emailTemplates'),
        where('isAdminTemplate', '==', true)
      );
      const adminSnap = await getDocs(adminQuery);
      const adminTemplates = adminSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      allTemplates = [...adminTemplates];

      // If not admin, also load user's personal templates
      if (userRole !== 'admin') {
        const userQuery = query(
          collection(db, 'emailTemplates'),
          where('createdBy', '==', currentUser.uid),
          where('isAdminTemplate', '!=', true)
        );
        const userSnap = await getDocs(userQuery);
        const userTemplates = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        allTemplates = [...allTemplates, ...userTemplates];
      } else {
        // If admin, load all templates (admin and personal)
        const allQuery = query(collection(db, 'emailTemplates'));
        const allSnap = await getDocs(allQuery);
        allTemplates = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setTemplates(allTemplates);
    } catch (e) {
      console.error('Error loading templates:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTemplate() {
    if (!form.name || !form.subject || !form.body) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'emailTemplates', editingId), {
          ...form,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'emailTemplates'), {
          ...form,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setForm({ name: '', category: 'general', subject: '', body: '', description: '', isAdminTemplate: true });
      setEditingId(null);
      setShowForm(false);
      loadTemplates();
      alert(editingId ? 'Template updated!' : 'Template created!');
    } catch (e) {
      console.error('Error saving template:', e);
      alert('Failed to save template');
    }
  }

  async function handleDeleteTemplate(id) {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDoc(doc(db, 'emailTemplates', id));
      loadTemplates();
      alert('Template deleted!');
    } catch (e) {
      console.error('Error deleting template:', e);
      alert('Failed to delete template');
    }
  }

  async function handleCreateDefault() {
    try {
      for (const template of defaultTemplates) {
        const existing = templates.find(
          t => t.name === template.name && t.isAdminTemplate === true
        );
        if (!existing) {
          await addDoc(collection(db, 'emailTemplates'), {
            ...template,
            description: '',
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      loadTemplates();
      alert('Default templates created!');
    } catch (e) {
      console.error('Error creating default templates:', e);
      alert('Failed to create default templates');
    }
  }

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  // Check if user can edit a template (admin or template creator)
  const canEditTemplate = (template) => {
    return isAdmin || template.createdBy === currentUser.uid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl">
              <Mail className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-gray-500">Create and manage reusable email templates</p>
            </div>
          </div>

          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={handleCreateDefault}
                className="px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Load Defaults
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setForm({ name: '', category: 'general', subject: '', body: '', description: '', isAdminTemplate: true });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg"
              >
                <Plus size={20} />
                New Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Initial Outreach"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={form.isAdminTemplate}
                  onChange={(e) => setForm({ ...form, isAdminTemplate: e.target.checked })}
                  className="mr-2"
                />
                Make this template available to all users
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {form.isAdminTemplate 
                  ? 'This template will be visible to all users' 
                  : 'This template will only be visible to you'}
              </p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., Hello {{clientName}} - Your Solution Awaits"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">Use double curly braces for dynamic content</p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your email template here..."
                rows="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Helpful variables: clientName, company, productService, senderName, senderTitle</p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="When to use this template..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveTemplate}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md"
            >
              Save Template
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ name: '', category: 'general', subject: '', body: '', description: '', isAdminTemplate: true });
              }}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No templates yet</p>
            <p className="text-gray-400 text-sm mt-1">
              {isAdmin ? 'Create your first template or load defaults' : 'Ask your admin to create templates'}
            </p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    {template.isAdminTemplate && (
                      <Shield size={16} className="text-blue-600" title="Available to all users" />
                    )}
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {categories.find(c => c.value === template.category)?.label}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {template.subject?.length || 0} chars
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-2">{template.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <Eye size={16} />
                  Preview
                </button>
                {canEditTemplate(template) && (
                  <button
                    onClick={() => {
                      setForm(template);
                      setEditingId(template.id);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}
                {canEditTemplate(template) && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>

              {previewId === template.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-600 mb-2">SUBJECT:</p>
                    <p className="text-sm text-gray-900 mb-4">{template.subject}</p>
                    <p className="text-xs font-bold text-gray-600 mb-2">BODY:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.body}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}