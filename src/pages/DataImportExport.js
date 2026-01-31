import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Download, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export const DataImportExport = () => {
  const { currentUser, userRole } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importType, setImportType] = useState('deals');

  const isAdmin = userRole === 'admin' || userRole === 'sales_manager';

  // Export data to CSV
  const handleExport = async (type) => {
    try {
      setLoading(true);
      setError('');
      
      let data = [];
      let filename = '';
      let headers = [];

      if (type === 'deals') {
        const { getDocs, collection } = await import('firebase/firestore');
        const dealsSnap = await getDocs(collection(db, 'deals'));
        
        data = dealsSnap.docs.map(doc => doc.data());
        headers = ['clientName', 'amount', 'status', 'commission', 'description', 'createdAt'];
        filename = 'deals_export.csv';
      } else if (type === 'contacts') {
        const { getDocs, collection } = await import('firebase/firestore');
        const contactsSnap = await getDocs(collection(db, 'contacts'));
        
        data = contactsSnap.docs.map(doc => doc.data());
        headers = ['name', 'company', 'email', 'phone', 'category', 'createdAt'];
        filename = 'contacts_export.csv';
      }

      // Convert to CSV
      const csv = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            if (value === undefined || value === null) return '';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage(`✓ Exported ${data.length} ${type} records`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to export: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Import data from CSV
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const record = {};
        headers.forEach((header, idx) => {
          record[header] = values[idx];
        });
        records.push(record);
      }

      // Import to Firestore
      const batch = writeBatch(db);
      let count = 0;

      for (const record of records) {
        const docRef = doc(collection(db, importType));
        batch.set(docRef, {
          ...record,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid,
          importedAt: serverTimestamp()
        });
        count++;

        if (count % 500 === 0) {
          await batch.commit();
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
      }

      setMessage(`✓ Imported ${records.length} records successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
      fileInputRef.current.value = '';
    }
  };

  const templateData = {
    deals: `clientName,amount,status,commission,description
ACME Corp,5000,pending,1000,Initial meeting
Tech Solutions,15000,negotiation,3000,Quote sent`,
    contacts: `name,company,email,phone,category
John Doe,ACME Corp,john@acme.com,+1234567890,Decision Maker
Jane Smith,Tech Solutions,jane@tech.com,+0987654321,Developer`
  };

  const downloadTemplate = (type) => {
    const csv = templateData[type] || '';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Download size={24} />
            <Upload size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Data Import/Export</h1>
            <p className="text-blue-100">Bulk import or export your sales data</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-slideDown">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-slideDown">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-green-800">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Download size={20} className="text-blue-600" />
            Export Data
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Download your data as CSV files for backup or analysis.
          </p>

          <div className="space-y-3">
            {['deals', 'contacts'].map(type => (
              <button
                key={type}
                onClick={() => handleExport(type)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 font-semibold rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                Export {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-3">Quick Templates</p>
            <div className="space-y-2">
              {['deals', 'contacts'].map(type => (
                <button
                  key={type}
                  onClick={() => downloadTemplate(type)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📄 {type.charAt(0).toUpperCase() + type.slice(1)} Template
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={20} className="text-green-600" />
            Import Data
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Bulk import contacts, deals, or other data from CSV files.
          </p>

          {!isAdmin && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle size={16} />
              Admin access required for imports
            </div>
          )}

          {isAdmin && (
            <>
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Import Type</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="deals">Deals</option>
                  <option value="contacts">Contacts</option>
                </select>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:bg-green-50 transition-colors cursor-pointer"
              >
                <Upload size={32} className="mx-auto mb-2 text-green-600" />
                <p className="font-semibold text-gray-900">Click to upload CSV</p>
                <p className="text-xs text-gray-600 mt-1">or drag and drop your file</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                disabled={loading}
                className="hidden"
              />

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Instructions:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Use CSV format (comma-separated values)</li>
                  <li>✓ Include headers in the first row</li>
                  <li>✓ Download a template for the correct format</li>
                  <li>✓ Max 500 records per file</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Format Guide */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">CSV Format Guide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Deals Format</h4>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-gray-700">
{`clientName,amount,status,commission
ACME Corp,5000,pending,1000
Tech Co,15000,closed,3000`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Contacts Format</h4>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-gray-700">
{`name,company,email,phone
John Doe,ACME Corp,john@acme.com,+1234567890
Jane Smith,Tech Co,jane@tech.com,+0987654321`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportExport;
