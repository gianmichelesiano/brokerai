-- Simple setup for clients tables
-- Execute this in your Supabase SQL Editor

-- 1. Create individual_profiles table
CREATE TABLE IF NOT EXISTS individual_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TIMESTAMPTZ,
    fiscal_code TEXT UNIQUE NOT NULL CHECK (length(fiscal_code) = 16),
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    vat_number TEXT UNIQUE NOT NULL CHECK (length(vat_number) >= 11),
    fiscal_code TEXT UNIQUE CHECK (fiscal_code IS NULL OR length(fiscal_code) = 16),
    legal_address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    province TEXT NOT NULL CHECK (length(province) = 2),
    phone TEXT,
    email TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    client_type TEXT NOT NULL CHECK (client_type IN ('individual', 'company')),
    individual_profile_id UUID REFERENCES individual_profiles(id) ON DELETE CASCADE,
    company_profile_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one profile is set based on client_type
    CONSTRAINT check_profile_consistency CHECK (
        (client_type = 'individual' AND individual_profile_id IS NOT NULL AND company_profile_id IS NULL) OR
        (client_type = 'company' AND company_profile_id IS NOT NULL AND individual_profile_id IS NULL)
    )
);

-- 4. Create client_details view
CREATE OR REPLACE VIEW client_details AS
SELECT 
    c.id,
    c.broker_id,
    c.client_type,
    c.is_active,
    c.notes,
    c.created_at,
    c.updated_at,
    ip.id as individual_profile_id,
    ip.first_name,
    ip.last_name,
    ip.birth_date,
    ip.fiscal_code as individual_fiscal_code,
    ip.phone as individual_phone,
    ip.email as individual_email,
    ip.address as individual_address,
    ip.city as individual_city,
    ip.postal_code as individual_postal_code,
    ip.province as individual_province,
    cp.id as company_profile_id,
    cp.company_name,
    cp.vat_number,
    cp.fiscal_code as company_fiscal_code,
    cp.legal_address,
    cp.city as company_city,
    cp.postal_code as company_postal_code,
    cp.province as company_province,
    cp.phone as company_phone,
    cp.email as company_email,
    cp.contact_person,
    cp.contact_phone,
    cp.contact_email
FROM clients c
LEFT JOIN individual_profiles ip ON c.individual_profile_id = ip.id
LEFT JOIN company_profiles cp ON c.company_profile_id = cp.id;

-- 5. Enable RLS
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies
CREATE POLICY "Enable all access for authenticated users" ON individual_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON company_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');

-- 7. Grant permissions
GRANT ALL ON individual_profiles TO authenticated;
GRANT ALL ON company_profiles TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT SELECT ON client_details TO authenticated;

-- Success message
SELECT 'Clients tables created successfully!' as message; 