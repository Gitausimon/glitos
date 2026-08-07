import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export type StoreSettings = {
  heroTitle: string;
  heroSubtitle: string;
  orbitItems: string[];
  deliveryFee: number;
  isStoreOpen: boolean;
};

const DEFAULT_SETTINGS: StoreSettings = {
  heroTitle: 'G DELIVERY',
  heroSubtitle: 'Deliciousness revolving around you.',
  deliveryFee: 100,
  isStoreOpen: true,
  orbitItems: [
    "/images/quarter_chicken.png",
    "/images/crispy_chips.png",
    "/images/glitos_combo.png",
    "/images/soda_cup.png"
  ]
};

type StoreContextType = {
  settings: StoreSettings;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;
  loading: boolean;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'store_settings', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      } else {
        // Initialize the document with defaults if it doesn't exist
        setDoc(docRef, DEFAULT_SETTINGS).catch(console.error);
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching store settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateSettings = async (updates: Partial<StoreSettings>) => {
    const docRef = doc(db, 'store_settings', 'main');
    try {
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error updating store settings:", e);
      // Fallback: If document somehow doesn't exist, set it
      await setDoc(docRef, { ...settings, ...updates }).catch(console.error);
    }
  };

  return (
    <StoreContext.Provider value={{ settings, updateSettings: handleUpdateSettings, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be utilized within a StoreProvider scope.');
  }
  return context;
}
