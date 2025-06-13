
-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.farmers CASCADE;

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmers table
CREATE TABLE public.farmers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  crop_type TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  trans_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('Given', 'Received')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  bags_given INTEGER NOT NULL,
  bags_returned INTEGER NOT NULL DEFAULT 0 CHECK (bags_returned <= bags_given),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bills table
CREATE TABLE public.bills (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE user_id = auth.uid();
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (id = public.get_user_org_id() AND public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can insert new profiles in their organization"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can update profiles in their organization"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can delete profiles in their organization"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

-- RLS Policies for farmers
CREATE POLICY "Users can view farmers in their organization"
  ON public.farmers FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert farmers in their organization"
  ON public.farmers FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Admins can update farmers in their organization"
  ON public.farmers FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can delete farmers in their organization"
  ON public.farmers FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions in their organization"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert transactions in their organization"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Admins can update transactions in their organization"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can delete transactions in their organization"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory in their organization"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert inventory in their organization"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Admins can update inventory in their organization"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can delete inventory in their organization"
  ON public.inventory FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

-- RLS Policies for bills
CREATE POLICY "Users can view bills in their organization"
  ON public.bills FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert bills in their organization"
  ON public.bills FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Admins can update bills in their organization"
  ON public.bills FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

CREATE POLICY "Admins can delete bills in their organization"
  ON public.bills FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_admin());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at 
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Note: This function will need to be called manually after user signup
  -- since we need to know which organization they belong to
  RETURN NEW;
END;
$$;
