# Guia de Integração com Supabase - HealthCall

Este documento descreve os passos para integrar o Supabase ao projeto HealthCall, habilitando funcionalidades de autenticação e chamadas de pacientes em tempo real.

## 1. Configuração do Projeto

### 1.1. Instalação das Dependências

Primeiro, precisamos adicionar o cliente Supabase ao nosso projeto.

```bash
npm install @supabase/supabase-js
```

### 1.2. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto para armazenar suas credenciais do Supabase. Você pode encontrar esses valores no painel do seu projeto no Supabase (`Settings` > `API`).

```
VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

**Importante:** Nunca exponha a chave de serviço (`service_role`) no lado do cliente.

### 1.3. Criando o Cliente Supabase

Vamos criar um arquivo para inicializar e exportar o cliente Supabase, para que possamos usá-lo em qualquer lugar da nossa aplicação.

Crie `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 2. Autenticação

Vamos implementar um sistema de login simples com email e senha.

### 2.1. Página de Login

Crie um novo componente de página para o login em `src/pages/Login/LoginPage.tsx`. Esta página terá um formulário para o usuário inserir suas credenciais.

```tsx
// src/pages/Login/LoginPage.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    }
    // O redirecionamento será tratado por um listener de autenticação
    setLoading(false);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

### 2.2. Gerenciamento de Sessão

Para gerenciar a sessão do usuário e proteger rotas, podemos usar um `AuthContext` e um listener de estado de autenticação.

No `src/app/router.tsx`, podemos ouvir as mudanças no estado de autenticação para redirecionar o usuário.

```tsx
// Exemplo de como proteger rotas e redirecionar
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Usuário logado, redireciona para a home se estiver no login
      if (window.location.pathname === '/login') {
        navigate('/');
      }
    } else {
      // Usuário não logado, redireciona para o login
      navigate('/login');
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}, [navigate]);
```

## 3. Chamadas de Pacientes em Tempo Real

Usaremos o Supabase Realtime para notificar a tela de exibição sobre novas chamadas.

### 3.1. Estrutura do Banco de Dados

No seu painel do Supabase, crie as seguintes tabelas:

**Tabela `patients`**
- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestampz, default: now())
- `status` (text, ex: 'waiting', 'called', 'finished')

**Tabela `calls`**
- `id` (uuid, primary key)
- `patient_id` (uuid, foreign key para `patients.id`)
- `created_at` (timestampz, default: now())
- `location` (text, ex: 'Consultório 1', 'Sala de Exames')

**Habilitar RLS (Row Level Security)** em ambas as tabelas e criar políticas que permitam a leitura para usuários autenticados.

### 3.2. Criando uma Chamada (Visão do Médico)

Na `HomePage`, o médico poderá chamar um paciente. Isso irá inserir um novo registro na tabela `calls`.

```typescript
// src/actions/patients.ts (exemplo de função)
import { supabase } from '../lib/supabaseClient';

export const callPatient = async (patientId: string, location: string) => {
  const { data, error } = await supabase
    .from('calls')
    .insert([{ patient_id: patientId, location: location }]);

  if (error) {
    console.error('Error calling patient:', error);
    return null;
  }

  // Também é uma boa prática atualizar o status do paciente
  await supabase
    .from('patients')
    .update({ status: 'called' })
    .eq('id', patientId);

  return data;
};
```

### 3.3. Escutando Chamadas (Visão do Display)

Na `DisplayPage`, vamos nos inscrever para receber notificações em tempo real sempre que um novo registro for inserido na tabela `calls`.

```tsx
// src/pages/Display/DisplayPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Call {
  patient_name: string;
  location: string;
}

const DisplayPage = () => {
  const [lastCall, setLastCall] = useState<Call | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-calls')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        async (payload) => {
          // O payload contém o novo registro
          const newCall = payload.new;

          // Buscar o nome do paciente
          const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', newCall.patient_id)
            .single();

          if (patient) {
            const callData: Call = {
              patient_name: patient.name,
              location: newCall.location,
            };
            setLastCall(callData);
            // Aqui você pode tocar o som e usar a síntese de voz
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <h1>Painel de Chamadas</h1>
      {lastCall ? (
        <div>
          <h2>Última Chamada:</h2>
          <p>Paciente: {lastCall.patient_name}</p>
          <p>Local: {lastCall.location}</p>
        </div>
      ) : (
        <p>Aguardando chamadas...</p>
      )}
    </div>
  );
};

export default DisplayPage;
```

Este guia fornece a base para a integração. A partir daqui, você pode expandir as funcionalidades, como gerenciamento de múltiplos consultórios, histórico de chamadas e perfis de usuário mais complexos.
