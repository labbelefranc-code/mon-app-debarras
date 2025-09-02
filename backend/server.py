from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
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
import secrets
import glob
import shutil

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

# Security for admin
security = HTTPBasic()

# Helper functions for MongoDB serialization
def prepare_for_mongo(data):
    if isinstance(data.get('date'), date):
        data['date'] = data['date'].isoformat()
    if isinstance(data.get('time'), time):
        data['time'] = data['time'].strftime('%H:%M:%S')
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('preferred_date'), str):
        # Keep as string for now
        pass
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
    icon: Optional[str] = None

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    image_url: Optional[str] = None
    base_price: float
    materials: List[str] = []
    description: Optional[str] = None
    requires_dismantling: bool = False  # Si l'article peut être fixé au mur

class QuoteItem(BaseModel):
    article_id: str
    article_name: str
    material: Optional[str] = None
    quantity: int = 1
    unit_price: float
    is_dismantled: Optional[bool] = None  # Pour les articles fixés
    is_custom: bool = False  # Pour les articles libres

class CustomItem(BaseModel):
    description: str
    estimated_price: float = 0.0  # Prix estimé, sera confirmé par admin

class Quote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_type: str  # "instant" ou "photo"
    items: List[QuoteItem] = []
    custom_items: List[CustomItem] = []  # Articles libres
    
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
    
    # Zones géographiques et créneaux
    zone: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None  # ex: "08:00-09:00"
    
    # Prix et statut
    base_total: float = 0.0
    supplements: float = 0.0  # Suppléments pour articles personnalisés
    final_total: float = 0.0
    urgent: bool = False
    urgent_validated: bool = False
    
    # Status
    status: str = "pending"  # pending, confirmed, completed, cancelled, awaiting_supplement
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    
    # Pour devis photo
    photo_urls: List[str] = []

class QuoteCreate(BaseModel):
    quote_type: str
    items: List[QuoteItem] = []
    custom_items: List[CustomItem] = []
    client_name: str
    client_email: str
    client_phone: str
    address: str
    parking: str
    floor: int = 0
    elevator: bool = False
    additional_info: Optional[str] = None
    zone: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None
    urgent: bool = False
    photo_urls: List[str] = []

class TimeSlot(BaseModel):
    date: str  # Format YYYY-MM-DD
    time_slot: str  # Format "HH:MM-HH:MM"
    zone: str
    available: bool = True
    quote_id: Optional[str] = None

class AdminUser(BaseModel):
    username: str
    password: str

# Admin authentication
def authenticate_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "labbelefranc@gmail.com")
    correct_password = secrets.compare_digest(credentials.password, "admin06")
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

# Routes principales
@api_router.get("/")
async def root():
    return {"message": "Allo Débarras Express API v2.0"}

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

# Gestion des zones géographiques
@api_router.get("/zones")
async def get_zones():
    # Zones autour des Issambres (83380) dans le Var
    zones = {
        "zone_1": {
            "name": "Zone Ouest",
            "communes": ["Les Issambres", "Roquebrune-sur-Argens", "Fréjus", "Saint-Raphaël", "Agay", "Anthéor"],
            "description": "Côte ouest - Saint-Raphaël, Fréjus"
        },
        "zone_2": {
            "name": "Zone Centre", 
            "communes": ["Sainte-Maxime", "Plan-de-la-Tour", "Les Arcs", "Draguignan", "Trans-en-Provence", "Le Muy"],
            "description": "Centre Var - Sainte-Maxime, Draguignan"
        },
        "zone_3": {
            "name": "Zone Est",
            "communes": ["Saint-Tropez", "Gassin", "Ramatuelle", "Cavalaire", "Le Lavandou", "Bormes-les-Mimosas"],
            "description": "Côte est - Saint-Tropez, Golfe de Saint-Tropez"
        }
    }
    return zones

# Gestion des créneaux
@api_router.get("/available-slots")
async def get_available_slots(date: str, zone: str):
    """Récupère les créneaux disponibles pour une date et zone données"""
    # Créneaux de 7h à 20h par blocs d'1h, Mardi/Mercredi/Jeudi
    time_slots = []
    for hour in range(7, 20):  # 7h à 19h (dernier créneau 19h-20h)
        slot_time = f"{hour:02d}:00-{hour+1:02d}:00"
        
        # Vérifier si le créneau est déjà réservé
        existing_slot = await db.time_slots.find_one({
            "date": date,
            "time_slot": slot_time,
            "zone": zone,
            "available": False
        })
        
        time_slots.append({
            "time_slot": slot_time,
            "available": existing_slot is None,
            "reserved_by": existing_slot.get("quote_id") if existing_slot else None
        })
    
    return time_slots

