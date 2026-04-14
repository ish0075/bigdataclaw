import React, { useState, useMemo, useEffect } from 'react'
import { 
  UserCircle, Search, MapPin, Phone, Mail, Star, TrendingUp, Award, 
  ChevronRight, Briefcase, Building2, ExternalLink, Linkedin, Globe,
  MessageCircle, ArrowUpRight, Filter, Download, X,
  Database, Check, FileText, Facebook, Instagram, MoreHorizontal, Share2, MessageSquare, ChevronUp
} from 'lucide-react'
import { 
  ONTARIO_REGIONS, 
  getCitiesForRegion, 
  getAllRegions,
  NIAGARA_REGION 
} from '../utils/ontarioRegions'

/**
 * Commercial Agent Matcher
 * Filter by Asset Class, Region, City (Ontario-focused)
 */

// Asset Classes as requested
const ASSET_CLASSES = [
  { id: 'all', label: 'All Asset Classes', color: 'bg-gray-500' },
  { id: 'Industrial', label: 'Industrial', color: 'bg-blue-500' },
  { id: 'Retail', label: 'Retail', color: 'bg-purple-500' },
  { id: 'Office', label: 'Office', color: 'bg-cyan-500' },
  { id: 'Multi-Family', label: 'Multi-Family', color: 'bg-green-500' },
  { id: 'Land', label: 'Land', color: 'bg-amber-500' },
  { id: 'Low-Rise', label: 'Low-Rise', color: 'bg-teal-500' },
  { id: 'Mid-Rise', label: 'Mid-Rise', color: 'bg-indigo-500' },
  { id: 'High-Rise', label: 'High-Rise', color: 'bg-pink-500' },
  { id: 'Commercial-Industrial-Land', label: 'Commercial / Industrial Land', color: 'bg-orange-500' },
  { id: 'Farm', label: 'Farm', color: 'bg-lime-600' },
  { id: 'Mixed-Use', label: 'Mixed-Use', color: 'bg-rose-500' },
  { id: 'Hospitality', label: 'Hospitality', color: 'bg-violet-500' },
  { id: 'Medical', label: 'Medical/Healthcare', color: 'bg-emerald-500' },
  { id: 'Self-Storage', label: 'Self-Storage', color: 'bg-slate-500' },
  { id: 'Data-Center', label: 'Data Center', color: 'bg-red-500' },
  { id: 'Residential', label: 'Residential', color: 'bg-sky-500' }
]

