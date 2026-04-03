#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║              QUICK LINKS UNIVERSAL GENERATOR v2.0                            ║
║           BigDataClaw / bigstats.io Style Quick Links                        ║
║                                                                              ║
║  ✓ Companies (Buyers, Sellers, Investors)                                    ║
║  ✓ Builders (Development/Construction) - AUTO DETECTED                       ║
║  ✓ Agents & Brokers (Realtors)                                               ║
║  ✓ Lenders                                                                   ║
║  ✓ Individual Contacts                                                       ║
║                                                                              ║
║  NEW v2.0:                                                                   ║
║  • LOOPNET commercial property search links                                  ║
║  • LIVABL new construction builder profiles                                  ║
║  • HCRA Ontario builder registry search                                      ║
║  • Tarion warranty lookup                                                    ║
║  • Property-specific Quick Links generator                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE:
    from quick_links_universal import QuickLinksGenerator
    
    ql = QuickLinksGenerator()
    
    # For a company
    links = ql.generate_quick_links(
        name="Acme Developments",
        phone="416-555-1234",
        website="acme.com"
    )
    
    # For a property
    prop_links = ql.generate_property_quick_links(
        address="800 Niagara St",
        city="Niagara-on-the-Lake"
    )

OUTPUT FORMAT:
    Each contact gets:
    • GOOGLE search | CONTACT PAGE | LINKEDIN | LINKEDIN PRESIDENT
    • FACEBOOK | INSTAGRAM | TWITTER/X
    • LOOPNET property search | LIVABL builder profile (if builder)
    • HCRA lookup | Tarion warranty (if builder)
