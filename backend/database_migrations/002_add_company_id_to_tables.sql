-- Migration: Add company_id to existing tables
-- Date: 2025-01-23
-- Description: Add company_id foreign key to main tables for data isolation

-- Get the Speats company ID for default assignment
DO $$
DECLARE
    speats_company_id UUID;
BEGIN
    -- Get Speats company ID
    SELECT id INTO speats_company_id FROM companies WHERE slug = 'speats';
    
    IF speats_company_id IS NULL THEN
        RAISE EXCEPTION 'Speats company not found. Please run migration 001 first.';
    END IF;
    
    RAISE NOTICE 'Using Speats company ID: %', speats_company_id;

    -- Add company_id to compagnie table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compagnie' AND column_name = 'company_id') THEN
        ALTER TABLE compagnie ADD COLUMN company_id UUID REFERENCES companies(id);
        -- Set default value for existing records
        EXECUTE format('UPDATE compagnie SET company_id = %L WHERE company_id IS NULL', speats_company_id);
        -- Make it NOT NULL after setting default values
        ALTER TABLE compagnie ALTER COLUMN company_id SET NOT NULL;
        -- Add index
        CREATE INDEX idx_compagnie_company_id ON compagnie(company_id);
        RAISE NOTICE 'Added company_id to compagnie table';
    ELSE
        RAISE NOTICE 'company_id already exists in compagnie table';
    END IF;

    -- Add company_id to garanzie table (if it should be company-specific)
    -- Note: Based on requirements, garanzie might be global, but adding for flexibility
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'garanzie') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'garanzie' AND column_name = 'company_id') THEN
            ALTER TABLE garanzie ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE garanzie SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE garanzie ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_garanzie_company_id ON garanzie(company_id);
            RAISE NOTICE 'Added company_id to garanzie table';
        ELSE
            RAISE NOTICE 'company_id already exists in garanzie table';
        END IF;
    ELSE
        RAISE NOTICE 'garanzie table does not exist, skipping';
    END IF;

    -- Add company_id to clients table (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_id') THEN
            ALTER TABLE clients ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE clients SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE clients ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_clients_company_id ON clients(company_id);
            RAISE NOTICE 'Added company_id to clients table';
        ELSE
            RAISE NOTICE 'company_id already exists in clients table';
        END IF;
    ELSE
        RAISE NOTICE 'clients table does not exist, skipping';
    END IF;

    -- Add company_id to analisi_ai_polizze table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analisi_ai_polizze') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analisi_ai_polizze' AND column_name = 'company_id') THEN
            ALTER TABLE analisi_ai_polizze ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE analisi_ai_polizze SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE analisi_ai_polizze ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_analisi_ai_polizze_company_id ON analisi_ai_polizze(company_id);
            RAISE NOTICE 'Added company_id to analisi_ai_polizze table';
        ELSE
            RAISE NOTICE 'company_id already exists in analisi_ai_polizze table';
        END IF;
    ELSE
        RAISE NOTICE 'analisi_ai_polizze table does not exist, skipping';
    END IF;

    -- Add company_id to compagnia_tipologia_assicurazione table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compagnia_tipologia_assicurazione') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compagnia_tipologia_assicurazione' AND column_name = 'company_id') THEN
            ALTER TABLE compagnia_tipologia_assicurazione ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE compagnia_tipologia_assicurazione SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE compagnia_tipologia_assicurazione ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_compagnia_tipologia_company_id ON compagnia_tipologia_assicurazione(company_id);
            RAISE NOTICE 'Added company_id to compagnia_tipologia_assicurazione table';
        ELSE
            RAISE NOTICE 'company_id already exists in compagnia_tipologia_assicurazione table';
        END IF;
    ELSE
        RAISE NOTICE 'compagnia_tipologia_assicurazione table does not exist, skipping';
    END IF;

    -- Add company_id to confronti table (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confronti') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'confronti' AND column_name = 'company_id') THEN
            ALTER TABLE confronti ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE confronti SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE confronti ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_confronti_company_id ON confronti(company_id);
            RAISE NOTICE 'Added company_id to confronti table';
        ELSE
            RAISE NOTICE 'company_id already exists in confronti table';
        END IF;
    ELSE
        RAISE NOTICE 'confronti table does not exist, skipping';
    END IF;

    -- Add company_id to interactions table (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'company_id') THEN
            ALTER TABLE interactions ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE interactions SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE interactions ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_interactions_company_id ON interactions(company_id);
            RAISE NOTICE 'Added company_id to interactions table';
        ELSE
            RAISE NOTICE 'company_id already exists in interactions table';
        END IF;
    ELSE
        RAISE NOTICE 'interactions table does not exist, skipping';
    END IF;

    -- Add company_id to brokers table (if exists and should be company-specific)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brokers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'company_id') THEN
            ALTER TABLE brokers ADD COLUMN company_id UUID REFERENCES companies(id);
            -- Set default value for existing records
            EXECUTE format('UPDATE brokers SET company_id = %L WHERE company_id IS NULL', speats_company_id);
            -- Make it NOT NULL after setting default values
            ALTER TABLE brokers ALTER COLUMN company_id SET NOT NULL;
            -- Add index
            CREATE INDEX idx_brokers_company_id ON brokers(company_id);
            RAISE NOTICE 'Added company_id to brokers table';
        ELSE
            RAISE NOTICE 'company_id already exists in brokers table';
        END IF;
    ELSE
        RAISE NOTICE 'brokers table does not exist, skipping';
    END IF;

    RAISE NOTICE 'Successfully added company_id columns to all relevant tables with Speats company as default';

END $$;

-- Add comments for documentation
COMMENT ON COLUMN compagnie.company_id IS 'Foreign key to companies table for data isolation';

-- Note: sezioni and tipologia_assicurazione tables are kept global as per requirements
-- They don't get company_id columns

-- Verification
DO $$
DECLARE
    table_info RECORD;
BEGIN
    RAISE NOTICE '=== COMPANY_ID COLUMNS VERIFICATION ===';
    
    FOR table_info IN
        SELECT 
            t.table_name,
            CASE WHEN c.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_company_id
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'company_id'
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('compagnie', 'garanzie', 'clients', 'analisi_ai_polizze', 'compagnia_tipologia_assicurazione', 'confronti', 'interactions', 'brokers')
        ORDER BY t.table_name
    LOOP
        RAISE NOTICE 'Table %: company_id = %', table_info.table_name, table_info.has_company_id;
    END LOOP;
    
    RAISE NOTICE '=== END VERIFICATION ===';
    RAISE NOTICE 'Migration 002 completed successfully!';
END $$;
