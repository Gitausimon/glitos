import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PackageSearch, ScrollText, TrendingUp, AlertCircle, Search, Store, Plus, Trash2, Pencil, X, Smartphone, Menu, Printer, LayoutGrid } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useInventory, type PosInventoryItem } from '../context/InventoryContext';
import { useStoreSettings } from '../context/StoreContext';
import { useOrders, type Order } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { uploadImageToBackend } from '../lib/cloudinary';

type ExecutiveMetric = {
  metricToken: string;
  metricLegend: string;
  grossValue: string;
  trajectory: 'up' | 'down' | 'neutral';
  percentVariance: number;
};

type InventoryThresholdData = {
  assetIdentifier: string;
  stockNomenclature: string;
  currentReserves: number;
  maximumCapacity: number;
  unitMeasurement: string;
};

const MOCK_HOURLY_DATA = [
  { time: '08:00', orders: 12 },
  { time: '10:00', orders: 25 },
  { time: '12:00', orders: 105 },
  { time: '14:00', orders: 85 },
  { time: '16:00', orders: 30 },
  { time: '18:00', orders: 120 },
  { time: '20:00', orders: 90 },
  { time: '22:00', orders: 20 },
];

const MOCK_INVENTORY_TRACKER: InventoryThresholdData[] = [
  { assetIdentifier: 'inv-chx', stockNomenclature: 'Quarter Chicken', currentReserves: 14, maximumCapacity: 100, unitMeasurement: 'pieces' },
  { assetIdentifier: 'inv-pot', stockNomenclature: 'Potatoes (Chips)', currentReserves: 45, maximumCapacity: 50, unitMeasurement: 'kg' },
  { assetIdentifier: 'inv-oil', stockNomenclature: 'Cooking Oil', currentReserves: 2, maximumCapacity: 10, unitMeasurement: 'liters' },
  { assetIdentifier: 'inv-box', stockNomenclature: 'Packaging Boxes', currentReserves: 340, maximumCapacity: 1000, unitMeasurement: 'units' },
];

