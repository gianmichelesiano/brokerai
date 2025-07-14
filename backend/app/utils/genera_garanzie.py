"""
Insurance Guarantees Generator Service with LangChain Structured Output

This module provides insurance guarantees generation using LangChain's
structured output capabilities, eliminating JSON parsing errors and improving reliability.
"""

import logging
from typing import cast, List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from app.utils.garanzie_formatter import get_all_garanzie_formatted
from app.config.database import get_supabase

# Initialize logger
logger = logging.getLogger(__name__)


# Local Pydantic models to replace external dependencies
class GuaranteeItem(BaseModel):
    """Model for a single guarantee item"""
    name: str = Field(..., description="Name of the guarantee")
    description: str = Field(..., description="Detailed description of the guarantee")
    section: str = Field(..., description="Section category of the guarantee")
    is_duplicate: bool = Field(default=False, description="Whether this guarantee is a duplicate")
    is_new: bool = Field(default=True, description="Whether this is a new guarantee")


class InsuranceAnalysis(BaseModel):
    """Model for complete insurance analysis result"""
    insurance_type: str = Field(..., description="Type of insurance analyzed")
    field_description: str = Field(..., description="Field of application description")
    summary: str = Field(..., description="Summary of the analysis")
    guarantees: List[GuaranteeItem] = Field(default_factory=list, description="List of guarantees")
    existing_guarantees_found: List[str] = Field(default_factory=list, description="Existing guarantees found")
    new_guarantees_added: List[str] = Field(default_factory=list, description="New guarantees added")


