-- Migration: Assign existing users to Speats company
-- Date: 2025-01-23
-- Description: Migrate all existing users to the default Speats company as owners

DO $$
DECLARE
    speats_company_id UUID;
    user_record RECORD;
    users_migrated INTEGER := 0;
    total_users INTEGER := 0;
BEGIN
    -- Get Speats company ID
    SELECT id INTO speats_company_id FROM companies WHERE slug = 'speats';
    
    IF speats_company_id IS NULL THEN
        RAISE EXCEPTION 'Speats company not found. Please run migration 001 first.';
    END IF;
    
    RAISE NOTICE 'Found Speats company with ID: %', speats_company_id;
    
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM auth.users;
    RAISE NOTICE 'Total users in auth.users: %', total_users;
    
    -- Assign all existing users to Speats company as owners
    FOR user_record IN 
        SELECT id, email, created_at 
        FROM auth.users 
        WHERE id NOT IN (
            SELECT user_id 
            FROM user_companies 
            WHERE company_id = speats_company_id
        )
    LOOP
        BEGIN
            INSERT INTO user_companies (
                user_id, 
                company_id, 
                role, 
                joined_at, 
                is_active,
                created_by
            ) VALUES (
                user_record.id,
                speats_company_id,
                'owner',  -- All existing users become owners
                COALESCE(user_record.created_at, NOW()),  -- Use their original registration date or now
                TRUE,
                user_record.id  -- Self-assigned
            );
            
            users_migrated := users_migrated + 1;
            RAISE NOTICE 'Migrated user: % (ID: %)', user_record.email, user_record.id;
            
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'User % already exists in user_companies, skipping', user_record.email;
            WHEN OTHERS THEN
                RAISE WARNING 'Error migrating user %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % out of % users to Speats company as owners', users_migrated, total_users;
    
    -- Verify the migration
    DECLARE
        final_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO final_count 
        FROM user_companies 
        WHERE company_id = speats_company_id;
        
        RAISE NOTICE 'Final verification: % users now assigned to Speats company', final_count;
        
        IF final_count = 0 THEN
            RAISE WARNING 'No users were migrated! This might indicate an issue.';
        ELSIF final_count < total_users THEN
            RAISE WARNING 'Not all users were migrated. Expected: %, Got: %', total_users, final_count;
        ELSE
            RAISE NOTICE 'Migration completed successfully! All users are now in Speats company.';
        END IF;
    END;

END $$;

-- Additional verification queries
DO $$
DECLARE
    verification_result RECORD;
BEGIN
    RAISE NOTICE '=== MIGRATION VERIFICATION REPORT ===';
    
    -- Count users by role in Speats company
    FOR verification_result IN
        SELECT 
            uc.role,
            COUNT(*) as user_count
        FROM user_companies uc
        JOIN companies c ON uc.company_id = c.id
        WHERE c.slug = 'speats'
        GROUP BY uc.role
        ORDER BY uc.role
    LOOP
        RAISE NOTICE 'Role %: % users', verification_result.role, verification_result.user_count;
    END LOOP;
    
    -- Show sample of migrated users
    RAISE NOTICE '=== SAMPLE OF MIGRATED USERS ===';
    FOR verification_result IN
        SELECT 
            u.email,
            uc.role,
            uc.joined_at,
            uc.is_active
        FROM user_companies uc
        JOIN companies c ON uc.company_id = c.id
        JOIN auth.users u ON uc.user_id = u.id
        WHERE c.slug = 'speats'
        ORDER BY uc.joined_at
        LIMIT 5
    LOOP
        RAISE NOTICE 'User: % | Role: % | Joined: % | Active: %', 
            verification_result.email, 
            verification_result.role, 
            verification_result.joined_at,
            verification_result.is_active;
    END LOOP;
    
    RAISE NOTICE '=== END VERIFICATION REPORT ===';
END $$;
