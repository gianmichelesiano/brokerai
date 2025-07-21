#!/usr/bin/env python3
"""
Script to check existing brokers in the database
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

print("🔍 Checking Existing Brokers")
print("=" * 50)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing required environment variables!")
    exit(1)

def get_brokers():
    """Get all brokers from the database"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/brokers?select=*",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error getting brokers: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Exception getting brokers: {e}")
        return []

def check_specific_broker(broker_id):
    """Check if a specific broker exists"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/brokers?id=eq.{broker_id}&select=*",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0]
            else:
                return None
        else:
            print(f"❌ Error checking broker: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Exception checking broker: {e}")
        return None

def main():
    """Main function"""
    # Get all brokers
    brokers = get_brokers()
    
    if not brokers:
        print("❌ No brokers found or error occurred")
        return
    
    print(f"\n📋 Found {len(brokers)} brokers:")
    print("-" * 30)
    
    for broker in brokers:
        print(f"✅ ID: {broker.get('id')}")
        print(f"   Name: {broker.get('first_name', 'N/A')} {broker.get('last_name', 'N/A')}")
        print(f"   RUI: {broker.get('rui_number', 'N/A')}")
        print(f"   Role: {broker.get('role', 'N/A')}")
        print(f"   Active: {broker.get('is_active', 'N/A')}")
        print()
    
    # Check specific broker from test
    test_broker_id = "46c40c11-3bee-4180-95c5-3773230c8c42"
    print(f"🔍 Checking specific broker: {test_broker_id}")
    print("-" * 30)
    
    specific_broker = check_specific_broker(test_broker_id)
    
    if specific_broker:
        print(f"✅ Broker found!")
        print(f"   ID: {specific_broker.get('id')}")
        print(f"   Name: {specific_broker.get('first_name', 'N/A')} {specific_broker.get('last_name', 'N/A')}")
        print(f"   RUI: {specific_broker.get('rui_number', 'N/A')}")
        print(f"   Role: {specific_broker.get('role', 'N/A')}")
        print(f"   Active: {specific_broker.get('is_active', 'N/A')}")
    else:
        print(f"❌ Broker not found!")
        print(f"   The broker ID {test_broker_id} does not exist in the database")
        print(f"   You need to create a broker record for this user ID")
        
        # Check if there's a broker with the same user ID
        print(f"\n🔍 Looking for broker with user ID: {test_broker_id}")
        for broker in brokers:
            if broker.get('id') == test_broker_id:
                print(f"✅ Found matching broker!")
                break
        else:
            print(f"❌ No broker found with this ID")

if __name__ == "__main__":
    main() 