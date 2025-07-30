#!/usr/bin/env python3
"""
Quick fact entry tool for Solicitor Brain
Allows rapid fact entry from command line
"""

import click
import httpx
from typing import Optional, Dict, Any, List


class FactClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.headers: Dict[str, str] = {}

    def save_fact(
        self, case_id: str, fact_text: str, fact_type: str, importance: str = "medium", category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save a fact to a case"""
        endpoint = f"{self.base_url}/api/cases/{case_id}/facts"

        data: Dict[str, Any] = {
            "fact_text": fact_text,
            "fact_type": fact_type,
            "importance": importance,
            "category": category,
            "extracted_by_ai": False,  # Manual entry
            "tags": [],
        }

        response = httpx.post(endpoint, json=data, headers=self.headers)
        response.raise_for_status()
        return response.json()


@click.group()
def cli():
    """Solicitor Brain quick fact entry tool"""
    pass


@cli.command()
@click.argument("case_id")
@click.argument("fact_text")
@click.option(
    "--type",
    "-t",
    "fact_type",
    type=click.Choice(["date", "party", "claim", "evidence", "legal_point", "general"]),
    default="general",
    help="Type of fact",
)
@click.option(
    "--importance",
    "-i",
    type=click.Choice(["critical", "high", "medium", "low"]),
    default="medium",
    help="Importance level",
)
@click.option("--category", "-c", help="Category for the fact")
def add(case_id: str, fact_text: str, fact_type: str, importance: str, category: Optional[str]):
    """Add a new fact to a case"""
    client = FactClient()

    try:
        result = client.save_fact(case_id, fact_text, fact_type, importance, category)
        click.echo(f"✓ Fact saved with ID: {result['id']}")
    except httpx.HTTPError as e:
        click.echo(f"✗ Error saving fact: {e}", err=True)


@cli.command()
@click.argument("case_id")
@click.option("--type", "-t", "fact_type", help="Filter by fact type")
@click.option("--importance", "-i", help="Filter by importance")
def list(case_id: str, fact_type: Optional[str], importance: Optional[str]):
    """List facts for a case"""
    client = FactClient()
    endpoint = f"{client.base_url}/api/cases/{case_id}/facts"

    params: Dict[str, str] = {}
    if fact_type:
        params["fact_type"] = fact_type
    if importance:
        params["importance"] = importance

    try:
        response = httpx.get(endpoint, params=params, headers=client.headers)
        response.raise_for_status()
        facts = response.json()

        if not facts:
            click.echo("No facts found.")
            return

        # Group by type
        by_type: Dict[str, List[Dict[str, Any]]] = {}
        for fact in facts:
            fact_type_str = fact.get("fact_type", "general")
            if fact_type_str not in by_type:
                by_type[fact_type_str] = []
            by_type[fact_type_str].append(fact)

        # Display
        for fact_type_key, type_facts in by_type.items():
            click.echo(f"\n{fact_type_key.upper()} ({len(type_facts)} facts):")
            click.echo("-" * 50)

            for fact in type_facts:
                status = "✓" if fact.get("verification_status") == "verified" else "○"
                importance = fact.get("importance", "medium").upper()[0]
                click.echo(f"{status} [{importance}] {fact.get('fact_text', '')}")

                if fact.get("source_page"):
                    click.echo(f"   Source: {fact.get('source_page')}")

                click.echo()

    except httpx.HTTPError as e:
        click.echo(f"✗ Error listing facts: {e}", err=True)


@cli.command()
def cases():
    """List all cases"""
    client = FactClient()
    endpoint = f"{client.base_url}/api/cases"

    try:
        response = httpx.get(endpoint, headers=client.headers)
        response.raise_for_status()
        cases = response.json()

        if not cases:
            click.echo("No cases found.")
            return

        click.echo("\nActive Cases:")
        click.echo("-" * 60)

        for case in cases:
            status = "●" if case.get("status") == "active" else "○"
            click.echo(f"{status} {case.get('case_number', 'N/A')} - {case.get('title', 'Untitled')}")
            click.echo(f"   ID: {case.get('id')}")
            click.echo(f"   Client: {case.get('client_name', 'N/A')}")
            click.echo()

    except httpx.HTTPError as e:
        click.echo(f"✗ Error listing cases: {e}", err=True)


if __name__ == "__main__":
    cli()
