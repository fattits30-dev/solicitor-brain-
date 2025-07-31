import logging
from datetime import UTC, datetime
from typing import Any, cast
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.models.case import Case
from backend.models.case_facts import CaseFact, FactRelation
from backend.services.monitoring import record_hallucination_block, timed
from backend.utils.compliance import check_citation

logger = logging.getLogger(__name__)


class FactService:
    """Core service for managing case facts with verification and compliance"""

    def __init__(self, db: AsyncSession):
        self.db = db

    @timed
    async def save_fact(
        self,
        case_id: UUID,
        fact_text: str,
        fact_type: str,
        source_document_id: UUID | None = None,
        source_page: str | None = None,
        source_text: str | None = None,
        citations: list[dict[str, Any]] | None = None,
        extracted_by_ai: bool = False,
        importance: str = "medium",
        category: str | None = None,
        tags: list[str] | None = None,
        user_id: str | None = None,
    ) -> CaseFact:
        """
        Save a fact with full verification and compliance checks
        """
        # Verify case exists
        case = await self.db.get(Case, case_id)
        if not case:
            raise ValueError(f"Case {case_id} not found")

        # If AI-extracted, verify citations
        if extracted_by_ai and settings.citation_required:
            if not citations or not check_citation(fact_text, citations):
                logger.warning(f"Blocked fact without proper citations: {fact_text[:100]}...")
                record_hallucination_block()
                raise ValueError("Facts must include valid citations from approved sources")

        # Create fact record
        fact = CaseFact(
            case_id=case_id,
            fact_type=fact_type,
            fact_text=fact_text,
            source_document_id=source_document_id,
            source_page=source_page,
            source_text=source_text,
            extracted_by_ai=extracted_by_ai,
            extraction_model=settings.primary_model if extracted_by_ai else None,
            extraction_timestamp=datetime.now(UTC) if extracted_by_ai else None,
            citations=citations,
            importance=importance,
            category=category,
            tags=tags,
            verification_status="unverified" if extracted_by_ai else "verified",
            verified_by=user_id if not extracted_by_ai else None,
            verified_at=datetime.now(UTC) if not extracted_by_ai else None,
            confidence_score=self._calculate_confidence(citations) if citations else 0.0,
        )

        # Parse date if it's a date-type fact
        if fact_type == "date":
            fact.fact_date = self._extract_date(fact_text)  # type: ignore[assignment]

        self.db.add(fact)

        # Check for related/conflicting facts
        await self._check_fact_relations(fact)

        await self.db.commit()
        await self.db.refresh(fact)

        logger.info(f"Saved fact {fact.id} for case {case_id}")
        return fact

    @timed
    async def verify_fact(
        self,
        fact_id: UUID,
        verification_status: str,
        user_id: str,
        amendment_reason: str | None = None,
    ) -> CaseFact:
        """Verify or dispute a fact"""
        fact = await self.db.get(CaseFact, fact_id)
        if not fact:
            raise ValueError(f"Fact {fact_id} not found")

        if verification_status not in ["verified", "disputed"]:
            raise ValueError("Invalid verification status")

        fact.verification_status = verification_status  # type: ignore[assignment]
        fact.verified_by = user_id  # type: ignore[assignment]
        fact.verified_at = datetime.now(UTC)  # type: ignore[assignment]

        if amendment_reason:
            fact.amendment_reason = amendment_reason  # type: ignore[assignment]

        await self.db.commit()
        await self.db.refresh(fact)

        return fact

    @timed
    async def sign_off_fact(
        self,
        fact_id: UUID,
        sign_off_status: str,
        user_id: str,
        amendment_reason: str | None = None,
    ) -> CaseFact:
        """Sign off on a fact (accept/amend/reject)"""
        fact = await self.db.get(CaseFact, fact_id)
        if not fact:
            raise ValueError(f"Fact {fact_id} not found")

        if sign_off_status not in ["accepted", "amended", "rejected"]:
            raise ValueError("Invalid sign-off status")

        fact.sign_off_status = sign_off_status  # type: ignore[assignment]
        fact.sign_off_by = user_id  # type: ignore[assignment]
        fact.sign_off_at = datetime.now(UTC)  # type: ignore[assignment]

        if amendment_reason:
            fact.amendment_reason = amendment_reason  # type: ignore[assignment]

        await self.db.commit()
        await self.db.refresh(fact)

        return fact

    @timed
    async def get_case_facts(
        self,
        case_id: UUID,
        fact_type: str | None = None,
        verification_status: str | None = None,
        importance: str | None = None,
        include_rejected: bool = False,
    ) -> list[CaseFact]:
        """Get all facts for a case with filtering"""
        query = select(CaseFact).where(CaseFact.case_id == case_id)

        if fact_type:
            query = query.where(CaseFact.fact_type == fact_type)

        if verification_status:
            query = query.where(CaseFact.verification_status == verification_status)

        if importance:
            query = query.where(CaseFact.importance == importance)

        if not include_rejected:
            query = query.where(CaseFact.sign_off_status != "rejected")

        query = query.order_by(CaseFact.created_at.desc())

        result = await self.db.execute(query)
        facts: list[CaseFact] = list(result.scalars().all())
        return facts

    @timed
    async def find_conflicting_facts(self, case_id: UUID) -> list[tuple[CaseFact, CaseFact]]:
        """Find potentially conflicting facts in a case"""
        facts = await self.get_case_facts(case_id)
        conflicts: list[tuple[CaseFact, CaseFact]] = []

        # Simple conflict detection - can be enhanced with NLP
        for i, fact1 in enumerate(facts):
            for fact2 in facts[i + 1 :]:
                if self._facts_may_conflict(fact1, fact2):
                    conflicts.append((fact1, fact2))

        return conflicts

    @timed
    async def get_critical_dates(self, case_id: UUID) -> list[CaseFact]:
        """Get all critical dates for a case"""
        query = (
            select(CaseFact)
            .where(
                and_(
                    CaseFact.case_id == case_id,
                    CaseFact.fact_type == "date",
                    CaseFact.importance.in_(["critical", "high"]),
                    CaseFact.sign_off_status != "rejected",
                )
            )
            .order_by(CaseFact.fact_date)
        )

        result = await self.db.execute(query)
        dates: list[CaseFact] = list(result.scalars().all())
        return dates

    @timed
    async def bulk_extract_facts(
        self, case_id: UUID, document_id: UUID, extracted_facts: list[dict[str, Any]]
    ) -> list[CaseFact]:
        """Bulk save facts extracted from a document"""
        saved_facts: list[CaseFact] = []

        for fact_data in extracted_facts:
            # Each fact must have citations
            if not fact_data.get("citations"):
                logger.warning(f"Skipping fact without citations: {fact_data.get('text', '')[:50]}...")
                continue

            try:
                fact = await self.save_fact(
                    case_id=case_id,
                    fact_text=fact_data["text"],
                    fact_type=fact_data.get("type", "general"),
                    source_document_id=document_id,
                    source_page=fact_data.get("page"),
                    source_text=fact_data.get("source_text"),
                    citations=fact_data["citations"],
                    extracted_by_ai=True,
                    importance=fact_data.get("importance", "medium"),
                    category=fact_data.get("category"),
                    tags=fact_data.get("tags", []),
                )
                saved_facts.append(fact)
            except ValueError as e:
                logger.error(f"Failed to save fact: {e}")
                continue

        return saved_facts

    def _calculate_confidence(self, citations: list[dict[str, Any]]) -> float:
        """Calculate confidence score based on citations"""
        if not citations:
            return 0.0

        confidences: list[Any] = [c.get("confidence", 0.0) for c in citations]
        return sum(confidences) / len(confidences)

    def _extract_date(self, text: str) -> datetime | None:
        """Extract date from text - simplified version"""
        # In production, use dateutil or similar
        import re
        from datetime import datetime

        # Look for common date patterns
        patterns = [
            r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})",  # DD/MM/YYYY or DD-MM-YYYY
            r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    # Simplified parsing - enhance in production
                    return datetime.strptime(match.group(0), "%d/%m/%Y")
                except ValueError:
                    pass

        return None

    async def _check_fact_relations(self, fact: CaseFact) -> None:
        """Check for related or conflicting facts"""
        # Get similar facts in the same case
        similar_facts = await self.db.execute(
            select(CaseFact).where(
                and_(
                    CaseFact.case_id == fact.case_id,
                    CaseFact.id != fact.id,
                    CaseFact.fact_type == fact.fact_type,
                    CaseFact.sign_off_status != "rejected",
                )
            )
        )

        for similar in similar_facts.scalars():
            relation_type = self._determine_relation(fact, similar)
            if relation_type:
                relation = FactRelation(
                    fact_id=fact.id,
                    related_fact_id=similar.id,
                    relation_type=relation_type,
                    confidence=0.8,  # Simplified - use NLP in production
                )
                self.db.add(relation)

    def _facts_may_conflict(self, fact1: CaseFact, fact2: CaseFact) -> bool:
        """Simple conflict detection - enhance with NLP"""
        # Use cast to tell the type checker these are instance values, not Column objects
        type1 = cast("str | None", fact1.fact_type)
        type2 = cast("str | None", fact2.fact_type)

        if type1 != type2:
            return False

        # Check for contradictory dates
        if type1 == "date":
            # Access the actual attribute values
            date1 = cast("datetime | None", fact1.fact_date)
            date2 = cast("datetime | None", fact2.fact_date)
            cat1 = cast("str | None", fact1.category)
            cat2 = cast("str | None", fact2.category)

            if date1 is not None and date2 is not None and cat1 == cat2 and date1 != date2:
                return True

        # Check for contradictory parties
        if type1 == "party":
            # Simple text comparison - enhance with NLP
            cat1 = cast("str | None", fact1.category)
            cat2 = cast("str | None", fact2.category)
            text1 = cast("str", fact1.fact_text)
            text2 = cast("str", fact2.fact_text)

            if cat1 == cat2 and text1 != text2:
                return True

        return False

    def _determine_relation(self, fact1: CaseFact, fact2: CaseFact) -> str | None:
        """Determine relationship between facts"""
        if self._facts_may_conflict(fact1, fact2):
            return "contradicts"

        # More sophisticated analysis would go here
        return None
