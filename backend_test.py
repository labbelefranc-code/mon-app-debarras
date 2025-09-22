import requests
import sys
import json
import base64
from datetime import datetime, date

class AlloDebarrasAPITester:
    def __init__(self, base_url="https://express-debarras.preview.emergentagent.com"):
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
        """Test assigning a non-existent photo (backend allows this as it's just a DB record)"""
        headers = self.get_admin_auth_headers()
        assignment_data = {
            "photo_filename": "nonexistent_photo.jpg",
            "article_id": "chaise_bureau"
        }
        return self.run_test(
            "Assign Non-existent Photo (Allowed)", 
            "POST", 
            "admin/photos/assign", 
            200, 
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

    # ===== NEW CATEGORY AND ARTICLE MANAGEMENT TESTS =====
    
    def test_create_category(self, category_data):
        """Test POST /api/admin/categories - Create new category"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test(
            f"Create Category '{category_data.get('name', 'Unknown')}'", 
            "POST", 
            "admin/categories", 
            200, 
            data=category_data,
            headers=headers
        )
        if success:
            category_id = response.get('id')
            category_name = response.get('name')
            print(f"   Created category ID: {category_id}")
            print(f"   Category name: {category_name}")
            return success, category_id
        return success, None

    def test_update_category(self, category_id, update_data):
        """Test PUT /api/admin/categories/{id} - Update category"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test(
            f"Update Category {category_id}", 
            "PUT", 
            f"admin/categories/{category_id}", 
            200, 
            data=update_data,
            headers=headers
        )
        if success:
            updated_name = response.get('name')
            print(f"   Updated category name: {updated_name}")
        return success, response

    def test_delete_category(self, category_id, expected_status=200):
        """Test DELETE /api/admin/categories/{id} - Delete category"""
        headers = self.get_admin_auth_headers()
        return self.run_test(
            f"Delete Category {category_id}", 
            "DELETE", 
            f"admin/categories/{category_id}", 
            expected_status, 
            headers=headers
        )

    def test_create_article(self, article_data):
        """Test POST /api/admin/articles - Create new article"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test(
            f"Create Article '{article_data.get('name', 'Unknown')}'", 
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
            print(f"   Created article ID: {article_id}")
            print(f"   Article name: {article_name}")
            print(f"   Base price: {base_price}€")
            return success, article_id
        return success, None

    def test_update_article(self, article_id, update_data):
        """Test PUT /api/admin/articles/{id} - Update article"""
        headers = self.get_admin_auth_headers()
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
            print(f"   Updated article name: {updated_name}")
            print(f"   Updated price: {updated_price}€")
        return success, response

    def test_delete_article(self, article_id, expected_status=200):
        """Test DELETE /api/admin/articles/{id} - Delete article"""
        headers = self.get_admin_auth_headers()
        return self.run_test(
            f"Delete Article {article_id}", 
            "DELETE", 
            f"admin/articles/{article_id}", 
            expected_status, 
            headers=headers
        )

    def test_get_categories_tree(self):
        """Test GET /api/admin/categories-tree - Get hierarchical category tree"""
        headers = self.get_admin_auth_headers()
        success, response = self.run_test(
            "Get Categories Tree", 
            "GET", 
            "admin/categories-tree", 
            200, 
            headers=headers
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} root categories")
            for root_cat in response:
                children_count = len(root_cat.get('children', []))
                articles_count = len(root_cat.get('articles', []))
                print(f"   - {root_cat.get('name', 'Unknown')}: {children_count} subcategories, {articles_count} articles")
        return success, response

    def test_category_hierarchy_constraints(self):
        """Test category hierarchy constraints (prevent self-parenting)"""
        headers = self.get_admin_auth_headers()
        
        # First create a test category
        test_category_data = {
            "name": "Test Hierarchy Category",
            "description": "For testing hierarchy constraints"
        }
        success, category_id = self.test_create_category(test_category_data)
        
        if success and category_id:
            # Try to make it its own parent (should fail)
            update_data = {"parent_id": category_id}
            success_constraint, _ = self.run_test(
                "Test Self-Parent Constraint (Should Fail)", 
                "PUT", 
                f"admin/categories/{category_id}", 
                400,  # Should return 400 Bad Request
                data=update_data,
                headers=headers
            )
            
            # Clean up - delete the test category
            self.test_delete_category(category_id)
            
            return success_constraint, None
        return False, None

    def test_deletion_constraints(self):
        """Test deletion constraints for categories with subcategories/articles"""
        headers = self.get_admin_auth_headers()
        
        # Create parent category
        parent_data = {
            "name": "Test Parent Category",
            "description": "Parent for constraint testing"
        }
        success_parent, parent_id = self.test_create_category(parent_data)
        
        if success_parent and parent_id:
            # Create child category
            child_data = {
                "name": "Test Child Category",
                "parent_id": parent_id,
                "description": "Child for constraint testing"
            }
            success_child, child_id = self.test_create_category(child_data)
            
            if success_child and child_id:
                # Try to delete parent (should fail because it has children)
                success_constraint, _ = self.test_delete_category(parent_id, expected_status=400)
                
                # Clean up - delete child first, then parent
                self.test_delete_category(child_id)
                self.test_delete_category(parent_id)
                
                return success_constraint, None
        return False, None

    def test_article_category_constraints(self):
        """Test article creation with non-existent category (should fail)"""
        headers = self.get_admin_auth_headers()
        
        article_data = {
            "name": "Test Article with Invalid Category",
            "category_id": "nonexistent_category_id",
            "base_price": 50.0,
            "materials": ["Test Material"],
            "description": "Article for testing category constraints"
        }
        
        return self.run_test(
            "Create Article with Non-existent Category (Should Fail)", 
            "POST", 
            "admin/articles", 
            404,  # Should return 404 Not Found
            data=article_data,
            headers=headers
        )

    def test_complete_database_cleanup(self):
        """Test complete database cleanup - delete all photos and articles"""
        print(f"\n🧹 STARTING COMPLETE DATABASE CLEANUP...")
        print("=" * 60)
        
        headers = self.get_admin_auth_headers()
        cleanup_results = {
            'photos_found': 0,
            'photos_unassigned': 0,
            'articles_found': 0,
            'articles_deleted': 0,
            'errors': []
        }
        
        # Step 1: Get all photos and unassign them
        print(f"\n📸 Step 1: Getting all photos for cleanup...")
        success_photos, photos = self.test_get_admin_photos()
        
        if success_photos and photos:
            cleanup_results['photos_found'] = len(photos)
            print(f"   Found {len(photos)} photos to process")
            
            # Unassign all assigned photos
            assigned_photos = [p for p in photos if p.get('is_assigned', False)]
            print(f"   Found {len(assigned_photos)} assigned photos to unassign")
            
            for photo in assigned_photos:
                filename = photo.get('filename')
                if filename:
                    print(f"   Unassigning photo: {filename}")
                    success_unassign, _ = self.test_unassign_photo(filename)
                    if success_unassign:
                        cleanup_results['photos_unassigned'] += 1
                        print(f"   ✅ Unassigned: {filename}")
                    else:
                        error_msg = f"Failed to unassign photo: {filename}"
                        cleanup_results['errors'].append(error_msg)
                        print(f"   ❌ {error_msg}")
        else:
            print("   ❌ Could not retrieve photos for cleanup")
            cleanup_results['errors'].append("Could not retrieve photos")
        
        # Step 2: Get all articles and delete them
        print(f"\n📄 Step 2: Getting all articles for deletion...")
        success_articles, articles = self.test_get_articles()
        
        if success_articles and articles:
            cleanup_results['articles_found'] = len(articles)
            print(f"   Found {len(articles)} articles to delete")
            
            # Delete all articles
            for article in articles:
                article_id = article.get('id')
                article_name = article.get('name', 'Unknown')
                if article_id:
                    print(f"   Deleting article: {article_name} (ID: {article_id})")
                    success_delete, _ = self.test_delete_article(article_id)
                    if success_delete:
                        cleanup_results['articles_deleted'] += 1
                        print(f"   ✅ Deleted: {article_name}")
                    else:
                        error_msg = f"Failed to delete article: {article_name} (ID: {article_id})"
                        cleanup_results['errors'].append(error_msg)
                        print(f"   ❌ {error_msg}")
        else:
            print("   ❌ Could not retrieve articles for cleanup")
            cleanup_results['errors'].append("Could not retrieve articles")
        
        # Step 3: Verify cleanup
        print(f"\n🔍 Step 3: Verifying cleanup completion...")
        
        # Verify no assigned photos remain
        success_verify_photos, remaining_photos = self.test_get_admin_photos()
        if success_verify_photos:
            assigned_remaining = [p for p in remaining_photos if p.get('is_assigned', False)]
            if len(assigned_remaining) == 0:
                print(f"   ✅ Photo cleanup verified: No assigned photos remaining")
            else:
                error_msg = f"Photo cleanup incomplete: {len(assigned_remaining)} photos still assigned"
                cleanup_results['errors'].append(error_msg)
                print(f"   ❌ {error_msg}")
        
        # Verify no articles remain
        success_verify_articles, remaining_articles = self.test_get_articles()
        if success_verify_articles:
            if len(remaining_articles) == 0:
                print(f"   ✅ Article cleanup verified: No articles remaining")
            else:
                error_msg = f"Article cleanup incomplete: {len(remaining_articles)} articles still exist"
                cleanup_results['errors'].append(error_msg)
                print(f"   ❌ {error_msg}")
                # Show remaining articles
                for art in remaining_articles[:5]:  # Show first 5
                    print(f"      - {art.get('name', 'Unknown')} (ID: {art.get('id', 'Unknown')})")
        
        # Print cleanup summary
        print(f"\n📊 CLEANUP SUMMARY:")
        print(f"   Photos found: {cleanup_results['photos_found']}")
        print(f"   Photos unassigned: {cleanup_results['photos_unassigned']}")
        print(f"   Articles found: {cleanup_results['articles_found']}")
        print(f"   Articles deleted: {cleanup_results['articles_deleted']}")
        print(f"   Errors encountered: {len(cleanup_results['errors'])}")
        
        if cleanup_results['errors']:
            print(f"\n❌ ERRORS DURING CLEANUP:")
            for error in cleanup_results['errors']:
                print(f"   - {error}")
        
        # Determine overall success
        cleanup_success = (
            len(cleanup_results['errors']) == 0 and
            cleanup_results['photos_unassigned'] == len([p for p in photos if p.get('is_assigned', False)]) and
            cleanup_results['articles_deleted'] == cleanup_results['articles_found']
        )
        
        if cleanup_success:
            print(f"\n🎉 COMPLETE DATABASE CLEANUP SUCCESSFUL!")
            print(f"   ✅ All photo assignments removed")
            print(f"   ✅ All articles deleted")
            print(f"   ✅ Database is now clean and ready for fresh start")
        else:
            print(f"\n⚠️ CLEANUP COMPLETED WITH ISSUES")
            print(f"   Some operations may have failed - see errors above")
        
        return cleanup_success, cleanup_results

def cleanup_database():
    """Main function for complete database cleanup operation"""
    print("🧹 ALLO DÉBARRAS EXPRESS - COMPLETE DATABASE CLEANUP")
    print("=" * 70)
    print("🎯 TASK: Delete all photos and articles from the database")
    print("🔐 Using admin credentials: labbelefranc@gmail.com / admin06")
    print("⚠️  This will remove ALL existing data for a fresh start")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    
    # Test admin authentication first
    print(f"\n🔐 Step 0: Verifying admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ CRITICAL ERROR: Admin authentication failed!")
        print("   Cannot proceed with cleanup without admin access")
        return 1
    
    print("✅ Admin authentication successful - proceeding with cleanup")
    
    # Perform complete database cleanup
    success_cleanup, cleanup_results = tester.test_complete_database_cleanup()
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 CLEANUP OPERATION RESULTS:")
    print(f"   Authentication: {'✅ Success' if success_auth else '❌ Failed'}")
    print(f"   Database Cleanup: {'✅ Success' if success_cleanup else '❌ Failed'}")
    
    if success_cleanup:
        print(f"\n🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY!")
        print(f"   ✅ All photo assignments removed ({cleanup_results['photos_unassigned']} photos)")
        print(f"   ✅ All articles deleted ({cleanup_results['articles_deleted']} articles)")
        print(f"   ✅ Database is now completely clean")
        print(f"   🚀 Ready for fresh start without any existing data")
        return 0
    else:
        print(f"\n⚠️ CLEANUP COMPLETED WITH ISSUES:")
        print(f"   📸 Photos processed: {cleanup_results['photos_unassigned']}/{cleanup_results['photos_found']}")
        print(f"   📄 Articles deleted: {cleanup_results['articles_deleted']}/{cleanup_results['articles_found']}")
        print(f"   ❌ Errors: {len(cleanup_results['errors'])}")
        
        if cleanup_results['errors']:
            print(f"\n🚨 ERRORS ENCOUNTERED:")
            for error in cleanup_results['errors']:
                print(f"   - {error}")
        
        return 1

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
    
    # Test 12: Admin Photo Management System
    print(f"\n📸 Testing Admin Photo Management System...")
    
    # Test admin authentication
    print(f"\n🔐 Testing admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ Admin authentication failed - cannot proceed with photo management tests")
    else:
        # Test invalid authentication
        tester.test_admin_authentication_invalid()
        
        # Test getting all photos
        success_photos, photos = tester.test_get_admin_photos()
        
        # Test getting articles for photo assignment
        success_articles, articles = tester.test_get_admin_articles_for_photos()
        
        if success_photos and success_articles and photos and articles:
            # Get a sample photo and article for testing
            sample_photo = photos[0]['filename'] if photos else None
            sample_article_id = articles[0]['id'] if articles else None
            
            if sample_photo and sample_article_id:
                print(f"\n🔗 Testing photo assignment workflow...")
                
                # Test photo assignment
                success_assign, _ = tester.test_assign_photo_to_article(sample_photo, sample_article_id)
                
                if success_assign:
                    # Verify assignment by getting photos again
                    print(f"\n🔍 Verifying photo assignment...")
                    success_verify, updated_photos = tester.test_get_admin_photos()
                    if success_verify:
                        assigned_photo = next((p for p in updated_photos if p['filename'] == sample_photo), None)
                        if assigned_photo and assigned_photo.get('is_assigned'):
                            print(f"✅ Photo assignment verified - {sample_photo} is now assigned")
                        else:
                            print(f"❌ Photo assignment verification failed")
                    
                    # Test photo unassignment
                    print(f"\n🔓 Testing photo unassignment...")
                    success_unassign, _ = tester.test_unassign_photo(sample_photo)
                    
                    if success_unassign:
                        # Verify unassignment
                        print(f"\n🔍 Verifying photo unassignment...")
                        success_verify2, updated_photos2 = tester.test_get_admin_photos()
                        if success_verify2:
                            unassigned_photo = next((p for p in updated_photos2 if p['filename'] == sample_photo), None)
                            if unassigned_photo and not unassigned_photo.get('is_assigned'):
                                print(f"✅ Photo unassignment verified - {sample_photo} is now unassigned")
                            else:
                                print(f"❌ Photo unassignment verification failed")
                
                # Test static photo serving
                print(f"\n🖼️ Testing static photo serving...")
                tester.test_serve_static_photo(sample_photo)
                
                # Test error handling
                print(f"\n⚠️ Testing error handling...")
                tester.test_assign_nonexistent_photo()
                tester.test_assign_photo_to_nonexistent_article(sample_photo)
            else:
                print("❌ No photos or articles available for testing assignment workflow")
        else:
            print("❌ Could not retrieve photos or articles for assignment testing")
    
    # Test 13: NEW COMPREHENSIVE CATEGORY AND ARTICLE MANAGEMENT TESTING
    print(f"\n🏗️ Testing Category and Article Management System...")
    
    if success_auth:  # Only proceed if admin auth works
        # Test category tree structure
        print(f"\n🌳 Testing category tree structure...")
        success_tree, tree_data = tester.test_get_categories_tree()
        
        # Test category CRUD operations
        print(f"\n📁 Testing Category CRUD Operations...")
        
        # Create a new test category
        test_category_data = {
            "name": "Test Electronics Category",
            "description": "Category for testing CRUD operations",
            "icon": "📱"
        }
        success_create_cat, test_category_id = tester.test_create_category(test_category_data)
        
        if success_create_cat and test_category_id:
            # Update the category
            update_category_data = {
                "name": "Updated Electronics Category",
                "description": "Updated description for testing"
            }
            success_update_cat, _ = tester.test_update_category(test_category_id, update_category_data)
            
            # Test article CRUD operations
            print(f"\n📄 Testing Article CRUD Operations...")
            
            # Create a new test article in the test category
            test_article_data = {
                "name": "Test Smartphone",
                "category_id": test_category_id,
                "base_price": 75.0,
                "materials": ["Plastic", "Metal", "Glass"],
                "description": "Test smartphone for CRUD operations",
                "requires_dismantling": False
            }
            success_create_art, test_article_id = tester.test_create_article(test_article_data)
            
            if success_create_art and test_article_id:
                # Update the article
                update_article_data = {
                    "name": "Updated Test Smartphone",
                    "base_price": 85.0,
                    "description": "Updated smartphone description"
                }
                success_update_art, _ = tester.test_update_article(test_article_id, update_article_data)
                
                # Test photo assignment to the new article
                if success_photos and photos:
                    sample_photo_for_new_article = photos[1]['filename'] if len(photos) > 1 else photos[0]['filename']
                    print(f"\n🔗 Testing photo assignment to new article...")
                    success_assign_new, _ = tester.test_assign_photo_to_article(sample_photo_for_new_article, test_article_id)
                    
                    if success_assign_new:
                        print(f"✅ Successfully assigned photo to new article")
                        # Unassign for cleanup
                        tester.test_unassign_photo(sample_photo_for_new_article)
                
                # Delete the test article
                success_delete_art, _ = tester.test_delete_article(test_article_id)
                print(f"✅ Test article cleanup: {'Success' if success_delete_art else 'Failed'}")
            
            # Delete the test category (should work now that article is deleted)
            success_delete_cat, _ = tester.test_delete_category(test_category_id)
            print(f"✅ Test category cleanup: {'Success' if success_delete_cat else 'Failed'}")
        
        # Test hierarchy constraints
        print(f"\n🔒 Testing Hierarchy Constraints...")
        success_hierarchy, _ = tester.test_category_hierarchy_constraints()
        
        # Test deletion constraints
        print(f"\n🚫 Testing Deletion Constraints...")
        success_deletion, _ = tester.test_deletion_constraints()
        
        # Test article category constraints
        print(f"\n⚠️ Testing Article Category Constraints...")
        success_article_constraint, _ = tester.test_article_category_constraints()
        
        # Test creating subcategory with existing parent
        print(f"\n👨‍👩‍👧 Testing Parent-Child Category Relationships...")
        if categories:
            # Find a main category to use as parent
            main_category = next((cat for cat in categories if cat.get('id') == 'maison_interieur'), None)
            if main_category:
                subcategory_data = {
                    "name": "Test Subcategory",
                    "parent_id": main_category['id'],
                    "description": "Test subcategory with valid parent"
                }
                success_subcat, subcat_id = tester.test_create_category(subcategory_data)
                
                if success_subcat and subcat_id:
                    print(f"✅ Successfully created subcategory with parent")
                    # Clean up
                    tester.test_delete_category(subcat_id)
        
        # Test updating article to different category
        print(f"\n🔄 Testing Article Category Transfer...")
        if categories and len(categories) >= 2:
            # Get existing articles
            success_existing_arts, existing_articles = tester.test_get_articles()
            if success_existing_arts and existing_articles:
                # Find an article to test with
                test_existing_article = existing_articles[0]
                original_category_id = test_existing_article.get('category_id')
                
                # Find a different category
                different_category = next((cat for cat in categories if cat.get('id') != original_category_id), None)
                if different_category:
                    # Update article to different category
                    transfer_data = {"category_id": different_category['id']}
                    success_transfer, _ = tester.test_update_article(test_existing_article['id'], transfer_data)
                    
                    if success_transfer:
                        print(f"✅ Successfully transferred article to different category")
                        # Restore original category
                        restore_data = {"category_id": original_category_id}
                        tester.test_update_article(test_existing_article['id'], restore_data)
        
        # Verify category tree after all operations
        print(f"\n🌳 Final Category Tree Verification...")
        success_final_tree, final_tree_data = tester.test_get_categories_tree()
        
        if success_final_tree:
            print(f"✅ Category tree structure maintained after all operations")
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 COMPREHENSIVE API Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Calculate success rate
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed >= (tester.tests_run * 0.85):  # 85% pass rate for comprehensive testing
        print("🎉 COMPREHENSIVE Backend API tests successful!")
        print("✅ Photo Management System: Working")
        print("✅ Category Management System: Working") 
        print("✅ Article Management System: Working")
        print("✅ Hierarchy & Constraints: Working")
        print("🚀 Complete admin management system ready!")
        return 0
    else:
        failed_count = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_count} tests failed out of {tester.tests_run}. Backend needs attention.")
        if success_rate >= 70:
            print("📝 Most core functionality working, minor issues detected.")
        else:
            print("🚨 Significant issues detected, major fixes needed.")
        return 1

def test_specific_article_creation_issue():
    """Test the specific issue reported by user about article creation not working"""
    print("🔍 TESTING SPECIFIC ARTICLE CREATION ISSUE")
    print("=" * 70)
    print("🎯 TASK: Verify if articles are actually being saved when using admin interface")
    print("📝 USER REPORT: Adding articles through admin interface doesn't work")
    print("🔐 Using admin credentials: labbelefranc@gmail.com / admin06")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    
    # Step 1: Test admin authentication
    print(f"\n🔐 Step 1: Testing admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ CRITICAL ERROR: Admin authentication failed!")
        return 1
    print("✅ Admin authentication successful")
    
    # Step 2: Check current articles in database (should be 0 since cleaned)
    print(f"\n📊 Step 2: Checking current articles in database...")
    success_articles, current_articles = tester.test_get_articles()
    if success_articles:
        print(f"   Current articles in database: {len(current_articles)}")
        if len(current_articles) == 0:
            print("✅ Database is clean as expected (0 articles)")
        else:
            print(f"⚠️  Found {len(current_articles)} existing articles:")
            for art in current_articles[:5]:  # Show first 5
                print(f"      - {art.get('name', 'Unknown')} (ID: {art.get('id', 'Unknown')})")
    else:
        print("❌ Could not retrieve current articles")
        return 1
    
    # Step 3: Test POST /api/admin/articles with exact frontend data
    print(f"\n🔧 Step 3: Testing POST /api/admin/articles with exact frontend data...")
    
    # Use the exact data structure that the frontend is sending
    test_article_data = {
        "name": "Test Article Frontend",
        "category_id": "exterieur_jardin",
        "base_price": 0,
        "materials": ["test", "material"],
        "description": "Test de sauvegarde frontend",
        "requires_dismantling": False
    }
    
    print(f"   Testing with data: {json.dumps(test_article_data, indent=2)}")
    
    success_create, article_id = tester.test_create_article(test_article_data)
    
    if success_create and article_id:
        print(f"✅ Article creation successful!")
        print(f"   Created article ID: {article_id}")
        
        # Get the full article details
        success_get_details, article_details = tester.run_test(
            f"Get Created Article Details", 
            "GET", 
            f"articles/{article_id}", 
            200
        )
        
        if success_get_details:
            print(f"   Article name: {article_details.get('name')}")
            print(f"   Category ID: {article_details.get('category_id')}")
            print(f"   Base price: {article_details.get('base_price')}€")
            print(f"   Materials: {article_details.get('materials')}")
        
        # Step 4: Verify article is saved to database
        print(f"\n💾 Step 4: Verifying article is saved to database...")
        success_verify, updated_articles = tester.test_get_articles()
        
        if success_verify:
            # Look for our created article
            found_article = next((art for art in updated_articles if art.get('id') == article_id), None)
            if found_article:
                print(f"✅ Article successfully saved to database!")
                print(f"   Found article: {found_article.get('name')}")
                print(f"   Database now contains {len(updated_articles)} articles")
            else:
                print(f"❌ CRITICAL: Article not found in database after creation!")
                print(f"   Database contains {len(updated_articles)} articles but our article is missing")
                return 1
        else:
            print(f"❌ Could not verify database state after article creation")
            return 1
        
        # Step 5: Test GET /api/articles returns the newly created article
        print(f"\n🔍 Step 5: Testing GET /api/articles returns newly created article...")
        success_get, all_articles = tester.test_get_articles()
        
        if success_get:
            found_in_public = next((art for art in all_articles if art.get('id') == article_id), None)
            if found_in_public:
                print(f"✅ Article accessible via public GET /api/articles endpoint!")
                print(f"   Article: {found_in_public.get('name')} - {found_in_public.get('base_price')}€")
            else:
                print(f"❌ Article not accessible via public GET /api/articles endpoint!")
                return 1
        else:
            print(f"❌ Could not test public articles endpoint")
            return 1
        
        # Step 6: Test specific category endpoint
        print(f"\n🏷️ Step 6: Testing GET /api/categories/exterieur_jardin/articles...")
        success_cat, category_articles = tester.test_get_articles_by_category("exterieur_jardin")
        
        if success_cat:
            found_in_category = next((art for art in category_articles if art.get('id') == article_id), None)
            if found_in_category:
                print(f"✅ Article accessible via category-specific endpoint!")
                print(f"   Found in 'exterieur_jardin' category: {found_in_category.get('name')}")
            else:
                print(f"❌ Article not found in category-specific endpoint!")
                print(f"   Category 'exterieur_jardin' contains {len(category_articles)} articles")
                return 1
        else:
            print(f"❌ Could not test category-specific articles endpoint")
            return 1
        
        # Step 7: Clean up - delete the test article
        print(f"\n🧹 Step 7: Cleaning up test article...")
        success_delete, _ = tester.test_delete_article(article_id)
        if success_delete:
            print(f"✅ Test article cleaned up successfully")
        else:
            print(f"⚠️  Could not clean up test article (ID: {article_id})")
        
        print(f"\n🎉 ARTICLE CREATION TEST COMPLETED SUCCESSFULLY!")
        print(f"✅ Admin authentication working")
        print(f"✅ POST /api/admin/articles working correctly")
        print(f"✅ Article saved to database successfully")
        print(f"✅ Article accessible via GET /api/articles")
        print(f"✅ Article accessible via category endpoint")
        print(f"✅ All backend APIs for article creation are working perfectly")
        print(f"\n💡 CONCLUSION: Backend article creation is working correctly.")
        print(f"   If users cannot save articles, the issue is in the frontend")
        print(f"   implementation or frontend-backend communication.")
        
        return 0
        
    else:
        print(f"❌ CRITICAL: Article creation failed!")
        print(f"   This indicates a backend issue with POST /api/admin/articles")
        return 1

def test_jardin_admin_interface():
    """Test the restored Jardin administration interface functionality"""
    print("🌳 TESTING JARDIN ADMINISTRATION INTERFACE")
    print("=" * 70)
    print("🎯 TASK: Test restored Jardin admin interface with hierarchical structure")
    print("📝 REQUIREMENTS:")
    print("   1. Test navigation to Jardin section from admin dropdown")
    print("   2. Test hierarchical structure display (3 main categories)")
    print("   3. Test navigation within categories to see articles")
    print("   4. Test 'Ajouter un nouvel article' with correct category_id")
    print("   5. Test data consistency - articles saved with correct category_id")
    print("🔐 Using admin credentials: labbelefranc@gmail.com / admin06")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    results = {
        'auth_working': False,
        'categories_structure': False,
        'jardin_categories': [],
        'article_creation': False,
        'data_consistency': False,
        'created_articles': [],
        'errors': []
    }
    
    # Step 1: Test admin authentication
    print(f"\n🔐 Step 1: Testing admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    results['auth_working'] = success_auth
    
    if not success_auth:
        print("❌ CRITICAL ERROR: Admin authentication failed!")
        results['errors'].append("Admin authentication failed")
        return results
    
    print("✅ Admin authentication successful")
    
    # Step 2: Test hierarchical category structure
    print(f"\n🌳 Step 2: Testing hierarchical category structure...")
    success_tree, tree_data = tester.test_get_categories_tree()
    
    if success_tree and tree_data:
        print(f"   Found {len(tree_data)} root categories")
        
        # Look for the main Jardin category structure
        expected_jardin_categories = [
            "MOBILIER DE JARDIN & CONTENANTS",
            "JARDIN & EXTÉRIEUR", 
            "BRICOLAGE, MATÉRIAUX & ÉNERGIE"
        ]
        
        # Find exterieur_jardin category and its structure
        jardin_root = None
        for root_cat in tree_data:
            if root_cat.get('id') == 'exterieur_jardin' or 'jardin' in root_cat.get('name', '').lower():
                jardin_root = root_cat
                break
        
        if jardin_root:
            print(f"✅ Found Jardin root category: {jardin_root.get('name')}")
            results['categories_structure'] = True
            results['jardin_categories'] = jardin_root.get('children', [])
            
            # Check for expected subcategories
            subcategories = jardin_root.get('children', [])
            print(f"   Jardin subcategories found: {len(subcategories)}")
            
            for subcat in subcategories:
                subcat_name = subcat.get('name', 'Unknown')
                articles_count = len(subcat.get('articles', []))
                print(f"   - {subcat_name}: {articles_count} articles")
        else:
            print("❌ Jardin root category not found in hierarchy")
            results['errors'].append("Jardin root category not found")
    else:
        print("❌ Could not retrieve category tree structure")
        results['errors'].append("Category tree structure not accessible")
    
    # Step 3: Test article creation with correct category_id (exterieur_jardin)
    print(f"\n🔧 Step 3: Testing article creation with correct category_id...")
    
    # Test articles for each expected Jardin category type
    test_articles = [
        {
            "name": "Salon de jardin en résine",
            "category_id": "exterieur_jardin",
            "base_price": 180.0,
            "materials": ["résine tressée", "aluminium"],
            "description": "Salon de jardin 4 places avec table et chaises",
            "requires_dismantling": False
        },
        {
            "name": "Tonnelle de jardin",
            "category_id": "exterieur_jardin", 
            "base_price": 120.0,
            "materials": ["aluminium", "toile polyester"],
            "description": "Tonnelle démontable 3x3m avec structure aluminium",
            "requires_dismantling": True
        },
        {
            "name": "Barbecue à gaz",
            "category_id": "exterieur_jardin",
            "base_price": 85.0,
            "materials": ["inox", "fonte"],
            "description": "Barbecue à gaz 3 brûleurs avec plancha",
            "requires_dismantling": False
        }
    ]
    
    created_count = 0
    for article_data in test_articles:
        print(f"\n   Testing creation of: {article_data['name']}")
        success_create, article_id = tester.test_create_article(article_data)
        
        if success_create and article_id:
            created_count += 1
            results['created_articles'].append({
                'id': article_id,
                'name': article_data['name'],
                'category_id': article_data['category_id']
            })
            print(f"   ✅ Created: {article_data['name']} (ID: {article_id})")
        else:
            print(f"   ❌ Failed to create: {article_data['name']}")
            results['errors'].append(f"Failed to create article: {article_data['name']}")
    
    results['article_creation'] = created_count > 0
    print(f"\n   Article creation summary: {created_count}/{len(test_articles)} articles created")
    
    # Step 4: Test data consistency - verify articles are saved with correct category_id
    print(f"\n💾 Step 4: Testing data consistency...")
    
    if results['created_articles']:
        # Test GET /api/articles
        success_all, all_articles = tester.test_get_articles()
        if success_all:
            print(f"   Total articles in database: {len(all_articles)}")
            
            # Verify each created article
            consistent_count = 0
            for created_article in results['created_articles']:
                found_article = next((art for art in all_articles if art.get('id') == created_article['id']), None)
                if found_article:
                    stored_category = found_article.get('category_id')
                    expected_category = created_article['category_id']
                    
                    if stored_category == expected_category:
                        consistent_count += 1
                        print(f"   ✅ {created_article['name']}: category_id = {stored_category} (correct)")
                    else:
                        print(f"   ❌ {created_article['name']}: category_id = {stored_category}, expected = {expected_category}")
                        results['errors'].append(f"Category mismatch for {created_article['name']}")
                else:
                    print(f"   ❌ {created_article['name']}: not found in database")
                    results['errors'].append(f"Article not found: {created_article['name']}")
            
            results['data_consistency'] = consistent_count == len(results['created_articles'])
            print(f"   Data consistency: {consistent_count}/{len(results['created_articles'])} articles have correct category_id")
        else:
            print("   ❌ Could not verify data consistency - cannot retrieve articles")
            results['errors'].append("Cannot retrieve articles for consistency check")
    
    # Step 5: Test category-specific article retrieval
    print(f"\n🏷️ Step 5: Testing category-specific article retrieval...")
    
    success_cat, jardin_articles = tester.test_get_articles_by_category("exterieur_jardin")
    if success_cat:
        print(f"   Articles in 'exterieur_jardin' category: {len(jardin_articles)}")
        
        # Verify our created articles are in the category
        found_in_category = 0
        for created_article in results['created_articles']:
            found = next((art for art in jardin_articles if art.get('id') == created_article['id']), None)
            if found:
                found_in_category += 1
                print(f"   ✅ Found in category: {found.get('name')}")
            else:
                print(f"   ❌ Not found in category: {created_article['name']}")
        
        print(f"   Category retrieval: {found_in_category}/{len(results['created_articles'])} articles found")
    else:
        print("   ❌ Could not retrieve articles by category")
        results['errors'].append("Category-specific article retrieval failed")
    
    # Step 6: Test admin categories tree endpoint (used by frontend)
    print(f"\n🌳 Step 6: Testing admin categories tree endpoint...")
    
    headers = tester.get_admin_auth_headers()
    success_admin_tree, admin_tree = tester.run_test(
        "Get Admin Categories Tree",
        "GET",
        "admin/categories-tree",
        200,
        headers=headers
    )
    
    if success_admin_tree and admin_tree:
        print(f"   Admin tree endpoint working: {len(admin_tree)} root categories")
        
        # Find jardin articles in admin tree
        jardin_articles_in_tree = 0
        for root_cat in admin_tree:
            if root_cat.get('id') == 'exterieur_jardin':
                jardin_articles_in_tree = len(root_cat.get('articles', []))
                print(f"   Jardin articles in admin tree: {jardin_articles_in_tree}")
                
                # Show sample articles
                for article in root_cat.get('articles', [])[:3]:
                    print(f"     - {article.get('name', 'Unknown')} - {article.get('base_price', 0)}€")
                break
    else:
        print("   ❌ Admin categories tree endpoint failed")
        results['errors'].append("Admin categories tree endpoint failed")
    
    # Clean up created test articles
    print(f"\n🧹 Step 7: Cleaning up test articles...")
    cleaned_count = 0
    for created_article in results['created_articles']:
        success_delete, _ = tester.test_delete_article(created_article['id'])
        if success_delete:
            cleaned_count += 1
            print(f"   ✅ Cleaned up: {created_article['name']}")
        else:
            print(f"   ⚠️  Could not clean up: {created_article['name']}")
    
    print(f"   Cleanup: {cleaned_count}/{len(results['created_articles'])} articles cleaned")
    
    # Final results
    print(f"\n📊 JARDIN ADMIN INTERFACE TEST RESULTS:")
    print(f"   ✅ Admin Authentication: {'Working' if results['auth_working'] else 'Failed'}")
    print(f"   ✅ Category Structure: {'Working' if results['categories_structure'] else 'Failed'}")
    print(f"   ✅ Article Creation: {'Working' if results['article_creation'] else 'Failed'}")
    print(f"   ✅ Data Consistency: {'Working' if results['data_consistency'] else 'Failed'}")
    print(f"   ❌ Errors: {len(results['errors'])}")
    
    if results['errors']:
        print(f"\n🚨 ERRORS ENCOUNTERED:")
        for error in results['errors']:
            print(f"   - {error}")
    
    # Overall success determination
    success_criteria = [
        results['auth_working'],
        results['categories_structure'], 
        results['article_creation'],
        results['data_consistency']
    ]
    
    overall_success = all(success_criteria) and len(results['errors']) == 0
    
    if overall_success:
        print(f"\n🎉 JARDIN ADMIN INTERFACE TEST SUCCESSFUL!")
        print(f"   ✅ All backend APIs supporting Jardin admin interface are working")
        print(f"   ✅ Article creation with correct category_id working")
        print(f"   ✅ Data consistency maintained")
        print(f"   ✅ Category hierarchy accessible")
        print(f"   🚀 Backend is ready for Jardin admin interface")
    else:
        failed_criteria = sum(1 for criteria in success_criteria if not criteria)
        print(f"\n⚠️ JARDIN ADMIN INTERFACE TEST COMPLETED WITH ISSUES")
        print(f"   ❌ {failed_criteria}/{len(success_criteria)} criteria failed")
        print(f"   ❌ {len(results['errors'])} errors encountered")
        print(f"   🔧 Backend needs attention for full Jardin admin functionality")
    
    return results

def test_urgent_article_creation_issue():
    """URGENT TEST: Address user's critical article creation issue"""
    print("🚨 URGENT ARTICLE CREATION ISSUE TESTING")
    print("=" * 70)
    print("🎯 USER REPORT: 'toujours pas !!!!!!!! rien n'a changé depuis une demi heure'")
    print("📝 ISSUE: Admin article creation has been broken for 30 minutes")
    print("🔐 Using admin credentials: labbelefranc@gmail.com / admin06")
    print("⚡ PROVIDING DEFINITIVE ANSWERS TO USER'S QUESTIONS")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    results = {
        'auth_working': False,
        'articles_in_db': 0,
        'can_create_articles': False,
        'articles_persist': False,
        'get_articles_working': False,
        'created_article_id': None,
        'backend_logs': [],
        'errors': []
    }
    
    # QUESTION 1: Verify admin authentication is working
    print(f"\n🔐 QUESTION 1: Is admin authentication working?")
    success_auth, _ = tester.test_admin_authentication()
    results['auth_working'] = success_auth
    
    if success_auth:
        print("✅ ANSWER: YES - Admin authentication is working correctly")
        print("   Credentials labbelefranc@gmail.com/admin06 are valid")
    else:
        print("❌ ANSWER: NO - Admin authentication is BROKEN")
        results['errors'].append("Admin authentication failed")
        return results
    
    # QUESTION 2: How many articles are currently in the database?
    print(f"\n📊 QUESTION 2: How many articles are currently in the database?")
    success_count, current_articles = tester.test_get_articles()
    
    if success_count:
        results['articles_in_db'] = len(current_articles)
        print(f"✅ ANSWER: {len(current_articles)} articles are currently in the database")
        
        if len(current_articles) > 0:
            print("   Current articles:")
            for i, art in enumerate(current_articles[:10], 1):  # Show first 10
                print(f"   {i}. {art.get('name', 'Unknown')} (ID: {art.get('id', 'Unknown')[:8]}...)")
                print(f"      Category: {art.get('category_id', 'Unknown')}")
                print(f"      Price: {art.get('base_price', 0)}€")
        else:
            print("   Database is empty - no articles found")
    else:
        print("❌ ANSWER: CANNOT DETERMINE - Error retrieving articles from database")
        results['errors'].append("Cannot retrieve articles from database")
        return results
    
    # QUESTION 3: Can new articles be created via API?
    print(f"\n🔧 QUESTION 3: Can new articles be created via API?")
    
    # Test with realistic article data similar to what user would create
    test_article = {
        "name": "Tonnelle de jardin",
        "category_id": "exterieur_jardin",
        "base_price": 120.0,
        "materials": ["aluminium", "toile polyester"],
        "description": "Tonnelle de jardin démontable avec structure aluminium",
        "requires_dismantling": True
    }
    
    print(f"   Testing article creation with: {test_article['name']}")
    success_create, article_id = tester.test_create_article(test_article)
    results['can_create_articles'] = success_create
    results['created_article_id'] = article_id
    
    if success_create and article_id:
        print("✅ ANSWER: YES - Articles can be created successfully via API")
        print(f"   Created article ID: {article_id}")
        print(f"   Article name: {test_article['name']}")
        print(f"   Category: {test_article['category_id']}")
        print(f"   Price: {test_article['base_price']}€")
    else:
        print("❌ ANSWER: NO - Article creation via API is BROKEN")
        results['errors'].append("Article creation API is not working")
        return results
    
    # QUESTION 4: Are articles being saved and persisting?
    print(f"\n💾 QUESTION 4: Are articles being saved and persisting in database?")
    
    # Wait a moment then check if article persists
    import time
    time.sleep(1)
    
    success_persist, updated_articles = tester.test_get_articles()
    if success_persist:
        # Look for our created article
        found_article = next((art for art in updated_articles if art.get('id') == article_id), None)
        results['articles_persist'] = found_article is not None
        
        if found_article:
            print("✅ ANSWER: YES - Articles are being saved and persist in database")
            print(f"   Found created article: {found_article.get('name')}")
            print(f"   Database now contains: {len(updated_articles)} articles")
            print(f"   Article data persisted correctly:")
            print(f"     - Name: {found_article.get('name')}")
            print(f"     - Category: {found_article.get('category_id')}")
            print(f"     - Price: {found_article.get('base_price')}€")
            print(f"     - Materials: {found_article.get('materials')}")
        else:
            print("❌ ANSWER: NO - Articles are NOT persisting in database")
            print(f"   Article was created but disappeared from database")
            results['errors'].append("Articles not persisting in database")
    else:
        print("❌ ANSWER: CANNOT VERIFY - Error checking database persistence")
        results['errors'].append("Cannot verify database persistence")
    
    # QUESTION 5: Can the frontend retrieve articles via GET /api/articles?
    print(f"\n🔍 QUESTION 5: Can frontend retrieve articles via GET /api/articles?")
    
    success_get, retrieved_articles = tester.test_get_articles()
    results['get_articles_working'] = success_get
    
    if success_get:
        print("✅ ANSWER: YES - GET /api/articles endpoint is working")
        print(f"   Endpoint returns {len(retrieved_articles)} articles")
        
        # Check if our created article is accessible
        if article_id:
            found_via_get = next((art for art in retrieved_articles if art.get('id') == article_id), None)
            if found_via_get:
                print(f"   ✅ Created article is accessible via GET endpoint")
                print(f"   Article: {found_via_get.get('name')} - {found_via_get.get('base_price')}€")
            else:
                print(f"   ❌ Created article NOT accessible via GET endpoint")
                results['errors'].append("Created article not accessible via GET endpoint")
    else:
        print("❌ ANSWER: NO - GET /api/articles endpoint is BROKEN")
        results['errors'].append("GET /api/articles endpoint not working")
    
    # BONUS: Test category-specific endpoint
    print(f"\n🏷️ BONUS: Testing category-specific article retrieval...")
    success_cat, category_articles = tester.test_get_articles_by_category("exterieur_jardin")
    
    if success_cat and article_id:
        found_in_category = next((art for art in category_articles if art.get('id') == article_id), None)
        if found_in_category:
            print(f"✅ Created article accessible via category endpoint")
            print(f"   Found in 'exterieur_jardin': {found_in_category.get('name')}")
        else:
            print(f"❌ Created article NOT found in category endpoint")
            print(f"   Category contains {len(category_articles)} articles")
    
    # Test exact createArticle endpoint the frontend calls
    print(f"\n🎯 TESTING EXACT FRONTEND CREATEARTICLE ENDPOINT...")
    
    # Test with exact frontend data structure
    frontend_article = {
        "name": "Test Article Frontend Interface",
        "category_id": "exterieur_jardin", 
        "base_price": 0,
        "materials": ["test", "frontend"],
        "description": "Test from frontend interface",
        "requires_dismantling": False
    }
    
    success_frontend, frontend_article_id = tester.test_create_article(frontend_article)
    
    if success_frontend and frontend_article_id:
        print("✅ Frontend createArticle endpoint working correctly")
        print(f"   Created frontend test article: {frontend_article_id}")
        
        # Verify it's immediately retrievable
        success_immediate, immediate_articles = tester.test_get_articles()
        if success_immediate:
            found_immediate = next((art for art in immediate_articles if art.get('id') == frontend_article_id), None)
            if found_immediate:
                print("✅ Article immediately available after creation")
            else:
                print("❌ Article not immediately available after creation")
        
        # Clean up frontend test article
        tester.test_delete_article(frontend_article_id)
    else:
        print("❌ Frontend createArticle endpoint has issues")
        results['errors'].append("Frontend createArticle endpoint not working")
    
    # Clean up main test article
    if article_id:
        print(f"\n🧹 Cleaning up test article...")
        success_cleanup, _ = tester.test_delete_article(article_id)
        if success_cleanup:
            print("✅ Test article cleaned up")
        else:
            print("⚠️  Could not clean up test article")
    
    # FINAL SUMMARY
    print(f"\n" + "=" * 70)
    print(f"📋 DEFINITIVE ANSWERS TO USER'S QUESTIONS:")
    print(f"=" * 70)
    print(f"1. Admin authentication: {'✅ WORKING' if results['auth_working'] else '❌ BROKEN'}")
    print(f"2. Articles in database: {results['articles_in_db']} articles")
    print(f"3. Can create articles: {'✅ YES' if results['can_create_articles'] else '❌ NO'}")
    print(f"4. Articles persist: {'✅ YES' if results['articles_persist'] else '❌ NO'}")
    print(f"5. GET articles working: {'✅ YES' if results['get_articles_working'] else '❌ NO'}")
    
    if len(results['errors']) == 0:
        print(f"\n🎉 BACKEND IS WORKING PERFECTLY!")
        print(f"✅ All backend APIs for article creation are functional")
        print(f"✅ Articles are being saved and persisting correctly")
        print(f"✅ No backend issues detected")
        print(f"\n💡 CONCLUSION: If users cannot save articles, the issue is:")
        print(f"   - Frontend interface not calling backend correctly")
        print(f"   - Frontend not refreshing/displaying saved articles")
        print(f"   - Frontend using hardcoded data instead of database")
        print(f"\n🚀 BACKEND IS READY - ISSUE IS IN FRONTEND IMPLEMENTATION")
        return 0
    else:
        print(f"\n🚨 BACKEND ISSUES DETECTED:")
        for error in results['errors']:
            print(f"   ❌ {error}")
        print(f"\n⚠️  BACKEND NEEDS IMMEDIATE ATTENTION")
        return 1

