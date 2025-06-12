
-- Create farmers table
CREATE TABLE public.farmers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  items TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Given', 'Received')),
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  product TEXT NOT NULL,
  given_bags INTEGER NOT NULL DEFAULT 0,
  returned_bags INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for user-specific access)
CREATE POLICY "Enable read access for all users" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.farmers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.farmers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.inventory FOR DELETE USING (true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
