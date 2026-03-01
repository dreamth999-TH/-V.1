import React from 'react';
import { 
  Trash2, 
  Droplets, 
  Wallet, 
  HeartPulse, 
  Dog,
  TrendingUp,
  Users,
  Home,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { surveyService } from '../services/surveyService';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default function Statistics() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const surveys = await surveyService.getSurveys();
      setData(surveys);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from real data
  const totalHouseholds = data.length;
  const vacantHouses = data.filter(item => item.housingType === 'บ้านว่าง/ร้าง').length;
  
  const wasteStats = [
    { label: 'ถุงเขียว(รายเก่า)', value: data.filter(item => item.wasteManagement?.includes('ถุงเขียว(รายเก่า)')).length },
    { label: 'ถุงเขียว(รายใหม่)', value: data.filter(item => item.wasteManagement?.includes('ถุงเขียว(รายใหม่)')).length },
    { label: 'ถังขยะเปียก(รายเก่า)', value: data.filter(item => item.wasteManagement?.includes('ถังขยะเปียก(รายเก่า)')).length },
    { label: 'ถังขยะเปียก(รายใหม่)', value: data.filter(item => item.wasteManagement?.includes('ถังขยะเปียก(รายใหม่)')).length },
    { label: 'คัดแยกขยะอันตราย', value: data.filter(item => item.wasteManagement?.includes('มีการคัดแยกขยะอันตราย')).length },
    { label: 'คัดแยกขยะรีไซเคิล', value: data.filter(item => item.wasteManagement?.includes('มีการคัดแยกขยะรีไซเคิล')).length },
  ];

  const waterStats = [
    { label: 'ถังดักไขมัน', value: data.filter(item => item.wastewaterManagement?.includes('มีถังดักไขมัน')).length },
    { label: 'บ่อบำบัดน้ำเสีย', value: data.filter(item => item.wastewaterManagement?.includes('มีบ่อบำบัดน้ำเสีย')).length },
    { label: 'บ่อเกรอะ', value: data.filter(item => item.wastewaterManagement?.includes('ปล่อยลงบ่อเกรอะ')).length },
  ];

  const healthStats = [
    { label: 'เด็ก (0-5 ปี)', value: data.reduce((acc, item) => acc + (Number(item.healthChildren) || 0), 0) },
    { label: 'หญิงตั้งครรภ์', value: data.reduce((acc, item) => acc + (Number(item.healthPregnant) || 0), 0) },
    { label: 'ผู้สูงอายุ (ติดสังคม)', value: data.reduce((acc, item) => acc + (Number(item.healthElderlySocial) || 0), 0) },
    { label: 'ผู้พิการ', value: data.reduce((acc, item) => acc + (Number(item.healthDisabled) || 0), 0) },
  ];

  const totalPets = data.reduce((acc, item) => acc + (item.pets?.length || 0), 0);
  const wasteManagementCount = data.filter(item => item.wasteManagement?.length > 0).length;
  const wastewaterManagementCount = data.filter(item => item.wastewaterManagement?.length > 0).length;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ภาพรวมสถิติ</h2>
          <p className="text-slate-500">สรุปข้อมูลจากการเดินสำรวจทั้งหมด (ดึงข้อมูลจาก Google Sheet)</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="ครัวเรือนทั้งหมด" 
          value={totalHouseholds} 
          icon={Users} 
          color="bg-cyan-500" 
          delay={0.1}
        />
        <StatCard 
          title="บ้านว่าง/ร้าง" 
          value={vacantHouses} 
          icon={Home} 
          color="bg-slate-500" 
          delay={0.15}
        />
        <StatCard 
          title="การจัดการขยะ" 
          value={wasteManagementCount} 
          icon={Trash2} 
          color="bg-emerald-500" 
          delay={0.2}
        />
        <StatCard 
          title="การจัดการน้ำเสีย" 
          value={wastewaterManagementCount} 
          icon={Droplets} 
          color="bg-blue-500" 
          delay={0.3}
        />
        <StatCard 
          title="สัตว์เลี้ยง" 
          value={totalPets} 
          icon={Dog} 
          color="bg-orange-500" 
          delay={0.4}
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Waste Management */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Trash2 size={20} />
            </div>
            <h3 className="font-bold text-slate-800">การจัดการขยะในครัวเรือน</h3>
          </div>
          <div className="space-y-4">
            {wasteStats.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${totalHouseholds > 0 ? (item.value / totalHouseholds) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 min-w-[3ch] text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Health Screening */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <HeartPulse size={20} />
            </div>
            <h3 className="font-bold text-slate-800">การคัดกรองสุขภาพ</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {healthStats.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Droplets size={20} />
              </div>
              <h3 className="font-bold text-slate-800">การจัดการน้ำเสีย</h3>
            </div>
            <div className="space-y-3">
              {waterStats.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50">
                  <span className="text-slate-700 text-sm">{item.label}</span>
                  <span className="font-bold text-blue-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
