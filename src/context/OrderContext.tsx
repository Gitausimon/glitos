import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';

export type OrderItem = {
  inventoryIdentifier: string;
  culinaryNomenclature: string;
  retailValuation: number;
  sessionQuantity: number;
};

export type Order = {
  id?: string;
  txnHash: string;
  ledgerTimestamp: string;
  financialMagnitude: number;
  actionTypology: string;
  actorIdentity: string;
  items: OrderItem[];
};

type OrderContextType = {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  loading: boolean;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('ledgerTimestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders: Order[] = [];
      snapshot.forEach((doc) => {
        liveOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(liveOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addOrder = async (orderData: Omit<Order, 'id'>) => {
    try {
      await addDoc(collection(db, 'transactions'), orderData);
    } catch (error) {
      console.error("Error adding order document: ", error);
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, loading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
