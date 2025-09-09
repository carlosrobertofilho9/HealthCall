-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz,
  default_destination text,
  PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Users can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile.' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can view their own profile." ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile.' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can update their own profile." ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can insert their own profile (for existing users without a row)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile.' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can insert their own profile." ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 4. Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at)
  VALUES (new.id, now())
  ON CONFLICT (id) DO UPDATE SET updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
