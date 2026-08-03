import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory, type PosInventoryItem } from '../context/InventoryContext';
import { useStoreSettings } from '../context/StoreContext';
import { MapPin, ChevronLeft, Phone, CheckCircle2, Plus, Minus, Search, ChevronRight } from 'lucide-react';

type CartItem = PosInventoryItem & { quantity: number };
type CheckoutPhase = 'HIDDEN' | 'CART' | 'LOCATION_FORM' | 'MPESA_PAYMENT' | 'SUCCESS';

const FoodOrbit = () => {
  const { settings } = useStoreSettings();
  const orbitItems = settings.orbitItems;
  
  return (
    <div className="relative w-full h-72 lg:h-96 overflow-hidden bg-brand-surface squircle-g2 flex items-center justify-center mb-6 shadow-sm border border-gray-100">
      <div className="text-center z-10 w-72 backdrop-blur-md bg-white/20 p-6 squircle-g2 shadow-sm border border-white/50">
        <h1 className="font-extrabold text-4xl text-brand-primary drop-shadow-md">{settings.heroTitle}</h1>
        <p className="font-bold text-sm text-gray-700 mt-2">{settings.heroSubtitle}</p>
      </div>
      
      {/* Outer Orbit Path */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute w-[22rem] h-[22rem] lg:w-[32rem] lg:h-[32rem] rounded-full border-[3px] border-dashed border-gray-200/50 flex items-center justify-center pointer-events-none"
      >
        {orbitItems.map((img, i) => {
          const angle = (i * 360) / orbitItems.length;
          // Desktop radius vs Mobile radius translation handling via CSS variables or fixed offsets
          return (
            <div 
              key={i} 
              className="absolute w-24 h-24 lg:w-32 lg:h-32 flex justify-center items-center"
              style={{ transform: `rotate(${angle}deg) translate(clamp(11rem, 20vw, 16rem)) rotate(-${angle}deg)` }}
            >
              {/* Ferris wheel counter-rotation to keep images upright */}
              <motion.img 
                src={img} 
                animate={{ rotate: -360 }} 
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="w-full h-full object-contain filter drop-shadow-2xl" 
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};


export default function DeliveryApp() {
  const { inventoryCorpus } = useInventory();
  const { settings } = useStoreSettings();
  
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
        let category = 'Others';
        const name = (item.culinaryNomenclature || '').toLowerCase();
        if (name.includes('chicken') || name.includes('combo')) category = 'Mains';
        if (name.includes('chips') || name.includes('fries') || name.includes('potato')) category = 'Sides';
        if (name.includes('soda') || name.includes('drink') || name.includes('water')) category = 'Drinks';
        return { ...item, category, currentPrice: item.deliveryValuation ?? item.retailValuation };
      });
  }, [inventoryCorpus]);

  const categories = ['All', 'Mains', 'Sides', 'Drinks'];

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


  // Shared UI logic for the Checkout forms mapped directly for both Desktop Sidebar and Mobile Bottom Sheet
  const renderCheckoutFlow = (phase: CheckoutPhase) => {
    return (
      <div className="flex-1 overflow-y-auto w-full relative pb-32">
        <AnimatePresence mode="wait">
          {phase === 'CART' && (
            <motion.div key="cart" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-5">
              
              {cartCorpus.length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                  Basket is empty.
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
                <input type="text" value={deliveryDetails.name} onChange={e => setDeliveryDetails({...deliveryDetails, name: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-text font-medium" placeholder="E.g., John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Delivery Phone</label>
                <input type="number" value={deliveryDetails.phone} onChange={e => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-text font-medium" placeholder="07XX XXX XXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Building / Apartment</label>
                <input type="text" value={deliveryDetails.building} onChange={e => setDeliveryDetails({...deliveryDetails, building: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-text font-medium" placeholder="E.g., Global Trade Center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Floor / Unit</label>
                <input type="text" value={deliveryDetails.floor} onChange={e => setDeliveryDetails({...deliveryDetails, floor: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-text font-medium" placeholder="E.g., 4th Floor, Room 402" />
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
              <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 drop-shadow-md" />
              <h2 className="text-3xl font-black mb-2 tracking-tight">Order Received!</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Our culinary team is preparing your meal.<br/>Expect delivery to <strong>{deliveryDetails.building}</strong>.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCheckoutActions = (phase: CheckoutPhase, isDesktop: boolean) => {
    if (cartCorpus.length === 0 && phase === 'CART') return null;

    return (
      <div className={`absolute inset-x-0 bottom-0 p-5 bg-white border-t border-gray-100 z-10 pt-4 ${isDesktop ? 'pb-5' : 'pb-8'} shadow-[0_-10px_20px_rgba(0,0,0,0.03)]`}>
          {phase === 'CART' && (
            <button 
              disabled={!settings.isStoreOpen}
              onClick={() => setCheckoutPhase('LOCATION_FORM')} 
              className="w-full bg-brand-text text-white py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
            >
              {settings.isStoreOpen ? <><>Setup Delivery</> <ChevronRight className="w-5 h-5"/></> : 'Store is Closed'}
            </button>
          )}
          {phase === 'LOCATION_FORM' && (
            <button disabled={!deliveryDetails.name || !deliveryDetails.building || !deliveryDetails.phone} onClick={() => setCheckoutPhase('MPESA_PAYMENT')} className="w-full bg-brand-primary text-brand-text py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex justify-center items-center gap-2">
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
    <div className="relative h-[100dvh] w-full bg-[#f8f9fa] text-brand-text flex justify-center overflow-hidden">
      
      {/* Root Layout Wrap - Expands to max-width on large screens */}
      <div className="w-full max-w-7xl h-full relative flex flex-col lg:flex-row overflow-hidden bg-white lg:bg-transparent">
        
        {/* LEFT COLUMN: Main App & Navigation */}
        <div className="flex-1 h-full flex flex-col bg-white lg:shadow-xl lg:mr-4 lg:rounded-r-3xl overflow-hidden relative z-10">
          
          <header className="px-5 lg:px-10 pt-6 pb-4 bg-white z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs font-bold text-brand-secondary tracking-widest uppercase mb-1">Delivering to</p>
                <div className="flex items-center gap-1 cursor-pointer">
                  <h2 className="font-extrabold text-lg flex items-center gap-1 truncate">
                    <MapPin className="fill-brand-primary w-5 h-5 border-2 border-white rounded-full shadow-sm" />
                    Your Location
                  </h2>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-primary p-2 flex items-center justify-center font-bold text-white shadow-md">
                G
              </div>
            </div>
            
            <div className="relative w-full shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-full border border-gray-100">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="What are you craving?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-full outline-none focus:ring-2 focus:ring-brand-primary/40 font-medium transition-all"
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-10 px-5 lg:px-10">
            
            <FoodOrbit />

            <section className="sticky top-0 bg-white/90 backdrop-blur-md z-20 py-2 -mx-5 px-5 lg:-mx-10 lg:px-10">
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${activeCategory === cat ? 'bg-brand-text text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8 pb-10">
              <h3 className="font-black text-2xl mb-6 tracking-tight">Our Menu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredMenu.map((product) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={product.inventoryIdentifier} 
                    className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:shadow-lg transition-all group"
                  >
                    <div className="w-full sm:w-28 h-32 sm:h-auto shrink-0 bg-[#f8f9fa] rounded-2xl flex items-center justify-center p-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          <button onClick={() => addToCart(product)} className="w-full sm:w-auto bg-gray-100 hover:bg-brand-primary text-brand-text font-bold text-sm md:text-xs px-6 lg:px-4 py-3 lg:py-2 flex justify-center rounded-full transition-colors items-center gap-2">
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
        <div className="hidden lg:flex w-[400px] xl:w-[450px] shrink-0 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] h-full rounded-l-3xl overflow-hidden flex-col relative z-20">
          <div className="flex items-center px-6 py-6 border-b border-gray-100 bg-white z-10 sticky top-0">
            {activeDesktopPhase !== 'CART' && activeDesktopPhase !== 'SUCCESS' && (
              <button 
                onClick={() => {
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
              {activeDesktopPhase === 'LOCATION_FORM' && 'Delivery Details'}
              {activeDesktopPhase === 'MPESA_PAYMENT' && 'Checkout Gateway'}
              {activeDesktopPhase === 'SUCCESS' && 'Verified'}
            </h3>
          </div>
          
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
                  className="w-full bg-brand-text text-white p-4 rounded-full shadow-2xl flex justify-between items-center transform transition-transform active:scale-95"
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
                  className="absolute inset-x-0 bottom-0 bg-white z-40 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden h-[90vh]"
                >
                  
                  <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white z-10 sticky top-0">
                    <button 
                      onClick={() => {
                        if (checkoutPhase === 'SUCCESS' || checkoutPhase === 'CART') { setCheckoutPhase('HIDDEN'); if(checkoutPhase === 'SUCCESS') setCartCorpus([]); } 
                        else if (checkoutPhase === 'LOCATION_FORM') setCheckoutPhase('CART');
                        else if (checkoutPhase === 'MPESA_PAYMENT') setCheckoutPhase('LOCATION_FORM');
                      }}
                      className="p-2 bg-gray-100 rounded-full text-brand-text absolute left-4 active:bg-gray-200"
                    >
                      {checkoutPhase === 'CART' || checkoutPhase === 'SUCCESS' ? <ChevronLeft className="w-5 h-5 -rotate-90" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                    <h3 className="w-full text-center font-black text-lg">
                      {checkoutPhase === 'CART' && 'Your Basket'}
                      {checkoutPhase === 'LOCATION_FORM' && 'Delivery Details'}
                      {checkoutPhase === 'MPESA_PAYMENT' && 'M-Pesa Gateway'}
                      {checkoutPhase === 'SUCCESS' && 'Confirmed'}
                    </h3>
                  </div>

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
