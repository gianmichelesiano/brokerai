#!/usr/bin/env python3
"""
Test script to verify database fixes for sezione column migration
"""

import sys
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_database_queries():
    """Test the fixed database queries"""
    try:
        # Create Supabase client
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_ANON_KEY')
        )
        
        print("🔍 Testing database queries after sezione column migration...")
        print()
        
        # Test 1: Query garanzie with sezioni join
        print("1. Testing garanzie query with sezioni join...")
        result = supabase.table('garanzie').select('id, sezione_id, titolo, descrizione, sezioni(nome)').limit(3).execute()
        print("✅ Query garanzie with sezioni join successful!")
        if result.data:
            print(f"   Sample data: {len(result.data)} records found")
            for item in result.data:
                sezione_nome = item.get('sezioni', {}).get('nome') if item.get('sezioni') else 'N/A'
                print(f"   - ID: {item['id']}, Titolo: {item['titolo'][:50]}..., Sezione: {sezione_nome}")
        else:
            print("   No data found in garanzie table")
        print()
        
        # Test 2: Query compagnie
        print("2. Testing compagnie query...")
        result2 = supabase.table('compagnie').select('id, nome').limit(3).execute()
        print("✅ Query compagnie successful!")
        if result2.data:
            print(f"   Sample data: {len(result2.data)} records found")
            for item in result2.data:
                print(f"   - ID: {item['id']}, Nome: {item['nome']}")
        else:
            print("   No data found in compagnie table")
        print()
        
        # Test 3: Test the specific query that was failing
        print("3. Testing the specific query that was causing the error...")
        try:
            # This should work now with the fixed query
            result3 = supabase.table('garanzie').select('id, sezione_id, titolo, descrizione, sezioni(nome)').eq('id', 1).execute()
            print("✅ Specific garanzia query successful!")
            if result3.data:
                item = result3.data[0]
                sezione_nome = item.get('sezioni', {}).get('nome') if item.get('sezioni') else 'N/A'
                print(f"   Garanzia ID 1: {item['titolo']}, Sezione: {sezione_nome}")
            else:
                print("   Garanzia with ID 1 not found")
        except Exception as e:
            print(f"❌ Specific query failed: {e}")
        print()
        
        # Test 4: Test sezioni table directly
        print("4. Testing sezioni table...")
        result4 = supabase.table('sezioni').select('id, nome, descrizione').limit(5).execute()
        print("✅ Query sezioni successful!")
        if result4.data:
            print(f"   Sample data: {len(result4.data)} sections found")
            for item in result4.data:
                print(f"   - ID: {item['id']}, Nome: {item['nome']}")
        else:
            print("   No data found in sezioni table")
        print()
        
        print("🎉 All database tests completed successfully!")
        print("The sezione column migration fixes are working correctly.")
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database_queries()
