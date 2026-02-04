import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES } from '../utils/pipeline';
import { fetchPlaybooks, savePlaybooks } from '../services/playbookService';
import { ClipboardList, CheckCircle2, FileText, Save, Lock } from 'lucide-react';

export default function PlaybooksPage() {
  const { currentUser, userRole } = useAuth();
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [playbooks, setPlaybooks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'sales_manager';
  const isPlaybooksEmpty = Object.keys(playbooks || {}).length === 0;

  const buildDefaultPlaybooks = (stages) => {
    const defaults = {};
    (stages || []).forEach(stage => {
      const value = stage.value;
      const label = stage.label || value;

      if (value === 'potential_client') {
        defaults[value] = {
          checklist: [
            'Verify contact details',
            'Research company and needs',
            'Initial outreach logged',
            'Next step scheduled'
          ],
          tasks: [
            'Send intro email',
            'Make discovery call',
            'Add discovery notes'
          ]
        };
      } else if (value === 'pending_approval') {
        defaults[value] = {
          checklist: [
            'Decision makers identified',
            'Requirements confirmed',
            'Quote sent',
            'Follow-up scheduled'
          ],
          tasks: [
            'Prepare and send quote',
            'Schedule demo/meeting',
            'Confirm budget and timeline'
          ]
        };
      } else if (value === 'closed') {
        defaults[value] = {
          checklist: [
            'Contract signed',
            'Invoice sent',
            'Handoff completed',
            'Success plan created'
          ],
          tasks: [
            'Send thank-you email',
            'Create onboarding tasks',
            'Introduce CS owner'
          ]
        };
      } else if (value === 'lost') {
        defaults[value] = {
          checklist: [
            'Loss reason captured',
            'Competitor noted',
            'Nurture follow-up set'
          ],
          tasks: [
            'Document loss reason',
            'Set re-engagement reminder'
          ]
        };
      } else {
        defaults[value] = {
          checklist: [
            `Confirm ${label} requirements`,
            `Update ${label} notes`,
            'Set next step'
          ],
          tasks: [
            `Complete ${label} task`,
            'Schedule next action'
          ]
        };
      }
    });
    return defaults;
  };

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
    const loadPlaybooks = async () => {
      setLoading(true);
      const data = await fetchPlaybooks();
      setPlaybooks(data.stages || {});
      setLoading(false);
    };
    loadPlaybooks();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!pipelineStages.length) return;
    if (!isPlaybooksEmpty) return;
    setPlaybooks(buildDefaultPlaybooks(pipelineStages));
  }, [pipelineStages, isPlaybooksEmpty]);

  const handleChecklistChange = (stageValue, value) => {
    const list = value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    setPlaybooks(prev => ({
      ...prev,
      [stageValue]: {
        checklist: list,
        tasks: prev?.[stageValue]?.tasks || []
      }
    }));
  };

  const handleTasksChange = (stageValue, value) => {
    const list = value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    setPlaybooks(prev => ({
      ...prev,
      [stageValue]: {
        checklist: prev?.[stageValue]?.checklist || [],
        tasks: list
      }
    }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      await savePlaybooks({ stages: playbooks });
      alert('Playbooks saved successfully!');
    } catch (error) {
      console.error('Error saving playbooks:', error);
      alert('Failed to save playbooks: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const stageCards = useMemo(() => {
    return pipelineStages.map(stage => {
      const stageData = playbooks?.[stage.value] || { checklist: [], tasks: [] };
      const checklistValue = (stageData.checklist || []).join('\n');
      const tasksValue = (stageData.tasks || []).join('\n');

      return (
        <div key={stage.value} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{stage.label}</h3>
              <p className="text-xs text-gray-500">Stage playbook</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Checklist (Done Criteria)
              </label>
              <textarea
                rows={6}
                value={checklistValue}
                onChange={(e) => handleChecklistChange(stage.value, e.target.value)}
                disabled={!canEdit}
                placeholder="One item per line..."
                className={`mt-2 w-full px-4 py-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  canEdit ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> Task Templates
              </label>
              <textarea
                rows={6}
                value={tasksValue}
                onChange={(e) => handleTasksChange(stage.value, e.target.value)}
                disabled={!canEdit}
                placeholder="One task per line..."
                className={`mt-2 w-full px-4 py-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  canEdit ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      );
    });
  }, [pipelineStages, playbooks, canEdit]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading playbooks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Playbooks</h1>
            <p className="text-sm text-gray-600 mt-1">Define stage checklists and auto-generated task templates.</p>
          </div>
          {canEdit ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Playbooks'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              Read-only
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5">
          {stageCards}
        </div>
      </div>
    </div>
  );
}
