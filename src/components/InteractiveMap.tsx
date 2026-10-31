import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Bus, RouteStop, Language } from '../types';
import { SCHOOL_LOCATION } from '../data/mockData';
import { translations } from '../data/translations';
import { Maximize2, Navigation, Layers, RotateCcw } from 'lucide-react';

interface InteractiveMapProps {
  buses: Bus[];
  stops?: RouteStop[];
  activeBusId?: number;
  highlightStopId?: number;
  showAllBuses?: boolean;
  lang: Language;
  onSelectBus?: (busId: number) => void;
  className?: string;
  historyTrail?: [number, number][];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  buses,
  stops = [],
  activeBusId,
  highlightStopId,
  showAllBuses = false,
  lang,
  onSelectBus,
  className = 'h-[360px] md:h-[480px]',
  historyTrail,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const t = translations[lang];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // OpenStreetMap Standard Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control to bottom-left (or bottom-right in RTL)
      L.control
        .zoom({
          position: lang === 'ar' ? 'bottomleft' : 'bottomright',
        })
        .addTo(map);

      // Attribution small text
      L.control
        .attribution({
          position: 'bottomleft',
          prefix: '<span class="text-[10px] text-slate-400">© OpenStreetMap · BusWhere GPS</span>',
        })
        .addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      geofenceLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Map cleanup on page leave
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Routes, and Geofences dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routeLayerRef.current || !geofenceLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();
    geofenceLayerRef.current.clearLayers();

