#!/usr/bin/env python3
"""
Script to check all existing tables in the database
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get settings from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"🔍 Environment variables:")
print(f"   SUPABASE_URL: {'✅' if SUPABASE_URL else '❌'}")
print(f"   SUPABASE_KEY: {'✅' if SUPABASE_KEY else '❌'}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ Missing required environment variables!")
    exit(1)

def get_all_tables():
    """Get all tables in the database"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        # Try to get all tables by querying information_schema
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"query": """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return [row['table_name'] for row in data]
            else:
                return []
        else:
            print(f"❌ Error getting tables: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Exception getting tables: {e}")
        return []

def get_table_schema(table_name):
    """Get table schema"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"query": f"""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                ORDER BY ordinal_position;
            """}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return []
            
    except Exception as e:
        print(f"❌ Exception getting schema for {table_name}: {e}")
        return []

def main():
    """Main function"""
    print("🔍 Checking All Database Tables")
    print("=" * 50)
    
    # Get all tables
    tables = get_all_tables()
    
    if not tables:
        print("❌ No tables found or error occurred")
        return
    
    print(f"\n📋 Found {len(tables)} tables:")
    print("-" * 30)
    
    for table in tables:
        print(f"✅ {table}")
    
    # Check specific tables we're looking for
    print(f"\n🔍 Looking for specific tables:")
    print("-" * 30)
    
    target_tables = [
        "individual_profiles",
        "company_profiles", 
        "clients",
        "brokers"
    ]
    
    for target in target_tables:
        if target in tables:
            print(f"✅ {target} - FOUND")
            # Show schema
            schema = get_table_schema(target)
            if schema:
                print(f"   Columns: {', '.join([col['column_name'] for col in schema])}")
        else:
            print(f"❌ {target} - NOT FOUND")
    
    # Look for similar table names
    print(f"\n🔍 Looking for similar table names:")
    print("-" * 30)
    
    for table in tables:
        if any(keyword in table.lower() for keyword in ['profile', 'client', 'individual', 'company']):
            print(f"📋 {table} - might be what we're looking for")
            schema = get_table_schema(table)
            if schema:
                print(f"   Columns: {', '.join([col['column_name'] for col in schema])}")

if __name__ == "__main__":
    main() 