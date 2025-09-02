import requests
import sys
import json
from datetime import datetime

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

    def test_get_articles_by_category(self, category_id):
        """Test getting articles by category"""
        return self.run_test(
            f"Get Articles for Category {category_id}", 
            "GET", 
            f"categories/{category_id}/articles", 
            200
        )

    def test_create_quote(self):
        """Test creating a quote"""
        quote_data = {
            "quote_type": "instant",
            "items": [
                {
                    "article_id": "lit_double_medicalise",
                    "article_name": "Lit double médicalisé",
                    "material": "Métal",
                    "quantity": 1,
                    "unit_price": 150.0
                }
            ],
            "client_name": "Test Client",
            "client_email": "test@example.com",
            "client_phone": "0123456789",
            "address": "123 Rue de Test, 75001 Paris",
            "parking": "facile",
            "floor": 2,
            "elevator": True,
            "additional_info": "Test quote",
            "preferred_date": "2025-02-01",
            "urgent": False,
            "photo_urls": []
        }
        
        success, response = self.run_test("Create Quote", "POST", "quotes", 200, quote_data)
        if success:
            quote_id = response.get('id')
            print(f"   Created quote with ID: {quote_id}")
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
    print("=" * 50)
    
    tester = AlloDebarrasAPITester()
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Initialize data
    tester.test_init_data()
    
    # Test 3: Get categories
    success, categories = tester.test_get_categories()
    
    # Test 4: Get subcategories (if we have categories)
    if success and categories:
        # Test with mobilier category
        mobilier_cat = next((cat for cat in categories if cat.get('name') == 'MOBILIER'), None)
        if mobilier_cat:
            tester.test_get_subcategories(mobilier_cat['id'])
    
    # Test 5: Get all articles
    success, articles = tester.test_get_articles()
    
    # Test 6: Get articles by category (if we have categories)
    if success and categories:
        mobilier_cat = next((cat for cat in categories if cat.get('name') == 'MOBILIER'), None)
        if mobilier_cat:
            tester.test_get_articles_by_category(mobilier_cat['id'])
    
    # Test 7: Create a quote
    success, quote_id = tester.test_create_quote()
    
    # Test 8: Get all quotes
    tester.test_get_quotes()
    
    # Test 9: Get specific quote (if created)
    if quote_id:
        tester.test_get_quote_by_id(quote_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())