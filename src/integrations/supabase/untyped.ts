/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

// The generated Database type is refreshed by Lovable on its own schedule and may lag
// behind the migrations in supabase/migrations. Tables added for the broker workflow
// (lots, bids, sales, advances, bills, payments, ...) are accessed through this loosely
// typed client; row shapes are declared in src/types/agri.ts.
export const db = supabase as unknown as SupabaseClient<any, "public", any>;
