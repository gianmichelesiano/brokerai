"""
Database configuration and Supabase client setup
"""

import logging
from typing import Optional
from supabase import create_client, Client
from app.config.settings import settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase client wrapper"""
    
    def __init__(self):
        self._client: Optional[Client] = None
        self._service_client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get Supabase client with anon key"""
        if self._client is None:
            try:
                self._client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
                logger.info("✅ Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase client: {e}")
                raise
        return self._client
    
    @property
    def service_client(self) -> Client:
        """Get Supabase client with service role key (admin privileges)"""
        if self._service_client is None:
            try:
                self._service_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_KEY
                )
                logger.info("✅ Supabase service client initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase service client: {e}")
                raise
        return self._service_client
    
    async def test_connection(self) -> bool:
        """Test database connection"""
        try:
            # Test with a simple query
            result = self.client.table("garanzie").select("id").limit(1).execute()
            logger.info("✅ Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {e}")
            return False
    
    async def get_table_info(self, table_name: str) -> dict:
        """Get table information"""
        try:
            # Get table schema info
            result = self.service_client.rpc(
                "get_table_info", 
                {"table_name": table_name}
            ).execute()
            return result.data
        except Exception as e:
            logger.error(f"❌ Failed to get table info for {table_name}: {e}")
            return {}


# Global Supabase client instance
supabase_client = SupabaseClient()


def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    return supabase_client.client


def get_supabase_service() -> Client:
    """Dependency to get Supabase service client"""
    return supabase_client.service_client


# Database table names
class Tables:
    """Database table names"""
    GARANZIE = "garanzie"
    SEZIONI = "sezioni"
    COMPAGNIE = "compagnie"
    CONFRONTI_COPERTURE = "confronti_coperture"
    TIPOLOGIA_ASSICURAZIONE = "tipologia_assicurazione"
    ANALISI_AI_POLIZZE = "analisi_ai_polizze" # Added for AI analysis results
    CONFRONTI_SALVATI = "confronti_salvati" # Added for saved comparisons


# Storage bucket names
class Buckets:
    """Storage bucket names"""
    POLIZZE = "polizze"


# Database utility functions
async def execute_query(query: str, params: dict = None) -> dict:
    """Execute raw SQL query"""
    try:
        client = get_supabase_service()
        result = client.rpc("execute_sql", {
            "query": query,
            "params": params or {}
        }).execute()
        return {
            "success": True,
            "data": result.data,
            "count": len(result.data) if result.data else 0
        }
    except Exception as e:
        logger.error(f"❌ Query execution failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": None,
            "count": 0
        }


async def check_table_exists(table_name: str) -> bool:
    """Check if table exists"""
    try:
        client = get_supabase()
        result = client.table(table_name).select("*").limit(1).execute()
        return True
    except Exception:
        return False


async def get_table_count(table_name: str) -> int:
    """Get total count of records in table"""
    try:
        client = get_supabase()
        result = client.table(table_name).select("*", count="exact").execute()
        return result.count or 0
    except Exception as e:
        logger.error(f"❌ Failed to get count for table {table_name}: {e}")
        return 0


# Database health check
async def database_health_check() -> dict:
    """Comprehensive database health check"""
    health_status = {
        "database_connected": False,
        "tables_accessible": {},
        "storage_accessible": False,
        "total_records": {}
    }
    
    try:
        # Test basic connection
        health_status["database_connected"] = await supabase_client.test_connection()
        
        # Test table accessibility
        tables_to_check = [Tables.GARANZIE, Tables.COMPAGNIE, Tables.CONFRONTI_COPERTURE]
        for table in tables_to_check:
            health_status["tables_accessible"][table] = await check_table_exists(table)
            if health_status["tables_accessible"][table]:
                health_status["total_records"][table] = await get_table_count(table)
        
        # Test storage accessibility
        try:
            client = get_supabase()
            buckets = client.storage.list_buckets()
            health_status["storage_accessible"] = any(
                bucket.name == Buckets.POLIZZE for bucket in buckets
            )
        except Exception:
            health_status["storage_accessible"] = False
            
    except Exception as e:
        logger.error(f"❌ Database health check failed: {e}")
    
    return health_status
