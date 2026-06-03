"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, DEFAULT_CENTER, CLEAN_MAP_STYLE, MAP_MARKERS } from '@/lib/google-maps-loader';
import { MapPin } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

interface MapObject {
  id: string;
  type: 'CLIENT' | 'VENDOR' | 'RIDER';
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: string;
}

export function OperationsMap({ data, selectedOrder }: { data: MapObject[]; selectedOrder?: any }) {
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);
  const [selected, setSelected] = useState<MapObject | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Refit bounds whenever data or selectedOrder changes
  useEffect(() => {
    if (!mapRef.current) return;
    const pointsToFit: { lat: number; lng: number }[] = [];

    if (selectedOrder) {
      if (selectedOrder.vendorLat && selectedOrder.vendorLng) {
        pointsToFit.push({ lat: selectedOrder.vendorLat, lng: selectedOrder.vendorLng });
      }
      if (selectedOrder.riderLat && selectedOrder.riderLng) {
        pointsToFit.push({ lat: selectedOrder.riderLat, lng: selectedOrder.riderLng });
      }
      if (selectedOrder.clientLat && selectedOrder.clientLng) {
        pointsToFit.push({ lat: selectedOrder.clientLat, lng: selectedOrder.clientLng });
      }
    }

    if (pointsToFit.length === 0 && data.length > 0) {
      data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng)).forEach(obj => {
        pointsToFit.push({ lat: obj.lat, lng: obj.lng });
      });
    }

    if (pointsToFit.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      pointsToFit.forEach(pt => bounds.extend(pt));
      mapRef.current.fitBounds(bounds);
    }
  }, [data, selectedOrder]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (data.length > 0) {
      const validPoints = data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng));
      if (validPoints.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        validPoints.forEach(obj => bounds.extend({ lat: obj.lat, lng: obj.lng }));
        map.fitBounds(bounds);
      }
    }
  }, [data]);

  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const icons = useMemo(() => {
    if (!isLoaded || !window.google) return null;
    return {
      CLIENT: MAP_MARKERS.CLIENT(isLoaded),
      VENDOR: MAP_MARKERS.VENDOR(isLoaded),
      RIDER: MAP_MARKERS.RIDER(isLoaded),
    };
  }, [isLoaded]);

  const getIcon = (type: string) => {
    if (!icons) return undefined;
    return icons[type as keyof typeof icons] || undefined;
  };

  const polylinePath = useMemo(() => {
    if (!selectedOrder) return null;
    const path = [];
    if (selectedOrder.vendorLat && selectedOrder.vendorLng) {
      path.push({ lat: Number(selectedOrder.vendorLat), lng: Number(selectedOrder.vendorLng) });
    }
    if (selectedOrder.riderLat && selectedOrder.riderLng) {
      path.push({ lat: Number(selectedOrder.riderLat), lng: Number(selectedOrder.riderLng) });
    }
    if (selectedOrder.clientLat && selectedOrder.clientLng) {
      path.push({ lat: Number(selectedOrder.clientLat), lng: Number(selectedOrder.clientLng) });
    }
    return path.length >= 2 ? path : null;
  }, [selectedOrder]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-rose-50 rounded-2xl">
        <div className="flex flex-col items-center gap-3 text-rose-400">
          <MapPin size={32} />
          <p className="text-xs font-bold">فشل تحميل الخريطة — تأكد من مفتاح Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <MapPin size={32} className="animate-pulse" />
          <p className="text-xs font-bold">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={DEFAULT_CENTER}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{ styles: CLEAN_MAP_STYLE }}
    >
      {data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng)).map((obj) => (
        <Marker
          key={obj.id}
          position={{ lat: obj.lat, lng: obj.lng }}
          onClick={() => setSelected(obj)}
          icon={getIcon(obj.type)}
        />
      ))}

      {polylinePath && (
        <Polyline
          path={polylinePath}
          options={{
            strokeColor: "#1e3a8a", // Navy Blue path line
            strokeOpacity: 0.8,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      )}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="p-2 dir-rtl text-right min-w-[150px]">
            <h4 className="font-bold text-slate-900 text-sm mb-1">{selected.title}</h4>
            <p className="text-[10px] text-slate-500 mb-2">{selected.subtitle}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                selected.type === 'CLIENT' ? 'bg-blue-100 text-blue-600' :
                selected.type === 'VENDOR' ? 'bg-orange-100 text-orange-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {selected.type === 'CLIENT' ? 'طلب عميل' : selected.type === 'VENDOR' ? 'مورد' : 'مندوب'}
              </span>
              {selected.status && (
                <span className="text-[9px] font-bold text-slate-400">{selected.status}</span>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