def sanitize_text(text: str) -> str:
    """
    Sanitize text to prevent encoding issues
    
    Args:
        text: Text to sanitize
        
    Returns:
        str: Sanitized text
    """
    if not text:
        return ""
    
    # Remove or replace problematic characters
    text = text.strip()
    # Replace common problematic characters
    replacements = {
        '"': '"',
        '"': '"',
        ''': "'",
        ''': "'",
        '–': '-',
        '—': '-',
        '…': '...'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text


class InsuranceGuaranteesService:
    """
    Service for generating insurance guarantees using LangChain structured output.
    """

    def __init__(
        self,
        model_name: str = "gpt-4.1-mini",
        temperature: float = 0.0,
        max_tokens: int = 16384,
        timeout: int = 300,
    ):
        """
        Initialize the Insurance Guarantees Service.

        Args:
            model_name: OpenAI model to use
            temperature: Temperature setting for the model
            max_tokens: Maximum tokens for completion
            timeout: Timeout in seconds for API calls
        """
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.model = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
        )
        # Bind the schema to the model for structured output
        self.structured_model = self.model.with_structured_output(
            InsuranceAnalysis
        )
        # Initialize empty guarantees list - will be loaded when needed
        self.existing_guarantees = []
        self._guarantees_loaded = False
        
        logger.info(
            f"Insurance Guarantees Service initialized with model: "
            f"{model_name}, max_tokens: {max_tokens}, timeout: {timeout}s"
        )

    async def _load_existing_guarantees(self) -> List[dict]:
        """
        Load existing guarantees from the database using garanzie_formatter.
        
        Returns:
            List[dict]: List of existing guarantees with section and name
        """
        try:
            # Get formatted guarantees from database
            formatted_guarantees = await get_all_garanzie_formatted()
            
            guarantees_list = []
            for formatted_guarantee in formatted_guarantees:
                # Parse the formatted string: "Sezione: NOME_SEZIONE; Garanzia: TITOLO_GARANZIA"
                if "; Garanzia: " in formatted_guarantee and "Sezione: " in formatted_guarantee:
                    parts = formatted_guarantee.split("; Garanzia: ")
                    if len(parts) == 2:
                        section_part = parts[0].replace("Sezione: ", "").strip()
                        guarantee_name = parts[1].strip()
                        
                        guarantees_list.append({
                            "section": section_part,
                            "name": guarantee_name
                        })
            
            logger.info(f"Loaded {len(guarantees_list)} existing guarantees from database")
            return guarantees_list
            
        except Exception as e:
            logger.error(f"Error loading existing guarantees from database: {e}")
            # Fallback to empty list if database is not available
            logger.warning("Using empty guarantees list as fallback")
            return []

    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text string.
        Rough estimation: 1 token ≈ 4 characters for English text.

        Args:
            text: Text to estimate tokens for

        Returns:
            int: Estimated number of tokens
        """
        return len(text) // 4

    async def _ensure_guarantees_loaded(self) -> None:
        """
        Ensure that existing guarantees are loaded from database.
        """
        if not self._guarantees_loaded:
            self.existing_guarantees = await self._load_existing_guarantees()
            self._guarantees_loaded = True

    async def generate_guarantees(
        self, 
        insurance_type_name: str, 
        field_description: str,
        custom_requirements: Optional[str] = None
    ) -> InsuranceAnalysis:
        """
        Generate insurance guarantees for a specific insurance type.

        Args:
            insurance_type_name: Name of the insurance type
            field_description: Description of the field of application
            custom_requirements: Optional custom requirements

        Returns:
            InsuranceAnalysis: Structured analysis with guarantees organized by sections

        Raises:
            ValueError: If inputs are invalid
            Exception: If generation fails
        """
        if not insurance_type_name or not field_description:
            raise ValueError("Insurance type name and field description are required")

        # Ensure existing guarantees are loaded
        await self._ensure_guarantees_loaded()

        # Log input parameters for monitoring
        logger.info(
            f"Generating guarantees for: {insurance_type_name} - "
            f"Field: {field_description[:100]}..."
        )

        # Create system message with expert instructions
        system_message = SystemMessage(
            content=(
                "You are an expert insurance consultant with over 20 years of "
                "experience in the Italian insurance market. You specialize in "
                "creating comprehensive insurance guarantee packages for different "
                "types of insurance coverage. You understand Italian insurance "
                "terminology and regulations."
            )
        )

        # Create user message with generation instructions
        user_message = HumanMessage(
            content=self._create_generation_prompt(
                insurance_type_name, field_description, custom_requirements
            )
        )

        try:
            # Invoke the structured model asynchronously
            raw_result = await self.structured_model.ainvoke(
                [system_message, user_message]
            )

            # Cast the result to the expected type
            result = cast(InsuranceAnalysis, raw_result)

            # Sanitize text fields to prevent encoding issues
            result.insurance_type = sanitize_text(result.insurance_type)
            result.field_description = sanitize_text(result.field_description)
            result.summary = sanitize_text(result.summary)

            # Sanitize text fields in guarantee items
            for guarantee in result.guarantees:
                guarantee.name = sanitize_text(guarantee.name)
                guarantee.description = sanitize_text(guarantee.description)
                guarantee.section = sanitize_text(guarantee.section)

            # Perform duplicate checking
            result = self._check_and_mark_duplicates(result)

            # Validate the result
            if not result.guarantees:
                logger.warning(
                    f"No guarantees generated for {insurance_type_name}"
                )

            logger.info(
                f"Successfully generated {len(result.guarantees)} guarantees "
                f"for {insurance_type_name}"
            )

            return result

        except Exception as e:
            logger.error(f"Error generating guarantees for {insurance_type_name}: {str(e)}")
            # Return a structured error response
            return InsuranceAnalysis(
                insurance_type=insurance_type_name,
                field_description=field_description,
                summary=f"Error: Could not generate guarantees for {insurance_type_name}. "
                       f"Analysis failed due to technical error.",
                guarantees=[
                    GuaranteeItem(
                        name="ERROR",
                        description="Error occurred during generation",
                        section="ERROR",
                        is_duplicate=False,
                        is_new=False
                    )
                ],
                existing_guarantees_found=[],
                new_guarantees_added=[]
            )

    def _create_generation_prompt(
        self, 
        insurance_type_name: str, 
        field_description: str,
        custom_requirements: Optional[str] = None
    ) -> str:
        """
        Create the generation prompt for the LLM.

        Args:
            insurance_type_name: Name of the insurance type
            field_description: Description of the field of application
            custom_requirements: Optional custom requirements

        Returns:
            str: Formatted prompt for generation
        """
        existing_guarantees_text = "\n".join([
            f"Sezione: {g['section']}; Garanzia: {g['name']}" 
            for g in self.existing_guarantees
        ])
        
        custom_section = ""
        if custom_requirements:
            custom_section = f"""
