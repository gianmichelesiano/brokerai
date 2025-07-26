"""
Business logic service for Garanzie (Insurance Guarantees)
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import Client

from app.models.garanzie import (
    Garanzia,
    GaranziaCreate,
    GaranziaUpdate,
    GaranziaList,
    GaranziaFilter,
    GaranziaStats,
    SezioneInfo,
    TipologiaInfo,
    GaranzieByTipologiaResponse
)
from app.models.tipologia_assicurazione import TipologiaAssicurazione
from app.config.database import Tables
from app.utils.exceptions import NotFoundError, DatabaseError

logger = logging.getLogger(__name__)


class GaranzieService:
    """Service for managing garanzie business logic"""
    
    async def get_garanzie_list(self, filters: GaranziaFilter, supabase: Client) -> GaranziaList:
        """Get paginated list of garanzie with filters"""
        try:
            query = supabase.table(Tables.GARANZIE).select("*, sezioni(nome)")
            
            # Apply filters
            if filters.sezione:
                # Filter by sezione name through join
                query = query.eq("sezioni.nome", filters.sezione)
            
            if filters.tipologia_id:
                query = query.eq("tipologia", filters.tipologia_id)
            
            if filters.search:
                query = query.or_(
                    f"titolo.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            # Apply sorting
            if filters.sort_order == "desc":
                query = query.order(filters.sort_by, desc=True)
            else:
                query = query.order(filters.sort_by)
            
            # Get total count
            count_result = supabase.table(Tables.GARANZIE).select("id", count="exact")
            if filters.sezione:
                # Need to join for count as well
                count_result = supabase.table(Tables.GARANZIE).select("id, sezioni!inner(nome)", count="exact").eq("sezioni.nome", filters.sezione)
            if filters.tipologia_id:
                count_result = count_result.eq("tipologia", filters.tipologia_id)
            if filters.search:
                count_result = count_result.or_(
                    f"titolo.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            total = count_result.execute().count or 0
            
            # Apply pagination
            offset = (filters.page - 1) * filters.size
            query = query.range(offset, offset + filters.size - 1)
            
            result = query.execute()
            
            # Process the data to include section information
            garanzie = []
            for item in result.data:
                # Create a copy of the item and add section name if available
                garanzia_data = dict(item)
                if 'sezioni' in item and item['sezioni']:
                    garanzia_data['sezione_nome'] = item['sezioni']['nome']
                garanzie.append(Garanzia(**garanzia_data))
            
            pages = (total + filters.size - 1) // filters.size
            
            return GaranziaList(
                items=garanzie,
                total=total,
                page=filters.page,
                size=filters.size,
                pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error getting garanzie list: {e}")
            raise DatabaseError(f"Errore nel recupero delle garanzie: {str(e)}")
    
    async def get_garanzia_by_id(self, garanzia_id: int, supabase: Client) -> Optional[Garanzia]:
        """Get garanzia by ID with section information"""
        try:
            result = supabase.table(Tables.GARANZIE).select("*, sezioni(nome)").eq("id", garanzia_id).execute()
            
            if not result.data:
                return None
            
            # Process the data to include section information
            item = result.data[0]
            garanzia_data = dict(item)
            if 'sezioni' in item and item['sezioni']:
                garanzia_data['sezione_nome'] = item['sezioni']['nome']
            
            return Garanzia(**garanzia_data)
            
        except Exception as e:
            logger.error(f"Error getting garanzia {garanzia_id}: {e}")
            raise DatabaseError(f"Errore nel recupero della garanzia: {str(e)}")
    
    async def get_garanzia_by_title(self, title: str, company_id: str, supabase: Client) -> Optional[Garanzia]:
        """Get garanzia by title"""
        try:
            result = supabase.table(Tables.GARANZIE).select("*").eq("titolo", title).eq("company_id", company_id).execute()
            
            if not result.data:
                return None
            
            return Garanzia(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error getting garanzia by title '{title}': {e}")
            raise DatabaseError(f"Errore nel recupero della garanzia: {str(e)}")
    
    async def create_garanzia(self, garanzia_data: GaranziaCreate, company_id: str, supabase: Client) -> Garanzia:
        """Create new garanzia"""
        try:
            data = garanzia_data.model_dump()
            data["company_id"] = company_id  # Add multi-tenancy
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            
            result = supabase.table(Tables.GARANZIE).insert(data).execute()
            
            if not result.data:
                raise DatabaseError("Nessun dato restituito dalla creazione")
            
            return Garanzia(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error creating garanzia: {e}")
            raise DatabaseError(f"Errore nella creazione della garanzia: {str(e)}")
    
    async def update_garanzia(self, garanzia_id: int, garanzia_data: GaranziaUpdate, supabase: Client) -> Garanzia:
        """Update existing garanzia"""
        try:
            data = garanzia_data.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.utcnow().isoformat()
            
            result = supabase.table(Tables.GARANZIE).update(data).eq("id", garanzia_id).execute()
            
            if not result.data:
                raise NotFoundError("Garanzia", garanzia_id)
            
            return Garanzia(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error updating garanzia {garanzia_id}: {e}")
            raise DatabaseError(f"Errore nell'aggiornamento della garanzia: {str(e)}")
    
    async def delete_garanzia(self, garanzia_id: int, supabase: Client) -> bool:
        """Delete garanzia"""
        try:
            result = supabase.table(Tables.GARANZIE).delete().eq("id", garanzia_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting garanzia {garanzia_id}: {e}")
            raise DatabaseError(f"Errore nell'eliminazione della garanzia: {str(e)}")
    
    async def get_sezioni_list(self, supabase: Client) -> List[SezioneInfo]:
        """Get list of available sections"""
        try:
            # Get garanzie with sezioni join to count garanzie per sezione
            result = supabase.table(Tables.GARANZIE).select("sezione_id, sezioni(nome)").execute()
            
            # Count garanzie per sezione
            sezioni_count = {}
            for item in result.data:
                sezione_info = item.get("sezioni")
                if sezione_info and sezione_info.get("nome"):
                    sezione_nome = sezione_info["nome"]
                    sezioni_count[sezione_nome] = sezioni_count.get(sezione_nome, 0) + 1
            
            sezioni = [
                SezioneInfo(sezione=sezione, count=count)
                for sezione, count in sezioni_count.items()
            ]
            
            return sorted(sezioni, key=lambda x: x.sezione)
            
        except Exception as e:
            logger.error(f"Error getting sezioni list: {e}")
            raise DatabaseError(f"Errore nel recupero delle sezioni: {str(e)}")
    
    async def get_garanzie_stats(self, supabase: Client) -> GaranziaStats:
        """Get garanzie statistics"""
        try:
            # Total garanzie
            total_result = supabase.table(Tables.GARANZIE).select("id", count="exact").execute()
            total_garanzie = total_result.count or 0
            
            # Sezioni info
            sezioni = await self.get_sezioni_list(supabase)
            sezioni_count = len(sezioni)
            
            # Latest creation and modification
            latest_result = supabase.table(Tables.GARANZIE).select("created_at, updated_at").order("created_at", desc=True).limit(1).execute()
            ultima_creazione = None
            ultima_modifica = None
            
            if latest_result.data:
                ultima_creazione = datetime.fromisoformat(latest_result.data[0]["created_at"].replace("Z", "+00:00"))
                
            latest_update = supabase.table(Tables.GARANZIE).select("updated_at").order("updated_at", desc=True).limit(1).execute()
            if latest_update.data:
                ultima_modifica = datetime.fromisoformat(latest_update.data[0]["updated_at"].replace("Z", "+00:00"))
            
            return GaranziaStats(
                total_garanzie=total_garanzie,
                sezioni_count=sezioni_count,
                sezioni=sezioni,
                garanzie_con_coperture=0,  # TODO: implement when mapping is ready
                garanzie_senza_coperture=total_garanzie,  # TODO: implement when mapping is ready
                ultima_creazione=ultima_creazione,
                ultima_modifica=ultima_modifica
            )
            
        except Exception as e:
            logger.error(f"Error getting garanzie stats: {e}")
            raise DatabaseError(f"Errore nel recupero delle statistiche: {str(e)}")
    
    async def search_garanzie(self, filters: GaranziaFilter, supabase: Client) -> GaranziaList:
        """Search garanzie by text"""
        return await self.get_garanzie_list(filters, supabase)
    
    
    async def get_garanzia_coverage_stats(self, garanzia_id: int, supabase: Client) -> Dict[str, Any]:
        """Get coverage statistics for a garanzia (garanzia_compagnia table removed)"""
        try:
            # Since garanzia_compagnia table is no longer used, return default stats
            logger.info(f"Coverage stats for garanzia {garanzia_id} not available (garanzia_compagnia table removed)")
            
            return {
                "total_compagnie_analizzate": 0,
                "compagnie_con_copertura": 0,
                "compagnie_senza_copertura": 0,
                "percentuale_copertura": 0,
                "confidence_media": 0.0
            }
            
        except Exception as e:
            logger.error(f"Error getting coverage stats for garanzia {garanzia_id}: {e}")
            return {
                "total_compagnie_analizzate": 0,
                "compagnie_con_copertura": 0,
                "compagnie_senza_copertura": 0,
                "percentuale_copertura": 0,
                "confidence_media": 0.0
            }
    
    async def get_tipologia_by_id(self, tipologia_id: int, supabase: Client) -> Optional[TipologiaInfo]:
        """Get tipologia by ID"""
        try:
            result = supabase.table(Tables.TIPOLOGIA_ASSICURAZIONE).select("*").eq("id", tipologia_id).execute()
            
            if not result.data:
                return None
            
            tipologia_data = result.data[0]
            return TipologiaInfo(
                id=tipologia_data["id"],
                nome=tipologia_data["nome"],
                descrizione=tipologia_data.get("descrizione")
            )
            
        except Exception as e:
            logger.error(f"Error getting tipologia {tipologia_id}: {e}")
            raise DatabaseError(f"Errore nel recupero della tipologia: {str(e)}")
    
    async def get_tipologia_by_nome(self, nome: str, supabase: Client) -> Optional[TipologiaInfo]:
        """Get tipologia by nome"""
        try:
            result = supabase.table(Tables.TIPOLOGIA_ASSICURAZIONE).select("*").eq("nome", nome).execute()
            
            if not result.data:
                return None
            
            tipologia_data = result.data[0]
            return TipologiaInfo(
                id=tipologia_data["id"],
                nome=tipologia_data["nome"],
                descrizione=tipologia_data.get("descrizione")
            )
            
        except Exception as e:
            logger.error(f"Error getting tipologia by nome '{nome}': {e}")
            raise DatabaseError(f"Errore nel recupero della tipologia: {str(e)}")
    
    async def get_garanzie_by_tipologia_id(self, tipologia_id: int, filters: GaranziaFilter, supabase: Client) -> GaranzieByTipologiaResponse:
        """Get garanzie by tipologia ID with filters"""
        try:
            # First, get tipologia info
            tipologia = await self.get_tipologia_by_id(tipologia_id, supabase)
            if not tipologia:
                raise NotFoundError("Tipologia", tipologia_id)
            
            # Set tipologia filter
            filters.tipologia_id = tipologia_id
            
            # Get garanzie with tipologia filter - always include sezioni join
            query = supabase.table(Tables.GARANZIE).select("*, sezioni(nome)").eq("tipologia", tipologia_id)
            
            # Apply additional filters
            if filters.sezione:
                # Filter by sezione name through join
                query = query.eq("sezioni.nome", filters.sezione)
            
            if filters.search:
                query = query.or_(
                    f"titolo.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            # Apply sorting
            if filters.sort_order == "desc":
                query = query.order(filters.sort_by, desc=True)
            else:
                query = query.order(filters.sort_by)
            
            # Get total count
            count_result = supabase.table(Tables.GARANZIE).select("id", count="exact").eq("tipologia", tipologia_id)
            if filters.sezione:
                count_result = supabase.table(Tables.GARANZIE).select("id, sezioni!inner(nome)", count="exact").eq("tipologia", tipologia_id).eq("sezioni.nome", filters.sezione)
            if filters.search:
                count_result = count_result.or_(
                    f"titolo.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            total = count_result.execute().count or 0
            
            # Apply pagination
            offset = (filters.page - 1) * filters.size
            query = query.range(offset, offset + filters.size - 1)
            
            result = query.execute()
            
            # Process the data to include section information
            garanzie = []
            for item in result.data:
                # Create a copy of the item and add section name if available
                garanzia_data = dict(item)
                if 'sezioni' in item and item['sezioni']:
                    garanzia_data['sezione_nome'] = item['sezioni']['nome']
                garanzie.append(Garanzia(**garanzia_data))
            
            pages = (total + filters.size - 1) // filters.size
            
            garanzie_list = GaranziaList(
                items=garanzie,
                total=total,
                page=filters.page,
                size=filters.size,
                pages=pages
            )
            
            return GaranzieByTipologiaResponse(
                tipologia=tipologia,
                garanzie=garanzie_list
            )
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting garanzie by tipologia {tipologia_id}: {e}")
            raise DatabaseError(f"Errore nel recupero delle garanzie per tipologia: {str(e)}")
    
    async def get_garanzie_by_tipologia_nome(self, nome: str, filters: GaranziaFilter, supabase: Client) -> GaranzieByTipologiaResponse:
        """Get garanzie by tipologia nome with filters"""
        try:
            # First, get tipologia info by nome
            tipologia = await self.get_tipologia_by_nome(nome, supabase)
            if not tipologia:
                raise NotFoundError("Tipologia", nome)
            
            # Use the ID-based method
            return await self.get_garanzie_by_tipologia_id(tipologia.id, filters, supabase)
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting garanzie by tipologia nome '{nome}': {e}")
            raise DatabaseError(f"Errore nel recupero delle garanzie per tipologia: {str(e)}")

    async def get_garanzia_mappings(self, garanzia_id: int, supabase: Client) -> List[Dict]:
        """Get mappings associated with a garanzia"""
        try:
            # Since garanzia_compagnia table is no longer used, return empty list
            logger.info(f"Mappings for garanzia {garanzia_id} not available (garanzia_compagnia table removed)")
            return []
            
        except Exception as e:
            logger.error(f"Error getting mappings for garanzia {garanzia_id}: {e}")
            return []

    async def count_garanzia_mappings(self, garanzia_id: int, supabase: Client) -> int:
        """Count mappings associated with a garanzia"""
        try:
            # Since garanzia_compagnia table is no longer used, return 0
            logger.info(f"Mapping count for garanzia {garanzia_id} not available (garanzia_compagnia table removed)")
            return 0
            
        except Exception as e:
            logger.error(f"Error counting mappings for garanzia {garanzia_id}: {e}")
            return 0


# Global service instance
garanzie_service = GaranzieService()
