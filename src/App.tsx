import { useEffect, useState } from 'react';
import AdminPanel from './components/AdminPanel';
import PublicView from './components/PublicView';
import ReceptionLogin from './components/ReceptionLogin';
import { HotelData } from './types/hotel';
import { loadHotelData, saveHotelData } from './utils/hotelLogic';

type ActiveTab = 'public' | 'reception';

export default function App() {
  const [data, setData] = useState<HotelData>(() => loadHotelData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('public');
  const [isReceptionUnlocked, setIsReceptionUnlocked] = useState(false);

  useEffect(() => {
    saveHotelData(data);
  }, [data]);

  const handleUpdateData = (updater: (prev: HotelData) => HotelData) => {
    setData((prev) => updater(prev));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('public');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-teal-700 transition-colors duration-200 whitespace-nowrap shrink-0"
          >
            Хотелски мениджър
          </a>

          <nav aria-label="Основна навигация" className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('public')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
                activeTab === 'public'
                  ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
                  : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
              }`}
            >
              Справки
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reception')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer hover:-translate-y-0.5 ${
                activeTab === 'reception'
                  ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-600'
                  : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
              }`}
            >
              Вход за рецепция
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'public' && <PublicView data={data} />}
        {activeTab === 'reception' && !isReceptionUnlocked && (
          <ReceptionLogin onLoginSuccess={() => setIsReceptionUnlocked(true)} />
        )}
        {activeTab === 'reception' && isReceptionUnlocked && (
          <AdminPanel
            data={data}
            onUpdateData={handleUpdateData}
            onLogout={() => {
              setIsReceptionUnlocked(false);
              setActiveTab('public');
            }}
          />
        )}
      </main>
    </div>
  );
}
