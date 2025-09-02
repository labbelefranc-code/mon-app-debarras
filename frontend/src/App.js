import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { 
  Truck, Phone, Calendar, MapPin, ShoppingCart, ArrowLeft, Check, Upload, 
  Plus, Minus, X, Home, Clock, User, Settings, AlertTriangle
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Checkbox } from "./components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentStep, setCurrentStep] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [zones, setZones] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminAuth, setAdminAuth] = useState({ username: '', password: '' });
  const [allPhotos, setAllPhotos] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [selectedAdminCategory, setSelectedAdminCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    parking: '',
    floor: 0,
    elevator: false,
    additional_info: '',
    zone: '',
    preferred_date: '',
    preferred_time_slot: '',
    urgent: false
  });

  // Initialiser les données de base
  useEffect(() => {
    initializeData();
    loadZones();
  }, []);

  const initializeData = async () => {
    try {
      await axios.post(`${API}/init-data`);
      loadCategories();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      loadCategories();
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.filter(cat => !cat.parent_id));
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(`${API}/categories/${categoryId}/subcategories`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  };

  const loadArticles = async (categoryId) => {
    try {
      const response = await axios.get(`${API}/categories/${categoryId}/articles`);
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    }
  };

  const loadZones = async () => {
    try {
      const response = await axios.get(`${API}/zones`);
      setZones(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
    }
  };

  const loadAvailableSlots = async (date, zone) => {
    try {
      const response = await axios.get(`${API}/available-slots?date=${date}&zone=${zone}`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
    }
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    
    try {
      const subcategoriesResponse = await axios.get(`${API}/categories/${category.id}/subcategories`);
      if (subcategoriesResponse.data && subcategoriesResponse.data.length > 0) {
        setSubcategories(subcategoriesResponse.data);
        setCurrentStep('subcategories');
      } else {
        setCurrentStep('articles');
        loadArticles(category.id);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des sous-catégories:', error);
      setCurrentStep('articles');
      loadArticles(category.id);
    }
  };

  const handleSubcategoryClick = async (subcategory) => {
    setSelectedSubcategory(subcategory);
    
    try {
      const subSubcategoriesResponse = await axios.get(`${API}/categories/${subcategory.id}/subcategories`);
      if (subSubcategoriesResponse.data && subSubcategoriesResponse.data.length > 0) {
        setSubcategories(subSubcategoriesResponse.data);
        // Rester sur la page subcategories mais avec les nouvelles sous-catégories
        setCurrentStep('subcategories');
      } else {
        setCurrentStep('articles');
        loadArticles(subcategory.id);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des sous-sous-catégories:', error);
      setCurrentStep('articles');
      loadArticles(subcategory.id);
    }
  };

  const addToSelection = (article, material = null) => {
    const newItem = {
      article_id: article.id,
      article_name: article.name,
      material: material,
      quantity: 1,
      unit_price: article.base_price,
      requires_dismantling: article.requires_dismantling,
      is_dismantled: article.requires_dismantling ? false : null,
      is_custom: false
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = Math.max(1, quantity);
    setSelectedItems(newItems);
  };

  const removeFromSelection = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const toggleDismantling = (index) => {
    const newItems = [...selectedItems];
    newItems[index].is_dismantled = !newItems[index].is_dismantled;
    setSelectedItems(newItems);
  };

  const addCustomItem = () => {
    const description = document.getElementById('custom-item-description').value.trim();
    if (description) {
      setCustomItems([...customItems, {
        description: description,
        estimated_price: 0.0
      }]);
      document.getElementById('custom-item-description').value = '';
    }
  };

  const removeCustomItem = (index) => {
    const newItems = [...customItems];
    newItems.splice(index, 1);
    setCustomItems(newItems);
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
    const customTotal = customItems.reduce((total, item) => total + item.estimated_price, 0);
    return itemsTotal + customTotal;
  };

  const submitQuote = async () => {
    try {
      const quoteData = {
        quote_type: 'instant',
        items: selectedItems,
        custom_items: customItems,
        ...quoteForm
      };
      
      const response = await axios.post(`${API}/quotes`, quoteData);
      
      if (customItems.length > 0) {
        alert('Devis envoyé ! Un supplément sera calculé pour vos articles personnalisés. Vous recevrez une confirmation par email une fois le supplément confirmé.');
      } else {
        alert('Devis envoyé avec succès ! Vous recevrez une confirmation par email.');
      }
      
      // Reset form
      setCurrentStep('home');
      setSelectedItems([]);
      setCustomItems([]);
      setQuoteForm({
        client_name: '',
        client_email: '',
        client_phone: '',
        address: '',
        parking: '',
        floor: 0,
        elevator: false,
        additional_info: '',
        zone: '',
        preferred_date: '',
        preferred_time_slot: '',
        urgent: false
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du devis:', error);
      alert('Erreur lors de l\'envoi du devis. Veuillez réessayer.');
    }
  };

  // Admin functions
  const authenticateAdmin = async () => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      const response = await axios.get(`${API}/admin/photos`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      setIsAdminMode(true);
      setCurrentStep('admin-photos');
      loadAdminData();
    } catch (error) {
      alert('Identifiants admin incorrects');
    }
  };

  const loadAdminData = async () => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      const headers = { Authorization: `Basic ${auth}` };
      
      const [photosResponse, articlesResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API}/admin/photos`, { headers }),
        axios.get(`${API}/admin/articles-for-photos`, { headers }),
        axios.get(`${API}/admin/categories-tree`, { headers })
      ]);
      
      setAllPhotos(photosResponse.data);
      setAllArticles(articlesResponse.data);
      setCategoriesTree(categoriesResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
    }
  };

  const assignPhotoToArticle = async (photoFilename, articleId) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.post(`${API}/admin/photos/assign`, {
        photo_filename: photoFilename,
        article_id: articleId
      }, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      // Recharger les données
      loadAdminData();
      alert('Photo assignée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation de la photo');
    }
  };

  const unassignPhoto = async (photoFilename) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.delete(`${API}/admin/photos/${photoFilename}/assignment`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      // Recharger les données
      loadAdminData();
      alert('Photo désassignée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la désassignation:', error);
      alert('Erreur lors de la désassignation de la photo');
    }
  };

  // Category management functions
  const createCategory = async (categoryData) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.post(`${API}/admin/categories`, categoryData, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      loadAdminData();
      setShowCategoryForm(false);
      setEditingCategory(null);
      alert('Catégorie créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la catégorie');
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.put(`${API}/admin/categories/${categoryId}`, categoryData, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      loadAdminData();
      setShowCategoryForm(false);
      setEditingCategory(null);
      alert('Catégorie mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
        await axios.delete(`${API}/admin/categories/${categoryId}`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        
        loadAdminData();
        alert('Catégorie supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert(error.response?.data?.detail || 'Erreur lors de la suppression de la catégorie');
      }
    }
  };

  // Article management functions
  const createArticle = async (articleData) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.post(`${API}/admin/articles`, articleData, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      loadAdminData();
      setShowArticleForm(false);
      setEditingArticle(null);
      alert('Article créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l\'article');
    }
  };

  const updateArticle = async (articleId, articleData) => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      await axios.put(`${API}/admin/articles/${articleId}`, articleData, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      loadAdminData();
      setShowArticleForm(false);
      setEditingArticle(null);
      alert('Article mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de l\'article');
    }
  };

  const deleteArticle = async (articleId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
        await axios.delete(`${API}/admin/articles/${articleId}`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        
        loadAdminData();
        alert('Article supprimé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full">
              <Truck className="h-8 w-8 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">ALLO DÉBARRAS EXPRESS</h1>
          </div>
          <div className="text-white font-mono text-lg">
            06.51.15.54.40
          </div>
        </div>

        {/* Main content */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            VOUS SOUHAITEZ<br />
            FAIRE DÉBARRASSER ?
          </h2>
        </div>

        {/* Options buttons */}
        <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto">
          <Button
            onClick={() => setCurrentStep('whole-home')}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un logement entier
          </Button>
          
          <Button
            onClick={() => setCurrentStep('garage-cave')}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un garage / une cave
          </Button>
          
          <Button
            onClick={() => {
              setCurrentStep('categories');
              loadCategories();
            }}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un ou plusieurs articles <span className="text-sm opacity-80">(devis instantané)</span>
          </Button>
        </div>

        {/* Alternative option */}
        <div className="mt-16 text-center">
          <p className="text-white text-lg mb-4">Ou proposez un devis sur photos</p>
          <Button
            onClick={() => setCurrentStep('photo-quote')}
            className="bg-white text-teal-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl"
          >
            <Upload className="mr-2 h-5 w-5" />
            Envoyer des photos
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-white text-sm opacity-75">
          © 2025 Allo Débarras Express
          <Button
            onClick={() => setCurrentStep('admin-login')}
            variant="ghost"
            className="ml-4 text-white hover:text-gray-200 underline text-sm"
          >
            Admin
          </Button>
        </div>
      </div>
    </div>
  );

  const CategoriesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => setCurrentStep('home')}
            variant="outline"
            className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
          
          {(selectedItems.length > 0 || customItems.length > 0) && (
            <Button
              onClick={() => setCurrentStep('selection')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ma sélection ({selectedItems.length + customItems.length})
            </Button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleCategoryClick(category)}
            >
              <CardContent className="p-8 text-center bg-gradient-to-r from-orange-400 to-orange-500">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-black">
                  {category.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const SubcategoriesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => setCurrentStep('categories')}
            variant="outline"
            className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour catégories générales
          </Button>
          
          {(selectedItems.length > 0 || customItems.length > 0) && (
            <Button
              onClick={() => setCurrentStep('selection')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ma sélection ({selectedItems.length + customItems.length})
            </Button>
          )}
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subcategories.map((subcategory) => (
            <Card
              key={subcategory.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleSubcategoryClick(subcategory)}
            >
              <CardContent className="p-8 text-center bg-gradient-to-r from-orange-400 to-orange-500">
                <h3 className="text-xl font-bold text-black">
                  {subcategory.name}
                </h3>
                {subcategory.description && (
                  <p className="text-sm text-gray-700 mt-2 opacity-80">
                    {subcategory.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const ArticlesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left side - Articles */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button
                onClick={() => setCurrentStep('subcategories')}
                variant="outline"
                className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="hover:shadow-lg transition-all duration-200"
                >
                  <CardHeader>
                    <CardTitle className="text-center text-lg">{article.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    {/* Photos réelles avec correspondances LOGIQUES */}
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {(() => {
                        let photoSrc = null;
                        // CORRESPONDANCES LOGIQUES ET COHÉRENTES
                        if (article.id === 'chaise_bureau') photoSrc = '/photos/chaise-moderne.png'; // Une vraie chaise
                        else if (article.id === 'fauteuil_salon') photoSrc = '/photos/fauteuil-gris.png'; // Un vrai fauteuil
                        else if (article.id === 'table_salle_manger') photoSrc = '/photos/table-ronde.png'; // Une vraie table
                        else if (article.id === 'bureau_moderne') photoSrc = '/photos/table-ronde.png'; // Table peut servir de bureau
                        else if (article.id === 'lit_double') photoSrc = '/photos/lit-simple.png'; // Un vrai lit
                        else if (article.id === 'lit_double_medicalise') photoSrc = '/photos/lit-double.png'; // Un lit plus imposant
                        
                        // POUR L'ÉLECTROMÉNAGER : placeholders en attendant de trouver les bonnes photos
                        // Je ne mets PAS de photos incohérentes
                        
                        return photoSrc ? (
                          <img 
                            src={photoSrc} 
                            alt={article.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">📷 Photo {article.name} à venir</span>
                        );
                      })()}
                      <span className="text-gray-500 text-sm hidden">Photo {article.name}</span>
                    </div>
                    
                    {/* PRIX MASQUÉ - sera affiché dans le récapitulatif final */}
                    
                    {article.materials && article.materials.length > 0 ? (
                      <div>
                        <p className="mb-2 font-medium">Choisir le matériau :</p>
                        <div className="grid grid-cols-2 gap-2">
                          {article.materials.map((material) => (
                            <Button
                              key={`${article.id}-${material}`}
                              onClick={() => addToSelection(article, material)}
                              variant="outline"
                              className="h-auto py-2 text-sm hover:bg-orange-100"
                            >
                              {material}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToSelection(article)}
                        className="bg-orange-500 hover:bg-orange-600 w-full"
                      >
                        Ajouter à ma sélection
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Item Input */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Mon objet n'est pas dans la liste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    id="custom-item-description"
                    placeholder="Décrivez votre objet (ex: Table ronde en marbre 1m50)"
                    className="flex-1"
                  />
                  <Button
                    onClick={addCustomItem}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Un supplément sera calculé après consultation et vous sera confirmé avant réservation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Selection Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Ma sélection ({selectedItems.length + customItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItems.length === 0 && customItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucun article sélectionné
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Selected Items */}
                    {selectedItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{item.article_name}</h4>
                          <Button
                            onClick={() => removeFromSelection(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {item.material && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {item.material}
                          </Badge>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <Button
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* Prix masqué pendant la sélection - visible uniquement dans le récapitulatif final */}
                        </div>
                        
                        {item.requires_dismantling && (
                          <div className="mt-2 flex items-center space-x-2">
                            <Checkbox
                              id={`dismantled-${index}`}
                              checked={item.is_dismantled}
                              onCheckedChange={() => toggleDismantling(index)}
                            />
                            <label htmlFor={`dismantled-${index}`} className="text-xs text-gray-600">
                              Déjà démonté/débranché
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Custom Items */}
                    {customItems.map((item, index) => (
                      <div key={`custom-${index}`} className="border rounded-lg p-3 border-orange-200 bg-orange-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{item.description}</h4>
                          <Button
                            onClick={() => removeCustomItem(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Supplément à confirmer
                        </Badge>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      {/* Total masqué pendant la sélection - sera visible dans le récapitulatif final */}
                      <div className="text-center text-gray-600">
                        <span>Prix calculé après validation des informations</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setCurrentStep('quote-form')}
                      className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                    >
                      Continuer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const QuoteFormPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => setCurrentStep('articles')}
            variant="outline"
            className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations pour votre devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nom complet *"
                    value={quoteForm.client_name}
                    onChange={(e) => setQuoteForm({...quoteForm, client_name: e.target.value})}
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={quoteForm.client_email}
                    onChange={(e) => setQuoteForm({...quoteForm, client_email: e.target.value})}
                  />
                </div>
                
                <Input
                  type="tel"
                  placeholder="Téléphone *"
                  value={quoteForm.client_phone}
                  onChange={(e) => setQuoteForm({...quoteForm, client_phone: e.target.value})}
                />
                
                <Input
                  placeholder="Adresse complète *"
                  value={quoteForm.address}
                  onChange={(e) => setQuoteForm({...quoteForm, address: e.target.value})}
                />

                {/* Access Info */}
                <div>
                  <label className="block text-sm font-medium mb-2">Stationnement :</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['facile', 'delicat', 'difficile'].map((parking) => (
                      <Button
                        key={parking}
                        onClick={() => setQuoteForm({...quoteForm, parking})}
                        variant={quoteForm.parking === parking ? "default" : "outline"}
                        className={quoteForm.parking === parking ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {parking}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Étage :</label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={quoteForm.floor}
                      onChange={(e) => setQuoteForm({...quoteForm, floor: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={() => setQuoteForm({...quoteForm, elevator: !quoteForm.elevator})}
                      variant={quoteForm.elevator ? "default" : "outline"}
                      className={quoteForm.elevator ? "bg-orange-500 hover:bg-orange-600 w-full" : "w-full"}
                    >
                      {quoteForm.elevator ? <Check className="mr-2 h-4 w-4" /> : null}
                      Ascenseur
                    </Button>
                  </div>
                </div>

                {/* Zone Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Zone d'intervention :</label>
                  <Select value={quoteForm.zone} onValueChange={(value) => setQuoteForm({...quoteForm, zone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner votre zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(zones).map(([key, zone]) => (
                        <SelectItem key={key} value={key}>
                          {zone.name} - {zone.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Détails importants (accès, contraintes particulières...)"
                  value={quoteForm.additional_info}
                  onChange={(e) => setQuoteForm({...quoteForm, additional_info: e.target.value})}
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Date d'intervention souhaitée :</label>
                  <Input
                    type="date"
                    value={quoteForm.preferred_date}
                    onChange={(e) => {
                      setQuoteForm({...quoteForm, preferred_date: e.target.value});
                      if (e.target.value && quoteForm.zone) {
                        loadAvailableSlots(e.target.value, quoteForm.zone);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Disponibilités : Mardi, Mercredi, Jeudi de 7h à 20h
                  </p>
                </div>

                {/* Time Slots */}
                {availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Créneau horaire :</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time_slot}
                          onClick={() => setQuoteForm({...quoteForm, preferred_time_slot: slot.time_slot})}
                          variant={quoteForm.preferred_time_slot === slot.time_slot ? "default" : "outline"}
                          disabled={!slot.available}
                          className={`text-xs ${
                            quoteForm.preferred_time_slot === slot.time_slot 
                              ? "bg-orange-500 hover:bg-orange-600" 
                              : ""
                          } ${!slot.available ? "opacity-50" : ""}`}
                        >
                          {slot.time_slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setQuoteForm({...quoteForm, urgent: !quoteForm.urgent})}
                  variant={quoteForm.urgent ? "destructive" : "outline"}
                  className="w-full"
                >
                  {quoteForm.urgent ? "🚨 Intervention d'urgence (supplément)" : "Intervention standard"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Articles sélectionnés :</h4>
                    {selectedItems.map((item, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {item.quantity}x {item.article_name} {item.material && `(${item.material})`}
                      </div>
                    ))}
                    
                    {customItems.map((item, index) => (
                      <div key={`custom-${index}`} className="text-sm text-orange-600">
                        + {item.description}
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total final :</span>
                      <span className="text-orange-600">{calculateTotal()}€</span>
                    </div>
                    {customItems.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        + supplément à confirmer
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={submitQuote}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3"
                    disabled={!quoteForm.client_name || !quoteForm.client_email || !quoteForm.client_phone || !quoteForm.address || !quoteForm.parking}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Envoyer le devis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const PhotoQuotePage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          onClick={() => setCurrentStep('home')}
          variant="outline"
          className="mb-8 bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Devis sur photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="mb-4">Envoyez-nous jusqu'à 10 photos de vos objets à évacuer</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Cliquez ou glissez vos photos ici</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Sélectionner les photos
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Plus de 10 photos ? Contactez-nous sur WhatsApp
              </p>
            </div>

            <div className="space-y-4">
              <Input placeholder="Nom complet" />
              <Input type="email" placeholder="Email" />
              <Input type="tel" placeholder="Téléphone" />
              <Input placeholder="Adresse complète" />
              <Textarea placeholder="Description des objets et informations complémentaires" rows={4} />
            </div>

            <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3">
              Envoyer la demande de devis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AdminLoginPage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Connexion Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Email admin"
            value={adminAuth.username}
            onChange={(e) => setAdminAuth({...adminAuth, username: e.target.value})}
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={adminAuth.password}
            onChange={(e) => setAdminAuth({...adminAuth, password: e.target.value})}
          />
          <Button 
            onClick={authenticateAdmin}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Se connecter
          </Button>
          <Button 
            onClick={() => setCurrentStep('home')}
            variant="outline"
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Category Form Component
  const CategoryForm = ({ category, allCategories, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState({
      name: category?.name || '',
      parent_id: category?.parent_id || '',
      description: category?.description || '',
      icon: category?.icon || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const dataToSend = { ...formData };
      if (!dataToSend.parent_id) dataToSend.parent_id = null;
      if (!dataToSend.description) delete dataToSend.description;
      if (!dataToSend.icon) delete dataToSend.icon;
      
      onSave(dataToSend);
    };

    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nom de la catégorie"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            
            <Select value={formData.parent_id} onValueChange={(value) => setFormData({...formData, parent_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie parent (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune (catégorie racine)</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} disabled={cat.id === category?.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Icône (emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
            />
            
            <Textarea
              placeholder="Description (optionnelle)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                {category ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Article Form Component
  const ArticleForm = ({ article, allCategories, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState({
      name: article?.name || '',
      category_id: article?.category_id || '',
      base_price: article?.base_price || 0,
      materials: article?.materials?.join(', ') || '',
      description: article?.description || '',
      requires_dismantling: article?.requires_dismantling || false
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const dataToSend = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        materials: formData.materials ? formData.materials.split(',').map(m => m.trim()).filter(m => m) : []
      };
      if (!dataToSend.description) delete dataToSend.description;
      
      onSave(dataToSend);
    };

    // Flatten categories for selection
    const flattenCategories = (cats, prefix = '') => {
      let result = [];
      cats.forEach(cat => {
        result.push({ id: cat.id, name: prefix + cat.name });
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flattenCategories(cat.children, prefix + cat.name + ' > '));
        }
      });
      return result;
    };

    const flatCategories = flattenCategories(categoriesTree);

    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{article ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nom de l'article"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            
            <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              step="0.01"
              placeholder="Prix de base"
              value={formData.base_price}
              onChange={(e) => setFormData({...formData, base_price: e.target.value})}
              required
            />
            
            <Input
              placeholder="Matériaux (séparés par des virgules)"
              value={formData.materials}
              onChange={(e) => setFormData({...formData, materials: e.target.value})}
            />
            
            <Textarea
              placeholder="Description (optionnelle)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_dismantling"
                checked={formData.requires_dismantling}
                onCheckedChange={(checked) => setFormData({...formData, requires_dismantling: checked})}
              />
              <label htmlFor="requires_dismantling">Nécessite démontage/débranchement</label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                {article ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const AdminPhotosPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Administration</h1>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentStep('admin-photos')}
                variant={currentStep === 'admin-photos' ? 'default' : 'outline'}
                className={currentStep === 'admin-photos' ? 'bg-teal-600 hover:bg-teal-700' : ''}
              >
                Photos
              </Button>
              <Button
                onClick={() => setCurrentStep('admin-categories')}
                variant={currentStep === 'admin-categories' ? 'default' : 'outline'}
                className={currentStep === 'admin-categories' ? 'bg-teal-600 hover:bg-teal-700' : ''}
              >
                Catégories
              </Button>
            </div>
          </div>
          <Button
            onClick={() => {
              setIsAdminMode(false);
              setCurrentStep('home');
            }}
            variant="outline"
          >
            Déconnexion
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photos disponibles */}
          <div>
            <h2 className="text-xl font-bold mb-4">Photos Disponibles ({allPhotos.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {allPhotos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative border-2 rounded-lg p-2 cursor-grab ${
                    photo.is_assigned ? 'border-green-400 bg-green-50' : 'border-gray-300'
                  } hover:border-orange-400 transition-colors`}
                  draggable
                  onDragStart={(e) => {
                    setDraggedPhoto(photo);
                    e.dataTransfer.setData('text/plain', '');
                  }}
                >
                  <img
                    src={`${BACKEND_URL}${photo.preview_url}`}
                    alt={photo.filename}
                    className="w-full h-20 object-cover rounded"
                  />
                  <p className="text-xs mt-1 truncate">{photo.filename}</p>
                  {photo.is_assigned && (
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-green-500 text-white text-xs">
                        ✓
                      </Badge>
                    </div>
                  )}
                  {photo.is_assigned && (
                    <div className="mt-1">
                      <p className="text-xs text-green-600 font-medium">
                        → {photo.assigned_to_article_name}
                      </p>
                      <Button
                        onClick={() => unassignPhoto(photo.filename)}
                        size="sm"
                        variant="outline"
                        className="text-xs mt-1 h-6"
                      >
                        Désassigner
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Articles */}
          <div>
            <h2 className="text-xl font-bold mb-4">Articles ({allArticles.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allArticles.map((article, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedPhoto) {
                      assignPhotoToArticle(draggedPhoto.filename, article.id);
                      setDraggedPhoto(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{article.name}</h3>
                      <p className="text-sm text-gray-600">ID: {article.id}</p>
                      {article.image_url && (
                        <div className="flex items-center mt-1">
                          <img
                            src={`${BACKEND_URL}${article.image_url}`}
                            alt="Preview"
                            className="w-8 h-8 object-cover rounded mr-2"
                          />
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Photo assignée
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Glissez une photo ici</p>
                      <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        📷
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aide */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Comment utiliser :</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Glissez une photo depuis la colonne de gauche vers un article à droite</li>
              <li>• Les photos vertes sont déjà assignées</li>
              <li>• Cliquez sur "Désassigner" pour retirer une assignation</li>
              <li>• Une photo ne peut être assignée qu'à un seul article</li>
            </ul>
          </CardContent>
        </Card>

        {/* Forms */}
        {showCategoryForm && (
          <CategoryForm
            category={editingCategory}
            allCategories={allArticles}
            onSave={(data) => editingCategory ? updateCategory(editingCategory.id, data) : createCategory(data)}
            onCancel={() => {setShowCategoryForm(false); setEditingCategory(null);}}
          />
        )}

        {showArticleForm && (
          <ArticleForm
            article={editingArticle}
            allCategories={categoriesTree}
            onSave={(data) => editingArticle ? updateArticle(editingArticle.id, data) : createArticle(data)}
            onCancel={() => {setShowArticleForm(false); setEditingArticle(null);}}
          />
        )}
      </div>
    </div>
  );

  const AdminCategoriesPage = () => {
    const renderCategoryTree = (categories, level = 0) => {
      return categories.map((category) => (
        <div key={category.id} className={`ml-${level * 4}`}>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div>
                    <h3 className="font-bold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{category.children?.length || 0} sous-catégories</span>
                      <span>{category.articles?.length || 0} articles</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryForm(true);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAdminCategory(category);
                      setShowCategoryForm(true);
                    }}
                  >
                    + Sous-catégorie
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>

              {/* Articles dans cette catégorie */}
              {category.articles && category.articles.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Articles :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.articles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium text-sm">{article.name}</span>
                          <span className="text-xs text-gray-600 ml-2">{article.base_price}€</span>
                          {article.image_url && (
                            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">📷</Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingArticle(article);
                              setShowArticleForm(true);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteArticle(article.id)}
                            className="h-6 px-2 text-xs text-red-600"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAdminCategory(category);
                      setShowArticleForm(true);
                    }}
                    className="mt-2"
                  >
                    + Nouvel article
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sous-catégories */}
          {category.children && category.children.length > 0 && (
            <div className="ml-8">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      ));
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold">Administration</h1>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentStep('admin-photos')}
                  variant={currentStep === 'admin-photos' ? 'default' : 'outline'}
                  className={currentStep === 'admin-photos' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  Photos
                </Button>
                <Button
                  onClick={() => setCurrentStep('admin-categories')}
                  variant={currentStep === 'admin-categories' ? 'default' : 'outline'}
                  className={currentStep === 'admin-categories' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  Catégories
                </Button>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowCategoryForm(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                + Nouvelle catégorie
              </Button>
              <Button
                onClick={() => {
                  setIsAdminMode(false);
                  setCurrentStep('home');
                }}
                variant="outline"
              >
                Déconnexion
              </Button>
            </div>
          </div>

          {/* Categories Tree */}
          <div className="space-y-6">
            {renderCategoryTree(categoriesTree)}
          </div>

          {/* Forms */}
          {showCategoryForm && (
            <CategoryForm
              category={editingCategory}
              allCategories={allArticles}
              onSave={(data) => {
                if (selectedAdminCategory && !editingCategory) {
                  // Creating subcategory
                  data.parent_id = selectedAdminCategory.id;
                }
                editingCategory ? updateCategory(editingCategory.id, data) : createCategory(data);
              }}
              onCancel={() => {
                setShowCategoryForm(false); 
                setEditingCategory(null);
                setSelectedAdminCategory(null);
              }}
            />
          )}

          {showArticleForm && (
            <ArticleForm
              article={editingArticle}
              allCategories={categoriesTree}
              onSave={(data) => {
                if (selectedAdminCategory && !editingArticle) {
                  // Creating article in specific category
                  data.category_id = selectedAdminCategory.id;
                }
                editingArticle ? updateArticle(editingArticle.id, data) : createArticle(data);
              }}
              onCancel={() => {
                setShowArticleForm(false); 
                setEditingArticle(null);
                setSelectedAdminCategory(null);
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // Router simple
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 'home':
        return <HomePage />;
      case 'categories':
        return <CategoriesPage />;
      case 'subcategories':
        return <SubcategoriesPage />;
      case 'articles':
        return <ArticlesPage />;
      case 'quote-form':
        return <QuoteFormPage />;
      case 'photo-quote':
        return <PhotoQuotePage />;
      case 'admin-login':
        return <AdminLoginPage />;
      case 'admin-photos':
        return <AdminPhotosPage />;
      case 'admin-categories':
        return <AdminCategoriesPage />;
      case 'whole-home':
      case 'garage-cave':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Fonctionnalité en cours de développement</h2>
                <p className="text-gray-600 mb-4">Cette option sera bientôt disponible.</p>
                <Button onClick={() => setCurrentStep('home')} className="bg-teal-600 hover:bg-teal-700">
                  Retour à l'accueil
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return <div className="App">{renderCurrentStep()}</div>;
}

export default App;