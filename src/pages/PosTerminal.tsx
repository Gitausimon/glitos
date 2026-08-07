import { useState } from 'react';
import { CreditCard, Banknote, Search, Minus, Plus, Trash2, ConciergeBell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory, type PosInventoryItem } from '../context/InventoryContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

type ActiveCartEntry = PosInventoryItem & {
  sessionQuantity: number;
};

export default function PosTerminal() {
  const { inventoryCorpus } = useInventory();
  const { addOrder } = useOrders();
  const { currentUser, logout } = useAuth();
  const [activeCheckoutSession, setActiveCheckoutSession] = useState<ActiveCartEntry[]>([]);
  const [lexicalSearchQuery, setLexicalSearchQuery] = useState('');
  const [isMobileCartExpanded, setIsMobileCartExpanded] = useState(false);
  
  // Isolated state precisely for queuing thermal output prior to flushing cart
  const [terminalVoucherPayload, setTerminalVoucherPayload] = useState<ActiveCartEntry[] | null>(null);
  const [voucherAuditContext, setVoucherAuditContext] = useState({ tenderType: '', totalValue: 0 });

  const appendToCheckoutSession = (targetItem: PosInventoryItem) => {
    setActiveCheckoutSession((currentSession) => {
      const existingEntryIndex = currentSession.findIndex(entry => entry.inventoryIdentifier === targetItem.inventoryIdentifier);
      if (existingEntryIndex !== -1) {
        const mutatedSession = [...currentSession];
        mutatedSession[existingEntryIndex] = {
          ...mutatedSession[existingEntryIndex],
          sessionQuantity: mutatedSession[existingEntryIndex].sessionQuantity + 1
        };
        return mutatedSession;
      }
      return [...currentSession, { ...targetItem, sessionQuantity: 1 }];
    });
  };

  const deductFromCheckoutSession = (identifierToken: string) => {
    setActiveCheckoutSession((currentSession) => {
      const existingEntryIndex = currentSession.findIndex(entry => entry.inventoryIdentifier === identifierToken);
      if (existingEntryIndex !== -1 && currentSession[existingEntryIndex].sessionQuantity > 1) {
        const mutatedSession = [...currentSession];
        mutatedSession[existingEntryIndex] = {
          ...mutatedSession[existingEntryIndex],
          sessionQuantity: mutatedSession[existingEntryIndex].sessionQuantity - 1
        };
        return mutatedSession;
      }
      return currentSession.filter(entry => entry.inventoryIdentifier !== identifierToken);
    });
  };

  const terminalLedgerTotal = activeCheckoutSession.reduce(
    (cumulative, entry) => cumulative + (entry.retailValuation * entry.sessionQuantity),
    0
  );

  const dispatchFinancialTransaction = async (tenderType: 'CASH' | 'MPESA') => {
    const currentTxnHash = Math.floor(Date.now() / 1000).toString().slice(-6);
    
    // 1. Sync to Firebase Backend
    try {
      await addOrder({
        txnHash: `TXN-${currentTxnHash}`,
        ledgerTimestamp: new Date().toISOString(),
        financialMagnitude: terminalLedgerTotal,
        actionTypology: `TENDER_${tenderType}`,
        actorIdentity: currentUser?.email?.split('@')[0] || 'Cashier',
        items: activeCheckoutSession.map(item => ({
          inventoryIdentifier: item.inventoryIdentifier,
          culinaryNomenclature: item.culinaryNomenclature,
          retailValuation: item.retailValuation,
          sessionQuantity: item.sessionQuantity
        }))
      });
    } catch (e) {
      console.error(e);
      alert("System Offline: Transaction log failed to sync.");
      return; 
    }

    // 2. Generate isolated payload for voucher rendering
    setTerminalVoucherPayload([...activeCheckoutSession]);
    setVoucherAuditContext({ tenderType, totalValue: terminalLedgerTotal });

    // 3. Print & Cleanup
    setTimeout(() => {
      window.print();
      
      setActiveCheckoutSession([]);
      setTerminalVoucherPayload(null);
      setIsMobileCartExpanded(false);
    }, 150);
  };

  const filteredInventoryCorpus = inventoryCorpus.filter(item => 
    (item.culinaryNomenclature || '').toLowerCase().includes((lexicalSearchQuery || '').toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-brand-background overflow-hidden text-brand-text">
      {/* Primary Left Navigation & Inventory Grid */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 lg:pr-4 overflow-hidden relative">
        {/* Top Branding / Search Orbit */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="flex items-start gap-4">
            <img src="/glitoslogo.svg" alt="Glitos Logo" className="h-14 w-auto pt-1" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">G POS</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-brand-muted text-sm font-medium">Logged in as <strong className="text-brand-text font-bold">{currentUser?.email}</strong></p>
                <span className="w-1 h-1 bg-gray-300 rounded-full hidden md:block"></span>
                <button onClick={logout} className="text-brand-secondary text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">

            <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={lexicalSearchQuery}
              onChange={(e) => setLexicalSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-brand-surface border border-gray-200 squircle-g2 outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium"
            />
          </div>
        </div>
      </header>

        {/* Bespoke Grid Display using G2 Squircles */}
        <section className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            <AnimatePresence>
              {filteredInventoryCorpus.map((catalogItem) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  key={catalogItem.inventoryIdentifier}
                  onClick={() => appendToCheckoutSession(catalogItem)}
                  className="bg-brand-surface border-2 border-gray-100 p-4 lg:p-6 squircle-g2 flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:border-brand-primary hover:shadow-brand-primary/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <img src={catalogItem.visualAssetUri} alt={catalogItem.culinaryNomenclature} className="w-20 h-20 lg:w-28 lg:h-28 object-contain z-10 drop-shadow-lg" />
                  
                  <div className="text-center z-10 mt-2">
                    <h3 className="font-semibold text-base lg:text-lg leading-tight">{catalogItem.culinaryNomenclature}</h3>
                    <p className="text-brand-secondary font-bold mt-1">KES {catalogItem.retailValuation}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Mobile floating action button to toggle cart (Visible only on small screens) */}
        {!isMobileCartExpanded && activeCheckoutSession.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-30"
          >
            <button 
              onClick={() => setIsMobileCartExpanded(true)}
              className="bg-brand-text text-white px-6 py-4 squircle-g2 shadow-2xl flex items-center gap-3 font-bold active:scale-95 transition-transform"
            >
              <ConciergeBell className="w-5 h-5" />
              <span>Checkout ({activeCheckoutSession.length}) - KES {terminalLedgerTotal}</span>
            </button>
          </motion.div>
        )}
      </main>

      {/* Right Bound Checkout Tally Sidebar (Collapsible bottom sheet on mobile) */}
      <aside className={`fixed inset-x-0 bottom-0 z-40 bg-brand-surface border-t border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-y-0 lg:w-[420px] lg:border-l lg:border-t-0 shrink-0 ${isMobileCartExpanded ? 'translate-y-0 h-[85vh]' : 'translate-y-full lg:h-full'}`}>
        
        {/* Mobile drag handle / closer */}
        <div 
          className="lg:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer"
          onClick={() => setIsMobileCartExpanded(false)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="p-6 pt-2 lg:pt-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Active Checkout</h2>
            <p className="text-brand-muted text-sm shrink-0">TXN-{Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
          </div>
          <button 
            className="lg:hidden text-brand-muted font-bold px-3 py-1 bg-gray-100 squircle-g2-sm"
            onClick={() => setIsMobileCartExpanded(false)}
          >
            Hide
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {activeCheckoutSession.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-full flex flex-col items-center justify-center text-brand-muted py-20"
              >
                <div className="w-16 h-16 rounded-full bg-brand-secondary/10 flex items-center justify-center mb-4 border border-brand-secondary/20">
                  <ConciergeBell className="w-6 h-6 text-brand-secondary" />
                </div>
                <p>Cart is empty.</p>
                <p className="text-sm mt-1">Add items to start.</p>
              </motion.div>
            ) : (
              activeCheckoutSession.map((entry) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
                  key={entry.inventoryIdentifier}
                  className="flex items-center justify-between p-4 bg-gray-50 squircle-g2-sm border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <img src={entry.visualAssetUri} alt={entry.culinaryNomenclature} className="w-12 h-12 object-contain drop-shadow-sm" />
                    <div>
                      <h4 className="font-semibold text-sm">{entry.culinaryNomenclature}</h4>
                      <p className="text-brand-muted text-xs font-medium">KES {entry.retailValuation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full py-1 px-1 shadow-sm shrink-0">
                    <button 
                      onClick={() => deductFromCheckoutSession(entry.inventoryIdentifier)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
                    >
                      {entry.sessionQuantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{entry.sessionQuantity}</span>
                    <button 
                      onClick={() => appendToCheckoutSession(entry)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-brand-secondary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Tally & Tender Operations */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-2xl lg:text-3xl font-black">KES {terminalLedgerTotal}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={activeCheckoutSession.length === 0}
              onClick={() => dispatchFinancialTransaction('CASH')}
              className="flex flex-col items-center justify-center p-3 lg:p-4 bg-brand-surface border-2 border-gray-100 hover:border-brand-primary hover:shadow-brand-primary/20 hover:shadow-lg text-brand-text squircle-g2 shadow-sm disabled:opacity-50 disabled:hover:border-transparent transition-all group"
            >
              <Banknote className="w-6 h-6 lg:w-8 lg:h-8 mb-1 lg:mb-2 text-brand-secondary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm lg:text-base">Cash</span>
            </button>
            
            <button
              disabled={activeCheckoutSession.length === 0}
              onClick={() => dispatchFinancialTransaction('MPESA')}
              className="flex flex-col items-center justify-center p-3 lg:p-4 bg-brand-secondary hover:bg-brand-secondary/90 text-white squircle-g2 shadow-md disabled:opacity-50 transition-all group"
            >
              <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 mb-1 lg:mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm lg:text-base">M-Pesa</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Screen tint when mobile cart is open */}
      <AnimatePresence>
        {isMobileCartExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsMobileCartExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden DOM layer specifically structured for 80mm thermal printers via @media print */}
      {terminalVoucherPayload && (
        <div id="thermal-voucher-zone" className="bg-white text-black p-4">
          <div className="text-center mb-4 border-b border-black pb-2">
            <h2 className="text-xl font-bold font-mono">G POS</h2>
            <p className="text-xs">Receipt #{Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
            <p className="text-xs">{new Date().toLocaleString()}</p>
          </div>
          
          <table className="w-full text-xs font-mono text-left mb-2">
            <thead>
              <tr className="border-b border-dotted border-black">
                <th className="py-1">QTY</th>
                <th className="py-1">ITEM</th>
                <th className="text-right py-1">AMT</th>
              </tr>
            </thead>
            <tbody>
              {terminalVoucherPayload.map(entry => (
                <tr key={entry.inventoryIdentifier}>
                  <td className="py-1">{entry.sessionQuantity}</td>
                  <td className="py-1 truncate pr-2">{entry.culinaryNomenclature}</td>
                  <td className="text-right py-1">{entry.retailValuation * entry.sessionQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black pt-2 mb-4 font-mono">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL (KES)</span>
              <span>{voucherAuditContext.totalValue}</span>
            </div>
            <div className="flex justify-between text-xs mt-1 border-b border-dotted border-black pb-2">
              <span>TENDER TYPE</span>
              <span>{voucherAuditContext.tenderType}</span>
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
