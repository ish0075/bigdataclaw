#!/usr/bin/env python3
"""
BIGDATACLAW QUICK LINKS GENERATOR
Generates Google search quick links for any company/contact
Based on bigstats.io format from Jamie's Personal Vault
"""

from urllib.parse import quote_plus
from typing import Dict, List, Optional
import json
import csv

class QuickLinksGenerator:
    """Generate Quick Links for any company or contact"""
    
    def __init__(self):
        self.base_google = "https://www.google.com/search"
    
    def generate_company_quick_links(
        self,
        company_name: str,
        phone: Optional[str] = None,
        website: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate Quick Links for a company
        
        Returns:
            Dictionary with link types and URLs
        """
        links = {}
        
        # GOOGLE - Company + Phone search
        if phone:
            query = f"{phone} {company_name}"
            links['google'] = f"{self.base_google}?q={quote_plus(query)}"
        else:
            links['google'] = f"{self.base_google}?q={quote_plus(company_name)}"
        
        # CONTACT PAGE - Company name + "contact"
        links['contact_page'] = f"{self.base_google}?q={quote_plus(company_name + ' contact')}"
        
        # LINKEDIN - Company search
        links['linkedin'] = f"{self.base_google}?q={quote_plus(company_name + ' linkedin')}"
        
        # LINKEDIN PRESIDENT - Company + President
        links['linkedin_president'] = f"{self.base_google}?q={quote_plus(company_name + ' President linkedin')}"
        
        # FACEBOOK
        links['facebook'] = f"{self.base_google}?q={quote_plus(company_name + ' facebook')}"
        
        # INSTAGRAM
        links['instagram'] = f"{self.base_google}?q={quote_plus(company_name + ' instagram')}"
        
        # WEBSITE (if provided)
        if website:
            links['website'] = website if website.startswith('http') else f"https://{website}"
        
        return links
    
    def generate_contact_quick_links(
        self,
        name: str,
        email: str,
        company: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate Quick Links for a specific contact person
        
        Returns:
            Dictionary with link types and URLs
        """
        links = {}
        
        # LINKEDIN search by email
        links['linkedin_by_email'] = f"{self.base_google}?q={quote_plus(email + ' linkedin')}"
        
        # LINKEDIN search by name + company
        if company:
            query = f"{name} {company} linkedin"
            links['linkedin_by_name_company'] = f"{self.base_google}?q={quote_plus(query)}"
        
        # Email lookup
        links['email_lookup'] = f"{self.base_google}?q={quote_plus(email)}"
        
        return links
    
    def generate_full_contact_card(
        self,
        company_name: str,
        address_street: Optional[str] = None,
        address_city: Optional[str] = None,
        address_province: Optional[str] = None,
        address_postal: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        contacts: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate full HTML contact card with Quick Links
        Matches bigstats.io format exactly
        
        Args:
            contacts: List of dicts with 'name', 'email', 'title'
        """
        # Company Quick Links
        company_links = self.generate_company_quick_links(company_name, phone, website)
        
        # Build HTML
        html_parts = []
        
        # Company header
        html_parts.append(f"<div class='divCompany'>")
        html_parts.append(f"{company_name}<br>")
        
        if address_street:
            html_parts.append(f"{address_street}<br>")
        if address_city:
            html_parts.append(f"{address_city}, {address_province or ''}<br>")
        if address_postal:
            html_parts.append(f"{address_postal}<br>")
        if phone:
            html_parts.append(f"{phone}<br>")
        if website:
            html_parts.append(f"{website}<br>")
        
        html_parts.append("<br><br>")
        
        # QUICK LINKS section
        html_parts.append("<h3>QUICK LINKS</h3>")
        
        # GOOGLE - CONTACT PAGE
        html_parts.append(f"<a href='{company_links.get('google', '#')}' target='_blank'>GOOGLE</a> - ")
        html_parts.append(f"<a href='{company_links.get('contact_page', '#')}' target='_blank'>CONTACT PAGE</a><br>")
        
        # LINKEDIN - PRESIDENT
        html_parts.append(f"<a href='{company_links.get('linkedin', '#')}' target='_blank'>LINKEDIN</a> - ")
        html_parts.append(f"<a href='{company_links.get('linkedin_president', '#')}' target='_blank'>PRESIDENT</a><br>")
        
        # FACEBOOK
        html_parts.append(f"<a href='{company_links.get('facebook', '#')}' target='_blank'>FACEBOOK</a><br>")
        
        # INSTAGRAM
        html_parts.append(f"<a href='{company_links.get('instagram', '#')}' target='_blank'>INSTAGRAM</a>")
        
        html_parts.append("</div>")
        
        # Contacts section
        if contacts:
            html_parts.append("<div class='divContacts'>")
            
            for contact in contacts:
                name = contact.get('name', '')
                email = contact.get('email', '')
                title = contact.get('title', '')
                
                if name or email:
                    html_parts.append("<div class='divContact'>")
                    
                    if name:
                        html_parts.append(f"<b>{name}</b><br>")
                    if title:
                        html_parts.append(f"{title}<br>")
                    if email:
                        html_parts.append(f"<a href='mailto:{email}'>{email}</a><br>")
                        # LinkedIn search by email
                        linkedin_link = f"{self.base_google}?q={quote_plus(email + ' linkedin')}"
                        html_parts.append(f"<a href='{linkedin_link}' target='_blank'>LINKEDIN &#128269;</a><br>")
                    
                    html_parts.append("</div>")
            
            html_parts.append("</div>")
        
        return "".join(html_parts)
    
    def generate_markdown_quick_links(
        self,
        company_name: str,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        contacts: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate Quick Links in Markdown format for Obsidian
        """
        lines = []
        
        lines.append("### Quick Links")
        lines.append("")
        
        # Company links
        company_links = self.generate_company_quick_links(company_name, phone, website)
        
        lines.append(f"**{company_name}**")
        lines.append("")
        lines.append(f"- [GOOGLE]({company_links.get('google', '#')})")
        lines.append(f"- [CONTACT PAGE]({company_links.get('contact_page', '#')})")
        lines.append(f"- [LINKEDIN]({company_links.get('linkedin', '#')})")
        lines.append(f"- [LINKEDIN PRESIDENT]({company_links.get('linkedin_president', '#')})")
        lines.append(f"- [FACEBOOK]({company_links.get('facebook', '#')})")
        lines.append(f"- [INSTAGRAM]({company_links.get('instagram', '#')})")
        
        if website:
            lines.append(f"- [WEBSITE]({company_links.get('website', '#')})")
        
        # Individual contacts
        if contacts:
            lines.append("")
            lines.append("**Contacts:**")
            for contact in contacts:
                name = contact.get('name', '')
                email = contact.get('email', '')
                
                if name:
                    lines.append(f"")
                    lines.append(f"**{name}**")
                    if email:
                        lines.append(f"- Email: [{email}](mailto:{email})")
                        linkedin_link = f"{self.base_google}?q={quote_plus(email + ' linkedin')}"
                        lines.append(f"- [LINKEDIN 🔍]({linkedin_link})")
        
        return "\n".join(lines)


def main():
    """Example usage and demo"""
    generator = QuickLinksGenerator()
    
    print("="*70)
    print("BIGDATACLAW QUICK LINKS GENERATOR")
    print("="*70)
    print()
    
    # Example 1: Stelco (from bigstats.io)
    print("Example 1: Stelco Inc")
    print("-"*70)
    
    company_links = generator.generate_company_quick_links(
        company_name="Stelco Inc",
        phone="905-528-2511",
        website="stelcocanada.com"
    )
    
    print("\nCompany Quick Links:")
    for link_type, url in company_links.items():
        print(f"  {link_type}: {url}")
    
    # Example 2: Full contact card
    print("\n" + "="*70)
    print("Example 2: Full Contact Card HTML")
    print("="*70)
    
    html_card = generator.generate_full_contact_card(
        company_name="Stelco Inc",
        address_street="386 Wilcox St",
        address_city="Hamilton",
        address_province="Ontario",
        address_postal="L8L 8K5",
        phone="905-528-2511",
        website="stelcocanada.com",
        contacts=[
            {
                'name': 'David Cheney',
                'email': 'cheney@stelcocanada.com',
                'title': 'President'
            },
            {
                'name': 'Sales Team',
                'email': 'sales@stelcocanada.com',
                'title': 'Sales'
            }
        ]
    )
    
    print("\nGenerated HTML:")
    print(html_card[:500] + "...")
    
    # Example 3: Markdown format
    print("\n" + "="*70)
    print("Example 3: Markdown Format for Obsidian")
    print("="*70)
    
    markdown = generator.generate_markdown_quick_links(
        company_name="Stelco Inc",
        phone="905-528-2511",
        website="stelcocanada.com",
        contacts=[
            {
                'name': 'David Cheney',
                'email': 'cheney@stelcocanada.com',
                'title': 'President'
            }
        ]
    )
    
    print("\nGenerated Markdown:")
    print(markdown)
    
    # Save examples
    print("\n" + "="*70)
    print("SAVING EXAMPLES")
    print("="*70)
    
    output_dir = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"
    
    # Save HTML
    with open(f"{output_dir}/quick_links_example.html", 'w') as f:
        f.write("<!DOCTYPE html>\n<html>\n<head>\n<title>Quick Links Example</title>\n</head>\n<body>\n")
        f.write(html_card)
        f.write("\n</body>\n</html>")
    print(f"✓ Saved HTML: {output_dir}/quick_links_example.html")
    
    # Save Markdown
    with open(f"{output_dir}/quick_links_example.md", 'w') as f:
        f.write(markdown)
    print(f"✓ Saved Markdown: {output_dir}/quick_links_example.md")
    
    print("\n" + "="*70)
    print("USAGE IN YOUR PROJECT:")
    print("="*70)
    print("""
from quick_links_generator import QuickLinksGenerator

generator = QuickLinksGenerator()

# Generate for a company
links = generator.generate_company_quick_links(
    company_name="Your Company",
    phone="555-123-4567",
    website="example.com"
)

# Generate full HTML card
html = generator.generate_full_contact_card(
    company_name="Your Company",
    phone="555-123-4567",
    contacts=[{'name': 'John Doe', 'email': 'john@example.com'}]
)

# Generate Markdown for Obsidian
markdown = generator.generate_markdown_quick_links(
    company_name="Your Company",
    contacts=[{'name': 'John Doe', 'email': 'john@example.com'}]
)
""")


if __name__ == "__main__":
    main()
