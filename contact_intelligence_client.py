#!/usr/bin/env python3
"""BigDataClaw wrapper for the shared Contact Intelligence API.

This module provides a thin wrapper around the BDAIV2 Contact Intelligence HTTP API,
allowing BigDataClaw agents to query company/contact data without disrupting BDAIV2.

Usage:
    from contact_intelligence_client import ContactIntelligenceClient
    
    client = ContactIntelligenceClient()
    
    # Check health
    health = client.health()
    
    # Lookup a company
    result = client.lookup_company("CBRE Limited")
    
    # Find contacts
    contacts = client.search_contacts(company_name="Dream Industrial REIT", limit=10)
"""

from __future__ import annotations

import os
from typing import Any, Iterable, Optional

import requests


DEFAULT_BASE_URL = "http://127.0.0.1:8011"


class ContactIntelligenceClient:
    """HTTP client for the shared contact intelligence service.
    
    This client connects to the BDAIV2 Contact Intelligence API running on
    port 8011 (by default). It provides access to 49K+ enriched company
    and contact records without requiring direct BigStats access.
    """

    def __init__(self, base_url: Optional[str] = None, timeout: float = 30.0) -> None:
        """Initialize the client.
        
        Args:
            base_url: The base URL of the contact intelligence API.
                     Defaults to CONTACT_INTELLIGENCE_BASE_URL env var or
                     http://127.0.0.1:8011
            timeout: Request timeout in seconds
        """
        self.base_url = (
            base_url or 
            os.environ.get("CONTACT_INTELLIGENCE_BASE_URL", DEFAULT_BASE_URL)
        ).rstrip("/")
        self.timeout = timeout

    def _get(self, path: str) -> dict[str, Any]:
        """Make a GET request."""
        response = requests.get(
            f"{self.base_url}{path}", 
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Make a POST request."""
        response = requests.post(
            f"{self.base_url}{path}",
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def health(self) -> dict[str, Any]:
        """Check the health status of the contact intelligence service.
        
        Returns:
            Dict containing:
            - mart_available: bool
            - mart_row_count: int
            - mart_freshness_at: ISO timestamp
            - has_live_session: bool (whether live BigStats is available)
            - mock_mode: bool
            - service: str
        """
        return self._get("/health")

    def lookup_company(
        self,
        company_name: str,
        *,
        include_contacts: bool = True,
        include_executives: bool = True,
    ) -> dict[str, Any]:
        """Lookup a company by name.
        
        Args:
            company_name: The company name to search for
            include_contacts: Whether to include contact data
            include_executives: Whether to include executive contacts
            
        Returns:
            Dict with company info, contacts, and enrichment data
        """
        return self._post(
            "/lookup/company",
            {
                "company_name": company_name,
                "include_contacts": include_contacts,
                "include_executives": include_executives,
            },
        )

    def lookup_domain(self, domain: str, *, include_contacts: bool = True) -> dict[str, Any]:
        """Lookup a company by domain.
        
        Args:
            domain: The domain (e.g., "cbre.com")
            include_contacts: Whether to include contact data
            
        Returns:
            Dict with company info and contacts
        """
        return self._post(
            "/lookup/domain",
            {"domain": domain, "include_contacts": include_contacts},
        )

    def search_contacts(
        self,
        *,
        company_name: Optional[str] = None,
        domain: Optional[str] = None,
        title_filter: Optional[Iterable[str] | str] = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search for contacts by company or domain.
        
        Args:
            company_name: Filter by company name
            domain: Filter by domain
            title_filter: Filter by job title(s)
            limit: Maximum number of results
            
        Returns:
            List of contact records
        """
        payload: dict[str, Any] = {
            "company_name": company_name,
            "domain": domain,
            "title_filter": (
                list(title_filter) 
                if isinstance(title_filter, (list, tuple, set)) 
                else title_filter
            ),
            "limit": limit,
        }
        return self._post("/lookup/contacts", payload)["contacts"]

    def find_emails(
        self,
        *,
        company_name: Optional[str] = None,
        domain: Optional[str] = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Find email addresses for a company.
        
        Args:
            company_name: Company name to search
            domain: Domain to search
            limit: Maximum number of results
            
        Returns:
            List of email records with confidence scores
        """
        return self._post(
            "/lookup/emails",
            {"company_name": company_name, "domain": domain, "limit": limit},
        )["emails"]

    def lookup_companies(
        self,
        company_names: Iterable[str],
        *,
        include_contacts: bool = True,
        include_executives: bool = True,
    ) -> list[dict[str, Any]]:
        """Batch lookup multiple companies.
        
        Args:
            company_names: List of company names to lookup
            include_contacts: Whether to include contact data
            include_executives: Whether to include executive contacts
            
        Returns:
            List of company records
        """
        return self._post(
            "/lookup/companies",
            {
                "company_names": list(company_names),
                "include_contacts": include_contacts,
                "include_executives": include_executives,
            },
        )["results"]


def enrich_buyer_with_contacts(buyer_name: str) -> dict[str, Any]:
    """Quick helper to enrich a buyer record with contact data.
    
    This is the primary integration point for BigDataClaw's buyer matching
    system to leverage the shared contact intelligence.
    
    Args:
        buyer_name: The buyer/company name
        
    Returns:
        Enriched buyer data with contacts
    """
    client = ContactIntelligenceClient()
    return client.lookup_company(
        buyer_name,
        include_contacts=True,
        include_executives=True
    )


# Simple CLI for testing
if __name__ == "__main__":
    import sys
    
    client = ContactIntelligenceClient()
    
    if len(sys.argv) < 2:
        print("Usage: python contact_intelligence_client.py <company_name>")
        print("       python contact_intelligence_client.py --health")
        sys.exit(1)
    
    if sys.argv[1] == "--health":
        import json
        print(json.dumps(client.health(), indent=2))
    else:
        company_name = " ".join(sys.argv[1:])
        import json
        result = client.lookup_company(company_name)
        print(json.dumps(result, indent=2))
