'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const UserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const NgoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface NGO {
  id: number;
  lat: number;
  lon: number;
  name: string;
  distance?: number;
  tags: Record<string, string>;
}

// Component to recenter map when location changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

export default function DonationMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          fetchNearbyNGOs(loc[0], loc[1]);
        },
        (err) => {
          console.error("Location error:", err);
          setError("Location access denied. Displaying default location.");
          // Fallback to a default location (e.g. London)
          const fallback: [number, number] = [51.505, -0.09];
          setUserLocation(fallback);
          fetchNearbyNGOs(fallback[0], fallback[1]);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  const fetchNearbyNGOs = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      // Query Overpass API for food banks or charities nearby (approx 10km radius)
      // Node, Way, Relation for amenity=social_facility OR amenity=food_bank OR office=ngo
      const radius = 10000;
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          way["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["office"="ngo"](around:${radius},${lat},${lon});
          way["office"="ngo"](around:${radius},${lat},${lon});
          node["amenity"="charity"](around:${radius},${lat},${lon});
          node["social_facility"="food_bank"](around:${radius},${lat},${lon});
        );
        out center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (!response.ok) throw new Error("Failed to fetch NGO data");
      
      const data = await response.json();
      
      const parsedNGOs: NGO[] = data.elements.map((el: any) => ({
        id: el.id,
        lat: el.type === 'node' ? el.lat : el.center.lat,
        lon: el.type === 'node' ? el.lon : el.center.lon,
        name: el.tags?.name || el.tags?.operator || "Local NGO / Food Bank",
        tags: el.tags || {}
      })).filter((ngo: NGO) => ngo.name !== "Local NGO / Food Bank" || Object.keys(ngo.tags).length > 0);
      
      setNgos(parsedNGOs);
    } catch (err) {
      console.error(err);
      setError("Failed to find nearby NGOs. The Overpass API might be busy.");
    } finally {
      setLoading(false);
    }
  };

  if (!userLocation) {
    return (
      <div className="h-[500px] w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
        <p>Requesting location access...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <span className="text-sm font-medium text-slate-200">Searching for nearby food banks...</span>
            </div>
          </div>
        )}
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            // Alternatively use dark mode tiles:
            // url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapRecenter center={userLocation} />
          
          <Marker position={userLocation} icon={UserIcon}>
            <Popup className="rounded-xl overflow-hidden">
              <div className="text-center font-semibold text-slate-800">Your Location</div>
            </Popup>
          </Marker>

          {ngos.map((ngo) => (
            <Marker key={ngo.id} position={[ngo.lat, ngo.lon]} icon={NgoIcon}>
              <Popup>
                <div className="min-w-[150px]">
                  <h3 className="font-bold text-slate-900 mb-1 leading-tight">{ngo.name}</h3>
                  <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">NGO / Food Bank</p>
                  
                  <div className="space-y-2 text-sm text-slate-700">
                    {ngo.tags['addr:street'] && (
                      <p>📍 {ngo.tags['addr:housenumber'] || ''} {ngo.tags['addr:street']}</p>
                    )}
                    {ngo.tags['contact:phone'] || ngo.tags['phone'] ? (
                      <p>📞 {ngo.tags['contact:phone'] || ngo.tags['phone']}</p>
                    ) : null}
                    {ngo.tags['website'] && (
                      <a href={ngo.tags['website']} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate max-w-[200px]">
                        🌐 Website
                      </a>
                    )}
                    
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lon}`)}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      Get Directions
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading && ngos.length === 0 ? (
          <div className="md:col-span-2 bg-slate-800/50 border border-slate-700/50 p-8 rounded-xl text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h4 className="font-medium text-slate-200 mb-2">No donation centers found nearby</h4>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              We couldn't find any registered food banks, NGOs, or charities within 10km of your location in OpenStreetMap data.
              Try searching manually on Google Maps for "food bank near me" or "NGO near me".
            </p>
            <button
              onClick={() => window.open(`https://www.google.com/maps/search/food+bank+near+me`)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
            >
              Search on Google Maps
            </button>
          </div>
        ) : (
          ngos.slice(0, 4).map(ngo => (
            <div key={ngo.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-start justify-between group hover:border-emerald-500/30 transition">
              <div>
                <h4 className="font-medium text-slate-200">{ngo.name}</h4>
                <p className="text-sm text-slate-400 mt-1">
                  {ngo.tags['addr:street'] ? `${ngo.tags['addr:street']}, ${ngo.tags['addr:city'] || ''}` : "Address unavailable"}
                </p>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lon}`)}
                className="text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
              >
                Directions
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