@api_router.post("/reserve-slot")
async def reserve_time_slot(date: str, time_slot: str, zone: str, quote_id: str):
    """Réserve un créneau horaire"""
    # Vérifier que le créneau est disponible
    existing = await db.time_slots.find_one({
        "date": date,
        "time_slot": time_slot,
        "zone": zone,
        "available": False
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Créneau déjà réservé")
    
    # Réserver le créneau
    slot_data = {
        "date": date,
        "time_slot": time_slot,
        "zone": zone,
        "available": False,
        "quote_id": quote_id,
        "reserved_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.time_slots.insert_one(slot_data)
    return {"message": "Créneau réservé avec succès"}

# Gestion des devis
@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteCreate):
    # Calculer le prix de base
    base_total = sum(item.unit_price * item.quantity for item in quote_data.items)
    
    # Ajouter les articles personnalisés (prix à confirmer)
    custom_total = sum(item.estimated_price for item in quote_data.custom_items)
    
    quote_dict = quote_data.dict()
    quote_dict['base_total'] = base_total
    quote_dict['supplements'] = custom_total
    quote_dict['final_total'] = base_total + custom_total
    
    # Si il y a des articles personnalisés, le statut est "awaiting_supplement"
    if quote_data.custom_items:
        quote_dict['status'] = "awaiting_supplement"
    else:
        quote_dict['status'] = "pending"
    
    quote_obj = Quote(**quote_dict)
    
    # Préparer pour MongoDB
    quote_for_db = prepare_for_mongo(quote_obj.dict())
    await db.quotes.insert_one(quote_for_db)
    
    # TODO: Envoyer notification Twilio à l'admin
    # await send_sms_notification(quote_obj)
    
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

@api_router.put("/quotes/{quote_id}/confirm-supplement")
async def confirm_supplement(quote_id: str, final_supplement: float):
    """Confirme le supplément pour les articles personnalisés"""
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    new_final_total = quote['base_total'] + final_supplement
    
    result = await db.quotes.update_one(
        {"id": quote_id},
        {
            "$set": {
                "supplements": final_supplement,
                "final_total": new_final_total,
                "status": "confirmed",
                "confirmed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Supplément confirmé", "final_total": new_final_total}

# Routes d'administration
@api_router.get("/admin/quotes", response_model=List[Quote])
async def get_admin_quotes(username: str = Depends(authenticate_admin)):
    """Route admin pour voir tous les devis"""
    quotes = await db.quotes.find().sort("created_at", -1).to_list(1000)
    return [Quote(**parse_from_mongo(quote)) for quote in quotes]

@api_router.get("/admin/stats")
async def get_admin_stats(username: str = Depends(authenticate_admin)):
    """Statistiques pour l'admin"""
    total_quotes = await db.quotes.count_documents({})
    pending_quotes = await db.quotes.count_documents({"status": "pending"})
    awaiting_supplements = await db.quotes.count_documents({"status": "awaiting_supplement"})
    confirmed_quotes = await db.quotes.count_documents({"status": "confirmed"})
    
    return {
        "total_quotes": total_quotes,
        "pending_quotes": pending_quotes,
        "awaiting_supplements": awaiting_supplements,
        "confirmed_quotes": confirmed_quotes
    }

# Initialisation des données de base avec nouvelle arborescence
@api_router.post("/init-data")
async def init_base_data():
    # Vérifier si les données existent déjà
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Données déjà initialisées"}
    
    # 3 GRANDES CATÉGORIES
    main_categories = [
        {"id": "maison_interieur", "name": "🏠 Maison / Intérieur", "parent_id": None, "icon": "🏠"},
        {"id": "exterieur_jardin", "name": "🌳 Extérieur / Jardin / Garage / Cave", "parent_id": None, "icon": "🌳"},
        {"id": "autres_special", "name": "🎹 Catégorie \"Autres / Spécial\"", "parent_id": None, "icon": "🎹"}
    ]
    
    # SOUS-CATÉGORIES MAISON/INTÉRIEUR
    maison_subcategories = [
        {"id": "mobilier", "name": "Mobilier", "parent_id": "maison_interieur"},
        {"id": "decoration", "name": "Décoration", "parent_id": "maison_interieur"},
        {"id": "cuisine_salle_manger", "name": "Cuisine & Salle à manger", "parent_id": "maison_interieur"},
        {"id": "salle_bain", "name": "Salle de bain", "parent_id": "maison_interieur"},
        {"id": "electromenager_gros", "name": "Électroménager (gros)", "parent_id": "maison_interieur"}
    ]
    
    # SOUS-SOUS-CATÉGORIES MOBILIER
    mobilier_subcategories = [
        {"id": "assises", "name": "Assises", "parent_id": "mobilier", "description": "chaises, fauteuils, tabourets, bancs, canapés"},
        {"id": "tables", "name": "Tables", "parent_id": "mobilier", "description": "tables basses, de salle à manger, de chevet, bureaux"},
        {"id": "rangements", "name": "Rangements", "parent_id": "mobilier", "description": "armoires, commodes, buffets, vitrines, étagères"},
        {"id": "lits_couchage", "name": "Lits & couchage", "parent_id": "mobilier", "description": "lits, sommiers, matelas, têtes de lit"},
        {"id": "meubles_tv_multimedia", "name": "Meubles TV & multimédia", "parent_id": "mobilier"},
        {"id": "meubles_divers", "name": "Meubles divers", "parent_id": "mobilier", "description": "coiffeuses, consoles, guéridons…"}
    ]
    
    # SOUS-CATÉGORIES EXTÉRIEUR/JARDIN
    exterieur_subcategories = [
        {"id": "mobilier_detente", "name": "Mobilier & détente", "parent_id": "exterieur_jardin"},
        {"id": "outils_materiel", "name": "Outils & matériel", "parent_id": "exterieur_jardin"},
        {"id": "vehicules_remorques", "name": "Véhicules & remorques", "parent_id": "exterieur_jardin"},
        {"id": "divers_exterieur", "name": "Divers extérieur", "parent_id": "exterieur_jardin"}
    ]
    
    all_categories = main_categories + maison_subcategories + mobilier_subcategories + exterieur_subcategories
    
    # ARTICLES DE BASE
    base_articles = [
        # ASSISES
        {"id": "chaise_bureau", "name": "Chaise de bureau", "category_id": "assises", "base_price": 25.0, "materials": ["Tissu", "Cuir", "Plastique"], "requires_dismantling": False},
        {"id": "fauteuil_salon", "name": "Fauteuil de salon", "category_id": "assises", "base_price": 65.0, "materials": ["Tissu", "Cuir", "Velours"], "requires_dismantling": False},
        {"id": "canape_2_places", "name": "Canapé 2 places", "category_id": "assises", "base_price": 150.0, "materials": ["Tissu", "Cuir", "Simili"], "requires_dismantling": False},
        {"id": "tabouret_bar", "name": "Tabouret de bar", "category_id": "assises", "base_price": 35.0, "materials": ["Bois", "Métal", "Plastique"], "requires_dismantling": False},
        
        # TABLES
        {"id": "table_salle_manger", "name": "Table de salle à manger", "category_id": "tables", "base_price": 120.0, "materials": ["Bois", "Verre", "Métal"], "requires_dismantling": False},
        {"id": "bureau_moderne", "name": "Bureau moderne", "category_id": "tables", "base_price": 75.0, "materials": ["Mélaminé", "Bois", "Métal"], "requires_dismantling": False},
        {"id": "table_basse", "name": "Table basse", "category_id": "tables", "base_price": 55.0, "materials": ["Bois", "Verre", "Métal"], "requires_dismantling": False},
        
        # LITS & COUCHAGE
        {"id": "lit_double", "name": "Lit double standard", "category_id": "lits_couchage", "base_price": 120.0, "materials": ["Bois", "Métal", "Tissu"], "requires_dismantling": True},
        {"id": "lit_double_medicalise", "name": "Lit double médicalisé", "category_id": "lits_couchage", "base_price": 150.0, "materials": ["Métal", "Bois", "Mixte"], "requires_dismantling": True},
        {"id": "matelas_double", "name": "Matelas double", "category_id": "lits_couchage", "base_price": 45.0, "materials": ["Ressorts", "Mousse", "Latex"], "requires_dismantling": False},
        
        # ÉLECTROMÉNAGER
        {"id": "lave_linge", "name": "Lave-linge", "category_id": "electromenager_gros", "base_price": 60.0, "materials": ["Blanc", "Inox"], "requires_dismantling": True},
        {"id": "lave_vaisselle", "name": "Lave-vaisselle", "category_id": "electromenager_gros", "base_price": 55.0, "materials": ["Blanc", "Inox"], "requires_dismantling": True},
        {"id": "refrigerateur", "name": "Réfrigérateur", "category_id": "electromenager_gros", "base_price": 90.0, "materials": ["Blanc", "Inox", "Noir"], "requires_dismantling": True},
        {"id": "congelateur_coffre", "name": "Congélateur coffre", "category_id": "electromenager_gros", "base_price": 80.0, "materials": ["Blanc", "Inox"], "requires_dismantling": False},
        
        # MOBILIER EXTÉRIEUR
        {"id": "salon_jardin", "name": "Salon de jardin", "category_id": "mobilier_detente", "base_price": 180.0, "materials": ["Résine", "Bois", "Métal"], "requires_dismantling": False},
        {"id": "tondeuse", "name": "Tondeuse à gazon", "category_id": "outils_materiel", "base_price": 45.0, "materials": ["Essence", "Électrique", "Batterie"], "requires_dismantling": False}
    ]
    
    # Insérer en base
    await db.categories.insert_many(all_categories)
    await db.articles.insert_many(base_articles)
    
    return {"message": "Données de base initialisées avec nouvelle arborescence"}

@api_router.post("/reset-data")
async def reset_base_data():
    # Nettoyer toutes les collections
    await db.categories.delete_many({})
    await db.articles.delete_many({})
    await db.quotes.delete_many({})
    await db.time_slots.delete_many({})
    
    # Réinitialiser avec les nouvelles données
    result = await init_base_data()
    return {"message": "Données réinitialisées avec succès", "init_result": result}

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