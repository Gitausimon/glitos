import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type StoreSettings = {
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
  updateSettings: (updates: Partial<StoreSettings>) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const cached = localStorage.getItem('glitos-store-settings');
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('glitos-store-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <StoreContext.Provider value={{ settings, updateSettings }}>
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
