import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Plus, Loader2, LocateFixed, Navigation } from "lucide-react";

// Robust place search with Photon (Komoot OSM) + Nominatim fallback
async function fetchPlaceSuggestions(query, userLoc) {
  if (!query || query.trim().length < 2) return [];

  // Try Photon with user location bias
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6`;
    if (userLoc && userLoc.length === 2) {
      url += `&lat=${userLoc[0]}&lon=${userLoc[1]}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.features && data.features.length > 0) {
      return data.features.map((f) => {
        const p = f.properties;
        const main = p.name || p.street || p.city || "Location";
        const parts = [p.street, p.city || p.town || p.district, p.state, p.country].filter(Boolean);
        const sub = parts.join(", ");
        return {
          title: main,
          subtitle: sub,
          fullAddress: main + (sub ? `, ${sub}` : ""),
          coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]], // [lat, lon]
        };
      });
    }
  } catch (err) {
    console.warn("Photon search failed, falling back to Nominatim", err);
  }

  // Fallback to Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return data.map((item) => ({
        title: item.display_name.split(",")[0],
        subtitle: item.display_name.split(",").slice(1, 4).join(","),
        fullAddress: item.display_name,
        coords: [parseFloat(item.lat), parseFloat(item.lon)],
      }));
    }
  } catch (err) {
    console.error("Nominatim search failed", err);
  }

  return [];
}

