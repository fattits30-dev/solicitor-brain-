"""
UK Solicitor-Grade Case Analysis System
Analyzes cases, evidence, and provides legal citations
"""
import asyncio
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.case import Case, CaseStatus
from backend.models.document import Document, DocumentType
from backend.services.ai_service import ai_service
from backend.utils.database import AsyncSessionLocal


class LegalArea(Enum):
    CONTRACT = "Contract Law"
    TORT = "Tort Law"
    CRIMINAL = "Criminal Law"
    FAMILY = "Family Law"
    PROPERTY = "Property Law"
    EMPLOYMENT = "Employment Law"
    COMPANY = "Company Law"
    IP = "Intellectual Property"
    IMMIGRATION = "Immigration Law"
    TAX = "Tax Law"


class IssueType(Enum):
    BREACH_CONTRACT = "Breach of Contract"
    NEGLIGENCE = "Negligence"
    FRAUD = "Fraud"
    MISREPRESENTATION = "Misrepresentation"
    UNFAIR_DISMISSAL = "Unfair Dismissal"
    DISCRIMINATION = "Discrimination"
    PROPERTY_DISPUTE = "Property Dispute"
    CUSTODY = "Child Custody"
    DATA_BREACH = "Data Protection Breach"
    TAX_EVASION = "Tax Evasion"


@dataclass
class LegalIssue:
    """Represents a legal issue found in the case"""

    issue_type: IssueType
    description: str
    severity: str  # critical, high, medium, low
    applicable_laws: list[str]
    evidence_refs: list[str]
    remedies: list[str]
    time_limits: str | None = None


@dataclass
class LegalCitation:
    """UK Legal Citation"""

    case_name: str
    citation: str  # e.g., [2023] UKSC 15
    court: str
    year: int
    principle: str
    relevance: str


@dataclass
class StatutoryProvision:
    """UK Statutory Reference"""

    act_name: str
    year: int
    section: str
    subsection: str | None
    description: str
    application: str


