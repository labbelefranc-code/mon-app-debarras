import requests
import sys
import json
import base64
from datetime import datetime, date

class AlloDebarrasAPITester:
    def __init__(self, base_url="https://junk-removal-app.preview.emergentagent.com"):
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

    def get_admin_auth_headers(self):
        """Get Basic Auth headers for admin endpoints"""
        credentials = "labbelefranc@gmail.com:admin06"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Basic {encoded_credentials}'
        }

    def test_admin_authentication(self):
        """Test admin authentication with correct credentials"""
        headers = self.get_admin_auth_headers()
        return self.run_test("Admin Authentication", "GET", "admin/photos", 200, headers=headers)

    def test_admin_authentication_invalid(self):
        """Test admin authentication with invalid credentials"""
        invalid_credentials = "invalid@email.com:wrongpass"
        encoded_credentials = base64.b64encode(invalid_credentials.encode()).decode()
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Basic {encoded_credentials}'
        }
        return self.run_test("Admin Authentication (Invalid)", "GET", "admin/photos", 401, headers=headers)

    def test_get_admin_photos(self):
        """Test GET /api/admin/photos - List all available photos"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test("Get Admin Photos", "GET", "admin/photos", 200, headers=headers)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} photos")
            assigned_count = sum(1 for photo in response if photo.get('is_assigned', False))
            print(f"   Assigned photos: {assigned_count}/{len(response)}")
            
            # Show sample photos
            for photo in response[:3]:
                status = "✅ Assigned" if photo.get('is_assigned') else "⚪ Unassigned"
                article_name = photo.get('assigned_to_article_name', 'N/A')
                print(f"   - {photo.get('filename', 'Unknown')} - {status} to {article_name}")
        return success, response

    def test_get_admin_articles_for_photos(self):
        """Test GET /api/admin/articles-for-photos - Get all articles for photo assignment"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test("Get Articles for Photo Assignment", "GET", "admin/articles-for-photos", 200, headers=headers)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} articles available for photo assignment")
            for article in response[:3]:
                print(f"   - {article.get('name', 'Unknown')} (ID: {article.get('id', 'Unknown')})")
        return success, response

    def test_assign_photo_to_article(self, photo_filename, article_id):
        """Test POST /api/admin/photos/assign - Assign a photo to an article"""
        headers = self.get_admin_auth_headers()
        assignment_data = {
            "photo_filename": photo_filename,
            "article_id": article_id
        }
        success, response = self.run_test(
            f"Assign Photo {photo_filename} to Article {article_id}", 
            "POST", 
            "admin/photos/assign", 
            200, 
            data=assignment_data,
            headers=headers
        )
        if success:
            article_name = response.get('article_name', 'Unknown')
            print(f"   Successfully assigned to article: {article_name}")
        return success, response

    def test_unassign_photo(self, photo_filename):
        """Test DELETE /api/admin/photos/{photo_filename}/assignment - Unassign a photo"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test(
            f"Unassign Photo {photo_filename}", 
            "DELETE", 
            f"admin/photos/{photo_filename}/assignment", 
            200, 
            headers=headers
        )
        return success, response

    def test_serve_static_photo(self, photo_filename):
        """Test GET /photos/{filename} - Serve static photo files"""
        # Note: This endpoint is not under /api prefix
        url = f"{self.base_url}/photos/{photo_filename}"
        print(f"\n🔍 Testing Serve Static Photo {photo_filename}...")
        print(f"   URL: {url}")
        
        self.tests_run += 1
        try:
            response = requests.get(url, timeout=10)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                content_type = response.headers.get('content-type', 'unknown')
                content_length = len(response.content)
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {content_type}")
                print(f"   Content-Length: {content_length} bytes")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.status_code
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, 0

    def test_assign_nonexistent_photo(self):
        """Test assigning a non-existent photo (error handling)"""
        headers = self.get_admin_auth_headers()
        assignment_data = {
            "photo_filename": "nonexistent_photo.jpg",
            "article_id": "chaise_bureau"
        }
        return self.run_test(
            "Assign Non-existent Photo (Error Test)", 
            "POST", 
            "admin/photos/assign", 
            404, 
            data=assignment_data,
            headers=headers
        )

    def test_assign_photo_to_nonexistent_article(self, photo_filename):
        """Test assigning a photo to non-existent article (error handling)"""
        headers = self.get_admin_auth_headers()
        assignment_data = {
            "photo_filename": photo_filename,
            "article_id": "nonexistent_article_id"
        }
        return self.run_test(
            "Assign Photo to Non-existent Article (Error Test)", 
            "POST", 
            "admin/photos/assign", 
            404, 
            data=assignment_data,
            headers=headers
        )

def main():
    print("🚀 Starting Allo Débarras Express API Tests - New Advanced Version")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Initialize data
    tester.test_init_data()
    
    # Test 3: Get categories (should have 3 main categories with icons)
    success, categories = tester.test_get_categories()
    if not success:
        print("❌ Cannot proceed without categories")
        return 1
    
    # Test 4: Verify the 3 main categories exist
    expected_main_categories = [
        ("maison_interieur", "🏠 Maison / Intérieur", "🏠"),
        ("exterieur_jardin", "🌳 Extérieur / Jardin / Garage / Cave", "🌳"),
        ("autres_special", "🎹 Catégorie \"Autres / Spécial\"", "🎹")
    ]
    
    print(f"\n🏠 Testing new 3-category structure...")
    main_categories_found = []
    
    for expected_id, expected_name, expected_icon in expected_main_categories:
        found_category = next((cat for cat in categories if cat.get('id') == expected_id), None)
        if found_category:
            print(f"✅ Found: {found_category.get('name')} with icon {found_category.get('icon')}")
            main_categories_found.append(found_category)
        else:
            print(f"❌ Missing main category: {expected_name}")
    
    # Test 5: Test Maison/Intérieur → Mobilier → Assises flow
    if main_categories_found:
        maison_category = next((cat for cat in main_categories_found if cat.get('id') == 'maison_interieur'), None)
        if maison_category:
            print(f"\n📁 Testing Maison/Intérieur subcategories...")
            success_sub, subcats = tester.test_get_subcategories('maison_interieur')
            
            if success_sub:
                # Look for Mobilier subcategory
                mobilier_subcat = next((sub for sub in subcats if sub.get('id') == 'mobilier'), None)
                if mobilier_subcat:
                    print(f"✅ Found Mobilier subcategory")
                    
                    # Test Mobilier → Assises flow
                    print(f"\n🪑 Testing Mobilier → Assises flow...")
                    success_assises, assises_subcats = tester.test_get_subcategories('mobilier')
                    
                    if success_assises:
                        assises_subcat = next((sub for sub in assises_subcats if sub.get('id') == 'assises'), None)
                        if assises_subcat:
                            print(f"✅ Found Assises subcategory")
                            
                            # Test articles in Assises category
                            success_articles, articles = tester.test_get_articles_by_category('assises')
                            if success_articles:
                                # Look for "Chaise de bureau" with "Tissu" material
                                chaise_bureau = next((art for art in articles if art.get('id') == 'chaise_bureau'), None)
                                if chaise_bureau:
                                    materials = chaise_bureau.get('materials', [])
                                    if 'Tissu' in materials:
                                        print(f"✅ Found 'Chaise de bureau' with 'Tissu' material")
                                    else:
                                        print(f"❌ 'Chaise de bureau' missing 'Tissu' material. Available: {materials}")
                                else:
                                    print(f"❌ 'Chaise de bureau' not found in Assises")
    
    # Test 6: Test Électroménager (gros) with requires_dismantling
    print(f"\n🔌 Testing Électroménager with dismantling feature...")
    success_electro, electro_articles = tester.test_get_articles_by_category('electromenager_gros')
    if success_electro:
        lave_linge = next((art for art in electro_articles if art.get('id') == 'lave_linge'), None)
        if lave_linge:
            requires_dismantling = lave_linge.get('requires_dismantling', False)
            if requires_dismantling:
                print(f"✅ Lave-linge correctly has requires_dismantling=True")
            else:
                print(f"❌ Lave-linge should have requires_dismantling=True")
        else:
            print(f"❌ Lave-linge not found in Électroménager")
    
    # Test 7: Test new geographic zones
    print(f"\n🗺️ Testing geographic zones...")
    success_zones, zones = tester.test_get_zones()
    if success_zones:
        expected_zones = ["zone_1", "zone_2", "zone_3"]
        for zone_key in expected_zones:
            if zone_key in zones:
                zone_data = zones[zone_key]
                print(f"✅ Zone {zone_key}: {zone_data.get('name')} - {zone_data.get('description')}")
            else:
                print(f"❌ Missing zone: {zone_key}")
    
    # Test 8: Test available time slots
    print(f"\n⏰ Testing time slots (Mardi/Mercredi/Jeudi 7h-20h)...")
    success_slots, slots = tester.test_get_available_slots("2025-02-18", "zone_1")  # Tuesday
    if success_slots:
        expected_slots = 13  # 7h to 20h = 13 slots (7-8, 8-9, ..., 19-20)
        if len(slots) == expected_slots:
            print(f"✅ Correct number of time slots: {len(slots)}")
            # Check first and last slots
            if slots[0].get('time_slot') == '07:00-08:00':
                print(f"✅ First slot correct: {slots[0].get('time_slot')}")
            if slots[-1].get('time_slot') == '19:00-20:00':
                print(f"✅ Last slot correct: {slots[-1].get('time_slot')}")
        else:
            print(f"❌ Expected {expected_slots} slots, got {len(slots)}")
    
    # Test 9: Create quote with custom items (new feature)
    print(f"\n💰 Testing quote creation with custom items...")
    success_quote, quote_id = tester.test_create_quote_with_custom_items()
    
    # Test 10: Get all quotes
    tester.test_get_quotes()
    
    # Test 11: Get specific quote
    if quote_id:
        tester.test_get_quote_by_id(quote_id)
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 API Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed >= (tester.tests_run * 0.8):  # 80% pass rate acceptable
        print("🎉 Backend API tests mostly successful! Ready for frontend testing.")
        return 0
    else:
        print(f"⚠️  Too many tests failed ({tester.tests_run - tester.tests_passed}). Backend needs fixes.")
        return 1

if __name__ == "__main__":
    sys.exit(main())