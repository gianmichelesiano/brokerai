#!/usr/bin/env python3
"""
Script to check which tables already exist in the database
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

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing required environment variables!")
    print("Please check your .env file contains:")
    print("- SUPABASE_URL")
    print("- SUPABASE_KEY")
    exit(1)

def check_table_exists(table_name):
    """Check if a specific table exists"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?select=id&limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            return True, "✅ Table exists"
        elif response.status_code == 404:
            return False, "❌ Table not found"
        else:
            return False, f"❌ Error {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, f"❌ Exception: {e}"

def check_view_exists(view_name):
    """Check if a specific view exists"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{view_name}?select=id&limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            return True, "✅ View exists"
        elif response.status_code == 404:
            return False, "❌ View not found"
        else:
            return False, f"❌ Error {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, f"❌ Exception: {e}"

def get_table_schema(table_name):
    """Get table schema information"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        # Try to get a sample record to see the structure
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return list(data[0].keys())
            else:
                return []
        else:
            return []
            
    except Exception as e:
        return []

def main():
    """Main function"""
    print("🔍 Checking Existing Database Tables")
    print("=" * 50)
    
    # Tables from crm.md (brokers)
    print("\n📋 Tables from crm.md:")
    print("-" * 30)
    
    brokers_exists, brokers_status = check_table_exists("brokers")
    print(f"brokers: {brokers_status}")
    
    if brokers_exists:
        brokers_schema = get_table_schema("brokers")
        if brokers_schema:
            print(f"   Schema: {', '.join(brokers_schema)}")
    
    # Client-related tables
    print("\n📋 Client-related tables:")
    print("-" * 30)
    
    tables_to_check = [
        "clients",
        "individual_profiles", 
        "company_profiles"
    ]
    
    existing_tables = []
    missing_tables = []
    
    for table in tables_to_check:
        exists, status = check_table_exists(table)
        print(f"{table}: {status}")
        
        if exists:
            existing_tables.append(table)
            schema = get_table_schema(table)
            if schema:
                print(f"   Schema: {', '.join(schema)}")
        else:
            missing_tables.append(table)
    
    # Views
    print("\n📋 Views:")
    print("-" * 30)
    
    views_to_check = [
        "client_details"
    ]
    
    existing_views = []
    missing_views = []
    
    for view in views_to_check:
        exists, status = check_view_exists(view)
        print(f"{view}: {status}")
        
        if exists:
            existing_views.append(view)
        else:
            missing_views.append(view)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    print("-" * 30)
    
    if existing_tables:
        print(f"✅ Existing tables: {', '.join(existing_tables)}")
    
    if missing_tables:
        print(f"❌ Missing tables: {', '.join(missing_tables)}")
    
    if existing_views:
        print(f"✅ Existing views: {', '.join(existing_views)}")
    
    if missing_views:
        print(f"❌ Missing views: {', '.join(missing_views)}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    print("-" * 30)
    
    if missing_tables:
        print("🔧 To create missing tables, run:")
        print("   python setup_clients_database.py")
        print("   OR")
        print("   Execute clients_setup_simple.sql in Supabase SQL Editor")
    
    if missing_views:
        print("🔧 To create missing views, run:")
        print("   python setup_clients_database.py")
        print("   OR")
        print("   Execute the view creation part of clients_setup_simple.sql")
    
    if not missing_tables and not missing_views:
        print("🎉 All required tables and views exist!")
        print("   You can now run: python test_clients_simple.py")

if __name__ == "__main__":
    main() 