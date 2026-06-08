export const GOOGLE_MAPS_CONFIG = {
  id: "shoofly-google-maps",
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyCnVbBKPY0fZBGQXW0zbMJiaMNLVkXyY_0",
  language: "ar",
} as const;

export const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

export const CLEAN_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 1.5 }] },
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ color: "#f3f4f6" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }, { weight: 1 }] },
  { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f9fafb" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f3f4f6" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#e8f0e8" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }, { weight: 0.5 }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#fef3c7" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#fde68a" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#fafafa" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "simplified" }] },
];

const SVG_SIZE = 32;
const C = SVG_SIZE / 2;
const R = C - 2.5;
const IR = R * 0.5;

const SHADOW_FILTER = `<filter id="s"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.2"/></filter>`;

function circleSvg(fill: string, innerSvg: string, opts?: {
  opacity?: number;
  borderWidth?: number;
  glow?: boolean;
  pulse?: boolean;
}): string {
  const bw = opts?.borderWidth ?? 2.5;
  const opacity = opts?.opacity ?? 1;
  const fillAttr = opts?.glow ? `"${fill}"` : `"${fill}"`;

  let extras = '';
  if (opts?.glow) {
    extras += `<circle cx="${C}" cy="${C}" r="${R + 5}" fill="none" stroke="${fill}" stroke-width="1.5" opacity="0.2"/>
<circle cx="${C}" cy="${C}" r="${R + 10}" fill="none" stroke="${fill}" stroke-width="1" opacity="0.08"/>`;
  }
  if (opts?.pulse) {
    extras += `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${fill}" stroke-width="1.5" opacity="0.25">
  <animate attributeName="r" values="${R};${R + 6};${R}" dur="2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite"/>
</circle>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" width="${SVG_SIZE}" height="${SVG_SIZE}"${opacity < 1 ? ` opacity="${opacity}"` : ''}>
<defs>${SHADOW_FILTER}</defs>
${extras}
<circle cx="${C}" cy="${C}" r="${R}" fill="${fill}" stroke="#ffffff" stroke-width="${bw}" filter="url(#s)"/>
<circle cx="${C}" cy="${C}" r="${IR}" fill="#ffffff" fill-opacity="0.95"/>
<g transform="translate(${C - 16}, ${C - 16})">${innerSvg}</g>
</svg>`;
}

const ICONS: Record<string, string> = {
  person: `<circle cx="16" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/>
<path d="M10 22c0-3.3 2.5-5.5 6-5.5s6 2.2 6 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  shop: `<rect x="9.5" y="11" width="13" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
<polygon points="7.5,11 16,7 24.5,11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
<line x1="12.5" y1="18.5" x2="12.5" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<line x1="19.5" y1="18.5" x2="19.5" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  driver: `<circle cx="16" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
<path d="M10 22c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
<path d="M13 21.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  target: `<circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/>
<circle cx="16" cy="16" r="2.5" fill="currentColor"/>
<line x1="16" y1="6" x2="16" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
<line x1="16" y1="22" x2="16" y2="26" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
<line x1="6" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
<line x1="22" y1="16" x2="26" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  flag: `<path d="M12 23V11h10l-2.5 4 2.5 4H12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
<line x1="12" y1="9" x2="12" y2="25" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
  pin: `<circle cx="16" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M16 8c-3.5 0-6.5 2.5-6.5 5.5 0 5 6.5 9.5 6.5 9.5s6.5-4.5 6.5-9.5c0-3-3-5.5-6.5-5.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
};

const COLORS: Record<string, string> = {
  CLIENT: "#2563eb",
  VENDOR: "#ea580c",
  RIDER: "#059669",
  SELECTED: "#4338ca",
};

const SIZES = {
  normal: 32,
  dimmed: 26,
  selected: 48,
  route: 28,
};

export const MAP_MARKERS = {
  CLIENT: (isLoaded: boolean, dimmed?: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = dimmed ? SIZES.dimmed : SIZES.normal;
    const svg = circleSvg(COLORS.CLIENT, ICONS.person, { opacity: dimmed ? 0.45 : 1 });
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
  VENDOR: (isLoaded: boolean, dimmed?: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = dimmed ? SIZES.dimmed : SIZES.normal;
    const svg = circleSvg(COLORS.VENDOR, ICONS.shop, { opacity: dimmed ? 0.45 : 1 });
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
  RIDER: (isLoaded: boolean, dimmed?: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = dimmed ? SIZES.dimmed : SIZES.normal;
    const svg = circleSvg(COLORS.RIDER, ICONS.driver, { opacity: dimmed ? 0.45 : 1, pulse: !dimmed });
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
  SELECTED: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = SIZES.selected;
    const svg = circleSvg(COLORS.SELECTED, ICONS.target, { borderWidth: 3, glow: true });
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
  ROUTE_PICKUP: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = SIZES.route;
    const svg = circleSvg(COLORS.VENDOR, ICONS.flag);
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
  ROUTE_DROPOFF: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const sz = SIZES.route;
    const svg = circleSvg(COLORS.CLIENT, ICONS.pin);
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(sz, sz),
      anchor: new window.google.maps.Point(sz / 2, sz / 2),
    };
  },
};
