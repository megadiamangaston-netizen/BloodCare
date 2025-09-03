# 🩸 BloodCare - Plateforme de Gestion des Dons de Sang

Une plateforme complète et moderne pour la gestion des dons de sang, développée avec **Next.js**, **TypeScript**, **Firebase** et **Supabase**.

## ✨ Fonctionnalités

### 🔐 Système d'Authentification Multi-Niveaux
- **Super Administrateur** : Gestion complète de la plateforme
- **Administrateur** : Hôpitaux et ONG partenaires  
- **Utilisateur** : Donneurs et bénéficiaires

### 👑 Dashboard Super Admin
- Création et gestion des comptes administrateurs
- Attribution des hôpitaux aux administrateurs
- Vue d'ensemble globale du système
- Gestion des permissions et accès

### 🏥 Dashboard Administrateur (Hôpitaux/ONG)
- **Gestion du Stock de Sang**
  - Ajout, modification, suppression des poches de sang
  - Classification par groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Suivi des niveaux de stock (critique, normal, excellent)
  - Gestion des dates d'expiration

- **Campagnes de Collecte**
  - Création de campagnes avec géolocalisation
  - Définition des types de sang recherchés
  - Gestion des dates et capacités
  - Suivi en temps réel des participants

- **Gestion des Demandes de Don**
  - Réception des candidatures
  - Validation des tests d'éligibilité
  - Approbation/rejet des demandes
  - Planification des rendez-vous

- **Statistiques et Rapports**
  - Tableaux de bord interactifs
  - Export PDF et Excel
  - Alertes pour stocks critiques
  - Analyses des tendances

### 👥 Interface Utilisateur (Donneurs)
- **Carte Interactive des Campagnes**
  - Visualisation géographique des collectes
  - Filtrage par type de sang et proximité
  - Informations détaillées des campagnes

- **Test d'Éligibilité Intelligent**
  - Questionnaire médical guidé
  - Évaluation automatique de l'éligibilité
  - Conseils personnalisés

- **Système de Témoignages**
  - Partage d'expériences
  - Notation et avis
  - Modération des contenus

- **Recherche de Poches de Sang**
  - Recherche par groupe sanguin
  - Localisation des hôpitaux
  - Disponibilité en temps réel

- **Assistant IA Intégré**
  - Chatbot intelligent
  - Réponses aux questions fréquentes
  - Support personnalisé

- **Système de Récompenses**
  - Badges de reconnaissance
  - Récompenses par nombre de dons
  - Gamification de l'expérience

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes modernes

### Backend & Authentification
- **Firebase Auth** - Authentification sécurisée
- **Firestore** - Base de données NoSQL
- **Google Auth** - Connexion simplifiée

### Stockage & Fichiers
- **Supabase Storage** - Stockage des images et documents
- **Supabase Database** - Base de données PostgreSQL

### Fonctionnalités Avancées
- **jsPDF** - Génération de rapports PDF
- **XLSX** - Export de données Excel
- **React Hook Form** - Gestion des formulaires
- **React Hot Toast** - Notifications utilisateur

## 📦 Installation

1. **Cloner le repository**
```bash
git clone [URL_DU_REPO]
cd BloodCare
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
Créer un fichier `.env.local` :
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_key

# OpenAI pour le chatbot (optionnel)
OPENAI_API_KEY=votre_openai_key
```

4. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Structure du Projet

```
src/
├── app/                    # Pages et layouts (App Router)
│   ├── admin/             # Dashboard administrateur
│   ├── super-admin/       # Dashboard super admin
│   ├── dashboard/         # Dashboard utilisateur
│   └── page.tsx           # Page d'accueil
├── components/            # Composants réutilisables
│   ├── auth/             # Composants d'authentification
│   ├── ui/               # Composants UI de base
│   ├── Chatbot.tsx       # Assistant IA
│   ├── FAQ.tsx           # Questions fréquentes
│   └── Map.tsx           # Carte interactive
├── hooks/                # Hooks personnalisés
│   └── useAuth.tsx       # Gestion de l'authentification
├── lib/                  # Utilitaires et configurations
│   ├── firebase.ts       # Configuration Firebase
│   ├── supabase.ts       # Configuration Supabase
│   └── exports.ts        # Utilitaires d'export
└── types/                # Définitions TypeScript
    └── index.ts          # Types principaux
```

## 🎯 Utilisation

### Pour les Super Administrateurs
1. Se connecter avec les identifiants spéciaux
2. Créer des comptes administrateurs pour les hôpitaux
3. Assigner les hôpitaux aux administrateurs
4. Surveiller l'activité globale de la plateforme

### Pour les Administrateurs (Hôpitaux)
1. Se connecter avec les identifiants fournis
2. Gérer le stock de sang de l'établissement
3. Créer des campagnes de collecte
4. Traiter les demandes de don des utilisateurs
5. Générer des rapports et statistiques

### Pour les Utilisateurs (Donneurs)
1. Créer un compte ou se connecter avec Google
2. Passer le test d'éligibilité
3. Trouver des campagnes de collecte sur la carte
4. Faire une demande de don
5. Partager son expérience via les témoignages

## 🔒 Sécurité

- **Authentification Firebase** : Sécurité robuste et éprouvée
- **Protection des routes** : Middleware de vérification des rôles
- **Validation des données** : Contrôles côté client et serveur
- **Tests d'éligibilité** : Questionnaires médicaux sécurisés

## 📊 Fonctionnalités de Reporting

- **Export PDF** : Rapports détaillés avec graphiques
- **Export Excel** : Données structurées pour analyses
- **Statistiques en temps réel** : Tableaux de bord interactifs
- **Alertes automatiques** : Notifications pour stocks critiques

## 🤖 Intelligence Artificielle

Le chatbot intégré utilise des réponses prédéfinies intelligentes pour :
- Répondre aux questions sur le don de sang
- Guider les utilisateurs dans leurs démarches
- Fournir des informations médicales de base
- Orienter vers les professionnels de santé si nécessaire

## 🎨 Interface Utilisateur

- **Design moderne et responsive** : Compatible tous appareils
- **Animations fluides** : Framer Motion pour une UX premium
- **Accessibilité** : Conformité aux standards WCAG
- **Thème cohérent** : Palette de couleurs médicale et professionnelle

## 🚧 Développement Futur

- Intégration avec des APIs médicales externes
- Notifications push en temps réel
- Application mobile native
- Intelligence artificielle avancée avec OpenAI
- Système de géolocalisation en temps réel
- Intégration avec les systèmes hospitaliers existants

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation

---

**BloodCare** - *Ensemble, sauvons des vies par le don de sang* 🩸❤️