// Sample Ontario CRE Agents (24 agents)
const agentDatabase = [
  { 
    id: '1', 
    firstName: 'Michael', 
    lastName: 'Thompson', 
    name: 'Michael Thompson',
    company: 'Colliers International', 
    specialty: 'Industrial', 
    region: 'Niagara Region', 
    city: 'St. Catharines',
    deals: 45, 
    volume: 125000000, 
    rating: 4.9, 
    email: 'michael.thompson@colliers.com', 
    phone: '905-555-1001',
    mobile: '416-555-1001',
    bio: '15+ years specializing in industrial properties across Niagara region. Expert in warehouse and distribution facilities.',
    title: 'Senior Vice President',
    yearsExperience: 15,
    website: 'colliers.com',
    linkedin: 'michael-thompson-colliers',
    certifications: ['CCIM', 'SIOR'],
    languages: ['English'],
    activeListings: 12
  },
  { 
    id: '2', 
    firstName: 'Sarah', 
    lastName: 'Chen', 
    name: 'Sarah Chen',
    company: 'CBRE', 
    specialty: 'Retail', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 62, 
    volume: 210000000, 
    rating: 4.8, 
    email: 'sarah.chen@cbre.com', 
    phone: '416-555-2002',
    mobile: '647-555-2002',
    bio: 'Expert in retail investments and shopping center transactions. Strong relationships with national retailers.',
    title: 'Executive Vice President',
    yearsExperience: 12,
    website: 'cbre.com',
    linkedin: 'sarah-chen-cbre',
    certifications: ['CCIM'],
    languages: ['English', 'Mandarin'],
    activeListings: 18
  },
  { 
    id: '3', 
    firstName: 'David', 
    lastName: 'Wilson', 
    name: 'David Wilson',
    company: 'Avison Young', 
    specialty: 'Office', 
    region: 'Hamilton', 
    city: 'Hamilton',
    deals: 38, 
    volume: 95000000, 
    rating: 4.7, 
    email: 'david.wilson@avisonyoung.com', 
    phone: '905-555-3003',
    mobile: '289-555-3003',
    bio: 'Specializes in office leasing and investment sales. Deep knowledge of Hamilton commercial market.',
    title: 'Principal',
    yearsExperience: 10,
    website: 'avisonyoung.com',
    linkedin: 'david-wilson-ay',
    certifications: ['MBA'],
    languages: ['English'],
    activeListings: 8
  },
  { 
    id: '4', 
    firstName: 'Jennifer', 
    lastName: 'Park', 
    name: 'Jennifer Park',
    company: 'JLL', 
    specialty: 'Multi-Family', 
    region: 'Niagara Region', 
    city: 'Niagara Falls',
    deals: 28, 
    volume: 78000000, 
    rating: 4.9, 
    email: 'jennifer.park@jll.com', 
    phone: '905-555-4004',
    mobile: '416-555-4004',
    bio: 'Multi-family residential specialist with strong investor network. Focus on apartment buildings 50+ units.',
    title: 'Senior Director',
    yearsExperience: 11,
    website: 'jll.ca',
    linkedin: 'jennifer-park-jll',
    certifications: ['CFA'],
    languages: ['English', 'Korean'],
    activeListings: 6
  },
  { 
    id: '5', 
    firstName: 'Robert', 
    lastName: 'Martinez', 
    name: 'Robert Martinez',
    company: 'Cushman & Wakefield', 
    specialty: 'Land', 
    region: 'Niagara Region', 
    city: 'Welland',
    deals: 52, 
    volume: 145000000, 
    rating: 4.6, 
    email: 'robert.martinez@cushwake.com', 
    phone: '905-555-5005',
    mobile: '905-555-5006',
    bio: 'Land development and agricultural property expert. Specializes in assembly deals and development land.',
    title: 'Managing Director',
    yearsExperience: 18,
    website: 'cushmanwakefield.com',
    linkedin: 'robert-martinez-cw',
    certifications: ['CCIM', 'MAI'],
    languages: ['English', 'Spanish'],
    activeListings: 22
  },
  { 
    id: '6', 
    firstName: 'Amanda', 
    lastName: 'Roberts', 
    name: 'Amanda Roberts',
    company: 'Newmark', 
    specialty: 'Industrial', 
    region: 'Peel Region', 
    city: 'Mississauga',
    deals: 71, 
    volume: 285000000, 
    rating: 4.9, 
    email: 'amanda.roberts@newmark.com', 
    phone: '416-555-6006',
    mobile: '647-555-6006',
    bio: 'Top producer in industrial sales and leasing. 500+ transactions completed.',
    title: 'Executive Managing Director',
    yearsExperience: 20,
    website: 'newmark.com',
    linkedin: 'amanda-roberts-newmark',
    certifications: ['CCIM', 'SIOR'],
    languages: ['English'],
    activeListings: 25
  },
  { 
    id: '7', 
    firstName: 'James', 
    lastName: 'OConnor', 
    name: 'James OConnor',
    company: 'IPA Marcus & Millichap', 
    specialty: 'Retail', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 89, 
    volume: 175000000, 
    rating: 4.8, 
    email: 'james.oconnor@ipamm.com', 
    phone: '416-555-7007',
    mobile: '416-555-7008',
    bio: 'Specializes in single-tenant net lease retail and shopping centers. Strong 1031 exchange expertise.',
    title: 'First Vice President',
    yearsExperience: 14,
    website: 'marcusmillichap.com',
    linkedin: 'james-oconnor-ipa',
    certifications: ['CCIM'],
    languages: ['English'],
    activeListings: 31
  },
  { 
    id: '8', 
    firstName: 'Lisa', 
    lastName: 'Zhang', 
    name: 'Lisa Zhang',
    company: 'Royal LePage Commercial', 
    specialty: 'Office', 
    region: 'York Region', 
    city: 'Markham',
    deals: 34, 
    volume: 120000000, 
    rating: 4.7, 
    email: 'lisa.zhang@rlpcommercial.com', 
    phone: '905-555-8008',
    mobile: '416-555-8008',
    bio: 'Office specialist with focus on Markham and Vaughan markets. Tech tenant representation.',
    title: 'Vice President',
    yearsExperience: 9,
    website: 'rlpcommercial.com',
    linkedin: 'lisa-zhang-rlp',
    certifications: ['MBA'],
    languages: ['English', 'Cantonese', 'Mandarin'],
    activeListings: 9
  },
  { 
    id: '9', 
    firstName: 'Marcus', 
    lastName: 'Johnson', 
    name: 'Marcus Johnson',
    company: 'RE/MAX Commercial', 
    specialty: 'Multi-Family', 
    region: 'Durham Region', 
    city: 'Oshawa',
    deals: 41, 
    volume: 95000000, 
    rating: 4.8, 
    email: 'marcus.johnson@remaxcommercial.com', 
    phone: '905-555-9009',
    mobile: '289-555-9009',
    bio: 'Multi-family expert in Durham market. Specializes in value-add opportunities.',
    title: 'Broker/Owner',
    yearsExperience: 13,
    website: 'remaxcommercial.com',
    linkedin: 'marcus-johnson-remax',
    certifications: ['CCIM'],
    languages: ['English'],
    activeListings: 14
  },
  { 
    id: '10', 
    firstName: 'Rachel', 
    lastName: 'Goldstein', 
    name: 'Rachel Goldstein',
    company: 'Sothebys International Realty', 
    specialty: 'Land', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 23, 
    volume: 195000000, 
    rating: 4.9, 
    email: 'rachel.goldstein@sothebysrealty.com', 
    phone: '416-555-1111',
    mobile: '416-555-1112',
    bio: 'High-end land and development specialist. Focused on Toronto luxury residential development sites.',
    title: 'Senior Vice President',
    yearsExperience: 16,
    website: 'sothebysrealty.com',
    linkedin: 'rachel-goldstein-sir',
    certifications: ['CLHMS'],
    languages: ['English', 'Hebrew'],
    activeListings: 7
  },
  { 
    id: '11', 
    firstName: 'Carlos', 
    lastName: 'Mendez', 
    name: 'Carlos Mendez',
    company: 'Sutton Group', 
    specialty: 'Hospitality', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 31, 
    volume: 85000000, 
    rating: 4.6, 
    email: 'carlos.mendez@sutton.com', 
    phone: '416-555-2222',
    mobile: '647-555-2222',
    bio: 'Hospitality specialist. Hotels, motels, and restaurants. Strong tourism market knowledge.',
    title: 'Broker',
    yearsExperience: 11,
    website: 'sutton.com',
    linkedin: 'carlos-mendez-sutton',
    certifications: ['CHIA'],
    languages: ['English', 'Spanish', 'Portuguese'],
    activeListings: 5
  },
  { 
    id: '12', 
    firstName: 'Emily', 
    lastName: 'Watson', 
    name: 'Emily Watson',
    company: 'Century 21 Commercial', 
    specialty: 'Self-Storage', 
    region: 'Ottawa', 
    city: 'Ottawa',
    deals: 27, 
    volume: 65000000, 
    rating: 4.7, 
    email: 'emily.watson@c21commercial.com', 
    phone: '613-555-3333',
    mobile: '613-555-3334',
    bio: 'Self-storage and mini-warehouse specialist. Expert in Ontario markets.',
    title: 'Sales Representative',
    yearsExperience: 8,
    website: 'c21commercial.com',
    linkedin: 'emily-watson-c21',
    certifications: [],
    languages: ['English', 'French'],
    activeListings: 11
  },
  { 
    id: '13', 
    firstName: 'Daniel', 
    lastName: 'Lee', 
    name: 'Daniel Lee',
    company: 'BentallGreenOak', 
    specialty: 'Office', 
    region: 'Halton Region', 
    city: 'Oakville',
    deals: 44, 
    volume: 320000000, 
    rating: 4.8, 
    email: 'daniel.lee@bgo.com', 
    phone: '905-555-4444',
    mobile: '416-555-4444',
    bio: 'Institutional office leasing and investment sales. Major tenant rep assignments.',
    title: 'Senior Vice President',
    yearsExperience: 15,
    website: 'bentallgreenoak.com',
    linkedin: 'daniel-lee-bgo',
    certifications: ['MBA', 'CFA'],
    languages: ['English', 'Korean'],
    activeListings: 16
  },
  { 
    id: '14', 
    firstName: 'Sophie', 
    lastName: 'Tremblay', 
    name: 'Sophie Tremblay',
    company: 'Devencore', 
    specialty: 'Industrial', 
    region: 'Ottawa', 
    city: 'Ottawa',
    deals: 56, 
    volume: 145000000, 
    rating: 4.9, 
    email: 'sophie.tremblay@devencore.com', 
    phone: '613-555-5555',
    mobile: '613-555-5556',
    bio: 'Eastern Ontario industrial market leader. Bilingual service for local and international clients.',
    title: 'Managing Partner',
    yearsExperience: 17,
    website: 'devencore.com',
    linkedin: 'sophie-tremblay-devencore',
    certifications: ['CCIM'],
    languages: ['English', 'French'],
    activeListings: 20
  },
  { 
    id: '15', 
    firstName: 'Ryan', 
    lastName: 'Anderson', 
    name: 'Ryan Anderson',
    company: 'Ivanhoe Cambridge', 
    specialty: 'Mixed-Use', 
    region: 'Waterloo Region', 
    city: 'Kitchener',
    deals: 19, 
    volume: 280000000, 
    rating: 4.8, 
    email: 'ryan.anderson@ivanhoecambridge.com', 
    phone: '519-555-6666',
    mobile: '226-555-6666',
    bio: 'Mixed-use development and urban retail. Focus on major Canadian cities.',
    title: 'Vice President',
    yearsExperience: 12,
    website: 'ivanhoecambridge.com',
    linkedin: 'ryan-anderson-ic',
    certifications: ['MBA'],
    languages: ['English', 'French'],
    activeListings: 4
  },
  { 
    id: '16', 
    firstName: 'Nicole', 
    lastName: 'Patel', 
    name: 'Nicole Patel',
    company: 'GWL Realty Advisors', 
    specialty: 'Medical', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 33, 
    volume: 110000000, 
    rating: 4.7, 
    email: 'nicole.patel@gwlra.com', 
    phone: '416-555-7777',
    mobile: '647-555-7777',
    bio: 'Healthcare and medical office specialist. MOBs and seniors housing focus.',
    title: 'Vice President',
    yearsExperience: 10,
    website: 'gwlra.com',
    linkedin: 'nicole-patel-gwlra',
    certifications: ['CCIM'],
    languages: ['English', 'Hindi', 'Gujarati'],
    activeListings: 8
  },
  { 
    id: '17', 
    firstName: 'Thomas', 
    lastName: 'Gagnon', 
    name: 'Thomas Gagnon',
    company: 'Cominar', 
    specialty: 'Retail', 
    region: 'Ottawa', 
    city: 'Ottawa',
    deals: 48, 
    volume: 135000000, 
    rating: 4.6, 
    email: 'thomas.gagnon@cominar.com', 
    phone: '613-555-8888',
    mobile: '613-555-8889',
    bio: 'Retail specialist. Shopping centers and strip malls across province.',
    title: 'Director',
    yearsExperience: 14,
    website: 'cominar.com',
    linkedin: 'thomas-gagnon-cominar',
    certifications: [],
    languages: ['English', 'French'],
    activeListings: 17
  },
  { 
    id: '18', 
    firstName: 'Michelle', 
    lastName: 'Kowalski', 
    name: 'Michelle Kowalski',
    company: 'Dream Unlimited', 
    specialty: 'Mixed-Use', 
    region: 'York Region', 
    city: 'Vaughan',
    deals: 26, 
    volume: 195000000, 
    rating: 4.8, 
    email: 'michelle.kowalski@dream.ca', 
    phone: '905-555-9999',
    mobile: '416-555-9999',
    bio: 'Mixed-use and residential development. Transit-oriented development expert.',
    title: 'Senior Vice President',
    yearsExperience: 13,
    website: 'dream.ca',
    linkedin: 'michelle-kowalski-dream',
    certifications: ['MBA'],
    languages: ['English', 'Polish'],
    activeListings: 9
  },
  { 
    id: '19', 
    firstName: 'Kevin', 
    lastName: 'OBrien', 
    name: 'Kevin OBrien',
    company: 'RioCan Real Estate', 
    specialty: 'Retail', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 42, 
    volume: 225000000, 
    rating: 4.7, 
    email: 'kevin.obrien@riocan.com', 
    phone: '416-555-1212',
    mobile: '647-555-1212',
    bio: 'National retail leasing and investment. Grocery-anchored centers specialty.',
    title: 'Vice President',
    yearsExperience: 16,
    website: 'riocan.com',
    linkedin: 'kevin-obrien-riocan',
    certifications: ['CCIM'],
    languages: ['English'],
    activeListings: 13
  },
  { 
    id: '20', 
    firstName: 'Aisha', 
    lastName: 'Hassan', 
    name: 'Aisha Hassan',
    company: 'Morguard', 
    specialty: 'Office', 
    region: 'Peel Region', 
    city: 'Mississauga',
    deals: 37, 
    volume: 165000000, 
    rating: 4.9, 
    email: 'aisha.hassan@morguard.com', 
    phone: '905-555-1313',
    mobile: '416-555-1313',
    bio: 'Office leasing specialist for suburban markets. Mississauga and Brampton focus.',
    title: 'Director, Leasing',
    yearsExperience: 11,
    website: 'morguard.com',
    linkedin: 'aisha-hassan-morguard',
    certifications: ['MBA'],
    languages: ['English', 'Arabic'],
    activeListings: 10
  },
  { 
    id: '21', 
    firstName: 'Steven', 
    lastName: 'McDonald', 
    name: 'Steven McDonald',
    company: 'Northwest Healthcare Properties', 
    specialty: 'Medical', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 29, 
    volume: 88000000, 
    rating: 4.6, 
    email: 'steven.mcdonald@nwhp.com', 
    phone: '416-555-1414',
    mobile: '647-555-1414',
    bio: 'Medical office buildings across Ontario. International healthcare real estate.',
    title: 'Vice President',
    yearsExperience: 12,
    website: 'nwhp.com',
    linkedin: 'steven-mcdonald-nwhp',
    certifications: ['CFA'],
    languages: ['English'],
    activeListings: 7
  },
  { 
    id: '22', 
    firstName: 'Grace', 
    lastName: 'Kim', 
    name: 'Grace Kim',
    company: 'Venture Commercial', 
    specialty: 'Data-Center', 
    region: 'Toronto', 
    city: 'Toronto',
    deals: 15, 
    volume: 450000000, 
    rating: 4.8, 
    email: 'grace.kim@venturecommercial.com', 
    phone: '416-555-1515',
    mobile: '647-555-1515',
    bio: 'Data center and technology real estate specialist. Hyperscale client focus.',
    title: 'Partner',
    yearsExperience: 9,
    website: 'venturecommercial.com',
    linkedin: 'grace-kim-venture',
    certifications: ['PE'],
    languages: ['English', 'Korean'],
    activeListings: 3
  },
  { 
    id: '23', 
    firstName: 'Brian', 
    lastName: 'Taylor', 
    name: 'Brian Taylor',
    company: 'WPT Industrial', 
    specialty: 'Industrial', 
    region: 'Waterloo Region', 
    city: 'Waterloo',
    deals: 51, 
    volume: 195000000, 
    rating: 4.7, 
    email: 'brian.taylor@wptindustrial.com', 
    phone: '519-555-1616',
    mobile: '226-555-1616',
    bio: 'Industrial REIT specialist. Distribution and logistics facilities expert.',
    title: 'Senior Vice President',
    yearsExperience: 19,
    website: 'wptindustrial.com',
    linkedin: 'brian-taylor-wpt',
    certifications: ['CCIM'],
    languages: ['English'],
    activeListings: 15
  },
  { 
    id: '24', 
    firstName: 'Victoria', 
    lastName: 'Rodriguez', 
    name: 'Victoria Rodriguez',
    company: 'Minto Group', 
    specialty: 'Multi-Family', 
    region: 'Ottawa', 
    city: 'Ottawa',
    deals: 35, 
    volume: 75000000, 
    rating: 4.8, 
    email: 'victoria.rodriguez@minto.com', 
    phone: '613-555-1717',
    mobile: '613-555-1718',
    bio: 'Residential development and multi-family investment. Ottawa market leader.',
    title: 'Director',
    yearsExperience: 10,
    website: 'minto.com',
    linkedin: 'victoria-rodriguez-minto',
    certifications: [],
    languages: ['English', 'Spanish'],
    activeListings: 12
  }
]

