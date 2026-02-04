import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Clock, Activity, ClipboardList } from 'lucide-react';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES, getStageLabel } from '../utils/pipeline';

const DEFAULT_SLA_DAYS = 7;
const SLA_BY_STAGE = {
  potential_client: 5,
  pending_approval: 5
};
const STALE_ACTIVITY_DAYS = 14;

function getDaysSince(dateValue) {
  if (!dateValue) return 0;
  const date = dateValue?.toDate?.() || dateValue;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function SLADashboardPage() {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);

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
    loadData();
  }, [currentUser?.uid, userRole]);

  async function loadData() {
    try {
      setLoading(true);

      let dealsList = [];
      if (userRole === 'admin' || userRole === 'sales_manager') {
        const dealsSnap = await getDocs(collection(db, 'sales'));
        dealsList = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const queries = [
          query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('sharedWith', 'array-contains', currentUser.uid))
        ];
        if (userRole === 'team_leader') {
          let teamId = currentUser?.teamId || null;
          if (!teamId) {
            const teamSnap = await getDocs(
              query(collection(db, 'teams'), where('leaderId', '==', currentUser.uid))
            );
            teamId = teamSnap.docs[0]?.id || null;
          }
          if (teamId) {
            queries.push(query(collection(db, 'sales'), where('teamId', '==', teamId)));
          }
        }
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        const map = new Map();
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(docSnap => {
            map.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        });
        dealsList = Array.from(map.values());
      }

      let followupsList = [];
      if (userRole === 'admin' || userRole === 'sales_manager') {
        const followSnap = await getDocs(collection(db, 'followups'));
        followupsList = followSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const followSnap = await getDocs(
          query(collection(db, 'followups'), where('assignedTo', '==', currentUser.uid))
        );
        followupsList = followSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setDeals(dealsList);
      setFollowups(followupsList);
    } catch (error) {
      console.error('Error loading SLA data:', error);
    } finally {
      setLoading(false);
    }
  }

  const overdueFollowups = useMemo(() => {
    return followups.filter(f => {
      const due = f.reminderDate?.toDate?.() || f.reminderDate;
      if (!due) return false;
      return (f.status === 'pending' || f.status === 'overdue') && new Date(due) < new Date();
    });
  }, [followups]);

  const agingDeals = useMemo(() => {
    return deals.filter(deal => {
      if (deal.archived || deal.status === 'closed' || deal.status === 'lost') return false;
      const stageUpdatedAt = deal.statusUpdatedAt?.toDate?.() || deal.statusUpdatedAt || deal.createdAt?.toDate?.() || deal.createdAt;
      const daysInStage = getDaysSince(stageUpdatedAt);
      const sla = SLA_BY_STAGE[deal.status] || DEFAULT_SLA_DAYS;
      return daysInStage >= sla;
    });
  }, [deals]);

  const stalledDeals = useMemo(() => {
    return deals.filter(deal => {
      if (deal.archived || deal.status === 'closed' || deal.status === 'lost') return false;
      const lastActivity = deal.lastActivityAt?.toDate?.() || deal.lastActivityAt || deal.statusUpdatedAt?.toDate?.() || deal.statusUpdatedAt || deal.createdAt?.toDate?.() || deal.createdAt;
      const daysSince = getDaysSince(lastActivity);
      return daysSince >= STALE_ACTIVITY_DAYS;
    });
  }, [deals]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">SLA Dashboard</h1>
              <p className="text-blue-100 text-sm">Track overdue follow-ups and stalled deals.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading SLA metrics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SlaStat
                label="Overdue Follow-ups"
                value={overdueFollowups.length}
                icon={AlertTriangle}
                color="bg-red-100 text-red-700 border-red-200"
              />
              <SlaStat
                label="Deals Past SLA"
                value={agingDeals.length}
                icon={Clock}
                color="bg-yellow-100 text-yellow-700 border-yellow-200"
              />
              <SlaStat
                label="Stalled Deals"
                value={stalledDeals.length}
                icon={Activity}
                color="bg-purple-100 text-purple-700 border-purple-200"
              />
            </div>

            <SlaSection
              title="Overdue Follow-ups"
              items={overdueFollowups}
              empty="No overdue follow-ups"
              renderItem={(item) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.businessName}</p>
                    <p className="text-xs text-gray-500">Action: {item.nextAction || 'Follow-up'}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    {item.reminderDate?.toDate?.().toLocaleDateString() || ''}
                  </span>
                </div>
              )}
            />

            <SlaSection
              title="Deals Past SLA"
              items={agingDeals}
              empty="No aging deals"
              renderItem={(item) => {
                const stageLabel = getStageLabel(pipelineStages, item.status);
                const stageUpdatedAt = item.statusUpdatedAt?.toDate?.() || item.statusUpdatedAt || item.createdAt?.toDate?.() || item.createdAt;
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.businessName}</p>
                      <p className="text-xs text-gray-500">{stageLabel} • {getDaysSince(stageUpdatedAt)} days</p>
                    </div>
                    <span className="text-xs font-semibold text-yellow-600">
                      Owner: {item.ownerName || item.createdByName || 'N/A'}
                    </span>
                  </div>
                );
              }}
            />

            <SlaSection
              title="Stalled Deals (No Activity)"
              items={stalledDeals}
              empty="No stalled deals"
              renderItem={(item) => {
                const lastActivity = item.lastActivityAt?.toDate?.() || item.lastActivityAt || item.statusUpdatedAt?.toDate?.() || item.statusUpdatedAt || item.createdAt?.toDate?.() || item.createdAt;
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.businessName}</p>
                      <p className="text-xs text-gray-500">Last activity {getDaysSince(lastActivity)} days ago</p>
                    </div>
                    <span className="text-xs font-semibold text-purple-600">
                      Owner: {item.ownerName || item.createdByName || 'N/A'}
                    </span>
                  </div>
                );
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SlaStat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SlaSection({ title, items, empty, renderItem }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-4">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
