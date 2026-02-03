import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Target, Users } from 'lucide-react';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES } from '../utils/pipeline';
import { formatCurrency } from '../utils/currency';

const DEFAULT_TARGETS = {
  companyMonthly: 100000,
  companyQuarterly: 300000,
  perRep: {}
};

const FORECAST_CATEGORIES = {
  commit: { label: 'Commit', color: '#10b981' },
  best: { label: 'Best Case', color: '#6366f1' },
  pipeline: { label: 'Pipeline', color: '#f59e0b' }
};

export const SalesForecasting = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState({});
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [timeframe, setTimeframe] = useState('6');
  const [loading, setLoading] = useState(true);
  const [savingTargets, setSavingTargets] = useState(false);

  const canEditTargets = userRole === 'admin' || userRole === 'sales_manager';

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    loadDeals();
    loadTargets();
    loadUsers();
  }, [currentUser?.uid, userRole]);

  async function loadUsers() {
    try {
      if (userRole === 'admin' || userRole === 'sales_manager') {
        const snap = await getDocs(collection(db, 'users'));
        const map = {};
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          map[docSnap.id] = {
            id: docSnap.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email || docSnap.id,
            email: data.email
          };
        });
        setUsers(map);
      } else {
        setUsers({
          [currentUser.uid]: {
            id: currentUser.uid,
            name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
            email: currentUser.email
          }
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadDeals() {
    try {
      setLoading(true);
      let dealsList = [];

      if (userRole === 'admin' || userRole === 'sales_manager') {
        const dealsSnap = await getDocs(collection(db, 'sales'));
        dealsList = dealsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      } else {
        const queries = [
          query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('sharedWith', 'array-contains', currentUser.uid))
        ];
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        const map = new Map();
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(docSnap => {
            map.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        });
        dealsList = Array.from(map.values());
      }

      setDeals(dealsList);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTargets() {
    try {
      const ref = doc(db, 'settings', 'revenueTargets');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setTargets({
          companyMonthly: data.companyMonthly || DEFAULT_TARGETS.companyMonthly,
          companyQuarterly: data.companyQuarterly || DEFAULT_TARGETS.companyQuarterly,
          perRep: data.perRep || {}
        });
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  }

  const stageProbabilities = useMemo(() => {
    const activeStages = pipelineStages.filter(stage => !['closed', 'lost'].includes(stage.value));
    const min = 0.15;
    const max = 0.85;
    const map = {
      closed: 1,
      lost: 0
    };

    if (activeStages.length === 1) {
      map[activeStages[0].value] = 0.5;
      return map;
    }

    activeStages.forEach((stage, index) => {
      const weight = min + (index / Math.max(activeStages.length - 1, 1)) * (max - min);
      map[stage.value] = Number(weight.toFixed(2));
    });

    return map;
  }, [pipelineStages]);

  const getProbability = (status) => stageProbabilities[status] ?? 0.2;

  const relevantDeals = useMemo(
    () => deals.filter(deal => !deal.archived),
    [deals]
  );

  const activeDeals = useMemo(
    () => relevantDeals.filter(deal => deal.status !== 'closed' && deal.status !== 'lost'),
    [relevantDeals]
  );

  const closedDeals = useMemo(
    () => relevantDeals.filter(deal => deal.status === 'closed'),
    [relevantDeals]
  );

  const weightedForecast = useMemo(() => {
    return activeDeals.reduce((sum, deal) => {
      const amount = Number(deal.price || deal.amount || 0);
      return sum + amount * getProbability(deal.status);
    }, 0);
  }, [activeDeals, stageProbabilities]);

  const commitForecast = useMemo(() => {
    return activeDeals
      .filter(deal => deal.forecastCategory === 'commit')
      .reduce((sum, deal) => {
        const amount = Number(deal.price || deal.amount || 0);
        return sum + amount * Math.max(0.7, getProbability(deal.status));
      }, 0);
  }, [activeDeals, stageProbabilities]);

  const bestCaseForecast = useMemo(() => {
    const bestDeals = activeDeals.filter(deal => deal.forecastCategory === 'best');
    const bestValue = bestDeals.reduce((sum, deal) => {
      const amount = Number(deal.price || deal.amount || 0);
      return sum + amount * getProbability(deal.status);
    }, 0);
    return commitForecast + bestValue;
  }, [activeDeals, stageProbabilities, commitForecast]);

  const monthClosedRevenue = useMemo(() => {
    const now = new Date();
    return closedDeals.reduce((sum, deal) => {
      const date = deal.statusUpdatedAt?.toDate?.() || deal.updatedAt?.toDate?.() || deal.createdAt?.toDate?.() || new Date();
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return sum + Number(deal.price || deal.amount || 0);
      }
      return sum;
    }, 0);
  }, [closedDeals]);

  const gapToTarget = Math.max(targets.companyMonthly - (monthClosedRevenue + commitForecast), 0);

  const forecastByMonth = useMemo(() => {
    const monthsToForecast = parseInt(timeframe);
    const now = new Date();
    const months = [];

    for (let i = 0; i < monthsToForecast; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        month: date.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
        commit: 0,
        best: 0,
        pipeline: 0,
        closed: 0
      });
    }

    relevantDeals.forEach(deal => {
      const baseDate = deal.expectedCloseDate?.toDate?.() ||
        deal.statusUpdatedAt?.toDate?.() ||
        deal.createdAt?.toDate?.() ||
        new Date();

      const monthIndex = (baseDate.getFullYear() - now.getFullYear()) * 12 + (baseDate.getMonth() - now.getMonth());
      if (monthIndex < 0 || monthIndex >= monthsToForecast) return;

      const amount = Number(deal.price || deal.amount || 0);
      if (deal.status === 'closed') {
        months[monthIndex].closed += amount;
        return;
      }

      if (deal.status === 'lost') return;

      const weightedAmount = amount * getProbability(deal.status);
      const category = deal.forecastCategory || 'pipeline';

      if (category === 'commit') {
        months[monthIndex].commit += amount * Math.max(0.7, getProbability(deal.status));
      } else if (category === 'best') {
        months[monthIndex].best += weightedAmount;
      } else {
        months[monthIndex].pipeline += weightedAmount;
      }
    });

    return months;
  }, [relevantDeals, timeframe, stageProbabilities]);

  const repInsights = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const repMap = {};
    relevantDeals.forEach(deal => {
      const ownerId = deal.ownerId || deal.createdBy;
      if (!ownerId) return;
      if (!repMap[ownerId]) {
        repMap[ownerId] = {
          id: ownerId,
          name: users[ownerId]?.name || deal.ownerName || deal.createdByName || 'Rep',
          closed: 0,
          resolved: 0,
          weighted: 0,
          commit: 0,
          deals: 0
        };
      }
      const amount = Number(deal.price || deal.amount || 0);
      repMap[ownerId].deals += 1;

      if (deal.status === 'closed' || deal.status === 'lost') {
        repMap[ownerId].resolved += 1;
        if (deal.status === 'closed') {
          const closedDate = deal.statusUpdatedAt?.toDate?.() || deal.createdAt?.toDate?.() || new Date();
          if (closedDate >= ninetyDaysAgo) {
            repMap[ownerId].closed += 1;
          }
        }
      }

      if (deal.status !== 'closed' && deal.status !== 'lost') {
        repMap[ownerId].weighted += amount * getProbability(deal.status);
        if (deal.forecastCategory === 'commit') {
          repMap[ownerId].commit += amount * Math.max(0.7, getProbability(deal.status));
        }
      }
    });

    return Object.values(repMap)
      .map(rep => {
        const winRate = rep.resolved > 0 ? Math.round((rep.closed / rep.resolved) * 100) : 0;
        const target = targets.perRep?.[rep.id] || Math.round(targets.companyMonthly / Math.max(Object.keys(repMap).length, 1));
        const gap = Math.max(target - rep.commit, 0);
        return { ...rep, winRate, target, gap };
      })
      .sort((a, b) => b.weighted - a.weighted);
  }, [relevantDeals, users, stageProbabilities, targets]);

  const handleTargetChange = (field, value) => {
    setTargets(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  const handleRepTargetChange = (repId, value) => {
    setTargets(prev => ({
      ...prev,
      perRep: {
        ...prev.perRep,
        [repId]: Number(value) || 0
      }
    }));
  };

  const saveTargets = async () => {
    if (!canEditTargets) return;
    try {
      setSavingTargets(true);
      await setDoc(doc(db, 'settings', 'revenueTargets'), {
        ...targets,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving targets:', error);
    } finally {
      setSavingTargets(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <Target size={32} />
          <div>
            <h1 className="text-3xl font-bold">Revenue Intelligence</h1>
            <p className="text-blue-100">Weighted pipeline, commit vs best-case, and gap-to-target insights</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Weighted Forecast</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(weightedForecast)}</p>
          <p className="text-xs text-gray-600 mt-2">Open deals weighted by stage</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Commit Forecast</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(commitForecast)}</p>
          <p className="text-xs text-gray-600 mt-2">Deals marked as commit</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Best Case</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(bestCaseForecast)}</p>
          <p className="text-xs text-gray-600 mt-2">Commit + best-case deals</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Gap To Target</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(gapToTarget)}</p>
          <p className="text-xs text-gray-600 mt-2">Target minus closed + commit</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Forecast by Month</h3>
            <p className="text-sm text-gray-600">Commit, best-case, and pipeline by expected close date</p>
          </div>
          <div className="flex gap-2">
            {['3', '6', '12'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf} Months
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={forecastByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Area type="monotone" dataKey="commit" stackId="1" stroke={FORECAST_CATEGORIES.commit.color} fill={FORECAST_CATEGORIES.commit.color} name="Commit" />
            <Area type="monotone" dataKey="best" stackId="1" stroke={FORECAST_CATEGORIES.best.color} fill={FORECAST_CATEGORIES.best.color} name="Best Case" />
            <Area type="monotone" dataKey="pipeline" stackId="1" stroke={FORECAST_CATEGORIES.pipeline.color} fill={FORECAST_CATEGORIES.pipeline.color} name="Pipeline" />
            <Area type="monotone" dataKey="closed" stackId="2" stroke="#0ea5e9" fill="#0ea5e9" name="Closed" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline By Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineStages.map(stage => {
              const total = activeDeals
                .filter(deal => deal.status === stage.value)
                .reduce((sum, deal) => sum + Number(deal.price || deal.amount || 0), 0);
              return { stage: stage.label, total };
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#6366f1" name="Pipeline" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Targets</h3>
            {canEditTargets && (
              <button
                onClick={saveTargets}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                disabled={savingTargets}
              >
                {savingTargets ? 'Saving...' : 'Save Targets'}
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Company Monthly</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(targets.companyMonthly)}</p>
              </div>
              {canEditTargets && (
                <input
                  type="number"
                  value={targets.companyMonthly}
                  onChange={(e) => handleTargetChange('companyMonthly', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Company Quarterly</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(targets.companyQuarterly)}</p>
              </div>
              {canEditTargets && (
                <input
                  type="number"
                  value={targets.companyQuarterly}
                  onChange={(e) => handleTargetChange('companyQuarterly', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 uppercase">Rep Targets</p>
              <div className="space-y-3 mt-3">
                {repInsights.map(rep => (
                  <div key={rep.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{rep.name}</span>
                    {canEditTargets ? (
                      <input
                        type="number"
                        value={targets.perRep?.[rep.id] || 0}
                        onChange={(e) => handleRepTargetChange(rep.id, e.target.value)}
                        className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-xs"
                      />
                    ) : (
                      <span className="text-sm font-semibold">{formatCurrency(rep.target)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Rep Confidence
          </h3>
          <span className="text-xs text-gray-500">Based on last 90 days</span>
        </div>

        {repInsights.length === 0 ? (
          <p className="text-sm text-gray-500">No rep data available.</p>
        ) : (
          <div className="space-y-3">
            {repInsights.map(rep => (
              <div key={rep.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{rep.name}</p>
                    <p className="text-xs text-gray-500">Weighted pipeline: {formatCurrency(rep.weighted)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">Win rate: {rep.winRate}%</p>
                    <p className="text-xs text-gray-500">Commit: {formatCurrency(rep.commit)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                    Target: {formatCurrency(rep.target)}
                  </span>
                  <span className={`px-2 py-1 rounded-lg ${rep.gap > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    Gap: {formatCurrency(rep.gap)}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                    Deals: {rep.deals}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesForecasting;
