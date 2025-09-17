import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import axios from "axios";
import { 
  Truck, Phone, Calendar, MapPin, List, ArrowLeft, Check, Upload, 
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

// Structure hiérarchique complète pour MOBILIER (Admin)
const MOBILIER_ADMIN_STRUCTURE = {
  id: 'mobilier',
  name: 'MOBILIER',
  icon: '🛏️',
  color: 'from-blue-400 to-blue-500',
  categories: {
    'literie': {
      id: 'literie',
      name: 'LITERIE',
      icon: '🛏️',
      subcategories: {
        'sommier': {
          name: 'SOMMIER',
          items: [
            { name: 'Sommier simple', materials: ['en ferraille', 'en bois'] },
            { name: 'Sommier double', materials: ['en ferraille', 'en bois'] },
            { name: 'Sommier king size', materials: ['en ferraille', 'en bois'] }
          ]
        },
        'matelas': {
          name: 'MATELAS',
          items: [
            { name: 'Matelas simple', variants: [] },
            { name: 'Matelas double', variants: ['140', '160'] },
            { name: 'Matelas king size', variants: [] }
          ]
        },
        'lit_complet': {
          name: 'LIT COMPLET',
          items: [
            { name: 'Lit simple', variants: [] },
            { name: 'Lit double', variants: ['140', '160'] },
            { name: 'Lit king size', variants: [] }
          ]
        },
        'autres_lits': {
          name: 'AUTRES LITS',
          items: [
            { name: 'Lit électrique', variants: ['simple', 'double'] },
            { name: 'Lit médicalisé', variants: ['simple', 'double'] },
            { name: 'Lit bébé', variants: [] },
            { name: 'Lits superposés', variants: [] },
            { name: 'Lit escamotable', variants: ['1 place', '2 places'] },
            { name: 'Lit pliant', variants: ['1 place', '2 places'] },
            { name: 'Lit bureau enfant', variants: [] },
            { name: 'Mezzanine', variants: ['lit 1 place', 'lit 2 places'], options: ['+ bureau'] },
            { name: 'Lit gigogne', variants: ['simple', 'double'] }
          ]
        },
        'divers': {
          name: 'DIVERS',
          items: [
            { name: 'Tête de lit', variants: [] },
            { name: 'Meuble contour de lit (pont de lit)', variants: [] },
            { name: 'Table de nuit', variants: [] },
            { name: 'Couette/couverture/oreiller/traversin', variants: [] }
          ]
        }
      }
    },
    'tables': {
      id: 'tables',
      name: 'TABLES',
      icon: '🪑',
      items: [
        { name: 'Basse', materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'verre', 'plastique', 'fonte', 'osier', 'marbre'] },
        { name: 'Pour manger', materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'verre', 'plastique', 'fonte', 'osier', 'marbre'] },
        { name: 'De pique-nique', variants: ['grand format', 'petit format'], materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'plastique', 'fonte'] },
        { name: 'Longue table +/-2M style pétrin/table de ferme', materials: ['Bois', 'bois massif', 'verre', 'pierre', 'fonte', 'plastique'] },
        { name: 'Pliante', materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'verre', 'plastique', 'osier'] },
        { name: 'Ronde/ovale', variants: ['bistrot', 'de salle à manger', 'avec rallonge'], materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'verre', 'plastique', 'fonte', 'osier', 'marbre'] },
        { name: 'Carrée', materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'verre', 'plastique', 'fonte', 'osier', 'marbre'] },
        { name: 'À repasser', materials: [] },
        { name: 'Bureau', variants: ['petit', 'moyen', 'grand'], materials: ['Bois', 'Bois massif', 'fer', 'verre', 'marbre'] },
        { name: 'Comptoir/Bar', materials: [] }
      ]
    },
    'canape_fauteuils': {
      id: 'canape_fauteuils',
      name: 'CANAPÉ/FAUTEUILS',
      icon: '🛋️',
      subcategories: {
        'fauteuils': {
          name: 'FAUTEUILS',
          items: [
            { name: 'Medical (ou électrique)', variants: [] },
            { name: 'Petit fauteuils / chauffeuse', materials: ['osier'], note: '...' },
            { name: 'Fauteuil convertible', variants: [] },
            { name: 'Crapauds', variants: [] },
            { name: 'Rocking-chair', variants: [] },
            { name: 'Gros fauteuils de salon', variants: [] }
          ]
        },
        'canapes': {
          name: 'CANAPÉS',
          items: [
            { name: 'Canapé standard', variants: ['2 places', '3 places'] },
            { name: 'Convertible / clic clac / BZ', variants: [] },
            { name: 'Canapé d\'angle', variants: [] },
            { name: 'Méridienne', variants: [] },
            { name: 'Canapé modulaire', variants: [] },
            { name: 'Canapé style Chesterfield', variants: [] },
            { name: 'Canapé compact /banquette', variants: [] },
            { name: 'Rapido', variants: [] },
            { name: 'Canapé électrique', variants: [] },
            { name: 'Canapé électrique avec retour', variants: [] },
            { name: 'Canapé structure bois ancien démontable', variants: [] }
          ]
        }
      }
    },
    'assises': {
      id: 'assises',
      name: 'ASSISES',
      icon: '🪑',
      subcategories: {
        'chaises': {
          name: 'CHAISES',
          items: [
            { name: 'chaises pliantes', materials: ['Bois', 'Bois massif', 'fer', 'plastique', 'plastique lourd', 'osier', 'fonte'] },
            { name: 'chaises empilables de jardin', materials: ['plastique', 'plastique lourd'] },
            { name: 'chaises', materials: ['Bois', 'Bois massif', 'fer', 'verre', 'plastique', 'plastique lourd', 'osier', 'fonte'] },
            { name: 'Chaise de bureau /reunion', variants: [] },
            { name: 'Rocking-chair', variants: [] },
            { name: 'Chaises par style', variants: ['style louis XVI', 'bistrot', 'scandinave'] }
          ]
        },
        'fauteuils_assises': {
          name: 'FAUTEUILS',
          items: [
            { name: 'fauteuils salle à manger en bois', materials: ['Bois', 'bois massif'] },
            { name: 'fauteuils de jardin/transat', variants: ['empilable', 'pliant'], materials: ['Bois', 'Bois massif', 'fer', 'plastique', 'osier'] },
            { name: 'fauteuils de bureau', variants: ['petit', 'gamer'] },
            { name: 'Fauteuils de salon par style', variants: ['club', 'bridge', 'crapaud', 'bergère', 'cabriolet', 'gros fauteuil'] }
          ]
        },
        'banc_divers': {
          name: 'BANC/BANQUETTE/POUF/TABOURET/REPOSE PIED/TRANSAT',
          items: [
            { name: 'banc', materials: ['Bois', 'Bois massif', 'fer', 'pierre', 'plastique', 'fonte', 'osier'] },
            { name: 'Banc coffre', variants: [] },
            { name: 'pouf', variants: ['cubique', 'cylindrique', 'gros pouf', 'chauffeuse'] },
            { name: 'tabourets', variants: ['bar', 'pliant', 'petit tabouret'] },
            { name: 'Banquette', variants: ['angle cuisine', 'méridien', 'confident'] },
            { name: 'Transat', variants: ['empilable', 'pliable'], materials: ['Bois', 'Bois massif', 'fer', 'plastique', 'osier'] }
          ]
        }
      }
    },
    'meubles_rangement': {
      id: 'meubles_rangement',
      name: 'MEUBLES DE RANGEMENTS',
      icon: '🗄️',
      items: [
        { name: 'COMMODE BASSE/BUFFET', variants: ['petit', 'grand', 'XL', 'HAUTE(semainier) +2M'], options: ['+ dessus marbre'] },
        { name: 'BLOC CASIER OU COMMODE MODULABLE', variants: [] },
        { name: 'SECRÉTAIRE', variants: [] },
        { name: 'MEUBLE À CHAUSSURES', variants: [] },
        { name: 'ELEMENTS DE CUISINE', variants: ['placards', 'îlot de cuisine'], options: ['à démonter', 'plaques de cuisson', 'évier', 'plan de travail', 'hotte', 'démontage pour chacun', 'carton de vaisselle'] },
        { name: 'ARMOIRE', variants: [] },
        { name: 'RANGEMENTS XXL', note: 'Jusqu\'au plafond ou presque' },
        { name: 'VAISSELIER', variants: ['PARTIE HAUTE', 'basse', 'entier'] },
        { name: 'Enfilade', variants: [] },
        { name: 'VITRINE', variants: [] },
        { name: 'Meuble de couloir', variants: [] },
        { name: 'ETAGERE', options: ['taille', 'matière'] },
        { name: 'BIBLIOTHEQUE', options: ['taille', 'matière'] },
        { name: 'MEUBLE TV', variants: ['petit', 'moyen', 'grand'], options: ['+TV (Petite, moyenne, grande ou cathodique)'] }
      ]
    },
    'salle_de_bain': {
      id: 'salle_de_bain',
      name: 'SALLE DE BAIN',
      icon: '🛁',
      items: [
        { name: 'BAIGNOIRE', options: ['déjà démontée (cochée d\'office)', 'matériau'] },
        { name: 'LAVABO', options: ['déjà démonté (cochée d\'office)'] },
        { name: 'Meuble lavabo', variants: [] },
        { name: 'Colonne rangement salle de bain', variants: [] },
        { name: 'Miroir rangement salle de bain', variants: [] }
      ]
    },
    'autres_meubles': {
      id: 'autres_meubles',
      name: 'Autres meubles',
      icon: '🎨',
      items: [
        { name: 'Chevalet', variants: [] }
      ]
    }
  }
};

// Structure hiérarchique pour l'électroménager
const ELECTROMENAGER_STRUCTURE = {
  'froid': {
    name: 'Froid',
    icon: '❄️',
    items: {
      'frigo': {
        name: 'FRIGO',
        variants: ['top', '1 porte', 'grand'],
        photos: [
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=200&fit=crop',
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=200&fit=crop'
        ]
      },
      'congelateur': {
        name: 'CONGELATEUR',
        variants: ['mini', 'coffre simple', 'double coffre', 'vertical', 'armoire professionnelle simple', 'armoire professionnelle double'],
        photos: [
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=200&fit=crop'
        ]
      },
      'frigo_congelateur': {
        name: 'FRIGO CONGELATEUR',
        variants: ['combiné standard', 'combiné grand', 'américain', 'armoire frigorifique simple', 'armoire frigorifique double'],
        photos: [
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=200&fit=crop'
        ]
      }
    }
  },
  'cuisine': {
    name: 'Cuisine',
    icon: '🍳',
    items: {
      'gaziniere': {
        name: 'GAZINIERE',
        variants: [],
        photos: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop'
        ]
      },
      'lave_vaisselle': {
        name: 'LAVE VAISSELLE',
        variants: [],
        photos: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
        ]
      },
      'four': {
        name: 'FOUR',
        variants: ['encastré', 'four taille micro-ondes', 'mini four'],
        photos: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop'
        ]
      },
      'microondes': {
        name: 'MICRO-ONDES',
        variants: ['léger/lourd'],
        photos: [
          'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&h=200&fit=crop'
        ]
      },
      'petit_electromenager': {
        name: 'PETIT ÉLECTROMÉNAGER',
        variants: ['plaques de cuisson', 'camping gaz', 'robot', 'centrale vapeur', 'cafetière', 'mixeur'],
        photos: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop'
        ]
      }
    }
  },
  'salle_de_bain': {
    name: 'Salle de bain',
    icon: '🚿',
    items: {
      'lave_linge': {
        name: 'LAVE LINGE',
        variants: ['hublot', 'couvercle'],
        photos: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
        ]
      },
      'seche_linge': {
        name: 'SECHE LINGE',
        variants: [],
        photos: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
        ]
      }
    }
  }
};