**Custom Requirements:**
{custom_requirements}
"""

        return f"""
**Insurance Guarantees Generation Task:**
Generate comprehensive insurance guarantees for the specified insurance type.

**Input Parameters:**
- **Insurance Type**: {insurance_type_name}
- **Field of Application**: {field_description}
{custom_section}

**Existing Guarantees to Check Against:**
{existing_guarantees_text}

**Your Task:**
1. Analyze the insurance type and field of application
2. Generate a comprehensive list of relevant guarantees
3. Organize guarantees into logical sections
4. Check for duplicates against existing guarantees
5. Ensure Italian insurance terminology compliance

**Output Requirements:**

1. **insurance_type**: Return exactly "{insurance_type_name}"

2. **field_description**: Return exactly "{field_description}"

3. **summary**: Provide a concise summary (max 1000 characters) covering:
   - Main risks covered by this insurance type
   - Key protection areas
   - Target audience and use cases
   - Regulatory compliance aspects

4. **guarantees**: Generate 8-15 relevant guarantees with:
   - **name**: Clear, professional guarantee name in Italian
   - **description**: Detailed explanation of what the guarantee covers
   - **section**: One of: "INFORTUNI", "RESPONSABILITÀ CIVILE", "DANNI AI BENI", "TUTELA LEGALE", "ASSISTENZA", "PERDITE PECUNIARIE"
   - **is_duplicate**: Set to true if similar guarantee exists in the provided list
   - **is_new**: Set to true if this is a new guarantee specific to this type

**Section Guidelines:**
- **INFORTUNI**: Personal injuries, disability, death, medical expenses
- **RESPONSABILITÀ CIVILE**: Third-party liability, professional liability, product liability
- **DANNI AI BENI**: Property damage, theft, fire, equipment damage
- **TUTELA LEGALE**: Legal assistance, court costs, legal disputes
- **ASSISTENZA**: Support services, emergency assistance, consultation
- **PERDITE PECUNIARIE**: Financial losses, business interruption, lost profits

**Quality Standards:**
- Use professional Italian insurance terminology
- Be specific to the insurance type's risks
- Ensure comprehensive coverage
- Maintain consistency with Italian insurance market standards
- Include both traditional and innovative guarantees when appropriate

**Examples of Good Guarantee Names:**
✅ "RC professionale medici"
✅ "Furto attrezzature informatiche"
✅ "Interruzione attività commerciale"
✅ "Tutela legale tributaria"
✅ "Assistenza psicologica post-sinistro"

