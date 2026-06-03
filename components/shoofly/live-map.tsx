"use client";

import { useMemo, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, DEFAULT_CENTER, CLEAN_MAP_STYLE, MAP_MARKERS } from '@/lib/google-maps-loader';
import { MapPin } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

interface MapPoint {
  lat: number;
  lng: number;
  title?: string;
  status?: string;
}

export function LiveMap({ points }: { points?: MapPoint[] }) {
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (points && points.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds);
    }
    setMap(map);
  }, [points]);

  const onUnmount = useCallback(() => setMap(null), []);

  const icon = useMemo(() => {
    return MAP_MARKERS.RIDER(isLoaded);
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-rose-50 flex items-center justify-center font-bold text-rose-400 rounded-[2rem]">
        <div className="flex flex-col items-center gap-2">
          <MapPin size={28} />
          <span className="text-xs">فشل تحميل الخريطة</span>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center font-bold text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <MapPin size={28} className="animate-pulse" />
          <span className="text-xs">جاري تحميل الخريطة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={DEFAULT_CENTER}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: CLEAN_MAP_STYLE,
          zoomControl: false,
        }}
      >
        {points?.map((p, i) => (
          <Marker
            key={i}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setSelected(p)}
            icon={icon}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-right font-sans p-1">
              <p className="font-bold text-slate-900">{selected.title}</p>
              <p className="text-xs text-slate-500">{selected.status}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Custom Legend */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl pointer-events-none">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">حالة الأوردرات</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 bg-primary rounded-full" /> قيد التحرك
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> تم التسليم
          </div>
        </div>
      </div>
    </div>
  );
}
