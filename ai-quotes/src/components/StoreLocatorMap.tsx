import React from 'react';
import { zar } from '../lib/money';
import { MapPin, Navigation, Compass, Store, Clock, ExternalLink } from 'lucide-react';
import { StoreComparison } from '../types/diy';

interface StoreLocatorMapProps {
  comparisons: StoreComparison[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
}

export const StoreLocatorMap: React.FC<StoreLocatorMapProps> = ({
  comparisons,
  selectedStoreId,
  onSelectStore,
}) => {
  // Map coordinate bounds: User at (250, 180)
  // Store relative positions on a 500x320 SVG canvas
  const storeCoordinates: Record<string, { x: number; y: number; brandColor: string }> = {
    'mica-placeholder': { x: 190, y: 150, brandColor: '#EF4444' },
    'builders-placeholder': { x: 380, y: 100, brandColor: '#F97316' },
    'diy-placeholder': { x: 110, y: 240, brandColor: '#3B82F6' },
  };

  const selectedStore = comparisons.find((c) => c.store.id === selectedStoreId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Store Radius Map (illustrative)
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            · 3 placeholder stores within 6 km
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Your Job Site</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Driver buys &lt;1hr</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Radar Map */}
      <div className="relative w-full aspect-16/9 sm:aspect-21/9 bg-[#0b0f19] overflow-hidden select-none">
        <svg
          viewBox="0 0 500 320"
          className="w-full h-full"
          style={{ background: 'radial-gradient(circle at 50% 55%, #131b2e 0%, #080c14 100%)' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="500" height="320" fill="url(#roadGrid)" />

          {/* Concentric Distance Rings around User (250, 180) */}
          <circle cx="250" cy="180" r="50" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <text x="250" y="126" textAnchor="middle" fill="rgba(245, 158, 11, 0.4)" fontSize="8" fontFamily="monospace">1 KM</text>

          <circle cx="250" cy="180" r="100" fill="none" stroke="rgba(245, 158, 11, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
          <text x="250" y="76" textAnchor="middle" fill="rgba(245, 158, 11, 0.35)" fontSize="8" fontFamily="monospace">3 KM</text>

          <circle cx="250" cy="180" r="160" fill="none" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="250" y="16" textAnchor="middle" fill="rgba(245, 158, 11, 0.3)" fontSize="8" fontFamily="monospace">6 KM</text>

          {/* Road/Arterial Vector Lines */}
          <path d="M 0 180 L 500 180" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <path d="M 250 0 L 250 320" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <path d="M 80 0 L 420 320" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <path d="M 420 0 L 80 320" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* Connection Lines from User to Selected Store */}
          {selectedStore && storeCoordinates[selectedStore.store.id] && (
            <line
              x1="250"
              y1="180"
              x2={storeCoordinates[selectedStore.store.id].x}
              y2={storeCoordinates[selectedStore.store.id].y}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          )}

          {/* Store Pin Markers */}
          {comparisons.map((item) => {
            const coords = storeCoordinates[item.store.id] || { x: 250, y: 180, brandColor: '#F59E0B' };
            const isSelected = item.store.id === selectedStoreId;
            return (
              <g
                key={item.store.id}
                onClick={() => onSelectStore(item.store.id)}
                className="cursor-pointer group"
                transform={`translate(${coords.x}, ${coords.y})`}
              >
                {/* Ping circle if lowest price */}
                {item.isLowestPrice && (
                  <circle r="18" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                )}

                {/* Outer shadow / active ring */}
                <circle
                  r={isSelected ? 16 : 12}
                  fill={isSelected ? '#F59E0B' : '#0F172A'}
                  stroke={isSelected ? '#FFFFFF' : coords.brandColor}
                  strokeWidth={isSelected ? '2.5' : '2'}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                  className="transition-all duration-200 group-hover:scale-110"
                />

                {/* Inner Brand dot */}
                <circle
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#0F172A' : coords.brandColor}
                />

                {/* Label Box */}
                <g transform="translate(0, -22)">
                  <rect
                    x="-42"
                    y="-12"
                    width="84"
                    height="16"
                    rx="4"
                    fill={isSelected ? '#F59E0B' : 'rgba(15, 23, 42, 0.92)'}
                    stroke={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.15)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill={isSelected ? '#000000' : '#FFFFFF'}
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {item.store.chain.slice(0, 10)} · {zar(item.totalMissingCost)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* User Location Center Pin */}
          <g transform="translate(250, 180)">
            <circle r="14" fill="rgba(245, 158, 11, 0.25)" className="animate-pulse" />
            <circle r="7" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
            <g transform="translate(0, 20)">
              <rect x="-35" y="-10" width="70" height="15" rx="3" fill="#000000" stroke="#F59E0B" strokeWidth="1" />
              <text x="0" y="1" textAnchor="middle" fill="#F59E0B" fontSize="8" fontWeight="bold">
                JOB SITE
              </text>
            </g>
          </g>

          {/* Compass Rose */}
          <g transform="translate(460, 40)" opacity="0.4">
            <circle r="16" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            <path d="M 0 -12 L 3 0 L -3 0 Z" fill="#F59E0B" />
            <path d="M 0 12 L 3 0 L -3 0 Z" fill="#FFFFFF" />
            <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">N</text>
          </g>
        </svg>
      </div>

      {/* Selected Store Information Bar - Positioned completely below the map with zero obstruction */}
      {selectedStore && (
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{selectedStore.store.name}</span>
                {selectedStore.isLowestPrice && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">
                    Lowest Price
                  </span>
                )}
                {selectedStore.isClosest && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded">
                    Closest Store
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400 mt-0.5 text-[11px] flex-wrap">
                <span className="font-mono text-slate-300">{selectedStore.store.distance} km away</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{selectedStore.store.pickupTime}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedStore.store.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Missing Basket</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono tabular-nums">
                {zar(selectedStore.totalMissingCost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
