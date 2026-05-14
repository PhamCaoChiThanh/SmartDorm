-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------
-- ENUM TYPES
--------------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'TENANT');

CREATE TYPE room_status AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'MAINTENANCE'
);

CREATE TYPE contract_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'TERMINATED'
);

CREATE TYPE invoice_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE'
);

CREATE TYPE request_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE maintenance_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'DONE'
);

CREATE TYPE utility_type AS ENUM (
    'WATER',
    'ELECTRIC'
);

CREATE TYPE vehicle_type AS ENUM (
    'BICYCLE',
    'MOTORBIKE',
    'CAR'
);

CREATE TYPE parking_ticket_type AS ENUM (
    'MONTHLY',
    'DAILY'
);

--------------------------------------------------
-- USERS
--------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- TENANTS
--------------------------------------------------

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    cccd VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- ROOMS
--------------------------------------------------

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status room_status DEFAULT 'AVAILABLE',

    base_price DECIMAL(12,2) NOT NULL,
    garbage_fee DECIMAL(12,2) DEFAULT 0,
    electricity_price DECIMAL(12,2) NOT NULL,
    water_price DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- CONTRACTS
--------------------------------------------------

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    room_id UUID REFERENCES rooms(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status contract_status DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- DEPOSITS
--------------------------------------------------

CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),

    total_amount DECIMAL(12,2) NOT NULL,
    remaining_balance DECIMAL(12,2) NOT NULL,

    status VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- DEPOSIT TRANSACTIONS
--------------------------------------------------

CREATE TABLE deposit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID REFERENCES deposits(id),

    amount DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(50),
    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- INVOICES
--------------------------------------------------

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),

    billing_month INT NOT NULL,
    billing_year INT NOT NULL,

    room_fee DECIMAL(12,2),
    electric_fee DECIMAL(12,2),
    water_fee DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,

    status invoice_status DEFAULT 'PENDING',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- PAYMENTS
--------------------------------------------------

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),

    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- UTILITY USAGES
--------------------------------------------------

CREATE TABLE utility_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),

    type utility_type NOT NULL,

    billing_month INT NOT NULL,
    billing_year INT NOT NULL,

    old_index INT NOT NULL,
    new_index INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- ROOM REQUESTS
--------------------------------------------------

CREATE TABLE room_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    room_id UUID REFERENCES rooms(id),

    note TEXT,
    move_in_date DATE,

    status request_status DEFAULT 'PENDING',
    admin_note TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- MAINTENANCES
--------------------------------------------------

CREATE TABLE maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    reported_by UUID REFERENCES tenants(id),

    description TEXT,
    status maintenance_status DEFAULT 'OPEN',
    assigned_to VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- VEHICLES
--------------------------------------------------

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_model VARCHAR(50),
    type vehicle_type NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- PARKING REGISTRATIONS
--------------------------------------------------

CREATE TABLE parking_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    ticket_type parking_ticket_type DEFAULT 'MONTHLY',
    start_date DATE NOT NULL,
    end_date DATE,
    fee_per_period DECIMAL(12,2) NOT NULL,
    
    status request_status DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- PARKING INVOICES
--------------------------------------------------

CREATE TABLE parking_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES parking_registrations(id) ON DELETE CASCADE,
    
    billing_month INT,
    billing_year INT,
    
    amount DECIMAL(12,2) NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- PARKING PAYMENTS
--------------------------------------------------

CREATE TABLE parking_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parking_invoice_id UUID REFERENCES parking_invoices(id) ON DELETE CASCADE,
    
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- AUDIT LOGS
--------------------------------------------------

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    action VARCHAR(100),
    entity_name VARCHAR(100),
    entity_id UUID,

    old_value JSONB,
    new_value JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- INDEXES
--------------------------------------------------

CREATE INDEX idx_room_number
ON rooms(room_number);

CREATE INDEX idx_contract_tenant
ON contracts(tenant_id);

CREATE INDEX idx_invoice_contract
ON invoices(contract_id);

CREATE INDEX idx_payment_invoice
ON payments(invoice_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_vehicle_tenant
ON vehicles(tenant_id);

CREATE INDEX idx_vehicle_plate
ON vehicles(license_plate);

CREATE INDEX idx_parking_reg_vehicle
ON parking_registrations(vehicle_id);

CREATE INDEX idx_parking_reg_tenant
ON parking_registrations(tenant_id);

CREATE INDEX idx_parking_invoice_reg
ON parking_invoices(registration_id);

CREATE INDEX idx_parking_payment_invoice
ON parking_payments(parking_invoice_id);