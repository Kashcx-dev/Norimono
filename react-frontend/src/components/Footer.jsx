import React from "react";
import { Car } from "lucide-react";

const Footer = () => {
	return (
		<footer className="bg-white border-t border-zinc-200 pt-8 pb-6 mt-auto w-full">
			<div className="max-w-7xl mx-auto px-6">
				<div className="flex flex-col md:flex-row justify-between items-center gap-6">
					{/* Logo / Branding */}
					<div className="flex flex-col items-center md:items-start">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-yellow-400 font-black shadow-xs">
								<Car className="w-4 h-4 fill-yellow-400" />
							</div>
							<span className="text-xl font-black tracking-tight text-black">
								Nori<span className="text-yellow-500">mono</span>
							</span>
						</div>
						<span className="text-zinc-400 text-[10px] uppercase tracking-[0.25em] mt-1 font-bold">
							Verified Enterprise Commute Network
						</span>
					</div>

					{/* Navigation / Links */}
					<div className="flex gap-6 items-center text-xs font-semibold text-zinc-500">
						<a href="#features" className="hover:text-black transition-colors">Features</a>
						<a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
						<a href="#safety" className="hover:text-black transition-colors">Safety Shield</a>
						<a href="#support" className="hover:text-black transition-colors">Support Desk</a>
					</div>
				</div>

				<div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-400">
					<span>&copy; {new Date().getFullYear()} Norimono Enterprise Mobility. All rights reserved.</span>
					<div className="flex gap-4 font-medium">
						<a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
						<a href="#" className="hover:text-black transition-colors">Terms of Service</a>
						<a href="#" className="hover:text-black transition-colors">Safety Standards</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
