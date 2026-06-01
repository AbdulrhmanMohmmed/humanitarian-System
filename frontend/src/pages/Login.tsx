import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages, ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(language === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#0b0f1a]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="hidden lg:block space-y-8 text-white">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="text-blue-400" size={24} />
            <span className="text-sm font-black tracking-widest uppercase">{t('systemReady')}</span>
          </div>
          
          <h1 className="text-6xl font-black leading-tight tracking-tighter">
            {t('appFullName').split(' ').map((word: string, i: number) => (
              <span key={i} className={i === 2 ? "text-blue-500" : ""}>{word} </span>
            ))}
          </h1>
          
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
            {t('dashboardSubtitle')}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            {[
              { label: t('beneficiaries'), val: '150k+' },
              { label: t('projects'), val: '1.2k' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-sm font-bold text-slate-500 uppercase mb-1">{item.label}</p>
                <p className="text-3xl font-black">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel border-white/10 p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t('login')}</h2>
                <p className="text-sm font-medium text-slate-400">{t('appName')} Yemen</p>
              </div>
              <button 
                onClick={toggleLanguage}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
              >
                <Languages size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('username')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('password')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('login')}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