function RideActions({
  onPublishRide,
  onLocationUpdate,
  pickupCoords,
  dropoffCoords,
  userLocation,
  onSearchRoute,
}) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);

  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [searchingRoute, setSearchingRoute] = useState(false);

  const sourceRef = useRef(null);
  const destRef = useRef(null);

  // Set default source to Current Location when GPS is detected
  useEffect(() => {
    if (userLocation && (!source || source === "Your Current Location")) {
      setSource("Your Current Location");
      onLocationUpdate("source", userLocation);
    }
  }, [userLocation]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target)) {
        setShowSourceDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions for Source
  useEffect(() => {
    if (!source.trim() || source === "Your Current Location" || source.trim().length < 2) {
      setSourceSuggestions([]);
      setShowSourceDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSource(true);
      const results = await fetchPlaceSuggestions(source, userLocation);
      setSourceSuggestions(results);
      setShowSourceDropdown(true);
      setLoadingSource(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [source, userLocation]);

  // Fetch suggestions for Destination
  useEffect(() => {
    if (!destination.trim() || destination.trim().length < 2) {
      setDestSuggestions([]);
      setShowDestDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDest(true);
      const results = await fetchPlaceSuggestions(destination, userLocation);
      setDestSuggestions(results);
      setShowDestDropdown(true);
      setLoadingDest(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [destination, userLocation]);

  const handleSelectSource = (item) => {
    setSource(item.title);
    onLocationUpdate("source", item.coords);
    setShowSourceDropdown(false);
  };

  const handleSelectDest = (item) => {
    setDestination(item.title);
    onLocationUpdate("destination", item.coords);
    setShowDestDropdown(false);
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setSource("Your Current Location");
      onLocationUpdate("source", userLocation);
      setShowSourceDropdown(false);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setSource("Your Current Location");
          onLocationUpdate("source", coords);
          setShowSourceDropdown(false);
        },
        (err) => {
          alert("Could not access your location. Please enable location permissions.");
        }
      );
    }
  };

  const handleSearch = async () => {
    if (!source.trim() || !destination.trim()) {
      alert("Please enter both a Source and a Destination!");
      return;
    }

    setSearchingRoute(true);
    let startCoords = pickupCoords;
    let endCoords = dropoffCoords;

    try {
      // Resolve start coordinates if missing
      if (!startCoords) {
        if (source === "Your Current Location" && userLocation) {
          startCoords = userLocation;
          onLocationUpdate("source", startCoords);
        } else {
          const results = await fetchPlaceSuggestions(source, userLocation);
          if (results && results.length > 0) {
            startCoords = results[0].coords;
            onLocationUpdate("source", startCoords);
          }
        }
      }

      // Resolve destination coordinates if missing
      if (!endCoords) {
        const results = await fetchPlaceSuggestions(destination, userLocation);
        if (results && results.length > 0) {
          endCoords = results[0].coords;
          onLocationUpdate("destination", endCoords);
        }
      }

      if (!startCoords) {
        alert(`Could not find coordinates for "${source}". Please pick a place from the suggestions.`);
        return;
      }

      if (!endCoords) {
        alert(`Could not find coordinates for "${destination}". Please pick a place from the suggestions.`);
        return;
      }

      // Call OSRM route API: format lon,lat;lon,lat
      const startStr = `${startCoords[1]},${startCoords[0]}`;
      const endStr = `${endCoords[1]},${endCoords[0]}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        // Convert [lon, lat] points to [lat, lon] for Leaflet
        const routeCoords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        onSearchRoute(routeCoords);
      } else {
        alert("No drivable road route found between these locations.");
      }
    } catch (err) {
      console.error("OSRM Route error:", err);
      alert("Could not calculate road route.");
    } finally {
      setSearchingRoute(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-left">
      {/* Publish Ride Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Publish a Ride</h3>
        <p className="text-sm text-gray-500 mb-4">
          Driving somewhere? Share your empty seats and help colleagues commute.
        </p>
        <button
          onClick={onPublishRide}
          className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Publish Ride
        </button>
      </div>

      {/* Find Rides Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">See Available Rides</h3>
        <p className="text-sm text-gray-500 mb-6">Find a ride to your destination.</p>

        <div className="space-y-4">
          {/* Source Input & Suggestions */}
          <div className="space-y-1.5 relative" ref={sourceRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Source
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-[#00A09D] hover:text-[#008f8c] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="Use Current Location"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>My Location</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (pickupCoords) onLocationUpdate("source", null);
                }}
                onFocus={() => {
                  if (sourceSuggestions.length > 0) setShowSourceDropdown(true);
                }}
                placeholder="e.g. Current Location or Adamas University"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
              />
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#00A09D]" />
              {loadingSource && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>

            {/* Source Suggestions Dropdown */}
            {showSourceDropdown && (
              <div className="absolute top-full left-0 right-0 z-[999] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-100">
                {sourceSuggestions.length > 0 ? (
                  sourceSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSource(item);
                      }}
                      className="p-3 hover:bg-teal-50/50 cursor-pointer flex items-start gap-3 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-[#00A09D] shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  !loadingSource && (
                    <div className="p-3 text-xs text-gray-500 text-center">
                      No matching locations found
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Destination Input & Suggestions */}
          <div className="space-y-1.5 relative" ref={destRef}>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (dropoffCoords) onLocationUpdate("destination", null);
                }}
                onFocus={() => {
                  if (destSuggestions.length > 0) setShowDestDropdown(true);
                }}
                placeholder="e.g. Barrackpore or Howrah Station"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
              />
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#EF4444]" />
              {loadingDest && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>

            {/* Destination Suggestions Dropdown */}
            {showDestDropdown && (
              <div className="absolute top-full left-0 right-0 z-[999] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-100">
                {destSuggestions.length > 0 ? (
                  destSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDest(item);
                      }}
                      className="p-3 hover:bg-rose-50/50 cursor-pointer flex items-start gap-3 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-[#EF4444] shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  !loadingDest && (
                    <div className="p-3 text-xs text-gray-500 text-center">
                      No matching locations found
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={searchingRoute}
            className="w-full py-3 px-4 bg-[#00A09D] hover:bg-[#008f8c] disabled:bg-[#00A09D]/60 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-4 cursor-pointer"
          >
            {searchingRoute ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating Route...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Rides
              </>
            )}
          </button>

          <button
            onClick={() => alert("Browsing Nearest Rides (Coming Soon!)")}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            Browse Nearest Rides
          </button>
        </div>
      </div>
    </div>
  );
}

export default RideActions;
