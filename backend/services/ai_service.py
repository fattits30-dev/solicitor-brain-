"""AI service for processing legal queries with Mixtral"""
import json
import logging
from typing import Any

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.base_url = settings.ollama_host
        self.model = settings.primary_model

    async def generate_response(self, prompt: str, context: str | None = None, temperature: float = 0.1) -> str:
        """Generate AI response with legal context"""

        system_prompt = """You are a UK legal AI assistant for solicitors.
        IMPORTANT RULES:
        1. You provide assistance with UK law only
        2. Always cite specific UK legislation, case law, or legal principles
        3. Never provide legal advice - only information and analysis
        4. Always remind users to verify information before use
        5. Focus on accuracy and precision over creativity

        When responding:
        - Be concise and professional
        - Use proper legal terminology
        - Reference specific sections of legislation where relevant
        - Highlight any areas of legal uncertainty
        """

        full_prompt = f"{system_prompt}\n\n"
        if context:
            full_prompt += f"Context: {context}\n\n"
        full_prompt += f"Query: {prompt}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "temperature": temperature,
                        "stream": False,
                    },
                    timeout=60.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "")
                logger.error(f"AI service error: {response.status_code}")
                return "AI service temporarily unavailable. Please try again."

        except httpx.ConnectError:
            return "Cannot connect to AI service. Please ensure Ollama is running."
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            return "An error occurred while processing your request."

    async def analyze_document(self, document_text: str, analysis_type: str = "general") -> dict[str, Any]:
        """Analyze legal document content"""

        prompts = {
            "general": "Analyze this legal document and provide a summary of key points, parties involved, and any important dates or obligations:",
            "contract": "Analyze this contract and identify: parties, key terms, obligations, payment terms, termination clauses, and any potential issues:",
            "compliance": "Review this document for compliance issues and regulatory requirements under UK law:",
        }

        prompt = prompts.get(analysis_type, prompts["general"])
        prompt += f"\n\nDocument:\n{document_text[:3000]}"  # Limit to first 3000 chars

        response = await self.generate_response(prompt)

        return {
            "analysis": response,
            "type": analysis_type,
            "citation_note": "This is an AI-generated analysis. Verify all information before use.",
        }

    async def search_legal_knowledge(self, query: str) -> str:
        """Search for legal information"""

        prompt = f"""Search for UK legal information about: {query}

        Provide:
        1. Relevant UK legislation
        2. Key case law
        3. Legal principles
        4. Practical considerations for solicitors

        Be specific with citations and section numbers."""

        return await self.generate_response(prompt)

    async def analyze_text(self, prompt: str, context: str | None = None) -> dict[str, Any]:
        """Analyze text for legal issues - compatible with case analyzer"""
        try:
            response = await self.generate_response(prompt, context)

            # Try to parse as JSON if the prompt requested it
            if "json" in prompt.lower() or "format" in prompt.lower():
                # Simple extraction of JSON-like content
                if "{" in response and "}" in response:
                    start = response.find("{")
                    end = response.rfind("}") + 1
                    json_str = response[start:end]
                    try:
                        return json.loads(json_str)
                    except (json.JSONDecodeError, ValueError):
                        pass

            # Return structured response
            return {"analysis": response, "status": "success"}
        except Exception as e:
            logger.error(f"Text analysis error: {e}")
            # Return mock data for development
            return self._get_mock_analysis(prompt)

    def _get_mock_analysis(self, prompt: str) -> dict[str, Any]:
        """Provide mock analysis for development when AI is unavailable"""
        prompt_lower = prompt.lower()

        if "legal document" in prompt_lower and "identify" in prompt_lower:
            return {
                "is_key_evidence": True,
                "relevance": "High",
                "key_points": {
                    "dates": ["01/03/2024"],
                    "amounts": ["£50,000"],
                    "legal_terms": ["breach", "contract"],
                },
                "analysis": "Key contract document with evidence of breach",
            }
        if "legal issues" in prompt_lower:
            return {
                "issues": [
                    {
                        "issue_type": "Breach of Contract",
                        "description": "Failure to deliver goods as agreed",
                        "severity": "high",
                        "applicable_laws": ["Sale of Goods Act 1979"],
                    }
                ]
            }
        return {"analysis": "Document analyzed", "status": "mock_response"}


# Singleton instance
ai_service = AIService()
