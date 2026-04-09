import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type SurveyData } from '../services/surveyService';
import { Home, User, Phone, MapPin, Info, Layers } from 'lucide-react';

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

interface MapComponentProps {
  data: SurveyData[];
  onMarkerClick?: (survey: SurveyData) => void;
}

// Component to center map on data
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const getHousingColor = (type: string) => {
  if (type === 'บ้าน' || type === 'บ้านเช่า') return '#6366f1'; // Indigo
  if (type === 'ร้านอาหาร' || type === 'ร้านค้า') return '#f59e0b'; // Amber
  if (type === 'บ้านว่าง' || type === 'บ้านร้าง') return '#94a3b8'; // Slate/Gray
  if (type === 'สำนักงาน') return '#06b6d4'; // Cyan
  if (type === 'อื่นๆ') return '#8b5cf6'; // Violet
  return '#94a3b8'; // Default Gray
};

const createCustomIcon = (color: string) => {
  const svgIcon = `
    <div style="position: relative;">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
        <path d="M16 31C16 31 28 21 28 13C28 6.37258 22.6274 1 16 1C9.37258 1 4 6.37258 4 13C4 21 16 31 16 31Z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="13" r="5" fill="white"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: 'custom-marker',
    html: svgIcon,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function MapComponent({ data, onMarkerClick }: MapComponentProps) {
  // Filter data with valid coordinates
  const validData = data.filter(item => 
    item.latitude !== undefined && 
    item.longitude !== undefined && 
    !isNaN(Number(item.latitude)) && 
    !isNaN(Number(item.longitude))
  );

  // Default center (Mae Hong Son area if no data)
  const defaultCenter: [number, number] = [19.3012, 97.9612];
  const center = validData.length > 0 
    ? [Number(validData[0].latitude), Number(validData[0].longitude)] as [number, number]
    : defaultCenter;

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer 
        center={center} 
        zoom={17} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="แผนที่ถนน (Street)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="แผนที่ดาวเทียม (Satellite)">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <ScaleControl position="bottomleft" />
        
        {validData.map((item) => (
          <Marker 
            key={item.timestamp} 
            position={[Number(item.latitude), Number(item.longitude)]}
            icon={createCustomIcon(getHousingColor(item.housingType || ''))}
            eventHandlers={{
              click: () => onMarkerClick?.(item),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-bottom border-slate-100">
                  <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg">
                    <Home size={16} />
                  </div>
                  <h4 className="font-bold text-slate-800 m-0">บ้านเลขที่ {item.houseNo}</h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} className="text-slate-400" />
                    <span>{item.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span>บ้านเลขที่ {item.houseNo} {item.soi ? `ซอย ${item.soi}` : ''} {item.road && !item.road.startsWith('ถนน') ? `ถนน${item.road}` : item.road}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info size={14} className="text-slate-400" />
                    <span>ชุมชน{item.community}</span>
                  </div>
                  {item.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      <span>{item.phone}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => onMarkerClick?.(item)}
                  className="w-full mt-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Info size={14} />
                  ดูรายละเอียดเพิ่มเติม
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {validData.length > 0 && <ChangeView center={center} />}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 z-[1000] space-y-3">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">คำอธิบายสัญลักษณ์</h5>
        <div className="space-y-2">
          {[
            { label: 'บ้าน/บ้านเช่า', color: '#6366f1' },
            { label: 'ร้านอาหาร/ร้านค้า', color: '#f59e0b' },
            { label: 'บ้านว่าง/บ้านร้าง', color: '#94a3b8' },
            { label: 'สำนักงาน', color: '#06b6d4' },
            { label: 'อื่นๆ', color: '#8b5cf6' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-bold text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {validData.length === 0 && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center z-[1000]">
          <div className="p-4 bg-white rounded-full shadow-md text-slate-400 mb-4">
            <MapPin size={48} />
          </div>
          <p className="text-slate-600 font-medium">ไม่พบข้อมูลพิกัดในระบบ</p>
          <p className="text-slate-400 text-sm">กรุณาเพิ่มข้อมูลพิกัดในแบบสำรวจ</p>
        </div>
      )}
    </div>
  );
}
