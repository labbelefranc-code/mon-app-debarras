from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date, time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions for MongoDB serialization
def prepare_for_mongo(data):
    if isinstance(data.get('date'), date):
        data['date'] = data['date'].isoformat()
    if isinstance(data.get('time'), time):
        data['time'] = data['time'].strftime('%H:%M:%S')
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('date'), str):
        try:
            item['date'] = datetime.fromisoformat(item['date']).date()
        except:
            pass
    if isinstance(item.get('time'), str):
        try:
            item['time'] = datetime.strptime(item['time'], '%H:%M:%S').time()
        except:
            pass
    if isinstance(item.get('created_at'), str):
        try:
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        except:
            pass
    return item

# Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    image_url: Optional[str] = None
    base_price: float
    materials: List[str] = []
    description: Optional[str] = None

class QuoteItem(BaseModel):
    article_id: str
    article_name: str
    material: Optional[str] = None
    quantity: int = 1
    unit_price: float

class Quote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_type: str  # "instant" ou "photo"
    items: List[QuoteItem] = []
    
    # Informations client
    client_name: str
    client_email: str
    client_phone: str
    address: str
    
    # Informations accès
    parking: str  # "facile", "delicat", "difficile"
    floor: int = 0
    elevator: bool = False
    additional_info: Optional[str] = None
    
    # Dates et prix
    preferred_date: Optional[str] = None
    total_price: float = 0.0
    urgent: bool = False
    urgent_validated: bool = False
    
    # Status
    status: str = "pending"  # pending, confirmed, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Pour devis photo
    photo_urls: List[str] = []

class QuoteCreate(BaseModel):
    quote_type: str
    items: List[QuoteItem] = []
    client_name: str
    client_email: str
    client_phone: str
    address: str
    parking: str
    floor: int = 0
    elevator: bool = False
    additional_info: Optional[str] = None
    preferred_date: Optional[str] = None
    urgent: bool = False
    photo_urls: List[str] = []

# Routes principales
@api_router.get("/")
async def root():
    return {"message": "Allo Débarras Express API"}

# Gestion des catégories
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**cat) for cat in categories]

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return Category(**category)

@api_router.get("/categories/{category_id}/subcategories", response_model=List[Category])
async def get_subcategories(category_id: str):
    subcategories = await db.categories.find({"parent_id": category_id}).to_list(1000)
    return [Category(**cat) for cat in subcategories]

# Gestion des articles
@api_router.get("/articles", response_model=List[Article])
async def get_articles():
    articles = await db.articles.find().to_list(1000)
    return [Article(**art) for art in articles]

@api_router.get("/categories/{category_id}/articles", response_model=List[Article])
async def get_articles_by_category(category_id: str):
    articles = await db.articles.find({"category_id": category_id}).to_list(1000)
    return [Article(**art) for art in articles]

@api_router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return Article(**article)

# Gestion des devis
@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteCreate):
    # Calculer le prix total
    total_price = sum(item.unit_price * item.quantity for item in quote_data.items)
    
    quote_dict = quote_data.dict()
    quote_dict['total_price'] = total_price
    quote_obj = Quote(**quote_dict)
    
    # Préparer pour MongoDB
    quote_for_db = prepare_for_mongo(quote_obj.dict())
    await db.quotes.insert_one(quote_for_db)
    
    return quote_obj

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes():
    quotes = await db.quotes.find().sort("created_at", -1).to_list(1000)
    return [Quote(**parse_from_mongo(quote)) for quote in quotes]

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return Quote(**parse_from_mongo(quote))

