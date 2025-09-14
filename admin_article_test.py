#!/usr/bin/env python3
"""
Focused test for admin article creation functionality
Testing the specific issue reported: clicking "Sauvegarder" when editing or adding articles doesn't save anything
"""

import requests
import json
import base64
import sys
from datetime import datetime

class AdminArticleCreationTester:
    def __init__(self, base_url="https://item-removal-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_article_ids = []  # Track created articles for cleanup

    def get_admin_auth_headers(self):
        """Get Basic Auth headers for admin endpoints"""
        credentials = "labbelefranc@gmail.com:admin06"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Basic {encoded_credentials}'
        }

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
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

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

    def test_admin_authentication(self):
        """Test admin authentication with correct credentials"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test("Admin Authentication", "GET", "admin/photos", 200, headers=headers)
        if success:
            print("✅ Admin authentication successful")
        return success, response

    def test_get_categories(self):
        """Get all categories to find valid category_id for testing"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} categories")
            # Show some categories for reference
            for cat in response[:5]:
                print(f"   - {cat.get('name', 'Unknown')} (ID: {cat.get('id', 'Unknown')})")
        return success, response

    def test_create_article_with_valid_category(self, category_id, category_name):
        """Test creating an article with a valid category"""
        headers = self.get_admin_auth_headers()
        
        # Test article data similar to the review request but with valid category
        article_data = {
            "name": "Tonnelle de jardin",
            "category_id": category_id,
            "base_price": 0,
            "materials": ["aluminium", "toile polyester"],
            "description": "Tonnelle pliante avec sac de transport",
            "requires_dismantling": False
        }
        
        success, response = self.run_test(
            f"Create Article in {category_name}", 
            "POST", 
            "admin/articles", 
            200, 
            data=article_data,
            headers=headers
        )
        
        if success:
            article_id = response.get('id')
            article_name = response.get('name')
            base_price = response.get('base_price')
            materials = response.get('materials', [])
            
            print(f"   ✅ Created article ID: {article_id}")
            print(f"   ✅ Article name: {article_name}")
            print(f"   ✅ Base price: {base_price}€")
            print(f"   ✅ Materials: {materials}")
            
            # Track for cleanup
            if article_id:
                self.created_article_ids.append(article_id)
            
            return success, article_id
        return success, None

    def test_verify_article_saved(self, article_id):
        """Verify that the created article is actually saved in the database"""
        success, response = self.run_test(
            f"Verify Article {article_id} Saved", 
            "GET", 
            f"articles/{article_id}", 
            200
        )
        
        if success:
            saved_name = response.get('name')
            saved_price = response.get('base_price')
            saved_materials = response.get('materials', [])
            
            print(f"   ✅ Article retrieved from database")
            print(f"   ✅ Name: {saved_name}")
            print(f"   ✅ Price: {saved_price}€")
            print(f"   ✅ Materials: {saved_materials}")
            
            # Verify the data matches what we created
            if saved_name == "Tonnelle de jardin" and saved_price == 0:
                print("   ✅ Article data matches what was created")
                return True, response
            else:
                print("   ❌ Article data doesn't match what was created")
                return False, response
        return success, response

    def test_get_all_articles_includes_new(self, article_id):
        """Test that GET /api/articles includes the newly created article"""
        success, response = self.run_test("Get All Articles (Check New Article)", "GET", "articles", 200)
        
        if success and isinstance(response, list):
            # Look for our created article
            found_article = next((art for art in response if art.get('id') == article_id), None)
            if found_article:
                print(f"   ✅ New article found in articles list")
                print(f"   ✅ Article: {found_article.get('name')} - {found_article.get('base_price')}€")
                return True, response
            else:
                print(f"   ❌ New article NOT found in articles list")
                return False, response
        return success, response

    def test_update_article(self, article_id):
        """Test updating the created article"""
        headers = self.get_admin_auth_headers()
        
        update_data = {
            "name": "Tonnelle de jardin - Modifiée",
            "base_price": 150.0,
            "description": "Tonnelle pliante avec sac de transport - Version mise à jour"
        }
        
        success, response = self.run_test(
            f"Update Article {article_id}", 
            "PUT", 
            f"admin/articles/{article_id}", 
            200, 
            data=update_data,
            headers=headers
        )
        
        if success:
            updated_name = response.get('name')
            updated_price = response.get('base_price')
            print(f"   ✅ Article updated successfully")
            print(f"   ✅ New name: {updated_name}")
            print(f"   ✅ New price: {updated_price}€")
            
            # Verify the update was saved
            verify_success, verify_response = self.test_verify_article_saved(article_id)
            if verify_success:
                if verify_response.get('name') == "Tonnelle de jardin - Modifiée":
                    print("   ✅ Article update verified in database")
                    return True, response
                else:
                    print("   ❌ Article update NOT saved in database")
                    return False, response
        return success, response

    def test_create_article_invalid_category(self):
        """Test creating article with invalid category (should fail)"""
        headers = self.get_admin_auth_headers()
        
        article_data = {
            "name": "Test Article Invalid Category",
            "category_id": "jardin",  # This is the invalid category from the review request
            "base_price": 50.0,
            "materials": ["test"],
            "description": "Test article with invalid category",
            "requires_dismantling": False
        }
        
        success, response = self.run_test(
            "Create Article with Invalid Category (Should Fail)", 
            "POST", 
            "admin/articles", 
            404,  # Should return 404 Not Found
            data=article_data,
            headers=headers
        )
        
        if success:
            print("   ✅ Correctly rejected invalid category")
        return success, response

    def cleanup_created_articles(self):
        """Clean up articles created during testing"""
        headers = self.get_admin_auth_headers()
        
        for article_id in self.created_article_ids:
            print(f"\n🧹 Cleaning up article {article_id}...")
            success, _ = self.run_test(
                f"Delete Test Article {article_id}", 
                "DELETE", 
                f"admin/articles/{article_id}", 
                200, 
                headers=headers
            )
            if success:
                print(f"   ✅ Article {article_id} deleted successfully")
            else:
                print(f"   ❌ Failed to delete article {article_id}")

