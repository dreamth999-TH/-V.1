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
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LayoutDashboard,
  Loader2,
  WifiOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { surveyService } from '../services/surveyService';

const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9', '#14b8a6'];

const StatCard = ({ title, value, icon: Icon, color, delay, subValue }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-800 group-hover:scale-110 transition-transform origin-left">{value}</h3>
          {subValue && <span className="text-xs text-slate-400 font-medium">{subValue}</span>}
        </div>
      </div>
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg group-hover:rotate-12 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default function Statistics() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const surveys = await surveyService.getSurveys(force);
      setData(surveys);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from real data
  const totalRecords = data.length;
  const vacantHouses = data.filter(item => item.housingType === 'บ้านว่าง/ร้าง').length;
  const activeHouseholds = totalRecords - vacantHouses;
  
  const wasteStats = [
    { name: 'ไม่มีการคัดแยกขยะ', value: data.filter(item => item.wasteManagement?.includes('ไม่มีการคัดแยกขยะ')).length },
    { name: 'ถุงเขียว(รายเก่า)', value: data.filter(item => item.wasteManagement?.includes('ถุงเขียว(รายเก่า)')).length },
    { name: 'ถุงเขียว(รายใหม่)', value: data.filter(item => item.wasteManagement?.includes('ถุงเขียว(รายใหม่)')).length },
    { name: 'ถังขยะเปียก(รายเก่า)', value: data.filter(item => item.wasteManagement?.includes('ถังขยะเปียก(รายเก่า)')).length },
    { name: 'ถังขยะเปียก(รายใหม่)', value: data.filter(item => item.wasteManagement?.includes('ถังขยะเปียก(รายใหม่)')).length },
    { name: 'นำเศษอาหารไปเลี้ยงสัตว์', value: data.filter(item => item.wasteManagement?.includes('นำเศษอาหารไปเลี้ยงสัตว์')).length },
    { name: 'ทำปุ๋ย', value: data.filter(item => item.wasteManagement?.includes('ทำปุ๋ย')).length },
    { name: 'คัดแยกขยะอันตราย', value: data.filter(item => item.wasteManagement?.includes('คัดแยกขยะอันตราย')).length },
    { name: 'คัดแยกขยะรีไซเคิล', value: data.filter(item => item.wasteManagement?.includes('คัดแยกขยะรีไซเคิล')).length },
    { name: 'อื่นๆ', value: data.filter(item => item.wasteManagement?.includes('อื่นๆ')).length },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  const waterStats = [
    { name: 'ท่อ/ทางระบายน้ำสาธารณะ', value: data.filter(item => item.wastewaterManagement?.includes('ปล่อยน้ำลงท่อ/ทางระบายน้ำสาธารณะ')).length },
    { name: 'แม่น้ำ', value: data.filter(item => item.wastewaterManagement?.includes('ปล่อยน้ำลงแม่น้ำ')).length },
    { name: 'พื้นที่ส่วนตัว', value: data.filter(item => item.wastewaterManagement?.includes('ปล่อยน้ำลงพื้นที่ส่วนตัว')).length },
    { name: 'บ่อเกรอะ', value: data.filter(item => item.wastewaterManagement?.includes('ปล่อยน้ำลงบ่อเกรอะ')).length },
    { name: 'ถัง/บ่อดักไขมัน', value: data.filter(item => item.wastewaterManagement?.includes('มีถัง/บ่อดักไขมัน')).length },
    { name: 'อื่นๆ', value: data.filter(item => item.wastewaterManagement?.includes('อื่นๆ')).length },
  ].filter(s => s.value > 0);

  const healthStats = [
    { name: 'เด็ก (0-5 ปี)', value: data.reduce((acc, item) => acc + (Number(item.healthChildren) || 0), 0) },
    { name: 'หญิงตั้งครรภ์', value: data.reduce((acc, item) => acc + (Number(item.healthPregnant) || 0), 0) },
    { name: 'ผู้สูงอายุ (ติดสังคม)', value: data.reduce((acc, item) => acc + (Number(item.healthElderlySocial) || 0), 0) },
    { name: 'ผู้สูงอายุ (ติดบ้าน)', value: data.reduce((acc, item) => acc + (Number(item.healthElderlyHome) || 0), 0) },
    { name: 'ผู้สูงอายุ (ติดเตียง)', value: data.reduce((acc, item) => acc + (Number(item.healthElderlyBedridden) || 0), 0) },
    { name: 'ผู้พิการ', value: data.reduce((acc, item) => acc + (Number(item.healthDisabled) || 0), 0) },
  ];

  const feeStats = [
    { name: 'จ่ายรายเดือน', value: data.filter(item => item.feeType === 'monthly').length },
    { name: 'จ่ายรายปี', value: data.filter(item => item.feeType === 'yearly').length },
    { name: 'ไม่จ่ายค่าขยะ', value: data.filter(item => item.feeType === 'none').length },
  ].filter(s => s.value > 0);

  const totalPets = data.reduce((acc, item) => acc + (item.pets?.length || 0), 0);
  const residentsCount = data.reduce((acc, item) => acc + (Number(item.residentsCount) || 0), 0);

  // Calculate pet statistics
  const petSummary = data.reduce((acc, item) => {
    (item.pets || []).forEach((pet: any) => {
      if (pet.type === 'dog') {
        acc.dogs++;
        if (pet.rabiesVaccine === 'yes') acc.vaccinated++;
        if (pet.sterilized === 'yes') acc.sterilized++;
      } else if (pet.type === 'cat') {
        acc.cats++;
        if (pet.rabiesVaccine === 'yes') acc.vaccinated++;
        if (pet.sterilized === 'yes') acc.sterilized++;
      } else if (pet.type === 'other') {
        acc.others += (Number(pet.count) || 1);
      }
    });
    return acc;
  }, { dogs: 0, cats: 0, others: 0, vaccinated: 0, sterilized: 0 });

  const petChartData = [
    { name: 'สุนัข', value: petSummary.dogs, color: '#f59e0b' },
    { name: 'แมว', value: petSummary.cats, color: '#fb923c' },
    { name: 'ฉีดวัคซีน', value: petSummary.vaccinated, color: '#10b981' },
    { name: 'ทำหมัน', value: petSummary.sterilized, color: '#3b82f6' },
    { name: 'สัตว์อื่นๆ', value: petSummary.others, color: '#94a3b8' },
  ];

  // Calculate housing type statistics
  const housingTypeCounts = data.reduce((acc: any, item) => {
    const type = item.housingType || 'ไม่ระบุ';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const housingTypeStats = Object.entries(housingTypeCounts).map(([name, value]) => ({
    name,
    value: value as number
  })).sort((a, b) => b.value - a.value);

  const getHousingIcon = (type: string) => {
    if (type.includes('บ้าน') && !type.includes('ว่าง') && !type.includes('ร้าง')) return Home;
    if (type.includes('ร้าน')) return LayoutDashboard;
    if (type.includes('สำนักงาน')) return LayoutDashboard;
    if (type.includes('ว่าง') || type.includes('ร้าง')) return Home;
    return Home;
  };

  const getHousingColor = (type: string) => {
    if (type === 'บ้าน' || type === 'บ้านเช่า') return 'bg-indigo-500';
    if (type === 'ร้านอาหาร' || type === 'ร้านค้า') return 'bg-amber-500';
    if (type === 'บ้านว่าง' || type === 'บ้านร้าง') return 'bg-slate-400';
    if (type === 'สำนักงาน') return 'bg-cyan-500';
    if (type === 'อื่นๆ') return 'bg-violet-500';
    return 'bg-slate-400';
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">กำลังประมวลผลข้อมูลสถิติ...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-4">
          <WifiOff size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่สามารถโหลดข้อมูลสถิติได้</h3>
        <p className="text-slate-500 mb-6 max-w-md">{error}</p>
        <button 
          onClick={() => loadData(true)}
          className="px-8 py-3 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 flex items-center gap-2"
        >
          <RefreshCw size={20} />
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="text-indigo-600" size={24} />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">แดชบอร์ดสถิติ</h2>
          </div>
          <p className="text-slate-500 font-medium">สรุปข้อมูลจากการสำรวจภาคสนามแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold">
            อัปเดตล่าสุด: {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : 'กำลังโหลด...'}
          </div>
          <button 
            onClick={() => loadData(true)}
            disabled={loading}
            className="p-3 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Stats Grid - Only Total Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="ข้อมูลทั้งหมด" 
          value={totalRecords} 
          subValue="รายการ"
          icon={TrendingUp} 
          color="bg-indigo-600" 
          delay={0.1}
        />
      </div>

      {/* Housing Type Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Home size={18} className="text-indigo-500" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">สรุปประเภทที่อยู่</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {housingTypeStats.map((stat, idx) => (
            <StatCard 
              key={stat.name}
              title={stat.name}
              value={stat.value}
              subValue="หลัง/แห่ง"
              icon={getHousingIcon(stat.name)}
              color={getHousingColor(stat.name)}
              delay={0.1 + (idx * 0.05)}
            />
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Waste Management Chart */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-800">การจัดการขยะ</h3>
            </div>
            <PieChartIcon className="text-slate-300" size={24} />
          </div>
          
          <div className="h-[400px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={wasteStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {wasteStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4 overflow-y-auto max-h-[120px]">
              {wasteStats.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-slate-600 truncate">{item.name}</span>
                  <span className="text-[10px] font-black text-slate-400 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Wastewater Pie Chart */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Droplets size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-800">การจัดการน้ำเสีย</h3>
            </div>
            <PieChartIcon className="text-slate-300" size={24} />
          </div>

          <div className="h-[400px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={waterStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {waterStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4">
              {waterStats.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 truncate">{item.name}</span>
                  <span className="text-xs font-black text-slate-400 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Waste Fee Statistics Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Wallet size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">การจ่ายค่าธรรมเนียมขยะ</h3>
          </div>
          <PieChartIcon className="text-slate-300" size={24} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {feeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#64748b'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {feeStats.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#f59e0b', '#10b981', '#64748b'][i % 3] }} />
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800">{item.value}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">ครัวเรือน</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Vulnerable Population Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
              <HeartPulse size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">ประชากรกลุ่มเปราะบาง</h3>
          </div>
          <BarChartIcon className="text-slate-300" size={24} />
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                {healthStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#e11d48'][index % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {healthStats.map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.name}</p>
              <p className="text-xl font-black text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Pet Statistics Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Dog size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">สถิติข้อมูลสัตว์เลี้ยง</h3>
          </div>
          <BarChartIcon className="text-slate-300" size={24} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={petChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {petChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">สรุปข้อมูลสัตว์เลี้ยง</h4>
              <div className="space-y-3">
                {petChartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-lg font-black text-slate-800">{item.value} <span className="text-xs text-slate-400 font-medium">ตัว</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

