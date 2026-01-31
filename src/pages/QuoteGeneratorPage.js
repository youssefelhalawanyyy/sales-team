import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Search,
  Trash2,
  Loader2
} from 'lucide-react';

export default function QuoteGeneratorPage() {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    dealId: '',
    quoteNumber: '',
    title: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    tax: 10,
    notes: '',
    validUntil: '',
    terms: 'Net 30'
  };

  const [form, setForm] = useState(initialForm);

  // FIX 1: Guard against currentUser being null on initial render
  useEffect(() => {
    if (currentUser) {
      loadDeals();
      loadQuotes();
    }
  }, [currentUser, userRole]);

  async function loadDeals() {
    try {
      let q;
      if (userRole === 'admin') {
        // FIX 2: Removed hard 'archived == false' filter.
        // Firestore does NOT match documents where the field is missing.
        // If your sales docs don't have 'archived' set, the old query returned nothing.
        // Now we fetch all, then filter in JS to safely handle missing fields.
        q = query(collection(db, 'sales'));
      } else {
        q = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid)
        );
      }
      const snap = await getDocs(q);
      const allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter out archived deals in JS — treats missing 'archived' field as not archived
      const activeDeals = allDeals.filter(d => d.archived !== true);
      setDeals(activeDeals);
    } catch (e) {
      console.error('Error loading deals:', e);
    }
  }

  async function loadQuotes() {
    try {
      setLoading(true);
      let q;
      if (userRole === 'admin') {
        q = query(collection(db, 'quotes'));
      } else {
        q = query(collection(db, 'quotes'), where('createdBy', '==', currentUser.uid));
      }
      const snap = await getDocs(q);
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error loading quotes:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuote() {
    // FIX 3: unitPrice validation — the old check `!i.unitPrice` treated 0 as invalid (falsy).
    // Now we explicitly check for empty string / null / undefined only.
    const hasInvalidItem = form.items.some(
      (i) =>
        !i.description ||
        i.unitPrice === '' ||
        i.unitPrice === null ||
        i.unitPrice === undefined ||
        isNaN(Number(i.unitPrice)) ||
        Number(i.unitPrice) < 0
    );

    if (!form.dealId || !form.title || hasInvalidItem) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    // Prevent double-submit
    setIsSubmitting(true);

    try {
      const deal = deals.find((d) => d.id === form.dealId);
      if (!deal) {
        alert('Deal not found. Please select a valid deal.');
        setIsSubmitting(false);
        return;
      }

      const subtotal = form.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0
      );
      const discountAmount = subtotal * (form.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (form.tax / 100);
      const total = taxableAmount + taxAmount;

      // FIX 4: Graceful fallback for client fields — handles any combination of field names
      const clientName = deal.clientName || deal.businessName || deal.name || 'Unknown Client';
      const clientEmail = deal.email || deal.clientEmail || '';
      const clientPhone = deal.phone || deal.clientPhone || '';

      const quoteData = {
        dealId: form.dealId,
        clientName,
        clientEmail,
        clientPhone,
        quoteNumber: form.quoteNumber || `QT-${Date.now()}`,
        title: form.title,
        items: form.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        subtotal,
        discount: form.discount,
        discountAmount,
        tax: form.tax,
        taxAmount,
        total,
        notes: form.notes,
        validUntil: form.validUntil,
        terms: form.terms,
        status: 'draft',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'quotes'), quoteData);

      setForm(initialForm);
      setSelectedDeal(null);
      setShowForm(false);
      await loadQuotes();
      alert('Quote created successfully!');
    } catch (e) {
      // FIX 5: Log the full error so you can see exactly what Firestore rejected
      console.error('Error creating quote:', e.code, e.message, e);
      alert(`Failed to create quote: ${e.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    if (form.items.length === 1) return; // Keep at least one item
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : value === '' ? '' : Number(value)
    };
    setForm({ ...form, items: newItems });
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const subtotal = form.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const discountAmount = subtotal * (form.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (form.tax / 100);
  const total = taxableAmount + taxAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl">
              <FileText className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote Generator</h1>
              <p className="text-gray-500">Create and manage professional quotes</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            {showForm ? 'Close Form' : 'New Quote'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Quote</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Deal Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deal <span className="text-red-500">*</span>
              </label>
              <select
                value={form.dealId}
                onChange={(e) => {
                  const deal = deals.find((d) => d.id === e.target.value);
                  setForm({ ...form, dealId: e.target.value });
                  setSelectedDeal(deal || null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">Select a deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.businessName || deal.clientName || deal.name || 'Unknown'} —{' '}
                    EGP {(deal.amount || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              {deals.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No active deals found. Make sure deals exist in the Sales module.
                </p>
              )}
            </div>

            {/* Quote Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quote Number</label>
              <input
                type="text"
                value={form.quoteNumber}
                onChange={(e) => setForm({ ...form, quoteNumber: e.target.value })}
                placeholder="Auto-generated if left blank"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Quote Title */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quote Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Website Development Services"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Selected Deal Info Preview */}
          {selectedDeal && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Selected Deal: {selectedDeal.businessName || selectedDeal.clientName || selectedDeal.name}
              </p>
              <p className="text-xs text-blue-600">
                {selectedDeal.email || selectedDeal.clientEmail || 'No email'} •{' '}
                {selectedDeal.phone || selectedDeal.clientPhone || 'No phone'}
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Line Items <span className="text-red-500">*</span>
            </h3>

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-3 mb-2 px-1">
              <span className="col-span-5 text-xs font-semibold text-gray-500 uppercase">Description</span>
              <span className="col-span-2 text-xs font-semibold text-gray-500 uppercase">Qty</span>
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Unit Price (EGP)</span>
              <span className="col-span-2"></span>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="col-span-5 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="col-span-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={form.items.length === 1}
                    className="col-span-2 flex justify-center px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-4 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">EGP {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Discount:</span>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) =>
                      setForm({ ...form, discount: Math.min(100, Math.max(0, Number(e.target.value))) })
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <span className="font-semibold text-red-600">-EGP {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tax:</span>
                  <input
                    type="number"
                    value={form.tax}
                    onChange={(e) =>
                      setForm({ ...form, tax: Math.min(100, Math.max(0, Number(e.target.value))) })
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <span className="font-semibold text-green-600">+EGP {taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-300 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-orange-600">EGP {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
              <select
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="Due Upon Receipt">Due Upon Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g., Thank you for your business"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreateQuote}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Quote'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(initialForm);
                setSelectedDeal(null);
              }}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, quote number, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'sent', 'accepted'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filterStatus === status
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-16">
            <Loader2 size={44} className="animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading quotes...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              {search || filterStatus !== 'all' ? 'No matching quotes' : 'No quotes yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search || filterStatus !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Click "New Quote" to create your first quote.'}
            </p>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{quote.title}</h3>
                  <p className="text-sm text-gray-500">#{quote.quoteNumber}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    quote.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : quote.status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {quote.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Client:</strong> {quote.clientName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Items:</strong> {quote.items?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Terms:</strong> {quote.terms || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Valid Until:</strong> {quote.validUntil || 'Not set'}
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4 border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    EGP {quote.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                >
                  <Download size={16} />
                  PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}