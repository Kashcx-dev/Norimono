import React, { useState } from "react";
import { Search, MapPin, Plus } from "lucide-react";

function RideActions({ onPublishRide }) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Publish Ride Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Publish a Ride</h3>
        <p className="text-sm text-gray-500 mb-4">Driving somewhere? Share your empty seats and help colleagues commute.</p>
        <button
          onClick={onPublishRide}
          className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Publish Ride
        </button>
      </div>

      {/* Find Rides Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">See Available Rides</h3>
        <p className="text-sm text-gray-500 mb-6">Find a ride to your destination.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Source
            </label>
            <div className="relative">
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Odoo HQ"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
              />
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Downtown"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
              />
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button className="w-full py-3 px-4 bg-[#00A09D] hover:bg-[#008f8c] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-4">
            <Search className="w-4 h-4" /> Search Rides
          </button>
        </div>
      </div>
    </div>
  );
}

export default RideActions;
