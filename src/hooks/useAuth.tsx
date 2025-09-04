'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  createFirstSuperAdmin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName!,
              photoURL: firebaseUser.photoURL,
              role: userData.role || 'user',
              hospitalId: userData.hospitalId,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            });
          } else {
            // Créer un nouveau document utilisateur
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName!,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            
            setUser(newUser);
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          
          // Gestion gracieuse des erreurs de connexion Firestore
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            console.warn('Firestore hors ligne - création d\'un utilisateur local temporaire');
            
            // Créer un utilisateur temporaire en mode offline
            const tempUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Utilisateur',
              photoURL: firebaseUser.photoURL,
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setUser(tempUser);
            toast.success('Mode hors ligne activé');
          } else {
            toast.error('Erreur lors du chargement des données utilisateur');
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Erreur de connexion : ' + error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Connexion Google réussie !');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error('Erreur de connexion Google : ' + error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(firebaseUser, { displayName });
      
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      toast.success('Compte créé avec succès !');
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error('Erreur lors de la création du compte : ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        updatedAt: new Date(),
      });
      toast.success('Rôle utilisateur mis à jour');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
      throw error;
    }
  };

  // Fonction temporaire pour créer le premier super admin
  const createFirstSuperAdmin = async (email: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userToPromote = querySnapshot.docs.find(doc => doc.data().email === email);
      
      if (userToPromote) {
        await updateDoc(doc(db, 'users', userToPromote.id), {
          role: 'super_admin',
          updatedAt: new Date(),
        });
        toast.success('Super admin créé avec succès');
        // Recharger la page pour appliquer le nouveau rôle
        window.location.reload();
      } else {
        toast.error('Utilisateur non trouvé');
      }
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error('Erreur lors de la création du super admin');
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    logout,
    updateUserRole,
    createFirstSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
