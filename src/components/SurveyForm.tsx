import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  User, 
  MapPin, 
  Phone, 
  Users, 
  Home, 
  Camera, 
  Trash2, 
  Droplets, 
  Wallet, 
  HeartPulse, 
  Dog,
  Plus,
  Minus,
  Save,
  X,
  Navigation,
  Upload,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { surveyService, type SurveyData } from '../services/surveyService';

// Fix for default marker icon in Leaflet + React
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationMarker({ lat, lng, onChange }: { lat: number | undefined, lng: number | undefined, onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  React.useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return lat && lng ? (
    <Marker 
      position={[lat, lng]} 
      draggable={true} 
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        }
      }} 
    />
  ) : null;
}

export default function SurveyForm({ editData, onComplete }: { editData?: any, onComplete?: () => void }) {
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<SurveyData>({
    defaultValues: {
      residentsCount: 1,
      healthChildren: 0,
      healthPregnant: 0,
      healthElderlySocial: 0,
      healthElderlyHome: 0,
      healthElderlyBedridden: 0,
      healthDisabled: 0,
      hasPets: 'no',
      pets: [],
      wasteManagement: [],
      wastewaterManagement: [],
      feeType: 'none',
      responsiblePerson: 'System'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pets"
  });

  const housingType = watch('housingType');
  const isVacantOrAbandoned = housingType === 'บ้านว่าง' || housingType === 'บ้านร้าง';
  const hasPets = watch('hasPets');
  const residentsCount = watch('residentsCount');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [wastewaterImagePreview, setWastewaterImagePreview] = React.useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = React.useState(false);
  const [isWastewaterImageLoading, setIsWastewaterImageLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);

  // Handle Edit Data
  React.useEffect(() => {
    if (editData) {
      reset(editData);
      if (editData.imageUrl) {
        setImagePreview(editData.imageUrl);
      }
      if (editData.wastewaterImageUrl) {
        setWastewaterImagePreview(editData.wastewaterImageUrl);
      }
    }
  }, [editData, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setValue('imageFile', reader.result as string);
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWastewaterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsWastewaterImageLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setWastewaterImagePreview(reader.result as string);
        setValue('wastewaterImageFile', reader.result as string);
        setIsWastewaterImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setIsLocating(false);
        Swal.fire({
          icon: 'success',
          title: 'ระบุตำแหน่งเรียบร้อย',
          showConfirmButton: false,
          timer: 1500
        });
      },
      (error) => {
        setIsLocating(false);
        console.error('Geolocation error:', error);
        Swal.fire('Error', 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบการอนุญาตเข้าถึงตำแหน่ง', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  const onSubmit = async (formData: SurveyData) => {
    // If vacant or abandoned, set default values for hidden fields
    const data = { ...formData };
    if (isVacantOrAbandoned) {
      data.fullName = housingType || 'บ้านว่าง/ร้าง';
      data.respondentType = 'ไม่มีผู้อยู่อาศัย';
      data.residentsCount = 0;
      data.phone = '-';
      data.wasteManagement = [];
      data.wastewaterManagement = [];
      data.hasPets = 'no';
      data.pets = [];
      data.healthChildren = 0;
      data.healthPregnant = 0;
      data.healthElderlySocial = 0;
      data.healthElderlyHome = 0;
      data.healthElderlyBedridden = 0;
      data.healthDisabled = 0;
      data.feeType = 'none';
    }

    // Check for duplicates if not in edit mode
    if (!editData) {
      Swal.fire({
        title: 'กำลังตรวจสอบข้อมูลซ้ำ...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        // Force refresh to get the most accurate duplicate check
        const existingSurveys = await surveyService.getSurveys(true);
        
        const normalize = (val: any) => {
          if (val === undefined || val === null) return "";
          return val.toString()
            .trim()
            .replace(/^ถนน/, "") // Remove "ถนน" prefix
            .replace(/\s+/g, ""); // Remove all whitespace
        };

        const targetHouseNo = normalize(data.houseNo);
        const targetRoad = normalize(data.road);
        const targetCommunity = normalize(data.community);

        const duplicate = existingSurveys.find(s => 
          normalize(s.houseNo) === targetHouseNo && 
          normalize(s.road) === targetRoad && 
          normalize(s.community) === targetCommunity
        );

        if (duplicate) {
          const result = await Swal.fire({
            title: 'พบข้อมูลซ้ำ!',
            html: `บ้านเลขที่ <b>${data.houseNo}</b> ถนน<b>${data.road}</b> ชุมชน<b>${data.community}</b> มีข้อมูลอยู่ในระบบแล้ว<br/><br/>คุณต้องการดำเนินการอย่างไร?`,
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'แทนที่ข้อมูลเดิม',
            denyButtonText: 'บันทึกซ้ำ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#0891b2',
            denyButtonColor: '#6366f1',
            cancelButtonColor: '#94a3b8',
          });

          if (result.isConfirmed) {
            // Replace existing data
            await performSave(data, duplicate.id);
            return;
          } else if (result.isDenied) {
            // Save as duplicate (new record)
            await performSave(data);
            return;
          } else {
            // Cancel
            return;
          }
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        // Continue to save if check fails
      }
    }

    await performSave(data, editData?.id);
  };

  const performSave = async (data: SurveyData, id?: string) => {
    Swal.fire({
      title: id ? 'กำลังอัปเดตข้อมูล...' : 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const result = id 
      ? await surveyService.updateSurvey(id, data)
      : await surveyService.submitSurvey(data);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: id ? 'อัปเดตข้อมูลเรียบร้อย' : 'เพิ่มข้อมูลเรียบร้อย',
        timer: 2000,
        showConfirmButton: false
      });
      
      if (editData && onComplete) {
        onComplete();
      } else {
        reset();
        setImagePreview(null);
        setWastewaterImagePreview(null);
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  const Counter = ({ label, name, icon: Icon }: any) => {
    const value = Number(watch(name)) || 0;
    return (
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
            <Icon size={18} />
          </div>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setValue(name, Math.max(0, value - 1))}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-bold text-slate-800">{value}</span>
          <button 
            type="button"
            onClick={() => setValue(name, value + 1)}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {editData ? 'แก้ไขข้อมูลการสำรวจ' : 'แบบฟอร์มบันทึกข้อมูล'}
          </h2>
          <p className="text-slate-500">
            {editData ? `กำลังแก้ไขข้อมูลของ ${editData.fullName}` : 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความถูกต้องของสถิติ'}
          </p>
        </div>
        {editData && (
          <button 
            type="button"
            onClick={onComplete}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <X size={18} />
            ยกเลิกการแก้ไข
          </button>
        )}
      </header>

      {/* 1. ข้อมูลพื้นฐาน */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
            <User size={20} />
          </div>
          <h3 className="font-bold text-slate-800">1. ข้อมูลพื้นฐาน</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ชุมชน</label>
            <select 
              {...register('community', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">เลือกชุมชน</option>
              <option value="ปางล้อ">ปางล้อ</option>
              <option value="ดอนเจดีย์">ดอนเจดีย์</option>
              <option value="ตะวันออก">ตะวันออก</option>
              <option value="กลางเวียง">กลางเวียง</option>
              <option value="กาดเก่า">กาดเก่า</option>
              <option value="หนองจองคำ">หนองจองคำ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทที่อยู่</label>
            <select 
              {...register('housingType', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">เลือกประเภทที่อยู่</option>
              <option value="บ้าน">บ้าน</option>
              <option value="บ้านเช่า">บ้านเช่า</option>
              <option value="บ้านว่าง">บ้านว่าง</option>
              <option value="บ้านร้าง">บ้านร้าง</option>
              <option value="ร้านอาหาร">ร้านอาหาร</option>
              <option value="ร้านค้า">ร้านค้า</option>
              <option value="สำนักงาน">สำนักงาน</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
        </div>

        {watch('housingType') === 'อื่นๆ' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium text-slate-700 mb-2">ระบุประเภทที่อยู่อื่นๆ</label>
            <input 
              {...register('housingTypeOther', { required: watch('housingType') === 'อื่นๆ' })}
              placeholder="ระบุประเภทที่อยู่"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>
        )}

        {['ร้านอาหาร', 'ร้านค้า'].includes(watch('housingType') || '') && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อร้าน</label>
            <input 
              {...register('shopName', { required: ['ร้านอาหาร', 'ร้านค้า'].includes(watch('housingType') || '') })}
              placeholder="กรอกชื่อร้าน"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">บ้านเลขที่</label>
            <input 
              {...register('houseNo', { required: true })}
              placeholder="เช่น 123/4"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ซอย</label>
            <input 
              {...register('soi')}
              placeholder="เช่น ซอย 1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ถนน</label>
            <select 
              {...register('road', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">เลือกถนน</option>
              <option value="ขุนลุมประพาส">ขุนลุมประพาส</option>
              <option value="สิงหนาทบำรุง">สิงหนาทบำรุง</option>
              <option value="ผดุงม่วยต่อ">ผดุงม่วยต่อ</option>
              <option value="ปางล้อนิคม">ปางล้อนิคม</option>
              <option value="อุดมชาวนิเทศ">อุดมชาวนิเทศ</option>
              <option value="นิเวศพิศาล">นิเวศพิศาล</option>
              <option value="ชำนาญสถิตย์">ชำนาญสถิตย์</option>
              <option value="ประดิษฐ์จองคำ">ประดิษฐ์จองคำ</option>
              <option value="ราชธรรมพิทักษ์">ราชธรรมพิทักษ์</option>
              <option value="มรรคสันติ">มรรคสันติ</option>
              <option value="ศิริมงคล">ศิริมงคล</option>
              <option value="ประชาชนอุทิศ">ประชาชนอุทิศ</option>
              <option value="พาณิชย์วัฒนา">พาณิชย์วัฒนา</option>
              <option value="ประชาเสกสรร">ประชาเสกสรร</option>
              <option value="สัมพันธ์เจริญเมือง">สัมพันธ์เจริญเมือง</option>
              <option value="รุ่งเรืองการค้า">รุ่งเรืองการค้า</option>
              <option value="นาวาคชสาร">นาวาคชสาร</option>
              <option value="บริบาลเมืองสุข">บริบาลเมืองสุข</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">รูปภาพบ้านเรือน</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 md:p-8 hover:border-cyan-500 transition-colors bg-slate-50/50 min-h-[200px]">
            {isImageLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={40} className="text-cyan-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">กำลังประมวลผลรูปภาพ...</p>
              </div>
            ) : imagePreview ? (
              <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-lg bg-slate-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setValue('imageFile', undefined);
                  }}
                  className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3 w-full py-8">
                <div className="p-4 bg-white rounded-full shadow-md text-cyan-500">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัพโหลดรูปภาพบ้านเรือน</p>
                  <p className="text-xs text-slate-400">รองรับไฟล์ JPG, PNG</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {!isVacantOrAbandoned && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden space-y-6"
          >
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อ-นามสกุล</label>
                <input 
                  {...register('fullName', { required: !isVacantOrAbandoned })}
                  placeholder="กรอกชื่อและนามสกุล"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทผู้ให้ข้อมูล</label>
                <select 
                  {...register('respondentType', { required: !isVacantOrAbandoned })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">เลือกประเภทผู้ให้ข้อมูล</option>
                  <option value="เจ้าของบ้าน">เจ้าของบ้าน</option>
                  <option value="ผู้อยู่อาศัย">ผู้อยู่อาศัย</option>
                  <option value="ผู้เช่า">ผู้เช่า</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                <input 
                  {...register('phone')}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <Counter label="จำนวนผู้อยู่อาศัย" name="residentsCount" icon={Users} />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ผู้รับผิดชอบการสำรวจ</label>
              <input 
                {...register('responsiblePerson', { required: true })}
                placeholder="ระบุชื่อผู้สำรวจ"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </motion.div>
        )}
      </section>
      
      {/* 2. ตำแหน่งที่ตั้ง */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <h3 className="font-bold text-slate-800">2. ตำแหน่งที่ตั้ง</h3>
          </div>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              isLocating 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
            }`}
          >
            <Navigation size={18} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'กำลังระบุตำแหน่ง...' : 'ระบุตำแหน่งปัจจุบัน'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ละติจูด (Latitude)</label>
            <div className="relative">
              <input 
                {...register('latitude')}
                type="number"
                step="any"
                placeholder="เช่น 19.301234"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ลองจิจูด (Longitude)</label>
            <div className="flex gap-2">
              <input 
                {...register('longitude')}
                type="number"
                step="any"
                placeholder="เช่น 97.961234"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className={`p-3 rounded-xl transition-all border ${
                  isLocating 
                    ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                }`}
                title="ดึงพิกัดปัจจุบันอีกครั้ง"
              >
                <RefreshCw size={20} className={isLocating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">คลิกที่แผนที่เพื่อมาร์คจุด หรือลากมาร์คเกอร์เพื่อปรับตำแหน่ง</label>
          <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <MapContainer 
              center={[Number(watch('latitude')) || 19.3012, Number(watch('longitude')) || 97.9612]} 
              zoom={17} 
              style={{ height: '100%', width: '100%' }}
            >
              <LayersControl position="topleft">
                <LayersControl.BaseLayer checked name="Street">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <ScaleControl position="bottomleft" />
              <LocationMarker 
                lat={Number(watch('latitude')) || undefined} 
                lng={Number(watch('longitude')) || undefined} 
                onChange={(lat, lng) => {
                  setValue('latitude', lat);
                  setValue('longitude', lng);
                }} 
              />
            </MapContainer>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">
          * แนะนำให้กดปุ่ม "ระบุตำแหน่งปัจจุบัน" ขณะอยู่ที่บ้านที่กำลังสำรวจเพื่อให้ได้พิกัดที่แม่นยำ หรือคลิกเลือกตำแหน่งในแผนที่ด้านบน
        </p>
      </section>

      {/* 3. การรักษาสิ่งแวดล้อม */}
      {!isVacantOrAbandoned && (
        <>
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold text-slate-800">3. การรักษาสิ่งแวดล้อม</h3>
            </div>

            {/* Waste Management */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4">การจัดการขยะในครัวเรือน (เลือกได้มากกว่า 1)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'ไม่มีการคัดแยกขยะ',
                  'ถุงเขียว(รายเก่า)', 'ถุงเขียว(รายใหม่)', 
                  'ถังขยะเปียก(รายเก่า)', 'ถังขยะเปียก(รายใหม่)',
                  'นำเศษอาหารไปเลี้ยงสัตว์', 'ทำปุ๋ย',
                  'คัดแยกขยะอันตราย', 'คัดแยกขยะรีไซเคิล',
                  'อื่นๆ'
                ].map((option) => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      value={option}
                      {...register('wasteManagement')}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" 
                    />
                    <span className="text-sm text-slate-600">{option}</span>
                  </label>
                ))}
              </div>
              {watch('wasteManagement')?.includes('อื่นๆ') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <input 
                    {...register('wasteManagementOther')}
                    placeholder="ระบุการจัดการขยะอื่นๆ"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </motion.div>
              )}
            </div>

            {/* Fee Payment */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-slate-400" size={20} />
                <label className="text-sm font-bold text-slate-700">การจ่ายค่าธรรมเนียมขยะ</label>
              </div>
              <div className="flex flex-wrap gap-4">
                {['monthly', 'yearly', 'none'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value={type}
                      {...register('feeType')}
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500" 
                    />
                    <span className="text-sm text-slate-600">
                      {type === 'monthly' ? 'จ่ายรายเดือน' : type === 'yearly' ? 'จ่ายรายปี' : 'ไม่มีการจ่าย'}
                    </span>
                  </label>
                ))}
              </div>
              {watch('feeType') !== 'none' ? (
                <input 
                  type="number"
                  {...register('feeAmount')}
                  placeholder="จำนวนเงินที่จ่าย (บาท)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <textarea 
                  {...register('feeReason')}
                  placeholder="ระบุเหตุผลที่ไม่มีการจ่าย"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-cyan-500 h-24 resize-none"
                />
              )}
            </div>

            {/* Wastewater */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">การจัดการน้ำเสีย (เลือกได้มากกว่า 1)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'ปล่อยน้ำลงท่อ/ทางระบายน้ำสาธารณะ', 'ปล่อยน้ำลงแม่น้ำ', 
                    'ปล่อยน้ำลงพื้นที่ส่วนตัว', 'ปล่อยน้ำลงบ่อเกรอะ',
                    'มีถัง/บ่อดักไขมัน', 'อื่นๆ'
                  ].map((option) => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        value={option}
                        {...register('wastewaterManagement')}
                        className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500" 
                      />
                      <span className="text-sm text-slate-600">{option}</span>
                    </label>
                  ))}
                </div>
                {watch('wastewaterManagement')?.includes('อื่นๆ') && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <input 
                      {...register('wastewaterManagementOther')}
                      placeholder="ระบุการจัดการน้ำเสียอื่นๆ"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </motion.div>
                )}
              </div>

              {/* Wastewater Image Upload */}
              {(watch('wastewaterManagement') || []).some(opt => ['มีถัง/บ่อดักไขมัน', 'มีถังดักไขมัน', 'มีบ่อบำบัดน้ำเสีย'].includes(opt)) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-slate-700">รูปภาพการจัดการน้ำเสีย (ถังดักไขมัน/บ่อบำบัด)</label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 md:p-8 hover:border-blue-500 transition-colors bg-slate-50/50 min-h-[200px]">
                    {isWastewaterImageLoading ? (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 size={40} className="text-blue-500 animate-spin" />
                        <p className="text-sm font-medium text-slate-500">กำลังประมวลผลรูปภาพ...</p>
                      </div>
                    ) : wastewaterImagePreview ? (
                      <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-lg bg-slate-100">
                        <img src={wastewaterImagePreview} alt="Wastewater Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => {
                            setWastewaterImagePreview(null);
                            setValue('wastewaterImageFile', undefined);
                          }}
                          className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 w-full py-8">
                        <div className="p-4 bg-white rounded-full shadow-md text-blue-500">
                          <Droplets size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัพโหลดรูปภาพการจัดการน้ำเสีย</p>
                          <p className="text-xs text-slate-400">รองรับไฟล์ JPG, PNG</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleWastewaterImageChange} />
                      </label>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* 4. ประชากรกลุ่มเปราะบาง */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <HeartPulse size={20} />
              </div>
              <h3 className="font-bold text-slate-800">4. ประชากรกลุ่มเปราะบาง</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Counter label="เด็ก (อายุ 0 - 5 ปี)" name="healthChildren" icon={Users} />
              <Counter label="หญิงตั้งครรภ์" name="healthPregnant" icon={Users} />
              <Counter label="ผู้สูงอายุ (ติดสังคม)" name="healthElderlySocial" icon={Users} />
              <Counter label="ผู้สูงอายุ (ติดบ้าน)" name="healthElderlyHome" icon={Users} />
              <Counter label="ผู้สูงอายุ (ติดเตียง)" name="healthElderlyBedridden" icon={Users} />
              <Counter label="ผู้พิการหรือมีบุตรพิการ" name="healthDisabled" icon={Users} />
            </div>

            {watch('healthDisabled') > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">รายละเอียดอาการของผู้พิการ</label>
                <textarea 
                  {...register('disabledDetails')}
                  placeholder="ระบุรายละเอียดอาการของแต่ละคน"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none"
                />
              </div>
            )}
          </section>

          {/* 5. ทะเบียนสัตว์เลี้ยง */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Dog size={20} />
              </div>
              <h3 className="font-bold text-slate-800">5. ทะเบียนสัตว์เลี้ยง</h3>
            </div>

            <div className="flex gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-700">มีสัตว์เลี้ยงหรือไม่?</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="yes" {...register('hasPets')} className="text-orange-500" />
                  <span className="text-sm">มี</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="no" {...register('hasPets')} className="text-orange-500" />
                  <span className="text-sm">ไม่มี</span>
                </label>
              </div>
            </div>

            {hasPets === 'yes' && (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 relative group">
                    <button 
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-200 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ประเภทสัตว์</label>
                        <select 
                          {...register(`pets.${index}.type` as const)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="dog">สุนัข</option>
                          <option value="cat">แมว</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                      </div>
                      
                      {watch(`pets.${index}.type`) === 'other' ? (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ระบุชนิดสัตว์</label>
                            <input 
                              type="text"
                              {...register(`pets.${index}.typeOther` as const)}
                              placeholder="เช่น นก, ไก่"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">จำนวน</label>
                            <input 
                              type="number"
                              {...register(`pets.${index}.count` as const)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">เพศ</label>
                            <select 
                              {...register(`pets.${index}.gender` as const)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="male">ผู้</option>
                              <option value="female">เมีย</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">อายุ (ปี)</label>
                              <input 
                                type="number"
                                {...register(`pets.${index}.ageYear` as const)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">อายุ (เดือน)</label>
                              <input 
                                type="number"
                                {...register(`pets.${index}.ageMonth` as const)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {watch(`pets.${index}.type`) !== 'other' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ฉีดวัคซีนพิษสุนัขบ้า:</span>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" value="yes" {...register(`pets.${index}.rabiesVaccine` as const)} />
                              <span className="text-xs">เคย</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" value="no" {...register(`pets.${index}.rabiesVaccine` as const)} />
                              <span className="text-xs">ไม่เคย</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ทำหมัน:</span>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" value="yes" {...register(`pets.${index}.sterilized` as const)} />
                              <span className="text-xs">เคย</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" value="no" {...register(`pets.${index}.sterilized` as const)} />
                              <span className="text-xs">ไม่เคย</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => append({ type: 'dog', gender: 'male', ageYear: 0, ageMonth: 0, rabiesVaccine: 'no', sterilized: 'no' })}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus size={20} />
                  เพิ่มข้อมูลสัตว์เลี้ยง
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <button 
          type="submit"
          className="btn-gradient px-12 py-4 rounded-2xl flex items-center gap-3 text-lg font-bold shadow-xl hover:shadow-cyan-500/20"
        >
          <Save size={24} />
          {editData ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
        </button>
      </div>
    </form>
  );
}
