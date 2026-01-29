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
import { 
  Plus, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  User,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

const OWNERS = [
  { name: 'Youssef', id: 'youssef', gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-50 to-cyan-50' },
  { name: 'Baraa', id: 'baraa', gradient: 'from-green-500 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50' },
  { name: 'Rady', id: 'rady', gradient: 'from-purple-500 to-pink-500', bgGradient: 'from-purple-50 to-pink-50' }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md border-2 border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access Owner Settlements.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading settlements...</p>
      </div>
    );
  }

  const totalWeOwe = OWNERS.reduce((sum, owner) => sum + (settlements[owner.id]?.totalOwed || 0), 0);
  const totalTheyOwe = OWNERS.reduce((sum, owner) => sum + (settlements[owner.id]?.totalExtra || 0), 0);
  const netBalance = totalWeOwe - totalTheyOwe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      
      <div className="space-y-8">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden animate-fadeInDown">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-8 h-8 text-yellow-300" />
                <h1 className="text-3xl lg:text-4xl font-bold">Owner Settlements</h1>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mb-4">Manage owner payments and balances</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">We Owe: {formatCurrency(totalWeOwe)}</span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">They Owe: {formatCurrency(totalTheyOwe)}</span>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 ${netBalance > 0 ? 'bg-red-500/30' : 'bg-green-500/30'} backdrop-blur-sm rounded-full border border-white/30`}>
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-semibold">Net: {netBalance > 0 ? '-' : '+'}{formatCurrency(Math.abs(netBalance))}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="group relative bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <div className="p-2 bg-white/20 rounded-xl">
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">Add Settlement</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"></div>
            </button>
          </div>
        </div>

        {/* Add Settlement Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 overflow-hidden animate-scaleIn">
            
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">Add Owner Settlement</h2>
              </div>
              
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddSettlement} className="p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Owner *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={selectedOwner}
                      onChange={(e) => setSelectedOwner(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium appearance-none"
                      required
                    >
                      <option value="">Choose an owner...</option>
                      {OWNERS.map(owner => (
                        <option key={owner.id} value={owner.id}>{owner.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Settlement Type *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium appearance-none"
                    >
                      <option value="owed">We Owe Them</option>
                      <option value="extra">They Owe Us</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Amount (EGP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Salary advance, Extra expenses"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Add Settlement
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Owner Settlement Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {OWNERS.map((owner, idx) => {
            const ownerData = settlements[owner.id] || { owed: [], extra: [], totalOwed: 0, totalExtra: 0 };
            const netBalance = ownerData.totalOwed - ownerData.totalExtra;

            return (
              <div 
                key={owner.id}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 animate-scaleIn"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                
                {/* Header */}
                <div className={`relative bg-gradient-to-r ${owner.gradient} p-6`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{owner.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-white/80 font-semibold">Net Balance:</span>
                        <span className={`text-xl font-bold ${netBalance > 0 ? 'text-red-100' : 'text-green-100'}`}>
                          {netBalance > 0 ? '-' : '+'}{formatCurrency(Math.abs(netBalance))}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                      <User className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  
                  {/* We Owe Them */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <ArrowUpRight className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">We Owe Them</h4>
                    </div>
                    
                    {ownerData.owed && ownerData.owed.length > 0 ? (
                      <div className="space-y-3">
                        {ownerData.owed.map((settlement) => (
                          <div 
                            key={settlement.id}
                            className="relative p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-100 hover:border-red-200 transition-all duration-200 group/item"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl font-bold text-red-700">
                                    {formatCurrency(settlement.amount)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                    settlement.status === 'paid' 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  }`}>
                                    {settlement.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    {settlement.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{settlement.description || 'No description'}</p>
                              </div>
                            </div>
                            
                            {settlement.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(settlement.id, owner.id)}
                                className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                              >
                                <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <div className="pt-2 border-t-2 border-red-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total Owed:</span>
                            <span className="text-lg font-bold text-red-700">
                              {formatCurrency(ownerData.totalOwed)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-2xl">
                        <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">No outstanding payments</p>
                      </div>
                    )}
                  </div>

                  {/* They Owe Us */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <ArrowDownRight className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">They Owe Us</h4>
                    </div>
                    
                    {ownerData.extra && ownerData.extra.length > 0 ? (
                      <div className="space-y-3">
                        {ownerData.extra.map((settlement) => (
                          <div 
                            key={settlement.id}
                            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 hover:border-green-200 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-bold text-green-700">
                                {formatCurrency(settlement.amount)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{settlement.description || 'No description'}</p>
                          </div>
                        ))}
                        
                        <div className="pt-2 border-t-2 border-green-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total Extra:</span>
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(ownerData.totalExtra)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">No additional amounts</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Settlement Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OWNERS.map((owner, idx) => {
              const owed = settlements[owner.id]?.totalOwed || 0;
              const extra = settlements[owner.id]?.totalExtra || 0;
              const net = owed - extra;

              return (
                <div 
                  key={owner.id}
                  className={`relative p-6 bg-gradient-to-br ${owner.bgGradient} rounded-2xl border-2 ${
                    net > 0 ? 'border-red-200' : net < 0 ? 'border-green-200' : 'border-gray-200'
                  } overflow-hidden group hover:shadow-lg transition-all duration-300`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 bg-gradient-to-br ${owner.gradient} rounded-xl`}>
                        <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{owner.name}</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">We Owe:</span>
                        <span className="font-bold text-red-600">{formatCurrency(owed)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">They Owe:</span>
                        <span className="font-bold text-green-600">{formatCurrency(extra)}</span>
                      </div>

                      <div className="pt-3 mt-3 border-t-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-700">Net Balance:</span>
                          <span className={`text-xl font-bold ${net > 0 ? 'text-red-600' : net < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {net > 0 ? '-' : net < 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>

    </div>
  );
};