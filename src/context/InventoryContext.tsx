import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

export type PosInventoryItem = {
  inventoryIdentifier: string;
  culinaryNomenclature: string;
  retailValuation: number;
  deliveryValuation: number;
  isAvailableForDelivery: boolean;
  stockAvailability: boolean;
  visualAssetUri: string;
};

// We keep the defaults to seed the database if it's empty
const DEFAULT_INVENTORY: Omit<PosInventoryItem, 'inventoryIdentifier'>[] = [
  { culinaryNomenclature: 'Quarter Chicken', retailValuation: 350, deliveryValuation: 400, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/quarter_chicken.png' },
  { culinaryNomenclature: 'Half Chicken', retailValuation: 650, deliveryValuation: 700, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/half_chicken.png' },
  { culinaryNomenclature: 'Crispy Chips', retailValuation: 150, deliveryValuation: 200, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/crispy_chips.png' },
  { culinaryNomenclature: 'Soda 500ml', retailValuation: 100, deliveryValuation: 150, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/soda_cup.png' },
  { culinaryNomenclature: 'Glitos Combo', retailValuation: 450, deliveryValuation: 550, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/glitos_combo.png' },
];

type InventoryContextType = {
  inventoryCorpus: PosInventoryItem[];
  addInventoryItem: (item: Omit<PosInventoryItem, 'inventoryIdentifier'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<PosInventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  loading: boolean;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventoryCorpus, setInventoryCorpus] = useState<PosInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inventoryCol = collection(db, 'inventory');
    let hasSeeded = false;

    const unsubscribe = onSnapshot(inventoryCol, (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty && !hasSeeded) {
        // Automatically seed with default inventory on first empty load
        hasSeeded = true;
        DEFAULT_INVENTORY.forEach((item) => {
          addDoc(inventoryCol, item).catch(console.error);
        });
      } else {
        const items = snapshot.docs.map(doc => ({
          inventoryIdentifier: doc.id,
          ...doc.data()
        })) as PosInventoryItem[];
        setInventoryCorpus(items);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addInventoryItem = async (item: Omit<PosInventoryItem, 'inventoryIdentifier'>) => {
    try {
      const inventoryCol = collection(db, 'inventory');
      await addDoc(inventoryCol, item);
    } catch (e) {
      console.error("Error adding inventory item:", e);
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<PosInventoryItem>) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error updating inventory item:", e);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting inventory item:", e);
    }
  };

  return (
    <InventoryContext.Provider value={{
      inventoryCorpus,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      loading
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be utilized within an InventoryProvider scope.');
  }
  return context;
}
