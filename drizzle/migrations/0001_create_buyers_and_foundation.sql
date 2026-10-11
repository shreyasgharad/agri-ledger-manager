
-- Reusable updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Default org helper (single-user mode for now)
CREATE OR REPLACE FUNCTION public.default_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  select '00000000-0000-0000-0000-000000000001'::uuid;
$function$;

-- Ensure default org exists in organizations
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Org')
ON CONFLICT (id) DO NOTHING;

-- Buyers table following the common convention:
-- id uuid default gen_random_uuid(), org_id default default_org_id(),
-- created_by, created_at, updated_at, deleted_at
CREATE TABLE public.buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT public.default_org_id() REFERENCES public.organizations(id),
  code text NOT NULL,
  name text NOT NULL,
  firm_name text,
  phone text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyers TO anon;
GRANT ALL ON public.buyers TO service_role;

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Open policies scoped to the default org (single-user mode; swap for auth.uid() later)
CREATE POLICY buyers_readable ON public.buyers FOR SELECT TO anon, authenticated
  USING (org_id = public.current_org_id() AND deleted_at IS NULL);
CREATE POLICY buyers_creatable ON public.buyers FOR INSERT TO anon, authenticated
  WITH CHECK (org_id = public.current_org_id());
CREATE POLICY buyers_updatable ON public.buyers FOR UPDATE TO anon, authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY buyers_deletable ON public.buyers FOR DELETE TO anon, authenticated
  USING (org_id = public.current_org_id());

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sequence + trigger for human-readable codes B-0001, B-0002, ...
CREATE SEQUENCE public.buyer_code_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_buyer_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  if new.code is null or new.code = '' then
    new.code := 'B-' || lpad(nextval('public.buyer_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$function$;

CREATE TRIGGER assign_buyer_code BEFORE INSERT ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.assign_buyer_code();

-- ILIKE-friendly trigram indexes on name and phone
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX buyers_name_trgm_idx ON public.buyers USING gin (name gin_trgm_ops);
CREATE INDEX buyers_phone_trgm_idx ON public.buyers USING gin (phone gin_trgm_ops);
CREATE INDEX buyers_org_active_idx ON public.buyers (org_id) WHERE deleted_at IS NULL;
