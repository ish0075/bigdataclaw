# LandSwipe Targeted Advertising Playbook
## Right Message → Right Audience → Right Time

---

## 🎯 The Strategy: Data-Driven Audience Targeting

Use your transaction data to build **hyper-targeted audiences** for each video campaign.

---

## Audience Segments from Your Data

### Segment 1: "Recent Sellers" (Hot Money Buyers)
**Data Source:** `buyers` table (sale_date within 90 days, $2M+)

**Profile:**
- Just closed a deal
- Have cash to deploy (tax deferral pressure)
- Looking for next opportunity
- Time-sensitive (1031 exchange window)

**Target With:**
- Video: "Hot Money Alert"
- Message: "You just sold. Here's what's available NOW."
- Platform: LinkedIn, email
- Timing: Within 48 hours of their sale

**LinkedIn Targeting:**
- Job Titles: "Real Estate Investor", "Developer", "Investment Manager"
- Company Size: 1-50 employees (private investors)
- Location: Ontario, Canada
- Interests: Commercial Real Estate, Investment Properties

---

### Segment 2: "Distressed Property Owners"
**Data Source:** `deal_opportunities` (your own listings + pre-listings)

**Profile:**
- Mortgage renewal coming
- Facing rate shock (2% → 7%)
- Motivated but not yet listed
- Open to off-market discussions

**Target With:**
- Video: "The Match" (show how you closed fast)
- Message: "Before your renewal hits, let's talk."
- Platform: Direct mail, LinkedIn, phone
- Timing: 30-60 days before renewal

**LinkedIn Targeting:**
- Job Titles: "Property Owner", "Real Estate Developer", "Landlord"
- Location: Property's city/region
- Company: Self-employed, property management companies

---

### Segment 3: "Active Buyers by Asset Class"
**Data Source:** `buyers` table (filter by property_type)

**Profiles:**

**Multi-Res Investors:**
- Bought apartments in last 2 years
- $5M+ capacity
- Niagara/Toronto/Hamilton focus

**Land Developers:**
- Bought development sites
- Zoning expertise
- Long-term holders

**Industrial Buyers:**
- Logistics companies
- REITs
- Private equity

**Target With:**
- Video: "Distress Radar" (matching their asset class)
- Message: "3 [asset class] deals under pressure in your target area."
- Platform: LinkedIn, industry newsletters
- Timing: Thursday afternoons (weekend planning)

---

### Segment 4: "Broker/Agent Network"
**Data Source:** `broker_agents` table

**Profile:**
- Active commercial brokers
- Your co-brokerage partners
- Referral sources

**Target With:**
- Video: "Market Velocity Report"
- Message: "Here's what your clients are missing."
- Platform: LinkedIn, direct email
- Timing: Monthly, end of month

---

## 🎬 Video → Platform → Audience Matrix

| Video Type | Platform | Audience | Timing | Budget |
|------------|----------|----------|--------|--------|
| Hot Money Alert | LinkedIn | Recent sellers | Weekly, Tue AM | $200/week |
| Hot Money Alert | Email | Your buyer list | Weekly, Tue AM | $0 |
| Distress Radar | LinkedIn | Active buyers | Weekly, Thu PM | $300/week |
| Distress Radar | SMS | Hot prospects | Weekly, Thu PM | $50/week |
| The Match | LinkedIn | Prospective clients | Monthly | $500/month |
| Market Velocity | YouTube | Broad CRE audience | Monthly | $1000/month |
| Market Velocity | LinkedIn | Broker network | Monthly | $300/month |

---

## 📊 LinkedIn Ad Setup

### Campaign 1: Hot Money Alert

**Objective:** Lead Generation

**Audience:**
```
Locations: Ontario, Canada
Job Titles: 
  - Real Estate Investor
  - Real Estate Developer
  - Investment Manager
  - Principal
  - Owner
Company Industries:
  - Real Estate
  - Investment Management
  - Construction
Member Interests:
  - Commercial Real Estate
  - Real Estate Investment
  - Property Development
Exclude:
  - Job Title: "Real Estate Agent" (too broad)
```

**Ad Format:** Single Video
**Video Length:** 45-60 seconds
**Headline:** "This Week's $47M in Closings - And Who's Buying Next"
**Description:** "Someone just put $47 million in their pocket. I know what they're buying next. Do you have it?"
**CTA:** "Learn More" → Landing page with email capture

**Budget:** $200/week
**Duration:** Ongoing, refreshed weekly with new data

---

### Campaign 2: Distress Radar

**Objective:** Website Conversions

**Audience:**
```
Locations: Niagara Region, Hamilton, Toronto
Job Titles:
  - Real Estate Investor
  - Developer
  - Property Manager
  - Asset Manager
Company Size: 1-200 employees
Seniority: Owner, Partner, Director, VP
```

**Ad Format:** Video
**Headline:** "3 Properties Under Pressure - 18 Days Left"
**Description:** "Motivated sellers. Pre-listing access. Qualified buyers waiting."
**CTA:** "View Deals" → LandSwipe signup

**Budget:** $300/week
**Duration:** Ongoing

---

### Campaign 3: Market Intelligence