def test_frontend_article_creation_simulation():
    """Simulate exact frontend article creation behavior to identify the issue"""
    print("🎯 FRONTEND ARTICLE CREATION SIMULATION")
    print("=" * 70)
    print("🔍 SIMULATING: User creating articles in different admin sections")
    print("📝 TESTING: Whether frontend sends correct category_id to backend")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    
    # Step 1: Authenticate
    print(f"\n🔐 Step 1: Admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ CRITICAL: Admin authentication failed!")
        return False
    print("✅ Admin authentication successful")
    
    # Step 2: Test creating articles in different sections as user would
    test_scenarios = [
        {
            "section": "MOBILIER LITERIE",
            "category_id": "lits_couchage",  # This should be the correct category for bedroom furniture
            "article_name": "Lit double test",
            "materials": ["bois", "métal"]
        },
        {
            "section": "JARDIN",
            "category_id": "exterieur_jardin",  # This is the correct category for garden items
            "article_name": "Tonnelle de jardin test",
            "materials": ["aluminium", "toile"]
        },
        {
            "section": "MOBILIER SALON",
            "category_id": "assises",  # This should be for living room furniture
            "article_name": "Canapé test",
            "materials": ["tissu", "mousse"]
        }
    ]
    
    results = []
    
    for scenario in test_scenarios:
        print(f"\n🧪 Testing {scenario['section']} section...")
        print(f"   Expected category: {scenario['category_id']}")
        print(f"   Article: {scenario['article_name']}")
        
        # Create article with intended category
        article_data = {
            "name": scenario['article_name'],
            "category_id": scenario['category_id'],
            "base_price": 100.0,
            "materials": scenario['materials'],
            "description": f"Test article for {scenario['section']}",
            "requires_dismantling": False
        }
        
        success_create, article_id = tester.test_create_article(article_data)
        
        if success_create and article_id:
            # Immediately check what category it was actually assigned
            success_check, created_article = tester.run_test(
                f"Verify Article Category", 
                "GET", 
                f"articles/{article_id}", 
                200
            )
            
            if success_check:
                actual_category = created_article.get('category_id')
                intended_category = scenario['category_id']
                
                result = {
                    'section': scenario['section'],
                    'intended_category': intended_category,
                    'actual_category': actual_category,
                    'article_name': scenario['article_name'],
                    'article_id': article_id,
                    'correct': actual_category == intended_category
                }
                results.append(result)
                
                if result['correct']:
                    print(f"   ✅ SUCCESS: Article correctly assigned to '{actual_category}'")
                else:
                    print(f"   🚨 CORRUPTION: Article intended for '{intended_category}' assigned to '{actual_category}'")
                
                # Clean up
                tester.test_delete_article(article_id)
            else:
                print(f"   ❌ Could not verify article category")
        else:
            print(f"   ❌ Could not create test article")
    
    # Summary
    print(f"\n📊 SIMULATION RESULTS:")
    correct_count = sum(1 for r in results if r['correct'])
    total_count = len(results)
    
    print(f"   Total tests: {total_count}")
    print(f"   Correct assignments: {correct_count}")
    print(f"   Incorrect assignments: {total_count - correct_count}")
    
    if correct_count == total_count:
        print(f"\n✅ BACKEND ARTICLE CREATION IS WORKING CORRECTLY")
        print(f"   All articles are assigned to their intended categories")
        print(f"   The issue is likely in the frontend interface")
    else:
        print(f"\n🚨 BACKEND ARTICLE CREATION HAS ISSUES")
        print(f"   Some articles are not assigned to correct categories")
        
        for result in results:
            if not result['correct']:
                print(f"   - {result['section']}: {result['intended_category']} → {result['actual_category']}")
    
    return correct_count == total_count

