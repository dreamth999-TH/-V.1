import React from 'react';
import MapComponent from './MapComponent';
import { surveyService, type SurveyData } from '../services/surveyService';
import { Loader2, Map as MapIcon, RefreshCw, Eye, Edit2, Trash2, X, Home, User, Phone, MapPin, Camera, HeartPulse, Filter, WifiOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

export default function MapView({ onEdit }: { onEdit: (item: any) => void }) {
  const [data, setData] = React.useState<SurveyData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<SurveyData | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [filterHousing, setFilterHousing] = React.useState('all');
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
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = React.useMemo(() => {
    if (filterHousing === 'all') return data;
    if (filterHousing === 'residential') {
      return data.filter(item => item.housingType === 'บ้าน' || item.housingType === 'บ้านเช่า');
    }
    if (filterHousing === 'commercial') {
      return data.filter(item => item.housingType === 'ร้านอาหาร' || item.housingType === 'ร้านค้า');
    }
    if (filterHousing === 'vacant') {
      return data.filter(item => item.housingType === 'บ้านว่าง' || item.housingType === 'บ้านร้าง');
    }
    if (filterHousing === 'office') {
      return data.filter(item => item.housingType === 'สำนักงาน');
    }
    if (filterHousing === 'other') {
      return data.filter(item => item.housingType === 'อื่นๆ');
    }
    return data;
  }, [data, filterHousing]);

  const handleMarkerClick = (survey: SurveyData) => {
    setSelectedItem(survey);
    setIsViewOpen(true);
  };

  const handleDelete = async (timestamp: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'กำลังลบข้อมูล...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        await surveyService.deleteSurvey(timestamp);
        await loadData();
        setIsViewOpen(false);
        Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบออกจากระบบแล้ว', 'success');
      } catch (error) {
        console.error("Delete failed:", error);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลแผนที่...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-4">
          <WifiOff size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่สามารถโหลดข้อมูลแผนที่ได้</h3>
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
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <MapIcon size={24} />
            </div>
            แผนที่แสดงที่ตั้งบ้านเรือน
          </h2>
          <p className="text-slate-500 text-sm mt-1">แสดงตำแหน่งของบ้านเรือนทั้งหมดที่ได้ทำการสำรวจแล้ว</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
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

      {/* Map Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Filter size={16} className="text-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ตัวกรองประเภทที่อยู่</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'ทั้งหมด', color: 'bg-slate-100 text-slate-600' },
            { id: 'residential', label: 'บ้าน/บ้านเช่า', color: 'bg-indigo-100 text-indigo-600' },
            { id: 'commercial', label: 'ร้านอาหาร/ร้านค้า', color: 'bg-amber-100 text-amber-600' },
            { id: 'vacant', label: 'บ้านว่าง/บ้านร้าง', color: 'bg-slate-200 text-slate-500' },
            { id: 'office', label: 'สำนักงาน', color: 'bg-cyan-100 text-cyan-600' },
            { id: 'other', label: 'อื่นๆ', color: 'bg-violet-100 text-violet-600' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterHousing(filter.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                filterHousing === filter.id 
                  ? `${filter.color.replace('bg-', 'border-').replace('text-', 'bg-')} text-white border-current` 
                  : `bg-white border-slate-100 text-slate-400 hover:border-slate-200`
              }`}
              style={filterHousing === filter.id ? { borderColor: 'currentColor' } : {}}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <MapComponent data={filteredData} onMarkerClick={handleMarkerClick} />

      {/* View Modal (Similar to DataTable View Modal) */}
      <AnimatePresence>
        {isViewOpen && selectedItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-100 text-cyan-600 rounded-2xl">
                    <Home size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">ข้อมูลบ้านเลขที่ {selectedItem.houseNo}</h3>
                    <p className="text-sm text-slate-500">ชุมชน{selectedItem.community} • {selectedItem.road && !selectedItem.road.startsWith('ถนน') ? `ถนน${selectedItem.road}` : selectedItem.road}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsViewOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Image & Basic Info */}
                  <div className="space-y-6">
                    {selectedItem.imageUrl ? (
                      <div className="relative group rounded-2xl overflow-hidden shadow-md aspect-video bg-slate-100">
                        <img 
                          src={selectedItem.imageUrl} 
                          alt="House" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <a 
                          href={selectedItem.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2"
                        >
                          <Camera size={20} />
                          ดูรูปภาพเต็ม
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <Camera size={48} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">ไม่มีรูปภาพ</p>
                      </div>
                    )}

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <User size={18} className="text-cyan-500" />
                        ข้อมูลเจ้าของบ้าน/ผู้ให้ข้อมูล
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 mb-1">ชื่อ-นามสกุล</p>
                          <p className="font-bold text-slate-700">{selectedItem.prefix}{selectedItem.fullName}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">เบอร์โทรศัพท์</p>
                          <p className="font-bold text-slate-700">{selectedItem.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">ประเภทที่อยู่</p>
                          <p className="font-bold text-slate-700">{selectedItem.housingType}</p>
                        </div>
                        {selectedItem.shopName && (
                          <div>
                            <p className="text-slate-400 mb-1">ชื่อร้าน</p>
                            <p className="font-bold text-slate-700">{selectedItem.shopName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="space-y-6">
                    {/* Location Info */}
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                      <h4 className="font-bold text-indigo-800 flex items-center gap-2">
                        <MapPin size={18} className="text-indigo-500" />
                        พิกัดตำแหน่ง
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-indigo-400 mb-1">ละติจูด</p>
                          <p className="font-mono font-bold text-indigo-700">{selectedItem.latitude !== undefined ? selectedItem.latitude : '-'}</p>
                        </div>
                        <div>
                          <p className="text-indigo-400 mb-1">ลองจิจูด</p>
                          <p className="font-mono font-bold text-indigo-700">{selectedItem.longitude !== undefined ? selectedItem.longitude : '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">ผู้อยู่อาศัย</p>
                        <p className="text-2xl font-black text-emerald-700">{selectedItem.residentsCount} <span className="text-sm font-normal">คน</span></p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-xs font-bold text-rose-600 uppercase mb-1">สัตว์เลี้ยง</p>
                        <p className="text-2xl font-black text-rose-700">{selectedItem.pets?.length || 0} <span className="text-sm font-normal">ตัว</span></p>
                      </div>
                    </div>

                    {/* Vulnerable Population */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <HeartPulse size={18} className="text-rose-500" />
                        ประชากรกลุ่มเปราะบาง
                      </h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">เด็ก (0-5 ปี)</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthChildren || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">หญิงตั้งครรภ์</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthPregnant || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">สูงอายุ (ติดสังคม)</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthElderlySocial || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">สูงอายุ (ติดบ้าน)</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthElderlyHome || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">สูงอายุ (ติดเตียง)</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthElderlyBedridden || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-500">ผู้พิการ</span>
                          <span className="font-bold text-slate-700">{selectedItem.healthDisabled || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => {
                    onEdit(selectedItem);
                    setIsViewOpen(false);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-md shadow-cyan-100"
                >
                  <Edit2 size={18} />
                  แก้ไขข้อมูล
                </button>
                <button 
                  onClick={() => handleDelete(selectedItem.timestamp)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={18} />
                  ลบข้อมูล
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
