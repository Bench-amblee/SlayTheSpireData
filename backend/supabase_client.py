"""
Supabase client configuration and helper functions
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def get_supabase_client() -> Client:
    """
    Get Supabase client instance
    Returns None if credentials are not configured
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        return None

def is_supabase_configured() -> bool:
    """Check if Supabase credentials are configured"""
    return bool(SUPABASE_URL and SUPABASE_KEY)