**Objective:** Brand Awareness

**Audience:**
```
Locations: Canada
Job Titles:
  - Commercial Real Estate Agent
  - Real Estate Broker
  - Investment Analyst
  - Portfolio Manager
Industries:
  - Commercial Real Estate
  - Real Estate Investment Trusts
  - Private Equity
```

**Ad Format:** Video
**Headline:** "$4.2B in Transactions Last Quarter - Here's the Data"
**Description:** "Where the smart money is moving in Ontario CRE."
**CTA:** "Watch Now" → YouTube/LinkedIn video

**Budget:** $1000/month
**Duration:** Monthly

---

## 📧 Email Automation

### Sequence 1: Hot Money Subscriber

**Trigger:** Watches Hot Money Alert video

**Email 1 (Immediate):**
Subject: "The buyers you just saw - here's their criteria"
Body: Full buyer profiles + what they're looking for

**Email 2 (Day 2):**
Subject: "One of these buyers is looking in [their area]"
Body: Specific opportunity match

**Email 3 (Day 5):**
Subject: "How LandSwipe finds these deals"
Body: Platform demo offer

---

### Sequence 2: Distress Alert Subscriber

**Trigger:** Clicks on Distress Radar video

**Email 1 (Immediate):**
Subject: "The 3 distressed properties - full details inside"
Body: Property details + distress scores

**Email 2 (Day 1):**
Subject: "6 buyers are watching these deals"
Body: Buyer list preview

**Email 3 (Day 3):**
Subject: "Offer deadline approaching"
Body: Urgency + access to platform

---

## 🎯 Retargeting Strategy

### Pixel Setup
Install LinkedIn Insight Tag and Facebook Pixel on:
- landswipe.ca
- Landing pages
- Video pages

### Retargeting Audiences

**Audience 1: Video Viewers (50%+)**
- Watched 50%+ of video
- Target with: "Ready to see the full list?"
- Offer: Free trial / Property list

**Audience 2: Landing Page Visitors (No Signup)**
- Visited but didn't convert
- Target with: Testimonials, case studies
- Offer: "The Match" video proof

**Audience 3: Email Openers (No Click)**
- Opened email, didn't click
- Target with: Different angle/offer
- Offer: SMS alerts for hot deals

---

## 📱 SMS/Mobile Strategy

### Hot Deal Alerts

**Target:** Your best 100 buyers
**Message:**
```
LandSwipe Alert: $5.8M apartment building in St. Catharines. 
18 days to renewal. Distress score: 85/100.
Interested? Reply YES for details.
```

**Timing:** Thursday 4pm (weekend planning)
**Cost:** ~$0.05/message = $5/week
**Response Rate:** 15-25%

---

## 📊 Measurement & Optimization

### Key Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Video View Rate | >30% | Platform analytics |
| Click-Through Rate | >3% | UTM parameters |
| Cost Per View | <$0.10 | Ad spend / views |
| Cost Per Click | <$2 | Ad spend / clicks |
| Email Capture Rate | >10% | Landing page |
| Free Signup Rate | >5% | Platform analytics |
| Cost Per Acquisition | <$50 | Total spend / paid users |

### Weekly Optimization

**Monday:** Review weekend performance
**Tuesday:** Launch Hot Money campaign
**Wednesday:** Analyze engagement, adjust targeting
**Thursday:** Launch Distress Radar
**Friday:** Plan next week's content

---

## 🚀 30-Day Launch Plan

### Week 1: Setup
- [ ] Install tracking pixels
- [ ] Create LinkedIn ad accounts
- [ ] Build landing pages
- [ ] Set up email automation
- [ ] Create first 3 videos

### Week 2: Soft Launch
- [ ] Launch Hot Money campaign ($100)
- [ ] Email to existing contacts
- [ ] Monitor metrics daily
- [ ] Adjust targeting based on data

### Week 3: Scale
- [ ] Increase budget to $500/week
- [ ] Launch Distress Radar campaign
- [ ] Add retargeting
- [ ] A/B test headlines

### Week 4: Optimize
- [ ] Analyze full funnel
- [ ] Cut underperforming ads
- [ ] Double down on winners
- [ ] Plan Month 2 content

---

## 💰 Budget Recommendations

### Starter ($500/month)
- LinkedIn: $400
- Email tool: $50
- Video creation: $50

### Growth ($1500/month)
- LinkedIn: $1000
- YouTube: $300
- Email/SMS: $100
- Video production: $100

### Scale ($5000/month)
- LinkedIn: $2500
- YouTube: $1500
- Facebook/Instagram: $500
- Email/SMS: $300
- Video production: $200

---

## 🎯 The Goal

**Month 1:** 50 email captures, 10 free signups, 2 paid conversions
**Month 3:** 500 email captures, 100 free signups, 20 paid conversions
**Month 6:** 2000 email captures, 400 free signups, 100 paid conversions ($5k MRR)

**ROI Target:** 5x ad spend within 90 days

---

**Your data tells stories. Your videos tell them visually. Your targeting puts them in front of the right people.**

**Let's turn those 84,565 contacts into your marketing army.** 🎬❤️‍🔥
