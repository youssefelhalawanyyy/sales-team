import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { Plus, Check, X, TrendingUp, DollarSign, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

const OWNERS = [
  { name: 'Youssef', id: 'youssef', color: 'bg-blue-100 text-blue-800' },
  { name: 'Baraa', id: 'baraa', color: 'bg-green-100 text-green-800' },
  { name: 'Rady', id: 'rady', color: 'bg-purple-100 text-purple-800' }
];

export const OwnerSettlementsPage = () => {
  const { currentUser, userRole } = useAuth();
  const [settlements, setSettlements] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'owed' // 'owed' or 'extra'
  });

  const hasAccess = userRole === 'admin';

  useEffect(() => {
    if (hasAccess) {
      fetchSettlements();
    }
  }, [hasAccess]);

  const fetchSettlements = async () => {
    try {
      const settlementsRef = collection(db, 'ownerSettlements');
      const snap = await getDocs(settlementsRef);
      
      const data = {};
      OWNERS.forEach(owner => {
        data[owner.id] = {
          owed: [],
          extra: [],
          totalOwed: 0,
          totalExtra: 0
        };
      });

      snap.docs.forEach(doc => {
        const settlement = doc.data();
        const ownerId = settlement.owner;
        
        if (data[ownerId]) {
          if (settlement.type === 'owed') {
            data[ownerId].owed.push({ id: doc.id, ...settlement });
            data[ownerId].totalOwed += settlement.amount;
          } else {
            data[ownerId].extra.push({ id: doc.id, ...settlement });
            data[ownerId].totalExtra += settlement.amount;
          }
        }
      });

      setSettlements(data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSettlement = async (e) => {
    e.preventDefault();
    if (!selectedOwner || !formData.amount) return;

    try {
      await addDoc(collection(db, 'ownerSettlements'), {
        owner: selectedOwner,
        amount: parseFloat(formData.amount),
        description: formData.description,
        type: formData.type,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      });

      setFormData({ amount: '', description: '', type: 'owed' });
      setSelectedOwner('');
      setShowAddForm(false);
      fetchSettlements();
    } catch (error) {
      console.error('Error adding settlement:', error);
    }
  };

  const handleMarkAsPaid = async (settlementId, ownerId) => {
    try {
      await updateDoc(doc(db, 'ownerSettlements', settlementId), {
        status: 'paid',
        paidAt: serverTimestamp()
      });

      // Also add to finances as expense
      await addDoc(collection(db, 'finances'), {
        type: 'expense',
        description: `Owner payment - ${OWNERS.find(o => o.id === ownerId)?.name}`,
        amount: parseFloat(
          settlements[ownerId].owed.find(s => s.id === settlementId)?.amount || 0
        ),
        category: 'Owner Payment',
        paymentTo: ownerId,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

      fetchSettlements();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleDeleteSettlement = async (settlementId, ownerId) => {
    try {
      const settlement = settlements[ownerId]?.[formData.type]?.find(s => s.id === settlementId);
      if (!settlement) return;

      // Note: In production, you'd want to soft-delete or archive
      // For now, we're just removing it
      await updateDoc(doc(db, 'ownerSettlements', settlementId), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });

      fetchSettlements();
    } catch (error) {
      console.error('Error deleting settlement:', error);
    }
  };

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">You don't have access to Owner Settlements.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Owner Settlements</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Add Settlement
        </button>
      </div>

      {/* Add Settlement Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Owner Settlement</h2>
          <form onSubmit={handleAddSettlement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner *
                </label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an owner</option>
                  {OWNERS.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="owed">We Owe Them</option>
                  <option value="extra">They Owe Us</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (EGP) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Salary advance, Extra expenses"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                Add Settlement
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Owner Settlement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {OWNERS.map(owner => (
          <div key={owner.id} className="bg-white rounded-lg shadow-md p-6">
            <div className={`inline-block ${owner.color} rounded-lg p-3 mb-4`}>
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{owner.name}</h3>

            {/* We Owe Them */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                We Owe Them
              </h4>
              {settlements[owner.id]?.owed && settlements[owner.id].owed.length > 0 ? (
                <div className="space-y-2">
                  {settlements[owner.id].owed.map(settlement => (
                    <div key={settlement.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-red-700">{formatCurrency(settlement.amount)}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settlement.status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {settlement.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{settlement.description}</p>
                      {settlement.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(settlement.id, owner.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded flex items-center justify-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" />
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-sm font-semibold text-red-700 mt-3">
                    Total: {formatCurrency(settlements[owner.id].totalOwed)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No outstanding payments</p>
              )}
            </div>

            {/* They Owe Us */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                They Owe Us
              </h4>
              {settlements[owner.id]?.extra && settlements[owner.id].extra.length > 0 ? (
                <div className="space-y-2">
                  {settlements[owner.id].extra.map(settlement => (
                    <div key={settlement.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-green-700">{formatCurrency(settlement.amount)}</p>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{settlement.description}</p>
                    </div>
                  ))}
                  <p className="text-sm font-semibold text-green-700 mt-3">
                    Total: {formatCurrency(settlements[owner.id].totalExtra)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No additional amounts</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settlement Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OWNERS.map(owner => {
            const owed = settlements[owner.id]?.totalOwed || 0;
            const extra = settlements[owner.id]?.totalExtra || 0;
            const net = owed - extra;

            return (
              <div key={owner.id} className="p-4 border border-gray-200 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">{owner.name}</p>
                <p className="text-sm text-gray-600">
                  Net Balance: <span className={`font-bold ${net > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {net > 0 ? '-' : '+'}{formatCurrency(Math.abs(net))}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