**Examples to Avoid:**
❌ Generic names like "Responsabilità civile"
❌ Overly technical jargon
❌ Duplicate coverage descriptions
❌ Non-Italian terminology
"""

    def _check_and_mark_duplicates(self, result: InsuranceAnalysis) -> InsuranceAnalysis:
        """
        Check for duplicate guarantees and mark them accordingly.

        Args:
            result: The insurance analysis result

        Returns:
            InsuranceAnalysis: Updated result with duplicate flags
        """
        existing_found = []
        new_added = []

        for guarantee in result.guarantees:
            # Check for duplicates considering both name and section
            is_duplicate = any(
                self._is_similar_guarantee(guarantee.name, existing["name"], guarantee.section, existing["section"])
                for existing in self.existing_guarantees
            )
            
            guarantee.is_duplicate = is_duplicate
            guarantee.is_new = not is_duplicate

            if is_duplicate:
                # Find the similar existing guarantee
                similar_existing = next(
                    (existing for existing in self.existing_guarantees
                     if self._is_similar_guarantee(guarantee.name, existing["name"], guarantee.section, existing["section"])),
                    None
                )
                if similar_existing:
                    existing_found.append(f"{similar_existing['section']}: {similar_existing['name']}")
            else:
                new_added.append(guarantee.name)

        result.existing_guarantees_found = existing_found
        result.new_guarantees_added = new_added

        return result

    def _is_similar_guarantee(self, new_guarantee: str, existing_guarantee: str, new_section: str, existing_section: str) -> bool:
        """
        Check if two guarantees are similar, considering both name and section.

        Args:
            new_guarantee: New guarantee name
            existing_guarantee: Existing guarantee name
            new_section: New guarantee section
            existing_section: Existing guarantee section

        Returns:
            bool: True if guarantees are similar
        """
        # Simple similarity check - can be enhanced with fuzzy matching
        new_clean = new_guarantee.lower().strip()
        existing_clean = existing_guarantee.lower().strip()
        
        # Check for exact match
        if new_clean == existing_clean and new_section == existing_section:
            return True
        
        # Check for partial matches with key terms, but only within the same section
        if new_section == existing_section:
            key_terms = ["rc", "responsabilità", "civile", "danni", "furto", "incendio", 
                        "infortuni", "tutela", "legale", "assistenza", "invalidità", "morte",
                        "rimborso", "spese", "mediche", "professionale"]
            
            new_terms = [term for term in key_terms if term in new_clean]
            existing_terms = [term for term in key_terms if term in existing_clean]
            
            # If they share significant key terms in the same section, consider them similar
            if len(new_terms) >= 2 and len(set(new_terms) & set(existing_terms)) >= 2:
                return True
        
        return False

    def add_existing_guarantee(self, guarantee_name: str, section: str) -> None:
        """
        Add a new guarantee to the existing guarantees list.

        Args:
            guarantee_name: Name of the guarantee to add
            section: Section of the guarantee
        """
        new_guarantee = {"section": section, "name": guarantee_name}
        if new_guarantee not in self.existing_guarantees:
            self.existing_guarantees.append(new_guarantee)
            logger.info(f"Added new existing guarantee: {section} - {guarantee_name}")

    def update_existing_guarantees(self, guarantees_list: List[dict]) -> None:
        """
        Update the entire existing guarantees list.

        Args:
            guarantees_list: New list of existing guarantees (dict with 'section' and 'name' keys)
        """
        self.existing_guarantees = guarantees_list
        logger.info(f"Updated existing guarantees list with {len(guarantees_list)} items")

    def get_existing_guarantees(self) -> List[dict]:
        """
        Get the current list of existing guarantees.

        Returns:
            List[dict]: Current existing guarantees with section and name
        """
        return self.existing_guarantees.copy()

    async def save_guarantees_to_database(
        self, 
        guarantees: List[GuaranteeItem], 
        tipologia_assicurazione_id: int
    ) -> List[Dict]:
        """
        Save generated guarantees to the database.
        
        Args:
            guarantees: List of guarantee items to save
            tipologia_assicurazione_id: ID of the insurance type
            
        Returns:
            List[Dict]: List of saved guarantee records
        """
        try:
            supabase = get_supabase()
            saved_guarantees = []
            
            # First, get sezioni mapping
            sezioni_result = supabase.table("sezioni").select("id, nome").execute()
            sezioni_map = {sezione["nome"]: sezione["id"] for sezione in sezioni_result.data}
            
            for guarantee in guarantees:
                # Find sezione_id
                sezione_id = sezioni_map.get(guarantee.section)
                if not sezione_id:
                    logger.warning(f"Sezione '{guarantee.section}' not found, skipping guarantee: {guarantee.name}")
                    continue
                
                # Prepare guarantee data
                guarantee_data = {
                    "sezione_id": sezione_id,
                    "titolo": guarantee.name,
                    "descrizione": guarantee.description,
                    "tipologia": tipologia_assicurazione_id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Check if guarantee already exists for THIS specific tipologia
                existing_check = supabase.table("garanzie").select("id").eq("titolo", guarantee.name).eq("sezione_id", sezione_id).eq("tipologia", tipologia_assicurazione_id).execute()
                
                if existing_check.data:
                    logger.info(f"Guarantee '{guarantee.name}' already exists for tipologia {tipologia_assicurazione_id}, skipping")
                    continue
                
                # Insert guarantee (even if it exists for other tipologie)
                result = supabase.table("garanzie").insert(guarantee_data).execute()
                
                if result.data:
                    saved_guarantees.append(result.data[0])
                    if guarantee.is_duplicate:
                        logger.info(f"Saved duplicate guarantee for new tipologia: {guarantee.name} (ID: {result.data[0]['id']})")
                    else:
                        logger.info(f"Saved new guarantee: {guarantee.name} (ID: {result.data[0]['id']})")
                else:
                    logger.error(f"Failed to save guarantee: {guarantee.name}")
            
            logger.info(f"Successfully saved {len(saved_guarantees)} guarantees to database")
            return saved_guarantees
            
        except Exception as e:
            logger.error(f"Error saving guarantees to database: {e}")
            raise Exception(f"Failed to save guarantees: {str(e)}")

    async def generate_and_save_guarantees(
        self,
        tipologia_assicurazione_id: int,
        insurance_type_name: str,
        field_description: str,
        custom_requirements: Optional[str] = None,
        save_duplicates: bool = False
    ) -> Dict:
        """
        Generate guarantees and save them to database in one operation.
        
        Args:
            tipologia_assicurazione_id: ID of the insurance type
            insurance_type_name: Name of the insurance type
            field_description: Description of the field of application
            custom_requirements: Optional custom requirements
            save_duplicates: Whether to save duplicate guarantees
            
        Returns:
            Dict: Summary of the operation with generated and saved guarantees
        """
        try:
            # Generate guarantees
            analysis = await self.generate_guarantees(
                insurance_type_name, 
                field_description, 
                custom_requirements
            )
            
            # Save ALL guarantees to database (including duplicates for this tipologia)
            # The save_guarantees_to_database method now handles duplicates correctly
            saved_guarantees = await self.save_guarantees_to_database(
                analysis.guarantees, 
                tipologia_assicurazione_id
            )
            
            # Prepare summary
            summary = {
                "tipologia_assicurazione_id": tipologia_assicurazione_id,
                "insurance_type": analysis.insurance_type,
                "field_description": analysis.field_description,
                "summary": analysis.summary,
                "total_generated": len(analysis.guarantees),
                "new_guarantees": len([g for g in analysis.guarantees if g.is_new]),
                "duplicate_guarantees": len([g for g in analysis.guarantees if g.is_duplicate]),
                "saved_to_database": len(saved_guarantees),
                "generated_guarantees": [
                    {
                        "name": g.name,
                        "description": g.description,
                        "section": g.section,
                        "is_duplicate": g.is_duplicate,
                        "is_new": g.is_new
                    }
                    for g in analysis.guarantees
                ],
                "saved_guarantees": saved_guarantees,
                "existing_guarantees_found": analysis.existing_guarantees_found,
                "new_guarantees_added": analysis.new_guarantees_added
            }
            
            logger.info(
                f"Generation and save completed for tipologia {tipologia_assicurazione_id}: "
                f"{len(analysis.guarantees)} generated, {len(saved_guarantees)} saved"
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error in generate_and_save_guarantees: {e}")
            raise Exception(f"Failed to generate and save guarantees: {str(e)}")
