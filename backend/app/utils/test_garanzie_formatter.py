"""
Test script for garanzie_formatter utility functions
"""

import asyncio
import sys
import os

# Add the parent directory to the path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from garanzie_formatter import (
    get_all_garanzie_formatted,
    get_garanzie_by_sezione_formatted,
    get_garanzie_count_by_sezione,
    export_garanzie_formatted_to_text
)


async def test_garanzie_formatter():
    """Test all functions in garanzie_formatter module"""
    
    print("🧪 Testing garanzie_formatter functions...\n")
    
    try:
        # Test 1: Get all garanzie formatted
        print("1️⃣ Testing get_all_garanzie_formatted()...")
        all_garanzie = await get_all_garanzie_formatted()
        print(f"   ✅ Found {len(all_garanzie)} garanzie")
        if all_garanzie:
            print(f"   📝 Example: {all_garanzie[0]}")
        print()
        
        # Test 2: Get garanzie count by sezione
        print("2️⃣ Testing get_garanzie_count_by_sezione()...")
        count_by_sezione = await get_garanzie_count_by_sezione()
        print(f"   ✅ Found {len(count_by_sezione)} sezioni")
        for sezione, count in count_by_sezione.items():
            print(f"   📊 {sezione}: {count} garanzie")
        print()
        
        # Test 3: Get garanzie by specific sezione (if any exists)
        if count_by_sezione:
            first_sezione = list(count_by_sezione.keys())[0]
            print(f"3️⃣ Testing get_garanzie_by_sezione_formatted('{first_sezione}')...")
            sezione_garanzie = await get_garanzie_by_sezione_formatted(first_sezione)
            print(f"   ✅ Found {len(sezione_garanzie)} garanzie for sezione '{first_sezione}'")
            if sezione_garanzie:
                print(f"   📝 Example: {sezione_garanzie[0]}")
            print()
        
        # Test 4: Export to text
        print("4️⃣ Testing export_garanzie_formatted_to_text()...")
        export_text = await export_garanzie_formatted_to_text()
        print(f"   ✅ Generated export text ({len(export_text)} characters)")
        print("   📄 First 200 characters:")
        print(f"   {export_text[:200]}...")
        print()
        
        print("🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


async def demo_usage():
    """Demo usage of the formatter functions"""
    
    print("\n" + "="*50)
    print("📋 DEMO: Usage examples")
    print("="*50)
    
    try:
        # Example 1: Get all garanzie
        print("\n🔍 Getting all garanzie formatted:")
        garanzie = await get_all_garanzie_formatted()
        
        for i, garanzia in enumerate(garanzie[:5], 1):  # Show first 5
            print(f"{i}. {garanzia}")
        
        if len(garanzie) > 5:
            print(f"... and {len(garanzie) - 5} more")
        
        # Example 2: Show statistics
        print(f"\n📊 Total garanzie found: {len(garanzie)}")
        
        count_by_sezione = await get_garanzie_count_by_sezione()
        print("\n📈 Garanzie by sezione:")
        for sezione, count in sorted(count_by_sezione.items()):
            print(f"   • {sezione}: {count} garanzie")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")


if __name__ == "__main__":
    print("🚀 Starting garanzie_formatter tests and demo...\n")
    
    # Run tests
    asyncio.run(test_garanzie_formatter())
    
    # Run demo
    asyncio.run(demo_usage())
    
    print("\n✨ Done!")
