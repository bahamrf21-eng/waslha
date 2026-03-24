/**
 * Supabase Client – Connection Only
 * Creates the global `supabase` client instance.
 * All data helper functions live in ../js/db.js.
 *
 * Tables expected in Supabase:
 *   - profiles        (id, email, password, full_name, role, phone, address, preferred_delivery, delivery_company)
 *   - orders          (id, merchant_id, first_name, last_name, customer_address, product_name, wilaya, weight, notes, phone, status, delivery_company, delivery_type, delivery_note, started_at, created_at)
 *   - delivery_companies (id, name)
 *   - order_timelines (id, order_id, status, date)
 */

const SUPABASE_URL = 'https://vlwlqbmeuweykshqtgtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd2xxYm1ldXdleWtzaHF0Z3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjc0NzUsImV4cCI6MjA4Nzg0MzQ3NX0.6b4jB-TFYklQVQ4I1mTNVBWE_M5S0dsds3lsKeh1dHE';

// Store the client as window.supabaseDb to avoid collision with the CDN library (window.supabase)
const supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseDb = supabaseDb;