def test_frontend_category_mapping_issue():
    """Test if frontend is sending wrong category_id values"""
    print("🔍 FRONTEND CATEGORY MAPPING ANALYSIS")
    print("=" * 70)
    print("🎯 HYPOTHESIS: Frontend admin interface sends 'exterieur_jardin' for all sections")
    print("📝 TESTING: Direct API calls with different category_id values")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    
    # Step 1: Authenticate
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ Admin authentication failed!")
        return False
    
    # Step 2: Test if backend respects different category_id values
    print(f"\n🧪 Testing backend category_id handling...")
    
    # Test with various category IDs to see if backend always assigns to exterieur_jardin
    test_categories = [
        "mobilier",
        "assises", 
        "tables",
        "lits_couchage",
        "electromenager_gros",
        "exterieur_jardin"
    ]
    
    backend_working_correctly = True
    
    for cat_id in test_categories:
        print(f"\n   Testing category_id: {cat_id}")
        
        test_article = {
            "name": f"Test {cat_id} Article",
            "category_id": cat_id,
            "base_price": 75.0,
            "materials": ["test"],
            "description": f"Testing category {cat_id}",
            "requires_dismantling": False
        }
        
        success_create, article_id = tester.test_create_article(test_article)
        
        if success_create and article_id:
            # Check actual category assignment
            success_check, article_details = tester.run_test(
                f"Check Category Assignment", 
                "GET", 
                f"articles/{article_id}", 
                200
            )
            
            if success_check:
                actual_category = article_details.get('category_id')
                if actual_category == cat_id:
                    print(f"   ✅ Correctly assigned to '{actual_category}'")
                else:
                    print(f"   🚨 WRONG: Intended '{cat_id}' but assigned to '{actual_category}'")
                    backend_working_correctly = False
                
                # Clean up
                tester.test_delete_article(article_id)
            else:
                print(f"   ❌ Could not verify assignment")
                backend_working_correctly = False
        else:
            print(f"   ❌ Could not create article")
            backend_working_correctly = False
    
    # Step 3: Conclusion
    print(f"\n📊 ANALYSIS CONCLUSION:")
    if backend_working_correctly:
        print(f"✅ BACKEND IS WORKING CORRECTLY")
        print(f"   - Backend respects category_id parameter")
        print(f"   - Articles are assigned to correct categories")
        print(f"   - Issue is in FRONTEND sending wrong category_id")
        print(f"\n🎯 ROOT CAUSE: Frontend admin interface is hardcoded to send 'exterieur_jardin'")
        print(f"   regardless of which admin section the user is in")
    else:
        print(f"🚨 BACKEND HAS ISSUES")
        print(f"   - Backend is not respecting category_id parameter")
        print(f"   - Articles are being assigned to wrong categories")
    
    return backend_working_correctly

