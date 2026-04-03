-- Property Matcher Database Schema
-- PostgreSQL with UUID primary keys

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (agents)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    brokerage VARCHAR(255),
    license_number VARCHAR(50),
    plan_type VARCHAR(20) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'team')),
    listings_limit INTEGER DEFAULT 5,
    listings_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyers table (imported from CSV/JSON sources)
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_title VARCHAR(100),
    
    -- Public contact (governed)
    company_website VARCHAR(255),
    company_phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    
    -- Intelligence
    typical_deal_size_min DECIMAL(12,2),
    typical_deal_size_max DECIMAL(12,2),
    preferred_asset_classes JSONB,
    geographic_focus JSONB,
    
    -- Hot money tracking
    last_sale_date DATE,
    last_sale_amount DECIMAL(12,2),
    has_1031_deadline BOOLEAN DEFAULT false,
    exchange_deadline DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    data_source VARCHAR(100),
    last_verified DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact intel (governed public information)
CREATE TABLE contact_intel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
    
    intel_type VARCHAR(50) CHECK (intel_type IN (
        'linkedin_url', 'company_website', 'company_phone', 
        'general_email', 'press_release', 'portfolio'
    )),
    
    value TEXT NOT NULL,
    source_url VARCHAR(500),
    source_title VARCHAR(255),
    accessed_date DATE,
    
    -- Governance
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Property details
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN (
        'multifamily', 'industrial', 'retail', 'office', 'land', 'development'
    )),
    
    -- Financials
    asking_price DECIMAL(12,2) NOT NULL,
    units INTEGER,
    cap_rate DECIMAL(5,2),
    noi DECIMAL(12,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'archived')),
    
    -- Files
    om_pdf_url VARCHAR(500),
    photos JSONB DEFAULT '[]',
    
    -- Metadata
    description TEXT,
    distress_indicators JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table (listing + buyer pairings)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
    
    -- Scoring
    match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
    match_reasons JSONB NOT NULL,
    
    -- Engagement tracking
    contact_status VARCHAR(50) DEFAULT 'new' CHECK (contact_status IN (
        'new', 'viewed', 'contacted', 'responded', 'meeting_scheduled', 'offer_made', 'closed', 'passed'
    )),
    contacted_at TIMESTAMP,
    contacted_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(listing_id, buyer_id)
);

-- Alerts table (notifications)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) CHECK (alert_type IN (
        'new_match', 'hot_money', 'price_drop', 'status_change'
    )),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    match_id UUID REFERENCES matches(id),
    
    is_read BOOLEAN DEFAULT false,
    emailed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_listings_user ON listings(user_id, status);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_buyers_active ON buyers(is_active, last_sale_date);
CREATE INDEX idx_buyers_geo ON buyers USING GIN(geographic_focus);
CREATE INDEX idx_matches_listing ON matches(listing_id, match_score DESC);
CREATE INDEX idx_matches_buyer ON matches(buyer_id, created_at DESC);
CREATE INDEX idx_alerts_user ON alerts(user_id, is_read, created_at DESC);
CREATE INDEX idx_contact_intel_buyer ON contact_intel(buyer_id, is_verified);