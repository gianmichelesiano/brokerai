"""
Pydantic models module
"""

from .garanzie import (
    GaranziaBase,
    GaranziaCreate,
    GaranziaUpdate,
    Garanzia,
    GaranziaWithStats,
    GaranziaList,
    GaranziaListWithStats,
    GaranziaFilter,
    SezioneInfo,
    GaranziaStats,
    GaranziaBulkCreate,
    GaranziaBulkUpdate,
    GaranziaBulkDelete,
    GaranziaImport,
    GaranziaExport
)

from .compagnie import (
    CompagniaBase,
    CompagniaCreate,
    CompagniaUpdate,
    Compagnia,
    CompagniaWithStats,
    CompagniaList,
    CompagniaListWithStats,
    CompagniaFilter,
    FileUploadResponse,
    FileValidationResult,
    TextExtractionResult,
    CompagniaStats,
    CompagniaBulkCreate,
    CompagniaBulkUpdate,
    CompagniaBulkDelete,
    CompagniaSearch,
    CompagniaSearchResult,
    CompagniaSearchResponse,
    CompagniaImport,
    CompagniaExport,
    FileUploadProgress,
    CompagniaAnalysisRequest,
    CompagniaAnalysisProgress
)

from .mapping import (
    MappingRelationBase,
    MappingRelationCreate,
    MappingRelationUpdate,
    MappingRelation,
    MappingRelationSimple,
    MappingRelationList,
    MappingRelationFilter,
    CoverageMatrix,
    CoverageMatrixResponse,
    AnalysisRequest,
    AnalysisResult,
    AnalysisProgress,
    TestGaranziaRequest,
    TestGaranziaResult,
    MappingStats,
    MappingBulkCreate,
    MappingBulkUpdate,
    MappingBulkDelete,
    MappingImport,
    MappingExport,
    CompanyAnalysisComparison,
    AnalysisQualityMetrics
)

from .compagnia_tipologia import (
    CompagniaTipologiaBase,
    CompagniaTipologiaCreate,
    CompagniaTipologiaUpdate,
    CompagniaTipologia,
    CompagniaTipologiaWithDetails,
    CompagniaTipologiaList,
    CompagniaTipologiaFilter,
    CompagniaTipologiaStats,
    CompagniaTipologiaSearch,
    CompagniaTipologiaSearchResult,
    CompagniaTipologiaSearchResponse,
    CompagniaTipologiaBulkCreate,
    CompagniaTipologiaBulkUpdate,
    CompagniaTipologiaBulkDelete,
    FileUploadToCompagniaTipologia,
    TextExtractionResult as CompagniaTipologiaTextExtractionResult
)

from .confronti import (
    ConfrontoDettaglio,
    ConfrontoAspetto,
    ConfrontoAnalysis,
    ConfrontoRequest,
    ConfrontoResult,
)

from .brokers import (
    BrokerBase,
    BrokerCreate,
    BrokerUpdate,
    BrokerInDB,
    Broker,
    BrokerProfile,
    BrokerResponse,
    BrokerListResponse,
)

from .clients import (
    ClientType,
    IndividualProfileBase,
    IndividualProfileCreate,
    IndividualProfileUpdate,
    IndividualProfile,
    CompanyProfileBase,
    CompanyProfileCreate,
    CompanyProfileUpdate,
    CompanyProfile,
    ClientBase,
    ClientCreate,
    ClientCreateFlat,
    ClientUpdate,
    Client,
    ClientResponse,
    ClientListResponse,
)

from .interactions import (
    InteractionCreate,
    InteractionUpdate,
    Interaction,
    InteractionResponse,
    InteractionListResponse,
    InteractionType,
)

__all__ = [
    # Garanzie
    "GaranziaBase",
    "GaranziaCreate",
    "GaranziaUpdate",
    "Garanzia",
    "GaranziaWithStats",
    "GaranziaList",
    "GaranziaListWithStats",
    "GaranziaFilter",
    "SezioneInfo",
    "GaranziaStats",
    "GaranziaBulkCreate",
    "GaranziaBulkUpdate",
    "GaranziaBulkDelete",
    "GaranziaImport",
    "GaranziaExport",
    
    # Compagnie
    "CompagniaBase",
    "CompagniaCreate",
    "CompagniaUpdate",
    "Compagnia",
    "CompagniaWithStats",
    "CompagniaList",
    "CompagniaListWithStats",
    "CompagniaFilter",
    "FileUploadResponse",
    "FileValidationResult",
    "TextExtractionResult",
    "CompagniaStats",
    "CompagniaBulkCreate",
    "CompagniaBulkUpdate",
    "CompagniaBulkDelete",
    "CompagniaSearch",
    "CompagniaSearchResult",
    "CompagniaSearchResponse",
    "CompagniaImport",
    "CompagniaExport",
    "FileUploadProgress",
    "CompagniaAnalysisRequest",
    "CompagniaAnalysisProgress",
    
    # Compagnia-Tipologia
    "CompagniaTipologiaBase",
    "CompagniaTipologiaCreate",
    "CompagniaTipologiaUpdate",
    "CompagniaTipologia",
    "CompagniaTipologiaWithDetails",
    "CompagniaTipologiaList",
    "CompagniaTipologiaFilter",
    "CompagniaTipologiaStats",
    "CompagniaTipologiaSearch",
    "CompagniaTipologiaSearchResult",
    "CompagniaTipologiaSearchResponse",
    "CompagniaTipologiaBulkCreate",
    "CompagniaTipologiaBulkUpdate",
    "CompagniaTipologiaBulkDelete",
    "FileUploadToCompagniaTipologia",
    "CompagniaTipologiaTextExtractionResult",
    
    # Mapping
    "MappingRelationBase",
    "MappingRelationCreate",
    "MappingRelationUpdate",
    "MappingRelation",
    "MappingRelationSimple",
    "MappingRelationList",
    "MappingRelationFilter",
    "CoverageMatrix",
    "CoverageMatrixResponse",
    "AnalysisRequest",
    "AnalysisResult",
    "AnalysisProgress",
    "TestGaranziaRequest",
    "TestGaranziaResult",
    "MappingStats",
    "MappingBulkCreate",
    "MappingBulkUpdate",
    "MappingBulkDelete",
    "MappingImport",
    "MappingExport",
    "CompanyAnalysisComparison",
    "AnalysisQualityMetrics",
    
    # Confronti
    "ConfrontoDettaglio",
    "ConfrontoAspetto",
    "ConfrontoAnalysis",
    "ConfrontoRequest",
    "ConfrontoResult",
    
    # Brokers
    "BrokerBase",
    "BrokerCreate",
    "BrokerUpdate",
    "BrokerInDB",
    "Broker",
    "BrokerProfile",
    "BrokerResponse",
    "BrokerListResponse",
    
    # Clients
    "ClientType",
    "IndividualProfileBase",
    "IndividualProfileCreate",
    "IndividualProfileUpdate",
    "IndividualProfile",
    "CompanyProfileBase",
    "CompanyProfileCreate",
    "CompanyProfileUpdate",
    "CompanyProfile",
    "ClientBase",
    "ClientCreate",
    "ClientCreateFlat",
    "ClientUpdate",
    "Client",
    "ClientResponse",
    "ClientListResponse",
    
    # Interactions
    "InteractionCreate",
    "InteractionUpdate",
    "Interaction",
    "InteractionResponse",
    "InteractionListResponse",
    "InteractionType",
]
