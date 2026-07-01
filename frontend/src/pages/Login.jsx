import React, { useState } from 'react';
import authService from '../services/authService';
import { Terminal, Shield, ArrowRight, User, Lock } from 'lucide-react';

const Login = ({ onAuthSuccess, navigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      onAuthSuccess();
      navigate('#dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Invalid username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-glow-purple border-purple-500/20 relative z-10 transition-all duration-500">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-2xl border border-purple-500/30 flex items-center justify-center animate-pulse">
            <Terminal className="text-cyan-400" size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold font-display text-center bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Sign in to Antigravity
        </h2>
        <p className="text-center text-xs text-dark-muted mt-1.5 mb-8">
          The cloud-native micro CI/CD engine
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 px-4 py-3 rounded-lg text-xs mb-6 flex items-start space-x-2">
            <Shield size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider">USERNAME</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="developer_name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 active:scale-[0.98] shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-dark-muted">
            New to Antigravity?{' '}
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                navigate('#register');
              }}
              className="text-cyan-400 hover:underline hover:text-cyan-300 transition-colors"
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