// Quick Links Generator
const generateQuickLinks = (agent) => {
  const fullName = `${agent.firstName} ${agent.lastName}`
  const searchName = encodeURIComponent(`${fullName} ${agent.company}`)
  const googleSearchName = encodeURIComponent(`${fullName} commercial real estate ${agent.city}`)
  const linkedinName = encodeURIComponent(fullName)
  const cleanPhone = agent.mobile ? agent.mobile.replace(/\D/g, '') : ''
  
  return {
    phone: agent.mobile ? `tel:${agent.mobile}` : `tel:${agent.phone}`,
    email: `mailto:${agent.email}`,
    whatsapp: cleanPhone ? `https://wa.me/${cleanPhone}` : null,
    google: `https://www.google.com/search?q=${googleSearchName}`,
    googleImages: `https://www.google.com/search?q=${googleSearchName}&tbm=isch`,
    linkedin: `https://www.linkedin.com/search/results/people/?keywords=${linkedinName}`,
    linkedinCompany: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(agent.company)}`,
    loopnet: `https://www.loopnet.com/search/commercial-real-estate/${encodeURIComponent(agent.city.toLowerCase())}/brokers`,
    crexi: `https://www.crexi.com/brokers?location=${encodeURIComponent(agent.city)}`,
    company: `https://${agent.website}`,
    facebook: `https://www.facebook.com/search/people?q=${encodeURIComponent(fullName + ' ' + agent.company)}`,
    news: `https://www.google.com/search?q=${searchName}&tbm=nws`
  }
}

