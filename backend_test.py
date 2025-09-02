import requests
import sys
import json
from datetime import datetime, date

class AlloDebarrasAPITester:
    def __init__(self, base_url="https://enleve-tout.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                        if len(response_data) > 0:
                            print(f"   First item keys: {list(response_data[0].keys()) if response_data[0] else 'Empty'}")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_init_data(self):
        """Test data initialization"""
        return self.run_test("Initialize Base Data", "POST", "init-data", 200)

    def test_get_categories(self):
        """Test getting all categories"""
        success, response = self.run_test("Get All Categories", "GET", "categories", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} categories")
            for cat in response[:3]:  # Show first 3 categories
                print(f"   - {cat.get('name', 'Unknown')} (ID: {cat.get('id', 'Unknown')})")
        return success, response

    def test_get_subcategories(self, category_id):
        """Test getting subcategories for a specific category"""
        return self.run_test(
            f"Get Subcategories for {category_id}", 
            "GET", 
            f"categories/{category_id}/subcategories", 
            200
        )

    def test_get_articles(self):
        """Test getting all articles"""
        success, response = self.run_test("Get All Articles", "GET", "articles", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} articles")
            for art in response[:2]:  # Show first 2 articles
                print(f"   - {art.get('name', 'Unknown')} - {art.get('base_price', 0)}€")
        return success, response

    def test_get_zones(self):
        """Test getting geographic zones (new feature)"""
        success, response = self.run_test("Get Geographic Zones", "GET", "zones", 200)
        if success and isinstance(response, dict):
            print(f"   Found {len(response)} zones")
            for zone_key, zone_data in response.items():
                print(f"   - {zone_data.get('name', 'Unknown')}: {zone_data.get('description', 'No description')}")
        return success, response

    def test_get_available_slots(self, test_date="2025-02-18", zone="zone_1"):
        """Test getting available time slots (new feature)"""
        success, response = self.run_test(
            f"Get Available Slots for {test_date} in {zone}", 
            "GET", 
            f"available-slots?date={test_date}&zone={zone}", 
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} time slots")
            available_count = sum(1 for slot in response if slot.get('available', False))
            print(f"   Available slots: {available_count}/{len(response)}")
        return success, response

    def test_get_articles_by_category(self, category_id):
        """Test getting articles by category"""
        return self.run_test(
            f"Get Articles for Category {category_id}", 
            "GET", 
            f"categories/{category_id}/articles", 
            200
        )

    def test_create_quote_with_custom_items(self):
        """Test creating a quote with custom items (new feature)"""
        quote_data = {
            "quote_type": "instant",
            "items": [
                {
                    "article_id": "chaise_bureau",
                    "article_name": "Chaise de bureau",
                    "material": "Tissu",
                    "quantity": 1,
                    "unit_price": 25.0,
                    "is_dismantled": None,
                    "is_custom": False
                },
                {
                    "article_id": "lave_linge",
                    "article_name": "Lave-linge",
                    "material": "Blanc",
                    "quantity": 1,
                    "unit_price": 60.0,
                    "is_dismantled": True,  # Already dismantled
                    "is_custom": False
                }
            ],
            "custom_items": [
                {
                    "description": "Table en marbre antique",
                    "estimated_price": 0.0
                }
            ],
            "client_name": "Marie Dubois",
            "client_email": "marie.dubois@test.com",
            "client_phone": "0634567890",
            "address": "25 Rue des Mimosas, 83380 Les Issambres",
            "parking": "facile",
            "floor": 0,
            "elevator": False,
            "additional_info": "Accès par le jardin",
            "zone": "zone_1",
            "preferred_date": "2025-02-18",
            "preferred_time_slot": "09:00-10:00",
            "urgent": False,
            "photo_urls": []
        }
        
        success, response = self.run_test("Create Quote with Custom Items", "POST", "quotes", 200, quote_data)
        if success:
            quote_id = response.get('id')
            status = response.get('status')
            base_total = response.get('base_total', 0)
            final_total = response.get('final_total', 0)
            
            print(f"   Created quote with ID: {quote_id}")
            print(f"   Status: {status}")
            print(f"   Base total: {base_total}€")
            print(f"   Final total: {final_total}€")
            
            # Should be "awaiting_supplement" because of custom items
            if status == "awaiting_supplement":
                print("✅ Status correctly set to 'awaiting_supplement' for custom items")
            else:
                print(f"❌ Expected status 'awaiting_supplement', got '{status}'")
            
            return success, quote_id
        return success, None

    def test_get_quotes(self):
        """Test getting all quotes"""
        return self.run_test("Get All Quotes", "GET", "quotes", 200)

    def test_get_quote_by_id(self, quote_id):
        """Test getting a specific quote"""
        if quote_id:
            return self.run_test(f"Get Quote {quote_id}", "GET", f"quotes/{quote_id}", 200)
        return False, {}

def main():
    print("🚀 Starting Allo Débarras Express API Tests")
    print("=" * 60)
    
    tester = AlloDebarrasAPITester()
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Initialize data
    tester.test_init_data()
    
    # Test 3: Get categories
    success, categories = tester.test_get_categories()
    if not success:
        print("❌ Cannot proceed without categories")
        return 1
    
    # Test 4: Test specific categories mentioned in the flow
    mobilier_found = False
    electromenager_found = False
    
    for category in categories:
        if category.get('name') == 'MOBILIER':
            mobilier_found = True
            print(f"\n📁 Testing MOBILIER category flow...")
            # Test MOBILIER subcategories
            success_sub, subcats = tester.test_get_subcategories('mobilier')
            if success_sub:
                # Test LITERIE articles
                tester.test_get_articles_by_category('literie')
                # Test TABLES & BUREAUX articles
                tester.test_get_articles_by_category('tables_bureaux')
            
        elif category.get('name') == 'ÉLECTROMÉNAGER':
            electromenager_found = True
            print(f"\n🔌 Testing ÉLECTROMÉNAGER category flow...")
            # Test ÉLECTROMÉNAGER articles
            tester.test_get_articles_by_category('electromenager')
    
    if not mobilier_found:
        print("❌ MOBILIER category not found")
    if not electromenager_found:
        print("❌ ÉLECTROMÉNAGER category not found")
    
    # Test 5: Get all articles to verify specific ones exist
    print(f"\n📦 Testing specific articles...")
    success, articles = tester.test_get_articles()
    if success:
        required_articles = [
            ("lit_double_medicalise", "Lit double médicalisé", 150.0),
            ("congelateur_coffre", "Congélateur coffre", 80.0),
            ("secretaire_ancien", "Secrétaire ancien", 120.0)
        ]
        
        for article_id, article_name, expected_price in required_articles:
            found_article = next((art for art in articles if art.get('id') == article_id), None)
            if found_article:
                actual_price = found_article.get('base_price', 0)
                if actual_price == expected_price:
                    print(f"✅ {article_name}: Found with correct price {actual_price}€")
                else:
                    print(f"❌ {article_name}: Price mismatch - expected {expected_price}€, got {actual_price}€")
            else:
                print(f"❌ {article_name}: Not found in articles")
    
    # Test 6: Create quote with exact flow items
    print(f"\n💰 Testing complete quote flow...")
    success, quote_id = tester.test_create_quote()
    
    # Test 7: Get all quotes
    tester.test_get_quotes()
    
    # Test 8: Get specific quote
    if quote_id:
        tester.test_get_quote_by_id(quote_id)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 API Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed! Backend is ready for frontend testing.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check backend implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())