// Nouvelles catégories A, B, C, D
const ABCD_CATEGORIES = {
  'A': {
    id: 'A',
    name: 'MOBILIER',
    color: 'from-blue-400 to-blue-500',
    icon: '🛏️',
    items: [
      'Literie / Canapés / Fauteuils',
      'Tables et assises',
      'Rangements',
      'Salle de bain / Cuisine',
      'Meubles divers'
    ],
    subcategories: [
      'Literie / Canapés / Fauteuils',
      'Tables et assises',
      'Rangements',
      'Salle de bain / Cuisine',
      'Meubles divers'
    ]
  },
  'B': {
    id: 'B',
    name: 'JARDIN',
    color: 'from-green-400 to-green-500',
    icon: '🚜',
    items: [
      'Mobilier de jardin et contenants',
      'Jardin et extérieur',
      'Bricolage / matériaux / énergie'
    ],
    subcategories: [
      'Mobilier de jardin et contenants',
      'Jardin et extérieur',
      'Bricolage / matériaux / énergie'
    ]
  },
  'C': {
    id: 'C',
    name: 'ELEC',
    color: 'from-yellow-400 to-yellow-500',
    icon: '⚡',
    items: [
      'Électroménager',
      'Électronique/multimédia',
      'Électrique',
      'Chauffage/climatisation/ventilation'
    ],
    subcategories: [
      'Électroménager',
      'Électronique/multimédia',
      'Électrique',
      'Chauffage/climatisation/ventilation'
    ]
  },
  'D': {
    id: 'D',
    name: 'AUTRES',
    color: 'from-purple-400 to-purple-500',
    icon: '🪞',
    items: [
      'Décoration',
      'Accessoires',
      'Instruments',
      'Vaisselle',
      'Objets divers',
      'Encombrants',
      'Cartons et sacs'
    ],
    subcategories: [
      'Décoration',
      'Accessoires',
      'Instruments',
      'Vaisselle',
      'Objets divers',
      'Encombrants',
      'Cartons et sacs'
    ]
  }
};

// Structure hiérarchique complète pour MULTIMEDIA/ELECTRONIQUE/ELECTRIQUE (Admin)
const MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE = {
  id: 'multimedia_electrique',
  name: 'MULTIMEDIA / ELECTRONIQUE / ELECTRIQUE',
  icon: '⚡',
  color: 'from-yellow-400 to-yellow-500',
  categories: {
    'multimedia_electronique': {
      id: 'multimedia_electronique',
      name: 'MULTIMEDIA / ELECTRONIQUE',
      icon: '📺',
      items: [
        { name: 'Télévision/Ecran', variants: ['petit', 'moyen', 'grand', 'écran plat', 'tube cathodique'] },
        { name: 'Hifi/Lecteur', variants: ['ampli', 'lecteur cd', 'lecteur cassette', 'lecteur vinyles', 'box'] },
        { name: 'Console de jeux vidéo', variants: ['PlayStation', 'Xbox', 'Nintendo', 'retro'] },
        { name: 'Enceintes', variants: ['Bluetooth', 'Hi-Fi', 'home cinéma', 'portables'] },
        { name: 'Ordinateur', variants: ['portable', 'PC fixe', 'tout-en-un', 'serveur'] },
        { name: 'Imprimante / scanner', variants: ['jet d\'encre', 'laser', 'multifonction', 'scanner seul'] }
      ]
    },
    'electrique': {
      id: 'electrique',
      name: 'ELECTRIQUE',
      icon: '💡',
      subcategories: {
        'aspirateur': {
          name: 'ASPIRATEUR',
          items: [
            { name: 'Aspirateur traineau', variants: ['avec sac', 'sans sac'] },
            { name: 'Aspirateur balai', variants: ['filaire', 'sans fil'] },
            { name: 'Aspirateur robot', variants: [] },
            { name: 'Aspirateur eau et poussière', variants: [] }
          ]
        },
        'eclairage': {
          name: 'ÉCLAIRAGE',
          items: [
            { name: 'Lampe', variants: ['de table', 'de chevet', 'de bureau'] },
            { name: 'Lampadaire', variants: ['sur pied', 'halogène', 'LED'] },
            { name: 'Luminaire', variants: ['plafonnier', 'suspension', 'applique'] }
          ]
        },
        'chauffe_eau': {
          name: 'CHAUFFE-EAU / CUMULUS',
          items: [
            { name: 'Chauffe-eau électrique', variants: ['50L', '100L', '150L', '200L', '300L'] },
            { name: 'Cumulus', variants: ['petit', 'moyen', 'grand'] }
          ]
        },
        'chauffage_climatisation': {
          name: 'CHAUFFAGE/CLIMATISATION/VENTILATION',
          subcategories: {
            'chaud': {
              name: 'CHAUD',
              items: [
                { name: 'Convecteur', variants: ['mobile', 'fixe'] },
                { name: 'Chauffage bain d\'huile', variants: [] },
                { name: 'Chauffage d\'appoint', variants: ['électrique', 'gaz'] },
                { name: 'Poêle à pétrole', variants: [] },
                { name: 'Poêle à bois', variants: ['à bûches', 'à granulés'] }
              ]
            },
            'froid': {
              name: 'FROID',
              items: [
                { name: 'Climatisation', variants: ['mobile', 'murale', 'partie extérieure'] },
                { name: 'Ventilateur', variants: ['sur pied', 'de table', 'au plafond'] }
              ]
            }
          }
        }
      }
    },
    'electromenager': {
      id: 'electromenager',
      name: 'ÉLECTROMÉNAGER',
      icon: '🏠',
      subcategories: {
        'electromenager_froid': {
          name: 'ÉLECTROMÉNAGER FROID',
          items: [
            { name: 'FRIGO', variants: ['top', '1 porte', 'grand'] },
            { name: 'CONGELATEUR', variants: ['mini', 'coffre simple', 'double coffre', 'vertical', 'armoire professionnelle simple', 'armoire professionnelle double'] },
            { name: 'FRIGO CONGELATEUR', variants: ['combiné standard', 'combiné grand', 'américain', 'armoire frigorifique simple', 'armoire frigorifique double'] }
          ]
        },
        'electromenager_cuisine': {
          name: 'ÉLECTROMÉNAGER CUISINE',
          items: [
            { name: 'GAZINIERE', variants: ['4 feux', '5 feux', '6 feux', 'piano de cuisson'] },
            { name: 'LAVE VAISSELLE', variants: ['compact', 'standard', 'grand format'] },
            { name: 'FOUR', variants: ['encastré', 'four taille micro-ondes', 'mini four'] },
            { name: 'MICRO-ONDES', variants: ['léger', 'lourd'] },
            { name: 'PETIT ÉLECTROMÉNAGER', variants: ['plaques de cuisson', 'camping gaz', 'robot', 'centrale vapeur', 'cafetière', 'mixeur'] }
          ]
        },
        'electromenager_salle_de_bain': {
          name: 'ÉLECTROMÉNAGER SALLE DE BAIN',
          items: [
            { name: 'LAVE LINGE', variants: ['hublot', 'couvercle'] },
            { name: 'SECHE LINGE', variants: ['évacuation', 'condensation', 'pompe à chaleur'] }
          ]
        }
      }
    }
  }
};

