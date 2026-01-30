import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Briefcase, 
  Users, 
  Phone, 
  DollarSign, 
  FileText, 
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

/* ============================= */

const STATUSES = [
  { value: 'potential_client', label: 'Potential Client', color: 'blue' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'yellow' },
  { value: 'closed', label: 'Closed', color: 'green' },
  { value: 'lost', label: 'Lost', color: 'red' }
];

/* ============================= */

export default function DealEditor({ deal, onSave, onClose }) {
  const [data, setData] = useState({ ...deal });
  const [showHistory, setShowHistory] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* ============================= */

  function update(key, value) {
    setData({ ...data, [key]: value });
    setHasChanges(true);
  }

  /* ============================= */

  function handleSave() {
    if (!data.businessName || !data.contactPerson || !data.phoneNumber) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(data);
  }

  /* ============================= */

  function handleCancel() {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  /* ============================= */

  const editHistory = deal.editHistory || [];
  const hasHistory = editHistory.length > 0;

  /* ============================= */

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Deal</h2>
              <p className="text-blue-100 text-sm">{deal.businessName}</p>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* CONTENT */}
          <div className="p-6 space-y-6">
            
            {/* Unsaved Changes Warning */}
            {hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Unsaved Changes</p>
                  <p className="text-xs text-yellow-700 mt-1">Don't forget to save your changes before closing</p>
                </div>
              </div>
            )}

            {/* FORM FIELDS */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Business Name *
                </label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter business name"
                  value={data.businessName || ''}
                  onChange={e => update('businessName', e.target.value)}
                />
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Contact Person *
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter contact person"
                    value={data.contactPerson || ''}
                    onChange={e => update('contactPerson', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                    value={data.phoneNumber || ''}
                    onChange={e => update('phoneNumber', e.target.value)}
                  />
                </div>
              </div>

              {/* Status & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Status
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                    value={data.status || 'potential_client'}
                    onChange={e => update('status', e.target.value)}
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Deal Value
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={data.price || ''}
                    onChange={e => update('price', e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Add any additional notes or comments..."
                  rows="4"
                  value={data.notes || ''}
                  onChange={e => update('notes', e.target.value)}
                />
              </div>

            </div>

            {/* EDIT HISTORY */}
            {hasHistory && (
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Edit History</span>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">
                      {editHistory.length} {editHistory.length === 1 ? 'edit' : 'edits'}
                    </span>
                  </div>
                  {showHistory ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {showHistory && (
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                    {[...editHistory].reverse().map((entry, index) => (
                      <HistoryEntry key={index} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {hasChanges ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Unsaved changes
              </span>
            ) : (
              <span>No changes made</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                hasChanges
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5" strokeWidth={2.5} />
              <span>Save Changes</span>
            </button>
          </div>
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
}

/* ============================= */

function HistoryEntry({ entry }) {
  const timestamp = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
  const timeString = timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const changes = entry.changes || {};
  const changeCount = Object.keys(changes).length;

  if (changeCount === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{entry.editedByName || 'Unknown User'}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {timeString}
          </p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
          {changeCount} {changeCount === 1 ? 'change' : 'changes'}
        </span>
      </div>

      {/* Changes */}
      <div className="space-y-2">
        {Object.entries(changes).map(([field, change]) => (
          <ChangeDetail key={field} field={field} change={change} />
        ))}
      </div>
    </div>
  );
}

/* ============================= */

function ChangeDetail({ field, change }) {
  const fieldLabels = {
    businessName: 'Business Name',
    contactPerson: 'Contact Person',
    phoneNumber: 'Phone Number',
    status: 'Status',
    price: 'Deal Value',
    notes: 'Notes'
  };

  const label = fieldLabels[field] || field;

  const formatValue = (value) => {
    if (field === 'price') {
      return formatCurrency(value || 0);
    }
    if (field === 'status') {
      const status = STATUSES.find(s => s.value === value);
      return status?.label || value;
    }
    return value || '(empty)';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium line-through">
          {formatValue(change.from)}
        </span>
        <span className="text-gray-400">→</span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
          {formatValue(change.to)}
        </span>
      </div>
    </div>
  );
}