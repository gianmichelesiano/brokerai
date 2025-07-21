#!/usr/bin/env python3
"""
Script to get a fresh token using username and password
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

print("🔑 Fresh Token Retrieval")
print("=" * 50)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing required environment variables!")
    exit(1)

def get_fresh_token(email, password):
    """Get fresh token using email and password"""
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        }
        
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('access_token'), result.get('user', {}).get('id')
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error during authentication: {e}")
        return None, None

def main():
    """Main function"""
    # User credentials
    email = "gianmichele.siano@gmail.com"
    password = "Wolfgang-75"
    
    print(f"🔐 Authenticating with:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print()
    
    # Get fresh token
    token, user_id = get_fresh_token(email, password)
    
    if token and user_id:
        print("✅ Authentication successful!")
        print()
        print("📋 COPY THESE VALUES:")
        print("=" * 50)
        print(f"USER_ID = '{user_id}'")
        print(f"ACCESS_TOKEN = '{token}'")
        print("=" * 50)
        print()
        print("🔧 To use in your scripts:")
        print("1. Copy the USER_ID and ACCESS_TOKEN above")
        print("2. Replace the values in test_clients_simple.py")
        print("3. Or update the get_user_token.py script")
        print()
        
        # Test the token
        print("🧪 Testing token with API...")
        test_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        test_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/brokers?select=id&limit=1",
            headers=test_headers
        )
        
        if test_response.status_code == 200:
            print("✅ Token test successful!")
        else:
            print(f"❌ Token test failed: {test_response.status_code}")
            print(f"Response: {test_response.text}")
        
    else:
        print("❌ Failed to get fresh token")
        print("Please check your credentials and try again")

if __name__ == "__main__":
    main() 