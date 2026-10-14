from supabase import create_client, Client

SUPABASE_URL = "https://dvihcmjxeooanargzpxb.supabase.co"
SUPABASE_KEY = "sb_publishable_IV9_rKRHgagioYNfVquMlA_O7p-ux7B"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch rows from the powerplants table to verify access
response = supabase.table("powerplants").select("*").execute()
print("Successfully connected! Powerplants found:")
print(response.data)