    // 1. School Marker
    const schoolIcon = L.divIcon({
      className: 'custom-school-marker',
      html: `
        <div class="flex flex-col items-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
          <div class="h-10 w-10 rounded-xl bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-amber-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M22 10v6"/>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
            </svg>
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap">
            ELS Campus
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const schoolMarker = L.marker([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], { icon: schoolIcon });
    schoolMarker.bindPopup(`
      <div class="p-3 bg-white text-slate-900 min-w-[180px]">
        <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Destination</div>
        <div class="text-[13px] font-extrabold mt-0.5">${lang === 'ar' ? SCHOOL_LOCATION.nameAr : SCHOOL_LOCATION.nameEn}</div>
        <div class="text-[11px] text-slate-500 mt-1">Fifth Settlement, New Cairo</div>
      </div>
    `);
    markersLayerRef.current.addLayer(schoolMarker);

    // 2. Render Historical Trail if provided
    if (historyTrail && historyTrail.length > 1) {
      const historyPolyline = L.polyline(historyTrail, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      });
      routeLayerRef.current.addLayer(historyPolyline);

      // Start & end breadcrumbs
      historyTrail.forEach((pt, idx) => {
        if (idx === 0 || idx === historyTrail.length - 1 || idx % 2 === 0) {
          const breadcrumb = L.circleMarker(pt, {
            radius: idx === 0 || idx === historyTrail.length - 1 ? 6 : 4,
            fillColor: idx === 0 ? '#10b981' : idx === historyTrail.length - 1 ? '#ef4444' : '#6366f1',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9,
          });
          routeLayerRef.current?.addLayer(breadcrumb);
        }
      });
    }

    // 3. Render Route Polylines for Active Bus
    const targetBuses = showAllBuses ? buses : buses.filter((b) => !activeBusId || b.id === activeBusId);

    targetBuses.forEach((bus) => {
      if (bus.routeWaypoints && bus.routeWaypoints.length > 1) {
        const polyline = L.polyline(bus.routeWaypoints, {
          color: bus.status === 'en_route' ? '#f59e0b' : '#94a3b8',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
        });
        routeLayerRef.current?.addLayer(polyline);
      }

      // Bus Marker
      const isMoving = bus.status === 'en_route';
      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer transition-transform duration-300 transform -translate-x-1/2 -translate-y-1/2">
            <div class="relative">
              <div class="h-11 w-11 rounded-2xl ${
                bus.status === 'en_route' ? 'bg-amber-500' : bus.status === 'delayed' ? 'bg-red-500' : 'bg-slate-700'
              } border-2 border-white shadow-xl flex items-center justify-center text-white ${
                isMoving ? 'animate-pulse' : ''
              }">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6v6"/>
                  <path d="M15 6v6"/>
                  <path d="M2 12h19.6"/>
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
                  <circle cx="7" cy="18" r="2"/>
                  <path d="M9 18h5"/>
                  <circle cx="16" cy="18" r="2"/>
                </svg>
              </div>
              ${
                isMoving
                  ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
                    </span>`
                  : ''
              }
            </div>
            <div class="mt-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-amber-400 text-[11px] font-black border border-slate-700 shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <span>${bus.number}</span>
              ${bus.speedKmH > 0 ? `<span class="text-[9px] font-mono text-slate-300">· ${bus.speedKmH} km/h</span>` : ''}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const busMarker = L.marker([bus.currentLocation.lat, bus.currentLocation.lng], {
        icon: busIcon,
      });

      busMarker.on('click', () => {
        if (onSelectBus) onSelectBus(bus.id);
      });

      busMarker.bindPopup(`
        <div class="p-3 bg-white text-slate-900 min-w-[200px]">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="font-extrabold text-[14px] text-amber-600">${bus.number}</span>
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
              bus.status === 'en_route' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }">${t[bus.status]}</span>
          </div>
          <div class="mt-2 space-y-1 text-[11px]">
            <div><span class="text-slate-400">${t.plateNumber}:</span> <span class="font-bold">${lang === 'ar' ? bus.plateAr : bus.plateEn}</span></div>
            <div><span class="text-slate-400">${t.supervisorName}:</span> <span class="font-bold">${bus.supervisorName}</span></div>
            <div><span class="text-slate-400">${t.speed}:</span> <span class="font-mono font-bold">${bus.speedKmH} ${t.kmH}</span></div>
          </div>
        </div>
      `);

      markersLayerRef.current?.addLayer(busMarker);
    });

    // 4. Render Route Stops & Geofence Rings
    stops.forEach((stop) => {
      const isHighlighted = highlightStopId === stop.id;
      const isSkipped = stop.isSkipped;
      const isReached = stop.isReached;

      // Geofence Radius Ring (500m)
      const geofenceCircle = L.circle([stop.lat, stop.lng], {
        radius: 450,
        color: isSkipped ? '#94a3b8' : isHighlighted ? '#f59e0b' : '#3b82f6',
        fillColor: isSkipped ? '#cbd5e1' : isHighlighted ? '#fbbf24' : '#60a5fa',
        fillOpacity: isHighlighted ? 0.22 : 0.08,
        weight: isHighlighted ? 2.5 : 1.2,
        dashArray: isSkipped ? '3, 6' : isHighlighted ? '6, 6' : undefined,
      });
      geofenceLayerRef.current?.addLayer(geofenceCircle);

      // Stop Pin Icon
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
            <div class="h-8 w-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-[11px] ${
              isSkipped
                ? 'bg-slate-300 text-slate-500 line-through'
                : isReached
                ? 'bg-emerald-600 text-white'
                : isHighlighted
                ? 'bg-amber-500 text-white ring-4 ring-amber-300/60'
                : 'bg-blue-600 text-white'
            }">
              ${isSkipped ? '✕' : isReached ? '✓' : stop.order}
            </div>
            <div class="mt-1 px-1.5 py-0.5 rounded bg-white/95 text-slate-800 text-[10px] font-bold border border-slate-200 shadow-sm max-w-[130px] truncate text-center">
              ${lang === 'ar' ? stop.nameAr.split(':')[1] || stop.nameAr : stop.nameEn.split(':')[1] || stop.nameEn}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
      stopMarker.bindPopup(`
        <div class="p-3 bg-white text-slate-900 min-w-[190px]">
          <div class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            ${isSkipped ? '⚠️ ' + t.absentToday : `${t.pickupLocation} #${stop.order}`}
          </div>
          <div class="text-[12px] font-bold mt-1">${lang === 'ar' ? stop.nameAr : stop.nameEn}</div>
          <div class="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Scheduled: <strong class="text-slate-800">${stop.scheduledTime}</strong></span>
            <span>${stop.studentIds.length} student(s)</span>
          </div>
          ${
            isSkipped
              ? `<div class="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                  ${t.skipNotice}
                </div>`
              : ''
          }
        </div>
      `);

      markersLayerRef.current?.addLayer(stopMarker);
    });
  }, [buses, stops, activeBusId, highlightStopId, showAllBuses, lang, historyTrail]);

  // Recenter helper
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeBusId) {
      const activeBus = buses.find((b) => b.id === activeBusId);
      if (activeBus) {
        map.setView([activeBus.currentLocation.lat, activeBus.currentLocation.lng], 15, { animate: true });
        return;
      }
    }

    if (stops && stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      bounds.extend([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng]);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    } else {
      map.setView([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], 14, { animate: true });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {/* Map Target DOM */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Overlay Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleRecenter}
          title="Recenter Map"
          className="h-9 w-9 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-amber-600 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Geofence Legend Indicator */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <span>{t.geofenceRadius}</span>
      </div>
    </div>
  );
};
