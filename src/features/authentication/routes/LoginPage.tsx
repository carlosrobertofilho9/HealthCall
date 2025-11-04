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
            <svg
              className="text-[#38e07b]"
              fill="none"
              height="24"
              viewBox="0 0 48 48"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                fill="currentColor"
              ></path>
            </svg>
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