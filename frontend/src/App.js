import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Truck, Phone, Calendar, MapPin, ShoppingCart, ArrowLeft, Check, Upload } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentStep, setCurrentStep] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [cart, setCart] = useState([]);
  const [quoteForm, setQuoteForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    parking: '',
    floor: 0,
    elevator: false,
    additional_info: '',
    preferred_date: '',
    urgent: false
  });

  // Initialiser les données de base
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await axios.post(`${API}/init-data`);
      loadCategories();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      loadCategories(); // Essayer de charger quand même
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

  const addToCart = (article, material = null) => {
    const cartItem = {
      article_id: article.id,
      article_name: article.name,
      material: material,
      quantity: 1,
      unit_price: article.base_price
    };
    setCart([...cart, cartItem]);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const submitQuote = async () => {
    try {
      const quoteData = {
        quote_type: 'instant',
        items: cart,
        ...quoteForm
      };
      
      await axios.post(`${API}/quotes`, quoteData);
      alert('Devis envoyé avec succès ! Vous recevrez une confirmation par email.');
      setCurrentStep('home');
      setCart([]);
      setQuoteForm({
        client_name: '',
        client_email: '',
        client_phone: '',
        address: '',
        parking: '',
        floor: 0,
        elevator: false,
        additional_info: '',
        preferred_date: '',
        urgent: false
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du devis:', error);
      alert('Erreur lors de l\'envoi du devis. Veuillez réessayer.');
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
          
          {cart.length > 0 && (
            <Button
              onClick={() => setCurrentStep('cart')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Panier ({cart.length})
            </Button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Card
              key={`category-${category.id}-${index}`}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSelectedCategory(category);
                setCurrentStep('subcategories');
                loadSubcategories(category.id);
              }}
            >
              <CardContent className="p-8 text-center bg-gradient-to-r from-orange-400 to-orange-500">
                <h3 className="text-2xl font-bold text-black">
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
          
          {cart.length > 0 && (
            <Button
              onClick={() => setCurrentStep('cart')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Panier ({cart.length})
            </Button>
          )}
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subcategories.map((subcategory, index) => (
            <Card
              key={`subcategory-${subcategory.id}-${index}`}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSelectedSubcategory(subcategory);
                setCurrentStep('articles');
                loadArticles(subcategory.id);
              }}
            >
              <CardContent className="p-8 text-center bg-gradient-to-r from-orange-400 to-orange-500">
                <h3 className="text-xl font-bold text-black">
                  {subcategory.name}
                </h3>
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
          
          {cart.length > 0 && (
            <Button
              onClick={() => setCurrentStep('cart')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Panier ({cart.length})
            </Button>
          )}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardHeader>
                <CardTitle className="text-center">{article.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-2xl font-bold text-orange-600 mb-4">
                  {article.base_price}€
                </p>
                
                {article.materials && article.materials.length > 0 ? (
                  <div>
                    <p className="mb-2 font-medium">Choisir le matériau :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {article.materials.map((material) => (
                        <Button
                          key={material}
                          onClick={() => addToCart(article, material)}
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
                    onClick={() => addToCart(article)}
                    className="bg-orange-500 hover:bg-orange-600 w-full"
                  >
                    Ajouter au panier
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const CartPage = () => (
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
            Continuer mes achats
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Mon panier</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500">Votre panier est vide</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.article_name}</h4>
                        {item.material && (
                          <Badge variant="secondary" className="mt-1">
                            {item.material}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold">{item.unit_price}€</span>
                        <Button
                          onClick={() => removeFromCart(index)}
                          variant="destructive"
                          size="sm"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total :</span>
                      <span className="text-orange-600">{calculateTotal()}€</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations pour le devis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nom complet"
                  value={quoteForm.client_name}
                  onChange={(e) => setQuoteForm({...quoteForm, client_name: e.target.value})}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={quoteForm.client_email}
                  onChange={(e) => setQuoteForm({...quoteForm, client_email: e.target.value})}
                />
              </div>
              
              <Input
                type="tel"
                placeholder="Téléphone"
                value={quoteForm.client_phone}
                onChange={(e) => setQuoteForm({...quoteForm, client_phone: e.target.value})}
              />
              
              <Input
                placeholder="Adresse complète"
                value={quoteForm.address}
                onChange={(e) => setQuoteForm({...quoteForm, address: e.target.value})}
              />

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
                    className={quoteForm.elevator ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    {quoteForm.elevator ? <Check className="mr-2 h-4 w-4" /> : null}
                    Ascenseur
                  </Button>
                </div>
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
                  onChange={(e) => setQuoteForm({...quoteForm, preferred_date: e.target.value})}
                />
              </div>

              <Button
                onClick={() => setQuoteForm({...quoteForm, urgent: !quoteForm.urgent})}
                variant={quoteForm.urgent ? "destructive" : "outline"}
                className="w-full"
              >
                {quoteForm.urgent ? "🚨 Intervention d'urgence (supplément)" : "Intervention standard"}
              </Button>

              <Button
                onClick={submitQuote}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3"
                disabled={cart.length === 0 || !quoteForm.client_name || !quoteForm.client_email || !quoteForm.client_phone || !quoteForm.address}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Envoyer le devis
              </Button>
            </CardContent>
          </Card>
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
      case 'cart':
        return <CartPage />;
      case 'photo-quote':
        return <PhotoQuotePage />;
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