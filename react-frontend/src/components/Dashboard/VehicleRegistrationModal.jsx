import React, { useState } from "react";
import { X, Car, Fuel, Users, Gauge, Check } from "lucide-react";
import vehicleCatalog from "../../data/vehicle_catalog.json";

function VehicleRegistrationModal({ onClose, onRegister }) {
	const [vehicle_model, setVehicleModel] = useState("");
	const [selectedVehicleSpec, setSelectedVehicleSpec] = useState(null);
	const [vehicle_no, setVehicleNo] = useState("");
	const [max_seating_cap, setCapacity] = useState(4);
	const [DL_no, setDlNo] = useState("");
	const [insurance_no, setInsuranceNo] = useState("");
	const [fuel_consumption_ratio, setFuelConsumption] = useState("1.0");

	const handleModelChange = (e) => {
		const selectedName = e.target.value;
		setVehicleModel(selectedName);
		const found = vehicleCatalog.find((v) => v.name === selectedName);
		if (found) {
			setSelectedVehicleSpec(found);
			setCapacity(found.seats || 4);
			setFuelConsumption(found.fuel_consumption_ratio || 1.0);
		} else {
			setSelectedVehicleSpec(null);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onRegister({
			vehicle_model,
			vehicle_no,
			max_seating_cap,
			DL_no,
			insurance_no,
			fuel_consumption_ratio,
		});
	};

	return (
		<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
			<div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>
				<div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-bold shadow-xs">
							<Car className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								Register Vehicle
							</h2>
							<p className="text-xs text-gray-500">
								Verify your personal car to publish employee commute rides
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="overflow-y-auto p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
								Vehicle Make & Model
							</label>
							<select
								required
								value={vehicle_model}
								onChange={handleModelChange}
								className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
							>
								<option value="" disabled>Select vehicle model (2,000+ certified models)</option>
								{vehicleCatalog.map((v) => (
									<option key={v.name} value={v.name}>
										{v.name} ({v.fuel_type})
									</option>
								))}
							</select>
						</div>

						{/* Auto-filled vehicle spec pill */}
						{selectedVehicleSpec && (
							<div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
								<div className="flex items-center gap-2">
									<Check className="w-4 h-4 text-emerald-600" />
									<span className="font-semibold">Auto-detected Specs:</span>
								</div>
								<div className="flex items-center gap-3 text-[11px] font-medium text-emerald-800">
									<span className="flex items-center gap-1">
										<Users className="w-3.5 h-3.5 text-emerald-600" />
										{selectedVehicleSpec.seats} Seats
									</span>
									<span className="flex items-center gap-1">
										<Fuel className="w-3.5 h-3.5 text-emerald-600" />
										{selectedVehicleSpec.fuel_type}
									</span>
									<span className="flex items-center gap-1">
										<Gauge className="w-3.5 h-3.5 text-emerald-600" />
										{selectedVehicleSpec.mileage_kmpl} kmpl
									</span>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Vehicle No (License Plate)
								</label>
								<input
									required
									type="text"
									maxLength={14}
									pattern="[A-Z0-9 -]+"
									value={vehicle_no}
									onChange={(e) => {
										const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 14);
										setVehicleNo(cleaned);
									}}
									placeholder="KA-01-AB-1234"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Passenger Seating Capacity
								</label>
								<input
									required
									type="number"
									min="1"
									max="7"
									value={max_seating_cap}
									onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-semibold"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Driver's License No
								</label>
								<input
									required
									type="text"
									maxLength={18}
									pattern="[A-Z0-9 -]+"
									value={DL_no}
									onChange={(e) => {
										const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 18);
										setDlNo(cleaned);
									}}
									placeholder="DL-0420110012345"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Insurance Policy No
								</label>
								<input
									required
									type="text"
									maxLength={25}
									value={insurance_no}
									onChange={(e) => setInsuranceNo(e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, ''))}
									placeholder="INS-9876543210"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5 md:col-span-2">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Fuel Consumption Ratio (relative to 15 km/l)
								</label>
								<input
									required
									type="number"
									min="0.3"
									max="3.0"
									step="0.05"
									value={fuel_consumption_ratio}
									onChange={(e) => setFuelConsumption(e.target.value)}
									placeholder="1.0"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
								/>
								<p className="text-[11px] text-gray-400">
									Standard ratio is 1.0. Efficient cars (20+ kmpl) are ~0.75, larger SUVs are ~1.30. Used for corporate fuel reimbursement.
								</p>
							</div>
						</div>

						<div className="pt-4">
							<button
								type="submit"
								className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none cursor-pointer"
							>
								Submit Vehicle For Admin Approval
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default VehicleRegistrationModal;
