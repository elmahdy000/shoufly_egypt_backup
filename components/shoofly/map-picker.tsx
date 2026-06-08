'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, CLEAN_MAP_STYLE, MAP_MARKERS } from '@/lib/google-maps-loader';
import { Activity, AlertTriangle } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

export default function MapPickerComponent({ 
  initialLat, 
  initialLng, 
  onLocationChange 
}: { 
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  useEffect(() => {
    onLocationChange(position.lat, position.lng);
  }, [position, onLocationChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPosition({ lat, lng });
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  // Update position if initial coordinates change externally
  useEffect(() => {
    setPosition({ lat: initialLat, lng: initialLng });
  }, [initialLat, initialLng]);

  if (loadError) {
    return (
      <div className="h-full w-full rounded-2xl flex flex-col items-center justify-center bg-rose-50 border border-rose-200 text-rose-500 gap-2 p-4 text-center">
        <AlertTriangle size={32} />
        <span className="font-bold text-sm">فشل تحميل الخرائط. يرجى المحاولة لاحقاً.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full rounded-2xl flex flex-col items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 gap-3">
        <Activity size={28} className="animate-spin text-primary" />
        <span className="font-bold text-xs">جاري تحميل الخريطة...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border-0 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position}
        zoom={14}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: CLEAN_MAP_STYLE,
        }}
      >
        <Marker 
          position={position}
          draggable={true}
          icon={MAP_MARKERS.SELECTED(isLoaded)}
          onDragEnd={(e) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setPosition({ lat, lng });
              onLocationChange(lat, lng);
            }
          }}
        />
      </GoogleMap>
    </div>
  );
}
