import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Database, 
  BarChart3, 
  Menu, 
  X,
  Settings,
  LogOut,
  Map as MapIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'stats', label: 'สถิติ', icon: BarChart3 },
    { id: 'add', label: 'เพิ่มข้อมูล', icon: PlusCircle },
    { id: 'data', label: 'ข้อมูล', icon: Database },
    { id: 'map', label: 'แผนที่', icon: MapIcon },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg text-cyan-600"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 leading-tight">ระบบบันทึกข้อมูล</h1>
                <p className="text-xs text-slate-500 font-medium">เดินสำรวจข้อมูล</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-cyan-600"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-colors",
                  activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-cyan-500"
                )} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <Settings size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">กองสาธารณสุขฯ</p>
                <p className="text-[10px] text-slate-500">เทศบาลเมืองแม่ฮ่องสอน</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
