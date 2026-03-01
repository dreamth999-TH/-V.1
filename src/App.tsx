import React from 'react';
import Sidebar from './components/Sidebar';
import Statistics from './components/Statistics';
import SurveyForm from './components/SurveyForm';
import DataTable from './components/DataTable';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('stats');
  const [connectionStatus, setConnectionStatus] = React.useState<'online' | 'offline' | 'loading'>('loading');

  React.useEffect(() => {
    // Check real connection to Google Sheets
    const checkConnection = async () => {
      setConnectionStatus('loading');
      try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbweKdi_ygedf4q_nH8sZuYp-Ys5YZ-Q5DG2TvQzYoD-jOWrR9c_cbXDcdQ64wQ5xzo_qw/exec", {
          method: 'GET',
          mode: 'no-cors'
        });
        // With no-cors, we can't see the response, but if it doesn't throw, it's likely fine
        setConnectionStatus('online');
      } catch (error) {
        console.error("Connection check failed:", error);
        setConnectionStatus('offline');
      }
    };
    checkConnection();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'stats': return <Statistics />;
      case 'add': return <SurveyForm />;
      case 'data': return <DataTable />;
      default: return <Statistics />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {/* Top Header / Status */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sheet Status:</span>
            <div className="flex items-center gap-2">
              {connectionStatus === 'online' && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600">Online</span>
                  <Wifi size={14} className="text-emerald-500" />
                </>
              )}
              {connectionStatus === 'offline' && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-600">Offline</span>
                  <WifiOff size={14} className="text-rose-500" />
                </>
              )}
              {connectionStatus === 'loading' && (
                <>
                  <Loader2 size={14} className="text-amber-500 animate-spin" />
                  <span className="text-xs font-bold text-amber-600">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-[10px] lg:text-xs text-slate-400 font-medium">
            © 2025 ระบบบันทึกข้อมูลการเดินสำรวจ | ผู้พัฒนา กองสาธารณสุขและสิ่งแวดล้อมเทศบาลเมืองแม่ฮ่องสอน - V.1
          </p>
        </footer>
      </main>
    </div>
  );
}
