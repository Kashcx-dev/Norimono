// MakeLyft Corporate Wallet Service
// Connects with backend /wallet endpoints with persistent client caching and real-time event broadcasting

const WALLET_EVENT = "makelyft_wallet_updated";

const DEFAULT_INITIAL_WALLET = {
	balance: 650.0,
	currency: "₹",
	bank_connection: "HDFC Bank (•••• 4821)",
	upi_id: "user@okhdfcbank",
	transactions: [
		{
			id: "TXN-948201",
			type: "credit",
			title: "Monthly Commute Allowance",
			amount: 500.0,
			date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Allowance",
			method: "Corporate Direct Credit",
		},
		{
			id: "TXN-839174",
			type: "debit",
			title: "Carpool to Salt Lake Sector V",
			amount: 45.0,
			date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Ride Fare",
			method: "MakeLyft Wallet",
		},
		{
			id: "TXN-729013",
			type: "credit",
			title: "UPI Top-Up (Google Pay)",
			amount: 200.0,
			date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Top-Up",
			method: "UPI",
		},
		{
			id: "TXN-618492",
			type: "debit",
			title: "Carpool to Park Street Corporate Park",
			amount: 55.0,
			date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Ride Fare",
			method: "MakeLyft Wallet",
		},
	],
};

function getStorageKey(empId) {
	return `makelyft_wallet_${empId || "default"}`;
}

export const getWalletData = async (empId) => {
	const token = localStorage.getItem("token");
	const key = getStorageKey(empId);

	// Try fetching from backend first
	try {
		const response = await fetch("/wallet", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		if (response.ok) {
			const data = await response.json();
			if (data && data.success && data.wallet) {
				localStorage.setItem(key, JSON.stringify(data.wallet));
				return data.wallet;
			}
		}
	} catch (err) {
		console.warn("Backend wallet fetch fallback:", err.message);
	}

	// Fallback to local storage or defaults
	const localData = localStorage.getItem(key);
	if (localData) {
		try {
			return JSON.parse(localData);
		} catch (e) {
			console.error("Failed to parse local wallet:", e);
		}
	}

	// Initialize default wallet state
	localStorage.setItem(key, JSON.stringify(DEFAULT_INITIAL_WALLET));
	return DEFAULT_INITIAL_WALLET;
};

export const addMoneyToWallet = async (empId, amount, paymentMethod = "UPI") => {
	const token = localStorage.getItem("token");
	const key = getStorageKey(empId);
	const numAmount = parseFloat(amount);

	if (isNaN(numAmount) || numAmount <= 0) {
		throw new Error("Please enter a valid amount greater than zero.");
	}

	// Attempt backend sync
	let backendUpdated = false;
	try {
		const response = await fetch("/wallet/add", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				emp_id: empId,
				amount: numAmount,
				payment_method: paymentMethod,
			}),
		});

		if (response.ok) {
			const resData = await response.json();
			if (resData && resData.success) {
				backendUpdated = true;
			}
		}
	} catch (err) {
		console.warn("Backend add money fallback to local state:", err.message);
	}

	// Read current wallet data
	const currentWallet = await getWalletData(empId);
	const newBalance = parseFloat((currentWallet.balance + numAmount).toFixed(2));

	const newTransaction = {
		id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
		type: "credit",
		title: `Wallet Top-Up (${paymentMethod})`,
		amount: numAmount,
		date: new Date().toISOString(),
		status: "Success",
		category: "Top-Up",
		method: paymentMethod,
	};

	const updatedWallet = {
		...currentWallet,
		balance: newBalance,
		transactions: [newTransaction, ...(currentWallet.transactions || [])],
	};

	localStorage.setItem(key, JSON.stringify(updatedWallet));

	// Notify all open UI instances
	window.dispatchEvent(
		new CustomEvent(WALLET_EVENT, {
			detail: {
				empId,
				wallet: updatedWallet,
				balance: newBalance,
				transaction: newTransaction,
			},
		})
	);

	return updatedWallet;
};

export const deductMoneyForRide = async (empId, fare, rideDetails = {}) => {
	const key = getStorageKey(empId);
	const numFare = parseFloat(fare);
	const currentWallet = await getWalletData(empId);

	if (currentWallet.balance < numFare) {
		throw new Error("Insufficient wallet balance. Please add money to continue.");
	}

	const newBalance = parseFloat((currentWallet.balance - numFare).toFixed(2));
	const destinationName =
		rideDetails.destination?.name ||
		rideDetails.destName ||
		"Carpool Destination";

	const newTransaction = {
		id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
		type: "debit",
		title: `Carpool: ${destinationName}`,
		amount: numFare,
		date: new Date().toISOString(),
		status: "Success",
		category: "Ride Fare",
		method: "MakeLyft Wallet",
	};

	const updatedWallet = {
		...currentWallet,
		balance: newBalance,
		transactions: [newTransaction, ...(currentWallet.transactions || [])],
	};

	localStorage.setItem(key, JSON.stringify(updatedWallet));

	// Notify all open UI instances
	window.dispatchEvent(
		new CustomEvent(WALLET_EVENT, {
			detail: {
				empId,
				wallet: updatedWallet,
				balance: newBalance,
				transaction: newTransaction,
			},
		})
	);

	return updatedWallet;
};

export const subscribeToWallet = (callback) => {
	const handler = (e) => {
		if (e.detail && e.detail.wallet) {
			callback(e.detail.wallet);
		}
	};
	window.addEventListener(WALLET_EVENT, handler);
	return () => window.removeEventListener(WALLET_EVENT, handler);
};
