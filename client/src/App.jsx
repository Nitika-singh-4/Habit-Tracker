import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import StudyHistory from './pages/StudyHistory';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div>
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              activeView === 'dashboard'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveView('history')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              activeView === 'history'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Study History
          </button>
        </div>
      </div>

      {activeView === 'dashboard' ? <Dashboard /> : <StudyHistory />}
    </div>
  );
}

export default App;
