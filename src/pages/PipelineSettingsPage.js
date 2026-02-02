import React, { useEffect, useMemo, useState } from 'react';
import { Save, Plus, ChevronUp, ChevronDown, Trash2, Lock, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPipelineSettings, savePipelineSettings } from '../services/pipelineService';
import {
  PIPELINE_COLORS,
  PIPELINE_FIELD_OPTIONS,
  PIPELINE_RESERVED_VALUES,
  normalizePipelineStages,
  slugifyStageValue
} from '../utils/pipeline';

export default function PipelineSettingsPage() {
  const { currentUser, userRole } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const canManage = userRole === 'admin' || userRole === 'sales_manager';

  useEffect(() => {
    if (!currentUser?.uid) return;

    const load = async () => {
      setLoading(true);
      const loaded = await fetchPipelineSettings();
      setStages(loaded);
      setLoading(false);
    };

    load();
  }, [currentUser?.uid]);

  const stageValues = useMemo(() => new Set(stages.map(s => s.value)), [stages]);

  const updateStage = (index, updates) => {
    setStages(prev => prev.map((stage, idx) => (idx === index ? { ...stage, ...updates } : stage)));
  };

  const toggleRequiredField = (index, field) => {
    setStages(prev =>
      prev.map((stage, idx) => {
        if (idx !== index) return stage;
        const current = Array.isArray(stage.requiredFields) ? stage.requiredFields : [];
        const next = current.includes(field)
          ? current.filter(f => f !== field)
          : [...current, field];
        return { ...stage, requiredFields: next };
      })
    );
  };

  const moveStage = (index, direction) => {
    setStages(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const removeStage = (index) => {
    setStages(prev => prev.filter((_, idx) => idx !== index));
  };

  const addStage = () => {
    const baseLabel = 'New Stage';
    let value = slugifyStageValue(baseLabel);
    let suffix = 1;
    while (stageValues.has(value)) {
      value = `${slugifyStageValue(baseLabel)}_${suffix}`;
      suffix += 1;
    }

    setStages(prev => [
      ...prev,
      {
        value,
        label: baseLabel,
        color: 'blue',
        requiredFields: []
      }
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    const normalized = normalizePipelineStages(stages);
    const saved = await savePipelineSettings(normalized, currentUser?.uid);
    setStages(saved);
    setSaving(false);
    setMessage('Pipeline saved successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md border-2 border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage pipeline settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden animate-fadeInDown">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-yellow-300" />
                <h1 className="text-3xl lg:text-4xl font-bold">Pipeline Settings</h1>
              </div>
              <p className="text-blue-100 text-sm lg:text-base">
                Customize deal stages and required fields for your sales workflow
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addStage}
                className="px-5 py-2.5 rounded-xl bg-white/15 border border-white/30 hover:bg-white/25 transition-all flex items-center gap-2 font-semibold"
              >
                <Plus size={18} />
                Add Stage
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 transition-all flex items-center gap-2 font-semibold shadow-lg disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Pipeline'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-green-600" />
            <p className="text-sm font-semibold text-green-800">{message}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading pipeline settings...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isReserved = PIPELINE_RESERVED_VALUES.includes(stage.value);
              return (
                <div key={stage.value} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          value={stage.label}
                          onChange={(e) => updateStage(index, { label: e.target.value })}
                          className="text-lg font-bold text-gray-900 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isReserved && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            <Lock size={12} />
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Stage value: <span className="font-mono">{stage.value}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveStage(index, -1)}
                        disabled={index === 0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-40"
                        title="Move up"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => moveStage(index, 1)}
                        disabled={index === stages.length - 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-40"
                        title="Move down"
                      >
                        <ChevronDown size={18} />
                      </button>
                      <button
                        onClick={() => removeStage(index)}
                        disabled={isReserved}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-40"
                        title={isReserved ? 'Required stage' : 'Remove stage'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stage Color</label>
                      <select
                        value={stage.color || 'blue'}
                        onChange={(e) => updateStage(index, { color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PIPELINE_COLORS.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Required Fields</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PIPELINE_FIELD_OPTIONS.map(field => {
                          const checked = (stage.requiredFields || []).includes(field.value);
                          return (
                            <label
                              key={field.value}
                              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRequiredField(index, field.value)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm text-gray-700 font-medium">{field.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
