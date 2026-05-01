'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Search, MapPin, Phone, Navigation, HeartHandshake } from 'lucide-react';
import { geocodeAddress } from '@/lib/geocode';
import { NGO_CITIES } from '@/lib/ngo-database';

// ── Leaflet icon fix for Next.js ─────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const UserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const NgoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// ── Types ────────────────────────────────────────────────────────────────────
interface NGO {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  category: string;
  tags: string[];
  distance?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  food_bank: '🍱 Food Bank',
  shelter: '🏠 Shelter',
  charity: '💛 Charity',
  community_kitchen: '🍲 Community Kitchen',
};

// ── MapRecenter helper ───────────────────────────────────────────────────────
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 1 }); }, [center, map]);
  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DonationMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [isUsingGPS, setIsUsingGPS] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Fetch from our static API ─────────────────────────────────────────────
  const fetchNGOs = useCallback(async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donate?lat=${lat}&lng=${lng}&radius=${radius}`);
      if (!res.ok) throw new Error('Failed to fetch NGO data');
      const data = await res.json();
      setNgos(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        setError(`No NGOs found within ${radius} km. Try a larger radius or search by city name.`);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load NGO data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GPS location ──────────────────────────────────────────────────────────
  const getUserLocation = useCallback(() => {
    setIsUsingGPS(true);
    setSearchQuery('');
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported. Please search by city name.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        fetchNGOs(loc[0], loc[1], radiusKm);
      },
      () => {
        // Fallback: New Delhi centre
        const fallback: [number, number] = [28.6139, 77.209];
        setUserLocation(fallback);
        setError('Location access denied — showing NGOs near Delhi. Search your city above.');
        fetchNGOs(fallback[0], fallback[1], radiusKm);
      },
      { timeout: 8000 }
    );
  }, [fetchNGOs, radiusKm]);

  useEffect(() => { getUserLocation(); }, []);  // run once on mount

  // Re-fetch when radius changes (if we already have a location)
  useEffect(() => {
    if (userLocation) fetchNGOs(userLocation[0], userLocation[1], radiusKm);
  }, [radiusKm]);

  // ── Address/city search ───────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    const result = await geocodeAddress(q);
    if (result) {
      const loc: [number, number] = [result.lat, result.lon];
      setUserLocation(loc);
      setIsUsingGPS(false);
      fetchNGOs(loc[0], loc[1], radiusKm);
    } else {
      setError('Location not found. Try a city name like "Bhopal" or "Delhi".');
      setLoading(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (!userLocation) {
    return (
      <div className="h-[400px] md:h-[500px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="font-medium">Requesting location…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Search bar + radius ── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <form onSubmit={handleSearch} className="relative flex-1 flex w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            list="city-suggestions"
            placeholder="Search city, address… (e.g. Indore, Jabalpur)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
          />
          <datalist id="city-suggestions">
            {NGO_CITIES.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-zinc-900 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 shrink-0">
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
          >
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          {!isUsingGPS && (
            <button
              onClick={getUserLocation}
              title="Use my GPS location"
              className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 p-2.5 rounded-xl transition"
            >
              <MapPin size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Result count ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <HeartHandshake size={18} className="text-zinc-500" />
          Nearby Donation Centers
        </h2>
        <span className="bg-zinc-100 text-xs font-semibold text-zinc-600 px-3 py-1 rounded-full border border-zinc-200">
          {loading ? '…' : `${ngos.length} found`}
        </span>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Map ── */}
      <div className="h-[320px] sm:h-[420px] md:h-[500px] w-full rounded-2xl overflow-hidden border border-zinc-200 shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white px-5 py-3 rounded-xl border border-zinc-200 shadow-lg flex items-center gap-3">
              <Loader2 className="animate-spin text-zinc-500" size={20} />
              <span className="text-sm font-medium text-zinc-700">Finding NGOs…</span>
            </div>
          </div>
        )}
        <MapContainer center={userLocation} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapRecenter center={userLocation} />

          {/* User pin */}
          <Marker position={userLocation} icon={UserIcon}>
            <Popup><div className="font-semibold text-zinc-800 text-center">📍 Your Location</div></Popup>
          </Marker>

          {/* NGO pins */}
          {ngos.map((ngo) => (
            <Marker
              key={ngo.id}
              position={[ngo.lat, ngo.lng]}
              icon={NgoIcon}
              eventHandlers={{ click: () => setSelectedId(ngo.id) }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1.5">
                  <p className="font-bold text-zinc-900 leading-snug">{ngo.name}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">{CATEGORY_LABELS[ngo.category] ?? ngo.category}</p>
                  <p className="text-xs text-zinc-600">{ngo.address}</p>
                  {ngo.phone && (
                    <a href={`tel:${ngo.phone}`} className="text-xs text-blue-600 flex items-center gap-1">
                      <Phone size={11} /> {ngo.phone}
                    </a>
                  )}
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}`)}
                    className="mt-2 w-full bg-zinc-900 hover:bg-zinc-700 text-white py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <Navigation size={12} /> Get Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── Card list ── */}
      {!loading && ngos.length === 0 ? (
        <div className="bg-zinc-50 border border-zinc-200 p-8 rounded-2xl text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h4 className="font-semibold text-zinc-900 mb-1">No donation centers found</h4>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Try increasing the radius or searching your city name directly (e.g. "Delhi", "Mumbai", "Jabalpur").
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ngos.map((ngo) => (
            <div
              key={ngo.id}
              onClick={() => setSelectedId(ngo.id === selectedId ? null : ngo.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition shadow-sm hover:border-zinc-400 ${
                selectedId === ngo.id ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-zinc-900 text-sm leading-snug truncate">{ngo.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{ngo.address}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[ngo.category] ?? ngo.category}
                    </span>
                    {ngo.phone && (
                      <a
                        href={`tel:${ngo.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-blue-100 transition"
                      >
                        <Phone size={10} /> Call
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}`);
                  }}
                  className="shrink-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1"
                >
                  <Navigation size={12} /> Go
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
