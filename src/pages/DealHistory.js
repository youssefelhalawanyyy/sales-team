import React from 'react';
import { Clock, User, Edit2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function DealHistory({ deal }) {
  const editHistory = deal?.editHistory || [];

  if (!editHistory || editHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Edit History</h3>
        <p className="text-sm text-gray-600">This deal has not been edited yet.</p>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFieldName = (fieldName) => {
    const fieldNames = {
      businessName: 'Business Name',
      contactPerson: 'Contact Person',
      phoneNumber: 'Phone Number',
      status: 'Status',
      price: 'Deal Value',
      notes: 'Notes'
    };
    return fieldNames[fieldName] || fieldName;
  };

  const formatFieldValue = (fieldName, value) => {
    if (fieldName === 'price') {
      return formatCurrency(value || 0);
    }
    if (fieldName === 'status') {
      const statusLabels = {
        potential_client: 'Potential Client',
        pending_approval: 'Pending Approval',
        closed: 'Closed',
        lost: 'Lost'
      };
      return statusLabels[value] || value;
    }
    return value || '(empty)';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit History</h3>
            <p className="text-sm text-gray-600">
              {editHistory.length} edit{editHistory.length !== 1 ? 's' : ''} made to this deal
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {editHistory
          .slice()
          .reverse()
          .map((entry, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {entry.editedByName || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                  Edit #{editHistory.length - index}
                </div>
              </div>

              {/* Changes */}
              {entry.changes && Object.keys(entry.changes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(entry.changes).map(([fieldName, change], idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                        <p className="text-sm font-semibold text-gray-900">
                          {formatFieldName(fieldName)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        {/* From */}
                        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-red-700 mb-1">
                            Previous Value
                          </p>
                          <p className="text-sm text-red-900 font-medium break-words">
                            {formatFieldValue(fieldName, change.from)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* To */}
                        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 mb-1">
                            New Value
                          </p>
                          <p className="text-sm text-green-900 font-medium break-words">
                            {formatFieldValue(fieldName, change.to)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific changes recorded</p>
              )}
            </div>
          ))}
      </div>

      {/* Footer Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total edits tracked</span>
          <span className="font-bold text-gray-900">{editHistory.length}</span>
        </div>
      </div>
    </div>
  );
}