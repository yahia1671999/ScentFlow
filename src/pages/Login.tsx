import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../store.tsx';

export default function Login() {
  const { login, t, language } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError(language === 'ar' ? 'بيانات الاعتماد غير صالحة' : 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-3xl mb-6 shadow-2xl shadow-amber-900/20 rotate-12 hover:rotate-0 transition-all duration-500">
              <LogIn className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-3xl font-black text-white tracking-widest uppercase">
              {language === 'ar' ? 'دخول النظام' : 'ELITE PERFUME'}
           </h1>
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
              {language === 'ar' ? 'الرجاء تسجيل الدخول للمتابعة' : 'Management System'}
           </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-600/10 transition-colors"></div>
           
           <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                    {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                 </label>
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                       type="text"
                       value={username}
                       onChange={(e) => setUsername(e.target.value)}
                       required
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20 transition-all"
                       placeholder="admin"
                    />
                 </div>
              </div>

              <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                 </label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20 transition-all"
                       placeholder="••••"
                    />
                 </div>
              </div>

              {error && (
                 <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-rose-500 text-xs font-bold text-center"
                 >
                    {error}
                 </motion.p>
              )}

              <button
                 type="submit"
                 disabled={loading}
                 className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
           </form>
        </div>

        <div className="mt-8 text-center">
           <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Elite Perfumery Management
           </p>
        </div>
      </motion.div>
    </div>
  );
}
