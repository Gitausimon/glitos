import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children, title }: { children: ReactNode, title: string }) {
  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-background">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  const isGoogleUser = currentUser?.providerData.some(provider => provider.providerId === 'google.com');

  if (isGoogleUser) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-background p-4 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-brand-muted mb-8 max-w-sm">
          You are currently signed in with a Customer Account. Only authorized Staff Accounts can access the {title}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black font-bold squircle-g2-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
          <button 
            onClick={() => logout()}
            className="px-6 py-3 bg-brand-primary text-black font-bold squircle-g2-sm hover:opacity-90 transition-opacity whitespace-nowrap shadow-md"
          >
            Sign out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen destinationName={title} />;
  }

  // They are authenticated and not a Google user, render the real dashboard or POS
  return <>{children}</>;
}