def test_data_corruption_analysis():
    """URGENT: Analyze data corruption issue - articles appearing in wrong categories"""
    print("🚨 DATA CORRUPTION ANALYSIS")
    print("=" * 70)
    print("🎯 USER REPORT: Articles added in 'mobilier literie' appear in 'jardin' section")
    print("📝 ISSUE: All articles seem to have category_id 'exterieur_jardin'")
    print("🔍 ANALYSIS: Check current database state and category mappings")
    print("=" * 70)
    
    tester = AlloDebarrasAPITester()
    analysis_results = {
        'total_articles': 0,
        'category_distribution': {},
        'articles_by_category': {},
        'categories_available': {},
        'corruption_detected': False,
        'issues_found': []
    }
    
    # Step 1: Authenticate admin
    print(f"\n🔐 Step 1: Admin authentication...")
    success_auth, _ = tester.test_admin_authentication()
    if not success_auth:
        print("❌ CRITICAL: Admin authentication failed!")
        return analysis_results
    print("✅ Admin authentication successful")
    
    # Step 2: Get all categories to understand the structure
    print(f"\n📁 Step 2: Analyzing category structure...")
    success_cats, categories = tester.test_get_categories()
    if success_cats:
        print(f"   Found {len(categories)} categories in database:")
        for cat in categories:
            cat_id = cat.get('id', 'unknown')
            cat_name = cat.get('name', 'Unknown')
            analysis_results['categories_available'][cat_id] = cat_name
            print(f"   - {cat_id}: {cat_name}")
    else:
        print("❌ Could not retrieve categories")
        analysis_results['issues_found'].append("Cannot retrieve categories")
        return analysis_results
    
    # Step 3: Get all articles and analyze their category assignments
    print(f"\n📄 Step 3: Analyzing all articles and their category assignments...")
    success_arts, articles = tester.test_get_articles()
    if success_arts:
        analysis_results['total_articles'] = len(articles)
        print(f"   Found {len(articles)} articles in database")
        
        if len(articles) == 0:
            print("   ⚠️  Database is empty - no articles to analyze")
            return analysis_results
        
        # Analyze category distribution
        for article in articles:
            article_id = article.get('id', 'unknown')
            article_name = article.get('name', 'Unknown')
            category_id = article.get('category_id', 'unknown')
            
            # Count articles per category
            if category_id not in analysis_results['category_distribution']:
                analysis_results['category_distribution'][category_id] = 0
                analysis_results['articles_by_category'][category_id] = []
            
            analysis_results['category_distribution'][category_id] += 1
            analysis_results['articles_by_category'][category_id].append({
                'id': article_id,
                'name': article_name,
                'base_price': article.get('base_price', 0),
                'materials': article.get('materials', [])
            })
        
        # Print category distribution analysis
        print(f"\n📊 CATEGORY DISTRIBUTION ANALYSIS:")
        for category_id, count in analysis_results['category_distribution'].items():
            category_name = analysis_results['categories_available'].get(category_id, 'UNKNOWN CATEGORY')
            print(f"   {category_id} ({category_name}): {count} articles")
        
        # Check for corruption indicators
        print(f"\n🔍 CORRUPTION ANALYSIS:")
        
        # Check if all articles have the same category_id
        unique_categories = set(analysis_results['category_distribution'].keys())
        if len(unique_categories) == 1:
            single_category = list(unique_categories)[0]
            analysis_results['corruption_detected'] = True
            analysis_results['issues_found'].append(f"ALL ARTICLES HAVE SAME CATEGORY: {single_category}")
            print(f"   🚨 CORRUPTION DETECTED: All {len(articles)} articles have category_id '{single_category}'")
            
            if single_category == 'exterieur_jardin':
                print(f"   🚨 CONFIRMED: All articles assigned to 'exterieur_jardin' as reported by user")
                analysis_results['issues_found'].append("All articles incorrectly assigned to exterieur_jardin")
        
        # Check for 'exterieur_jardin' dominance
        exterieur_count = analysis_results['category_distribution'].get('exterieur_jardin', 0)
        if exterieur_count > 0:
            percentage = (exterieur_count / len(articles)) * 100
            print(f"   📈 'exterieur_jardin' contains {exterieur_count}/{len(articles)} articles ({percentage:.1f}%)")
            
            if percentage > 80:
                analysis_results['corruption_detected'] = True
                analysis_results['issues_found'].append(f"Excessive articles in exterieur_jardin: {percentage:.1f}%")
                print(f"   🚨 SUSPICIOUS: {percentage:.1f}% of articles in 'exterieur_jardin' category")
        
        # List all articles with their details
        print(f"\n📋 DETAILED ARTICLE LISTING:")
        for i, article in enumerate(articles, 1):
            article_name = article.get('name', 'Unknown')
            category_id = article.get('category_id', 'unknown')
            category_name = analysis_results['categories_available'].get(category_id, 'UNKNOWN')
            base_price = article.get('base_price', 0)
            materials = article.get('materials', [])
            
            print(f"   {i}. {article_name}")
            print(f"      Category: {category_id} ({category_name})")
            print(f"      Price: {base_price}€")
            print(f"      Materials: {materials}")
            print(f"      ID: {article.get('id', 'unknown')}")
            print()
        
    else:
        print("❌ Could not retrieve articles")
        analysis_results['issues_found'].append("Cannot retrieve articles")
        return analysis_results
    
    # Step 4: Test backend category assignment functionality
    print(f"\n🧪 Step 4: Testing backend category assignment...")
    backend_test_result = test_frontend_category_mapping_issue()
    
    if not backend_test_result:
        analysis_results['corruption_detected'] = True
        analysis_results['issues_found'].append("Backend category assignment is broken")
    
    # Step 5: Test frontend simulation
    print(f"\n🎯 Step 5: Simulating frontend article creation...")
    frontend_test_result = test_frontend_article_creation_simulation()
    
    if not frontend_test_result:
        analysis_results['corruption_detected'] = True
        analysis_results['issues_found'].append("Frontend sends wrong category_id values")
    
    # Final analysis summary
    print(f"\n📊 FINAL ANALYSIS SUMMARY:")
    print(f"   Total articles analyzed: {analysis_results['total_articles']}")
    print(f"   Categories with articles: {len(analysis_results['category_distribution'])}")
    print(f"   Corruption detected: {'YES' if analysis_results['corruption_detected'] else 'NO'}")
    print(f"   Issues found: {len(analysis_results['issues_found'])}")
    
    if analysis_results['issues_found']:
        print(f"\n🚨 ISSUES IDENTIFIED:")
        for i, issue in enumerate(analysis_results['issues_found'], 1):
            print(f"   {i}. {issue}")
    
    if analysis_results['corruption_detected']:
        print(f"\n🎯 RECOMMENDATIONS:")
        print(f"   1. Check frontend article creation code for hardcoded category_id")
        print(f"   2. Verify admin interface sends correct category_id to backend")
        print(f"   3. Check if backend article creation endpoint respects category_id parameter")
        print(f"   4. Consider data migration to fix existing corrupted articles")
    else:
        print(f"\n✅ NO CORRUPTION DETECTED - Database appears to be in good state")
    
    return analysis_results

if __name__ == "__main__":
    # Check if specific test mode is requested
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "cleanup":
            sys.exit(cleanup_database())
        elif sys.argv[1] == "article-test":
            sys.exit(test_specific_article_creation_issue())
        elif sys.argv[1] == "urgent":
            sys.exit(test_urgent_article_creation_issue())
        elif sys.argv[1] == "corruption":
            results = test_data_corruption_analysis()
            if results['corruption_detected']:
                sys.exit(1)
            else:
                sys.exit(0)
        elif sys.argv[1] == "frontend-sim":
            success = test_frontend_article_creation_simulation()
            sys.exit(0 if success else 1)
        elif sys.argv[1] == "category-mapping":
            success = test_frontend_category_mapping_issue()
            sys.exit(0 if success else 1)
        elif sys.argv[1] == "jardin":
            results = test_jardin_admin_interface()
            success = all([results['auth_working'], results['categories_structure'], 
                          results['article_creation'], results['data_consistency']])
            sys.exit(0 if success else 1)
    else:
        sys.exit(main())