def main():
    print("🚀 Testing Admin Article Creation Functionality")
    print("=" * 60)
    print("Testing the specific issue: clicking 'Sauvegarder' when editing or adding articles doesn't save anything")
    print("=" * 60)
    
    tester = AdminArticleCreationTester()
    
    # Test 1: Admin Authentication
    print("\n📋 STEP 1: Testing Admin Authentication")
    auth_success, _ = tester.test_admin_authentication()
    if not auth_success:
        print("❌ Cannot proceed without admin authentication")
        return 1
    
    # Test 2: Get Categories to find valid category_id
    print("\n📋 STEP 2: Getting Available Categories")
    cat_success, categories = tester.test_get_categories()
    if not cat_success or not categories:
        print("❌ Cannot proceed without categories")
        return 1
    
    # Find a suitable category for testing (prefer outdoor/garden related)
    suitable_category = None
    
    # Look for outdoor/garden categories first
    for cat in categories:
        cat_id = cat.get('id', '')
        cat_name = cat.get('name', '')
        if any(keyword in cat_id.lower() or keyword in cat_name.lower() 
               for keyword in ['exterieur', 'jardin', 'mobilier_detente', 'divers_exterieur']):
            suitable_category = cat
            break
    
    # If no outdoor category found, use any available category
    if not suitable_category and categories:
        suitable_category = categories[0]
    
    if not suitable_category:
        print("❌ No suitable category found for testing")
        return 1
    
    category_id = suitable_category.get('id')
    category_name = suitable_category.get('name')
    print(f"   ✅ Using category: {category_name} (ID: {category_id})")
    
    # Test 3: Test invalid category (from review request)
    print("\n📋 STEP 3: Testing Invalid Category Handling")
    tester.test_create_article_invalid_category()
    
    # Test 4: Create Article with Valid Category
    print("\n📋 STEP 4: Creating Article with Valid Category")
    create_success, article_id = tester.test_create_article_with_valid_category(category_id, category_name)
    if not create_success or not article_id:
        print("❌ Failed to create article - this is the main issue!")
        return 1
    
    # Test 5: Verify Article is Saved in Database
    print("\n📋 STEP 5: Verifying Article is Saved in Database")
    verify_success, _ = tester.test_verify_article_saved(article_id)
    if not verify_success:
        print("❌ Article was created but not properly saved - this confirms the issue!")
        return 1
    
    # Test 6: Verify Article Appears in Articles List
    print("\n📋 STEP 6: Verifying Article Appears in Articles List")
    list_success, _ = tester.test_get_all_articles_includes_new(article_id)
    if not list_success:
        print("❌ Article not appearing in articles list")
        return 1
    
    # Test 7: Test Article Update (Edit functionality)
    print("\n📋 STEP 7: Testing Article Update (Edit Functionality)")
    update_success, _ = tester.test_update_article(article_id)
    if not update_success:
        print("❌ Article update failed - edit functionality not working!")
        return 1
    
    # Test 8: Cleanup
    print("\n📋 STEP 8: Cleanup")
    tester.cleanup_created_articles()
    
    # Final Results
    print("\n" + "=" * 60)
    print(f"📊 Admin Article Creation Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Admin authentication working")
        print("✅ Article creation working")
        print("✅ Article saving to database working")
        print("✅ Article editing/updating working")
        print("✅ Error handling for invalid categories working")
        print("🚀 The 'Sauvegarder' functionality is working correctly!")
        return 0
    else:
        failed_count = tester.tests_run - tester.tests_passed
        print(f"⚠️ {failed_count} tests failed out of {tester.tests_run}")
        print("🚨 The 'Sauvegarder' functionality has issues that need to be fixed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())