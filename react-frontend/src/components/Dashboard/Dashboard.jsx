import React, { useState } from "react";
import Header from "./Header";
import MapPlaceholder from "./MapPlaceholder";
import RideActions from "./RideActions";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import AIAssistant from "./AIAssistant";

function Dashboard() {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false); // Simulated state

  const handlePublishRide = () => {
    if (!hasVehicle) {
      setShowVehicleModal(true);
    } else {
      // Logic for publishing a ride when they already have a vehicle
      alert("Opening Publish Ride Form (Coming Soon!)");
    }
  };

  const handleRegisterVehicle = (vehicleData) => {
    console.log("Registered:", vehicleData);
    setHasVehicle(true);
    setShowVehicleModal(false);
    alert("Vehicle registered successfully! You can now publish rides.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full text-left">
      <Header onOpenVehicleModal={() => setShowVehicleModal(true)} />
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Map Area */}
        <div className="w-full lg:w-2/3">
          <MapPlaceholder />
        </div>

        {/* Right Side: Actions */}
        <div className="w-full lg:w-1/3">
          <RideActions onPublishRide={handlePublishRide} />
        </div>
        
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MakeLyft. Powered by Odoo.
        </div>
      </footer>

      {/* Floating AI Assistant */}
      <AIAssistant />

      {/* Modals */}
      {showVehicleModal && (
        <VehicleRegistrationModal
          onClose={() => setShowVehicleModal(false)}
          onRegister={handleRegisterVehicle}
        />
      )}
    </div>
  );
}

export default Dashboard;
