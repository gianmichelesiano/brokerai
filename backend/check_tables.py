#!/usr/bin/env python3
"""
Script per verificare se le tabelle necessarie esistono
"""

from app.config.database import get_supabase

def check_tables():
    """Check if required tables exist"""
    print("🧪 Checking if required tables exist...")
    
    supabase = get_supabase()
    
    tables_to_check = [
        "clients",
        "individual_profiles", 
        "company_profiles",
        "interactions"
    ]
    
    for table_name in tables_to_check:
        try:
            # Try to select from the table
            result = supabase.table(table_name).select("count", count="exact").execute()
            print(f"✅ Table '{table_name}' exists - {result.count or 0} records")
        except Exception as e:
            print(f"❌ Table '{table_name}' does not exist or error: {e}")
    
    print("\n🧪 Checking table schemas...")
    
    # Check clients table schema
    try:
        result = supabase.table("clients").select("*").limit(1).execute()
        if result.data:
            columns = list(result.data[0].keys()) if result.data else []
            print(f"✅ Clients table columns: {columns}")
        else:
            print("⚠️ Clients table exists but is empty")
    except Exception as e:
        print(f"❌ Error checking clients table: {e}")
    
    # Check individual_profiles table schema
    try:
        result = supabase.table("individual_profiles").select("*").limit(1).execute()
        if result.data:
            columns = list(result.data[0].keys()) if result.data else []
            print(f"✅ Individual_profiles table columns: {columns}")
        else:
            print("⚠️ Individual_profiles table exists but is empty")
    except Exception as e:
        print(f"❌ Error checking individual_profiles table: {e}")
    
    # Check company_profiles table schema
    try:
        result = supabase.table("company_profiles").select("*").limit(1).execute()
        if result.data:
            columns = list(result.data[0].keys()) if result.data else []
            print(f"✅ Company_profiles table columns: {columns}")
        else:
            print("⚠️ Company_profiles table exists but is empty")
    except Exception as e:
        print(f"❌ Error checking company_profiles table: {e}")

def main():
    """Main function"""
    print("🚀 Starting Table Check")
    print("=" * 60)
    
    check_tables()
    
    print("\n" + "=" * 60)
    print("🏁 Table check completed")

if __name__ == "__main__":
    main() 