-- Database setup for Clients management
-- Execute these commands in your Supabase SQL editor

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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_profiles_fiscal_code ON individual_profiles(fiscal_code);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_email ON individual_profiles(email);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_name ON individual_profiles(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_company_profiles_vat_number ON company_profiles(vat_number);
CREATE INDEX IF NOT EXISTS idx_company_profiles_fiscal_code ON company_profiles(fiscal_code);
CREATE INDEX IF NOT EXISTS idx_company_profiles_company_name ON company_profiles(company_name);

CREATE INDEX IF NOT EXISTS idx_clients_broker_id ON clients(broker_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_individual_profile_id ON clients(individual_profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_profile_id ON clients(company_profile_id);

-- 5. Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_individual_profiles_fiscal_code_unique ON individual_profiles(fiscal_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_profiles_vat_number_unique ON company_profiles(vat_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_profiles_fiscal_code_unique ON company_profiles(fiscal_code) WHERE fiscal_code IS NOT NULL;

-- 6. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_individual_profiles_updated_at ON individual_profiles;
CREATE TRIGGER update_individual_profiles_updated_at
    BEFORE UPDATE ON individual_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at
    BEFORE UPDATE ON company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for individual_profiles
CREATE POLICY "Brokers can view their clients' individual profiles" ON individual_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.individual_profile_id = individual_profiles.id
            AND b.id = auth.uid()
        )
    );

CREATE POLICY "Brokers can insert individual profiles for their clients" ON individual_profiles
    FOR INSERT WITH CHECK (true); -- Will be validated in application logic

CREATE POLICY "Brokers can update their clients' individual profiles" ON individual_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.individual_profile_id = individual_profiles.id
            AND b.id = auth.uid()
        )
    );

CREATE POLICY "Brokers can delete their clients' individual profiles" ON individual_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.individual_profile_id = individual_profiles.id
            AND b.id = auth.uid()
        )
    );

-- 9. Create RLS policies for company_profiles
CREATE POLICY "Brokers can view their clients' company profiles" ON company_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.company_profile_id = company_profiles.id
            AND b.id = auth.uid()
        )
    );

CREATE POLICY "Brokers can insert company profiles for their clients" ON company_profiles
    FOR INSERT WITH CHECK (true); -- Will be validated in application logic

CREATE POLICY "Brokers can update their clients' company profiles" ON company_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.company_profile_id = company_profiles.id
            AND b.id = auth.uid()
        )
    );

CREATE POLICY "Brokers can delete their clients' company profiles" ON company_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN brokers b ON c.broker_id = b.id
            WHERE c.company_profile_id = company_profiles.id
            AND b.id = auth.uid()
        )
    );

-- 10. Create RLS policies for clients
CREATE POLICY "Brokers can view their own clients" ON clients
    FOR SELECT USING (broker_id = auth.uid());

CREATE POLICY "Brokers can insert their own clients" ON clients
    FOR INSERT WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update their own clients" ON clients
    FOR UPDATE USING (broker_id = auth.uid());

CREATE POLICY "Brokers can delete their own clients" ON clients
    FOR DELETE USING (broker_id = auth.uid());

-- 11. Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON individual_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;

-- 12. Create view for client details with profiles
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

-- 13. Grant permissions to view
GRANT SELECT ON client_details TO authenticated;

-- Success message
SELECT 'Clients database setup completed successfully! Tables created: individual_profiles, company_profiles, clients' as message; 