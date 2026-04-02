#!/usr/bin/env python3
"""
Generate Quick Links for ALL BDAIV2 contacts
Batch processing script
"""

import csv
import json
from pathlib import Path
from quick_links_generator import QuickLinksGenerator

def process_bdaiv2_contacts():
    """Process all contacts from BDAIV2 exports and add Quick Links"""
    
    generator = QuickLinksGenerator()
    
    # Load the contacts we extracted earlier
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/all_contacts_quick_links.csv"
    output_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/all_contacts_with_quick_links.csv"
    
    print("="*70)
    print("GENERATING QUICK LINKS FOR ALL BDAIV2 CONTACTS")
    print("="*70)
    
    contacts_with_links = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        contacts = list(reader)
    
    print(f"\nProcessing {len(contacts)} contacts...")
    
    for i, contact in enumerate(contacts, 1):
        company = contact.get('company', '').strip('[]')
        name = contact.get('name', '')
        email = contact.get('email', '')
        phone = contact.get('phone', '')
        website = contact.get('website', '')
        
        # Generate Quick Links
        company_links = generator.generate_company_quick_links(
            company_name=company,
            phone=phone,
            website=website
        )
        
        # Add to contact data
        contact['quick_link_google'] = company_links.get('google', '')
        contact['quick_link_contact_page'] = company_links.get('contact_page', '')
        contact['quick_link_linkedin'] = company_links.get('linkedin', '')
        contact['quick_link_linkedin_president'] = company_links.get('linkedin_president', '')
        contact['quick_link_facebook'] = company_links.get('facebook', '')
        contact['quick_link_instagram'] = company_links.get('instagram', '')
        
        # Contact-specific links
        if email:
            contact_links = generator.generate_contact_quick_links(
                name=name,
                email=email,
                company=company
            )
            contact['quick_link_contact_linkedin'] = contact_links.get('linkedin_by_email', '')
        
        contacts_with_links.append(contact)
        
        if i % 50 == 0:
            print(f"  Processed {i}/{len(contacts)}...")
    
    # Save to CSV
    if contacts_with_links:
        fieldnames = list(contacts_with_links[0].keys())
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(contacts_with_links)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Input: {input_file}")
    print(f"   Output: {output_file}")
    print(f"   Total contacts with Quick Links: {len(contacts_with_links)}")
    
    # Show sample
    print("\n" + "="*70)
    print("SAMPLE OUTPUT")
    print("="*70)
    
    sample = contacts_with_links[0]
    print(f"\nCompany: {sample.get('company', '')}")
    print(f"Contact: {sample.get('name', '')}")
    print(f"Email: {sample.get('email', '')}")
    print(f"\nQuick Links:")
    print(f"  GOOGLE: {sample.get('quick_link_google', '')}")
    print(f"  CONTACT PAGE: {sample.get('quick_link_contact_page', '')}")
    print(f"  LINKEDIN: {sample.get('quick_link_linkedin', '')}")
    print(f"  LINKEDIN PRESIDENT: {sample.get('quick_link_linkedin_president', '')}")
    print(f"  FACEBOOK: {sample.get('quick_link_facebook', '')}")
    print(f"  INSTAGRAM: {sample.get('quick_link_instagram', '')}")
    
    return contacts_with_links


def generate_obsidian_markdown_files():
    """Generate individual Markdown files with Quick Links for Obsidian"""
    
    generator = QuickLinksGenerator()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/all_contacts_quick_links.csv"
    output_dir = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/quick_links_notes"
    
    Path(output_dir).mkdir(exist_ok=True)
    
    print("\n" + "="*70)
    print("GENERATING OBSIDIAN MARKDOWN FILES")
    print("="*70)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        contacts = list(reader)
    
    generated = 0
    
    for contact in contacts:
        company = contact.get('company', '').strip('[]').replace(' ', '_').replace('/', '_')
        name = contact.get('name', '').replace(' ', '_')
        
        if not company:
            continue
        
        # Generate filename
        if name:
            filename = f"{company}_{name}.md"
        else:
            filename = f"{company}.md"
        
        # Generate Markdown content
        markdown = generator.generate_markdown_quick_links(
            company_name=contact.get('company', '').strip('[]'),
            phone=contact.get('phone', ''),
            website=contact.get('website', ''),
            contacts=[{
                'name': contact.get('name', ''),
                'email': contact.get('email', ''),
                'title': contact.get('title', '')
            }] if contact.get('name') or contact.get('email') else []
        )
        
        # Add frontmatter
        frontmatter = f"""---
company: {contact.get('company', '')}
contact_name: {contact.get('name', '')}
contact_email: {contact.get('email', '')}
phone: {contact.get('phone', '')}
website: {contact.get('website', '')}
property: {contact.get('property_address', '')}
city: {contact.get('city', '')}
rt_number: {contact.get('rt_number', '')}
type: {contact.get('type', '')}
---

"""
        
        full_content = frontmatter + markdown
        
        # Save file
        filepath = Path(output_dir) / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        generated += 1
    
    print(f"✅ Generated {generated} Markdown files in: {output_dir}")


if __name__ == "__main__":
    # Process all contacts and add Quick Links to CSV
    process_bdaiv2_contacts()
    
    # Generate individual Obsidian notes
    generate_obsidian_markdown_files()
    
    print("\n" + "="*70)
    print("ALL DONE!")
    print("="*70)
