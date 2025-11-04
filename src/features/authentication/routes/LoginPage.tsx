import React, { useState } from 'react';
import { useAuthentication } from '@/features/authentication/hooks/useAuthentication';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login, loading, error } = useAuthentication();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
          </div>
        </header>
        <main className="flex-grow flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-bold text-center mb-8">Acessar Painel</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error.message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#38e07b] text-gray-900 font-bold text-lg py-3 rounded-lg shadow-lg hover:bg-green-400 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;