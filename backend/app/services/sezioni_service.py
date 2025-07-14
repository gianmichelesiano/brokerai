"""
Business logic service for Sezioni (Insurance Sections)
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import Client

from app.models.sezioni import (
    Sezione,
    SezioneCreate,
    SezioneUpdate,
    SezioneList,
    SezioneListWithStats,
    SezioneFilter,
    SezioneStats,
    SezioneWithStats
)
from app.config.database import Tables
from app.utils.exceptions import NotFoundError, DatabaseError, ValidationError

logger = logging.getLogger(__name__)


class SezioniService:
    """Service for managing sezioni business logic"""
    
    async def get_sezioni_list(self, filters: SezioneFilter, supabase: Client) -> SezioneList:
        """Get paginated list of sezioni with filters"""
        try:
            query = supabase.table(Tables.SEZIONI).select("*")
            
            # Apply search filter
            if filters.search:
                query = query.or_(
                    f"nome.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            # Apply sorting
            if filters.sort_order == "desc":
                query = query.order(filters.sort_by, desc=True)
            else:
                query = query.order(filters.sort_by)
            
            # Get total count
            count_result = supabase.table(Tables.SEZIONI).select("id", count="exact")
            if filters.search:
                count_result = count_result.or_(
                    f"nome.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            total = count_result.execute().count or 0
            
            # Apply pagination
            offset = (filters.page - 1) * filters.size
            query = query.range(offset, offset + filters.size - 1)
            
            result = query.execute()
            
            sezioni = [Sezione(**item) for item in result.data]
            pages = (total + filters.size - 1) // filters.size
            
            return SezioneList(
                items=sezioni,
                total=total,
                page=filters.page,
                size=filters.size,
                pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error getting sezioni list: {e}")
            raise DatabaseError(f"Errore nel recupero delle sezioni: {str(e)}")
    
    async def get_sezioni_list_with_stats(self, filters: SezioneFilter, supabase: Client) -> SezioneListWithStats:
        """Get paginated list of sezioni with garanzie count"""
        try:
            # Build query with garanzie count
            query = supabase.table(Tables.SEZIONI).select(
                "*, garanzie_count:garanzie(count)"
            )
            
            # Apply search filter
            if filters.search:
                query = query.or_(
                    f"nome.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            # Apply sorting
            if filters.sort_order == "desc":
                query = query.order(filters.sort_by, desc=True)
            else:
                query = query.order(filters.sort_by)
            
            # Get total count
            count_result = supabase.table(Tables.SEZIONI).select("id", count="exact")
            if filters.search:
                count_result = count_result.or_(
                    f"nome.ilike.%{filters.search}%,"
                    f"descrizione.ilike.%{filters.search}%"
                )
            
            total = count_result.execute().count or 0
            
            # Apply pagination
            offset = (filters.page - 1) * filters.size
            query = query.range(offset, offset + filters.size - 1)
            
            result = query.execute()
            
            sezioni_with_stats = []
            for item in result.data:
                garanzie_count = len(item.get('garanzie_count', [])) if item.get('garanzie_count') else 0
                sezione_data = {k: v for k, v in item.items() if k != 'garanzie_count'}
                sezione_data['garanzie_count'] = garanzie_count
                sezioni_with_stats.append(SezioneWithStats(**sezione_data))
            
            pages = (total + filters.size - 1) // filters.size
            
            return SezioneListWithStats(
                items=sezioni_with_stats,
                total=total,
                page=filters.page,
                size=filters.size,
                pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error getting sezioni list with stats: {e}")
            raise DatabaseError(f"Errore nel recupero delle sezioni con statistiche: {str(e)}")
    
    async def get_sezione_by_id(self, sezione_id: int, supabase: Client) -> Optional[Sezione]:
        """Get sezione by ID"""
        try:
            result = supabase.table(Tables.SEZIONI).select("*").eq("id", sezione_id).execute()
            
            if not result.data:
                return None
            
            return Sezione(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error getting sezione {sezione_id}: {e}")
            raise DatabaseError(f"Errore nel recupero della sezione: {str(e)}")
    
    async def get_sezione_by_nome(self, nome: str, supabase: Client) -> Optional[Sezione]:
        """Get sezione by nome"""
        try:
            result = supabase.table(Tables.SEZIONI).select("*").eq("nome", nome.upper()).execute()
            
            if not result.data:
                return None
            
            return Sezione(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error getting sezione by nome '{nome}': {e}")
            raise DatabaseError(f"Errore nel recupero della sezione: {str(e)}")
    
    async def create_sezione(self, sezione_data: SezioneCreate, supabase: Client) -> Sezione:
        """Create new sezione"""
        try:
            data = sezione_data.model_dump()
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            
            result = supabase.table(Tables.SEZIONI).insert(data).execute()
            
            if not result.data:
                raise DatabaseError("Nessun dato restituito dalla creazione")
            
            return Sezione(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error creating sezione: {e}")
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                raise ValidationError(
                    f"Esiste già una sezione con il nome '{sezione_data.nome}'",
                    "Utilizzare un nome diverso"
                )
            raise DatabaseError(f"Errore nella creazione della sezione: {str(e)}")
    
    async def update_sezione(self, sezione_id: int, sezione_data: SezioneUpdate, supabase: Client) -> Sezione:
        """Update existing sezione"""
        try:
            data = sezione_data.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.utcnow().isoformat()
            
            result = supabase.table(Tables.SEZIONI).update(data).eq("id", sezione_id).execute()
            
            if not result.data:
                raise NotFoundError("Sezione", sezione_id)
            
            return Sezione(**result.data[0])
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error updating sezione {sezione_id}: {e}")
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                raise ValidationError(
                    f"Esiste già una sezione con il nome '{sezione_data.nome}'",
                    "Utilizzare un nome diverso"
                )
            raise DatabaseError(f"Errore nell'aggiornamento della sezione: {str(e)}")
    
    async def delete_sezione(self, sezione_id: int, supabase: Client) -> bool:
        """Delete sezione"""
        try:
            # Check if sezione is used in garanzie
            garanzie_count = await self.count_sezione_garanzie(sezione_id, supabase)
            if garanzie_count > 0:
                raise ValidationError(
                    f"Impossibile eliminare la sezione: è utilizzata in {garanzie_count} garanzie",
                    "Eliminare prima le garanzie associate o assegnarle ad un'altra sezione"
                )
            
            result = supabase.table(Tables.SEZIONI).delete().eq("id", sezione_id).execute()
            
            return len(result.data) > 0
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error deleting sezione {sezione_id}: {e}")
            raise DatabaseError(f"Errore nell'eliminazione della sezione: {str(e)}")
    
    async def count_sezione_garanzie(self, sezione_id: int, supabase: Client) -> int:
        """Count garanzie using this sezione"""
        try:
            result = supabase.table(Tables.GARANZIE).select("id", count="exact").eq("sezione_id", sezione_id).execute()
            return result.count or 0
            
        except Exception as e:
            logger.error(f"Error counting garanzie for sezione {sezione_id}: {e}")
            return 0
    
    async def get_sezioni_stats(self, supabase: Client) -> SezioneStats:
        """Get sezioni statistics"""
        try:
            # Total sezioni
            total_result = supabase.table(Tables.SEZIONI).select("id", count="exact").execute()
            total_sezioni = total_result.count or 0
            
            # Sezioni with garanzie count
            sezioni_with_garanzie = supabase.table(Tables.SEZIONI).select(
                "id, nome, garanzie_count:garanzie(count)"
            ).execute()
            
            sezioni_con_garanzie = 0
            total_garanzie = 0
            sezione_piu_popolata = None
            max_garanzie = 0
            
            for sezione in sezioni_with_garanzie.data:
                garanzie_count = len(sezione.get('garanzie_count', [])) if sezione.get('garanzie_count') else 0
                total_garanzie += garanzie_count
                
                if garanzie_count > 0:
                    sezioni_con_garanzie += 1
                
                if garanzie_count > max_garanzie:
                    max_garanzie = garanzie_count
                    sezione_piu_popolata = sezione['nome']
            
            sezioni_senza_garanzie = total_sezioni - sezioni_con_garanzie
            media_garanzie_per_sezione = total_garanzie / total_sezioni if total_sezioni > 0 else 0
            
            # Latest creation and modification
            latest_result = supabase.table(Tables.SEZIONI).select("created_at, updated_at").order("created_at", desc=True).limit(1).execute()
            ultima_creazione = None
            ultima_modifica = None
            
            if latest_result.data:
                ultima_creazione = datetime.fromisoformat(latest_result.data[0]["created_at"].replace("Z", "+00:00"))
                
            latest_update = supabase.table(Tables.SEZIONI).select("updated_at").order("updated_at", desc=True).limit(1).execute()
            if latest_update.data:
                ultima_modifica = datetime.fromisoformat(latest_update.data[0]["updated_at"].replace("Z", "+00:00"))
            
            return SezioneStats(
                total_sezioni=total_sezioni,
                sezioni_con_garanzie=sezioni_con_garanzie,
                sezioni_senza_garanzie=sezioni_senza_garanzie,
                media_garanzie_per_sezione=round(media_garanzie_per_sezione, 2),
                sezione_piu_popolata=sezione_piu_popolata,
                ultima_creazione=ultima_creazione,
                ultima_modifica=ultima_modifica
            )
            
        except Exception as e:
            logger.error(f"Error getting sezioni stats: {e}")
            raise DatabaseError(f"Errore nel recupero delle statistiche: {str(e)}")
    
    async def search_sezioni(self, filters: SezioneFilter, supabase: Client) -> SezioneList:
        """Search sezioni by text"""
        return await self.get_sezioni_list(filters, supabase)
    
    async def get_all_sezioni_simple(self, supabase: Client) -> List[Sezione]:
        """Get all sezioni without pagination (for dropdowns, etc.)"""
        try:
            result = supabase.table(Tables.SEZIONI).select("*").order("nome").execute()
            return [Sezione(**item) for item in result.data]
            
        except Exception as e:
            logger.error(f"Error getting all sezioni: {e}")
            raise DatabaseError(f"Errore nel recupero delle sezioni: {str(e)}")
    
    async def bulk_create_sezioni(self, sezioni_data: List[SezioneCreate], supabase: Client) -> List[Sezione]:
        """Bulk create sezioni"""
        try:
            data_list = []
            for sezione_data in sezioni_data:
                data = sezione_data.model_dump()
                data["created_at"] = datetime.utcnow().isoformat()
                data["updated_at"] = datetime.utcnow().isoformat()
                data_list.append(data)
            
            result = supabase.table(Tables.SEZIONI).insert(data_list).execute()
            
            if not result.data:
                raise DatabaseError("Nessun dato restituito dalla creazione bulk")
            
            return [Sezione(**item) for item in result.data]
            
        except Exception as e:
            logger.error(f"Error bulk creating sezioni: {e}")
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                raise ValidationError(
                    "Una o più sezioni hanno nomi duplicati",
                    "Verificare che tutti i nomi siano unici"
                )
            raise DatabaseError(f"Errore nella creazione bulk delle sezioni: {str(e)}")


# Global service instance
sezioni_service = SezioniService()
