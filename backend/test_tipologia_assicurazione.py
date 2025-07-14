"""
Script di test per verificare le API di tipologia_assicurazione
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/tipologia-assicurazione"

def test_health():
    """Test health check"""
    print("🔍 Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def test_get_all():
    """Test get all tipologie"""
    print("🔍 Testing get all tipologie...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total: {data['total']}")
        print(f"Items count: {len(data['items'])}")
        if data['items']:
            print(f"First item: {json.dumps(data['items'][0], indent=2)}")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_get_stats():
    """Test get statistics"""
    print("🔍 Testing get statistics...")
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_get_by_id():
    """Test get by ID"""
    print("🔍 Testing get by ID...")
    response = requests.get(f"{BASE_URL}/1")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_create():
    """Test create new tipologia"""
    print("🔍 Testing create new tipologia...")
    data = {
        "nome": "Test Assicurazione",
        "descrizione": "Questa è una tipologia di test"
    }
    response = requests.post(f"{BASE_URL}/", json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        created = response.json()
        print(f"Created: {json.dumps(created, indent=2)}")
        return created["id"]
    else:
        print(f"Error: {response.text}")
        return None
    print("-" * 50)

def test_update(tipologia_id):
    """Test update tipologia"""
    if not tipologia_id:
        print("⚠️ Skipping update test - no ID available")
        return
    
    print(f"🔍 Testing update tipologia ID {tipologia_id}...")
    data = {
        "nome": "Test Assicurazione Aggiornata",
        "descrizione": "Descrizione aggiornata"
    }
    response = requests.put(f"{BASE_URL}/{tipologia_id}", json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Updated: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_delete(tipologia_id):
    """Test delete tipologia"""
    if not tipologia_id:
        print("⚠️ Skipping delete test - no ID available")
        return
    
    print(f"🔍 Testing delete tipologia ID {tipologia_id}...")
    response = requests.delete(f"{BASE_URL}/{tipologia_id}")
    print(f"Status: {response.status_code}")
    if response.status_code == 204:
        print("✅ Successfully deleted")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_search():
    """Test search"""
    print("🔍 Testing search...")
    response = requests.get(f"{BASE_URL}/search/Auto")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Search results: {data['total']} found")
        if data['items']:
            print(f"First result: {json.dumps(data['items'][0], indent=2)}")
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

if __name__ == "__main__":
    print("🚀 Starting API tests for tipologia_assicurazione...")
    print("=" * 60)
    
    try:
        # Test sequence
        test_health()
        test_get_all()
        test_get_stats()
        test_get_by_id()
        test_search()
        
        # Test CRUD operations
        created_id = test_create()
        test_update(created_id)
        test_delete(created_id)
        
        print("✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to server. Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
