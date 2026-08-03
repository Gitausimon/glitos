import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type PosInventoryItem = {
  inventoryIdentifier: string;
  culinaryNomenclature: string;
  retailValuation: number;
  deliveryValuation: number;
  isAvailableForDelivery: boolean;
  stockAvailability: boolean;
  visualAssetUri: string;
};

const DEFAULT_INVENTORY: PosInventoryItem[] = [
  { inventoryIdentifier: 'chx-01', culinaryNomenclature: 'Quarter Chicken', retailValuation: 350, deliveryValuation: 400, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/quarter_chicken.png' },
  { inventoryIdentifier: 'chx-02', culinaryNomenclature: 'Half Chicken', retailValuation: 650, deliveryValuation: 700, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/half_chicken.png' },
  { inventoryIdentifier: 'chp-01', culinaryNomenclature: 'Crispy Chips', retailValuation: 150, deliveryValuation: 200, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/crispy_chips.png' },
  { inventoryIdentifier: 'bev-01', culinaryNomenclature: 'Soda 500ml', retailValuation: 100, deliveryValuation: 150, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/soda_cup.png' },
  { inventoryIdentifier: 'cb-01', culinaryNomenclature: 'Glitos Combo', retailValuation: 450, deliveryValuation: 550, isAvailableForDelivery: true, stockAvailability: true, visualAssetUri: '/images/glitos_combo.png' },
];

type InventoryContextType = {
  inventoryCorpus: PosInventoryItem[];
  addInventoryItem: (item: Omit<PosInventoryItem, 'inventoryIdentifier'>) => void;
  updateInventoryItem: (id: string, updates: Partial<PosInventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventoryCorpus, setInventoryCorpus] = useState<PosInventoryItem[]>(() => {
    const cached = localStorage.getItem('glitos-inventory-layer');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return DEFAULT_INVENTORY;
      }
    }
    return DEFAULT_INVENTORY;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('glitos-inventory-layer', JSON.stringify(inventoryCorpus));
  }, [inventoryCorpus]);

  const addInventoryItem = (item: Omit<PosInventoryItem, 'inventoryIdentifier'>) => {
    const newItem = {
      ...item,
      // Immutable token generator for mock database
      inventoryIdentifier: `gen-${Math.random().toString(36).substring(2, 9)}`
    };
    setInventoryCorpus(prev => [...prev, newItem]);
  };

  const updateInventoryItem = (id: string, updates: Partial<PosInventoryItem>) => {
    setInventoryCorpus(prev => 
      prev.map(item => item.inventoryIdentifier === id ? { ...item, ...updates } : item)
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryCorpus(prev => prev.filter(item => item.inventoryIdentifier !== id));
  };

  return (
    <InventoryContext.Provider value={{
      inventoryCorpus,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem
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
