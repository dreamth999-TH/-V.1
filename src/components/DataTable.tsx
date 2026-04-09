import React from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronDown,
  Plus,
  RefreshCw,
  Camera,
  X,
  Home,
  MapPin,
  User,
  Calendar,
  Trash,
  Droplets,
  Wallet,
  HeartPulse,
  PawPrint,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  WifiOff
} from 'lucide-react';
import Swal from 'sweetalert2';
import { surveyService } from '../services/surveyService';

export default function DataTable({ onEdit }: { onEdit: (item: any) => void }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [filterPerson, setFilterPerson] = React.useState('all');
  const [filterHousing, setFilterHousing] = React.useState('all');
  const [filterFee, setFilterFee] = React.useState('all');
  const [filterPets, setFilterPets] = React.useState('all');
  const [filterVulnerable, setFilterVulnerable] = React.useState('all');
  const [filterWaste, setFilterWaste] = React.useState('all');
  const [filterWastewater, setFilterWastewater] = React.useState('all');
  const [displayCount, setDisplayCount] = React.useState(20);
  
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  
  // New states for View and Edit
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadData();
  }, []);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setDisplayCount(20); // Reset pagination on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setDisplayCount(20);
  }, [filterPerson, filterHousing, filterFee, filterPets, filterVulnerable, filterWaste, filterWastewater]);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const surveys = await surveyService.getSurveys(force);
      setData(surveys);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load data:", err);
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้';
      setError(errorMessage);
      Swal.fire({
        title: 'ข้อผิดพลาด',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = React.useMemo(() => {
    const normalize = (val: any) => {
      if (val === undefined || val === null) return "";
      return val.toString()
        .toLowerCase()
        .trim()
        .replace(/^ถนน/, "")
        .replace(/\s+/g, " ");
    };

    const search = normalize(debouncedSearchTerm);

    return data.filter(item => {
      const itemFullName = normalize(item.fullName);
      const itemCommunity = normalize(item.community);
      const itemRoad = normalize(item.road);
      const itemSoi = normalize(item.soi);
      const itemHouseNo = normalize(item.houseNo);
      
      const matchesSearch = search === "" || 
        itemFullName.includes(search) ||
        itemCommunity.includes(search) ||
        itemRoad.includes(search) ||
        itemSoi.includes(search) ||
        itemHouseNo.includes(search);
      
      const matchesFilter = filterPerson === 'all' || item.responsiblePerson === filterPerson;
      
      const matchesHousing = filterHousing === 'all' || item.housingType === filterHousing;
      
      const matchesFee = filterFee === 'all' || 
        (filterFee === 'paid' && (item.feeType === 'monthly' || item.feeType === 'yearly')) ||
        (filterFee === 'none' && item.feeType === 'none');
        
      const matchesPets = filterPets === 'all' || 
        (filterPets === 'yes' && item.hasPets === 'yes') ||
        (filterPets === 'no' && item.hasPets === 'no');

      const matchesVulnerable = filterVulnerable === 'all' ||
        (filterVulnerable === 'children' && item.healthChildren > 0) ||
        (filterVulnerable === 'pregnant' && item.healthPregnant > 0) ||
        (filterVulnerable === 'elderly' && (item.healthElderlySocial > 0 || item.healthElderlyHome > 0 || item.healthElderlyBedridden > 0)) ||
        (filterVulnerable === 'disabled' && item.healthDisabled > 0);
      
      const matchesWaste = filterWaste === 'all' || item.wasteManagement?.includes(filterWaste);
      
      const matchesWastewater = filterWastewater === 'all' || item.wastewaterManagement?.includes(filterWastewater);
      
      return matchesSearch && matchesFilter && matchesHousing && matchesFee && matchesPets && matchesVulnerable && matchesWaste && matchesWastewater;
    });
  }, [data, debouncedSearchTerm, filterPerson, filterHousing, filterFee, filterPets, filterVulnerable, filterWaste, filterWastewater]);

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: `คุณต้องการลบข้อมูลของ ${name} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const response = await surveyService.deleteSurvey(id);
      if (response.success) {
        Swal.fire('ลบแล้ว!', 'ข้อมูลถูกลบออกจากระบบแล้ว', 'success');
        loadData();
      } else {
        Swal.fire('ผิดพลาด', response.message, 'error');
        setLoading(false);
      }
    }
  };

  const responsiblePersons = Array.from(new Set(data.map(item => item.responsiblePerson))).filter(Boolean);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Search size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">ข้อมูลการเดินสำรวจ</h2>
          </div>
          <p className="text-slate-500 font-medium">จัดการและเรียกดูข้อมูลทั้งหมดในระบบแบบเรียลไทม์</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            รีเฟรชข้อมูล
          </button>
          {lastUpdated && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อ-นามสกุล, ชุมชน, ถนน, บ้านเลขที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 transition-all shadow-inner"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <select 
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 appearance-none transition-all shadow-inner font-bold text-slate-600"
            >
              <option value="all">ผู้รับผิดชอบทั้งหมด</option>
              {responsiblePersons.map((person: any) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Advanced Filters Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Filter size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ตัวกรองขั้นสูง</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'ประเภทที่อยู่', val: filterHousing, set: setFilterHousing, options: [
                { v: 'all', l: 'ทั้งหมด' }, { v: 'บ้าน', l: 'บ้าน' }, { v: 'ร้าน', l: 'ร้าน' }, { v: 'บ้านว่าง/ร้าง', l: 'บ้านว่าง/ร้าง' }, { v: 'อื่นๆ', l: 'อื่นๆ' }
              ]},
              { label: 'การจ่ายค่าขยะ', val: filterFee, set: setFilterFee, options: [
                { v: 'all', l: 'ทั้งหมด' }, { v: 'paid', l: 'จ่ายแล้ว' }, { v: 'none', l: 'ไม่จ่าย' }
              ]},
              { label: 'สัตว์เลี้ยง', val: filterPets, set: setFilterPets, options: [
                { v: 'all', l: 'ทั้งหมด' }, { v: 'yes', l: 'มี' }, { v: 'no', l: 'ไม่มี' }
              ]},
              { label: 'กลุ่มเปราะบาง', val: filterVulnerable, set: setFilterVulnerable, options: [
                { v: 'all', l: 'ทั้งหมด' }, { v: 'children', l: 'เด็ก' }, { v: 'pregnant', l: 'หญิงตั้งครรภ์' }, { v: 'elderly', l: 'ผู้สูงอายุ' }, { v: 'disabled', l: 'ผู้พิการ' }
              ]},
              { label: 'จัดการขยะ', val: filterWaste, set: setFilterWaste, options: [
                { v: 'all', l: 'ทั้งหมด' }, 
                { v: 'ไม่มีการคัดแยกขยะ', l: 'ไม่คัดแยก' }, 
                { v: 'ถุงเขียว(รายเก่า)', l: 'ถุงเขียว(เก่า)' }, 
                { v: 'ถุงเขียว(รายใหม่)', l: 'ถุงเขียว(ใหม่)' }, 
                { v: 'ถังขยะเปียก(รายเก่า)', l: 'ถังขยะเปียก(เก่า)' }, 
                { v: 'ถังขยะเปียก(รายใหม่)', l: 'ถังขยะเปียก(ใหม่)' }, 
                { v: 'นำเศษอาหารไปเลี้ยงสัตว์', l: 'เลี้ยงสัตว์' }, 
                { v: 'ทำปุ๋ย', l: 'ทำปุ๋ย' }, 
                { v: 'คัดแยกขยะอันตราย', l: 'ขยะอันตราย' }, 
                { v: 'คัดแยกขยะรีไซเคิล', l: 'รีไซเคิล' }
              ]},
              { label: 'จัดการน้ำเสีย', val: filterWastewater, set: setFilterWastewater, options: [
                { v: 'all', l: 'ทั้งหมด' }, 
                { v: 'ปล่อยน้ำลงท่อ/ทางระบายน้ำสาธารณะ', l: 'ท่อสาธารณะ' }, 
                { v: 'ปล่อยน้ำลงแม่น้ำ', l: 'ลงแม่น้ำ' }, 
                { v: 'ปล่อยน้ำลงพื้นที่ส่วนตัว', l: 'พื้นที่ส่วนตัว' }, 
                { v: 'ปล่อยน้ำลงบ่อเกรอะ', l: 'บ่อเกรอะ' }, 
                { v: 'มีถัง/บ่อดักไขมัน', l: 'ดักไขมัน' }
              ]}
            ].map((f, i) => (
              <div key={i} className="relative group">
                <div className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                  {f.label}
                </div>
                <select 
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none transition-all shadow-sm"
                >
                  {f.options.map(opt => (
                    <option key={opt.v} value={opt.v}>{opt.l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-400 transition-colors" size={12} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-xs text-slate-500 font-bold">
              พบข้อมูล <span className="text-indigo-600 font-black">{filteredData.length}</span> ครัวเรือน
            </p>
          </div>
          {(filterHousing !== 'all' || filterFee !== 'all' || filterPets !== 'all' || filterVulnerable !== 'all' || filterWaste !== 'all' || filterWastewater !== 'all' || filterPerson !== 'all' || searchTerm !== '') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterPerson('all');
                setFilterHousing('all');
                setFilterFee('all');
                setFilterPets('all');
                setFilterVulnerable('all');
                setFilterWaste('all');
                setFilterWastewater('all');
              }}
              className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg transition-all active:scale-95"
            >
              <RefreshCw size={12} />
              ล้างการกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {loading && data.length > 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-100">
              <div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600">กำลังอัปเดตข้อมูล...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">ผู้รับผิดชอบ</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">ประเภท</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">ชื่อ-นามสกุล</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">ที่อยู่</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">ข้อมูลสำรวจ</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">กำลังโหลดข้อมูลจาก Google Sheet...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-rose-50 text-rose-500 rounded-full">
                        <WifiOff size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">เกิดข้อผิดพลาดในการเชื่อมต่อ</p>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">{error}</p>
                      </div>
                      <button 
                        onClick={() => loadData(true)}
                        className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                      >
                        ลองใหม่อีกครั้ง
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {loading ? 'กำลังอัปเดตข้อมูล...' : 'ไม่พบข้อมูลที่ค้นหา'}
                  </td>
                </tr>
              ) : (
                filteredData.slice(0, displayCount).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{item.responsiblePerson}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.housingType === 'บ้านว่าง/ร้าง' ? 'bg-slate-100 text-slate-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {item.housingType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {item.prefix}{item.fullName}
                        {item.housingType === 'ร้าน' && item.shopName && (
                          <span className="ml-2 text-xs font-normal text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                            ร้าน: {item.shopName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{item.community}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">{item.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{item.houseNo}</div>
                      <div className="text-xs text-slate-400">{item.road && !item.road.startsWith('ถนน') ? `ถนน${item.road}` : item.road}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 max-w-[320px]">
                        {/* Waste Tags */}
                        {item.wasteManagement?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.wasteManagement.map((w: string) => (
                              <span key={w} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Wastewater Tags */}
                        {item.wastewaterManagement?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.wastewaterManagement.map((ww: string) => (
                              <span key={ww} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                {ww}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {/* Fee Tag */}
                          {item.feeType && (
                            <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm ${
                              item.feeType === 'none' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {item.feeType === 'monthly' ? 'จ่ายรายเดือน' : item.feeType === 'yearly' ? 'จ่ายรายปี' : 'ไม่จ่ายค่าขยะ'}
                            </span>
                          )}

                          {/* Vulnerable Population Tags */}
                          {item.healthChildren > 0 && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">มีเด็ก</span>}
                          {item.healthPregnant > 0 && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">มีหญิงตั้งครรภ์</span>}
                          {(item.healthElderlySocial > 0 || item.healthElderlyHome > 0 || item.healthElderlyBedridden > 0) && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">มีผู้สูงอายุ</span>
                          )}
                          {item.healthDisabled > 0 && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">มีผู้พิการ</span>}
                          
                          {/* Pet Tag */}
                          {item.hasPets === 'yes' && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">มีสัตว์เลี้ยง</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedItem(item);
                            setIsViewOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" 
                          title="ดูข้อมูล"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onEdit(item)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
                          title="แก้ไข"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.fullName)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredData.length > displayCount && (
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => setDisplayCount(prev => prev + 20)}
              className="group flex items-center gap-3 px-10 py-4 bg-white border-2 border-indigo-100 rounded-2xl text-sm font-black text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-200/50 active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              แสดงข้อมูลเพิ่มอีก 20 ครัวเรือน
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                  <Eye size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">รายละเอียดข้อมูลการสำรวจ</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {selectedItem.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsViewOpen(false)}
                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <RefreshCw size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
              {/* Image Section */}
              {selectedItem.imageUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={18} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">รูปภาพที่พักอาศัย</span>
                  </div>
                  <div className="w-full aspect-video rounded-[1.5rem] overflow-hidden bg-slate-100 border border-slate-200 group relative shadow-inner">
                    <img 
                      src={selectedItem.imageUrl} 
                      alt="House" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={selectedItem.imageUrl.replace('uc?export=view&id=', 'file/d/') + '/view'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black gap-2 backdrop-blur-[2px]"
                    >
                      <Camera size={28} />
                      ดูรูปภาพขนาดเต็ม
                    </a>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ข้อมูลพื้นฐาน</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400">ชื่อ-นามสกุล</p>
                        <p className="text-slate-800 font-black text-lg">{selectedItem.fullName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">เบอร์โทรศัพท์</p>
                        <p className="text-slate-800 font-bold font-mono">{selectedItem.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">ที่อยู่</p>
                        <p className="text-slate-800 font-bold">{selectedItem.houseNo} {selectedItem.soi ? `ซอย ${selectedItem.soi}` : ''} {selectedItem.road && !selectedItem.road.startsWith('ถนน') ? `ถนน${selectedItem.road}` : selectedItem.road}</p>
                        <p className="text-sm text-slate-500 font-medium">{selectedItem.community}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">รายละเอียดที่พัก</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400">ประเภทที่อยู่</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-black border border-indigo-100">
                            {selectedItem.housingType === 'อื่นๆ' ? selectedItem.housingTypeOther : selectedItem.housingType}
                          </span>
                          {selectedItem.shopName && (
                            <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-black border border-cyan-100">
                              ร้าน: {selectedItem.shopName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">ผู้รับผิดชอบ</p>
                        <p className="text-slate-800 font-bold">{selectedItem.responsiblePerson}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">พิกัดแผนที่</p>
                        <p className="text-slate-800 font-mono text-xs mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                          {(selectedItem.latitude !== undefined && selectedItem.longitude !== undefined)
                            ? `${selectedItem.latitude}, ${selectedItem.longitude}` 
                            : 'ไม่ได้ระบุพิกัด'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Management Section */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={18} className="text-emerald-500" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">การจัดการสิ่งแวดล้อมและค่าธรรมเนียม</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Trash2 size={14} />
                      การจัดการขยะ
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.wasteManagement?.length > 0 ? selectedItem.wasteManagement.map((w: string) => (
                        <span key={w} className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 shadow-sm">
                          {w}
                        </span>
                      )) : <span className="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>}
                    </div>
                  </div>

                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <RefreshCw size={14} />
                      การจัดการน้ำเสีย
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.wastewaterManagement?.length > 0 ? selectedItem.wastewaterManagement.map((ww: string) => (
                        <span key={ww} className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 shadow-sm">
                          {ww}
                        </span>
                      )) : <span className="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>}
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Wallet size={14} />
                      ค่าธรรมเนียม
                    </p>
                    <div className="space-y-2">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black border shadow-sm ${
                        selectedItem.feeType === 'none' ? 'bg-white text-slate-500 border-slate-200' : 'bg-white text-amber-700 border-amber-200'
                      }`}>
                        {selectedItem.feeType === 'monthly' ? 'จ่ายรายเดือน' : selectedItem.feeType === 'yearly' ? 'จ่ายรายปี' : 'ไม่จ่ายค่าขยะ'}
                      </span>
                      {selectedItem.feeAmount && (
                        <p className="text-sm font-black text-slate-700 mt-1">{selectedItem.feeAmount} บาท</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vulnerable Population Info */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse size={18} className="text-rose-500" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ประชากรกลุ่มเปราะบาง</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'เด็ก', val: selectedItem.healthChildren },
                    { label: 'หญิงตั้งครรภ์', val: selectedItem.healthPregnant },
                    { label: 'ผู้สูงอายุ (สังคม)', val: selectedItem.healthElderlySocial },
                    { label: 'ผู้สูงอายุ (บ้าน)', val: selectedItem.healthElderlyHome },
                    { label: 'ผู้สูงอายุ (เตียง)', val: selectedItem.healthElderlyBedridden },
                    { label: 'ผู้พิการ', val: selectedItem.healthDisabled }
                  ].map((h, i) => (
                    <div key={i} className={`p-3 rounded-2xl border transition-all ${h.val > 0 ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">{h.label}</p>
                      <p className={`text-xl font-black ${h.val > 0 ? 'text-rose-700' : 'text-slate-300'}`}>{h.val || 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pets */}
              {selectedItem.hasPets === 'yes' && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus size={18} className="text-orange-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ข้อมูลสัตว์เลี้ยง</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedItem.pets?.map((pet: any, idx: number) => (
                      <div key={idx} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 font-black">
                            {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-orange-900">
                              {pet.type === 'dog' ? 'สุนัข' : pet.type === 'cat' ? 'แมว' : `อื่นๆ (${pet.typeOther})`}
                            </p>
                            <p className="text-[10px] font-bold text-orange-600 uppercase">
                              {pet.gender === 'male' ? 'เพศผู้' : 'เพศเมีย'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-orange-800">{pet.ageYear} ปี {pet.ageMonth} เดือน</p>
                          <p className="text-[9px] font-bold text-orange-400 uppercase">อายุ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsViewOpen(false)}
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
