import React, { useState } from 'react';
import { useAuthentication } from '@/features/authentication/hooks/useAuthentication';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import {
  Input,
  Button,
  Label,
  Card,
  FormSection,
  ActionBar
} from '@/components/ui';

/**
 * A página de login da aplicação.
 *
 * Este componente renderiza o formulário de email/senha e utiliza o hook `useAuthentication`
 * para gerenciar o processo de login. Em caso de sucesso, ele redireciona o usuário
 * para a página inicial. Ele também exibe o estado de carregamento e quaisquer erros
 * de autenticação que ocorram.
 *
 * @returns {React.ReactElement} O componente da página de login.
 */
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
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
          </div>
        </header>
        <main className="flex-grow flex flex-col justify-center items-center p-8">
          <Card className="w-full max-w-md rounded-2xl border-border bg-card p-6 sm:p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-center text-card-foreground mb-6">Acessar Painel</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <FormSection title="Credenciais" className="bg-secondary/20">
                <div>
                  <Label htmlFor="email" className="mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="mb-2 block">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>
              </FormSection>

              {error && <p className="text-destructive text-sm text-center">{error.message}</p>}

              <ActionBar separated className="justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </ActionBar>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;