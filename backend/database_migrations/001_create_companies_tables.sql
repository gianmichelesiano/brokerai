-- Migration: Create companies and user_companies tables
-- Date: 2025-01-23
-- Description: Implement multi-tenant system based on companies

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create user_companies junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, company_id)
);

-- Create company_invites table for invitation system
CREATE TABLE IF NOT EXISTS company_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_active ON user_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_company_invites_email ON company_invites(email);
CREATE INDEX IF NOT EXISTS idx_company_invites_token ON company_invites(token);
CREATE INDEX IF NOT EXISTS idx_company_invites_company_id ON company_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default "Speats" company for migration
INSERT INTO companies (name, slug, description, created_at, updated_at, is_active)
VALUES (
    'Speats',
    'speats',
    'Default company for existing data migration',
    NOW(),
    NOW(),
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Companies/Organizations table for multi-tenant system';
COMMENT ON TABLE user_companies IS 'Junction table linking users to companies with roles';
COMMENT ON TABLE company_invites IS 'Pending invitations to join companies';
COMMENT ON COLUMN user_companies.role IS 'User role in company: owner, admin, member, viewer';
COMMENT ON COLUMN company_invites.role IS 'Role that will be assigned when invite is accepted';
COMMENT ON COLUMN companies.slug IS 'Unique URL-friendly identifier for the company';

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Companies table created successfully';
    RAISE NOTICE 'User_companies table created successfully';
    RAISE NOTICE 'Company_invites table created successfully';
    RAISE NOTICE 'Default Speats company inserted';
    RAISE NOTICE 'Indexes and triggers created';
    RAISE NOTICE 'Migration 001 completed successfully!';
END $$;
