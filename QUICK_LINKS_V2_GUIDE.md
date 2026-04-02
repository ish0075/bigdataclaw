# 🔍 Quick Links Universal Generator v2.0 - Complete Guide

## ✅ COMPLETED: Enhanced Quick Links with BUILDERS, LOOPNET & LIVABL

**Generated:** 2026-03-27  
**Total Contacts Processed:** 136,224

---

## 📊 Summary by Category

| Category | Count | Output File | Size |
|----------|-------|-------------|------|
| **Companies (Non-Builder)** | 30,485 | `QUICK_LINKS_COMPANIES_V2.csv` | 63 MB |
| **🏗️ BUILDERS** (Development/Construction) | 4,363 | `QUICK_LINKS_BUILDERS.csv` | 15 MB |
| **Realtors (Brokers + Salespersons)** | 96,263 | `QUICK_LINKS_ALL_REALTORS_V2.csv` | 196 MB |
| **Lenders** | 5,113 | `QUICK_LINKS_LENDERS_V2.csv` | 11 MB |
| **TOTAL** | **136,224** | - | **285 MB** |

---

## 🆕 NEW IN v2.0

### ✨ Builder Detection (Auto)
Companies with these keywords are automatically flagged as builders:
- `develop`, `development`, `developer`
- `construction`, `constructor`, `builder`, `building`
- `homes`, `properties`, `realty`, `condo`, `residential`
- `custom homes`, `home builder`, `land development`

### 🔗 New Quick Link Types

#### For ALL Contacts:
| Link Type | URL Base | Purpose |
|-----------|----------|---------|
| **LOOPNET** | `loopnet.com/search?q=` | Commercial property search |
| **LOOPNET Properties** | Google site search | Find on Loopnet.com |
| **CRE Google** | Google | Commercial real estate search |
| **CoStar** | Google site search | CoStar commercial data |

#### For BUILDERS Only:
| Link Type | URL Base | Purpose |
|-----------|----------|---------|
| **LIVABL** | `livabl.com/builders/` | New construction builder profile |
| **LIVABL Search** | `livabl.com/search?q=` | Builder search on LIVABL |
| **New Homes** | Google | New construction search |
| **Tarion** | Google | Ontario builder warranty lookup |
| **HCRA** | Google | Ontario builder registry |
| **Past Projects** | Google | Development history |
| **HomeStars** | Google | Builder reviews |
| **BBB** | Google | Better Business Bureau lookup |

### 🏢 Property Quick Links Generator
New function `generate_property_quick_links()` for individual properties:
- LOOPNET sale/lease searches
- Google Maps & Street View
- Realtor.ca, Zolo, Redfin
- Property records & MPAC assessment
- News & image search

---

## 📁 Output Files

### 1. QUICK_LINKS_BUILDERS.csv (4,363 records)
Builders/Developers with ALL links including:
- Standard Quick Links (Google, LinkedIn, Facebook, etc.)
- LOOPNET commercial search
- **LIVABL profile & search**
- **Tarion warranty lookup**
- **HCRA registry search**
- Builder reviews & past projects
- Pre-formatted Markdown column

### 2. QUICK_LINKS_COMPANIES_V2.csv (30,485 records)
Non-builder companies with:
- Standard Quick Links
- LOOPNET commercial search
- CRE (Commercial Real Estate) search
- Pre-formatted Markdown

### 3. QUICK_LINKS_ALL_REALTORS_V2.csv (96,263 records)
Brokers & Salespersons with:
- Standard Quick Links
- LOOPNET property search
- Email LinkedIn search
- Pre-formatted Markdown

### 4. QUICK_LINKS_LENDERS_V2.csv (5,113 records)
Lenders with:
- Standard Quick Links
- LOOPNET commercial search
- Pre-formatted Markdown

---

## 🎯 Usage Examples

### Python - Generate Quick Links

```python
from quick_links_universal import QuickLinksGenerator

ql = QuickLinksGenerator()

# For a company/builder
links = ql.generate_quick_links(
    name="Capital Developments",
    phone="416-632-9300",
    website="capitaldevelopments.com"
)

# Check if detected as builder
print(ql.is_builder("Capital Developments"))  # True

# Format for Obsidian
markdown = ql.format_markdown(
    name="Capital Developments",
    links=links,
    phone="416-632-9300",
    address="Toronto, ON",
    title="Real Estate Developer"
)

# For a property
prop_links = ql.generate_property_quick_links(
    address="800 Niagara St",
    city="Niagara-on-the-Lake",
    province="ON",
    property_type="Retail"
)

prop_markdown = ql.format_property_markdown(
    address="800 Niagara St",
    links=prop_links,
    city="Niagara-on-the-Lake",
    property_type="Retail"
)
```

