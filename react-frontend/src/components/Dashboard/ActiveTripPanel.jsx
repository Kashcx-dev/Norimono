import React, { useState, useEffect } from "react";
import { showAlert } from "../../utils/alertService";
import {
	Car,
	MapPin,
	Loader2,
	MessageSquare,
	ArrowLeft,
	Clock,
	Calendar,
	CheckCircle2,
	AlertCircle,
	CreditCard,
	Wallet,
	Check,
	Phone,
	Shield,
	ShieldCheck,
	Leaf,
	Sparkles,
	Award,
	Zap,
	Heart,
	Users
} from "lucide-react";
import ChatModal from "./ChatModal";
import { getCompanyInfo } from "../../utils/companyBadges";

// Helper to load Razorpay Checkout SDK dynamically
const loadRazorpaySDK = () => {
	return new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});
};

export default function ActiveTripPanel({
	activeTrip,
	socket,
	onTripEnded,
	onRefreshPassenger,
}) {
	const isDriver = activeTrip.mode === "driver";

	//eslint-disable-next-line
	const [otpInput, setOtpInput] = useState("");
	const [otpInputs, setOtpInputs] = useState({});
	const [bookings, setBookings] = useState(activeTrip.bookings || []);

	const [loading, setLoading] = useState(false);
	//eslint-disable-next-line
	const [status, setStatus] = useState("pending");

	// Local copy of booking status & payment status for passenger
	const [passengerStatus, setPassengerStatus] = useState(
		activeTrip.booking_status || "pending",
	);
	const [paymentStatus, setPaymentStatus] = useState(
		activeTrip.payment_status || "pending",
	);

	// Passenger Wallet balance & insufficient balance state
	const [walletBalance, setWalletBalance] = useState(null);
	const [insufficientError, setInsufficientError] = useState(false);

	const [liveLocation, setLiveLocation] = useState(null);
	const [phase, setPhase] = useState("Waiting for pickup");
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [tripSummary, setTripSummary] = useState(null);

	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const fareAmount = parseFloat(
		activeTrip.ride?.fare_per_seat || activeTrip.fare || 45,
	);

	useEffect(() => {
		if (activeTrip.bookings) {
			//eslint-disable-next-line
			setBookings(activeTrip.bookings);
		}
	}, [activeTrip.bookings]);

	// Sync local passengerStatus & paymentStatus whenever parent passes new activeTrip
	useEffect(() => {
		if (activeTrip.booking_status) {
			//eslint-disable-next-line
			setPassengerStatus(activeTrip.booking_status);
		}
		if (activeTrip.payment_status) {
			setPaymentStatus(activeTrip.payment_status);
		}
	}, [activeTrip.booking_status, activeTrip.payment_status]);

	// Fetch wallet balance for passenger
	const fetchWalletBalance = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const res = await fetch("/wallet", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.wallet) {
				setWalletBalance(parseFloat(data.wallet.balance || 0));
			}
		} catch (err) {
			console.error("Error fetching wallet balance:", err);
		}
	};

	useEffect(() => {
		if (!isDriver) {
			//eslint-disable-next-line
			fetchWalletBalance();
		}
	}, [isDriver, passengerStatus]);

	useEffect(() => {
		if (!socket) return;
		const rideId = activeTrip.ride?.ride_id || activeTrip.ride_id;
		if (rideId) {
			// Join the ride room for live updates
			socket.emit("join_ride_room", { ride_id: rideId });
		}

		// Listen for location updates
		const handleLocationUpdate = (data) => {
			if (data.status === "Arrived") {
				setPhase(
					`Arrived at ${data.phase === "driving" ? "Destination" : "Pickup"}`,
				);
			} else {
				setPhase(
					`Moving to ${data.phase === "driving" ? "Destination" : "Pickup"}`,
				);
			}
			setLiveLocation(data.currentLocation);
		};

		const handleRefreshBookings = async () => {
			if (isDriver) {
				const token = localStorage.getItem("token");
				if (!token) return;
				try {
					const res = await fetch("/rides/driver/active", {
						headers: { Authorization: `Bearer ${token}` },
					});
					const data = await res.json();
					if (data.success && data.ride) {
						setBookings(data.ride.bookings || []);
					}
				} catch (err) {
					console.error("Error fetching active driver ride:", err);
				}
			} else {
				if (onRefreshPassenger) onRefreshPassenger();
			}
		};

		socket.on("location_update", handleLocationUpdate);
		socket.on("driver_refresh_bookings", handleRefreshBookings);

		const handleBookingStatusUpdated = (data) => {
			if (!isDriver) {
				if (data && data.booking_status) {
					setPassengerStatus(data.booking_status);
				}
				if (data && data.payment_status) {
					setPaymentStatus(data.payment_status);
				}
				if (onRefreshPassenger) onRefreshPassenger();
			} else {
				// Driver updates specific booking
				if (data && data.booking_id) {
					setBookings((prev) =>
						prev.map((b) =>
							b.booking_id === data.booking_id
								? {
										...b,
										booking_status:
											data.booking_status || b.booking_status,
										payment_status:
											data.payment_status || b.payment_status,
									}
								: b,
						),
					);
				}
			}
		};

		const handleBookingPaymentUpdated = (data) => {
			if (!isDriver) {
				if (data && data.payment_status) {
					setPaymentStatus(data.payment_status);
				}
				fetchWalletBalance();
				if (onRefreshPassenger) onRefreshPassenger();
			} else {
				if (data && data.booking_id) {
					setBookings((prev) =>
						prev.map((b) =>
							b.booking_id === data.booking_id
								? { ...b, payment_status: data.payment_status }
								: b,
						),
					);
				}
			}
		};

		const handleEnRouteAlert = (data) => {
			if (isDriver) {
				showAlert(
					`⚡ En-Route Pickup: ${data.passenger_name || 'A passenger'} booked a seat along your active route!`,
					"En-Route Passenger Added",
					"info"
				);
				fetchDriverBookings();
			}
		};

		const handleRideFinished = (data) => {
			if (!isDriver) {
				setPassengerStatus("completed");
				setPaymentStatus("completed");
				fetchWalletBalance();
				if (onRefreshPassenger) onRefreshPassenger();
			} else {
				fetchDriverBookings();
			}
		};

		const handleRideCancelled = (data) => {
			showAlert("The driver has cancelled this commute. Any deducted fare has been refunded to your wallet.", "Ride Cancelled", "warning");
			if (onRefreshPassenger) onRefreshPassenger();
		};

		socket.on("booking_status_updated", handleBookingStatusUpdated);
		socket.on("booking_payment_updated", handleBookingPaymentUpdated);
		socket.on("en_route_pickup_alert", handleEnRouteAlert);
		socket.on("ride_finished", handleRideFinished);
		socket.on("ride_cancelled", handleRideCancelled);

		return () => {
			socket.off("location_update", handleLocationUpdate);
			socket.off("driver_refresh_bookings", handleRefreshBookings);
			socket.off("booking_status_updated", handleBookingStatusUpdated);
			socket.off("booking_payment_updated", handleBookingPaymentUpdated);
			socket.off("en_route_pickup_alert", handleEnRouteAlert);
			socket.off("ride_finished", handleRideFinished);
			socket.off("ride_cancelled", handleRideCancelled);
		};
	}, [socket, activeTrip, isDriver, onRefreshPassenger]);

	const handleVerifyOTP = async (booking_id) => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/pickup-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					booking_id: booking_id || activeTrip.booking_id,
					otp: isDriver ? otpInputs[booking_id] : otpInput,
				}),
			});
			const data = await res.json();
			if (data.success) {
				if (isDriver) {
					setBookings((prev) =>
						prev.map((b) =>
							b.booking_id === booking_id
								? { ...b, booking_status: "in_progress" }
								: b,
						),
					);
				} else {
					setStatus("picked_up");
					setPassengerStatus("in_progress");
				}
				showAlert("Passenger Verified! Starting navigation.", "OTP Verified", "success");

				if (socket && activeTrip.ride) {
					const r = activeTrip.ride;
					const getPt = (p) => {
						if (!p) return null;
						if (Array.isArray(p) && p.length >= 2) return [parseFloat(p[0]), parseFloat(p[1])];
						if (p.coords && Array.isArray(p.coords)) return [parseFloat(p.coords[0]), parseFloat(p.coords[1])];
						const lat = parseFloat(p.lat ?? p.latitude);
						const lng = parseFloat(p.lng ?? p.lon ?? p.longitude);
						if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
						return null;
					};
					const start = getPt(r.origin) || [12.9784, 77.6408];
					const end = getPt(r.destination) || [13.0475, 77.6212];

					socket.emit("start_tracking", {
						ride_id: r.ride_id,
						startCoords: start,
						endCoords: end,
						phase: "driving",
					});
				}
			} else {
				showAlert(data.message || "Invalid OTP", "Verification Failed", "error");
			}
		} catch (err) {
			console.error(err);
			showAlert("Error verifying OTP", "OTP Error", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleDropOff = async (booking_id) => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/drop-passenger", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					booking_id: booking_id || activeTrip.booking_id,
				}),
			});
			const data = await res.json();
			if (data.success) {
				if (isDriver) {
					setBookings((prev) =>
						prev.map((b) =>
							b.booking_id === booking_id
								? {
										...b,
										booking_status: "completed",
										payment_status: "pending",
									}
								: b,
						),
					);
				} else {
					setStatus("dropped_off");
					setPassengerStatus("completed");
					setPaymentStatus("pending");
				}
				showAlert(
					"Passenger dropped off successfully! Passenger will now see payment options.",
					"Drop-off Complete", "success"
				);
			} else {
				showAlert(data.message || "Error dropping off", "Drop-off Error", "error");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// 1. Pay with Norimono Wallet
	const handlePassengerPayWithWallet = async () => {
		setLoading(true);
		setInsufficientError(false);
		const token = localStorage.getItem("token");

		// If local balance is known and lower than fare, prompt user directly
		if (walletBalance !== null && walletBalance < fareAmount) {
			setInsufficientError(true);
			setLoading(false);
			return;
		}

		try {
			const res = await fetch("/rides/passenger/pay", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					booking_id: activeTrip.booking_id,
					payment_method: "wallet",
				}),
			});
			const data = await res.json();

			if (data.success) {
				setPaymentStatus("paid_pending_confirmation");
				showAlert(
					`Payment of ₹${fareAmount} completed via Norimono Wallet! Awaiting driver confirmation.`,
					"Payment Successful", "success"
				);
				fetchWalletBalance();
				if (onRefreshPassenger) onRefreshPassenger();
			} else if (data.insufficient_balance) {
				setInsufficientError(true);
				if (data.current_balance !== undefined) {
					setWalletBalance(data.current_balance);
				}
			} else {
				showAlert(data.message || "Payment failed", "Payment Error", "error");
			}
		} catch (err) {
			console.error("Wallet payment error:", err);
			showAlert("Network error processing wallet payment.", "Payment Error", "error");
		} finally {
			setLoading(false);
		}
	};

	// 2. Pay via Razorpay Checkout
	const handlePassengerPayWithRazorpay = async () => {
		setLoading(true);
		setInsufficientError(false);
		const token = localStorage.getItem("token");

		try {
			// 1. Ensure Razorpay SDK is loaded
			const sdkLoaded = await loadRazorpaySDK();
			if (!sdkLoaded) {
				showAlert(
					"Razorpay payment gateway failed to load. Please check your internet connection.",
					"Payment Gateway Error", "error"
				);
				setLoading(false);
				return;
			}

			// 2. Create Razorpay order on backend
			const orderRes = await fetch("/wallet/create-order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ amount: fareAmount }),
			});
			const orderData = await orderRes.json();
			if (!orderData.success || !orderData.order) {
				throw new Error(
					orderData.error || "Failed to initiate Razorpay order",
				);
			}

			// 3. Fetch Razorpay key
			const keyRes = await fetch("/wallet/razorpay-key", {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const keyData = await keyRes.json();
			const rzpKey = keyData.key || "rzp_test_TNL00OmyvvcPZE";

			// 4. Open Razorpay Checkout modal
			const options = {
				key: rzpKey,
				amount: orderData.order.amount,
				currency: orderData.order.currency || "INR",
				name: "Norimono Commute",
				description: `Payment for Ride #${activeTrip.booking_id || activeTrip.ride?.ride_id || ""}`,
				order_id: orderData.order.id,
				prefill: {
					name: user.name || "Passenger",
					email: user.email || "passenger@odoo.com",
					contact: user.phone || "9876543210",
				},
				theme: {
					color: "#714B67",
				},
				modal: {
					ondismiss: () => {
						setLoading(false);
					},
				},
				handler: async function (response) {
					try {
						// 5. Verify payment signature on backend
						await fetch("/wallet/verify-payment", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								...(token ? { Authorization: `Bearer ${token}` } : {}),
							},
							body: JSON.stringify({
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_order_id: response.razorpay_order_id,
								razorpay_signature: response.razorpay_signature,
							}),
						});

						// 6. Complete passenger payment for this ride booking
						const payRes = await fetch("/rides/passenger/pay", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${token}`,
							},
							body: JSON.stringify({
								booking_id: activeTrip.booking_id,
								payment_method: "razorpay",
								razorpay_payment_id: response.razorpay_payment_id,
							}),
						});
						const payData = await payRes.json();

						if (payData.success) {
							setPaymentStatus("paid_pending_confirmation");
							showAlert(
								`Payment of ₹${fareAmount} completed via Razorpay! Awaiting driver confirmation.`,
								"Payment Successful", "success"
							);
							if (onRefreshPassenger) onRefreshPassenger();
						} else {
							setPaymentStatus("paid_pending_confirmation");
							if (onRefreshPassenger) onRefreshPassenger();
						}
					} catch (verifyErr) {
						console.error("Payment confirmation error:", verifyErr);
						setPaymentStatus("paid_pending_confirmation");
						if (onRefreshPassenger) onRefreshPassenger();
					} finally {
						setLoading(false);
					}
				},
			};

			const rzp = new window.Razorpay(options);
			rzp.on("payment.failed", function (response) {
				showAlert(
					`Payment failed: ${response.error?.description || "Transaction declined"}`,
					"Payment Failed", "error"
				);
				setLoading(false);
			});
			rzp.open();
		} catch (err) {
			console.error("Razorpay initiation error:", err);
			showAlert(
				`Could not open Razorpay: ${err.message || "Please try again."}`,
				"Razorpay Error", "error"
			);
			setLoading(false);
		}
	};

	const handleDriverConfirmPayment = async (booking_id) => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/rides/driver/confirm-payment", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ booking_id }),
			});
			const data = await res.json();
			if (data.success) {
				setBookings((prev) =>
					prev.map((b) =>
						b.booking_id === booking_id
							? { ...b, payment_status: "completed" }
							: b,
					),
				);
				showAlert(
					data.message ||
						"Payment confirmed and credited to your commute wallet!",
					"Payment Confirmed", "success"
				);
			} else {
				showAlert(data.message || "Error confirming payment", "Confirmation Error", "error");
			}
		} catch (err) {
			console.error(err);
			showAlert("Network error confirming payment.", "Network Error", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptBooking = async (booking_id) => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/rides/driver/booking/accept", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ booking_id }),
			});
			const data = await res.json();
			if (data.success) {
				setBookings((prev) =>
					prev.map((b) =>
						b.booking_id === booking_id
							? { ...b, booking_status: "confirmed" }
							: b,
					),
				);
			} else {
				showAlert(data.message || "Error accepting booking", "Booking Error", "error");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleDeclineBooking = async (booking_id) => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/rides/driver/booking/decline", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ booking_id }),
			});
			const data = await res.json();
			if (data.success) {
				setBookings((prev) =>
					prev.map((b) =>
						b.booking_id === booking_id
							? { ...b, booking_status: "cancelled" }
							: b,
					),
				);
			} else {
				showAlert(data.message || "Error declining booking", "Booking Error", "error");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleFinishTrip = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/finish-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ ride_id: activeTrip.ride.ride_id }),
			});
			const data = await res.json();
			if (data.success) {
				showAlert("Commute trip completed! Passenger fares & corporate subsidies settled to your wallet.", "Trip Completed", "success");
				setTripSummary({
					earnings: data.earnings || (parseFloat(data.fares_collected || 0) + parseFloat(data.company_subsidy || 0)),
					fares_collected: data.fares_collected || 0,
					company_subsidy: data.company_subsidy || 0,
					coworkersCount: bookings.filter((b) => b.booking_status === "completed" || b.booking_status === "in_progress").length || Math.max(1, bookings.length),
					distanceKm: 12.8,
					co2SavedKg: (Math.max(1, bookings.length) * 2.8).toFixed(1),
					parkingSaved: 1
				});
			} else {
				showAlert(data.message || "Error finishing trip", "Trip Error", "error");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// Determine header color theme & label based on state
	let headerTheme = {
		bg: "bg-amber-50/80 border-amber-100",
		title: "Seat Request Pending",
		titleColor: "text-amber-950",
		chipBg: "bg-amber-100/80 text-amber-900 border-amber-200",
		chipLabel: "Awaiting Driver Confirmation",
	};

	if (isDriver) {
		headerTheme = {
			bg: "bg-teal-50/80 border-teal-100",
			title: "Driver Dashboard",
			titleColor: "text-teal-950",
			chipBg: "bg-teal-100 text-teal-800 border-teal-200",
			chipLabel: "Active Route Scheduled",
		};
	} else if (passengerStatus === "confirmed") {
		headerTheme = {
			bg: "bg-emerald-50/80 border-emerald-100",
			title: "Ride Confirmed!",
			titleColor: "text-emerald-950",
			chipBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
			chipLabel: "Driver Accepted",
		};
	} else if (passengerStatus === "in_progress") {
		headerTheme = {
			bg: "bg-cyan-50/80 border-cyan-100",
			title: "Trip In Progress",
			titleColor: "text-cyan-950",
			chipBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
			chipLabel: "En Route to Destination",
		};
	} else if (passengerStatus === "completed") {
		if (paymentStatus === "completed") {
			headerTheme = {
				bg: "bg-emerald-50/80 border-emerald-100",
				title: "Trip & Payment Completed!",
				titleColor: "text-emerald-950",
				chipBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
				chipLabel: "Payment Confirmed by Driver",
			};
		} else if (paymentStatus === "paid_pending_confirmation") {
			headerTheme = {
				bg: "bg-blue-50/80 border-blue-100",
				title: "Payment Submitted",
				titleColor: "text-blue-950",
				chipBg: "bg-blue-100 text-blue-800 border-blue-200",
				chipLabel: "Awaiting Driver Confirmation",
			};
		} else {
			headerTheme = {
				bg: "bg-purple-50/80 border-purple-100",
				title: "Arrived at Dropoff!",
				titleColor: "text-purple-950",
				chipBg: "bg-purple-100 text-purple-800 border-purple-200",
				chipLabel: "Payment Pending",
			};
		}
	}

	const hasInsufficientWallet =
		walletBalance !== null && walletBalance < fareAmount;

	// Trip Summary Card rendered on trip completion for driver
	if (tripSummary) {
		return (
			<div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden text-left p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
				<div className="text-center space-y-2 pt-2">
					<div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
						<CheckCircle2 className="w-8 h-8" />
					</div>
					<h3 className="text-lg font-black text-slate-900 tracking-tight">
						Commute Completed!
					</h3>
					<p className="text-xs text-slate-500 max-w-xs mx-auto">
						Fares and enterprise green subsidies have been settled directly to your Norimono wallet.
					</p>
				</div>

				{/* Earnings Breakdown Card */}
				<div className="bg-gradient-to-br from-purple-50 via-white to-teal-50 border border-purple-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
					<div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
						<span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
							<Wallet className="w-3.5 h-3.5 text-[#714B67]" /> Total Credited
						</span>
						<span className="text-2xl font-black text-[#714B67] font-mono">
							+₹{tripSummary.earnings}
						</span>
					</div>

					<div className="space-y-1.5 text-xs">
						<div className="flex justify-between items-center text-slate-600">
							<span>Colleague Cost-Shares:</span>
							<span className="font-bold text-slate-900 font-mono">₹{tripSummary.fares_collected}</span>
						</div>
						<div className="flex justify-between items-center text-emerald-700">
							<span className="flex items-center gap-1">
								<Sparkles className="w-3 h-3 text-emerald-600" />
								Enterprise Green Subsidy:
							</span>
							<span className="font-bold font-mono">+₹{tripSummary.company_subsidy}</span>
						</div>
					</div>
				</div>

				{/* ESG & Sustainability Metric Cards */}
				<div className="grid grid-cols-3 gap-2 text-center">
					<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
						<Users className="w-4 h-4 text-teal-600 mx-auto mb-1" />
						<div className="text-base font-black text-slate-900">{tripSummary.coworkersCount}</div>
						<span className="text-[10px] text-slate-500 font-bold uppercase">Coworkers</span>
					</div>
					<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
						<Leaf className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
						<div className="text-base font-black text-slate-900">{tripSummary.co2SavedKg} kg</div>
						<span className="text-[10px] text-slate-500 font-bold uppercase">CO₂ Cut</span>
					</div>
					<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
						<Car className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
						<div className="text-base font-black text-slate-900">{tripSummary.parkingSaved}</div>
						<span className="text-[10px] text-slate-500 font-bold uppercase">Spot Freed</span>
					</div>
				</div>

				<div className="pt-2">
					<button
						onClick={onTripEnded}
						className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
					>
						<span>Return to Commute Home</span>
						<ArrowLeft className="w-3.5 h-3.5 rotate-180" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-left">
			{/* Top Header */}
			<div
				className={`p-4 border-b flex items-center justify-between transition-colors duration-300 ${headerTheme.bg}`}
			>
				<div>
					<div className="flex items-center gap-2">
						<h2
							className={`text-base font-extrabold ${headerTheme.titleColor}`}
						>
							{headerTheme.title}
						</h2>
						<span
							className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${headerTheme.chipBg}`}
						>
							{headerTheme.chipLabel}
						</span>
					</div>
					<p className="text-xs text-gray-600 mt-0.5">
						{phase}{" "}
						{liveLocation
							? `(GPS: ${liveLocation[0].toFixed(3)}, ${liveLocation[1].toFixed(3)})`
							: ""}
					</p>
				</div>
				<button
					onClick={onTripEnded}
					className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
				>
					<ArrowLeft className="w-3.5 h-3.5 text-[#714B67]" />
					<span>Exit</span>
				</button>
			</div>

			{/* Scrollable Body Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Ride Details Card */}
				<div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 relative">
					<button
						onClick={() => setIsChatOpen(true)}
						className="absolute top-3.5 right-3.5 bg-white border border-gray-200 hover:border-[#714B67] hover:text-[#714B67] text-gray-700 px-2.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
					>
						<MessageSquare className="w-3.5 h-3.5 text-[#00A09D]" />
						<span>Chat</span>
					</button>

					<div className="flex items-center gap-3 mb-3 pr-20">
						<div className="w-10 h-10 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold text-base shrink-0 border border-[#714B67]/20">
							<Car className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-bold text-gray-900 truncate">
								{isDriver
									? "Your Published Route"
									: `Driver: ${activeTrip.ride?.driver_name || "Rahul M."}`}
							</p>
							<p className="text-xs text-gray-500 truncate">
								{activeTrip.ride?.vehicle_model || "Swift Dzire"} •{" "}
								{activeTrip.ride?.veh_no || "WB 02 AB 1234"}
							</p>
							<div className="flex items-center gap-2 mt-1">
								{!isDriver && (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#00A09D] text-[10px] font-extrabold">
										💺 {activeTrip.seat_no || "Seat #1"}
									</span>
								)}
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[#714B67] text-[10px] font-extrabold">
									Fare: ₹{fareAmount}
								</span>
							</div>
						</div>
					</div>

					<div className="space-y-2 text-xs text-gray-700 pt-2 border-t border-gray-200/80">
						<div className="flex items-start gap-2">
							<MapPin className="w-3.5 h-3.5 text-[#00A09D] shrink-0 mt-0.5" />
							<span className="font-semibold truncate">
								Pickup:{" "}
								{typeof activeTrip.ride?.origin === "string"
									? activeTrip.ride.origin
									: activeTrip.ride?.origin?.name ||
										activeTrip.ride?.origin?.address ||
										"Pickup Point"}
							</span>
						</div>
						<div className="flex items-start gap-2">
							<MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
							<span className="font-semibold truncate">
								Dropoff:{" "}
								{typeof activeTrip.ride?.destination === "string"
									? activeTrip.ride.destination
									: activeTrip.ride?.destination?.name ||
										activeTrip.ride?.destination?.address ||
										"Dropoff Point"}
							</span>
						</div>
					</div>
				</div>

				{/* Rich Time Slot Info */}
				<div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-pink-50/30 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
							<Clock className="w-4 h-4" />
						</div>
						<div>
							<p className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
								Departure Time Slot
							</p>
							<p className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
								<Calendar className="w-3 h-3 text-indigo-500" />
								{activeTrip.ride?.departure_time || "Today, 9:30 AM"}
							</p>
						</div>
					</div>
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
						Fare: ₹{fareAmount}
					</span>
				</div>

				{/* Passenger Specific View */}
				{!isDriver && (
					<div className="space-y-4">
						{/* OTP Section (visible when not yet dropped off / completed) */}
						{activeTrip.otp &&
							passengerStatus !== "in_progress" &&
							passengerStatus !== "completed" && (
								<div
									className={`rounded-xl p-4 text-center space-y-1.5 border-2 border-dashed ${
										passengerStatus === "confirmed"
											? "bg-teal-50/90 border-teal-300"
											: "bg-amber-50/90 border-amber-300"
									}`}
								>
									<p
										className={`text-[10px] font-extrabold uppercase tracking-widest ${
											passengerStatus === "confirmed"
												? "text-teal-800"
												: "text-amber-800"
										}`}
									>
										{passengerStatus === "confirmed"
											? "✅ Booking Confirmed — Share OTP with Driver"
											: "⏳ Awaiting Driver Confirmation — Your Pickup OTP"}
									</p>
									<div
										className={`text-3xl font-mono font-black tracking-widest ${
											passengerStatus === "confirmed"
												? "text-[#00A09D]"
												: "text-amber-600"
										}`}
									>
										{activeTrip.otp}
									</div>
									<p
										className={`text-[11px] ${
											passengerStatus === "confirmed"
												? "text-teal-700"
												: "text-amber-700"
										}`}
									>
										{passengerStatus === "confirmed"
											? "Driver has accepted! Share this 4-digit OTP at pickup to start the ride."
											: "Your request is sent to the driver. Once approved, give this OTP at vehicle boarding."}
									</p>
								</div>
							)}

						{/* PASSENGER PAYMENT SECTION (Triggered on Drop-off / Completion) */}
						{passengerStatus === "completed" && (
							<div className="p-4 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-pink-50/40 shadow-sm space-y-3.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-[#714B67] text-white flex items-center justify-center font-bold">
											<CreditCard className="w-4 h-4" />
										</div>
										<div>
											<h4 className="text-xs font-bold text-gray-900">
												Trip Payment
											</h4>
											<p className="text-[10px] text-gray-500">
												Select preferred payment method
											</p>
										</div>
									</div>
									<div className="text-right">
										<span className="text-base font-extrabold text-[#714B67]">
											₹{fareAmount}
										</span>
										{walletBalance !== null && (
											<p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end">
												<Wallet className="w-3 h-3 text-[#00A09D]" />
												Wallet:{" "}
												<span className="font-semibold text-gray-700">
													₹{walletBalance.toFixed(2)}
												</span>
											</p>
										)}
									</div>
								</div>

								{/* Payment Status Switch */}
								{paymentStatus === "completed" ? (
									<div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5">
										<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
										<div>
											<p className="text-xs font-bold text-emerald-900">
												Payment Confirmed by Driver!
											</p>
											<p className="text-[10px] text-emerald-700">
												₹{fareAmount} settled successfully.
											</p>
										</div>
									</div>
								) : paymentStatus === "paid_pending_confirmation" ? (
									<div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-2.5">
										<Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
										<div>
											<p className="text-xs font-bold text-blue-900">
												Payment Submitted (₹{fareAmount})
											</p>
											<p className="text-[10px] text-blue-700">
												Waiting for driver to confirm receipt on
												their dashboard.
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-3 pt-1">
										{/* Insufficient Wallet Balance Alert */}
										{(insufficientError ||
											(walletBalance !== null &&
												hasInsufficientWallet)) && (
											<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
												<AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
												<div className="text-xs text-amber-900">
													<p className="font-bold">
														Insufficient Wallet Balance
													</p>
													<p className="text-[11px] text-amber-800 mt-0.5">
														Your wallet has{" "}
														<b>
															₹
															{walletBalance !== null
																? walletBalance.toFixed(2)
																: "0.00"}
														</b>
														, but the fare is <b>₹{fareAmount}</b>
														. Please pay using Razorpay / UPI
														below.
													</p>
												</div>
											</div>
										)}

										<p className="text-[11px] text-gray-600">
											You have reached your destination. Choose your
											payment method below:
										</p>

										{/* Option 1: Pay with Norimono Wallet */}
										<button
											onClick={handlePassengerPayWithWallet}
											disabled={loading}
											className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-between gap-2 border cursor-pointer ${
												hasInsufficientWallet
													? "bg-gray-100 hover:bg-gray-200/80 text-gray-600 border-gray-200"
													: "bg-teal-600 hover:bg-teal-700 text-white border-teal-700"
											}`}
										>
											<div className="flex items-center gap-2">
												<Wallet className="w-4 h-4 text-emerald-200" />
												<span>Pay with Wallet Balance</span>
											</div>
											<span className="text-[11px] font-semibold opacity-90">
												{walletBalance !== null
													? hasInsufficientWallet
														? `(Low: ₹${walletBalance.toFixed(2)})`
														: `(Bal: ₹${walletBalance.toFixed(2)})`
													: `₹${fareAmount}`}
											</span>
										</button>

										{/* Option 2: Pay via Razorpay (UPI / Card / NetBanking) */}
										<button
											onClick={handlePassengerPayWithRazorpay}
											disabled={loading}
											className="w-full bg-[#714B67] hover:bg-[#5c3c54] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-between gap-2 border border-[#5c3c54] cursor-pointer"
										>
											<div className="flex items-center gap-2">
												<CreditCard className="w-4 h-4 text-pink-200" />
												<span>Pay via Razorpay / UPI / Cards</span>
											</div>
											<span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
												₹{fareAmount}
											</span>
										</button>
									</div>
								)}
							</div>
						)}

						{/* Live Trip Status Stepper */}
						<div className="p-4 border border-gray-200 rounded-xl bg-white shadow-2xs">
							<h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-3.5 flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-[#00A09D]" />
								Live Trip Progress
							</h3>
							<div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-100">
								{[
									{
										label: "Ride Booked",
										active: true,
										sub: "Request sent to vehicle owner",
									},
									{
										label: "Driver Confirmed",
										active: [
											"confirmed",
											"in_progress",
											"completed",
										].includes(passengerStatus),
										sub: "Driver accepted your seat request",
									},
									{
										label: "Trip Started & OTP Verified",
										active: ["in_progress", "completed"].includes(
											passengerStatus,
										),
										sub: "Passenger boarded vehicle",
									},
									{
										label: "Trip In Progress",
										active: ["in_progress", "completed"].includes(
											passengerStatus,
										),
										sub: "En route to destination",
									},
									{
										label: "Trip Completed (Dropoff)",
										active: passengerStatus === "completed",
										sub: "Arrived safely at dropoff",
									},
									{
										label: "Payment Completed",
										active: paymentStatus === "completed",
										sub:
											paymentStatus === "completed"
												? "Confirmed & credited to driver"
												: paymentStatus ===
													  "paid_pending_confirmation"
													? "Payment submitted, waiting driver confirmation"
													: "Payment pending from passenger",
									},
								].map((step, idx) => (
									<div
										key={idx}
										className="relative flex items-start gap-3"
									>
										<div
											className={`z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 shrink-0 mt-0.5 shadow-2xs ${
												step.active
													? "bg-[#00A09D] border-[#00A09D] text-white"
													: "bg-white border-gray-200 text-gray-400"
											}`}
										>
											{step.active ? "✓" : idx + 1}
										</div>
										<div className="min-w-0">
											<p
												className={`text-xs font-bold transition-all duration-300 ${
													step.active
														? "text-gray-900"
														: "text-gray-400"
												}`}
											>
												{step.label}
											</p>
											<p className="text-[10px] text-gray-500">
												{step.sub}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Driver Specific View */}
				{isDriver && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
								Passenger Requests ({bookings.length})
							</h3>
							<span className="text-[11px] text-[#00A09D] font-bold">
								{
									bookings.filter(
										(b) =>
											b.booking_status === "confirmed" ||
											b.booking_status === "in_progress" ||
											b.booking_status === "completed",
									).length
								}{" "}
								Active
							</span>
						</div>

						{bookings.length === 0 && (
							<div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
								Waiting for colleagues to book seats on your route...
							</div>
						)}

						{bookings.map((booking) => {
							const bookingFare = booking.fare_per_seat || fareAmount;
							const compInfo = getCompanyInfo(booking.org_name || booking.passenger_email || "Enterprise");
							const PassengerLogo = compInfo.Logo;
							const isFemalePassenger = booking.gender === "female";

							return (
								<div
									key={booking.booking_id}
									className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 transition-all hover:border-slate-300"
								>
									{/* Passenger Profile Header: Framed by company logo */}
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2.5">
											<div className="relative shrink-0">
												<div className={`w-10 h-10 rounded-xl bg-white p-0.5 shadow-2xs border-2 ${compInfo.borderRing} flex items-center justify-center`}>
													<div className="w-full h-full rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
														{booking.passenger_name ? booking.passenger_name.charAt(0).toUpperCase() : "P"}
													</div>
												</div>
												<div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-white shadow-2xs border border-white flex items-center justify-center p-0.5">
													<PassengerLogo />
												</div>
											</div>

											<div className="min-w-0">
												<div className="flex items-center gap-1.5 flex-wrap">
													<span className="font-extrabold text-xs text-slate-900 truncate">
														{booking.passenger_name || "Colleague"}
													</span>
													<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Corporate Verified" />
													{isFemalePassenger && (
														<span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
															<Heart className="w-2 h-2 fill-rose-500" /> Female
														</span>
													)}
													{booking.is_en_route && (
														<span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-[#714B67] border border-purple-200">
															⚡ En-Route
														</span>
													)}
												</div>
												<p className="text-[10px] text-slate-500 truncate">
													{booking.designation || booking.department || compInfo.shortName} • <span className="font-semibold text-slate-700">{compInfo.shortName}</span>
												</p>
											</div>
										</div>

										<div className="flex items-center gap-1.5 shrink-0">
											{booking.passenger_phone && (
												<a
													href={`tel:${booking.passenger_phone}`}
													className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
													title={`Call ${booking.passenger_name}`}
												>
													<Phone className="w-3 h-3" />
												</a>
											)}
											<span
												className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
													booking.booking_status === "confirmed"
														? "bg-amber-50 text-amber-800 border-amber-200"
														: booking.booking_status === "in_progress"
															? "bg-teal-50 text-teal-800 border-teal-200"
															: booking.booking_status === "completed"
																? "bg-emerald-50 text-emerald-800 border-emerald-200"
																: "bg-slate-50 text-slate-700 border-slate-200"
												}`}
											>
												{booking.booking_status === "confirmed"
													? "Awaiting Boarding"
													: booking.booking_status === "in_progress"
														? "On Board"
														: booking.booking_status === "completed"
															? "Dropped Off"
															: booking.booking_status || "Pending"}
											</span>
										</div>
									</div>

									{/* Pickup & Dropoff Route Details */}
									<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700 space-y-1.5">
										<div className="flex items-start gap-2">
											<div className="w-2 h-2 rounded-full bg-teal-500 mt-1 shrink-0"></div>
											<div className="truncate min-w-0">
												<span className="text-[9px] uppercase font-bold text-slate-400 block">Pickup</span>
												<span className="font-semibold truncate block">
													{typeof booking.pickup_location === "string" 
														? booking.pickup_location 
														: booking.pickup_location?.name || booking.pickup_location?.address || "Pickup Point"}
												</span>
											</div>
										</div>
										<div className="flex items-start gap-2">
											<div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></div>
											<div className="truncate min-w-0">
												<span className="text-[9px] uppercase font-bold text-slate-400 block">Dropoff</span>
												<span className="font-semibold truncate block">
													{typeof booking.dropoff_location === "string" 
														? booking.dropoff_location 
														: booking.dropoff_location?.name || booking.dropoff_location?.address || "Dropoff Point"}
												</span>
											</div>
										</div>
									</div>

									{/* Cost Share Info */}
									<div className="flex items-center justify-between text-[11px] px-1 text-slate-600">
										<span className="flex items-center gap-1 font-medium">
											<Wallet className="w-3 h-3 text-[#714B67]" /> Fuel Cost-Share:
										</span>
										<span className="font-bold text-[#714B67] font-mono">
											₹{bookingFare}.00
										</span>
									</div>

									{/* Driver Actions based on Passenger Status */}
									{booking.booking_status === "pending" && (
										<div className="flex gap-2 pt-2 border-t border-slate-100">
											<button
												onClick={() =>
													handleAcceptBooking(booking.booking_id)
												}
												disabled={loading}
												className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all py-2 cursor-pointer flex items-center justify-center gap-1"
											>
												{loading ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
												) : (
													<>
														<Check className="w-3.5 h-3.5" /> Accept Passenger
													</>
												)}
											</button>
											<button
												onClick={() =>
													handleDeclineBooking(booking.booking_id)
												}
												disabled={loading}
												className="flex-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl font-bold text-xs transition-all py-2 cursor-pointer"
											>
												{loading ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
												) : (
													"Decline"
												)}
											</button>
										</div>
									)}

									{booking.booking_status === "confirmed" && (
										<div className="space-y-1.5 pt-2 border-t border-slate-100">
											<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
												Enter Passenger 4-Digit Boarding OTP
											</label>
											<div className="flex gap-2">
												<input
													type="text"
													placeholder="0000"
													value={otpInputs[booking.booking_id] || ""}
													onChange={(e) =>
														setOtpInputs((prev) => ({
															...prev,
															[booking.booking_id]: e.target.value,
														}))
													}
													maxLength={4}
													className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-sm font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
												/>
												<button
													onClick={() =>
														handleVerifyOTP(booking.booking_id)
													}
													disabled={
														loading ||
														(otpInputs[booking.booking_id]?.length ||
															0) < 4
													}
													className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs shadow-xs transition-all py-2 cursor-pointer flex items-center justify-center gap-1.5"
												>
													{loading ? (
														<Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
													) : (
														<>
															<ShieldCheck className="w-3.5 h-3.5" /> Verify & Board
														</>
													)}
												</button>
											</div>
										</div>
									)}

									{booking.booking_status === "in_progress" && (
										<div className="pt-2 border-t border-slate-100">
											<button
												onClick={() =>
													handleDropOff(booking.booking_id)
												}
												disabled={loading}
												className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex justify-center items-center gap-1.5 cursor-pointer"
											>
												{loading ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : (
													<>
														<MapPin className="w-3.5 h-3.5" /> Drop Off Colleague
													</>
												)}
											</button>
										</div>
									)}

									{/* PAYMENT CONFIRMATION FOR DRIVER */}
									{booking.booking_status === "completed" && (
										<div className="pt-2 border-t border-slate-100">
											{booking.payment_status === "completed" ? (
												<div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold">
													<span className="flex items-center gap-1.5">
														<CheckCircle2 className="w-4 h-4 text-emerald-600" />
														Payment Settled to Wallet
													</span>
													<span className="font-extrabold text-emerald-950 font-mono">
														+₹{bookingFare}
													</span>
												</div>
											) : booking.payment_status === "paid_pending_confirmation" ? (
												<div className="space-y-2">
													<div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between text-xs text-blue-800">
														<span className="font-semibold">
															Passenger Paid:
														</span>
														<span className="font-extrabold text-blue-950 font-mono">
															₹{bookingFare}
														</span>
													</div>
													<button
														onClick={() =>
															handleDriverConfirmPayment(
																booking.booking_id,
															)
														}
														disabled={loading}
														className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
													>
														{loading ? (
															<Loader2 className="w-3.5 h-3.5 animate-spin" />
														) : (
															<>
																<Check className="w-4 h-4" />
																Confirm Receipt (+₹{bookingFare})
															</>
														)}
													</button>
												</div>
											) : (
												<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center text-[11px] text-slate-500 font-medium">
													Dropped off • Waiting for auto wallet debit (₹{bookingFare})
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}

						<div className="pt-3 border-t border-slate-200">
							<button
								onClick={handleFinishTrip}
								disabled={loading}
								className="w-full bg-gradient-to-r from-[#714B67] to-purple-800 hover:from-[#5c3c54] hover:to-purple-900 text-white py-3 rounded-2xl font-black text-xs shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
							>
								{loading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<>
										<Sparkles className="w-4 h-4 text-amber-300" />
										<span>Complete Commute & Settle All Earnings</span>
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>

			<ChatModal
				isOpen={isChatOpen}
				onClose={() => setIsChatOpen(false)}
				socket={socket}
				activeTrip={activeTrip}
				user={user}
			/>
		</div>
	);
}
