import React from "react";

// SVG Brand Logos for Top Enterprise Companies
export const CompanyLogos = {
	TCS: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#003366" />
			<text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">
				TCS
			</text>
		</svg>
	),
	Infosys: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#007CC3" />
			<text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif">
				infy
			</text>
		</svg>
	),
	Wipro: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#0B2545" />
			<circle cx="15" cy="15" r="4" fill="#E84855" />
			<circle cx="25" cy="15" r="4" fill="#F9A03F" />
			<circle cx="15" cy="25" r="4" fill="#59CD90" />
			<circle cx="25" cy="25" r="4" fill="#3FA7D6" />
		</svg>
	),
	Google: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
			<path d="M28.5 20.3c0-.7-.1-1.3-.2-1.9H20v3.7h4.8c-.2 1.1-.9 2.1-1.8 2.8v2.3h2.9c1.7-1.6 2.6-3.9 2.6-6.9z" fill="#4285F4" />
			<path d="M20 29c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8h-3v2.3C13.4 26.8 16.4 29 20 29z" fill="#34A853" />
			<path d="M14.9 21.6c-.2-.6-.3-1.3-.3-1.6s.1-1 .3-1.6v-2.3h-3c-.6 1.3-1 2.7-1 4.2s.3 2.9 1 4.2l3-2.9z" fill="#FBBC05" />
			<path d="M20 14.8c1.3 0 2.5.5 3.4 1.4l2.6-2.6C24.4 12.2 22.4 11.5 20 11.5c-3.6 0-6.6 2.2-8.1 5.4l3 2.3c.7-2.2 2.7-4.4 5.1-4.4z" fill="#EA4335" />
		</svg>
	),
	Microsoft: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#18181B" />
			<rect x="11" y="11" width="8" height="8" fill="#F25022" />
			<rect x="21" y="11" width="8" height="8" fill="#7FBA00" />
			<rect x="11" y="21" width="8" height="8" fill="#00A4EF" />
			<rect x="21" y="21" width="8" height="8" fill="#FFB900" />
		</svg>
	),
	Accenture: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#A100FF" />
			<path d="M15 14l8 6-8 6" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	),
	Amazon: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#131921" />
			<text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">
				a
			</text>
			<path d="M12 28c4 3 12 3 16 0" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
		</svg>
	),
	Cognizant: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#0033A0" />
			<text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="sans-serif">
				C
			</text>
		</svg>
	),
	Odoo: () => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#714B67" />
			<text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">
				odoo
			</text>
		</svg>
	),
	Generic: ({ initials = "CORP" }) => (
		<svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
			<rect width="40" height="40" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="1" />
			<text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800" fontFamily="sans-serif">
				{initials.slice(0, 4).toUpperCase()}
			</text>
		</svg>
	),
};

export const POPULAR_TECH_PARKS = [
	{ id: "manyata", name: "Manyata Tech Park", city: "Bangalore", area: "Nagavara Outer Ring Rd", lat: 13.0475, lng: 77.6212 },
	{ id: "ecity", name: "Electronic City Phase 1", city: "Bangalore", area: "Hosur Road", lat: 12.8452, lng: 77.6602 },
	{ id: "ecospace", name: "RMZ Ecospace", city: "Bangalore", area: "Bellandur Outer Ring Rd", lat: 12.9260, lng: 77.6834 },
	{ id: "bagmane", name: "Bagmane Constellation Park", city: "Bangalore", area: "KR Puram - Marathahalli", lat: 12.9868, lng: 77.6974 },
	{ id: "cybercity", name: "DLF Cyber City", city: "Gurgaon", area: "Phase 2 / Rapid Metro", lat: 28.4947, lng: 77.0886 },
	{ id: "mindspace", name: "Mindspace HITEC City", city: "Hyderabad", area: "Madhapur", lat: 17.4399, lng: 78.3806 },
	{ id: "hinjewadi", name: "Hinjewadi IT Park Phase 1", city: "Pune", area: "Rajiv Gandhi Infotech Park", lat: 18.5912, lng: 73.7389 },
	{ id: "bkc", name: "Bandra Kurla Complex (BKC)", city: "Mumbai", area: "Bandra East", lat: 19.0657, lng: 72.8687 },
];

