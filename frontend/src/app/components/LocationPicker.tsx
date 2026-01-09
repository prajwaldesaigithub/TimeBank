"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  onClose: () => void;
}

export default function LocationPicker({ value, onChange, onClose }: LocationPickerProps) {
  const [location, setLocation] = useState(value);
  const [mapUrl, setMapUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const buildMapUrl = (loc: string) => {
    if (!loc) return "";

    // Improved coordinate matching - handles various formats
    const coordMatch = loc.match(/(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)/);
    const base = "https://www.google.com/maps";

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates:", lat, lng);
        return "";
      }

      // Ensure valid latitude (-90 to 90) and longitude (-180 to 180)
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error("Coordinates out of range:", lat, lng);
        return "";
      }

      // Use standard maps embed that doesn't require an API key
      const q = encodeURIComponent(`${lat},${lng}`);
      return `${base}?q=${q}&output=embed`;
    }

    // For address strings, use place search via the generic embed URL
    const encoded = encodeURIComponent(loc.trim());
    return `${base}?q=${encoded}&output=embed`;
  };

  useEffect(() => {
    if (location) {
      const url = buildMapUrl(location);
      if (url) {
        setMapUrl(url);
      } else {
        setMapUrl("");
      }
    } else {
      setMapUrl("");
    }
  }, [location]);

  const handleSave = () => {
    if (location.trim()) {
      onChange(location.trim());
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      // Use high accuracy options for better location precision
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Use the Geocoding API with better error handling
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6Y4cnguVZJk';
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&result_type=street_address|locality|administrative_area_level_1|country`;
          
          fetch(geocodeUrl)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Geocoding API error: ${res.status}`);
              }
              return res.json();
            })
            .then(data => {
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                // Prefer more specific results (street_address > locality > administrative_area_level_1)
                const result = data.results.find((r: any) => 
                  r.types.includes('street_address')
                ) || data.results.find((r: any) => 
                  r.types.includes('locality')
                ) || data.results[0];
                
                setLocation(result.formatted_address);
              } else if (data.status === 'ZERO_RESULTS') {
                // Fallback to coordinates if no address found
                const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setLocation(coords);
                // Trigger map update
                setTimeout(() => {
                  const url = buildMapUrl(coords);
                  if (url) setMapUrl(url);
                }, 100);
              } else {
                console.error('Geocoding error:', data.status);
                const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setLocation(coords);
                // Trigger map update
                setTimeout(() => {
                  const url = buildMapUrl(coords);
                  if (url) setMapUrl(url);
                }, 100);
              }
            })
            .catch((error) => {
              console.error('Geocoding fetch error:', error);
              // Fallback to coordinates with better precision
              setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            });
        },
        (error) => {
          let errorMessage = "Unable to get your location. Please enter it manually.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions or enter your location manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please enter your location manually.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again or enter your location manually.";
              break;
          }
          alert(errorMessage);
        },
        options
      );
    } else {
      alert("Geolocation is not supported by your browser. Please enter your location manually.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Set Your Location</h3>
                <p className="text-sm text-slate-400">Enter your location or use current location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location (e.g., New York, NY)"
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all whitespace-nowrap"
                  >
                    Use Current Location
                  </button>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            {location && (
              <div className="flex-1 rounded-lg overflow-hidden border border-slate-600 bg-slate-700">
                {mapUrl ? (
                  <iframe
                    key={mapUrl} // Force re-render when URL changes
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: "400px" }}
                    src={mapUrl}
                    allowFullScreen
                    loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                    onError={(e) => {
                      console.error("Map iframe error:", e);
                      setMapUrl("");
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <p className="text-slate-400 mb-2">Map preview will appear here</p>
                      <p className="text-slate-500 text-sm">Enter a valid address or coordinates (lat, lng)</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!location.trim()}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                Save Location
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

