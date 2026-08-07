import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PosTerminal from './pages/PosTerminal';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryApp from './pages/DeliveryApp';
import { InventoryProvider } from './context/InventoryContext';
import { StoreProvider } from './context/StoreContext';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import SuperAppHome from './pages/SuperAppHome';

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <InventoryProvider>
          <OrderProvider>
            <Router>
              <Routes>
                {/* Customer PWA (Glovo style) */}
                <Route path="/" element={<SplashScreen appName="Customer Delivery"><SuperAppHome /></SplashScreen>} />
                <Route path="/delivery" element={<DeliveryApp />} />
                
                {/* Cashier POS */}
                <Route path="/pos" element={<SplashScreen appName="Cashier POS"><ProtectedRoute title="Cashier Terminal"><PosTerminal /></ProtectedRoute></SplashScreen>} />
                
                {/* Manager Dashboard */}
                <Route path="/admin" element={<SplashScreen appName="Admin Dashboard"><ProtectedRoute title="Executive Dashboard"><AdminDashboard /></ProtectedRoute></SplashScreen>} />
              </Routes>
            </Router>
          </OrderProvider>
        </InventoryProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