export function getCompanyInfo(identifier) {
	if (!identifier) {
		return {
			name: "Enterprise Partner",
			shortName: "CORP",
			color: "#0F172A",
			borderRing: "border-sky-500",
			badgeBg: "bg-sky-50 text-sky-700",
			Logo: CompanyLogos.Generic,
			defaultTechPark: "Manyata Tech Park"
		};
	}

	const str = identifier.toLowerCase();

	if (str.includes("tcs") || str.includes("tata")) {
		return {
			name: "Tata Consultancy Services",
			shortName: "TCS",
			color: "#003366",
			borderRing: "border-blue-600",
			badgeBg: "bg-blue-900/10 text-blue-800 border-blue-300",
			Logo: CompanyLogos.TCS,
			defaultTechPark: "Manyata Tech Park • Bangalore"
		};
	}
	if (str.includes("infosys") || str.includes("infy")) {
		return {
			name: "Infosys Technologies",
			shortName: "Infosys",
			color: "#007CC3",
			borderRing: "border-sky-500",
			badgeBg: "bg-sky-900/10 text-sky-800 border-sky-300",
			Logo: CompanyLogos.Infosys,
			defaultTechPark: "Electronic City Phase 1 • Bangalore"
		};
	}
	if (str.includes("wipro")) {
		return {
			name: "Wipro Technologies",
			shortName: "Wipro",
			color: "#0B2545",
			borderRing: "border-indigo-500",
			badgeBg: "bg-indigo-900/10 text-indigo-800 border-indigo-300",
			Logo: CompanyLogos.Wipro,
			defaultTechPark: "Sarjapur Road Campus • Bangalore"
		};
	}
	if (str.includes("google")) {
		return {
			name: "Google India",
			shortName: "Google",
			color: "#4285F4",
			borderRing: "border-amber-400",
			badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
			Logo: CompanyLogos.Google,
			defaultTechPark: "Bagmane Constellation Park • Bangalore"
		};
	}
	if (str.includes("microsoft")) {
		return {
			name: "Microsoft India",
			shortName: "Microsoft",
			color: "#00A4EF",
			borderRing: "border-cyan-500",
			badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-300",
			Logo: CompanyLogos.Microsoft,
			defaultTechPark: "Prestige Ferns Galaxy • Bellandur"
		};
	}
	if (str.includes("accenture")) {
		return {
			name: "Accenture India",
			shortName: "Accenture",
			color: "#A100FF",
			borderRing: "border-purple-600",
			badgeBg: "bg-purple-50 text-purple-800 border-purple-300",
			Logo: CompanyLogos.Accenture,
			defaultTechPark: "RMZ Ecospace • Bellandur"
		};
	}
	if (str.includes("amazon")) {
		return {
			name: "Amazon India",
			shortName: "Amazon",
			color: "#FF9900",
			borderRing: "border-amber-500",
			badgeBg: "bg-amber-50 text-amber-900 border-amber-300",
			Logo: CompanyLogos.Amazon,
			defaultTechPark: "World Trade Center • Rajajinagar"
		};
	}
	if (str.includes("cognizant")) {
		return {
			name: "Cognizant",
			shortName: "Cognizant",
			color: "#0033A0",
			borderRing: "border-blue-700",
			badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
			Logo: CompanyLogos.Cognizant,
			defaultTechPark: "Manyata Tech Park • Bangalore"
		};
	}
	if (str.includes("odoo")) {
		return {
			name: "Odoo India",
			shortName: "Odoo",
			color: "#714B67",
			borderRing: "border-fuchsia-700",
			badgeBg: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300",
			Logo: CompanyLogos.Odoo,
			defaultTechPark: "Gandhinagar InfoCity"
		};
	}

	const clean = identifier.replace(/@.*$/, "").replace(/[^a-zA-Z]/g, " ").trim();
	const firstWord = clean.split(" ")[0] || "Corp";
	const formatted = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

	return {
		name: `${formatted} Enterprise`,
		shortName: formatted.toUpperCase().slice(0, 4),
		color: "#1E293B",
		borderRing: "border-teal-500",
		badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
		Logo: ({ initials }) => <CompanyLogos.Generic initials={initials || formatted} />,
		defaultTechPark: "Tech Park Campus"
	};
}
