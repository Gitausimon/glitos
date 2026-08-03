import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PosTerminal from './pages/PosTerminal';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryApp from './pages/DeliveryApp';
import { InventoryProvider } from './context/InventoryContext';
import { StoreProvider } from './context/StoreContext';

function App() {
  return (
    <StoreProvider>
      <InventoryProvider>
        <Router>
          <Routes>
            {/* Customer PWA (Glovo style) */}
            <Route path="/" element={<DeliveryApp />} />
            
            {/* Cashier POS */}
            <Route path="/pos" element={<PosTerminal />} />
            
            {/* Manager Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </InventoryProvider>
    </StoreProvider>
  );
}

export default App;