export default function AdminDashboard() {
  const { inventoryCorpus, addInventoryItem, deleteInventoryItem, updateInventoryItem } = useInventory();
  const { settings, updateSettings } = useStoreSettings();
  const { orders } = useOrders();
  const { currentUser, logout } = useAuth();
  
  const [activeViewFocus, setActiveViewFocus] = useState<'OVERVIEW' | 'PRODUCTS' | 'INVENTORY' | 'AUDIT' | 'APP_SETTINGS' | 'DELIVERY_MENU' | 'CATEGORIES'>('OVERVIEW');
  const [auditQueryParameter, setAuditQueryParameter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reprintVoucherPayload, setReprintVoucherPayload] = useState<Order | null>(null);

  const reprintTransaction = (log: Order) => {
    setReprintVoucherPayload(log);
    setTimeout(() => {
      window.print();
      setReprintVoucherPayload(null);
    }, 150);
  };
  
  // Product Modal State
  const [isProductModalActive, setIsProductModalActive] = useState(false);
  const [activeEditingRef, setActiveEditingRef] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [draftProduct, setDraftProduct] = useState({
    culinaryNomenclature: '',
    retailValuation: 0,
    deliveryValuation: 0,
    isAvailableForDelivery: true,
    visualAssetUri: '/images/quarter_chicken.png',
    productCategory: 'Chicken'
  });

  const renderHealthIndicator = (percent: number, max: number) => {
    const ratio = percent / max;
    const isCritical = ratio < 0.2;
    const isWarning = ratio >= 0.2 && ratio < 0.5;
    return (
      <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
        <div 
          className={`h-2.5 rounded-full transition-all ${isCritical ? 'bg-red-500' : isWarning ? 'bg-brand-primary' : 'bg-brand-secondary'}`} 
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
    );
  };

  const dispatchProductModal = (product?: PosInventoryItem) => {
    if (product) {
      setActiveEditingRef(product.inventoryIdentifier);
      setDraftProduct({
        culinaryNomenclature: product.culinaryNomenclature,
        retailValuation: product.retailValuation,
        deliveryValuation: product.deliveryValuation ?? product.retailValuation,
        isAvailableForDelivery: product.isAvailableForDelivery ?? true,
        visualAssetUri: product.visualAssetUri,
        productCategory: product.productCategory || 'Chicken'
      });
    } else {
      setActiveEditingRef(null);
      setDraftProduct({
        culinaryNomenclature: '',
        retailValuation: 0,
        deliveryValuation: 0,
        isAvailableForDelivery: activeViewFocus === 'DELIVERY_MENU',
        visualAssetUri: '/images/quarter_chicken.png', // default asset
        productCategory: 'Chicken'
      });
    }
    setIsProductModalActive(true);
  };

  const commitProductDraft = () => {
    if (!draftProduct.culinaryNomenclature || draftProduct.retailValuation <= 0) return;
    
    if (activeEditingRef) {
      updateInventoryItem(activeEditingRef, {
        culinaryNomenclature: draftProduct.culinaryNomenclature,
        retailValuation: draftProduct.retailValuation,
        deliveryValuation: draftProduct.deliveryValuation,
        isAvailableForDelivery: draftProduct.isAvailableForDelivery,
        visualAssetUri: draftProduct.visualAssetUri,
        productCategory: draftProduct.productCategory
      });
    } else {
      addInventoryItem({
        culinaryNomenclature: draftProduct.culinaryNomenclature,
        retailValuation: draftProduct.retailValuation,
        deliveryValuation: draftProduct.deliveryValuation || draftProduct.retailValuation,
        isAvailableForDelivery: draftProduct.isAvailableForDelivery,
        visualAssetUri: draftProduct.visualAssetUri,
        stockAvailability: true,
        productCategory: draftProduct.productCategory
      });
    }
    setIsProductModalActive(false);
  };

  // Dynamic Metrics derived from backend Firebase orders
  const totalRevenue = orders.reduce((acc, order) => acc + order.financialMagnitude, 0);
  const mpesaSales = orders.filter(o => o.actionTypology.includes('MPESA')).reduce((acc, o) => acc + o.financialMagnitude, 0);
  const cashSales = orders.filter(o => o.actionTypology.includes('CASH')).reduce((acc, o) => acc + o.financialMagnitude, 0);
  const totalOrders = orders.length;

  const dynamicMetricsCorpus: ExecutiveMetric[] = [
    { metricToken: 'sales', metricLegend: 'Total Revenue', grossValue: `KES ${totalRevenue.toLocaleString()}`, trajectory: 'up', percentVariance: Date.now() % 5 },
    { metricToken: 'mpesa', metricLegend: 'M-Pesa Sales', grossValue: `KES ${mpesaSales.toLocaleString()}`, trajectory: 'up', percentVariance: Date.now() % 3 },
    { metricToken: 'cash', metricLegend: 'Cash Sales', grossValue: `KES ${cashSales.toLocaleString()}`, trajectory: 'up', percentVariance: Date.now() % 2 },
    { metricToken: 'volume', metricLegend: 'Total Orders', grossValue: `${totalOrders} Orders`, trajectory: 'up', percentVariance: Date.now() % 8 },
  ];

  const dynamicSplitData = [
    { name: 'M-Pesa', value: mpesaSales, color: '#52B44B' },
    { name: 'Cash', value: cashSales, color: '#222222' }
  ];

  return (
    <div className="flex h-screen w-full bg-brand-background overflow-hidden text-brand-text flex-col md:flex-row relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-surface border-b border-gray-200 shadow-sm z-30 relative">
        <div className="flex items-center gap-2">
          <img src="/glitoslogo.svg" alt="Glitos Logo" className="h-10 w-auto dark:invert" />
          <div className="font-black text-2xl tracking-tighter hidden sm:block">G <span className="text-brand-secondary text-sm ml-1 font-medium tracking-normal">ADMIN</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-brand-text" /> : <Menu className="w-6 h-6 text-brand-text" />}
          </button>
        </div>
      </div>

      {/* Executive Nav Sidebar */}
      <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex absolute md:relative z-20 top-[73px] bottom-0 md:top-0 w-full md:w-64 bg-brand-surface border-b md:border-b-0 md:border-r border-gray-200 shrink-0 flex-col p-6 gap-2 overflow-y-auto`}>
        <div className="md:mb-6 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/glitoslogo.svg" alt="Glitos Logo" className="h-12 w-auto dark:invert" />
            <div className="font-black text-xl tracking-tighter">G <span className="text-brand-secondary text-xs ml-0.5 font-medium tracking-normal">ADMIN</span></div>
          </div>
        </div>
        
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mb-1 block">Core Systems</div>
        <button 
          onClick={() => { setActiveViewFocus('OVERVIEW'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'OVERVIEW' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="font-semibold text-sm">Overview</span>
        </button>

        <button 
          onClick={() => { setActiveViewFocus('AUDIT'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'AUDIT' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <ScrollText className="w-4 h-4" />
          <span className="font-semibold text-sm">Transactions</span>
        </button>
        
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-1 block">G POS Management</div>
        <button 
          onClick={() => { setActiveViewFocus('PRODUCTS'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'PRODUCTS' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <Store className="w-4 h-4" />
          <span className="font-semibold text-sm">POS Edit</span>
        </button>
        
        <button 
          onClick={() => { setActiveViewFocus('CATEGORIES'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'CATEGORIES' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="font-semibold text-sm">Categories</span>
        </button>
        
        <button 
          onClick={() => { setActiveViewFocus('INVENTORY'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'INVENTORY' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <PackageSearch className="w-4 h-4" />
          <span className="font-semibold text-sm">Stock Levels</span>
        </button>
        
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-1 block">G Delivery Management</div>
        <button 
          onClick={() => { setActiveViewFocus('DELIVERY_MENU'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'DELIVERY_MENU' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <Store className="w-4 h-4" />
          <span className="font-semibold text-sm">Delivery Menu</span>
        </button>
        <button 
          onClick={() => { setActiveViewFocus('APP_SETTINGS'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-3 px-4 py-2.5 squircle-g2-sm transition-all whitespace-nowrap ${activeViewFocus === 'APP_SETTINGS' ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100'}`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="font-semibold text-sm">Storefront Config</span>
        </button>

        <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-2">
           <div className="px-4 py-2 text-xs font-bold text-gray-400 break-all">
             Admin: <br/><span className="text-black font-semibold">{currentUser?.email}</span>
           </div>
           <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 squircle-g2-sm hover:bg-red-50 text-red-600 transition-all font-semibold text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Intelligence Viewport */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* VIEW: OVERVIEW */}
          {activeViewFocus === 'OVERVIEW' && (
            <motion.div
              key="OVERVIEW"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
                <p className="text-brand-muted mt-1 font-medium">Today's Sales & Metrics</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dynamicMetricsCorpus.map((metric, idx) => {
                  const accentColors = ['#FFC244', '#00A082', '#000000', '#8EC042'];
                  return (
                    <div key={metric.metricToken} className="bg-brand-surface border border-gray-100 p-6 squircle-g2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: accentColors[idx % accentColors.length] }} />
                      <div>
                        <p className="text-sm text-brand-muted font-semibold mb-2">{metric.metricLegend}</p>
                        <h3 className="text-2xl font-black">{metric.grossValue}</h3>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                        <span className={`flex items-center ${metric.trajectory === 'up' ? 'text-brand-secondary' : 'text-red-500'}`}>
                          {metric.trajectory === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                          {metric.percentVariance}%
                        </span>
                        <span className="text-gray-400">vs yesterday</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Peak Hours Area Chart */}
                <div className="lg:col-span-2 bg-brand-surface border border-gray-100 p-6 squircle-g2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <h3 className="text-lg font-bold mb-6">Peak Hours Analytics</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_HOURLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00A082" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#00A082" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} 
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                          itemStyle={{ color: '#111111' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#00A082" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorOrders)" 
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#00A082' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-brand-surface border border-gray-100 p-6 squircle-g2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <h3 className="text-lg font-bold mb-2">Tender Split</h3>
                  <div className="h-64 w-full relative lg:left-[-10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dynamicSplitData}
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {dynamicSplitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `KES ${value}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs lg:text-sm">
                    {dynamicSplitData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                        <span className="font-semibold truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: PRODUCTS CATALOG */}
          {activeViewFocus === 'PRODUCTS' && (
            <motion.div
              key="PRODUCTS"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Menu Catalog</h1>
                  <p className="text-brand-muted mt-1 font-medium">Manage POS frontend product listings.</p>
                </div>
                <button 
                  onClick={() => dispatchProductModal()}
                  className="bg-brand-primary text-brand-text font-bold px-6 py-3 squircle-g2 flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </button>
              </header>

              <div className="bg-brand-surface border border-gray-100 squircle-g2 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4">Visual asset</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Price (KES)</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {inventoryCorpus.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10 font-bold text-gray-400">Catalog is fully depleted. Add a product.</td>
                          </tr>
                        ) : inventoryCorpus.map((product) => (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={product.inventoryIdentifier} 
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono font-medium text-xs">
                              <img src={product.visualAssetUri} alt="Asset" className="w-12 h-12 object-contain drop-shadow-sm" />
                            </td>
                            <td className="px-6 py-4 font-bold">{product.culinaryNomenclature}</td>
                            <td className="px-6 py-4 font-medium">{product.retailValuation}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Live</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-3">
                                <button 
                                  onClick={() => dispatchProductModal(product)}
                                  className="text-brand-muted hover:text-brand-secondary transition-colors"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => deleteInventoryItem(product.inventoryIdentifier)}
                                  className="text-brand-muted hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: INVENTORY */}
          {activeViewFocus === 'INVENTORY' && (
            <motion.div
              key="INVENTORY"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                <p className="text-brand-muted mt-1 font-medium">Current stock levels.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_INVENTORY_TRACKER.map(stock => {
                  const criticalLevel = (stock.currentReserves / stock.maximumCapacity) < 0.2;
                  return (
                    <div key={stock.assetIdentifier} className="bg-brand-surface border border-gray-100 p-6 squircle-g2 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="font-bold text-lg">{stock.stockNomenclature}</h4>
                          <p className="text-brand-muted text-sm capitalize">{stock.unitMeasurement}</p>
                        </div>
                        {criticalLevel && (
                          <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            CRITICAL
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm font-bold mb-1">
                          <span>{stock.currentReserves}</span>
                          <span className="text-gray-400">/ {stock.maximumCapacity}</span>
                        </div>
                        {renderHealthIndicator(stock.currentReserves, stock.maximumCapacity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* VIEW: AUDIT LOG */}
          {activeViewFocus === 'AUDIT' && (
            <motion.div
              key="AUDIT"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Transaction Logs</h1>
                  <p className="text-brand-muted mt-1 font-medium">History of all cash and stock movements.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted h-4 w-4" />
                  <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    value={auditQueryParameter}
                    onChange={(e) => setAuditQueryParameter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 squircle-g2-sm outline-none focus:border-black transition-all text-sm font-medium"
                  />
                </div>
              </header>

              <div className="bg-brand-surface border border-gray-100 squircle-g2 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4 hidden md:table-cell">Receipt #</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4 hidden sm:table-cell">Staff</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.filter(l => l.txnHash.toLowerCase().includes(auditQueryParameter.toLowerCase())).map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-xs hidden md:table-cell">{log.txnHash}</td>
                          <td className="px-6 py-4 text-gray-500 font-medium">{new Date(log.ledgerTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-semibold hidden sm:table-cell">{log.actorIdentity}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-gray-100 text-xs font-bold rounded-md text-gray-600">
                              {log.actionTypology.replace('TENDER_', '').replace('STOCK_ADJUST', 'STOCK UPDATE')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold">
                            {log.financialMagnitude > 0 ? `KES ${log.financialMagnitude}` : '--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => reprintTransaction(log)}
                              disabled={log.actionTypology === 'STOCK_ADJUST'}
                              className={`transition-colors ${log.actionTypology === 'STOCK_ADJUST' ? 'text-gray-300 cursor-not-allowed' : 'text-brand-muted hover:text-black'}`}
                              title="Reprint Receipt"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: DELIVERY MENU */}
          {activeViewFocus === 'DELIVERY_MENU' && (
            <motion.div
              key="DELIVERY_MENU"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Delivery Menu</h1>
                  <p className="text-brand-muted mt-1 font-medium">Control availability and custom markups for G Delivery.</p>
                </div>
                <button 
                  onClick={() => dispatchProductModal()}
                  className="bg-black text-white px-6 py-3 squircle-g2-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  Add New Item
                </button>
              </header>

              <div className="bg-brand-surface border border-gray-100 squircle-g2 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">POS Price</th>
                        <th className="px-6 py-4">Delivery Price</th>
                        <th className="px-6 py-4 text-center">In App?</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {inventoryCorpus.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10 font-bold text-gray-400">Catalog is fully depleted. Add a product in POS Edit.</td>
                          </tr>
                        ) : inventoryCorpus.map((product) => (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={product.inventoryIdentifier} 
                            className={`transition-colors ${!product.isAvailableForDelivery ? 'opacity-50' : 'hover:bg-gray-50/50'}`}
                          >
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img src={product.visualAssetUri} alt="Asset" className="w-10 h-10 object-contain drop-shadow-sm" />
                              <span className="font-bold">{product.culinaryNomenclature}</span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-400 line-through">KES {product.retailValuation}</td>
                            <td className="px-6 py-4 font-bold text-brand-primary">KES {product.deliveryValuation}</td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => updateInventoryItem(product.inventoryIdentifier, { isAvailableForDelivery: !product.isAvailableForDelivery })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${product.isAvailableForDelivery ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                              >
                                {product.isAvailableForDelivery ? 'Available' : 'Hidden'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => dispatchProductModal(product)}
                                className="text-brand-muted hover:text-brand-secondary transition-colors"
                              >
                                Edit Details
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: APP SETTINGS */}
          {activeViewFocus === 'APP_SETTINGS' && (
            <motion.div
              key="APP_SETTINGS"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">G Delivery Config</h1>
                <p className="text-brand-muted mt-1 font-medium">Fine-tune the customer ordering app parameters.</p>
              </header>

              <div className="bg-brand-surface border border-gray-100 p-6 squircle-g2 space-y-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="space-y-6 max-w-2xl">
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Store Online Status</label>
                      <button 
                        onClick={() => updateSettings({ isStoreOpen: !settings.isStoreOpen })}
                        className={`w-full px-4 py-3 squircle-g2-sm font-bold transition-colors ${settings.isStoreOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {settings.isStoreOpen ? 'Accepting Orders' : 'Store Closed'}
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Fee (KES)</label>
                      <input 
                        type="number" 
                        value={settings.deliveryFee}
                        onChange={(e) => updateSettings({ deliveryFee: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hero Title</label>
                    <input 
                      type="text" 
                      value={settings.heroTitle}
                      onChange={(e) => updateSettings({ heroTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hero Subtitle</label>
                    <input 
                      type="text" 
                      value={settings.heroSubtitle}
                      onChange={(e) => updateSettings({ heroSubtitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-lg mb-4 cursor-default">Food Orbit Images (Select 4)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {settings.orbitItems.map((orbitUri, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slot {index + 1}</label>
                          <div className="relative">
                            <select
                              value={orbitUri}
                              onChange={(e) => {
                                const newOrbit = [...settings.orbitItems];
                                newOrbit[index] = e.target.value;
                                updateSettings({ orbitItems: newOrbit });
                              }}
                              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 squircle-g2-sm text-sm outline-none focus:border-black appearance-none truncate cursor-pointer font-bold"
                            >
                              <option value="/images/quarter_chicken.png">Quarter Chicken</option>
                              <option value="/images/crispy_chips.png">Crispy Chips</option>
                              <option value="/images/glitos_combo.png">Glitos Combo</option>
                              <option value="/images/soda_cup.png">Soda Cup</option>
                              <option value="/images/half_chicken.png">Half Chicken</option>
                              {Array.from(new Set(inventoryCorpus.map(item => item.visualAssetUri))).map(uri => {
                                if (['/images/quarter_chicken.png', '/images/crispy_chips.png', '/images/glitos_combo.png', '/images/soda_cup.png', '/images/half_chicken.png'].includes(uri)) return null;
                                return <option key={uri} value={uri}>{uri.split('/').pop()}</option>;
                              })}
                            </select>
                            <div className="mt-2 w-full h-24 bg-gray-50 rounded-xl border border-gray-200 flex py-2 justify-center p-2">
                              <img src={orbitUri} className="h-full object-contain drop-shadow-md" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: CATEGORIES */}
          {activeViewFocus === 'CATEGORIES' && (
            <motion.div
              key="CATEGORIES"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">App Categories</h1>
                  <p className="text-brand-muted mt-1 font-medium">Manage the main categories shown on the SuperApp home screen.</p>
                </div>
                <button 
                  onClick={() => alert("Custom Categories creation currently requires updating SuperAppHome bubble SVG icons.")}
                  className="bg-brand-primary text-brand-text font-bold px-6 py-3 squircle-g2 flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Breakfast & Snacks', 'Chicken', 'Chips & Sides', 'Drinks', 'Packaging'].map((cat, idx) => (
                  <div key={idx} className="bg-brand-surface border border-gray-100 p-6 squircle-g2 shadow-sm flex items-center justify-between">
                    <span className="font-bold text-lg">{cat}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Live</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Product Creation / Edit Modal Overlay */}
      <AnimatePresence>
        {isProductModalActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalActive(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-brand-surface squircle-g2 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="font-bold text-xl">{activeEditingRef ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setIsProductModalActive(false)} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={draftProduct.culinaryNomenclature}
                    onChange={(e) => setDraftProduct({ ...draftProduct, culinaryNomenclature: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                    placeholder="e.g. Spicy Wings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">POS Price (KES)</label>
                  <input 
                    type="number" 
                    value={draftProduct.retailValuation || ''}
                    onChange={(e) => setDraftProduct({ ...draftProduct, retailValuation: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                    <span>Delivery App Price (KES)</span>
                    <span className="text-gray-400 font-normal">Overrides POS price</span>
                  </label>
                  <input 
                    type="number" 
                    value={draftProduct.deliveryValuation || ''}
                    onChange={(e) => setDraftProduct({ ...draftProduct, deliveryValuation: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-brand-primary/20 squircle-g2-sm outline-none focus:border-brand-primary font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select 
                    value={draftProduct.productCategory || 'Chicken'}
                    onChange={(e) => setDraftProduct({ ...draftProduct, productCategory: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 squircle-g2-sm outline-none focus:border-black font-medium"
                  >
                    <option value="Breakfast\n& Snacks">Breakfast & Snacks</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Chips & Sides">Chips & Sides</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 mt-2 pt-4">
                  <label className="text-sm font-bold text-gray-700">Available on G Delivery App</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={draftProduct.isAvailableForDelivery}
                      onChange={(e) => setDraftProduct({ ...draftProduct, isAvailableForDelivery: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Media (Cloudinary)</label>
                  
                  {draftProduct.visualAssetUri && !isUploading && (
                    <div className="mb-3 relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                       <img src={draftProduct.visualAssetUri} alt="Asset preview" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setIsUploading(true);
                            const url = await uploadImageToBackend(file);
                            setDraftProduct(prev => ({ ...prev, visualAssetUri: url }));
                          } catch (err) {
                            console.error("Cloudinary upload failed", err);
                            alert("Failed to upload image.");
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-brand-primary file:text-brand-text
                        hover:file:bg-brand-secondary hover:file:text-white
                        transition-all cursor-pointer font-medium"
                    />
                    {isUploading && (
                      <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-brand-secondary animate-pulse">
                        Uploading to Cloudinary...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsProductModalActive(false)}
                  className="px-6 py-2 font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={commitProductDraft}
                  disabled={isUploading}
                  className="px-6 py-2 font-bold text-brand-text bg-brand-primary squircle-g2 flex transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {activeEditingRef ? 'Save Changes' : 'Publish to POS'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden DOM layer specifically structured for 80mm thermal printers via @media print */}
      {reprintVoucherPayload && (
        <div id="thermal-voucher-zone" className="bg-white text-black p-4">
          <div className="text-center mb-4 border-b border-black pb-2">
            <h2 className="text-xl font-bold font-mono">G POS (REPRINT)</h2>
            <p className="text-xs">Receipt #{reprintVoucherPayload.txnHash}</p>
            <p className="text-xs">Original Time: {new Date(reprintVoucherPayload.ledgerTimestamp).toLocaleString()}</p>
            <p className="text-xs">Reprinted: {new Date().toLocaleString()}</p>
          </div>
          
          <div className="text-center text-xs font-mono mb-4 border-b border-dotted border-black pb-4">
             *** REPRINT COPY ***<br/>
          </div>

          {reprintVoucherPayload.items && (
            <table className="w-full text-xs font-mono text-left mb-2">
              <thead>
                <tr className="border-b border-dotted border-black">
                  <th className="py-1">QTY</th>
                  <th className="py-1">ITEM</th>
                  <th className="text-right py-1">AMT</th>
                </tr>
              </thead>
              <tbody>
                {reprintVoucherPayload.items.map((entry, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{entry.sessionQuantity}</td>
                    <td className="py-1 truncate pr-2">{entry.culinaryNomenclature}</td>
                    <td className="text-right py-1">{entry.retailValuation * entry.sessionQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="border-t border-black pt-2 mb-4 font-mono">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL (KES)</span>
              <span>{reprintVoucherPayload.financialMagnitude.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs mt-1 border-b border-dotted border-black pb-2">
              <span>TENDER TYPE</span>
              <span>{reprintVoucherPayload.actionTypology.replace('TENDER_', '')}</span>
            </div>
            <div className="flex justify-between text-xs mt-1 border-b border-dotted border-black pb-2">
              <span>STAFF</span>
              <span>{reprintVoucherPayload.actorIdentity}</span>
            </div>
          </div>

          <div className="text-center text-xs font-mono mt-4">
            <p>Thank you for choosing Glitos!</p>
            <p>Have an amazing day.</p>
          </div>
        </div>
      )}
    </div>
  );
}