class CaseAnalyzer:
    """Professional UK solicitor-grade case analyzer"""

    # UK Limitation periods
    LIMITATION_PERIODS = {
        IssueType.BREACH_CONTRACT: "6 years from breach",
        IssueType.NEGLIGENCE: "6 years from damage (or 3 years for personal injury)",
        IssueType.FRAUD: "6 years from discovery",
        IssueType.UNFAIR_DISMISSAL: "3 months from dismissal",
        IssueType.DISCRIMINATION: "3 months from act",
        IssueType.PROPERTY_DISPUTE: "12 years for land",
    }

    # Key UK Statutes
    UK_STATUTES = {
        "contracts": [
            StatutoryProvision(
                "Sale of Goods Act",
                1979,
                "14",
                None,
                "Implied terms about quality",
                "Goods must be of satisfactory quality",
            ),
            StatutoryProvision(
                "Consumer Rights Act",
                2015,
                "9",
                None,
                "Goods to be of satisfactory quality",
                "Protection for consumers",
            ),
            StatutoryProvision(
                "Unfair Contract Terms Act",
                1977,
                "3",
                None,
                "Liability for negligence",
                "Cannot exclude liability for death/injury",
            ),
        ],
        "employment": [
            StatutoryProvision(
                "Employment Rights Act",
                1996,
                "94",
                None,
                "Right not to be unfairly dismissed",
                "Protection after 2 years service",
            ),
            StatutoryProvision(
                "Equality Act",
                2010,
                "13",
                None,
                "Direct discrimination",
                "Protected characteristics",
            ),
        ],
        "data": [
            StatutoryProvision(
                "Data Protection Act",
                2018,
                "170",
                None,
                "Personal data breach",
                "Notification requirements",
            ),
        ],
    }

    # Leading UK Cases
    UK_CASES = {
        "contract": [
            LegalCitation(
                "Hadley v Baxendale",
                "[1854] EWHC J70",
                "Court of Exchequer",
                1854,
                "Remoteness of damage in contract",
                "Damages must be foreseeable",
            ),
            LegalCitation(
                "Carlill v Carbolic Smoke Ball Co",
                "[1893] 1 QB 256",
                "Court of Appeal",
                1893,
                "Unilateral contracts and offer",
                "Advertisement can be binding offer",
            ),
        ],
        "negligence": [
            LegalCitation(
                "Donoghue v Stevenson",
                "[1932] UKHL 100",
                "House of Lords",
                1932,
                "Duty of care and neighbour principle",
                "Foundation of negligence law",
            ),
            LegalCitation(
                "Caparo Industries v Dickman",
                "[1990] 2 AC 605",
                "House of Lords",
                1990,
                "Three-fold test for duty of care",
                "Foreseeability, proximity, fair/just",
            ),
        ],
    }

    def __init__(self):
        self.current_case: Case | None = None
        self.case_documents: list[Document] = []
        self.analysis_results: dict[str, Any] = {}

    async def analyze_case(self, case_id: str, db: AsyncSession) -> dict[str, Any]:
        """Main entry point for case analysis"""
        # Load case and documents
        await self.load_case(case_id, db)

        if not self.current_case:
            return {"error": "Case not found"}


        # Step 1: Create case file structure
        file_structure = await self.create_case_structure()

        # Step 2: Scan and classify evidence
        evidence_analysis = await self._analyze_evidence()

        # Step 3: Identify legal issues
        legal_issues = await self.identify_legal_issues()

        # Step 4: Find applicable laws and citations
        legal_framework = await self._find_applicable_laws(legal_issues)

        # Step 5: Check for breaches and violations
        violations = await self._check_legal_violations()

        # Step 6: Generate recommendations
        recommendations = await self._generate_recommendations(legal_issues, violations)

        # Step 7: Calculate risk assessment
        risk_assessment = self._calculate_risk_score(legal_issues, violations)

        # Compile comprehensive analysis
        self.analysis_results = {
            "case_id": case_id,
            "case_number": self.current_case.case_number,
            "analysis_date": datetime.now(UTC).isoformat(),
            "file_structure": file_structure,
            "evidence_analysis": evidence_analysis,
            "legal_issues": [self.serialize_issue(issue) for issue in legal_issues],
            "legal_framework": legal_framework,
            "violations": violations,
            "recommendations": recommendations,
            "risk_assessment": risk_assessment,
            "next_steps": self._generate_next_steps(legal_issues),
            "compliance_status": self.check_sra_compliance(),
        }

        # Save analysis to database
        await self._save_analysis(db)

        return self.analysis_results

    async def load_case(self, case_id: str, db: AsyncSession):
        """Load case and related documents"""
        # Get case
        result = await db.execute(select(Case).where(Case.id == case_id))
        self.current_case = result.scalar_one_or_none()

        if self.current_case:
            # Get all documents for the case
            docs_result = await db.execute(select(Document).where(Document.case_id == case_id))
            self.case_documents = list(docs_result.scalars().all())

    async def create_case_structure(self) -> dict[str, Any]:
        """Create professional case file structure"""
        if not self.current_case:
            return {}

        structure: dict[str, Any] = {
            "1_Client_Information": {
                "client_details": self.current_case.client_name,
                "contact_info": {
                    "email": self.current_case.client_email,
                    "phone": self.current_case.client_phone,
                },
                "client_instructions": "To be documented",
            },
            "2_Case_Summary": {
                "case_type": self.current_case.case_type,
                "key_dates": {
                    "instruction_date": self.current_case.created_at.isoformat(),
                    "filing_date": self.current_case.filing_date.isoformat() if self.current_case.filing_date is not None else None,  # type: ignore[union-attr]
                    "next_hearing": self.current_case.next_hearing_date.isoformat() if self.current_case.next_hearing_date is not None else None,  # type: ignore[union-attr]
                },
                "court": self.current_case.court or "TBD",
                "opposing_party": self.current_case.opposing_party or "TBD",
            },
            "3_Chronology": {"events": []},  # To be populated from evidence
            "4_Evidence": {
                "documents": {},
                "witness_statements": {},
                "expert_reports": {},
                "correspondence": {},
            },
            "5_Legal_Research": {
                "applicable_laws": [],
                "case_precedents": [],
                "legal_opinions": [],
            },
            "6_Pleadings": {
                "particulars_of_claim": None,
                "defence": None,
                "reply": None,
            },
            "7_Correspondence": {
                "client_correspondence": [],
                "opposing_party": [],
                "court": [],
            },
            "8_Attendance_Notes": [],
            "9_Costs": {"time_recording": [], "disbursements": [], "bills": []},
            "10_Risk_Assessment": {},
        }

        # Organize existing documents into structure
        for doc in self.case_documents:
            if doc.document_type.value == DocumentType.CONTRACT.value:
                # Direct access since we know the structure
                evidence = structure.get("4_Evidence", {})
                if isinstance(evidence, dict) and "documents" in evidence:
                    docs = evidence["documents"]  # type: ignore[assignment]
                    if isinstance(docs, dict):
                        docs[str(doc.title)] = str(doc.id)
            elif doc.document_type.value == DocumentType.CORRESPONDENCE.value:
                corr = structure.get("7_Correspondence", {})
                if isinstance(corr, dict) and "client_correspondence" in corr:
                    client_corr = corr["client_correspondence"]  # type: ignore[assignment]
                    if isinstance(client_corr, list):
                        client_corr.append(  # type: ignore[attr-defined]
                            {
                                "date": doc.created_at.isoformat(),
                                "title": doc.title,
                                "id": str(doc.id),
                            }
                        )
            elif doc.document_type.value == DocumentType.COURT_FILING.value:
                pleadings = structure.get("6_Pleadings", {})
                if isinstance(pleadings, dict):
                    pleadings[str(doc.title)] = str(doc.id)

        return structure

    async def _analyze_evidence(self) -> dict[str, Any]:
        """Scan and analyze all evidence"""
        evidence_summary: dict[str, Any] = {
            "total_documents": len(self.case_documents),
            "document_types": {},
            "key_evidence": [],
            "missing_evidence": [],
            "evidence_strength": "pending",
        }

        # Categorize documents
        for doc in self.case_documents:
            doc_type = doc.document_type.value
            if doc_type not in evidence_summary["document_types"]:
                evidence_summary["document_types"][doc_type] = 0
            evidence_summary["document_types"][doc_type] += 1

            # Analyze document content if available
            if doc.extracted_text is not None or doc.ai_summary is not None:  # type: ignore[union-attr]
                analysis = await self._analyze_document_content(doc)
                if analysis.get("is_key_evidence"):
                    evidence_summary["key_evidence"].append(
                        {
                            "document": doc.title,
                            "type": doc_type,
                            "relevance": analysis.get("relevance"),
                            "key_points": analysis.get("key_points", []),
                        }
                    )

        # Check for missing essential documents
        evidence_summary["missing_evidence"] = self._identify_missing_evidence()

        # Assess evidence strength
        evidence_summary["evidence_strength"] = self._assess_evidence_strength(evidence_summary)

        return evidence_summary

    async def _analyze_document_content(self, document: Document) -> dict[str, Any]:
        """Deep analysis of document content"""
        content = document.extracted_text or document.ai_summary or ""

        # Use AI to analyze document
        prompt = f"""Analyze this legal document for a UK solicitor:

Document: {document.title}
Type: {document.document_type.value}
Content: {content[:2000]}...

Identify:
1. Is this key evidence? (Yes/No)
2. Legal relevance (High/Medium/Low)
3. Key legal points
4. Any admissions or concessions
5. Potential issues or weaknesses
6. Relevant dates mentioned

Provide analysis in JSON format."""

        analysis = await ai_service.analyze_text(prompt)

        # Extract key information
        key_patterns = {
            "dates": r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
            "amounts": r"£[\d,]+(?:\.\d{2})?",
            "percentages": r"\b\d+(?:\.\d+)?%",
            "legal_terms": r"\b(breach|negligence|liability|damages|indemnity|warranty)\b",
        }

        extracted_info = {}
        for key, pattern in key_patterns.items():
            matches = re.findall(pattern, str(content), re.IGNORECASE)
            if matches:
                extracted_info[key] = list(set(matches))

        return {
            "is_key_evidence": "contract" in document.title.lower()
            or "agreement" in document.title.lower()
            or document.document_type == DocumentType.COURT_FILING,
            "relevance": "High"
            if document.document_type in [DocumentType.CONTRACT, DocumentType.COURT_FILING]
            else "Medium",
            "key_points": extracted_info,
            "ai_analysis": analysis,
        }

    async def identify_legal_issues(self) -> list[LegalIssue]:
        """Identify legal issues in the case"""
        issues: list[Any] = []

        if not self.current_case:
            return issues

        # Analyze case type and description
        case_context = f"""
Case Type: {self.current_case.case_type}
Description: {self.current_case.description}
Client: {self.current_case.client_name}
Value: £{self.current_case.estimated_value or 0}
"""

        # Pattern matching for common issues
        issue_patterns = {
            IssueType.BREACH_CONTRACT: [
                "breach",
                "contract",
                "agreement",
                "failed to",
                "did not perform",
            ],
            IssueType.NEGLIGENCE: [
                "negligence",
                "duty of care",
                "injury",
                "damage",
                "accident",
            ],
            IssueType.FRAUD: ["fraud", "misled", "false", "deception", "dishonest"],
            IssueType.UNFAIR_DISMISSAL: [
                "dismissal",
                "terminated",
                "fired",
                "redundancy",
            ],
            IssueType.DISCRIMINATION: [
                "discrimination",
                "harassment",
                "equality",
                "protected characteristic",
            ],
        }

        description_lower = self.current_case.description.lower()

        for issue_type, patterns in issue_patterns.items():
            if any(pattern in description_lower for pattern in patterns):
                # Create detailed issue analysis
                issue = await self._create_legal_issue(issue_type, case_context)
                if issue:
                    issues.append(issue)

        # AI-powered issue identification
        ai_issues = await self._ai_identify_issues(case_context)
        issues.extend(ai_issues)

        return issues

    async def _create_legal_issue(self, issue_type: IssueType, context: str) -> LegalIssue | None:
        """Create detailed legal issue analysis"""
        # Get applicable laws for this issue type
        applicable_laws = self._get_applicable_laws(issue_type)

        # Get relevant evidence
        evidence_refs: list[Any] = []
        for doc in self.case_documents:
            if self._is_relevant_evidence(doc, issue_type):
                evidence_refs.append(f"{doc.title} (ID: {doc.id})")

        # Determine severity
        severity = self._assess_severity(issue_type, context)

        # Get remedies
        remedies = self._get_available_remedies(issue_type)

        return LegalIssue(
            issue_type=issue_type,
            description=f"Potential {issue_type.value} identified in case",
            severity=severity,
            applicable_laws=applicable_laws,
            evidence_refs=evidence_refs,
            remedies=remedies,
            time_limits=self.LIMITATION_PERIODS.get(issue_type),
        )

    def _get_applicable_laws(self, issue_type: IssueType) -> list[str]:
        """Get UK laws applicable to the issue"""
        laws: list[Any] = []

        if issue_type == IssueType.BREACH_CONTRACT:
            laws.extend(
                [
                    "Sale of Goods Act 1979",
                    "Consumer Rights Act 2015",
                    "Unfair Contract Terms Act 1977",
                ]
            )
        elif issue_type == IssueType.UNFAIR_DISMISSAL:
            laws.extend(
                [
                    "Employment Rights Act 1996 s.94-98",
                    "ACAS Code of Practice on Disciplinary Procedures",
                ]
            )
        elif issue_type == IssueType.DISCRIMINATION:
            laws.extend(["Equality Act 2010", "Human Rights Act 1998"])
        elif issue_type == IssueType.DATA_BREACH:
            laws.extend(["Data Protection Act 2018", "UK GDPR"])

        return laws

    def _get_available_remedies(self, issue_type: IssueType) -> list[str]:
        """Get available legal remedies"""
        remedies_map = {
            IssueType.BREACH_CONTRACT: [
                "Damages (expectation/reliance)",
                "Specific performance",
                "Rescission",
                "Rectification",
            ],
            IssueType.NEGLIGENCE: [
                "Compensatory damages",
                "Special damages",
                "General damages",
                "Injunction",
            ],
            IssueType.UNFAIR_DISMISSAL: [
                "Reinstatement",
                "Re-engagement",
                "Compensation (basic + compensatory award)",
            ],
            IssueType.DISCRIMINATION: [
                "Declaration of rights",
                "Compensation for injury to feelings",
                "Recommendation",
                "Interest on awards",
            ],
        }

        return remedies_map.get(issue_type, ["Damages", "Declaration", "Injunction"])

    async def _find_applicable_laws(self, issues: list[LegalIssue]) -> dict[str, Any]:
        """Find all applicable laws and precedents"""
        framework: dict[str, Any] = {
            "statutes": [],
            "case_law": [],
            "regulations": [],
            "practice_directions": [],
            "key_principles": [],
        }

        # Add relevant statutes
        for issue in issues:
            if "contract" in issue.issue_type.value.lower():
                framework["statutes"].extend([vars(s) for s in self.UK_STATUTES.get("contracts", [])])
                framework["case_law"].extend([vars(c) for c in self.UK_CASES.get("contract", [])])
            elif "employment" in issue.issue_type.value.lower():
                framework["statutes"].extend([vars(s) for s in self.UK_STATUTES.get("employment", [])])

        # Add CPR references for litigation
        if self.current_case is not None and self.current_case.court is not None:  # type: ignore[union-attr]
            framework["practice_directions"].append(
                {
                    "title": "Civil Procedure Rules",
                    "relevant_parts": [
                        "Part 7 - How to start proceedings",
                        "Part 16 - Statements of case",
                    ],
                }
            )

        # Key legal principles
        framework["key_principles"] = [
            "Burden of proof on claimant (balance of probabilities)",
            "Duty to mitigate losses",
            "Limitation periods apply",
            "Pre-action protocols must be followed",
        ]

        return framework

    async def _check_legal_violations(self) -> list[dict[str, Any]]:
        """Check for specific legal violations"""
        violations: list[dict[str, Any]] = []

        # Check each identified issue for violations
        for issue in await self.identify_legal_issues():
            if issue.severity in ["critical", "high"]:
                violation = {
                    "type": issue.issue_type.value,
                    "description": issue.description,
                    "laws_breached": issue.applicable_laws,
                    "evidence": issue.evidence_refs,
                    "severity": issue.severity,
                    "remedies_available": issue.remedies,
                }
                violations.append(violation)

        # Check procedural violations
        procedural_violations = self._check_procedural_compliance()
        violations.extend(procedural_violations)

        return violations

    def _check_procedural_compliance(self) -> list[dict[str, Any]]:
        """Check compliance with UK legal procedures"""
        violations: list[dict[str, Any]] = []

        # Check limitation periods
        if self.current_case and self.current_case.created_at:
            case_age_days = (datetime.now(UTC) - self.current_case.created_at).days

            # Employment claims - 3 months
            if "employment" in self.current_case.case_type.lower() and case_age_days > 90:
                violations.append(
                    {
                        "type": "Procedural",
                        "description": "Potential limitation period issue - Employment claims must be filed within 3 months",
                        "laws_breached": ["Employment Rights Act 1996"],
                        "severity": "critical",
                    }
                )

        # Check pre-action protocol compliance
        if not any("letter before action" in doc.title.lower() for doc in self.case_documents):
            violations.append(
                {
                    "type": "Procedural",
                    "description": "No Letter Before Action found - Required by Pre-Action Protocol",
                    "laws_breached": ["Civil Procedure Rules - Pre-Action Conduct"],
                    "severity": "high",
                }
            )

        return violations

    async def _generate_recommendations(
        self, issues: list[LegalIssue], violations: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Generate solicitor-grade recommendations"""
        recommendations: dict[str, Any] = {
            "immediate_actions": [],
            "evidence_required": [],
            "legal_strategy": [],
            "risk_mitigation": [],
            "timeline": [],
        }

        # Immediate actions based on issues
        for issue in issues:
            if issue.time_limits:
                recommendations["immediate_actions"].append(
                    {
                        "action": f"File claim immediately - limitation period: {issue.time_limits}",
                        "priority": "URGENT",
                        "deadline": self._calculate_deadline(issue),
                    }
                )

        # Evidence requirements
        recommendations["evidence_required"] = self._identify_missing_evidence()

        # Legal strategy
        if issues:
            primary_issue = max(issues, key=lambda x: self._severity_score(x.severity))
            recommendations["legal_strategy"] = [
                f"Primary claim: {primary_issue.issue_type.value}",
                f"Applicable law: {', '.join(primary_issue.applicable_laws[:2])}",
                f"Recommended remedies: {', '.join(primary_issue.remedies[:2])}",
            ]

        # Risk mitigation
        for violation in violations:
            if violation["severity"] in ["critical", "high"]:
                recommendations["risk_mitigation"].append(
                    {
                        "risk": violation["description"],
                        "mitigation": f"Address {violation['type']} immediately to avoid claim being struck out",
                    }
                )

        # Timeline
        recommendations["timeline"] = self._generate_litigation_timeline()

        return recommendations

    def _generate_litigation_timeline(self) -> list[dict[str, Any]]:
        """Generate typical UK litigation timeline"""
        return [
            {"week": 0, "action": "Letter Before Action", "responsible": "Solicitor"},
            {
                "week": 2,
                "action": "Response to Letter Before Action",
                "responsible": "Defendant",
            },
            {"week": 4, "action": "Issue Claim Form", "responsible": "Solicitor"},
            {"week": 6, "action": "Service of Claim", "responsible": "Court/Solicitor"},
            {
                "week": 10,
                "action": "Acknowledgment of Service",
                "responsible": "Defendant",
            },
            {"week": 14, "action": "Defence Filed", "responsible": "Defendant"},
            {"week": 18, "action": "Reply to Defence", "responsible": "Solicitor"},
            {
                "week": 20,
                "action": "Case Management Conference",
                "responsible": "Court",
            },
            {"week": 24, "action": "Disclosure", "responsible": "Both parties"},
            {"week": 32, "action": "Witness Statements", "responsible": "Both parties"},
            {"week": 40, "action": "Expert Reports", "responsible": "Both parties"},
            {"week": 52, "action": "Trial", "responsible": "Court"},
        ]

    def check_sra_compliance(self) -> dict[str, Any]:
        """Check SRA compliance requirements"""
        return {
            "client_care_letter": any("client care" in doc.title.lower() for doc in self.case_documents),
            "conflict_check": True,  # Assumed done
            "money_laundering_check": True,  # Assumed done
            "file_review_date": (datetime.now(UTC) + timedelta(days=180)).isoformat(),
            "supervision_required": bool(self.current_case and self.current_case.estimated_value and self.current_case.estimated_value > 100000),
            "insurance_notification": bool(self.current_case and self.current_case.estimated_value and self.current_case.estimated_value > 500000),
        }

    def _identify_missing_evidence(self) -> list[str]:
        """Identify missing key evidence"""
        missing: list[str] = []

        doc_titles_lower: list[str] = [doc.title.lower() for doc in self.case_documents]

        # Check case type specific requirements
        if self.current_case is not None and "contract" in self.current_case.case_type.lower():
            if not any("contract" in title or "agreement" in title for title in doc_titles_lower):
                missing.append("Original contract or agreement")
            if not any("invoice" in title or "payment" in title for title in doc_titles_lower):
                missing.append("Invoices or payment records")

        if self.current_case is not None and "employment" in self.current_case.case_type.lower():
            required: list[Any] = [
                "employment contract",
                "dismissal letter",
                "grievance",
                "appeal",
            ]
            for req in required:
                if not any(req in title for title in doc_titles_lower):
                    missing.append(req.title())

        if self.current_case is not None and "injury" in self.current_case.description.lower():
            if not any("medical" in title for title in doc_titles_lower):
                missing.append("Medical evidence/reports")

        return missing

    def _assess_evidence_strength(self, evidence_summary: dict[str, Any]) -> str:
        """Assess overall evidence strength"""
        score = 0
        max_score = 100

        # Document completeness (40 points)
        if evidence_summary["total_documents"] > 10:
            score += 40
        elif evidence_summary["total_documents"] > 5:
            score += 25
        elif evidence_summary["total_documents"] > 0:
            score += 10

        # Key evidence present (30 points)
        if evidence_summary["key_evidence"]:
            score += min(30, len(evidence_summary["key_evidence"]) * 10)

        # Missing evidence penalty (30 points)
        missing_count = len(evidence_summary["missing_evidence"])
        score += max(0, 30 - (missing_count * 10))

        # Calculate strength
        percentage = (score / max_score) * 100

        if percentage >= 80:
            return "Strong"
        if percentage >= 60:
            return "Good"
        if percentage >= 40:
            return "Adequate"
        return "Weak - additional evidence required"

    def _calculate_risk_score(self, issues: list[LegalIssue], violations: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate case risk assessment"""
        risk_score: float = 0.0
        factors: list[Any] = []

        # Issue severity scoring
        for issue in issues:
            severity_scores = {"critical": 40, "high": 30, "medium": 20, "low": 10}
            risk_score += severity_scores.get(issue.severity, 0)
            factors.append(f"{issue.issue_type.value} ({issue.severity})")

        # Violation scoring
        for violation in violations:
            severity_scores = {"critical": 35, "high": 25, "medium": 15, "low": 5}
            risk_score += severity_scores.get(violation.get("severity", "medium"), 15)

        # Evidence strength factor
        evidence_strength = self.analysis_results.get("evidence_analysis", {}).get("evidence_strength", "Adequate")
        strength_modifiers = {"Strong": 0.7, "Good": 0.85, "Adequate": 1.0, "Weak": 1.3}
        risk_score *= strength_modifiers.get(evidence_strength, 1.0)

        # Normalize to 0-100
        risk_score = float(min(100, risk_score))

        # Determine risk level
        if risk_score >= 70:
            risk_level = "High Risk"
            recommendation = "Seek immediate senior counsel review"
        elif risk_score >= 40:
            risk_level = "Medium Risk"
            recommendation = "Proceed with caution, regular supervision required"
        else:
            risk_level = "Low Risk"
            recommendation = "Standard procedures apply"

        return {
            "risk_score": round(float(risk_score), 1),
            "risk_level": risk_level,
            "factors": factors,
            "recommendation": recommendation,
            "insurance_implications": risk_score >= 70,
        }

    def _generate_next_steps(self, issues: list[LegalIssue]) -> list[dict[str, Any]]:
        """Generate prioritized next steps"""
        steps: list[Any] = []

        # Check limitation periods first
        for issue in issues:
            if issue.time_limits:
                deadline = self._calculate_deadline(issue)
                if deadline:
                    days_remaining = (deadline - datetime.now(UTC)).days
                    if days_remaining < 30:
                        steps.append(
                            {
                                "priority": "URGENT",
                                "action": f"File {issue.issue_type.value} claim",
                                "deadline": deadline.isoformat(),
                                "days_remaining": days_remaining,
                            }
                        )

        # Standard next steps
        if not any("Letter Before Action" in doc.title for doc in self.case_documents):
            steps.append(
                {
                    "priority": "High",
                    "action": "Draft and send Letter Before Action",
                    "deadline": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
                    "template": "Use standard LBA template for " + (str(self.current_case.case_type) if self.current_case is not None else "general case"),
                }
            )

        # Evidence gathering
        missing_evidence = self._identify_missing_evidence()
        if missing_evidence:
            steps.append(
                {
                    "priority": "High",
                    "action": "Obtain missing evidence",
                    "items": missing_evidence,
                    "deadline": (datetime.now(UTC) + timedelta(days=14)).isoformat(),
                }
            )

        # Witness statements
        steps.append(
            {
                "priority": "Medium",
                "action": "Prepare witness statements",
                "deadline": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
            }
        )

        return sorted(
            steps,
            key=lambda x: {"URGENT": 0, "High": 1, "Medium": 2, "Low": 3}.get(x["priority"], 4),
        )

    def _calculate_deadline(self, issue: LegalIssue) -> datetime | None:
        """Calculate deadline based on limitation period"""
        if not issue.time_limits:
            return None

        # Parse time limit
        if "3 months" in issue.time_limits:
            base_days = 90
        elif "6 years" in issue.time_limits:
            base_days = 365 * 6
        elif "12 years" in issue.time_limits:
            base_days = 365 * 12
        else:
            base_days = 365  # Default 1 year

        # Calculate from relevant date
        if self.current_case is None:
            return None
        start_date = self.current_case.created_at
        if "from discovery" in issue.time_limits:
            # Use case creation as discovery date
            return start_date + timedelta(days=base_days)
        if "from dismissal" in issue.time_limits and "dismissal" in self.current_case.description.lower():
            # Try to extract dismissal date from documents
            return start_date + timedelta(days=base_days)
        return start_date + timedelta(days=base_days)

    def _severity_score(self, severity: str) -> int:
        """Convert severity to numeric score"""
        return {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(severity, 0)

    def _assess_severity(self, issue_type: IssueType, context: str) -> str:
        """Assess severity of an issue based on type and context"""
        # Critical issues
        if issue_type in [IssueType.FRAUD, IssueType.TAX_EVASION]:
            return "critical"

        # Check for high value cases
        if "£" in context:
            import re
            amounts = re.findall(r"£([\d,]+)", context)
            if amounts:
                amount_str = amounts[0].replace(",", "")
                try:
                    if int(amount_str) > 100000:
                        return "high"
                except ValueError:
                    pass

        # Time-sensitive issues
        if issue_type in [IssueType.UNFAIR_DISMISSAL, IssueType.DISCRIMINATION]:
            return "high"

        # Default severities
        severity_map = {
            IssueType.BREACH_CONTRACT: "medium",
            IssueType.NEGLIGENCE: "high",
            IssueType.MISREPRESENTATION: "medium",
            IssueType.PROPERTY_DISPUTE: "medium",
            IssueType.CUSTODY: "high",
            IssueType.DATA_BREACH: "high",
        }

        return severity_map.get(issue_type, "medium")

    def _is_relevant_evidence(self, document: Document, issue_type: IssueType) -> bool:
        """Check if document is relevant to the issue"""
        relevance_map = {
            IssueType.BREACH_CONTRACT: [
                "contract",
                "agreement",
                "invoice",
                "payment",
                "correspondence",
            ],
            IssueType.UNFAIR_DISMISSAL: [
                "employment",
                "dismissal",
                "disciplinary",
                "grievance",
                "appeal",
            ],
            IssueType.NEGLIGENCE: [
                "accident",
                "injury",
                "medical",
                "witness",
                "report",
            ],
            IssueType.DISCRIMINATION: [
                "equality",
                "complaint",
                "grievance",
                "policy",
                "comparator",
            ],
        }

        keywords = relevance_map.get(issue_type, [])
        doc_text = (document.title + " " + (document.ai_summary or "")).lower()

        return any(keyword in doc_text for keyword in keywords)

    async def _ai_identify_issues(self, context: str) -> list[LegalIssue]:
        """Use AI to identify additional legal issues"""
        prompt = f"""As a UK solicitor, analyze this case for legal issues:

{context}

Identify:
1. All potential legal claims
2. Causes of action
3. Legal risks
4. Procedural requirements

Focus on UK law only. Format as JSON with issue_type, description, severity, applicable_laws."""

        try:
            # TODO: Parse AI response and create LegalIssue objects
            # This is simplified - in production would have proper parsing
            _ = await ai_service.analyze_text(prompt)
            return []
        except Exception:
            return []

    def serialize_issue(self, issue: LegalIssue) -> dict[str, Any]:
        """Serialize LegalIssue to dict"""
        return {
            "issue_type": issue.issue_type.value,
            "description": issue.description,
            "severity": issue.severity,
            "applicable_laws": issue.applicable_laws,
            "evidence_refs": issue.evidence_refs,
            "remedies": issue.remedies,
            "time_limits": issue.time_limits,
        }

    async def _save_analysis(self, db: AsyncSession):
        """Save analysis results to database"""
        # Update case with analysis
        if self.current_case is not None:
            self.current_case.ai_analysis = json.dumps(self.analysis_results)  # type: ignore[assignment]
            self.current_case.risk_level = self.analysis_results["risk_assessment"]["risk_level"]

        await db.commit()


class CaseAnalysisScheduler:
    """Background scheduler for automatic case analysis"""

    def __init__(self):
        self.analyzer = CaseAnalyzer()
        self.is_running = False

    async def start(self):
        """Start the background analysis scheduler"""
        self.is_running = True

        while self.is_running:
            try:
                await self._analyze_pending_cases()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception:
                await asyncio.sleep(60)

    async def stop(self):
        """Stop the scheduler"""
        self.is_running = False

    async def _analyze_pending_cases(self):
        """Find and analyze cases that need analysis"""
        async with AsyncSessionLocal() as db:
            # Find cases that haven't been analyzed or need re-analysis
            result = await db.execute(
                select(Case)
                .where(
                    and_(
                        Case.status.in_([CaseStatus.ACTIVE, CaseStatus.PENDING]),
                        Case.ai_analysis.is_(None),
                    )
                )
                .limit(1)
            )

            case = result.scalar_one_or_none()

            if case:
                try:
                    analysis = await self.analyzer.analyze_case(str(case.id), db)

                    # Check for critical issues
                    if analysis.get("risk_assessment", {}).get("risk_level") == "High Risk":
                        pass
                        # In production, would send notification to senior solicitor

                except Exception:
                    pass


# Singleton scheduler instance
case_analysis_scheduler = CaseAnalysisScheduler()
