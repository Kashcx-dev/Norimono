import React, { useState } from "react";
import { X, Car } from "lucide-react";

function VehicleRegistrationModal({ onClose, onRegister }) {
	const [vehicleModel, setVehicleModel] = useState("");
	const [licensePlate, setLicensePlate] = useState("");
	const [capacity, setCapacity] = useState(4);

	const handleSubmit = (e) => {
		e.preventDefault();

		onRegister({ vehicleModel, licensePlate, capacity });
	};

	return (
		<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-[#714B67]/10 rounded-full flex items-center justify-center text-[#714B67]">
							<Car className="w-5 h-5" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
							Register Vehicle
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
							Vehicle Make & Model
						</label>
						<input
							required
							type="text"
							value={vehicleModel}
							onChange={(e) => setVehicleModel(e.target.value)}
							placeholder="e.g. Toyota Prius"
							className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
							License Plate
						</label>
						<input
							required
							type="text"
							value={licensePlate}
							onChange={(e) => setLicensePlate(e.target.value)}
							placeholder="ABC-1234"
							className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all uppercase"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
							Available Seats
						</label>
						<input
							required
							type="number"
							min="1"
							max="8"
							value={capacity}
							onChange={(e) => setCapacity(e.target.value)}
							className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
						/>
					</div>

					<div className="pt-4">
						<button
							type="submit"
							className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all shadow-sm"
						>
							Complete Registration
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default VehicleRegistrationModal;
