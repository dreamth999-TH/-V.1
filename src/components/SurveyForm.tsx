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
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { surveyService, type SurveyData } from '../services/surveyService';

export default function SurveyForm() {
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
      feeType: 'none'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pets"
  });

  const hasPets = watch('hasPets');
  const residentsCount = watch('residentsCount');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setValue('imageFile', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SurveyData) => {
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const result = await surveyService.submitSurvey(data);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'เพิ่มข้อมูลเรียบร้อย',
        timer: 2000,
        showConfirmButton: false
      });
      reset();
      setImagePreview(null);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  const Counter = ({ label, name, icon: Icon }: any) => {
    const value = watch(name) || 0;
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
      <header>
        <h2 className="text-2xl font-bold text-slate-800">แบบฟอร์มบันทึกข้อมูล</h2>
        <p className="text-slate-500">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความถูกต้องของสถิติ</p>
      </header>

      {/* 1. ข้อมูลพื้นฐาน */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
            <User size={20} />
          </div>
          <h3 className="font-bold text-slate-800">1. ข้อมูลพื้นฐาน</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">คำนำหน้า</label>
            <select 
              {...register('prefix', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">เลือกคำนำหน้า</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
              <option value="ไม่ทราบ">ไม่ทราบ</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อ-นามสกุล</label>
            <input 
              {...register('fullName', { required: true })}
              placeholder="กรอกชื่อและนามสกุล"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

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
            <label className="block text-sm font-medium text-slate-700 mb-2">ถนน</label>
            <select 
              {...register('road', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">เลือกถนน</option>
              <option value="ถนนขุนลุมประพาส">ถนนขุนลุมประพาส</option>
              <option value="ถนนสิงหนาทบำรุง">ถนนสิงหนาทบำรุง</option>
              <option value="ถนนผดุงม่วยต่อ">ถนนผดุงม่วยต่อ</option>
              <option value="ถนนปางล้อนิคม">ถนนปางล้อนิคม</option>
              <option value="ถนนอุดมชาวนิเทศ">ถนนอุดมชาวนิเทศ</option>
              <option value="ถนนนิเวศพิศาล">ถนนนิเวศพิศาล</option>
              <option value="ถนนชำนาญสถิตย์">ถนนชำนาญสถิตย์</option>
              <option value="ถนนประดิษฐ์จองคำ">ถนนประดิษฐ์จองคำ</option>
              <option value="ถนนราชธรรมพิทักษ์">ถนนราชธรรมพิทักษ์</option>
              <option value="ถนนมรรคสันติ">ถนนมรรคสันติ</option>
              <option value="ถนนศิริมงคล">ถนนศิริมงคล</option>
              <option value="ถนนประชาชนอุทิศ">ถนนประชาชนอุทิศ</option>
              <option value="ถนนพาณิชย์วัฒนา">ถนนพาณิชย์วัฒนา</option>
              <option value="ถนนประชาเสกสรร">ถนนประชาเสกสรร</option>
              <option value="ถนนสัมพันธ์เจริญเมือง">ถนนสัมพันธ์เจริญเมือง</option>
              <option value="ถนนรุ่งเรืองการค้า">ถนนรุ่งเรืองการค้า</option>
              <option value="ถนนนาวาคชสาร">ถนนนาวาคชสาร</option>
              <option value="ถนนบริบาลเมืองสุข">ถนนบริบาลเมืองสุข</option>
            </select>
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทรศัพท์</label>
            <input 
              {...register('phone')}
              placeholder="08X-XXX-XXXX"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทที่อยู่</label>
            <select 
              {...register('housingType', { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            >
              <option value="บ้าน">บ้าน</option>
              <option value="ร้าน">ร้าน</option>
              <option value="บ้านว่าง/ร้าง">บ้านว่าง/ร้าง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
        </div>

        {watch('housingType') === 'ร้าน' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อร้าน</label>
            <input 
              {...register('shopName', { required: watch('housingType') === 'ร้าน' })}
              placeholder="กรอกชื่อร้าน"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>
        )}

        <Counter label="จำนวนผู้อยู่อาศัย" name="residentsCount" icon={Users} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">รูปภาพบ้านเรือน</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-cyan-500 transition-colors bg-slate-50/50">
            {imagePreview ? (
              <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-full shadow-md text-cyan-500">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัพโหลดรูปภาพ</p>
                  <p className="text-xs text-slate-400">รองรับไฟล์ JPG, PNG</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* 2. การรักษาสิ่งแวดล้อม */}
      {watch('housingType') !== 'บ้านว่าง/ร้าง' && (
        <>
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold text-slate-800">2. การรักษาสิ่งแวดล้อม</h3>
            </div>

            {/* Waste Management */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4">การจัดการขยะในครัวเรือน (เลือกได้มากกว่า 1)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'ถุงเขียว(รายเก่า)', 'ถุงเขียว(รายใหม่)', 
                  'ถังขยะเปียก(รายเก่า)', 'ถังขยะเปียก(รายใหม่)',
                  'มีการคัดแยกขยะอันต', 'มีการคัดแยกขยะรีไซเคิล',
                  'นำเศษอาหารไปเลี้ยงสัตว์', 'ทำปุ๋ย', 'อื่นๆ'
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
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4">การจัดการน้ำเสีย (เลือกได้มากกว่า 1)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'แม่น้ำ', 'ท่อ/ทางระบายน้ำสาธารณะ', 
                  'พื้นที่ส่วนบุคคล', 'มีถังดักไขมัน',
                  'มีบ่อบำบัดน้ำเสีย', 'ปล่อยลงบ่อเกรอะ'
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
            </div>
          </section>

          {/* 3. การคัดกรองสุขภาพ */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <HeartPulse size={20} />
              </div>
              <h3 className="font-bold text-slate-800">3. การคัดกรองสุขภาพ</h3>
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

          {/* 4. ทะเบียนสัตว์เลี้ยง */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Dog size={20} />
              </div>
              <h3 className="font-bold text-slate-800">4. ทะเบียนสัตว์เลี้ยง</h3>
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
          บันทึกข้อมูล
        </button>
      </div>
    </form>
  );
}
