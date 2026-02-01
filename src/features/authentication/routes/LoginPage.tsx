import React, { useState, useEffect } from 'react';
import { useAuthentication } from '@/features/authentication/hooks/useAuthentication';
import { useNavigate } from 'react-router-dom';
import headerLogo from '@/assets/healthcall-logo-header.png';

/**
 * A página de login da aplicação.
 *
 * Este componente renderiza o formulário de email/senha e utiliza o hook `useAuthentication`
 * para gerenciar o processo de login. Em caso de sucesso, ele verifica se é o primeiro login
 * e, se for, solicita que o usuário configure suas próprias credenciais.
 *
 * Credenciais padrão: admin@healthcall.local / admin123
 *
 * @returns {React.ReactElement} O componente da página de login.
 */
const LoginPage = () => {
  const { login, loading, error, isFirstLogin, updateCredentials, getSession } = useAuthentication();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({
    userId: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: '',
    name: '',
  });
  const [setupError, setSetupError] = useState('');
  const navigate = useNavigate();

  // Verifica se já está logado
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      // Busca a sessão atualizada para verificar primeiro login
      const session = await getSession();
      if (session?.user) {
        const firstLogin = await isFirstLogin(session.user.id);
        if (firstLogin) {
          setSetupData(prev => ({ ...prev, userId: session.user.id }));
          setShowSetup(true);
        } else {
          navigate('/');
        }
      }
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    // Validações
    if (!setupData.newEmail || !setupData.newPassword || !setupData.name) {
      setSetupError('Preencha todos os campos');
      return;
    }

    if (setupData.newPassword.length < 6) {
      setSetupError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (setupData.newPassword !== setupData.confirmPassword) {
      setSetupError('As senhas não coincidem');
      return;
    }

    const success = await updateCredentials(
      setupData.userId,
      setupData.newEmail,
      setupData.newPassword,
      setupData.name
    );

    if (success) {
      navigate('/');
    } else {
      setSetupError(error?.message || 'Erro ao configurar credenciais');
    }
  };

  // Tela de configuração inicial
  if (showSetup) {
    return (
      <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <div className="flex flex-col min-h-screen">
          <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <img src={headerLogo} alt="HealthCall Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold">Configuração Inicial</h1>
            </div>
          </header>
          <main className="flex-grow flex flex-col justify-center items-center p-8">
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-bold text-center mb-4">Bem-vindo!</h2>
              <p className="text-gray-400 text-center mb-8">
                Configure suas credenciais de acesso. Estas serão usadas para acessar o sistema.
              </p>
              <form onSubmit={handleSetup} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Seu Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nome completo"
                    value={setupData.name}
                    onChange={(e) => setSetupData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Novo Email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={setupData.newEmail}
                    onChange={(e) => setSetupData(prev => ({ ...prev, newEmail: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={setupData.newPassword}
                    onChange={(e) => setSetupData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={setupData.confirmPassword}
                    onChange={(e) => setSetupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-[#38e07b] focus:border-[#38e07b] transition focus:outline-none"
                    required
                  />
                </div>
                {setupError && <p className="text-red-400 text-sm text-center">{setupError}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#38e07b] text-gray-900 font-bold text-lg py-3 rounded-lg shadow-lg hover:bg-green-400 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none"
                >
                  {loading ? 'Salvando...' : 'Salvar e Continuar'}
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Tela de login normal
  return (
    <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src={headerLogo} alt="HealthCall Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">HealthCall</h1>
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
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400 text-center">
                <strong>Primeiro acesso?</strong><br />
                Use as credenciais padrão:<br />
                <span className="text-[#38e07b]">admin@healthcall.local</span><br />
                <span className="text-[#38e07b]">admin123</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;