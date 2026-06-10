"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, DEFAULT_CENTER, CLEAN_MAP_STYLE, MAP_MARKERS } from '@/lib/google-maps-loader';
import { MapPin, Plus, Minus, Crosshair, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

function isLoadedState(isLoaded: boolean): boolean {
  return isLoaded && typeof window !== 'undefined' && !!window.google;
}

function MapControlButton({ onClick, icon: Icon, label, active }: {
  onClick: () => void;
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg border shadow-sm transition-all text-[11px] ${
        active
          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      <Icon size={14} />
    </button>
  );
}

export function OperationsMap({ data, selectedOrder }: { data: MapObject[]; selectedOrder?: any }) {
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);
  const [selected, setSelected] = useState<MapObject | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  const loaded = isLoadedState(isLoaded);

  useEffect(() => {
    if (!selectedOrder || typeof window === 'undefined' || !window.google || !window.google.maps) {
      setDirections(null);
      setDirectionsError(null);
      return;
    }

    const riderLat = Number(selectedOrder.riderLat);
    const riderLng = Number(selectedOrder.riderLng);
    const vendorLat = Number(selectedOrder.vendorLat);
    const vendorLng = Number(selectedOrder.vendorLng);
    const clientLat = Number(selectedOrder.clientLat);
    const clientLng = Number(selectedOrder.clientLng);

    if (!isFinite(vendorLat) || !isFinite(vendorLng) || !isFinite(clientLat) || !isFinite(clientLng)) {
      setDirections(null);
      setDirectionsError(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = isFinite(riderLat) && isFinite(riderLng)
      ? { lat: riderLat, lng: riderLng }
      : { lat: vendorLat, lng: vendorLng };

    const destination = { lat: clientLat, lng: clientLng };

    const waypoints: google.maps.DirectionsWaypoint[] = [];
    if (isFinite(riderLat) && isFinite(riderLng)) {
      waypoints.push({
        location: { lat: vendorLat, lng: vendorLng },
        stopover: true,
      });
    }

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setDirectionsError(null);
        } else {
          console.warn(`Directions request failed: ${status}. Using straight-line fallback.`);
          setDirections(null);
          if (status === 'REQUEST_DENIED') {
            setDirectionsError('Google Maps Directions require billing. Showing straight-line routes.');
          } else {
            setDirectionsError(`Routing unavailable (${status}). Showing straight-line routes.`);
          }
        }
      }
    );
  }, [selectedOrder]);

  const fitPoints = useCallback((points: { lat: number; lng: number }[]) => {
    if (!mapRef.current || points.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(pt => bounds.extend(pt));
    mapRef.current.fitBounds(bounds);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const pointsToFit: { lat: number; lng: number }[] = [];

    if (selectedOrder) {
      if (selectedOrder.vendorLat && selectedOrder.vendorLng)
        pointsToFit.push({ lat: selectedOrder.vendorLat, lng: selectedOrder.vendorLng });
      if (selectedOrder.riderLat && selectedOrder.riderLng)
        pointsToFit.push({ lat: selectedOrder.riderLat, lng: selectedOrder.riderLng });
      if (selectedOrder.clientLat && selectedOrder.clientLng)
        pointsToFit.push({ lat: selectedOrder.clientLat, lng: selectedOrder.clientLng });
    }

    if (pointsToFit.length === 0 && data.length > 0) {
      data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng)).forEach(obj =>
        pointsToFit.push({ lat: obj.lat, lng: obj.lng })
      );
    }

    if (pointsToFit.length > 0) fitPoints(pointsToFit);
  }, [data, selectedOrder, fitPoints]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const validPoints = data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng));
    if (validPoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validPoints.forEach(obj => bounds.extend({ lat: obj.lat, lng: obj.lng }));
      map.fitBounds(bounds);
    }
  }, [data]);

  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 12) + 1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 12) - 1);
  }, []);

  const handleResetCenter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(DEFAULT_CENTER);
      mapRef.current.setZoom(12);
    }
  }, []);

  const handleShowAllDrivers = useCallback(() => {
    const driverPoints = data
      .filter(obj => obj.type === 'RIDER' && isFinite(obj.lat) && isFinite(obj.lng))
      .map(obj => ({ lat: obj.lat, lng: obj.lng }));
    if (driverPoints.length > 0) fitPoints(driverPoints);
  }, [data, fitPoints]);

  const handleShowRoute = useCallback(() => {
    if (!selectedOrder) return;
    const routePoints: { lat: number; lng: number }[] = [];
    if (selectedOrder.vendorLat && selectedOrder.vendorLng)
      routePoints.push({ lat: selectedOrder.vendorLat, lng: selectedOrder.vendorLng });
    if (selectedOrder.riderLat && selectedOrder.riderLng)
      routePoints.push({ lat: selectedOrder.riderLat, lng: selectedOrder.riderLng });
    if (selectedOrder.clientLat && selectedOrder.clientLng)
      routePoints.push({ lat: selectedOrder.clientLat, lng: selectedOrder.clientLng });
    if (routePoints.length > 0) fitPoints(routePoints);
  }, [selectedOrder, fitPoints]);

  const getIcon = useCallback((type: string, dimmed?: boolean) => {
    if (!loaded) return undefined;
    const key = type as keyof typeof MAP_MARKERS;
    if (key === 'CLIENT') return MAP_MARKERS.CLIENT(true, dimmed);
    if (key === 'VENDOR') return MAP_MARKERS.VENDOR(true, dimmed);
    if (key === 'RIDER') return MAP_MARKERS.RIDER(true, dimmed);
    return undefined;
  }, [loaded]);

  const polylinePath = useMemo(() => {
    if (!selectedOrder) return null;
    const path: { lat: number; lng: number }[] = [];
    if (selectedOrder.vendorLat && selectedOrder.vendorLng)
      path.push({ lat: Number(selectedOrder.vendorLat), lng: Number(selectedOrder.vendorLng) });
    if (selectedOrder.riderLat && selectedOrder.riderLng)
      path.push({ lat: Number(selectedOrder.riderLat), lng: Number(selectedOrder.riderLng) });
    if (selectedOrder.clientLat && selectedOrder.clientLng)
      path.push({ lat: Number(selectedOrder.clientLat), lng: Number(selectedOrder.clientLng) });
    return path.length >= 2 ? path : null;
  }, [selectedOrder]);

  const selectedRiderPos = useMemo(() => {
    if (!selectedOrder || !selectedOrder.riderLat || !selectedOrder.riderLng) return null;
    return { lat: Number(selectedOrder.riderLat), lng: Number(selectedOrder.riderLng) };
  }, [selectedOrder]);

  const selectedVendorPos = useMemo(() => {
    if (!selectedOrder || !selectedOrder.vendorLat || !selectedOrder.vendorLng) return null;
    return { lat: Number(selectedOrder.vendorLat), lng: Number(selectedOrder.vendorLng) };
  }, [selectedOrder]);

  const selectedClientPos = useMemo(() => {
    if (!selectedOrder || !selectedOrder.clientLat || !selectedOrder.clientLng) return null;
    return { lat: Number(selectedOrder.clientLat), lng: Number(selectedOrder.clientLng) };
  }, [selectedOrder]);

  const hasRoute = !!(polylinePath || (selectedRiderPos && selectedVendorPos));

  const validMarkers = useMemo(() => {
    return data.filter(obj => isFinite(obj.lat) && isFinite(obj.lng));
  }, [data]);

  const hasSelectedOrder = !!selectedOrder;

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-rose-50 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-rose-400">
          <MapPin size={32} />
          <p className="text-xs font-bold">فشل تحميل الخريطة — تأكد من مفتاح Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <MapPin size={32} className="animate-pulse" />
          <p className="text-xs font-bold">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={DEFAULT_CENTER}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: CLEAN_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        }}
      >
        {/* Background markers - dimmed when an order is selected */}
        {validMarkers.map((obj) => (
          <Marker
            key={obj.id}
            position={{ lat: obj.lat, lng: obj.lng }}
            onClick={() => setSelected(obj)}
            icon={getIcon(obj.type, !!hasSelectedOrder)}
            zIndex={1}
          />
        ))}

        {/* Route polyline */}
        {directions ? (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#4f46e5",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        ) : (
          polylinePath && (
            <Polyline
              path={polylinePath}
              options={{
                strokeColor: "#4338ca",
                strokeOpacity: 0.7,
                strokeWeight: 4,
                geodesic: true,
                icons: [{
                  icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                  offset: '50%',
                  repeat: '60px',
                }],
              }}
            />
          )
        )}

        {/* Route pickup marker */}
        {selectedVendorPos && (
          <Marker
            position={selectedVendorPos}
            icon={MAP_MARKERS.ROUTE_PICKUP(true)}
            zIndex={100}
            title={selectedOrder?.pickup || 'موقع الاستلام'}
          />
        )}

        {/* Route dropoff marker */}
        {selectedClientPos && (
          <Marker
            position={selectedClientPos}
            icon={MAP_MARKERS.ROUTE_DROPOFF(true)}
            zIndex={100}
            title={selectedOrder?.dropoff || 'موقع التسليم'}
          />
        )}

        {/* Selected rider marker */}
        {selectedRiderPos && (
          <Marker
            position={selectedRiderPos}
            icon={MAP_MARKERS.SELECTED(true)}
            zIndex={200}
            title={selectedOrder?.rider || 'المندوب'}
          />
        )}

        {/* Info popup for clicked markers */}
        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-2 dir-rtl text-right min-w-[170px]">
              <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{selected.title}</h4>
              <p className="text-[10px] text-slate-500 mb-2">{selected.subtitle}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  selected.type === 'CLIENT' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  selected.type === 'VENDOR' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                  'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {selected.type === 'CLIENT' ? 'عميل' : selected.type === 'VENDOR' ? 'مورد' : 'مندوب'}
                </span>
                {selected.status && (
                  <span className="text-[9px] font-bold text-slate-400">
                    {(() => {
                      const m: Record<string, string> = {
                        ORDER_PLACED: 'تم الطلب',
                        VENDOR_PREPARING: 'قيد التحضير',
                        READY_FOR_PICKUP: 'جاهز للاستلام',
                        OUT_FOR_DELIVERY: 'خارج للتوصيل',
                        IN_TRANSIT: 'قيد التوصيل',
                        DELIVERED: 'تم التسليم',
                        FAILED_DELIVERY: 'فشل التوصيل',
                      };
                      return m[selected.status] || selected.status;
                    })()}
                  </span>
                )}
              </div>
              {selected.type === 'RIDER' && selectedOrder && (
                <div className="mt-2 text-[9px] text-slate-400 font-bold flex items-center gap-1 border-t border-slate-100 pt-1.5">
                  <span>الطلب: #{selectedOrder.id}</span>
                  <span className="mx-1">·</span>
                  <span>{formatDistanceToNow(new Date(selectedOrder.updatedAt), { addSuffix: true, locale: ar })}</span>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Custom map controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <MapControlButton onClick={handleZoomIn} icon={Plus} label="تكبير" />
        <MapControlButton onClick={handleZoomOut} icon={Minus} label="تصغير" />
        <MapControlButton onClick={handleResetCenter} icon={Crosshair} label="إعادة تعيين المركز" />
        <MapControlButton
          onClick={handleShowAllDrivers}
          icon={Maximize2}
          label="عرض كل المناديب"
        />
        {hasRoute && (
          <MapControlButton
            onClick={handleShowRoute}
            icon={MapPin}
            label="عرض المسار المحدد"
            active
          />
        )}
      </div>

      {/* Route info indicator */}
      {hasSelectedOrder && (
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          <div className="bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[9px] font-bold text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            عرض مسار الطلب #{selectedOrder.id}
          </div>
          {directionsError && (
            <div className="bg-amber-50/95 border border-amber-200 text-amber-800 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm text-[9px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {directionsError === 'Google Maps Directions require billing. Showing straight-line routes.' 
                ? 'مفتاح الخريطة بحاجة لتفعيل الدفع (Billing). تم إظهار مسار خطي تقريبي.' 
                : directionsError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
