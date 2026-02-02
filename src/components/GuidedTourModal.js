import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X, MapPin } from 'lucide-react';

export default function GuidedTourModal({ open, steps, onClose, onComplete, onNavigate }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  const handleNext = () => {
    if (isLast) {
      if (onComplete) onComplete();
      return;
    }
    setIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setIndex(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Guided Tour</p>
            <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700 leading-relaxed">{step.body}</p>
          {step.path && (
            <button
              onClick={() => onNavigate?.(step.path)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-all"
            >
              <MapPin size={16} />
              {step.ctaLabel || 'Open this page'}
            </button>
          )}
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">Step {index + 1} of {steps.length}</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirst}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30"
          >
            {isLast ? 'Finish Tour' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
