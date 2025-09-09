# Plano de Implementação: Página de Configurações de Usuário

Este documento descreve o plano para implementar a funcionalidade de configurações de usuário, permitindo que eles definam um destino padrão para agilizar o processo de chamada de pacientes.

## 1. Objetivo

O objetivo é criar uma página de "Configurações" onde cada usuário possa salvar seu setor de trabalho (ex: "Consultório Médico 1", "Triagem"). Este valor será usado como o destino padrão ao adicionar e chamar novos pacientes, eliminando a necessidade de selecioná-lo repetidamente.

## 2. Alterações no Banco de Dados (Supabase)

Como não há uma tabela para armazenar dados de perfil de usuário, o primeiro passo é criar uma.

### 2.1. Nova Tabela: `profiles`

Criaremos uma tabela `profiles` para armazenar informações adicionais dos usuários. Esta tabela terá um relacionamento um-para-um com a tabela `auth.users` do Supabase.

-   `id`: `uuid` - Chave primária, correspondendo ao `id` do usuário em `auth.users`.
-   `updated_at`: `timestamptz` - Data da última atualização.
-   `default_destination`: `text` - O destino padrão para o usuário (ex: "Consultório 2").

### 2.2. Novo Script de Migração

Um novo arquivo de migração SQL será criado em `supabase/migrations/` para aplicar estas alterações:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_profiles_table.sql

-- 1. Create the profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz,
  default_destination text,
  PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 3. Alterações no Frontend

### 3.1. Roteamento

-   **Arquivo**: `src/app/router.tsx`
-   **Ação**: Adicionar uma nova rota para a página de configurações.

```tsx
// ... imports
import SettingsPage from '@/pages/Settings/SettingsPage';

// ...
<Route path="/settings" element={<SettingsPage />} />
// ...
```

### 3.2. Nova Página: `SettingsPage`

-   **Novo Arquivo**: `src/pages/Settings/SettingsPage.tsx`
-   **Conteúdo**:
    -   Um formulário contendo um campo de seleção (`<select>`) para o "Destino Padrão".
    -   As opções do `<select>` serão preenchidas com os destinos únicos existentes na tabela `patients`.
    -   Ao carregar, a página buscará o `default_destination` do usuário logado e o exibirá.
    -   Um botão "Salvar" que, ao ser clicado, atualizará o `default_destination` na tabela `profiles`.

### 3.3. Novo Contexto: `UserProfileContext`

Para evitar buscas repetidas do perfil do usuário, criaremos um contexto para armazenar e compartilhar esses dados.

-   **Novo Arquivo**: `src/contexts/UserProfileContext.tsx`
-   **Conteúdo**:
    -   Um `React.Context` que proverá o perfil do usuário (incluindo `default_destination`).
    -   Um hook customizado `useUserProfile` para acessar facilmente o contexto.
-   **Ação**: Envolver o `App` ou as rotas relevantes com o `UserProfileProvider` em `src/app/providers.tsx`.

### 3.4. Modificação do Header

-   **Arquivo**: `src/components/Header/Header.tsx`
-   **Ação**: Alterar o link de "Configurações" para apontar para a nova rota `/settings`.

### 3.5. Modificação da Página Principal

-   **Arquivo**: `src/pages/Home/HomePage.tsx`
-   **Ação**:
    -   Utilizar o `useUserProfile` para obter o `default_destination`.
    -   Passar esse valor para o componente `AddPatientForm`.
    -   No `AddPatientForm`, se um `default_destination` existir, o campo de destino já virá preenchido com este valor.

### 3.6. Novas Ações (API)

-   **Novo Arquivo**: `src/actions/user.ts`
-   **Conteúdo**: Funções para interagir com a tabela `profiles` no Supabase.
    -   `getUserProfile()`: Busca o perfil do usuário logado.
    -   `updateUserProfile(profileData)`: Atualiza o perfil do usuário.
    -   `getUniqueDestinations()`: Busca todos os destinos únicos da tabela `patients` para popular o formulário de configurações.

## 4. Fluxo de Trabalho

1.  **Aprovação**: Aguardar o "sim" para iniciar a implementação.
2.  **Banco de Dados**: Criar e executar a nova migração do Supabase.
3.  **Desenvolvimento Frontend**:
    -   Criar o `UserProfileContext`.
    -   Criar as funções de ação em `user.ts`.
    -   Criar a página `SettingsPage`.
    -   Atualizar o roteamento, o `Header` e a `HomePage`.
4.  **Testes**: Verificar se a configuração é salva e se o campo de destino é preenchido automaticamente.

Se este plano for aprovado, iniciarei a implementação seguindo os passos descritos.