"""

from urllib.parse import quote_plus
from typing import Dict, Optional
import re


class QuickLinksGenerator:
    """
    Universal Quick Links Generator v2.0
    Replicates bigstats.io format with enhanced property/builder features
    """
    
    BASE_GOOGLE = "https://www.google.com/search"
    
    # Platform-specific search templates
    SEARCH_TEMPLATES = {
        'contact_page': '{name} "contact"',
        'linkedin': "{name} linkedin",
        'linkedin_president': "{name} President OR CEO linkedin",
        'facebook': "{name} facebook",
        'instagram': "{name} instagram",
        'twitter': "{name} twitter OR x.com",
        'tiktok': "{name} tiktok",
        'whatsapp': "{name} whatsapp business",
        'email_linkedin': "{email} linkedin",
        'phone_lookup': "{phone} {name}"
    }
    
    # Builder detection keywords
    BUILDER_KEYWORDS = [
        'develop', 'development', 'developer',
        'construction', 'constructor', 'builder', 'building',
        'homes', 'properties', 'realty', 'condo', 'residential',
        'custom homes', 'home builder', 'land development',
        'general contractor', 'renovation', 'remodeling'
    ]
    
    def is_builder(self, name: str) -> bool:
        """Detect if name indicates a builder/development company"""
        if not name:
            return False
        name_lower = name.lower()
        return any(keyword in name_lower for keyword in self.BUILDER_KEYWORDS)
    
    def generate_quick_links(
        self,
        name: str,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        title: Optional[str] = None,
        include_property_searches: bool = True
    ) -> Dict[str, str]:
        """
        Generate Quick Links for any entity
        
        Args:
            name: Company or person name
            phone: Phone number (optional)
            email: Email address (optional)
            website: Website URL (optional)
            address: Physical address (optional)
            title: Job title (optional)
            include_property_searches: Include LOOPNET/CRE links (default True)
            
        Returns:
            Dictionary of search URLs
        """
        links = {}
        
        # ═══════════════════════════════════════════════════════════
        # GOOGLE SEARCHES (Standard)
        # ═══════════════════════════════════════════════════════════
        
        # Build main search query
        search_query = name
        if phone:
            search_query = f"{phone} {name}"
        
        # Google main search
        links['google'] = f"{self.BASE_GOOGLE}?q={quote_plus(search_query)}"
        
        # Standard social/professional searches
        for key, template in self.SEARCH_TEMPLATES.items():
            if key == 'contact_page':
                query = template.format(name=name)
            elif key == 'email_linkedin':
                if email:
                    query = template.format(email=email)
                else:
                    continue
            elif key == 'phone_lookup':
                if phone:
                    query = template.format(phone=phone, name=name)
                else:
                    continue
            else:
                query = template.format(name=name)
            
            links[key] = f"{self.BASE_GOOGLE}?q={quote_plus(query)}"
        
        # ═══════════════════════════════════════════════════════════
        # PROPERTY & COMMERCIAL REAL ESTATE (NEW v2.0)
        # ═══════════════════════════════════════════════════════════
        
        if include_property_searches:
            # LOOPNET - Commercial property platform
            links['loopnet'] = f"https://www.loopnet.com/search?q={quote_plus(name)}"
            links['loopnet_properties'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' site:loopnet.com')}"
            
            # Commercial real estate searches
            links['cre_google'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' commercial real estate')}"
            links['cre_listings'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' properties for sale lease')}"
            
            # CoStar (commercial real estate data)
            links['costar'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' site:costar.com')}"
        
        # ═══════════════════════════════════════════════════════════
        # BUILDER/DEVELOPER SPECIFIC (NEW v2.0)
        # ═══════════════════════════════════════════════════════════
        
        if self.is_builder(name):
            # LIVABL - New construction platform
            links['livabl'] = f"https://livabl.com/builders/{quote_plus(name.replace(' ', '-').lower())}"
            links['livabl_search'] = f"https://livabl.com/search?q={quote_plus(name)}"
            
            # Builder-specific searches
            links['new_homes'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' new homes new construction')}"
            links['builder_reviews'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' builder reviews')}"
            links['tarion'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' tarion warranty')}"
            links['hcra'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' HCRA Ontario builder')}"
            links['past_projects'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' past projects developments')}"
            
            # Additional builder resources
            links['better_business_bureau'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' BBB Better Business Bureau')}"
            links['home_stars'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' HomeStars reviews')}"
        
        # ═══════════════════════════════════════════════════════════
        # WEBSITE & EMAIL
        # ═══════════════════════════════════════════════════════════
        
        if website:
            links['website'] = website if website.startswith('http') else f"https://{website}"
        
        if email:
            links['email_search'] = f"{self.BASE_GOOGLE}?q={quote_plus(email)}"
        
        # ═══════════════════════════════════════════════════════════
        # SOCIAL MEDIA & MESSAGING (NEW v2.1)
        # ═══════════════════════════════════════════════════════════
        
        # Video/Social platforms
        links['tiktok'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' tiktok')}"
        links['youtube'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' youtube')}"
        
        # Messaging & Chat platforms
        links['whatsapp_search'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' whatsapp business')}"
        links['messenger'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' facebook messenger')}"
        links['telegram'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' telegram')}"
        links['discord'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' discord server')}"
        links['wechat'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' wechat')}"
        links['signal'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' signal')}"
        
        # Scheduling & Meeting
        links['calendly'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' calendly')}"
        links['bookme'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' bookme scheduling')}"
        
        # Direct WhatsApp link (if phone provided)
        if phone:
            clean_phone = re.sub(r'\D', '', phone)
            if clean_phone.startswith('1') and len(clean_phone) == 11:
                links['whatsapp_direct'] = f"https://wa.me/{clean_phone}"
            elif len(clean_phone) == 10:
                links['whatsapp_direct'] = f"https://wa.me/1{clean_phone}"
        
        return links
    
    def generate_property_quick_links(
        self,
        address: str,
        city: Optional[str] = None,
        province: Optional[str] = None,
        property_type: Optional[str] = None,
        postal_code: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate Quick Links specifically for a property
        
        Args:
            address: Property street address
            city: City name
            province: Province/State
            property_type: Type (Retail, Office, Industrial, etc.)
            postal_code: Postal/ZIP code
            
        Returns:
            Dictionary of property-specific search URLs
        """
        links = {}
        
        # Build full address query
        query = address
        if city:
            query = f"{address}, {city}"
        if province:
            query = f"{query}, {province}"
        if postal_code:
            query = f"{query} {postal_code}"
        
        # ═══════════════════════════════════════════════════════════
        # LOOPNET (Primary commercial property search)
        # ═══════════════════════════════════════════════════════════
        
        links['loopnet'] = f"https://www.loopnet.com/search?q={quote_plus(query)}"
        
        if city:
            city_slug = city.lower().replace(' ', '-')
            if property_type:
                prop_slug = property_type.lower()
                links['loopnet_sale'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower())}/{prop_slug}/for-sale"
                links['loopnet_lease'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower())}/{prop_slug}/for-lease"
            else:
                links['loopnet_sale'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower())}/retail/for-sale"
                links['loopnet_lease'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower())}/retail/for-lease"
        
        # ═══════════════════════════════════════════════════════════
        # MAPPING & LOCATION
        # ═══════════════════════════════════════════════════════════
        
        links['google_maps'] = f"https://www.google.com/maps/search/{quote_plus(query)}"
        links['google_street_view'] = f"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint={quote_plus(query)}"
        links['bing_maps'] = f"https://www.bing.com/maps?q={quote_plus(query)}"
        
        # ═══════════════════════════════════════════════════════════
        # PROPERTY LISTINGS & DATA
        # ═══════════════════════════════════════════════════════════
        
        # Google property search
        links['google_property'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' property real estate')}"
        
        # Realtor.ca (Canada)
        links['realtor_ca'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' realtor.ca')}"
        
        # Zolo.ca (Canada)
        if city:
            links['zolo'] = f"https://www.zolo.ca/{quote_plus(city.lower())}-real-estate"
        
        # Redfin (US/Canada)
        links['redfin'] = f"https://www.redfin.com/search?q={quote_plus(query)}"
        
        # ═══════════════════════════════════════════════════════════
        # PUBLIC RECORDS & ASSESSMENTS
        # ═══════════════════════════════════════════════════════════
        
        links['property_records'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' property records ownership')}"
        links['mpac'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' MPAC assessment Ontario')}"
        links['land_registry'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' land registry title')}"
        
        # ═══════════════════════════════════════════════════════════
        # NEWS & RESEARCH
        # ═══════════════════════════════════════════════════════════
        
        links['property_news'] = f"{self.BASE_GOOGLE}?q={quote_plus(query + ' news article')}&tbm=nws"
        links['property_images'] = f"{self.BASE_GOOGLE}?q={quote_plus(query)}&tbm=isch"
        
        return links
    
    def format_markdown(
        self,
        name: str,
        links: Dict[str, str],
        phone: Optional[str] = None,
        email: Optional[str] = None,
        address: Optional[str] = None,
        title: Optional[str] = None,
        website: Optional[str] = None,
        notes: Optional[str] = None
    ) -> str:
        """Format Quick Links as Markdown (Obsidian compatible)"""
        lines = []
        
        # Header
        lines.append("### 🔍 QUICK LINKS")
        lines.append("")
        
        # Entity info
        lines.append(f"**{name}**")
        
        if title:
            lines.append(f"*{title}*")
        
        lines.append("")
        
        # Contact info
        if address:
            lines.append(f"📍 {address}")
        if phone:
            lines.append(f"📞 {phone}")
        if email:
            lines.append(f"📧 [{email}](mailto:{email})")
        if website and 'website' in links:
            lines.append(f"🌐 [Website]({links['website']})")
        
        lines.append("")
        
        # Standard Links
        lines.append("**General Search:**")
        lines.append(f"| Google | [Search]({links.get('google', '#')}) |")
        lines.append(f"| Contact | [Find]({links.get('contact_page', '#')}) |")
        lines.append(f"| LinkedIn | [Profile]({links.get('linkedin', '#')}) |")
        lines.append(f"| President/CEO | [Search]({links.get('linkedin_president', '#')}) |")
        lines.append(f"| Facebook | [Page]({links.get('facebook', '#')}) |")
        lines.append(f"| Instagram | [Profile]({links.get('instagram', '#')}) |")
        lines.append(f"| Twitter/X | [Profile]({links.get('twitter', '#')}) |")
        
        # Social Media & Video Section
        lines.append("")
        lines.append("**📱 Social Media & Video:**")
        lines.append(f"| TikTok | [Search]({links.get('tiktok', '#')}) |")
        lines.append(f"| YouTube | [Search]({links.get('youtube', '#')}) |")
        
        # Messaging & Chat Section
        lines.append("")
        lines.append("**💬 Messaging & Chat:**")
        if 'whatsapp_direct' in links:
            lines.append(f"| WhatsApp | [Chat Now]({links.get('whatsapp_direct', '#')}) |")
        lines.append(f"| WhatsApp Search | [Find]({links.get('whatsapp_search', '#')}) |")
        lines.append(f"| Messenger | [Search]({links.get('messenger', '#')}) |")
        lines.append(f"| Telegram | [Search]({links.get('telegram', '#')}) |")
        lines.append(f"| Discord | [Search]({links.get('discord', '#')}) |")
        
        # Scheduling Section
        lines.append("")
        lines.append("**📅 Scheduling:**")
        lines.append(f"| Calendly | [Search]({links.get('calendly', '#')}) |")
        lines.append(f"| BookMe | [Search]({links.get('bookme', '#')}) |")
        
        # Commercial Real Estate Section
        if 'loopnet' in links:
            lines.append("")
            lines.append("**🏢 Commercial Real Estate:**")
            lines.append(f"| LOOPNET | [Search]({links.get('loopnet', '#')}) |")
            lines.append(f"| LOOPNET Properties | [Find]({links.get('loopnet_properties', '#')}) |")
            lines.append(f"| CRE Search | [Google]({links.get('cre_google', '#')}) |")
            if 'costar' in links:
                lines.append(f"| CoStar | [Search]({links.get('costar', '#')}) |")
        
        # Builder Section
        if self.is_builder(name) and 'livabl' in links:
            lines.append("")
            lines.append("**🏗️ BUILDER/DEVELOPER:**")
            lines.append(f"| LIVABL | [Profile]({links.get('livabl', '#')}) |")
            lines.append(f"| LIVABL Search | [Search]({links.get('livabl_search', '#')}) |")
            lines.append(f"| New Homes | [Search]({links.get('new_homes', '#')}) |")
            lines.append(f"| Reviews | [Find]({links.get('builder_reviews', '#')}) |")
            lines.append(f"| Tarion | [Search]({links.get('tarion', '#')}) |")
            lines.append(f"| HCRA | [Search]({links.get('hcra', '#')}) |")
            lines.append(f"| Past Projects | [Search]({links.get('past_projects', '#')}) |")
            if 'home_stars' in links:
                lines.append(f"| HomeStars | [Reviews]({links.get('home_stars', '#')}) |")
        
        # Email
        if email and 'email_linkedin' in links:
            lines.append("")
            lines.append(f"**Contact LinkedIn:** [Search by Email]({links['email_linkedin']})")
        
        # Notes
        if notes:
            lines.append("")
            lines.append("**Notes:**")
            lines.append(notes)
        
        return "\n".join(lines)
    
    def format_property_markdown(
        self,
        address: str,
        links: Dict[str, str],
        city: Optional[str] = None,
        property_type: Optional[str] = None
    ) -> str:
        """Format Quick Links specifically for a property"""
        lines = []
        
        lines.append("### 🏢 PROPERTY QUICK LINKS")
        lines.append("")
        lines.append(f"**{address}**")
        
        if city:
            lines.append(f"*{city}*")
        if property_type:
            lines.append(f"Type: {property_type}")
        
        lines.append("")
        
        # LOOPNET Section
        lines.append("**📊 LOOPNET (Commercial):**")
        lines.append(f"| LOOPNET Search | [View]({links.get('loopnet', '#')}) |")
        if 'loopnet_sale' in links:
            lines.append(f"| For Sale | [Search]({links.get('loopnet_sale', '#')}) |")
        if 'loopnet_lease' in links:
            lines.append(f"| For Lease | [Search]({links.get('loopnet_lease', '#')}) |")
        
        # Maps
        lines.append("")
        lines.append("**🗺️ Maps & Location:**")
        lines.append(f"| Google Maps | [View]({links.get('google_maps', '#')}) |")
        if 'google_street_view' in links:
            lines.append(f"| Street View | [View]({links.get('google_street_view', '#')}) |")
        
        # Property Searches
        lines.append("")
        lines.append("**🏠 Property Research:**")
        lines.append(f"| Google Search | [Search]({links.get('google_property', '#')}) |")
        lines.append(f"| Realtor.ca | [Search]({links.get('realtor_ca', '#')}) |")
        lines.append(f"| Redfin | [Search]({links.get('redfin', '#')}) |")
        lines.append(f"| Property Records | [Search]({links.get('property_records', '#')}) |")
        lines.append(f"| MPAC Assessment | [Search]({links.get('mpac', '#')}) |")
        lines.append(f"| Land Registry | [Search]({links.get('land_registry', '#')}) |")
        
        # Media
        lines.append("")
        lines.append("**📰 News & Images:**")
        lines.append(f"| News | [Search]({links.get('property_news', '#')}) |")
        lines.append(f"| Images | [View]({links.get('property_images', '#')}) |")
        
        return "\n".join(lines)
    
    def format_html(
        self,
        name: str,
        links: Dict[str, str],
        phone: Optional[str] = None,
        email: Optional[str] = None,
        address: Optional[str] = None,
        title: Optional[str] = None,
        website: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> str:
        """Format Quick Links as HTML (bigstats.io style)"""
        html_parts = []
        
        html_parts.append("<div class='ql-card'>")
        
        # Header
        html_parts.append("  <div class='ql-header'>")
        if avatar_url:
            html_parts.append(f"    <img src='{avatar_url}' class='ql-avatar' alt='{name}'>")
        html_parts.append(f"    <h3 class='ql-name'>{name}</h3>")
        if title:
            html_parts.append(f"    <span class='ql-title'>{title}</span>")
        html_parts.append("  </div>")
        
        # Contact info
        html_parts.append("  <div class='ql-contact'>")
        if address:
            html_parts.append(f"    <div class='ql-address'>📍 {address}</div>")
        if phone:
            html_parts.append(f"    <div class='ql-phone'>📞 {phone}</div>")
        if email:
            html_parts.append(f"    <div class='ql-email'>📧 <a href='mailto:{email}'>{email}</a></div>")
        if website and 'website' in links:
            html_parts.append(f"    <div class='ql-website'>🌐 <a href='{links['website']}' target='_blank'>Website</a></div>")
        html_parts.append("  </div>")
        
        # Quick Links grid
        html_parts.append("  <div class='ql-links'>")
        html_parts.append("    <h4>🔍 Quick Links</h4>")
        html_parts.append("    <div class='ql-grid'>")
        
        html_parts.append(f"      <a href='{links.get('google', '#')}' class='ql-btn ql-google' target='_blank'>Google</a>")
        html_parts.append(f"      <a href='{links.get('contact_page', '#')}' class='ql-btn ql-contact' target='_blank'>Contact</a>")
        html_parts.append(f"      <a href='{links.get('linkedin', '#')}' class='ql-btn ql-linkedin' target='_blank'>LinkedIn</a>")
        html_parts.append(f"      <a href='{links.get('linkedin_president', '#')}' class='ql-btn ql-ceo' target='_blank'>President/CEO</a>")
        html_parts.append(f"      <a href='{links.get('facebook', '#')}' class='ql-btn ql-facebook' target='_blank'>Facebook</a>")
        html_parts.append(f"      <a href='{links.get('instagram', '#')}' class='ql-btn ql-instagram' target='_blank'>Instagram</a>")
        html_parts.append(f"      <a href='{links.get('twitter', '#')}' class='ql-btn ql-twitter' target='_blank'>Twitter/X</a>")
        
        # LOOPNET button
        if 'loopnet' in links:
            html_parts.append(f"      <a href='{links['loopnet']}' class='ql-btn ql-loopnet' target='_blank'>LOOPNET</a>")
        
        # LIVABL for builders
        if 'livabl' in links:
            html_parts.append(f"      <a href='{links['livabl']}' class='ql-btn ql-livabl' target='_blank'>LIVABL</a>")
        
        html_parts.append("    </div>")
        html_parts.append("  </div>")
        
        html_parts.append("</div>")
        
        return "\n".join(html_parts)
    
    def format_obsidian_card(
        self,
        name: str,
        links: Dict[str, str],
        phone: Optional[str] = None,
        email: Optional[str] = None,
        address: Optional[str] = None,
        title: Optional[str] = None,
        website: Optional[str] = None,
        tags: Optional[list] = None
    ) -> str:
        """Format as Obsidian note with YAML frontmatter"""
        lines = []
        
        # YAML Frontmatter
        lines.append("---")
        lines.append(f"name: {name}")
        
        if title:
            lines.append(f"title: {title}")
        
        if email:
            lines.append(f"email: {email}")
        
        if phone:
            lines.append(f"phone: {phone}")
        
        if address:
            lines.append(f"address: {address}")
        
        if website:
            lines.append(f"website: {website}")
        
        # Auto-detect builder tag
        if self.is_builder(name):
            if tags is None:
                tags = []
            if 'builder' not in tags:
                tags.append('builder')
        
        if tags:
            lines.append(f"tags: [{', '.join(tags)}]")
        
        lines.append(f"quick_links_generated: true")
        lines.append("---")
        lines.append("")
        
        # Body
        lines.append(f"# {name}")
        lines.append("")
        
        if title:
            lines.append(f"**{title}**")
            lines.append("")
        
        # Add the markdown formatted quick links
        lines.append(self.format_markdown(
            name=name,
            links=links,
            phone=phone,
            email=email,
            address=address,
            title=title,
            website=website
        ))
        
        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    ql = QuickLinksGenerator()
    
    print("="*70)
    print("QUICK LINKS UNIVERSAL GENERATOR v2.0 - Examples")
    print("="*70)
    
    # Example 1: Builder/Developer
    print("\n🏗️ Example 1: Builder/Developer")
    print("-"*70)
    
    builder_links = ql.generate_quick_links(
        name="Capital Developments",
        phone="416-632-9300",
        website="capitaldevelopments.com"
    )
    
    print(f"\nDetected as builder: {ql.is_builder('Capital Developments')}")
    print("\nLinks Generated:")
    for key, url in list(builder_links.items())[:15]:
        print(f"  {key:20}: {url[:60]}...")
    
    print("\n" + "="*70)
    
    # Example 2: Property
    print("\n🏢 Example 2: Property (Seaway Mall)")
    print("-"*70)
    
    property_links = ql.generate_property_quick_links(
        address="800 Niagara St",
        city="Niagara-on-the-Lake",
        province="ON",
        property_type="Retail"
    )
    
    print("\nProperty Links:")
    for key, url in list(property_links.items())[:12]:
        print(f"  {key:20}: {url[:60]}...")
    
    print("\n" + "="*70)
    
    # Example 3: Markdown Output
    print("\n📝 Example 3: Markdown Output")
    print("-"*70)
    
    markdown = ql.format_markdown(
        name="Capital Developments",
        links=builder_links,
        phone="416-632-9300",
        address="Toronto, ON",
        title="Real Estate Developer"
    )
    
    print(markdown[:1500] + "...")
    
    print("\n" + "="*70)
    
    # Example 4: Property Markdown
    print("\n📝 Example 4: Property Markdown Output")
    print("-"*70)
    
    prop_markdown = ql.format_property_markdown(
        address="800 Niagara St",
        links=property_links,
        city="Niagara-on-the-Lake",
        property_type="Retail"
    )
    
    print(prop_markdown)