### Sample Builder Output

```markdown
### 🔍 QUICK LINKS

**Capital Developments**
*Real Estate Developer*

📍 Toronto, ON
📞 416-632-9300

**General Search:**
| Google | [Search](...) |
| LinkedIn | [Profile](...) |
| Facebook | [Page](...) |

**🏢 Commercial Real Estate:**
| LOOPNET | [Search](https://www.loopnet.com/search?q=Capital+Developments) |
| LOOPNET Properties | [Find](...) |
| CRE Search | [Google](...) |

**🏗️ BUILDER/DEVELOPER:**
| LIVABL | [Profile](https://livabl.com/builders/capital-developments) |
| LIVABL Search | [Search](...) |
| New Homes | [Search](...) |
| Tarion | [Search](...) |
| HCRA | [Search](...) |
| Past Projects | [Search](...) |
```

### Sample Property Output

```markdown
### 🏢 PROPERTY QUICK LINKS

**800 Niagara St**
*Niagara-on-the-Lake*
Type: Retail

**📊 LOOPNET (Commercial):**
| LOOPNET Search | [View](https://www.loopnet.com/search?q=800+Niagara+St...) |
| For Sale | [Search](...) |
| For Lease | [Search](...) |

**🗺️ Maps & Location:**
| Google Maps | [View](...) |
| Street View | [View](...) |

**🏠 Property Research:**
| Google Search | [Search](...) |
| Realtor.ca | [Search](...) |
| MPAC Assessment | [Search](...) |
| Property Records | [Search](...) |
```

---

## 📋 Files in This Package

| File | Purpose |
|------|---------|
| `quick_links_universal.py` | **REUSABLE CLASS v2.0** - Import for any new contacts |
| `apply_quick_links_enhanced.py` | Batch processor script |
| `QUICK_LINKS_BUILDERS.csv` | **NEW** - 4,363 builders with LIVABL links |
| `QUICK_LINKS_COMPANIES_V2.csv` | 30,485 non-builder companies |
| `QUICK_LINKS_ALL_REALTORS_V2.csv` | 96,263 realtors |
| `QUICK_LINKS_LENDERS_V2.csv` | 5,113 lenders |
| `QUICK_LINKS_V2_GUIDE.md` | This documentation |

---

## 🎨 CSS Styling (New Buttons)

```css
.ql-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  max-width: 400px;
}

.ql-btn {
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
}

/* Standard buttons */
.ql-google { background: #4285f4; color: white; }
.ql-linkedin { background: #0077b5; color: white; }
.ql-facebook { background: #1877f2; color: white; }
.ql-instagram { background: #e4405f; color: white; }
.ql-twitter { background: #1da1f2; color: white; }

/* NEW v2.0 buttons */
.ql-loopnet { background: #6b4c9a; color: white; }  /* Purple */
.ql-livabl { background: #00a4e4; color: white; }   /* Light blue */
```

---

## 🚀 Integration Options

1. **Agent Recruiter Dashboard** - Load Quick Links for instant contact research
2. **Obsidian Vault** - Import markdown for network notes
3. **CRM Integration** - Use HTML/Markdown in Salesforce/HubSpot
4. **Property Research** - Use `generate_property_quick_links()` for listings
5. **Builder Outreach** - Use LIVABL links to research developers

---

## ✨ Key Features

- ✅ **137,377 contacts** with Quick Links
- ✅ **4,363 builders** auto-detected and enriched
- ✅ **LOOPNET** integration for commercial properties
- ✅ **LIVABL** integration for new construction
- ✅ **Tarion & HCRA** lookups for Ontario builders
- ✅ **Property-specific** Quick Links generator
- ✅ **Obsidian-ready** markdown with YAML frontmatter
- ✅ **HTML output** for web dashboards

---

## 📞 Example Research Workflow

1. **Find a builder** in `QUICK_LINKS_BUILDERS.csv`
2. **Click LIVABL link** - See their projects & inventory
3. **Click HCRA link** - Verify they're registered
4. **Click Tarion link** - Check warranty history
5. **Click LinkedIn** - Find the President/CEO
6. **Click LOOPNET** - See their commercial properties

---

**BigDataClaw - Quick Links Universal Generator v2.0**  
*Built for bigstats.io format with commercial real estate superpowers*
