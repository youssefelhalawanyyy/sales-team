import React, { useMemo, useState } from 'react';
import { BookOpen, PlayCircle, Search, LifeBuoy, Lightbulb, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GuidedTourModal from '../components/GuidedTourModal';
import { getTourSteps } from '../utils/tourSteps';

export default function HelpCenterPage() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showTour, setShowTour] = useState(false);

  const steps = useMemo(() => getTourSteps(userRole), [userRole]);

  const faqs = [
    {
      q: 'How do I create a new deal?',
      a: 'Go to Contacts and click "Start Working" on a contact, or use Quick Add on mobile.'
    },
    {
      q: 'How do I change pipeline stages?',
      a: 'Admins and Sales Managers can open Pipeline Settings from the Admin menu.'
    },
    {
      q: 'Why can’t I see some deals?',
      a: 'Deals can be owned, shared, or team-based. Ask an admin to share or transfer ownership.'
    },
    {
      q: 'How do offline captures work?',
      a: 'When offline, Quick Add saves items locally and syncs them automatically when you are online.'
    }
  ];

  const filteredFaqs = faqs.filter(item =>
    item.q.toLowerCase().includes(search.toLowerCase()) ||
    item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <LifeBuoy className="w-8 h-8 text-yellow-300" />
                <h1 className="text-3xl lg:text-4xl font-bold">Help Center</h1>
              </div>
              <p className="text-blue-100 text-sm lg:text-base">
                Get quick answers, start the guided tour, or jump to key pages.
              </p>
            </div>

            <button
              onClick={() => setShowTour(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-semibold shadow-lg"
            >
              <PlayCircle size={20} />
              Start Guided Tour
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help topics..."
            className="w-full text-sm text-gray-700 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Frequently Asked</h2>
              </div>
              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900">{faq.q}</p>
                    <p className="text-sm text-gray-600 mt-2">{faq.a}</p>
                  </div>
                ))}
                {filteredFaqs.length === 0 && (
                  <p className="text-sm text-gray-500">No results. Try a different search.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-bold text-gray-900">Quick Links</h3>
              </div>
              <div className="space-y-2">
                <button onClick={() => navigate('/sales/contacts')} className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700">
                  Go to Contacts
                </button>
                <button onClick={() => navigate('/sales/deals')} className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700">
                  Go to Deals
                </button>
                <button onClick={() => navigate('/tasks')} className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700">
                  Go to Tasks
                </button>
                <button onClick={() => navigate('/calendar')} className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700">
                  Open Calendar
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="text-base font-bold">Pro Tip</h3>
              </div>
              <p className="text-sm text-blue-100">
                Use the Quick Add button on mobile to capture leads even when offline.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GuidedTourModal
        open={showTour}
        steps={steps}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          localStorage.setItem('tourCompleted', 'true');
          setShowTour(false);
        }}
        onNavigate={(path) => {
          setShowTour(false);
          navigate(path);
        }}
      />
    </div>
  );
}