@api_router.put("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str):
    result = await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return {"message": "Statut mis à jour"}

@api_router.put("/quotes/{quote_id}/validate-urgent")
async def validate_urgent_quote(quote_id: str):
    result = await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"urgent_validated": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return {"message": "Devis urgent validé"}

# Initialisation des données de base
@api_router.post("/init-data")
async def init_base_data():
    # Vérifier si les données existent déjà
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Données déjà initialisées"}
    
    # Catégories principales
    main_categories = [
        {"id": "mobilier", "name": "MOBILIER", "parent_id": None},
        {"id": "electromenager", "name": "ÉLECTROMÉNAGER", "parent_id": None},
        {"id": "autres", "name": "AUTRES", "parent_id": None}
    ]
    
    # Sous-catégories mobilier
    mobilier_subcategories = [
        {"id": "assises", "name": "ASSISES", "parent_id": "mobilier"},
        {"id": "tables_bureaux", "name": "TABLES & BUREAUX", "parent_id": "mobilier"},
        {"id": "meubles_tv", "name": "MEUBLES TV / TV", "parent_id": "mobilier"},
        {"id": "meubles_rangement", "name": "MEUBLES DE RANGEMENT", "parent_id": "mobilier"},
        {"id": "literie", "name": "LITERIE", "parent_id": "mobilier"},
        {"id": "salon_fauteuils", "name": "SALON - FAUTEUILS / CANAPÉS", "parent_id": "mobilier"}
    ]
    
    # Sous-catégories literie
    literie_items = [
        {"id": "tete_lit", "name": "Tête de lit", "parent_id": "literie"},
        {"id": "meuble_contour_lit", "name": "Meuble contour de lit", "parent_id": "literie"},
        {"id": "lit_medicalise", "name": "Lit médicalisé / électrique", "parent_id": "literie"},
        {"id": "lit_bebe", "name": "Lit bébé", "parent_id": "literie"},
        {"id": "lits_superposes", "name": "Lits superposés", "parent_id": "literie"},
        {"id": "lit_escamotable", "name": "Lit escamotable 2 places", "parent_id": "literie"},
        {"id": "lit_pliant", "name": "Lit pliant", "parent_id": "literie"},
        {"id": "mezzanine", "name": "Mezzanine bureau", "parent_id": "literie"},
        {"id": "lit_gigogne", "name": "Lit gigogne", "parent_id": "literie"}
    ]
    
    all_categories = main_categories + mobilier_subcategories + literie_items
    
    # Ajouter des articles de base avec les bons category_ids
    base_articles = [
        # Articles literie
        {
            "id": "lit_double_medicalise",
            "name": "Lit double médicalisé",
            "category_id": "lit_medicalise",
            "base_price": 150.0,
            "materials": ["Métal", "Bois", "Mixte"],
            "description": "Lit médicalisé double avec mécanisme électrique"
        },
        {
            "id": "tete_lit_classique",
            "name": "Tête de lit classique",
            "category_id": "tete_lit",
            "base_price": 45.0,
            "materials": ["Bois", "Tissu", "Métal"],
            "description": "Tête de lit standard"
        },
        {
            "id": "lit_bebe_standard",
            "name": "Lit bébé à barreaux",
            "category_id": "lit_bebe",
            "base_price": 35.0,
            "materials": ["Bois", "Plastique"],
            "description": "Lit bébé standard avec barreaux"
        },
        # Articles électroménager  
        {
            "id": "congelateur_coffre",
            "name": "Congélateur coffre",
            "category_id": "electromenager",
            "base_price": 80.0,
            "materials": ["Blanc", "Inox"],
            "description": "Congélateur coffre standard"
        },
        {
            "id": "lave_linge",
            "name": "Lave-linge",
            "category_id": "electromenager", 
            "base_price": 60.0,
            "materials": ["Blanc", "Inox"],
            "description": "Lave-linge standard"
        },
        # Articles tables & bureaux
        {
            "id": "secretaire_ancien",
            "name": "Secrétaire ancien",
            "category_id": "tables_bureaux",
            "base_price": 120.0,
            "materials": ["Bois massif", "Bois plaqué", "Peint"],
            "description": "Meuble secrétaire de style ancien"
        },
        {
            "id": "bureau_moderne",
            "name": "Bureau moderne",
            "category_id": "tables_bureaux",
            "base_price": 75.0,
            "materials": ["Mélaminé", "Bois", "Métal"],
            "description": "Bureau de travail moderne"
        },
        # Articles assises
        {
            "id": "chaise_bureau",
            "name": "Chaise de bureau",
            "category_id": "assises",
            "base_price": 25.0,
            "materials": ["Tissu", "Cuir", "Plastique"],
            "description": "Chaise de bureau ergonomique"
        },
        {
            "id": "fauteuil_salon",
            "name": "Fauteuil de salon",
            "category_id": "salon_fauteuils",
            "base_price": 65.0,
            "materials": ["Tissu", "Cuir", "Velours"],
            "description": "Fauteuil confortable pour salon"
        }
    ]
    
    # Insérer en base
    await db.categories.insert_many(all_categories)
    await db.articles.insert_many(base_articles)
    
    return {"message": "Données de base initialisées avec succès"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()