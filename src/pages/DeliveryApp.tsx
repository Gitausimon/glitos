import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory, type PosInventoryItem } from '../context/InventoryContext';
import { useStoreSettings } from '../context/StoreContext';
import { MapPin, ChevronLeft, CheckCircle2, Plus, Minus, Search, ChevronRight, ShoppingBag, AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
type CartItem = PosInventoryItem & { quantity: number };
type CheckoutPhase = 'HIDDEN' | 'CART' | 'AUTH' | 'LOCATION_FORM' | 'MPESA_PAYMENT' | 'SUCCESS';

import CategoryBubbles from '../components/CategoryBubbles';


export default function DeliveryApp() {
  const { inventoryCorpus } = useInventory();
  const { settings } = useStoreSettings();
  const { currentUser, signInWithGoogle, logout } = useAuth();
  
  // States
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCorpus, setCartCorpus] = useState<CartItem[]>([]);
  
  // Notice: 'HIDDEN' is used strictly for mobile bottom sheet. 
  // On desktop, the sidebar is always visible and defaults to 'CART' if hidden.
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>('HIDDEN');
  
  const [deliveryDetails, setDeliveryDetails] = useState({ name: '', building: '', floor: '', phone: '' });
  const [paymentPhone, setPaymentPhone] = useState('');
  const [geoCoords, setGeoCoords] = useState<{lat: number, lon: number} | null>(null);

  // Trigger Geolocation when entering the Location Form phase
  useEffect(() => {
    if (checkoutPhase === 'LOCATION_FORM' && !geoCoords) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeoCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
          },
          (err) => {
            console.warn("GPS Permission Denied. Falling back to default coordinate.", err);
            setGeoCoords({ lat: -1.286389, lon: 36.817223 }); // Default: Nairobi
          }
        );
      } else {
        setGeoCoords({ lat: -1.286389, lon: 36.817223 });
      }
    }
  }, [checkoutPhase, geoCoords]);

  const categorizedMenu = useMemo(() => {
    return inventoryCorpus
      .filter(item => item.isAvailableForDelivery !== false)
      .map(item => {
        let category = 'Breakfast & Snacks'; // Default
        const name = (item.culinaryNomenclature || '').toLowerCase();
        if (name.includes('chicken') || name.includes('combo') || name.includes('burger')) category = 'Chicken';
        if (name.includes('chips') || name.includes('fries') || name.includes('potato')) category = 'Chips & Sides';
        if (name.includes('soda') || name.includes('drink') || name.includes('water') || name.includes('coke')) category = 'Drinks';
        if (name.includes('bag') || name.includes('package') || name.includes('box')) category = 'Packaging';
        return { ...item, category, currentPrice: item.deliveryValuation ?? item.retailValuation };
      });
  }, [inventoryCorpus]);

  const filteredMenu = categorizedMenu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = (item.culinaryNomenclature || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cartCorpus.reduce((acc, item) => acc + ((item.deliveryValuation ?? item.retailValuation) * item.quantity), 0);
  const grandTotal = cartTotal + (cartCorpus.length > 0 ? settings.deliveryFee : 0);
  const activeDesktopPhase = (checkoutPhase === 'HIDDEN' || cartCorpus.length === 0) && checkoutPhase !== 'SUCCESS' ? 'CART' : checkoutPhase;

  const addToCart = (product: PosInventoryItem) => {
    setCartCorpus(prev => {
      const existing = prev.find(i => i.inventoryIdentifier === product.inventoryIdentifier);
      if (existing) {
        return prev.map(i => i.inventoryIdentifier === product.inventoryIdentifier ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Auto-open UI if first item added
    if (checkoutPhase === 'HIDDEN') setCheckoutPhase('CART');
  };

  const deductFromCart = (id: string) => {
    setCartCorpus(prev => {
      const existing = prev.find(i => i.inventoryIdentifier === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.inventoryIdentifier === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      const updated = prev.filter(i => i.inventoryIdentifier !== id);
      if (updated.length === 0 && checkoutPhase === 'CART') setCheckoutPhase('HIDDEN'); // Hide drawer on mobile if empty
      return updated;
    });
  };

  const crossSellItems = useMemo(() => {
    const cartIds = cartCorpus.map(i => i.inventoryIdentifier);
    return categorizedMenu.filter(i => !cartIds.includes(i.inventoryIdentifier) && i.category !== 'Drinks').slice(0, 3);
  }, [cartCorpus, categorizedMenu]);


  // Checkout progress indicator
  const CheckoutStepper = ({ phase }: { phase: CheckoutPhase }) => {
    const steps = [
      { key: 'CART', label: 'Cart' },
      { key: 'AUTH', label: 'Account' },
      { key: 'LOCATION_FORM', label: 'Location' },
      { key: 'MPESA_PAYMENT', label: 'Payment' },
      { key: 'SUCCESS', label: 'Done' },
    ];
    const currentIndex = steps.findIndex(s => s.key === phase);
    
    if (phase === 'HIDDEN' || (phase === 'CART' && cartCorpus.length === 0)) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-100">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
              i <= currentIndex ? 'bg-brand-secondary text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-semibold ml-1.5 hidden sm:inline ${
              i <= currentIndex ? 'text-brand-secondary' : 'text-gray-400'
            }`}>{step.label}</span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                i < currentIndex ? 'bg-brand-secondary' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };


  // Shared UI logic for the Checkout forms mapped directly for both Desktop Sidebar and Mobile Bottom Sheet
  const renderCheckoutFlow = (phase: CheckoutPhase) => {
    return (
      <div className="flex-1 overflow-y-auto w-full relative pb-32">
        <AnimatePresence mode="wait">
          {phase === 'CART' && (
            <motion.div key="cart" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-5">
              
              {cartCorpus.length === 0 ? (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-brand-secondary" />
                  </div>
                  <p className="font-bold text-gray-500">Your basket is empty</p>
                  <p className="text-sm text-gray-400">Browse our menu and add items to get started</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {cartCorpus.map(item => (
                    <div key={item.inventoryIdentifier} className="flex items-center gap-4 border-b border-gray-50 pb-4">
                      <img src={item.visualAssetUri} className="w-16 h-16 object-contain bg-gray-50 rounded-xl p-1 shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-snug">{item.culinaryNomenclature}</h4>
                        <p className="text-brand-secondary font-black text-xs">KES {item.deliveryValuation ?? item.retailValuation}</p>
                      </div>
                      <div className="flex items-center bg-gray-100 rounded-full px-1 py-1 gap-2 shrink-0">
                        <button onClick={() => deductFromCart(item.inventoryIdentifier)} className="bg-white p-1 rounded-full"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-sm w-3 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="bg-brand-primary p-1 rounded-full"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between font-bold text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <span>Subtotal</span>
                    <span>KES {cartTotal}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-500 pt-2 pb-2">
                    <span>Delivery Fee</span>
                    <span>KES {settings.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-black text-xl pt-2">
                    <span>Total</span>
                    <span>KES {grandTotal}</span>
                  </div>
                </div>
              )}

              {crossSellItems.length > 0 && cartCorpus.length > 0 && (
                <div className="pt-4 border-t-2 border-gray-50 border-dashed">
                  <h4 className="font-black text-sm mb-4 text-brand-text flex items-center gap-2">
                    <span>🌟</span> People also order
                  </h4>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {crossSellItems.map(rec => (
                      <div key={rec.inventoryIdentifier} className="w-32 shrink-0 bg-white border border-gray-100 shadow-sm rounded-2xl p-2 flex flex-col items-center">
                        <img src={rec.visualAssetUri} className="w-16 h-16 object-contain drop-shadow-sm mb-2" />
                        <h5 className="font-bold text-xs text-center leading-tight mb-1 truncate w-full">{rec.culinaryNomenclature}</h5>
                        <p className="text-brand-secondary font-black text-[10px] mb-2">KES {rec.currentPrice}</p>
                        <button onClick={() => addToCart(rec)} className="w-full bg-brand-primary text-xs font-bold py-1 rounded-full active:scale-95 transition-transform">Add</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {phase === 'AUTH' && (
            <motion.div key="auth" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-8 flex flex-col items-center justify-center h-full gap-6 text-center mt-10">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                <LogIn className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="font-black text-2xl tracking-tight mb-2">Create an Account</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">Sign in with Google to save your delivery addresses and track past orders easily.</p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    setCheckoutPhase('LOCATION_FORM');
                  } catch (e) {
                    alert("Failed to sign in. Please try again.");
                  }
                }}
                className="w-full sm:w-auto bg-white border-2 border-gray-200 px-6 py-4 squircle-g2 flex items-center justify-center gap-3 font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                Continue with Google
              </button>
            </motion.div>
          )}

          {phase === 'LOCATION_FORM' && (
            <motion.div key="location" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="p-6 space-y-5">
              
              <div className="w-full h-40 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                {geoCoords ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0 }} 
                    src={`https://maps.google.com/maps?q=${geoCoords.lat},${geoCoords.lon}&z=15&output=embed`} 
                    allowFullScreen 
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center flex-col text-gray-400 gap-2">
                    <MapPin className="w-8 h-8 animate-bounce mb-1 text-brand-primary" />
                    <span className="font-bold text-sm tracking-wide">Acquiring GPS Signal...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                <input type="text" value={deliveryDetails.name} onChange={e => setDeliveryDetails({...deliveryDetails, name: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-secondary font-medium" placeholder="E.g., John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Delivery Phone</label>
                <input type="number" value={deliveryDetails.phone} onChange={e => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-secondary font-medium" placeholder="07XX XXX XXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Building / Apartment</label>
                <input type="text" value={deliveryDetails.building} onChange={e => setDeliveryDetails({...deliveryDetails, building: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-secondary font-medium" placeholder="E.g., Global Trade Center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Floor / Unit</label>
                <input type="text" value={deliveryDetails.floor} onChange={e => setDeliveryDetails({...deliveryDetails, floor: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-secondary font-medium" placeholder="E.g., 4th Floor, Room 402" />
              </div>
            </motion.div>
          )}

          {phase === 'MPESA_PAYMENT' && (
            <motion.div key="payment" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="p-6 space-y-6">
              <div className="bg-[#52B44B]/10 p-5 rounded-2xl border border-[#52B44B]/20 flex flex-col items-center mb-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="h-8 mb-3" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <p className="text-sm font-bold text-[#52B44B] text-center">Secure M-Pesa Gateway</p>
                  <p className="text-xs text-[#52B44B]/80 text-center font-medium mt-1">An STK push will be triggered.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">M-Pesa Phone</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">07</span>
                  <input type="number" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#52B44B] font-bold tracking-widest text-lg" placeholder="XX XXX XXX" maxLength={8} />
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'SUCCESS' && (
            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 flex flex-col justify-center items-center h-full text-center mt-10">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <CheckCircle2 className="w-24 h-24 text-brand-secondary mb-6 drop-shadow-md" />
              </motion.div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Order Received!</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Our culinary team is preparing your meal.<br/>Expect delivery to <strong>{deliveryDetails.building}</strong>.</p>
              
              {/* Celebration dots */}
              <div className="flex gap-2 mt-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={i}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [-10, 0], opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1, repeat: 2, repeatType: "reverse" }}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ['#FFC244', '#00A082', '#8EC042', '#FFC244', '#00A082'][i] }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCheckoutActions = (phase: CheckoutPhase, isDesktop: boolean) => {
    if (cartCorpus.length === 0 && phase === 'CART') return null;

    return (
      <div className={`absolute inset-x-0 bottom-0 p-5 bg-brand-surface border-t border-gray-100 z-10 pt-4 ${isDesktop ? 'pb-5' : 'pb-8'} shadow-[0_-10px_20px_rgba(0,0,0,0.03)] transition-colors`}>
          {phase === 'CART' && (
            <button 
              disabled={!settings.isStoreOpen}
              onClick={() => {
                if (currentUser) {
                  setCheckoutPhase('LOCATION_FORM');
                } else {
                  setCheckoutPhase('AUTH');
                }
              }} 
              className="w-full bg-brand-text text-white py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
            >
              {settings.isStoreOpen ? <><>Setup Delivery</> <ChevronRight className="w-5 h-5"/></> : 'Store is Closed'}
            </button>
          )}
          {phase === 'LOCATION_FORM' && (
            <button disabled={!deliveryDetails.name || !deliveryDetails.building || !deliveryDetails.phone} onClick={() => setCheckoutPhase('MPESA_PAYMENT')} className="w-full bg-brand-secondary text-white py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex justify-center items-center gap-2">
              Proceed to Payment <ChevronRight className="w-5 h-5"/>
            </button>
          )}
          {phase === 'MPESA_PAYMENT' && (
            <button 
               disabled={paymentPhone.length < 8}
               onClick={() => {
                 setTimeout(() => setCheckoutPhase('SUCCESS'), 800);
               }} 
               className="w-full bg-[#52B44B] text-white py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex justify-center items-center gap-2"
            >
              Pay KES {grandTotal} & Checkout
            </button>
          )}
          {phase === 'SUCCESS' && (
            <button 
               onClick={() => { setCheckoutPhase('HIDDEN'); setCartCorpus([]); }}
               className="w-full bg-brand-secondary text-white py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform"
            >
              Start New Order
            </button>
          )}
      </div>
    );
  };

  return (
    <div className="relative h-[100dvh] w-full bg-brand-background text-brand-text flex justify-center overflow-hidden transition-colors">
      
      {/* Root Layout Wrap - Expands to max-width on large screens */}
      <div className="w-full max-w-7xl h-full relative flex flex-col lg:flex-row overflow-hidden bg-brand-surface lg:bg-transparent lg:dark:bg-transparent transition-colors">
        
        {/* LEFT COLUMN: Main App & Navigation */}
        <div className="flex-1 h-full flex flex-col bg-brand-surface lg:shadow-xl lg:mr-4 lg:rounded-r-3xl overflow-hidden relative z-10 transition-colors">
          
          {/* Store Closed Banner */}
          <AnimatePresence>
            {!settings.isStoreOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-500 text-white px-5 py-3 flex items-center justify-center gap-2 overflow-hidden"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-bold text-sm">We're currently closed — browse the menu, ordering opens soon!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <header className="px-5 lg:px-10 pt-6 pb-2 bg-[#FFC533] z-10 transition-colors">
            <div className="flex justify-between items-start sm:items-center mb-6 gap-2">
              <div className="flex flex-col gap-2">
                <img src="/glitoslogo.svg" alt="Glitos Logo" className="h-10 sm:h-12 w-auto" />
                <div className="flex items-center gap-1 cursor-pointer">
                  <p className="text-[10px] font-bold text-brand-secondary tracking-widest uppercase">Delivering to</p>
                  <h2 className="font-extrabold text-sm sm:text-lg flex items-center gap-1 truncate text-brand-text">
                    <MapPin className="fill-brand-surface text-[#FFC533] w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-sm" />
                    {currentUser ? 'Your Location' : 'Select Location'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {currentUser ? (
                  <button onClick={logout} className="h-10 px-4 rounded-full bg-gray-100/80 hover:bg-red-50 hover:text-red-600 font-bold text-gray-700 shadow-sm text-xs transition-colors flex items-center">
                    Logout
                  </button>
                ) : (
                  <button onClick={() => setCheckoutPhase('AUTH')} className="h-10 px-4 rounded-full bg-brand-secondary text-white font-bold shadow-md text-xs hover:bg-opacity-90 transition-all flex items-center">
                    Log In
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative w-full shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-full border border-gray-100">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="What can we get you?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-brand-background border-none rounded-full outline-none focus:ring-2 focus:ring-brand-secondary/40 font-medium transition-all"
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-10 px-5 lg:px-10">
            
            <CategoryBubbles 
              activeCategory={activeCategory} 
              onSelectCategory={(cat) => setActiveCategory(cat.replace('\n', ' '))} 
            />

            <section className="mt-8 pb-10">
              <h3 className="font-black text-2xl mb-6 tracking-tight">Our Menu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredMenu.map((product) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    key={product.inventoryIdentifier} 
                    className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch p-4 rounded-3xl bg-brand-surface border border-gray-100 shadow-sm hover:border-brand-secondary/30 hover:shadow-lg transition-all group"
                  >
                    <div className="w-full sm:w-28 h-32 sm:h-auto shrink-0 bg-brand-background rounded-2xl flex items-center justify-center p-2 relative overflow-hidden transition-colors">
                      <div className="absolute inset-0 bg-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img src={product.visualAssetUri} alt={product.culinaryNomenclature} className="w-24 h-24 sm:w-full sm:h-full object-contain filter drop-shadow-md z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1 w-full text-center sm:text-left">
                      <div>
                        <h4 className="font-bold text-base md:text-lg leading-snug">{product.culinaryNomenclature}</h4>
                        <p className="text-brand-secondary font-black text-sm mt-1">KES {product.currentPrice}</p>
                      </div>
                      
                      <div className="flex items-center justify-center sm:justify-end mt-4 sm:mt-2">
                        {cartCorpus.find(i => i.inventoryIdentifier === product.inventoryIdentifier) ? (
                          <div className="flex items-center bg-gray-100 rounded-full px-1 py-1 shadow-inner gap-3">
                            <button onClick={() => deductFromCart(product.inventoryIdentifier)} className="bg-white p-2 sm:p-1.5 rounded-full text-brand-text shadow-sm hover:bg-gray-50"><Minus className="w-4 h-4 font-bold" /></button>
                            <span className="font-black text-sm w-4 text-center">{cartCorpus.find(i => i.inventoryIdentifier === product.inventoryIdentifier)?.quantity}</span>
                            <button onClick={() => addToCart(product)} className="bg-brand-primary text-brand-text p-2 sm:p-1.5 rounded-full shadow-sm hover:bg-brand-primary/90"><Plus className="w-4 h-4 font-bold" /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(product)} className="w-full sm:w-auto bg-brand-secondary/10 hover:bg-brand-secondary hover:text-white text-brand-secondary border border-brand-secondary/20 font-bold text-sm md:text-xs px-6 lg:px-4 py-3 lg:py-2 flex justify-center rounded-full transition-colors items-center gap-2">
                            <Plus className="w-4 h-4" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredMenu.length === 0 && (
                <div className="text-center text-brand-muted py-20 font-bold border-2 border-dashed border-gray-100 rounded-3xl mt-6">
                   Adjust filters. Nothing found in '{activeCategory}'.
                </div>
              )}
            </section>
          </main>
        </div>


        {/* RIGHT COLUMN: Desktop Permanent Sidebar */}
        <div className="hidden lg:flex w-[400px] xl:w-[450px] shrink-0 bg-brand-surface shadow-[-10px_0_30px_rgba(0,0,0,0.02)] h-full rounded-l-3xl overflow-hidden flex-col relative z-20 transition-colors">
          <div className="flex items-center px-6 py-6 border-b border-gray-100 bg-brand-surface z-10 sticky top-0 transition-colors">
            {activeDesktopPhase !== 'CART' && activeDesktopPhase !== 'SUCCESS' && (
              <button 
                onClick={() => {
                  if (activeDesktopPhase === 'AUTH') setCheckoutPhase('CART');
                  if (activeDesktopPhase === 'LOCATION_FORM') setCheckoutPhase('CART');
                  if (activeDesktopPhase === 'MPESA_PAYMENT') setCheckoutPhase('LOCATION_FORM');
                }}
                className="p-2 bg-gray-100 rounded-full text-brand-text absolute left-6 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="w-full text-center font-black text-xl tracking-tight">
              {activeDesktopPhase === 'CART' && 'Your Basket'}
              {activeDesktopPhase === 'AUTH' && 'Sign In'}
              {activeDesktopPhase === 'LOCATION_FORM' && 'Delivery Details'}
              {activeDesktopPhase === 'MPESA_PAYMENT' && 'Checkout Gateway'}
              {activeDesktopPhase === 'SUCCESS' && 'Verified'}
            </h3>
          </div>
          
          <CheckoutStepper phase={activeDesktopPhase} />
          {renderCheckoutFlow(activeDesktopPhase)}
          {renderCheckoutActions(activeDesktopPhase, true)}
        </div>


        {/* MOBILE ONLY: Floating Cart Launcher & Bottom Sheet Overlay */}
        <div className="lg:hidden">
          <AnimatePresence>
            {(cartCorpus.length > 0 && checkoutPhase === 'HIDDEN') && (
              <motion.div
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="absolute bottom-6 inset-x-5 z-20"
              >
                <button 
                  onClick={() => setCheckoutPhase('CART')}
                  className="w-full bg-brand-secondary text-white p-4 rounded-full shadow-2xl flex justify-between items-center transform transition-transform active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      {cartCorpus.reduce((acc, item) => acc + item.quantity, 0)}
                    </div>
                    <span className="font-bold">Checkout Flow</span>
                  </div>
                  <span className="font-black text-lg">KES {grandTotal}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {checkoutPhase !== 'HIDDEN' && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 z-30" 
                  onClick={() => setCheckoutPhase('HIDDEN')}
                />
                
                <motion.div 
                  initial={{ y: '100%' }} animate={{ y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }} exit={{ y: '100%', transition: { type: 'spring', damping: 25, stiffness: 200 } }}
                  className="absolute inset-x-0 bottom-0 bg-brand-surface z-40 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden h-[90vh] transition-colors"
                >
                  
                  <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-brand-surface z-10 sticky top-0 transition-colors">
                    <button 
                      onClick={() => {
                        if (checkoutPhase === 'SUCCESS' || checkoutPhase === 'CART') { setCheckoutPhase('HIDDEN'); if(checkoutPhase === 'SUCCESS') setCartCorpus([]); } 
                        else if (checkoutPhase === 'AUTH') setCheckoutPhase('CART');
                        else if (checkoutPhase === 'LOCATION_FORM') setCheckoutPhase('CART');
                        else if (checkoutPhase === 'MPESA_PAYMENT') setCheckoutPhase('LOCATION_FORM');
                      }}
                      className="p-2 bg-gray-100 rounded-full text-brand-text absolute left-4 active:bg-gray-200"
                    >
                      {checkoutPhase === 'CART' || checkoutPhase === 'SUCCESS' ? <ChevronLeft className="w-5 h-5 -rotate-90" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                    <h3 className="w-full text-center font-black text-lg">
                      {checkoutPhase === 'CART' && 'Your Basket'}
                      {checkoutPhase === 'AUTH' && 'Sign In'}
                      {checkoutPhase === 'LOCATION_FORM' && 'Delivery Details'}
                      {checkoutPhase === 'MPESA_PAYMENT' && 'M-Pesa Gateway'}
                      {checkoutPhase === 'SUCCESS' && 'Confirmed'}
                    </h3>
                  </div>

                  <CheckoutStepper phase={checkoutPhase} />
                  {renderCheckoutFlow(checkoutPhase)}
                  {renderCheckoutActions(checkoutPhase, false)}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
