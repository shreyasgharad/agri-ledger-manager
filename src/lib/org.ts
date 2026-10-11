
// Single-user mode: every business row belongs to this one organization.
// When authentication is enabled, read the org from the signed-in user's
// profile instead (public.profiles.org_id via auth.uid()).
export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export const getOrgId = (profileOrgId?: string | null): string =>
  profileOrgId ?? DEFAULT_ORG_ID;
