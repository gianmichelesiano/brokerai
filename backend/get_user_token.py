#!/usr/bin/env python3
"""
Script to get authentication token for gianmichele.siano@gmail.com
"""

import requests
import json
from app.config.settings import settings

def get_user_token():
    """Get authentication token for the specified user"""
    
    # Direct token for gianmichele.siano@gmail.com
    access_token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjNJc05LTGJiQk9yZVNZWWwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xyZ2doZW9ieWdtaHBtcmVma3FrLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0NmM0MGMxMS0zYmVlLTQxODAtOTVjNS0zNzczMjMwYzhjNDIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyOTI1NzgzLCJpYXQiOjE3NTI5MjIxODMsImVtYWlsIjoiZ2lhbm1pY2hlbGUuc2lhbm9AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImdpYW5taWNoZWxlLnNpYW5vQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJHaWFubWljaGVsZSBTaWFubyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiNDZjNDBjMTEtM2JlZS00MTgwLTk1YzUtMzc3MzIzMGM4YzQyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTI5MjIxODN9XSwic2Vzc2lvbl9pZCI6ImFjOWE0ODVhLWYwNmEtNDliYS1hMjk4LTcxNWQzYWI5ZjhiMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.hpERhrOjgD_NKXw01KVqCaFWeF7qKXIPQoz0PkL7718"
    user_id = "46c40c11-3bee-4180-95c5-3773230c8c42"
    
    print("✅ Using direct token for gianmichele.siano@gmail.com")
    print(f"User ID: {user_id}")
    print(f"Access Token: {access_token[:50]}...")
    
    # Update the test file with the token
    update_test_file(access_token, user_id)
    
    return access_token, user_id

def update_test_file(token, user_id):
    """Update the test file with the actual token"""
    try:
        # Read the current test file
        with open("test_clients_api.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if token is already updated
        if token in content:
            print("✅ Token already present in test_clients_api.py")
            return
        
        # Replace the placeholder token and user ID
        content = content.replace(
            'TEST_BROKER_TOKEN = "your-test-broker-token-here"',
            f'TEST_BROKER_TOKEN = "{token}"'
        )
        
        content = content.replace(
            'TEST_BROKER_ID = "550e8400-e29b-41d4-a716-446655440001"',
            f'TEST_BROKER_ID = "{user_id}"'
        )
        
        # Write back the updated content
        with open("test_clients_api.py", "w", encoding="utf-8") as f:
            f.write(content)
        
        print("✅ Updated test_clients_api.py with actual token and user ID")
        
    except Exception as e:
        print(f"❌ Error updating test file: {e}")

def test_token():
    """Test if the token works with the API"""
    token, user_id = get_user_token()
    
    if not token:
        print("❌ Cannot test token - authentication failed")
        return
    
    print("\n🧪 Testing token with API...")
    
    # Test with a simple API call
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test with brokers endpoint to verify token works
        response = requests.get(
            "http://localhost:8000/api/v1/brokers/me",
            headers=headers
        )
        
        print(f"API Test Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Token is working correctly!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            
            # Also test the clients endpoint
            print("\n🧪 Testing clients endpoint...")
            clients_response = requests.get(
                "http://localhost:8000/api/v1/clients",
                headers=headers
            )
            
            print(f"Clients API Test Status Code: {clients_response.status_code}")
            
            if clients_response.status_code == 200:
                print("✅ Clients endpoint is working correctly!")
                print(f"Response: {json.dumps(clients_response.json(), indent=2)}")
            else:
                print("❌ Clients endpoint test failed")
                print(f"Response: {json.dumps(clients_response.json(), indent=2)}")
                
        else:
            print("❌ Token test failed")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            
    except Exception as e:
        print(f"❌ Error testing token: {e}")

if __name__ == "__main__":
    print("🔑 Token Retrieval Script")
    print("=" * 50)
    
    # Check if settings are available
    try:
        print(f"Supabase URL: {settings.SUPABASE_URL}")
        print(f"Supabase Key: {settings.SUPABASE_KEY[:20]}...")
    except Exception as e:
        print(f"❌ Error loading settings: {e}")
        print("Make sure the application is properly configured")
        exit(1)
    
    # Get and test token
    test_token()
    
    print("\n" + "=" * 50)
    print("🏁 Token retrieval completed") 