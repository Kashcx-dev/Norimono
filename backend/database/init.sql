-- Drop existing tables to ensure a clean slate if re-run
DROP TABLE IF EXISTS rider_verifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS org_settings CASCADE;

-- Organization Settings (Admin configuration)
CREATE TABLE org_settings (
    id SERIAL PRIMARY KEY,
    org_name VARCHAR(100) UNIQUE NOT NULL,
    fuel_cost_per_km DECIMAL(5, 2) DEFAULT 0.00,
    travel_cost_per_km DECIMAL(5, 2) DEFAULT 0.00,
    max_rides_per_day INT DEFAULT 5,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO org_settings (org_name, fuel_cost_per_km, travel_cost_per_km) VALUES ('Odoo', 5.50, 2.00);

-- Users Table (Profile)
CREATE TABLE users (
    emp_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    org_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL DEFAULT 'employee',
    rider_type VARCHAR(20) NOT NULL DEFAULT 'passenger', -- 'passenger' or 'rider'
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    is_vehicle_registered VARCHAR(1) DEFAULT '0',
    passenger_rating DECIMAL(3, 2) DEFAULT 5.00,
    driving_rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rider / Driver Verification Applications (Pending Approval Queue)
CREATE TABLE rider_verifications (
    verification_id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) REFERENCES users(emp_id) ON DELETE CASCADE,
    dl_no VARCHAR(50) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    seating_capacity INT NOT NULL DEFAULT 4,
    fuel_consumption_ratio DECIMAL(5, 2) DEFAULT 1.0,
    insurance_no VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Vehicles Table (Vehicle_R)
CREATE TABLE vehicles (
    veh_id VARCHAR(20) UNIQUE PRIMARY KEY,
    veh_no VARCHAR(20) UNIQUE,
    emp_id VARCHAR(50) REFERENCES users(emp_id) ON DELETE CASCADE,
    insurance_no VARCHAR(50),
    dl_no VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100),
    seating_capacity INT NOT NULL DEFAULT 4,
    fuel_consumption_ratio DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Rides Table (Published by Driver)
CREATE TABLE rides (
    ride_id SERIAL PRIMARY KEY,
    driver_id VARCHAR(50) REFERENCES users(emp_id),
    veh_no VARCHAR(20) REFERENCES vehicles(veh_no),
    
    origin JSONB NOT NULL,
    destination JSONB NOT NULL,
    
    departure_time TIMESTAMP NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    fare_per_seat DECIMAL(10, 2) NOT NULL,
    subsidy_per_seat DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    polyline TEXT, -- To store OSRM route data later
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table (Booked by Passengers)
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    ride_id INT REFERENCES rides(ride_id) ON DELETE CASCADE,
    passenger_id VARCHAR(50) REFERENCES users(emp_id),
    
    pickup_location JSONB NOT NULL,
    dropoff_location JSONB NOT NULL,
    
    booking_status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, in_progress, completed, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, completed
    otp VARCHAR(10), -- For driver verification upon pickup
    fare_amount DECIMAL(10, 2),
    is_en_route BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets Table
CREATE TABLE wallets (
    wallet_id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE REFERENCES users(emp_id) ON DELETE CASCADE,
    bank_connection VARCHAR(100),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions Ledger Table
CREATE TABLE wallet_transactions (
    transaction_id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) REFERENCES users(emp_id) ON DELETE CASCADE,
    ride_id INT REFERENCES rides(ride_id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- fare_deduction, driver_earnings, company_subsidy, wallet_topup, refund
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
