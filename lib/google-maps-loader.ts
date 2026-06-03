/**
 * Shared Google Maps API loader configuration.
 * All map components should use this single loader to prevent
 * loading the Google Maps JS API multiple times.
 */

export const GOOGLE_MAPS_CONFIG = {
  id: "shoofly-google-maps",
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyCnVbBKPY0fZBGQXW0zbMJiaMNLVkXyY_0",
  language: "ar",
} as const;

export const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }; // Cairo

/** Premium Uber/Careem-like Map Style */
export const CLEAN_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4f5963" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#f0f0f0" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: "#e8ece9" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eef1f0" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f7b80" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#d5ebd7" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffeacc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffd299" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8e8e8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#cadde6" }],
  },
];

/** High-fidelity SVG markers styled like modern premium ride-hailing applications */
export const MAP_MARKERS = {
  CLIENT: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 70" width="50" height="70">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  <path d="M25 0C11.19 0 0 11.19 0 25c0 14.25 15.62 33.62 23 42.14a2.53 2.53 0 0 0 4 0c7.38-8.52 23-27.89 23-42.14C50 11.19 38.81 0 25 0z" fill="#3B82F6" filter="url(#shadow)"/>
  <circle cx="25" cy="25" r="21" fill="#FFFFFF"/>
  <circle cx="25" cy="25" r="18" fill="#3B82F6"/>
  <path d="M25 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-16 2.67-16 8v3h32v-3c0-5.33-10.67-8-16-8z" fill="#FFFFFF"/>
</svg>`;
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(42, 58),
      anchor: new window.google.maps.Point(21, 58),
    };
  },
  VENDOR: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 70" width="50" height="70">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  <path d="M25 0C11.19 0 0 11.19 0 25c0 14.25 15.62 33.62 23 42.14a2.53 2.53 0 0 0 4 0c7.38-8.52 23-27.89 23-42.14C50 11.19 38.81 0 25 0z" fill="#F97316" filter="url(#shadow)"/>
  <circle cx="25" cy="25" r="21" fill="#FFFFFF"/>
  <circle cx="25" cy="25" r="18" fill="#F97316"/>
  <path d="M27 28v-6h-4v6h-5v-6h-2v6h-2v-8l1-3h16l1 3v8h-4zm-14.5-9l-.5-1.5V16h20v1.5l-.5 1.5h-19zM35 32H15v-2h20v2z" fill="#FFFFFF"/>
</svg>`;
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(42, 58),
      anchor: new window.google.maps.Point(21, 58),
    };
  },
  RIDER: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 70" width="50" height="70">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  <path d="M25 0C11.19 0 0 11.19 0 25c0 14.25 15.62 33.62 23 42.14a2.53 2.53 0 0 0 4 0c7.38-8.52 23-27.89 23-42.14C50 11.19 38.81 0 25 0z" fill="#10B981" filter="url(#shadow)"/>
  <circle cx="25" cy="25" r="21" fill="#FFFFFF"/>
  <circle cx="25" cy="25" r="18" fill="#10B981"/>
  <path d="M19 28a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm.8-9.2c-.4-.4-1-.4-1.4 0L28 21.4V19c0-.6-.4-1-1-1s-1 .4-1 1v4.6l-3.3-2.5c-.5-.4-1.2-.3-1.6.2s-.3 1.2.2 1.6l4.7 3.5c.3.2.8.3 1.1.1l3.5-2.3 2.4 2.4c.4.4 1 .4 1.4 0s.4-1 0-1.4L31.8 23l2-2.3c.4-.4.4-1 0-1.5z" fill="#FFFFFF"/>
</svg>`;
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(42, 58),
      anchor: new window.google.maps.Point(21, 58),
    };
  },
  TARGET: (isLoaded: boolean) => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) return undefined;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 70" width="50" height="70">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <path d="M25 0C11.19 0 0 11.19 0 25c0 14.25 15.62 33.62 23 42.14a2.53 2.53 0 0 0 4 0c7.38-8.52 23-27.89 23-42.14C50 11.19 38.81 0 25 0z" fill="#F97316" filter="url(#shadow)"/>
  <circle cx="25" cy="25" r="21" fill="#FFFFFF"/>
  <circle cx="25" cy="25" r="18" fill="#F97316"/>
  <circle cx="25" cy="25" r="5" fill="#FFFFFF"/>
  <path d="M25 12v6M25 32v6M12 25h6M32 25h6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
</svg>`;
    return {
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(44, 60),
      anchor: new window.google.maps.Point(22, 60),
    };
  }
};
