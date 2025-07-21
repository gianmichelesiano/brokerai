"""
Mock database configuration for development without Supabase
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class MockSupabaseClient:
    """Mock Supabase client for development"""
    
    def __init__(self):
        # In-memory storage for mock data
        self._tables = {
            "tipologia_assicurazione": [
                {
                    "id": 1,
                    "nome": "Auto",
                    "descrizione": "Assicurazione per veicoli",
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                },
                {
                    "id": 2,
                    "nome": "Casa",
                    "descrizione": "Assicurazione per abitazioni",
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                },
                {
                    "id": 3,
                    "nome": "Vita",
                    "descrizione": "Assicurazione sulla vita",
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ],
            "garanzie": [],
            "compagnie": [],
            "sezioni": []
        }
        self._next_id = 4
    
    def table(self, table_name: str):
        """Get table interface"""
        return MockTable(self._tables, table_name, self)
    
    def get_next_id(self) -> int:
        """Get next available ID"""
        current_id = self._next_id
        self._next_id += 1
        return current_id


class MockTable:
    """Mock table interface"""
    
    def __init__(self, tables: Dict, table_name: str, client: MockSupabaseClient):
        self.tables = tables
        self.table_name = table_name
        self.client = client
        self._query_filters = []
        self._select_fields = "*"
        self._order_by = None
        self._limit_value = None
        self._offset_value = 0
        self._count_mode = None
    
    def select(self, fields: str = "*", count: Optional[str] = None):
        """Select fields"""
        self._select_fields = fields
        self._count_mode = count
        return self
    
    def eq(self, field: str, value: Any):
        """Equal filter"""
        self._query_filters.append(("eq", field, value))
        return self
    
    def neq(self, field: str, value: Any):
        """Not equal filter"""
        self._query_filters.append(("neq", field, value))
        return self
    
    def ilike(self, field: str, pattern: str):
        """Case insensitive like filter"""
        self._query_filters.append(("ilike", field, pattern))
        return self
    
    def or_(self, condition: str):
        """OR condition"""
        self._query_filters.append(("or", condition, None))
        return self
    
    def in_(self, field: str, values: List[Any]):
        """IN filter"""
        self._query_filters.append(("in", field, values))
        return self
    
    def order(self, field: str, desc: bool = False):
        """Order by"""
        self._order_by = (field, desc)
        return self
    
    def limit(self, count: int):
        """Limit results"""
        self._limit_value = count
        return self
    
    def range(self, start: int, end: int):
        """Range (pagination)"""
        self._offset_value = start
        self._limit_value = end - start + 1
        return self
    
    def execute(self):
        """Execute query"""
        try:
            if self.table_name not in self.tables:
                self.tables[self.table_name] = []
            
            data = self.tables[self.table_name].copy()
            
            # Apply filters
            for filter_type, field, value in self._query_filters:
                if filter_type == "eq":
                    data = [item for item in data if item.get(field) == value]
                elif filter_type == "neq":
                    data = [item for item in data if item.get(field) != value]
                elif filter_type == "ilike":
                    pattern = value.replace("%", "").lower()
                    data = [item for item in data if pattern in str(item.get(field, "")).lower()]
                elif filter_type == "or":
                    # Simple OR implementation for search
                    if "ilike" in value:
                        parts = value.split(",")
                        filtered_data = []
                        for item in data:
                            for part in parts:
                                if "ilike" in part:
                                    field_pattern = part.split(".ilike.%")
                                    if len(field_pattern) == 2:
                                        field_name = field_pattern[0]
                                        pattern = field_pattern[1].replace("%", "").lower()
                                        if pattern in str(item.get(field_name, "")).lower():
                                            filtered_data.append(item)
                                            break
                        data = filtered_data
                elif filter_type == "in":
                    data = [item for item in data if item.get(field) in value]
            
            # Apply ordering
            if self._order_by:
                field, desc = self._order_by
                data.sort(key=lambda x: x.get(field, ""), reverse=desc)
            
            # Count before pagination
            total_count = len(data)
            
            # Apply pagination
            if self._offset_value > 0:
                data = data[self._offset_value:]
            if self._limit_value:
                data = data[:self._limit_value]
            
            # Return mock result
            result = MockResult(data, total_count if self._count_mode == "exact" else None)
            
            # Reset query state
            self._query_filters = []
            self._select_fields = "*"
            self._order_by = None
            self._limit_value = None
            self._offset_value = 0
            self._count_mode = None
            
            return result
            
        except Exception as e:
            logger.error(f"Mock query execution failed: {e}")
            raise
    
    def insert(self, data):
        """Insert data"""
        if self.table_name not in self.tables:
            self.tables[self.table_name] = []
        
        if isinstance(data, list):
            # Bulk insert
            inserted_items = []
            for item in data:
                new_item = item.copy()
                new_item["id"] = self.client.get_next_id()
                if "created_at" not in new_item:
                    new_item["created_at"] = datetime.utcnow().isoformat() + "Z"
                if "updated_at" not in new_item:
                    new_item["updated_at"] = datetime.utcnow().isoformat() + "Z"
                self.tables[self.table_name].append(new_item)
                inserted_items.append(new_item)
            return MockResult(inserted_items)
        else:
            # Single insert
            new_item = data.copy()
            new_item["id"] = self.client.get_next_id()
            if "created_at" not in new_item:
                new_item["created_at"] = datetime.utcnow().isoformat() + "Z"
            if "updated_at" not in new_item:
                new_item["updated_at"] = datetime.utcnow().isoformat() + "Z"
            self.tables[self.table_name].append(new_item)
            return MockResult([new_item])
    
    def update(self, data):
        """Update data"""
        # Apply filters to find items to update
        items_to_update = []
        for item in self.tables.get(self.table_name, []):
            should_update = True
            for filter_type, field, value in self._query_filters:
                if filter_type == "eq" and item.get(field) != value:
                    should_update = False
                    break
            if should_update:
                items_to_update.append(item)
        
        # Update items
        updated_items = []
        for item in items_to_update:
            item.update(data)
            item["updated_at"] = datetime.utcnow().isoformat() + "Z"
            updated_items.append(item)
        
        # Reset filters
        self._query_filters = []
        
        return MockResult(updated_items)
    
    def delete(self):
        """Delete data"""
        # Apply filters to find items to delete
        items_to_keep = []
        deleted_items = []
        
        for item in self.tables.get(self.table_name, []):
            should_delete = True
            for filter_type, field, value in self._query_filters:
                if filter_type == "eq" and item.get(field) != value:
                    should_delete = False
                    break
                elif filter_type == "in" and item.get(field) not in value:
                    should_delete = False
                    break
            
            if should_delete:
                deleted_items.append(item)
            else:
                items_to_keep.append(item)
        
        # Update table
        self.tables[self.table_name] = items_to_keep
        
        # Reset filters
        self._query_filters = []
        
        return MockResult(deleted_items)


class MockResult:
    """Mock result object"""
    
    def __init__(self, data: List[Dict], count: Optional[int] = None):
        self.data = data
        self.count = count


# Mock storage client
class MockStorage:
    """Mock storage client"""
    
    def list_buckets(self):
        """List storage buckets"""
        return [MockBucket("polizze")]


class MockBucket:
    """Mock storage bucket"""
    
    def __init__(self, name: str):
        self.name = name


# Global mock client instance
mock_client = MockSupabaseClient()
mock_client.storage = MockStorage()


def get_mock_supabase():
    """Get mock Supabase client"""
    return mock_client


def get_mock_supabase_service():
    """Get mock Supabase service client"""
    return mock_client