// Structure hiérarchique complète pour DIVERS (Admin)
const DIVERS_ADMIN_STRUCTURE = {
  id: 'divers',
  name: 'DIVERS',
  icon: '🎨',
  color: 'from-purple-400 to-purple-500',
  categories: {
    'decoration': {
      id: 'decoration',
      name: 'DÉCORATION',
      icon: '🖼️',
      items: [
        { name: 'Miroir', variants: ['petit', 'moyen', 'grand', 'sur pied'] },
        { name: 'Horloge comtoise', variants: [] },
        { name: 'Lampadaire/ luminaire / lustre', variants: ['lampadaire', 'luminaire', 'lustre', 'applique'] },
        { name: 'Plante en pot', variants: ['petit pot', 'moyen pot', 'grand pot', 'jardinière'] },
        { name: 'Tableau/cadre', variants: ['petit', 'moyen', 'grand', 'encadré', 'toile'] },
        { name: 'Vase / Jarre', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Paravent', variants: ['2 panneaux', '3 panneaux', '4 panneaux'] },
        { name: 'Tapis', variants: ['petit', 'moyen', 'grand', 'tapis de couloir'] },
        { name: 'Porte manteau /portant', variants: ['sur pied', 'mural', 'portant à vêtements'] },
        { name: 'Rideaux', variants: ['voilages', 'occultants', 'stores'] },
        { name: 'Statue/sculpture', variants: ['petite', 'moyenne', 'grande'] }
      ]
    },
    'accessoires': {
      id: 'accessoires',
      name: 'ACCESSOIRES',
      icon: '🎒',
      items: [
        { name: 'Porte-manteaux', variants: ['sur pied', 'mural'] },
        { name: 'Valises / malles', variants: ['petite valise', 'grande valise', 'malle', 'set de valises'] },
        { name: 'Coffre', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Glacière', variants: ['portable', 'électrique'] },
        { name: 'Bébé', variants: ['poussette', 'siège auto', 'lit bébé portable', 'chaise haute'] },
        { name: 'Machines diverses', variants: ['à coudre', 'à écrire', 'à café professionnelle'] },
        { name: 'Machines de sport et accessoires', variants: ['tapis de course', 'banc', 'vélo elliptique', 'rameur', 'grosses machines', 'tatami', 'poids et haltères'] }
      ]
    },
    'objets_divers_encombrants': {
      id: 'objets_divers_encombrants',
      name: 'OBJETS DIVERS ENCOMBRANTS',
      icon: '📦',
      items: [
        { name: 'Coffres-forts', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Pianos', variants: ['droit', 'à queue'] },
        { name: 'Instruments de musique volumineux', variants: ['batterie', 'guitare avec ampli', 'contrebasse', 'harpe'] },
        { name: 'Aquariums', variants: ['petit', 'moyen', 'grand', 'avec meuble'] },
        { name: 'Cages pour animaux', variants: ['petite', 'moyenne', 'grande', 'volière'] },
        { name: 'Objets de sport', variants: ['tapis de course', 'vélo d\'appartement', 'rameur', 'banc de musculation'] },
        { name: 'Jeux de loisirs volumineux', variants: ['baby-foot', 'table de ping-pong', 'billard', 'air hockey'] }
      ]
    },
    'instruments_musique': {
      id: 'instruments_musique',
      name: 'INSTRUMENTS DE MUSIQUE',
      icon: '🎵',
      items: [
        { name: 'Guitare/violon/harpe', variants: ['guitare acoustique', 'guitare électrique', 'violon', 'harpe'] },
        { name: 'Tambour/Batterie', variants: ['djembé', 'batterie complète', 'batterie électronique'], note: 'Préciser le nombre de caissons pour batterie' },
        { name: 'Pianos', variants: ['portatif', 'petit électrique', 'piano droit', 'piano à queue'] },
        { name: 'Cajon', variants: [] }
      ]
    },
    'vaisselle_objets_divers': {
      id: 'vaisselle_objets_divers',
      name: 'VAISSELLE ET OBJETS DIVERS',
      icon: '📋',
      items: [
        { name: 'Carton/sac d\'objets divers', variants: ['petit carton', 'moyen carton', 'grand carton', 'sac'] },
        { name: 'Carton de vaisselle', variants: ['service complet', 'assiettes seulement', 'verres seulement'] },
        { name: 'Cartons/sac outils divers et bricolage', variants: ['boîte à outils', 'carton d\'outils', 'outillage professionnel'] },
        { name: 'Carton/sac de produits ménagers', variants: ['produits d\'entretien', 'lessive', 'petit électroménager'] },
        { name: 'Carton/sac de vêtements', variants: ['vêtements homme', 'vêtements femme', 'vêtements enfant', 'chaussures'] },
        { name: 'Couette/couverture', variants: ['couette simple', 'couette double', 'couverture', 'plaid'] }
      ]
    }
  }
};

// Structure hiérarchique complète pour JARDIN (Admin)
const JARDIN_ADMIN_STRUCTURE = {
  id: 'jardin',
  name: 'JARDIN',
  icon: '🌿',
  color: 'from-green-400 to-green-500',
  categories: {
    'mobilier_jardin_contenants': {
      id: 'mobilier_jardin_contenants',
      name: 'MOBILIER DE JARDIN & CONTENANTS',
      icon: '🪑',
      items: [
        { name: 'Table, table pliante, table de jardin, etabli, desserte, bar', variants: ['table simple', 'table pliante', 'table de jardin', 'etabli', 'desserte', 'bar'], materials: ['bois', 'métal', 'plastique', 'résine'] },
        { name: 'Rangement', variants: ['meuble d\'appoint', 'armoire', 'casier'], materials: ['bois', 'métal', 'plastique', 'résine'] },
        { name: 'Fauteuils, chaises, bancs, balancelle', variants: ['fauteuil', 'chaise', 'banc', 'balancelle'], materials: ['bois', 'métal', 'plastique', 'résine', 'tissu'] },
        { name: 'Salon de jardin', variants: ['2 places', '4 places', '6 places', '8 places'], materials: ['résine', 'bois', 'métal'] },
        { name: 'Transat pliant', variants: ['simple', 'double'] },
        { name: 'Banc coffre', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Malle / coffre de jardin / valise', variants: ['malle', 'coffre de jardin', 'valise'] },
        { name: 'Caisse bouteilles / casiers', variants: ['caisse bouteilles', 'casier plastique', 'casier métal'] },
        { name: 'Poubelle / container / sceau', variants: ['poubelle', 'container', 'sceau'], materials: ['plastique', 'métal'] },
        { name: 'Caddie', variants: [] },
        { name: 'Cuve fioul', variants: ['petite', 'moyenne', 'grande'] }
      ]
    },
    'jardin_exterieur': {
      id: 'jardin_exterieur',
      name: 'JARDIN & EXTÉRIEUR',
      icon: '🌱',
      items: [
        { name: 'Parasol / pied de parasol', variants: ['parasol', 'pied de parasol'] },
        { name: 'Composteur', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Cuve eau de pluie, bidon, fût', variants: ['cuve eau de pluie', 'bidon', 'fût'] },
        { name: 'Tuyau d\'arrosage / Arrosoir', variants: ['tuyau d\'arrosage', 'arrosoir'] },
        { name: 'Jardinières, pots de fleurs, bacs à fleurs', variants: ['jardinière', 'pot de fleurs', 'bac à fleurs'], materials: ['terre cuite', 'plastique', 'béton', 'bois'] },
        { name: 'Séchoir / étendoir', variants: ['séchoir', 'étendoir'] },
        { name: 'Portail / portillon', variants: ['portail', 'portillon'], materials: ['bois', 'métal', 'PVC'] },
        { name: 'Pergola', variants: ['bois', 'métal', 'aluminium'] },
        { name: 'Store/volets', variants: ['store', 'volets'], materials: ['bois', 'métal', 'PVC'] },
        { name: 'Abri de jardin', variants: ['petit', 'moyen', 'grand'], note: 'Démontage inclus', materials: ['bois', 'métal', 'PVC'] },
        { name: 'Appareils thermiques et électriques', variants: ['motoculteur', 'tondeuse à gazon', 'débroussailleuse', 'taille haie'] },
        { name: 'Outils divers', variants: ['pelle', 'râteau', 'bêche', 'serfouette', 'sécateur'] },
        { name: 'Barbecue', variants: ['gaz', 'charbon', 'électrique'], materials: ['métal', 'fonte'] },
        { name: 'Carrelage/tuiles/pierre/parpaing/dalles', variants: ['carrelage', 'tuiles', 'pierre', 'parpaing', 'dalles'] },
        { name: 'Brouette', variants: ['simple', 'double'] },
        { name: 'Rouleau gazon', variants: [] },
        { name: 'Vélo/solex/mobylette/scooter/pocket bike', variants: ['vélo', 'solex', 'mobylette', 'scooter', 'pocket bike'] }
      ]
    },
    'bricolage_materiaux_energie': {
      id: 'bricolage_materiaux_energie',
      name: 'BRICOLAGE, MATÉRIAUX & ÉNERGIE',
      icon: '🔨',
      items: [
        { name: 'Escabeau, échelle, marchepied', variants: ['escabeau', 'échelle', 'marchepied'], materials: ['bois', 'métal', 'aluminium'] },
        { name: 'Palettes', variants: ['petite', 'moyenne', 'grande', 'européenne'] },
        { name: 'Barres de fer', variants: ['courtes', 'longues'] },
        { name: 'Étai', variants: [] },
        { name: 'Ciment / sacs de ciment', variants: ['sac 25kg', 'sac 35kg', 'ciment en vrac'] },
        { name: 'Contenants gravats', variants: ['sacs'] },
        { name: 'Produits peinture, bidons de peinture', variants: ['pot peinture', 'bidon peinture'] },
        { name: 'Produits inflammables', variants: [], note: 'Manipulation spéciale requise' },
        { name: 'Moteur', variants: ['petit moteur', 'gros moteur'] },
        { name: 'Portes, fenêtres, porte-fenêtre', variants: ['porte', 'fenêtre', 'porte-fenêtre'], materials: ['bois', 'PVC', 'aluminium'] },
        { name: 'Baies vitrées', variants: ['simple', 'double', 'triple'] },
        { name: 'Touret', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Remorque', variants: ['petite', 'moyenne', 'grande'] },
        { name: 'Pneus / roues', variants: ['pneus voiture', 'pneus camion', 'roues complètes'] },
        { name: 'Vélo', variants: ['vélo adulte', 'vélo enfant', 'VTT', 'vélo électrique'] },
        { name: 'Solex / mobylette', variants: ['solex', 'mobylette'] },
        { name: 'Bouteille de gaz', variants: ['petite', 'moyenne', 'grande'] },
        { name: 'Panneau solaire', variants: ['petit', 'moyen', 'grand'] },
        { name: 'Batterie', variants: ['voiture', 'camion', 'marine'] },
        { name: 'Cumulus', variants: ['50L', '100L', '150L', '200L', '300L'], note: 'Déjà démonté' },
        { name: 'Grosses machines', variants: ['bétonnière', 'compresseur', 'raboteuse', 'groupe électrogène'] },
        { name: 'Panneau OSB, plaque Ba 13', variants: ['panneau OSB', 'plaque Ba 13 (placo)'] }
      ]
    }
  }
};

// Fonction pour connecter les structures admin aux catégories ABCD et transformer les variantes en articles distincts
const getArticlesFromAdminStructures = () => {
  const allArticles = [];

  // Fonction pour transformer un item avec ses variantes en articles distincts
  const expandItemVariants = (item, categoryId, basePrice = 25) => {
    const articles = [];
    
    if (item.variants && item.variants.length > 0) {
      // Créer un article distinct pour chaque variante
      item.variants.forEach(variant => {
        articles.push({
          id: `${categoryId}_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${variant.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: `${item.name} ${variant}`,
          base_name: item.name,
          variant: variant,
          category_id: categoryId,
          base_price: basePrice,
          materials: item.materials || [],
          options: item.options || [],
          note: item.note || '',
          requires_dismantling: false
        });
      });
    } else {
      // Créer un article simple sans variante
      articles.push({
        id: `${categoryId}_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: item.name,
        base_name: item.name,
        variant: null,
        category_id: categoryId,
        base_price: basePrice,
        materials: item.materials || [],
        options: item.options || [],
        note: item.note || '',
        requires_dismantling: false
      });
    }
    
    return articles;
  };

  // Fonction récursive pour parcourir les structures hiérarchiques
  const processCategory = (category, categoryId, basePrice = 25) => {
    if (category.items) {
      // Si la catégorie a des items directs
      category.items.forEach(item => {
        allArticles.push(...expandItemVariants(item, categoryId, basePrice));
      });
    }

    if (category.subcategories) {
      // Si la catégorie a des sous-catégories, les traiter récursivement
      Object.entries(category.subcategories).forEach(([subKey, subcategory]) => {
        processCategory(subcategory, categoryId, basePrice);
      });
    }

    if (category.categories) {
      // Pour les structures avec categories (comme MOBILIER_ADMIN_STRUCTURE)
      Object.entries(category.categories).forEach(([catKey, cat]) => {
        processCategory(cat, categoryId, basePrice);
      });
    }
  };

  // Traiter MOBILIER_ADMIN_STRUCTURE -> Catégorie A
  processCategory(MOBILIER_ADMIN_STRUCTURE, 'mobilier', 30);

  // Traiter JARDIN_ADMIN_STRUCTURE -> Catégorie B
  processCategory(JARDIN_ADMIN_STRUCTURE, 'exterieur_jardin', 25);

  // Traiter MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE -> Catégorie C
  processCategory(MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE, 'electromenager_gros', 35);

  // Traiter DIVERS_ADMIN_STRUCTURE -> Catégorie D
  processCategory(DIVERS_ADMIN_STRUCTURE, 'divers', 20);

  return allArticles;
};

// Fonction pour mapper les catégories ABCD aux structures admin
const getABCDCategoryArticles = (abcdCategoryId, subcategoryName = null) => {
  const adminArticles = getArticlesFromAdminStructures();
  
  // Mapping des catégories ABCD vers les category_id backend
  const categoryMapping = {
    'A': ['mobilier', 'lits_couchage', 'assises', 'tables'], // MOBILIER
    'B': ['exterieur_jardin'], // JARDIN
    'C': ['electromenager_gros', 'multimedia_electrique'], // ELEC
    'D': ['divers'] // AUTRES
  };

  const relevantCategoryIds = categoryMapping[abcdCategoryId] || [];
  
  // Filtrer les articles selon la catégorie ABCD
  let filteredArticles = adminArticles.filter(article => 
    relevantCategoryIds.includes(article.category_id)
  );

  // Si une sous-catégorie spécifique est demandée, filtrer davantage
  if (subcategoryName) {
    // Mapping plus fin basé sur les noms de sous-catégories
    const subcategoryMapping = {
      'Literie / Canapés / Fauteuils': (article) => 
        article.base_name.toLowerCase().includes('lit') || 
        article.base_name.toLowerCase().includes('matelas') ||
        article.base_name.toLowerCase().includes('sommier') ||
        article.base_name.toLowerCase().includes('canapé') ||
        article.base_name.toLowerCase().includes('fauteuil'),
      'Tables et assises': (article) => 
        article.base_name.toLowerCase().includes('table') ||
        article.base_name.toLowerCase().includes('chaise') ||
        article.base_name.toLowerCase().includes('banc'),
      'Rangements': (article) => 
        article.base_name.toLowerCase().includes('armoire') ||
        article.base_name.toLowerCase().includes('commode') ||
        article.base_name.toLowerCase().includes('rangement') ||
        article.base_name.toLowerCase().includes('bibliothèque'),
      'Mobilier de jardin et contenants': (article) => 
        article.base_name.toLowerCase().includes('jardin') ||
        article.base_name.toLowerCase().includes('salon de jardin') ||
        article.base_name.toLowerCase().includes('transat'),
      'Électroménager': (article) => 
        article.base_name.toLowerCase().includes('frigo') ||
        article.base_name.toLowerCase().includes('four') ||
        article.base_name.toLowerCase().includes('lave'),
      'Décoration': (article) => 
        article.base_name.toLowerCase().includes('miroir') ||
        article.base_name.toLowerCase().includes('tableau') ||
        article.base_name.toLowerCase().includes('vase')
    };

    const filterFunction = subcategoryMapping[subcategoryName];
    if (filterFunction) {
      filteredArticles = filteredArticles.filter(filterFunction);
    }
  }

  return filteredArticles;
};

// Isolated component for custom item input to prevent re-renders
const CustomItemInput = React.memo(({ onAddCustomItem }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = React.useRef(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddCustomItem(inputValue.trim());
      setInputValue('');
      // Keep focus after clearing - with null check inside setTimeout
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [inputValue, onAddCustomItem]);

  const handleInputChange = useCallback((e) => {
    e.stopPropagation();
    setInputValue(e.target.value);
  }, []);

  const handleButtonClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputValue.trim()) {
      onAddCustomItem(inputValue.trim());
      setInputValue('');
      // Keep focus after clearing - with null check inside setTimeout
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [inputValue, onAddCustomItem]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Mon objet n'est pas dans la liste</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Décrivez votre objet (ex: Table ronde en marbre 1m50)"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            onClick={handleButtonClick}
            type="button"
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
  );
});

// Isolated selection item component
const SelectionItem = React.memo(({ item, index, onUpdateQuantity, onRemove, onToggleDismantling }) => {
  const handleQuantityDecrease = useCallback(() => {
    onUpdateQuantity(index, item.quantity - 1);
  }, [index, item.quantity, onUpdateQuantity]);

  const handleQuantityIncrease = useCallback(() => {
    onUpdateQuantity(index, item.quantity + 1);
  }, [index, item.quantity, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  const handleToggle = useCallback(() => {
    onToggleDismantling(index);
  }, [index, onToggleDismantling]);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">{item.article_name}</h4>
        <Button
          onClick={handleRemove}
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
            onClick={handleQuantityDecrease}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium">{item.quantity}</span>
          <Button
            onClick={handleQuantityIncrease}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {item.requires_dismantling && (
        <div className="mt-2 flex items-center space-x-2">
          <Checkbox
            id={`dismantled-${index}`}
            checked={item.is_dismantled}
            onCheckedChange={handleToggle}
          />
          <label htmlFor={`dismantled-${index}`} className="text-xs text-gray-600">
            Déjà démonté/débranché
          </label>
        </div>
      )}
    </div>
  );
});

// Isolated custom item component
const CustomItemCard = React.memo(({ item, index, onRemove }) => {
  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <div className="border rounded-lg p-3 border-orange-200 bg-orange-50">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">{item.description}</h4>
        <Button
          onClick={handleRemove}
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
  );
});

// Ultra-isolated form input component with ref stability
const OptimizedInput = React.memo(React.forwardRef(({ value, onChange, ...props }, ref) => {
  const internalRef = React.useRef(null);
  const finalRef = ref || internalRef;
  
  const handleChange = useCallback((e) => {
    e.stopPropagation();
    // Check if onChange expects the event or just the value
    if (typeof onChange === 'function') {
      // If onChange expects an event (like standard React onChange)
      if (onChange.length === 1 && e && e.target) {
        onChange(e);
      } else {
        // If onChange expects just the value (like our optimized handlers)
        onChange(e.target.value);
      }
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleFocus = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleBlur = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <Input 
      ref={finalRef}
      value={value} 
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props} 
    />
  );
}));

// Ultra-isolated textarea component with ref stability
const OptimizedTextarea = React.memo(React.forwardRef(({ value, onChange, ...props }, ref) => {
  const internalRef = React.useRef(null);
  const finalRef = ref || internalRef;
  
  const handleChange = useCallback((e) => {
    e.stopPropagation();
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleFocus = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleBlur = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <Textarea 
      ref={finalRef}
      value={value} 
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props} 
    />
  );
}));

// Electromenager Type Selection Page - moved outside App to prevent re-creation
const ElectromenagerTypePage = ({ onGoBack, onSelectType }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onGoBack}
          variant="outline"
          className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux catégories ELEC
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          <div className="text-4xl mr-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>⚡</div>
          <div>
            <div className="text-lg font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>ÉLECTROMÉNAGER</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Choisissez le type d'électroménager
        </h2>
      </div>

      {/* Electromenager Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {Object.entries(ELECTROMENAGER_STRUCTURE).map(([key, type]) => (
          <Card
            key={key}
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-300"
            onClick={() => onSelectType(key, type)}
          >
            <CardContent className="p-6 text-center bg-gradient-to-r from-yellow-400 to-yellow-500 text-white h-40 flex flex-col justify-center" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              <div className="text-4xl mb-3" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{type.icon}</div>
              <h3 className="text-lg font-bold mb-2 leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                {type.name}
              </h3>
              <div className="text-sm opacity-90 font-medium" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
                Voir les objets →
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Electromenager Items Page - moved outside App to prevent re-creation
const ElectromenagerItemsPage = ({ selectedType, onGoBack, onSelectItem }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onGoBack}
          variant="outline"
          className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux types
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          <div className="text-4xl mr-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{selectedType.icon}</div>
          <div>
            <div className="text-lg font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>ÉLECTROMÉNAGER {selectedType.name.toUpperCase()}</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Choisissez votre appareil
        </h2>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Object.entries(selectedType.items).map(([key, item]) => (
          <Card
            key={key}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-orange-300"
            onClick={() => onSelectItem(key, item)}
          >
            <CardContent className="p-6 text-center bg-gradient-to-r from-yellow-400 to-yellow-500 text-white h-32 flex flex-col justify-center" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              <h3 className="text-sm font-bold mb-2 leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                {item.name}
              </h3>
              {item.variants.length > 0 && (
                <div className="text-xs opacity-90" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
                  {item.variants.length} variante{item.variants.length > 1 ? 's' : ''}
                </div>
              )}
              <div className="text-xs opacity-90 font-medium mt-1" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
                Voir les photos →
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Electromenager Photos Page - moved outside App to prevent re-creation
const ElectromenagerPhotosPage = ({ selectedType, selectedItem, onGoBack, onAddToSelection }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onGoBack}
          variant="outline"
          className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux objets
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          <div className="text-4xl mr-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{selectedType.icon}</div>
          <div>
            <div className="text-lg font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
              {selectedItem.name}
            </div>
            <div className="text-sm opacity-90" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
              {selectedType.name}
            </div>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
        {selectedItem.photos.map((photo, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative">
              <img 
                src={photo} 
                alt={`${selectedItem.name} ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white font-bold text-sm">
                  {selectedItem.name}
                  {selectedItem.variants.length > 0 && index < selectedItem.variants.length && (
                    <span className="block text-xs opacity-80">
                      {selectedItem.variants[index]}
                    </span>
                  )}
                </h3>
              </div>
            </div>
            <CardContent className="p-4">
              <Button
                onClick={() => onAddToSelection(selectedItem, index)}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Ajouter à ma sélection
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Variants List if any */}
      {selectedItem.variants.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Variantes disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedItem.variants.map((variant, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded text-sm text-center">
                    {variant}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  </div>
);

// Quote Form Page component - moved outside App to prevent re-creation on re-renders
const QuoteFormPage = ({ 
  quoteForm, 
  onUpdateQuoteForm,
  selectedItems, 
  customItems, 
  zones, 
  availableSlots, 
  isPhotoQuote,
  onGoBack, 
  onViewQuote,
  onLoadAvailableSlots
}) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Form */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={onGoBack}
              variant="outline"
              className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>

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
                  onChange={(e) => onUpdateQuoteForm('client_name', e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={quoteForm.client_email}
                  onChange={(e) => onUpdateQuoteForm('client_email', e.target.value)}
                />
              </div>
              
              <Input
                type="tel"
                placeholder="Téléphone *"
                value={quoteForm.client_phone}
                onChange={(e) => onUpdateQuoteForm('client_phone', e.target.value)}
              />
              
              <Input
                placeholder="Adresse complète *"
                value={quoteForm.address}
                onChange={(e) => onUpdateQuoteForm('address', e.target.value)}
              />

              {/* Parking */}
              <div>
                <label className="block text-sm font-medium mb-2">Stationnement :</label>
                <div className="grid grid-cols-3 gap-4">
                  {['facile', 'délicat', 'difficile'].map((option) => (
                    <Button
                      key={option}
                      onClick={() => onUpdateQuoteForm('parking', option)}
                      variant={quoteForm.parking === option ? "default" : "outline"}
                      className={quoteForm.parking === option ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Floor and Elevator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Étage :</label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={quoteForm.floor}
                    onChange={(e) => onUpdateQuoteForm('floor', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 1.5 pour un demi-étage"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => onUpdateQuoteForm('elevator', !quoteForm.elevator)}
                    variant={quoteForm.elevator ? "default" : "outline"}
                    className={quoteForm.elevator ? "bg-orange-500 hover:bg-orange-600 w-full" : "w-full"}
                  >
                    {quoteForm.elevator ? <Check className="mr-2 h-4 w-4" /> : null}
                    Ascenseur
                  </Button>
                </div>
              </div>

              {/* Elevator Size Selection */}
              {quoteForm.elevator && (
                <div>
                  <label className="block text-sm font-medium mb-2">Taille de l'ascenseur :</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['petit', 'moyen', 'grand'].map((size) => (
                      <Button
                        key={size}
                        onClick={() => onUpdateQuoteForm('elevator_size', size)}
                        variant={quoteForm.elevator_size === size ? "default" : "outline"}
                        className={quoteForm.elevator_size === size ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Zone Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Zone d'intervention :</label>
                <Select 
                  value={quoteForm.zone} 
                  onValueChange={(value) => onUpdateQuoteForm('zone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner votre zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(zones).map(([key, zone]) => (
                      <SelectItem key={key} value={key}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Détails importants (accès, contraintes particulières, marches, chemins divers...)"
                value={quoteForm.additional_info}
                onChange={(e) => onUpdateQuoteForm('additional_info', e.target.value)}
                rows={3}
              />

              {/* Intervention Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Type d'intervention :</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => onUpdateQuoteForm('urgent', false)}
                    variant={!quoteForm.urgent ? "default" : "outline"}
                    className={!quoteForm.urgent ? "bg-teal-500 hover:bg-teal-600" : ""}
                  >
                    Intervention standard
                  </Button>
                  <Button
                    onClick={() => onUpdateQuoteForm('urgent', true)}
                    variant={quoteForm.urgent ? "destructive" : "outline"}
                    className="w-full"
                  >
                    🚨 Intervention d'urgence
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Date d'intervention souhaitée :</label>
                <Input
                  type="date"
                  value={quoteForm.preferred_date}
                  onChange={(e) => {
                    onUpdateQuoteForm('preferred_date', e.target.value);
                    if (e.target.value && quoteForm.zone) {
                      onLoadAvailableSlots(e.target.value, quoteForm.zone);
                    }
                  }}
                />
                {!isPhotoQuote && (
                  <p className="text-xs text-gray-600 mt-1">
                    Disponibilités : Mardi, Mercredi, Jeudi de 7h à 20h
                  </p>
                )}
              </div>

              {/* Time Slots */}
              {availableSlots.length > 0 && !isPhotoQuote && (
                <div>
                  <label className="block text-sm font-medium mb-2">Créneau horaire :</label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time_slot}
                        onClick={() => onUpdateQuoteForm('preferred_time_slot', slot.time_slot)}
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
            </CardContent>
          </Card>
        </div>

        {/* Right side - Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Articles sélectionnés :</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={`summary-${item.article_id}-${index}`} className="text-sm p-2 bg-gray-100 rounded">
                      • {item.article_name} {item.quantity > 1 && `(x${item.quantity})`}
                    </div>
                  ))}
                  
                  {customItems.map((item, index) => (
                    <div key={`summary-custom-${item.description}-${index}`} className="text-sm p-2 bg-orange-100 rounded">
                      • {item.description} <span className="text-orange-600">(Supplément à confirmer)</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button
                  onClick={onViewQuote}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3"
                  disabled={!quoteForm.client_name || !quoteForm.client_email || !quoteForm.client_phone || !quoteForm.address || !quoteForm.parking}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Voir mon devis et prendre rendez-vous en ligne
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// Quote Display Page component
const QuoteDisplayPage = ({ quoteForm, selectedItems, customItems, calculateTotal, onGoBack, onAcceptQuote }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        onClick={onGoBack}
        variant="outline"
        className="mb-8 bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux informations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Votre Devis Personnalisé</CardTitle>
          <p className="text-center text-gray-600">Allo Débarras Express</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Informations client</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nom :</strong> {quoteForm.client_name}</div>
              <div><strong>Email :</strong> {quoteForm.client_email}</div>
              <div><strong>Téléphone :</strong> {quoteForm.client_phone}</div>
              <div><strong>Adresse :</strong> {quoteForm.address}</div>
            </div>
          </div>

          {/* Intervention Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Détails de l'intervention</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Stationnement :</strong> {quoteForm.parking}</div>
              <div><strong>Étage :</strong> {quoteForm.floor}</div>
              <div><strong>Ascenseur :</strong> {quoteForm.elevator ? `Oui (${quoteForm.elevator_size})` : 'Non'}</div>
              <div><strong>Zone :</strong> {quoteForm.zone}</div>
              <div><strong>Type :</strong> {quoteForm.urgent ? '🚨 Urgence' : 'Standard'}</div>
              <div><strong>Date souhaitée :</strong> {quoteForm.preferred_date}</div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Articles à évacuer</h3>
            <div className="space-y-2">
              {selectedItems.map((item, index) => (
                <div key={`display-${item.article_id}-${index}`} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.article_name} {item.material && `(${item.material})`}</span>
                  <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
              
              {customItems.map((item, index) => (
                <div key={`display-custom-${item.description}-${index}`} className="flex justify-between text-sm text-orange-600">
                  <span>+ {item.description}</span>
                  <span className="font-medium">Sur devis</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total estimé :</span>
              <span className="text-orange-600">{calculateTotal()}€</span>
            </div>
            {customItems.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                + supplément pour objets personnalisés à confirmer
              </p>
            )}
            {quoteForm.urgent && (
              <p className="text-sm text-red-600 mt-1">
                + supplément urgence inclus
              </p>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={onAcceptQuote}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 text-lg"
          >
            <Calendar className="mr-2 h-6 w-6" />
            J'accepte le devis et je prends rendez-vous directement en ligne
          </Button>

          {/* Additional Info */}
          {quoteForm.additional_info && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Informations complémentaires</h3>
              <p className="text-sm">{quoteForm.additional_info}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

// Modern Admin Categories Page - moved outside App to prevent re-creation
// Admin Navigation Dropdown Component
const AdminNavigationDropdown = ({ currentStep, onStepChange }) => {
  const adminSections = [
    { 
      value: 'admin-categories', 
      label: '🛏️ Mobilier', 
      description: 'Literie, Tables, Canapés, Rangements'
    },
    { 
      value: 'admin-multimedia-electrique', 
      label: '⚡ Multimedia/Électrique', 
      description: 'TV, Électroménager, Chauffage'
    },
    { 
      value: 'admin-divers', 
      label: '🎨 Divers', 
      description: 'Décoration, Accessoires, Instruments'
    },
    { 
      value: 'admin-jardin', 
      label: '🌿 Jardin', 
      description: 'Mobilier jardin, Outils, Bricolage'
    }
  ];

  const getCurrentLabel = () => {
    const current = adminSections.find(section => section.value === currentStep);
    return current ? current.label : 'Sélectionner une section';
  };

  return (
    <Select value={currentStep} onValueChange={onStepChange}>
      <SelectTrigger className="w-80 bg-white border-2 border-teal-200 hover:border-teal-300">
        <SelectValue>
          <span className="font-medium">{getCurrentLabel()}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-80">
        {adminSections.map((section) => (
          <SelectItem key={section.value} value={section.value} className="py-3">
            <div className="flex flex-col">
              <span className="font-medium">{section.label}</span>
              <span className="text-xs text-gray-500 mt-1">{section.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const ModernAdminCategoriesPage = ({ onGoBack, createArticle, updateArticle, deleteArticle, adminAuth, setCurrentStep, setIsAdminMode, allArticles, loadAdminData }) => {
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const renderMobilierStructure = () => {
    if (!selectedMainCategory) {
      // Show main categories
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(MOBILIER_ADMIN_STRUCTURE.categories).map(([key, category]) => (
            <Card
              key={key}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedMainCategory(key)}
            >
              <CardContent className={`p-6 text-center bg-gradient-to-r ${MOBILIER_ADMIN_STRUCTURE.color} text-white`}>
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <div className="text-sm opacity-90">
                  {category.subcategories ? 
                    `${Object.keys(category.subcategories).length} sous-catégories` :
                    `${category.items?.length || 0} articles`
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const category = MOBILIER_ADMIN_STRUCTURE.categories[selectedMainCategory];
    
    if (category.subcategories && !selectedSubCategory) {
      // Show subcategories
      return (
        <div>
          <div className="mb-6">
            <Button
              onClick={() => setSelectedMainCategory(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories principales
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(category.subcategories).map(([key, subcategory]) => (
              <Card
                key={key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedSubCategory(key)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2">{subcategory.name}</h3>
                  <div className="text-sm text-gray-600">
                    {subcategory.items?.length || 0} articles
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Show items
    let items = [];
    let categoryName = '';

    if (selectedSubCategory) {
      items = category.subcategories[selectedSubCategory].items;
      categoryName = category.subcategories[selectedSubCategory].name;
    } else {
      items = category.items;
      categoryName = category.name;
    }

    return (
      <div>
        <div className="mb-6">
          <Button
            onClick={() => {
              if (selectedSubCategory) {
                setSelectedSubCategory(null);
              } else {
                setSelectedMainCategory(null);
              }
            }}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
        </div>
        
        <div className="space-y-4">
          {items?.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                    
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Variantes: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variants.map((variant, vIndex) => (
                            <span key={vIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {variant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.materials && item.materials.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Matériaux: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.materials.map((material, mIndex) => (
                            <span key={mIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.options && item.options.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Options: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.options.map((option, oIndex) => (
                            <span key={oIndex} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {item.note}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem({...item, index, categoryKey: selectedMainCategory, subCategoryKey: selectedSubCategory})}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
                          alert('Article supprimé ! (Cette fonctionnalité sera connectée à la base de données)');
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-300"
                onClick={() => setEditingItem({
                  name: '',
                  materials: [],
                  variants: [],
                  options: [],
                  note: '',
                  categoryKey: selectedMainCategory,
                  subCategoryKey: selectedSubCategory
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un nouvel article
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Administration</h1>
            <AdminNavigationDropdown 
              currentStep='admin-categories'
              onStepChange={setCurrentStep} 
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Exporter structure
            </Button>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsAdminMode(false);
                setCurrentStep('home');
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Title - Compact Version */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white mb-4">
            <div className="text-2xl mr-3">🛏️</div>
            <div>
              <div className="text-base font-bold">ADMINISTRATION MOBILIER</div>
              <div className="text-xs opacity-90">Gestion de l'arborescence complète</div>
            </div>
          </div>
        </div>

        {/* Structure Navigation */}
        {renderMobilierStructure()}

        {/* Edit/Add Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingItem.name ? 'Modifier l\'article' : 'Nouvel article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nom de l'article
                    </label>
                    <Input
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nom de l'article"
                      className="w-full"
                    />
                  </div>
                  
                  {editingItem.materials !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Matériaux (séparés par des virgules)
                      </label>
                      <Input
                        value={editingItem.materials?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                        }))}
                        placeholder="Bois, Métal, Plastique..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {editingItem.variants !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Variantes (séparées par des virgules)
                      </label>
                      <Input
                        value={editingItem.variants?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          variants: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                        }))}
                        placeholder="Petit, Moyen, Grand..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {editingItem.options !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Options (séparées par des virgules)
                      </label>
                      <Input
                        value={editingItem.options?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                        }))}
                        placeholder="+ bureau, + tiroirs..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Note (optionnelle)
                    </label>
                    <Textarea
                      value={editingItem.note || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, note: e.target.value}))}
                      placeholder="Note ou description supplémentaire..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="outline"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Convert static item data to proper article format and save
                        const articleData = {
                          name: editingItem.name,
                          category_id: 'lits_couchage', // Correct category for mobilier
                          base_price: 0,
                          materials: editingItem.materials || [],
                          description: editingItem.note || '',
                          requires_dismantling: false
                        };
                        
                        await createArticle(articleData);
                        await loadAdminData();
                        setEditingItem(null);
                        alert('Article ajouté avec succès !');
                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de l\'ajout de l\'article');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernAdminMultimediaElectriqueePage = ({ onGoBack, createArticle, updateArticle, deleteArticle, adminAuth, setCurrentStep, setIsAdminMode, loadAdminData }) => {
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const renderMultimediaElectriqueStructure = () => {
    if (!selectedMainCategory) {
      // Show main categories
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE.categories).map(([key, category]) => (
            <Card
              key={key}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedMainCategory(key)}
            >
              <CardContent className={`p-6 text-center bg-gradient-to-r ${MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE.color} text-white`}>
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <div className="text-sm opacity-90">
                  {category.subcategories ? 
                    `${Object.keys(category.subcategories).length} sous-catégories` :
                    `${category.items?.length || 0} articles`
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const category = MULTIMEDIA_ELECTRIQUE_ADMIN_STRUCTURE.categories[selectedMainCategory];
    
    if (category.subcategories && !selectedSubCategory) {
      // Show subcategories
      return (
        <div>
          <div className="mb-6">
            <Button
              onClick={() => setSelectedMainCategory(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories principales
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(category.subcategories).map(([key, subcategory]) => (
              <Card
                key={key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedSubCategory(key)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2">{subcategory.name}</h3>
                  <div className="text-sm text-gray-600">
                    {subcategory.subcategories ? 
                      `${Object.keys(subcategory.subcategories).length} sous-catégories` :
                      `${subcategory.items?.length || 0} articles`
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Handle deep subcategories (like CHAUD/FROID in chauffage_climatisation)
    if (selectedSubCategory && category.subcategories[selectedSubCategory]?.subcategories && !selectedSubSubCategory) {
      const subcategory = category.subcategories[selectedSubCategory];
      return (
        <div>
          <div className="mb-6">
            <Button
              onClick={() => setSelectedSubCategory(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux sous-catégories
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">{subcategory.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subcategory.subcategories).map(([key, subsubcategory]) => (
              <Card
                key={key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedSubSubCategory(key)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2">{subsubcategory.name}</h3>
                  <div className="text-sm text-gray-600">
                    {subsubcategory.items?.length || 0} articles
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Show items
    let items = [];
    let categoryName = '';

    if (selectedSubSubCategory) {
      items = category.subcategories[selectedSubCategory].subcategories[selectedSubSubCategory].items;
      categoryName = category.subcategories[selectedSubCategory].subcategories[selectedSubSubCategory].name;
    } else if (selectedSubCategory) {
      items = category.subcategories[selectedSubCategory].items;
      categoryName = category.subcategories[selectedSubCategory].name;
    } else {
      items = category.items;
      categoryName = category.name;
    }

    return (
      <div>
        <div className="mb-6">
          <Button
            onClick={() => {
              if (selectedSubSubCategory) {
                setSelectedSubSubCategory(null);
              } else if (selectedSubCategory) {
                setSelectedSubCategory(null);
              } else {
                setSelectedMainCategory(null);
              }
            }}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
        </div>
        
        <div className="space-y-4">
          {items?.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                    
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Variantes: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variants.map((variant, vIndex) => (
                            <span key={vIndex} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              {variant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.materials && item.materials.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Matériaux: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.materials.map((material, mIndex) => (
                            <span key={mIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.options && item.options.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Options: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.options.map((option, oIndex) => (
                            <span key={oIndex} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {item.note}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem({...item, index, categoryKey: selectedMainCategory, subCategoryKey: selectedSubCategory, subSubCategoryKey: selectedSubSubCategory})}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
                          alert('Article supprimé ! (Cette fonctionnalité sera connectée à la base de données)');
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <Button 
                variant="outline" 
                className="text-yellow-600 border-yellow-300"
                onClick={() => setEditingItem({
                  name: '',
                  materials: [],
                  variants: [],
                  options: [],
                  note: '',
                  categoryKey: selectedMainCategory,
                  subCategoryKey: selectedSubCategory,
                  subSubCategoryKey: selectedSubSubCategory
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un nouvel article
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Administration</h1>
            <AdminNavigationDropdown 
              currentStep='admin-multimedia-electrique'
              onStepChange={setCurrentStep} 
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Exporter structure
            </Button>
            <Button 
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => {
                setIsAdminMode(false);
                setCurrentStep('home');
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Title - Compact Version */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white mb-4">
            <div className="text-2xl mr-3">⚡</div>
            <div>
              <div className="text-base font-bold">ADMINISTRATION MULTIMEDIA/ÉLECTRONIQUE/ÉLECTRIQUE</div>
              <div className="text-xs opacity-90">Gestion de l'arborescence complète</div>
            </div>
          </div>
        </div>

        {/* Structure Navigation */}
        {renderMultimediaElectriqueStructure()}

        {/* Edit/Add Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingItem.name ? 'Modifier l\'article' : 'Nouvel article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nom de l'article
                    </label>
                    <Input
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nom de l'article"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Variantes (séparées par des virgules)
                    </label>
                    <Input
                      value={editingItem.variants?.join(', ') || ''}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev, 
                        variants: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                      }))}
                      placeholder="Petit, Moyen, Grand..."
                      className="w-full"
                    />
                  </div>
                  
                  {editingItem.materials !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Matériaux (séparés par des virgules)
                      </label>
                      <Input
                        value={editingItem.materials?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                        }))}
                        placeholder="Plastique, Métal, Verre..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {editingItem.options !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Options (séparées par des virgules)
                      </label>
                      <Input
                        value={editingItem.options?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                        }))}
                        placeholder="Option 1, Option 2..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Note (optionnelle)
                    </label>
                    <Textarea
                      value={editingItem.note || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, note: e.target.value}))}
                      placeholder="Note ou description supplémentaire..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="outline"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Convert static item data to proper article format and save
                        const articleData = {
                          name: editingItem.name,
                          category_id: 'exterieur_jardin', // Valid category
                          base_price: 0, // Default price
                          materials: editingItem.materials || [],
                          description: editingItem.note || '',
                          requires_dismantling: false
                        };
                        
                        await createArticle(articleData);
                        await loadAdminData(); // Refresh the article list
                        setEditingItem(null);
                        alert('Article ajouté avec succès !');
                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de l\'ajout de l\'article');
                      }
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernAdminDiversPage = ({ onGoBack, createArticle, updateArticle, deleteArticle, adminAuth, setCurrentStep, setIsAdminMode, loadAdminData }) => {
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const renderDiversStructure = () => {
    if (!selectedMainCategory) {
      // Show main categories
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(DIVERS_ADMIN_STRUCTURE.categories).map(([key, category]) => (
            <Card
              key={key}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedMainCategory(key)}
            >
              <CardContent className={`p-6 text-center bg-gradient-to-r ${DIVERS_ADMIN_STRUCTURE.color} text-white`}>
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <div className="text-sm opacity-90">
                  {category.items?.length || 0} articles
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Show items
    const category = DIVERS_ADMIN_STRUCTURE.categories[selectedMainCategory];
    const items = category.items;
    const categoryName = category.name;

    return (
      <div>
        <div className="mb-6">
          <Button
            onClick={() => setSelectedMainCategory(null)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux catégories principales
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
        </div>
        
        <div className="space-y-4">
          {items?.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                    
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Variantes: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variants.map((variant, vIndex) => (
                            <span key={vIndex} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              {variant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.materials && item.materials.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Matériaux: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.materials.map((material, mIndex) => (
                            <span key={mIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.options && item.options.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Options: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.options.map((option, oIndex) => (
                            <span key={oIndex} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {item.note}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem({...item, index, categoryKey: selectedMainCategory})}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
                          alert('Article supprimé ! (Cette fonctionnalité sera connectée à la base de données)');
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <Button 
                variant="outline" 
                className="text-purple-600 border-purple-300"
                onClick={() => setEditingItem({
                  name: '',
                  materials: [],
                  variants: [],
                  options: [],
                  note: '',
                  categoryKey: selectedMainCategory
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un nouvel article
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Administration</h1>
            <AdminNavigationDropdown 
              currentStep='admin-divers'
              onStepChange={setCurrentStep} 
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Exporter structure
            </Button>
            <Button 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setIsAdminMode(false);
                setCurrentStep('home');
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Title - Compact Version */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 text-white mb-4">
            <div className="text-2xl mr-3">🎨</div>
            <div>
              <div className="text-base font-bold">ADMINISTRATION DIVERS</div>
              <div className="text-xs opacity-90">Gestion de l'arborescence complète</div>
            </div>
          </div>
        </div>

        {/* Structure Navigation */}
        {renderDiversStructure()}

        {/* Edit/Add Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingItem.name ? 'Modifier l\'article' : 'Nouvel article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nom de l'article
                    </label>
                    <Input
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nom de l'article"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Variantes (séparées par des virgules)
                    </label>
                    <Input
                      value={editingItem.variants?.join(', ') || ''}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev, 
                        variants: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                      }))}
                      placeholder="Petit, Moyen, Grand..."
                      className="w-full"
                    />
                  </div>
                  
                  {editingItem.materials !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Matériaux (séparés par des virgules)
                      </label>
                      <Input
                        value={editingItem.materials?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                        }))}
                        placeholder="Bois, Métal, Plastique..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {editingItem.options !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Options (séparées par des virgules)
                      </label>
                      <Input
                        value={editingItem.options?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                        }))}
                        placeholder="Option 1, Option 2..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Note (optionnelle)
                    </label>
                    <Textarea
                      value={editingItem.note || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, note: e.target.value}))}
                      placeholder="Note ou description supplémentaire..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="outline"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Convert static item data to proper article format and save
                        const articleData = {
                          name: editingItem.name,
                          category_id: 'exterieur_jardin', // Valid category
                          base_price: 0, // Default price
                          materials: editingItem.materials || [],
                          description: editingItem.note || '',
                          requires_dismantling: false
                        };
                        
                        await createArticle(articleData);
                        await loadAdminData(); // Refresh the article list
                        setEditingItem(null);
                        alert('Article ajouté avec succès !');
                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de l\'ajout de l\'article');
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernAdminJardinPage = ({ onGoBack, createArticle, updateArticle, deleteArticle, adminAuth, setCurrentStep, setIsAdminMode, allArticles, loadAdminData }) => {
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const renderJardinStructure = () => {
    if (!selectedMainCategory) {
      // Show main categories
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(JARDIN_ADMIN_STRUCTURE.categories).map(([key, category]) => (
            <Card
              key={key}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedMainCategory(key)}
            >
              <CardContent className={`p-6 text-center bg-gradient-to-r ${JARDIN_ADMIN_STRUCTURE.color} text-white`}>
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <div className="text-sm opacity-90">
                  {category.subcategories ? 
                    `${Object.keys(category.subcategories).length} sous-catégories` :
                    `${category.items?.length || 0} articles`
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const category = JARDIN_ADMIN_STRUCTURE.categories[selectedMainCategory];
    
    if (category.subcategories && !selectedSubCategory) {
      // Show subcategories
      return (
        <div>
          <div className="mb-6">
            <Button
              onClick={() => setSelectedMainCategory(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories principales
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(category.subcategories).map(([key, subcategory]) => (
              <Card
                key={key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-green-300"
                onClick={() => setSelectedSubCategory(key)}
              >
                <CardContent className="p-6 text-center bg-gradient-to-r from-green-400 to-green-500 text-white">
                  <div className="text-3xl mb-3">🌿</div>
                  <h3 className="text-lg font-bold mb-2" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                    {subcategory.name}
                  </h3>
                  <div className="text-sm opacity-90" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
                    {subcategory.items?.length || 0} articles
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Show items
    const items = category.subcategories 
      ? category.subcategories[selectedSubCategory]?.items 
      : category.items;
    const categoryName = category.subcategories 
      ? category.subcategories[selectedSubCategory]?.name 
      : category.name;

    return (
      <div>
        <div className="mb-6">
          <Button
            onClick={() => {
              if (category.subcategories && selectedSubCategory) {
                setSelectedSubCategory(null);
              } else {
                setSelectedMainCategory(null);
              }
            }}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {category.subcategories && selectedSubCategory ? 'Retour aux sous-catégories' : 'Retour aux catégories principales'}
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
        </div>
        
        <div className="space-y-4">
          {items?.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                    
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Variantes: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variants.map((variant, vIndex) => (
                            <span key={vIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {variant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.materials && item.materials.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Matériaux: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.materials.map((material, mIndex) => (
                            <span key={mIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.options && item.options.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">Options: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.options.map((option, oIndex) => (
                            <span key={oIndex} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {item.note}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem({...item, index, categoryKey: selectedMainCategory, subCategoryKey: selectedSubCategory})}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
                          alert('Article supprimé ! (Cette fonctionnalité sera connectée à la base de données)');
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <Button 
                variant="outline" 
                className="text-green-600 border-green-300"
                onClick={() => setEditingItem({
                  name: '',
                  materials: [],
                  variants: [],
                  options: [],
                  note: '',
                  categoryKey: selectedMainCategory,
                  subCategoryKey: selectedSubCategory
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un nouvel article
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Administration</h1>
            <AdminNavigationDropdown 
              currentStep='admin-jardin'
              onStepChange={setCurrentStep} 
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Exporter structure
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setIsAdminMode(false);
                setCurrentStep('home');
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Title - Compact Version */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white mb-4">
            <div className="text-2xl mr-3">🌿</div>
            <div>
              <div className="text-base font-bold">ADMINISTRATION JARDIN</div>
              <div className="text-xs opacity-90">Gestion de l'arborescence complète</div>
            </div>
          </div>
        </div>

        {/* Structure Navigation */}
        {renderJardinStructure()}

        {/* Edit/Add Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingItem.name ? 'Modifier l\'article' : 'Nouvel article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nom de l'article
                    </label>
                    <Input
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nom de l'article"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Variantes (séparées par des virgules)
                    </label>
                    <Input
                      value={editingItem.variants?.join(', ') || ''}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev, 
                        variants: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                      }))}
                      placeholder="Petit, Moyen, Grand..."
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Matériaux (séparés par des virgules)
                    </label>
                    <Input
                      value={editingItem.materials?.join(', ') || ''}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev, 
                        materials: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                      }))}
                      placeholder="Bois, Métal, Plastique..."
                      className="w-full"
                    />
                  </div>
                  
                  {editingItem.options !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Options (séparées par des virgules)
                      </label>
                      <Input
                        value={editingItem.options?.join(', ') || ''}
                        onChange={(e) => setEditingItem(prev => ({
                          ...prev, 
                          options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                        }))}
                        placeholder="Option 1, Option 2..."
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Note (optionnelle)
                    </label>
                    <Textarea
                      value={editingItem.note || ''}
                      onChange={(e) => setEditingItem(prev => ({...prev, note: e.target.value}))}
                      placeholder="Note ou description supplémentaire..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="outline"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Convert static item data to proper article format and save
                        // Map subcategories to appropriate category_ids
                        let categoryId = 'exterieur_jardin'; // Default for jardin
                        
                        if (editingItem.categoryKey === 'mobilier_jardin_contenants') {
                          categoryId = 'exterieur_jardin';
                        } else if (editingItem.categoryKey === 'jardin_exterieur') {
                          categoryId = 'exterieur_jardin';
                        } else if (editingItem.categoryKey === 'bricolage_materiaux_energie') {
                          categoryId = 'exterieur_jardin';
                        }
                        
                        const articleData = {
                          name: editingItem.name,
                          category_id: categoryId,
                          base_price: 0,
                          materials: editingItem.materials || [],
                          description: editingItem.note || '',
                          requires_dismantling: false
                        };
                        
                        await createArticle(articleData);
                        await loadAdminData();
                        setEditingItem(null);
                        alert('Article ajouté avec succès !');
                      } catch (error) {
                        console.error('Erreur:', error);
                        alert('Erreur lors de l\'ajout de l\'article');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// AdminLoginPage component - moved outside App to prevent re-creation on re-renders
const AdminLoginPage = ({ adminAuth, onUsernameChange, onPasswordChange, onLogin, onGoHome }) => (
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
          onChange={onUsernameChange}
          autoComplete="username"
        />
        <Input
          type="password"
          placeholder="Mot de passe"
          value={adminAuth.password}
          onChange={onPasswordChange}
          autoComplete="current-password"
        />
        <Button 
          onClick={onLogin}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          Se connecter
        </Button>
        <Button 
          onClick={onGoHome}
          variant="outline"
          className="w-full"
        >
          Retour à l'accueil
        </Button>
      </CardContent>
    </Card>
  </div>
);

function App() {
  const [currentStep, setCurrentStep] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedABCDCategory, setSelectedABCDCategory] = useState(null);
  const [selectedABCDSubcategory, setSelectedABCDSubcategory] = useState(null);
  const [selectedElectroType, setSelectedElectroType] = useState(null); // froid, cuisine, salle_de_bain
  const [selectedElectroItem, setSelectedElectroItem] = useState(null); // frigo, congelateur, etc.
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [isPhotoQuote, setIsPhotoQuote] = useState(false);

  // Stable updaters removed - using external component now
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
    elevator_size: '',
    additional_info: '',
    zone: '',
    preferred_date: '',
    preferred_time_slot: '',
    urgent: false
  });

  // Optimized form field updaters
  const updateQuoteFormField = useCallback((field) => (value) => {
    setQuoteForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const quoteFormUpdaters = useMemo(() => ({
    client_name: updateQuoteFormField('client_name'),
    client_email: updateQuoteFormField('client_email'),
    client_phone: updateQuoteFormField('client_phone'),
    address: updateQuoteFormField('address'),
    parking: updateQuoteFormField('parking'),
    floor: updateQuoteFormField('floor'),
    elevator: updateQuoteFormField('elevator'),
    elevator_size: updateQuoteFormField('elevator_size'),
    additional_info: updateQuoteFormField('additional_info'),
    zone: updateQuoteFormField('zone'),
    preferred_date: updateQuoteFormField('preferred_date'),
    preferred_time_slot: updateQuoteFormField('preferred_time_slot'),
    urgent: updateQuoteFormField('urgent')
  }), [updateQuoteFormField]);

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

  const updateItemQuantity = React.useCallback((index, quantity) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[index].quantity = Math.max(1, quantity);
      return newItems;
    });
  }, []);

  const removeFromSelection = React.useCallback((index) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

  const toggleDismantling = React.useCallback((index) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[index].is_dismantled = !newItems[index].is_dismantled;
      return newItems;
    });
  }, []);

  const addCustomItem = React.useCallback((description) => {
    setCustomItems(prev => [...prev, {
      description: description,
      estimated_price: 0.0
    }]);
  }, []);

  const removeCustomItem = React.useCallback((index) => {
    setCustomItems(prev => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

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
        elevator_size: '',
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

  // Admin functions - wrapped in useCallback to prevent re-renders
  const authenticateAdmin = useCallback(async () => {
    try {
      const auth = btoa(`${adminAuth.username}:${adminAuth.password}`);
      const response = await axios.get(`${API}/admin/photos`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      setIsAdminMode(true);
      setCurrentStep('admin-categories');
      loadAdminData();
    } catch (error) {
      alert('Identifiants admin incorrects');
    }
  }, [adminAuth.username, adminAuth.password]);

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
            onClick={() => setCurrentStep('photo-quote')}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un logement entier
          </Button>
          
          <Button
            onClick={() => setCurrentStep('photo-quote')}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un garage / une cave
          </Button>
          
          <Button
            onClick={() => setCurrentStep('abcd-categories')}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-black border-0 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Un ou plusieurs articles <span className="text-sm opacity-80">(devis instantané & RDV en ligne)</span>
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

  // CategoriesPage removed - now using ABCDCategoriesPage

  const SubcategoriesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setCurrentStep('abcd-categories')}
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
              <List className="mr-2 h-4 w-4" />
              Ma liste ({selectedItems.length + customItems.length})
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
            <CustomItemInput onAddCustomItem={addCustomItem} />
          </div>

          {/* Right side - Selection Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <List className="mr-2 h-5 w-5" />
                  Ma liste ({selectedItems.length + customItems.length})
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
                      <SelectionItem
                        key={`selected-${item.article_id}-${index}`}
                        item={item}
                        index={index}
                        onUpdateQuantity={updateItemQuantity}
                        onRemove={removeFromSelection}
                        onToggleDismantling={toggleDismantling}
                      />
                    ))}
                    
                    {/* Custom Items */}
                    {customItems.map((item, index) => (
                      <CustomItemCard
                        key={`custom-${item.description}-${index}`}
                        item={item}
                        index={index}
                        onRemove={removeCustomItem}
                      />
                    ))}
                    
                    <div className="border-t pt-4">
                      {/* Total masqué pendant la sélection - sera visible dans le récapitulatif final */}
                      <div className="text-center text-gray-600">
                        <span>Prix calculé après validation des informations</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setIsPhotoQuote(false);
                        setCurrentStep('quote-form');
                      }}
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

  // QuoteFormPage removed - now using external component

// Photo Quote Page component - moved outside App to prevent re-creation
const PhotoQuotePage = ({ onGoHome, onPhotosValidated }) => {
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const handlePhotoUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length + uploadedPhotos.length > 10) {
      alert('Vous ne pouvez télécharger que 10 photos maximum');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          url: event.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, [uploadedPhotos.length]);

  const removePhoto = useCallback((photoId) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }, []);

  const validatePhotos = useCallback(() => {
    if (uploadedPhotos.length === 0) {
      alert('Veuillez sélectionner au moins une photo');
      return;
    }
    onPhotosValidated();
  }, [uploadedPhotos.length, onPhotosValidated]);

  // No more form display in PhotoQuotePage

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={onGoHome}
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
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Cliquez ou glissez vos photos ici</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => document.getElementById('photo-upload').click()}
                >
                  Sélectionner les photos
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                Plus de 10 photos ? Contactez-nous sur WhatsApp
              </p>
            </div>

            {/* Uploaded Photos Display */}
            {uploadedPhotos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Photos sélectionnées ({uploadedPhotos.length}/10)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={validatePhotos}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3"
                >
                  Valider mes photos ({uploadedPhotos.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

  const ABCDCategoriesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
              onClick={() => setCurrentStep('quote-form')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <List className="mr-2 h-4 w-4" />
              Ma liste ({selectedItems.length + customItems.length})
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Choisissez la catégorie de vos objets
          </h2>
          <p className="text-base text-gray-600">
            Sélectionnez la catégorie correspondant à vos objets à évacuer
          </p>
        </div>

        {/* Categories Grid 2x2 */}
        <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
          {Object.values(ABCD_CATEGORIES).map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-300"
              onClick={() => {
                setSelectedABCDCategory(category);
                if (category.subcategories.length > 0) {
                  setCurrentStep('abcd-subcategories');
                } else {
                  // Si pas de sous-catégories, aller directement à la sélection d'objets
                  setCurrentStep('abcd-objects');
                }
              }}
            >
              <CardContent className={`p-4 text-center bg-gradient-to-r ${category.color} text-white h-60 flex flex-col`} style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                <div className="text-3xl mb-2" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{category.icon}</div>
                <h3 className="text-base font-bold mb-3 leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                  {category.name}
                </h3>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-wrap gap-1.5 justify-center items-center max-w-full">
                    {category.items.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-white bg-opacity-25 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium border border-white border-opacity-40"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-16 text-center">
          <CustomItemInput onAddCustomItem={addCustomItem} />
        </div>
      </div>
    </div>
  );

  const ABCDSubcategoriesPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setCurrentStep('abcd-categories')}
            variant="outline"
            className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux catégories
          </Button>
          
          {(selectedItems.length > 0 || customItems.length > 0) && (
            <Button
              onClick={() => setCurrentStep('quote-form')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <List className="mr-2 h-4 w-4" />
              Ma liste ({selectedItems.length + customItems.length})
            </Button>
          )}
        </div>

        {/* Category Info */}
        {selectedABCDCategory && (
          <div className="text-center mb-8">
            <div className={`inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r ${selectedABCDCategory.color} text-white mb-4`} style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              <div className="text-4xl mr-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{selectedABCDCategory.icon}</div>
              <div>
                <div className="text-lg font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>{selectedABCDCategory.name}</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Précisez le type d'objets
            </h2>
          </div>
        )}

        {/* Subcategories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {selectedABCDCategory?.subcategories.map((subcategory, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2"
              onClick={() => {
                setSelectedABCDSubcategory(subcategory);
                // Special case for Électroménager
                if (subcategory === 'Électroménager') {
                  setCurrentStep('electromenager-types');
                } else {
                  setCurrentStep('abcd-objects');
                }
              }}
            >
              <CardContent className={`p-4 text-center bg-gradient-to-r ${selectedABCDCategory.color} text-white h-32 flex flex-col justify-center`} style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                <h3 className="text-sm font-bold mb-2 leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                  {subcategory}
                </h3>
                <div className="text-xs opacity-90 font-medium" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>
                  Voir les objets →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-16">
          <CustomItemInput onAddCustomItem={addCustomItem} />
        </div>
      </div>
    </div>
  );

  const ABCDObjectsPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left side - Objects */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button
                onClick={() => setCurrentStep(selectedABCDCategory?.subcategories.length > 0 ? 'abcd-subcategories' : 'abcd-categories')}
                variant="outline"
                className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>

            {/* Category/Subcategory Info */}
            {selectedABCDCategory && (
              <div className="mb-8">
                <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${selectedABCDCategory.color} text-white mb-4`} style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                  <div className="text-2xl mr-3" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>{selectedABCDCategory.icon}</div>
                  <div>
                    <div className="font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>{selectedABCDCategory.name}</div>
                    {selectedABCDSubcategory && (
                      <div className="text-sm opacity-90" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>→ {selectedABCDSubcategory}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Objects Selection */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Sélectionnez vos objets
              </h3>
              
              {/* Pour le moment, on affiche un message */}
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h4 className="text-xl font-bold mb-4">Objets disponibles prochainement</h4>
                  <p className="text-gray-600 mb-6">
                    Les objets spécifiques pour cette catégorie seront bientôt disponibles.
                    En attendant, vous pouvez décrire vos objets ci-dessous.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Custom Item Input */}
            <CustomItemInput onAddCustomItem={addCustomItem} />
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
                      <SelectionItem
                        key={`selected-${item.article_id}-${index}`}
                        item={item}
                        index={index}
                        onUpdateQuantity={updateItemQuantity}
                        onRemove={removeFromSelection}
                        onToggleDismantling={toggleDismantling}
                      />
                    ))}
                    
                    {/* Custom Items */}
                    {customItems.map((item, index) => (
                      <CustomItemCard
                        key={`custom-${item.description}-${index}`}
                        item={item}
                        index={index}
                        onRemove={removeCustomItem}
                      />
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="text-center text-gray-600">
                        <span>Prix calculé après validation des informations</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setIsPhotoQuote(false);
                        setCurrentStep('quote-form');
                      }}
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

  // Stable admin login handlers - using regular Input components to avoid cursor issues
  const handleAdminUsernameChange = useCallback((e) => {
    setAdminAuth(prev => ({...prev, username: e.target.value}));
  }, []);

  const handleAdminPasswordChange = useCallback((e) => {
    setAdminAuth(prev => ({...prev, password: e.target.value}));
  }, []);

  const handleAdminLogin = useCallback(() => {
    authenticateAdmin();
  }, [authenticateAdmin]);

  const handleGoHome = useCallback(() => {
    setCurrentStep('home');
  }, []);

  // Category Form Component - Ultra isolated
  const CategoryForm = React.memo(({ category, allCategories, onSave, onCancel }) => {
    // Initialize form data once and keep it isolated
    const [formData, setFormData] = React.useState(() => ({
      name: category?.name || '',
      parent_id: category?.parent_id || '',
      description: category?.description || '',
      icon: category?.icon || ''
    }));

    // Prevent re-creation of handlers
    const fieldUpdaters = React.useMemo(() => ({
      name: (value) => setFormData(prev => ({ ...prev, name: value })),
      parent_id: (value) => setFormData(prev => ({ ...prev, parent_id: value })),
      description: (value) => setFormData(prev => ({ ...prev, description: value })),
      icon: (value) => setFormData(prev => ({ ...prev, icon: value }))
    }), []);

    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      const dataToSend = { ...formData };
      if (!dataToSend.parent_id || dataToSend.parent_id === 'none') dataToSend.parent_id = null;
      if (!dataToSend.description) delete dataToSend.description;
      if (!dataToSend.icon) delete dataToSend.icon;
      
      onSave(dataToSend);
    }, [formData, onSave]);

    const handleCancel = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }, [onCancel]);

    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <OptimizedInput
              placeholder="Nom de la catégorie"
              value={formData.name}
              onChange={fieldUpdaters.name}
              required
              autoFocus
            />
            
            <Select value={formData.parent_id || undefined} onValueChange={fieldUpdaters.parent_id}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie parent (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} disabled={cat.id === category?.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <OptimizedInput
              placeholder="Icône (emoji)"
              value={formData.icon}
              onChange={fieldUpdaters.icon}
            />
            
            <OptimizedTextarea
              placeholder="Description (optionnelle)"
              value={formData.description}
              onChange={fieldUpdaters.description}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
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
  });

  // Article Form Component - Ultra isolated
  const ArticleForm = React.memo(({ article, allCategories, onSave, onCancel }) => {
    // Initialize form data once and keep it isolated
    const [formData, setFormData] = React.useState(() => ({
      name: article?.name || '',
      category_id: article?.category_id || '',
      base_price: article?.base_price || 0,
      materials: article?.materials?.join(', ') || '',
      description: article?.description || '',
      requires_dismantling: article?.requires_dismantling || false
    }));

    // Prevent re-creation of handlers
    const fieldUpdaters = React.useMemo(() => ({
      name: (value) => setFormData(prev => ({ ...prev, name: value })),
      category_id: (value) => setFormData(prev => ({ ...prev, category_id: value })),
      base_price: (value) => setFormData(prev => ({ ...prev, base_price: value })),
      materials: (value) => setFormData(prev => ({ ...prev, materials: value })),
      description: (value) => setFormData(prev => ({ ...prev, description: value })),
      requires_dismantling: (value) => setFormData(prev => ({ ...prev, requires_dismantling: value }))
    }), []);

    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      const dataToSend = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        materials: formData.materials ? formData.materials.split(',').map(m => m.trim()).filter(m => m) : []
      };
      if (!dataToSend.description) delete dataToSend.description;
      
      onSave(dataToSend);
    }, [formData, onSave]);

    const handleCancel = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }, [onCancel]);

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
            <OptimizedInput
              placeholder="Nom de l'article"
              value={formData.name}
              onChange={fieldUpdaters.name}
              required
              autoFocus
            />
            
            <Select value={formData.category_id || undefined} onValueChange={fieldUpdaters.category_id}>
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
            
            <OptimizedInput
              type="number"
              step="0.01"
              placeholder="Prix de base"
              value={formData.base_price}
              onChange={fieldUpdaters.base_price}
              required
            />
            
            <OptimizedInput
              placeholder="Matériaux (séparés par des virgules)"
              value={formData.materials}
              onChange={fieldUpdaters.materials}
            />
            
            <OptimizedTextarea
              placeholder="Description (optionnelle)"
              value={formData.description}
              onChange={fieldUpdaters.description}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_dismantling"
                checked={formData.requires_dismantling}
                onCheckedChange={fieldUpdaters.requires_dismantling}
              />
              <label htmlFor="requires_dismantling">Nécessite démontage/débranchement</label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
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
  });

  const AdminPhotosPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Navigation Dropdown */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Administration</h1>
            <AdminNavigationDropdown 
              currentStep={currentStep} 
              onStepChange={setCurrentStep} 
            />
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
              {allPhotos.map((photo) => (
                <div
                  key={photo.filename}
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
              {allArticles.map((article) => (
                <div
                  key={article.id}
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
              <AdminNavigationDropdown 
                currentStep={currentStep} 
                onStepChange={setCurrentStep} 
              />
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
        return <ABCDCategoriesPage />;
      case 'subcategories':
        return <SubcategoriesPage />;
      case 'articles':
        return <ArticlesPage />;
      case 'quote-form':
        return <QuoteFormPage 
          quoteForm={quoteForm}
          onUpdateQuoteForm={(field, value) => setQuoteForm(prev => ({...prev, [field]: value}))}
          selectedItems={selectedItems}
          customItems={customItems}
          zones={zones}
          availableSlots={availableSlots}
          isPhotoQuote={isPhotoQuote}
          onGoBack={() => {
            setIsPhotoQuote(false);
            setCurrentStep('articles');
          }}
          onViewQuote={() => setCurrentStep('quote-display')}
          onLoadAvailableSlots={loadAvailableSlots}
        />;
      case 'quote-display':
        return <QuoteDisplayPage 
          quoteForm={quoteForm}
          selectedItems={selectedItems}
          customItems={customItems}
          calculateTotal={calculateTotal}
          onGoBack={() => setCurrentStep('quote-form')}
          onAcceptQuote={() => alert('Calendrier de rendez-vous à venir !')}
        />;
      case 'photo-quote':
        return <PhotoQuotePage 
          onGoHome={() => setCurrentStep('home')}
          onPhotosValidated={() => {
            setIsPhotoQuote(true);
            setCurrentStep('quote-form');
          }}
        />;
      case 'abcd-categories':
        return <ABCDCategoriesPage />;
      case 'abcd-subcategories':
        return <ABCDSubcategoriesPage />;
      case 'abcd-objects':
        return <ABCDObjectsPage />;
      case 'electromenager-types':
        return <ElectromenagerTypePage 
          onGoBack={() => setCurrentStep('abcd-subcategories')}
          onSelectType={(key, type) => {
            setSelectedElectroType(key);
            setCurrentStep('electromenager-items');
          }}
        />;
      case 'electromenager-items':
        return <ElectromenagerItemsPage 
          selectedType={ELECTROMENAGER_STRUCTURE[selectedElectroType]}
          onGoBack={() => setCurrentStep('electromenager-types')}
          onSelectItem={(key, item) => {
            setSelectedElectroItem(key);
            setCurrentStep('electromenager-photos');
          }}
        />;
      case 'electromenager-photos':
        return <ElectromenagerPhotosPage 
          selectedType={ELECTROMENAGER_STRUCTURE[selectedElectroType]}
          selectedItem={ELECTROMENAGER_STRUCTURE[selectedElectroType]?.items[selectedElectroItem]}
          onGoBack={() => setCurrentStep('electromenager-items')}
          onAddToSelection={(item, photoIndex) => {
            // Add item to selection and go to quote form
            const newItem = {
              article_id: `electromenager-${selectedElectroType}-${selectedElectroItem}-${photoIndex}`,
              article_name: item.name + (item.variants[photoIndex] ? ` (${item.variants[photoIndex]})` : ''),
              price: 50, // Default price, should be calculated
              quantity: 1,
              material: selectedElectroType
            };
            setSelectedItems(prev => [...prev, newItem]);
            setCurrentStep('quote-form');
          }}
        />;
      case 'admin-login':
        return <AdminLoginPage 
          adminAuth={adminAuth}
          onUsernameChange={handleAdminUsernameChange}
          onPasswordChange={handleAdminPasswordChange}
          onLogin={handleAdminLogin}
          onGoHome={handleGoHome}
        />;
      case 'admin-categories':
        return <ModernAdminCategoriesPage 
          onGoBack={() => setCurrentStep('admin-categories')}
          createArticle={createArticle}
          updateArticle={updateArticle}
          deleteArticle={deleteArticle}
          adminAuth={adminAuth}
          setCurrentStep={setCurrentStep}
          setIsAdminMode={setIsAdminMode}
          allArticles={allArticles}
          loadAdminData={loadAdminData}
        />;
      case 'admin-multimedia-electrique':
        return <ModernAdminMultimediaElectriqueePage 
          onGoBack={() => setCurrentStep('admin-categories')}
          createArticle={createArticle}
          updateArticle={updateArticle}
          deleteArticle={deleteArticle}
          adminAuth={adminAuth}
          setCurrentStep={setCurrentStep}
          setIsAdminMode={setIsAdminMode}
          loadAdminData={loadAdminData}
        />;
      case 'admin-divers':
        return <ModernAdminDiversPage 
          onGoBack={() => setCurrentStep('admin-categories')}
          createArticle={createArticle}
          updateArticle={updateArticle}
          deleteArticle={deleteArticle}
          adminAuth={adminAuth}
          setCurrentStep={setCurrentStep}
          setIsAdminMode={setIsAdminMode}
          loadAdminData={loadAdminData}
        />;
      case 'admin-jardin':
        return <ModernAdminJardinPage 
          onGoBack={() => setCurrentStep('admin-categories')}
          createArticle={createArticle}
          updateArticle={updateArticle}
          deleteArticle={deleteArticle}
          adminAuth={adminAuth}
          setCurrentStep={setCurrentStep}
          setIsAdminMode={setIsAdminMode}
          allArticles={allArticles}
          loadAdminData={loadAdminData}
        />;
      default:
        return <HomePage />;
    }
  };

  return <div className="App">{renderCurrentStep()}</div>;
}

export default App;