// Quick Link Button Component
const QuickLinkButton = ({ href, icon, label, color, fullWidth = false }) => {
  const isMailto = href?.startsWith('mailto:');
  const isTel = href?.startsWith('tel:');
  return (
    <a
      href={href}
      target={isMailto || isTel ? undefined : '_blank'}
      rel={isMailto || isTel ? undefined : 'noopener noreferrer'}
      className={`
        flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-white text-[10px] font-medium
        ${color} hover:opacity-90 transition-opacity whitespace-nowrap
        ${fullWidth ? 'w-full' : 'min-w-0'}
      `}
      title={label}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  );
};

const AgentMatcher = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssetClass, setFilterAssetClass] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [showObsidianExport, setShowObsidianExport] = useState(false)
  const [expandedQuickLinks, setExpandedQuickLinks] = useState({})
  
  // Total agents count from metadata (6,697 available in full dataset)
  const TOTAL_COMMERCIAL_AGENTS = 6697
  
  // Use hardcoded sample data for now (backend API needed for full dataset)
  const agents = agentDatabase
  const loading = false
  const error = null

  // Get unique regions from agents
  const regions = useMemo(() => {
    return [...new Set(agents.map(a => a.region))].sort()
  }, [agents])

  // Get cities based on selected region
  const cities = useMemo(() => {
    let filtered = agents
    if (filterRegion !== 'all') {
      filtered = agents.filter(a => a.region === filterRegion)
    }
    return [...new Set(filtered.map(a => a.city))].sort()
  }, [agents, filterRegion])

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const searchable = `${agent.name} ${agent.company} ${agent.city} ${agent.region} ${agent.specialty}`.toLowerCase()
        if (!searchable.includes(searchLower)) return false
      }
      
      // Asset class filter
      if (filterAssetClass !== 'all' && agent.specialty !== filterAssetClass) return false
      
      // Region filter
      if (filterRegion !== 'all' && agent.region !== filterRegion) return false
      
      // City filter
      if (filterCity !== 'all' && agent.city !== filterCity) return false
      
      return true
    })
  }, [agents, searchQuery, filterAssetClass, filterRegion, filterCity])

  const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
    return `$${(value / 1e3).toFixed(0)}K`
  }

  const toggleQuickLinks = (agentId) => {
    setExpandedQuickLinks(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }))
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ['name', 'company', 'specialty', 'region', 'city', 'email', 'phone', 'deals', 'volume']
    const rows = filteredAgents.map(a => [a.name, a.company, a.specialty, a.region, a.city, a.email, a.phone, a.deals, a.volume])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agents-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Obsidian Export Modal
  const ObsidianExportModal = ({ agents, onClose }) => {
    const [exporting, setExporting] = useState(false)
    const [exported, setExported] = useState(false)
    
    const generateMarkdown = () => {
      const timestamp = new Date().toISOString().split('T')[0]
      let markdown = `---
name: Commercial Agent Directory - Ontario Export
date: ${timestamp}
type: agent-directory
tags: [commercial-agents, ontario, cre, real-estate]
agent_count: ${agents.length}
---

# Commercial Agent Directory - Ontario

*Generated on ${timestamp} from Mission Control NERVE*

## Overview

| Metric | Value |
|--------|-------|
| Total Agents | ${agents.length} |
| Total Volume | ${formatCurrency(agents.reduce((sum, a) => sum + a.volume, 0))} |
| Avg Rating | ${(agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1)} |

## Agent Profiles

`
      
      agents.forEach((agent, index) => {
        const links = generateQuickLinks(agent)
        
        markdown += `### ${index + 1}. ${agent.name}

**${agent.company}** - ${agent.city}, ${agent.region}

| Attribute | Value |
|-----------|-------|
| **Title** | ${agent.title} |
| **Specialty** | #${agent.specialty} |
| **Experience** | ${agent.yearsExperience} years |
| **Deals Closed** | ${agent.deals} |
| **Volume** | ${formatCurrency(agent.volume)} |
| **Rating** | ${agent.rating}/5.0 |
| **Active Listings** | ${agent.activeListings} |

**Bio:** ${agent.bio}

**Certifications:** ${agent.certifications.join(', ') || 'None'}

**Languages:** ${agent.languages.join(', ')}

#### Quick Links

- 📧 [Email](${links.email})
- 📞 [Phone](${links.phone})
- 💼 [LinkedIn](${links.linkedin})
- 🔍 [Google Search](${links.google})
- 🌐 [Company Website](${links.company})

---

`
      })
      
      return markdown
    }
    
    const handleExport = async () => {
      setExporting(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      const markdown = generateMarkdown()
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Commercial-Agents-Ontario-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      setExporting(false)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="card w-full max-w-2xl" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-border-subtle">
            <h3 className="text-xl font-semibold text-text-primary">Export to Obsidian</h3>
          </div>
          <div className="p-5">
            <p className="text-text-secondary mb-4">Export {agents.length} agents to Obsidian markdown format</p>
            <button onClick={handleExport} disabled={exporting} className="btn-primary">
              {exporting ? 'Exporting...' : exported ? 'Exported!' : 'Download Markdown'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-purple-500" />
              Agent Matcher
            </h1>
            <p className="text-slate-400 mt-1">Find the right local agents to co-list, refer, or partner with on any property.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={() => setShowObsidianExport(true)} className="btn-primary flex items-center gap-2">
              <Database className="w-4 h-4" />
              Export to Obsidian
            </button>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>Search 96,000+ Ontario agents and recruiters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>Filter by brokerage, city, and specialization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>Export agent contact cards for partnership outreach</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-text-muted text-sm">Total in Database</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{TOTAL_COMMERCIAL_AGENTS.toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-1">Sample: {agentDatabase.length} agents</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">Filtered</p>
          <p className="text-3xl font-bold text-accent-blue mt-1">{filteredAgents.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">Total Volume</p>
          <p className="text-3xl font-bold text-accent-green mt-1">{formatCurrency(agents.reduce((sum, a) => sum + (a.volume || 0), 0))}</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">Avg Rating</p>
          <p className="text-3xl font-bold text-accent-yellow mt-1">{(agents.reduce((sum, a) => sum + (parseFloat(a.rating) || 4.5), 0) / agents.length).toFixed(1)}</p>
        </div>
      </div>
      
      {/* Asset Class Filter */}
      <div className="card p-4">
        <p className="text-sm font-medium text-text-secondary mb-3">Filter by Asset Class</p>
        <div className="flex flex-wrap gap-2">
          {ASSET_CLASSES.map((assetClass) => (
            <button
              key={assetClass.id}
              onClick={() => setFilterAssetClass(assetClass.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterAssetClass === assetClass.id
                  ? `${assetClass.color} text-white`
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {assetClass.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search & Location Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search agents, companies, cities... (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Trigger search - already reactive, but adds UX feedback
                  setExpandedQuickLinks({})
                }
              }}
              className="w-full pl-10 pr-24 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
            />
            {/* Search Button */}
            <button
              onClick={() => {
                setExpandedQuickLinks({})
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent-blue hover:bg-accent-blue/80 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              Search
            </button>
          </div>
          
          <select 
            value={filterRegion}
            onChange={(e) => {
              setFilterRegion(e.target.value)
              setFilterCity('all')
            }}
            className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm min-w-[150px]"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (<option key={r} value={r}>{r}</option>))}
          </select>
          
          <select 
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm min-w-[150px]"
          >
            <option value="all">All Cities</option>
            {cities.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          
          {(filterAssetClass !== 'all' || filterRegion !== 'all' || filterCity !== 'all' || searchQuery) && (
            <button 
              onClick={() => {
                setFilterAssetClass('all')
                setFilterRegion('all')
                setFilterCity('all')
                setSearchQuery('')
              }}
              className="text-sm text-text-muted hover:text-accent-red flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        
        {/* Active Filters */}
        {(filterAssetClass !== 'all' || filterRegion !== 'all' || filterCity !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
            <span className="text-sm text-text-muted">Active filters:</span>
            {filterAssetClass !== 'all' && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent-red/20 text-accent-red">
                {ASSET_CLASSES.find(a => a.id === filterAssetClass)?.label}
              </span>
            )}
            {filterRegion !== 'all' && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent-blue/20 text-accent-blue">
                {filterRegion}
              </span>
            )}
            {filterCity !== 'all' && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent-green/20 text-accent-green">
                {filterCity}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="card p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center text-xl font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-sm text-text-secondary">{agent.company}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm text-accent-yellow">
                <Star className="w-4 h-4 fill-current" />
                {agent.rating}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full text-white ${ASSET_CLASSES.find(a => a.id === agent.specialty)?.color || 'bg-gray-500'}`}>
                {agent.specialty}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-bg-input text-text-secondary">
                {agent.city}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 rounded bg-bg-input">
                <p className="text-xs text-text-muted">Deals</p>
                <p className="font-semibold text-text-primary">{agent.deals}</p>
              </div>
              <div className="p-2 rounded bg-bg-input">
                <p className="text-xs text-text-muted">Volume</p>
                <p className="font-semibold text-text-primary">{formatCurrency(agent.volume)}</p>
              </div>
              <div className="p-2 rounded bg-bg-input">
                <p className="text-xs text-text-muted">Experience</p>
                <p className="font-semibold text-text-primary">{agent.yearsExperience}y</p>
              </div>
            </div>
            
            <p className="text-sm text-text-muted mb-4 line-clamp-2">{agent.bio}</p>
            
            {/* Primary Quick Links */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(() => {
                const links = generateQuickLinks(agent);
                return (
                  <>
                    <a
                      href={links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors group"
                    >
                      <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                      <span className="text-[10px] text-text-secondary group-hover:text-[#0A66C2]">LI</span>
                    </a>
                    <a
                      href={links.company}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors group"
                    >
                      <Globe className="w-5 h-5 text-purple-500" />
                      <span className="text-[10px] text-text-secondary group-hover:text-purple-400">Web</span>
                    </a>
                    <a
                      href={links.email}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                    >
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="text-[10px] text-text-secondary group-hover:text-blue-400">Email</span>
                    </a>
                    <a
                      href={links.phone}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group"
                    >
                      <Phone className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] text-text-secondary group-hover:text-emerald-400">Call</span>
                    </a>
                  </>
                );
              })()}
            </div>
            
            {/* Expand Quick Links Button */}
            <button
              onClick={() => toggleQuickLinks(agent.id)}
              className="w-full py-2 bg-bg-input/50 hover:bg-bg-input border-t border-border-subtle flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {expandedQuickLinks[agent.id] ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Quick Links
                </>
              ) : (
                <>
                  <MoreHorizontal className="w-4 h-4" />
                  Quick Links
                </>
              )}
            </button>
            
            {/* Expanded Quick Links Section */}
            {expandedQuickLinks[agent.id] && (
              <div className="border-t border-border-subtle bg-bg-input/30 p-4 space-y-4 mt-0">
                {(() => {
                  const links = generateQuickLinks(agent);
                  return (
                    <>
                      {/* Social & Professional */}
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Share2 className="w-3 h-3" />
                          Social & Professional
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <QuickLinkButton 
                            href={links.linkedin} 
                            icon={<Linkedin className="w-3.5 h-3.5" />} 
                            label="LinkedIn"
                            color="bg-[#0A66C2]"
                          />
                          <QuickLinkButton 
                            href={links.facebook} 
                            icon={<Facebook className="w-3.5 h-3.5" />} 
                            label="Facebook"
                            color="bg-[#1877F2]"
                          />
                          <QuickLinkButton 
                            href={links.company} 
                            icon={<Globe className="w-3.5 h-3.5" />} 
                            label="Website"
                            color="bg-purple-500"
                          />
                        </div>
                      </div>
                      
                      {/* CRE Platforms */}
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          CRE Platforms
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <QuickLinkButton 
                            href={links.loopnet} 
                            icon={<Building2 className="w-3.5 h-3.5" />} 
                            label="LoopNet"
                            color="bg-red-600"
                          />
                          <QuickLinkButton 
                            href={links.crexi} 
                            icon={<TrendingUp className="w-3.5 h-3.5" />} 
                            label="Crexi"
                            color="bg-indigo-600"
                          />
                          <QuickLinkButton 
                            href={links.google} 
                            icon={<Search className="w-3.5 h-3.5" />} 
                            label="Google"
                            color="bg-slate-600"
                          />
                        </div>
                      </div>
                      
                      {/* Contact */}
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" />
                          Contact
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <QuickLinkButton 
                            href={links.email} 
                            icon={<Mail className="w-3.5 h-3.5" />} 
                            label="Email"
                            color="bg-blue-500"
                          />
                          <QuickLinkButton 
                            href={links.phone} 
                            icon={<Phone className="w-3.5 h-3.5" />} 
                            label="Call"
                            color="bg-green-500"
                          />
                          {links.whatsapp && (
                            <QuickLinkButton 
                              href={links.whatsapp} 
                              icon={<MessageCircle className="w-3.5 h-3.5" />} 
                              label="WhatsApp"
                              color="bg-green-600"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="card p-12 text-center">
          <UserCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No agents found</h3>
          <p className="text-text-secondary">Try adjusting your filters</p>
        </div>
      )}
      
      {/* Modals */}
      {showObsidianExport && (
        <ObsidianExportModal agents={filteredAgents} onClose={() => setShowObsidianExport(false)} />
      )}
    </div>
  )
}

export default AgentMatcher
