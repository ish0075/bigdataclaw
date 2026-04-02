# 🚀 Property Matching System - Quickstart Guide

Get up and running with the BigDataClaw Property Matching System in 5 minutes.

---

## ⚡ Quick Demo

```bash
# Run the demo
python3 agents/integrated_property_system.py
```

This will:
1. Submit Bayshore Mall (retail property in Ottawa)
2. Match top 5 buyers
3. Assemble deal team
4. Match lenders
5. Generate complete deal package

---

## 📦 Installation

### Prerequisites
```bash
# Python 3.8+
python3 --version

# Required packages (already in requirements.txt)
pip install pandas pyyaml requests
```

### Setup
```bash
# Clone/navigate to project
cd /path/to/bigdataclaw

# Set Python path
export PYTHONPATH=/path/to/bigdataclaw:$PYTHONPATH

# Test import
python3 -c "from agents.integrated_property_system import get_property_matching_system; print('✅ Ready!')"
```

---

## 🎯 Basic Usage

### 1. Submit a Property

```python
from agents.integrated_property_system import get_property_matching_system

system = get_property_matching_system()

# Property details
property_data = {
    'address': '123 Main Street',
    'city': 'Toronto',
    'province': 'ON',
    'asset_class': 'retail',  # multifamily, office, industrial, etc.
    'asking_price': 25000000,
    'size_sf': 50000,
    'noi': 1375000,  # Net Operating Income
    'occupancy': 95,
    'listing_agent_name': 'Your Name',
    'listing_agent_company': 'Your Brokerage',
    'listing_agent_email': 'you@brokerage.com',
    'listing_agent_phone': '416-555-0000'
}

# Process
result = system.submit_and_process(property_data)
```

### 2. View Results

```python
print(f"Tracking ID: {result['tracking_id']}")
print(f"Buyers Matched: {result['summary']['buyers_matched']}")
print(f"Agents Assembled: {result['summary']['agents_assembled']}")
print(f"Lenders Matched: {result['summary']['lenders_suggested']}")

# Save deal package
with open('my_deal_package.md', 'w') as f:
    f.write(result['outputs']['markdown'])
```

### 3. Access Later

```python
# Get existing package
package = system.get_deal_package('Toronto_20260324_1', format='markdown')
print(package)

# List all submissions
submissions = system.list_active_submissions()
for sub in submissions:
    print(f"{sub['tracking_id']}: {sub['address']}")
```

---

## 📊 Property Data Fields

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Street address |
| `city` | string | City name |
| `province` | string | Province code (ON, BC, etc.) |
| `asset_class` | string | Property type |

### Asset Classes
- `multifamily` - Apartment buildings
- `retail` - Shopping centers, stores
- `industrial` - Warehouses, logistics
- `office` - Office buildings
- `land` - Development land
- `hospitality` - Hotels
- `mixed_use` - Mixed-use properties

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `asking_price` | float | Asking price in dollars |
| `size_sf` | float | Building size in square feet |
| `lot_size_acres` | float | Land area in acres |
| `noi` | float | Net Operating Income |
| `occupancy` | float | Occupancy percentage |
| `year_built` | int | Construction year |
| `tenant_roster` | list | List of tenants |

---

## 🎨 Output Format

### Markdown (Human-Readable)
```markdown
# 🏢 Deal Package: 123 Main Street

## 🎯 Target Buyers
### #1 ABC Capital 🔥 URGENT
**Score:** 92/100
**Contact:** john@abccapital.com
**Why:** Recent $50M acquisition, actively deploying capital

## 🤝 Deal Team
- Sarah Chen (CBRE) - Asset Expert
- Jennifer Walsh (Avison Young) - Market Expert

## 🏦 Suggested Lenders
- RBC Commercial Banking ($5M-$500M)
- KingSett Mortgage ($10M-$300M)
```

### JSON (API-Ready)
```json
{
  "tracking_id": "Toronto_20260324_1",
  "property": {
    "address": "123 Main Street",
    "asking_price": 25000000
  },
  "buyers": [
    {
      "name": "ABC Capital",
      "match_score": 92,
      "contact": {...}
    }
  ],
  "lenders": [...]
}
```

---

## 🔧 Customization

### Add Your Own Buyers

Edit `buyers_data/Hot_Money/Your_Buyer.md`:

```yaml
---
type: buyer
category: hot_money
match_score: 95
priority: call_today
asset_class: retail
capacity: $100M
created: 2026-03-24
---

# Your Buyer Name

## 📞 Contact Information
- **Name:** John Smith
- **Company:** ABC Capital
- **Phone:** 416-555-0000
- **Email:** john@abccapital.com

## 💰 Deal History
- **Recent Deal:** $50,000,000 (Feb 2026)
- **Asset Class:** Retail

## 🎯 Match Analysis
- **Why Matched:** Actively deploying capital

## 💡 Talking Points
- Just raised $200M fund
- Looking for core retail
- Can close in 30 days
```

### Customize Expert Agents

Edit `agents/collaboration_agent.py`:

```python
experts = [
    ExpertAgent(
        name="Your Agent Name",
        company="Your Brokerage",
        email="agent@brokerage.com",
        expertise=[ExpertiseArea.ASSET_EXPERT],
        asset_specialties=["retail"],
        geographic_markets=["Toronto"]
    )
]
```

---

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'agents'"

**Solution:** Set PYTHONPATH
```bash
export PYTHONPATH=/path/to/bigdataclaw:$PYTHONPATH
```

### Issue: "No buyers matched"

**Solution:** Check buyer database location
```bash
ls buyers_data/Hot_Money/
```

### Issue: "Metrics not calculating"

**Solution:** Ensure price and size_sf are provided
```python
property_data = {
    'asking_price': 10000000,  # Required for metrics
    'size_sf': 50000,          # Required for price/sf
    'noi': 500000              # Required for cap rate
}
```

---

## 📚 Next Steps

1. **Read the full docs:** [PROPERTY_MATCHING_SYSTEM.md](PROPERTY_MATCHING_SYSTEM.md)
2. **Check sample output:** [deal_package_output.md](deal_package_output.md)
3. **Customize for your market:** Add local agents and buyers
4. **Integrate with CRM:** Export JSON to your system

---

## 💡 Tips

### For Best Results
- Always include asking_price for accurate metrics
- Add NOI to calculate cap rate
- Include size_sf for price/sf calculations
- Provide complete listing agent contact info

### Hot Money Buyers
- Update buyer database regularly
- Track recent deals in your market
- Add talking points for each buyer
- Include specific deal history

### Deal Team Assembly
- Define agent specialties clearly
- Update geographic markets regularly
- Track recent deal counts
- Include buyer relationship networks

---

## 🆘 Support

Having issues? Check:
1. Python version (3.8+)
2. All dependencies installed
3. PYTHONPATH set correctly
4. Buyer data files exist in `buyers_data/Hot_Money/`

---

**Ready to match properties with buyers! 🎉**
