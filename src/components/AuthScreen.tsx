import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthScreen({ destinationName }: { destinationName: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmiting, setIsSubmitting] = useState(false);
  const { signInWithStaffEmail } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithStaffEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-background p-4 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-brand-muted hover:text-black font-semibold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to App
      </button>

      <div className="w-full max-w-sm bg-white p-8 squircle-g2 shadow-xl border border-gray-100 flex flex-col pt-10">
        <div className="w-16 h-16 bg-gray-100 squircle-g2-sm flex items-center justify-center mx-auto mb-6 shrink-0 relative top-[-10px]">
           <Lock className="w-8 h-8 text-black" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight">{destinationName} Login</h1>
          <p className="text-brand-muted text-sm mt-1 font-medium">Verify your employee credentials.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 mb-6 rounded-md text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20 outline-none squircle-g2-sm px-4 py-3 font-medium transition-all"
              placeholder="e.g. manager@glitos.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20 outline-none squircle-g2-sm px-4 py-3 font-medium transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmiting}
            className="w-full bg-brand-primary text-brand-text font-bold py-4 squircle-g2 mt-6 flex justify-center items-center hover:bg-opacity-90 transition-all shadow-md disabled:opacity-70"
          >
            {isSubmiting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate System'}
          </button>
        </form>
      </div>
    </div>
  );
}
