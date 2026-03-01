import React from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronDown,
  Plus,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { surveyService } from '../services/surveyService';

export default function DataTable() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterPerson, setFilterPerson] = React.useState('all');
  const [displayCount, setDisplayCount] = React.useState(20);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const surveys = await surveyService.getSurveys();
      setData(surveys);
    } catch (error) {
      console.error("Failed to load data:", error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.community?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.road?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.houseNo || '').includes(searchTerm);
    
    const matchesFilter = filterPerson === 'all' || item.responsiblePerson === filterPerson;
    
    return matchesSearch && matchesFilter;
  });

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
          <h2 className="text-2xl font-bold text-slate-800">ข้อมูลการเดินสำรวจ</h2>
          <p className="text-slate-500">จัดการและเรียกดูข้อมูลทั้งหมดในระบบ (ดึงข้อมูลจาก Google Sheet)</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          รีเฟรชข้อมูล
        </button>
      </header>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="ค้นหาชื่อ-นามสกุล, ชุมชน, ถนน, บ้านเลขที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none bg-white transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select 
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none bg-white appearance-none transition-all"
          >
            <option value="all">ผู้รับผิดชอบทั้งหมด</option>
            {responsiblePersons.map((person: any) => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">ผู้รับผิดชอบ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">ประเภท</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">ที่อยู่</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">ข้อมูลสำรวจ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">จัดการ</th>
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
                      <div className="text-xs text-slate-400">{item.road}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {/* Waste Tags */}
                        {item.wasteManagement?.map((w: string) => (
                          <span key={w} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] whitespace-nowrap">
                            {w}
                          </span>
                        ))}
                        
                        {/* Wastewater Tags */}
                        {item.wastewaterManagement?.map((ww: string) => (
                          <span key={ww} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] whitespace-nowrap">
                            {ww}
                          </span>
                        ))}

                        {/* Fee Tag */}
                        {item.feeType && (
                          <span className={`px-1.5 py-0.5 border rounded text-[10px] whitespace-nowrap ${
                            item.feeType === 'none' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {item.feeType === 'monthly' ? 'จ่ายรายเดือน' : item.feeType === 'yearly' ? 'จ่ายรายปี' : 'ไม่จ่ายค่าขยะ'}
                          </span>
                        )}

                        {/* Health Tags */}
                        {item.healthChildren > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] whitespace-nowrap">มีเด็ก</span>}
                        {item.healthPregnant > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] whitespace-nowrap">มีหญิงตั้งครรภ์</span>}
                        {(item.healthElderlySocial > 0 || item.healthElderlyHome > 0 || item.healthElderlyBedridden > 0) && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] whitespace-nowrap">มีผู้สูงอายุ</span>
                        )}
                        {item.healthDisabled > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] whitespace-nowrap">มีผู้พิการ</span>}
                        
                        {/* Pet Tag */}
                        {item.hasPets === 'yes' && (
                          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[10px] whitespace-nowrap">มีสัตว์เลี้ยง</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" title="ดูข้อมูล">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="แก้ไข">
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
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => setDisplayCount(prev => prev + 20)}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
            >
              <Plus size={16} />
              แสดงเพิ่มเติม
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
