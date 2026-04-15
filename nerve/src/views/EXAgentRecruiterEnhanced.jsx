import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Users, Search, Mail, Phone, Linkedin, MapPin, Building, 
  ChevronDown, ChevronUp, ExternalLink, Activity, Database, 
  WifiOff, RefreshCw, Facebook, Instagram, Globe, MessageCircle,
  MoreHorizontal, X, CheckCircle, Clock, ArrowUpRight, BarChart3,
  MessageSquare, Share2, FileText, Video, Link2, Mic,
  ClipboardPlus, Briefcase, Star, Edit2, LayoutGrid, ArrowUpDown
} from 'lucide-react';
import UniversalEditModal from '../components/Common/UniversalEditModal';
import VoiceInput from '../components/Common/VoiceInput';
import ObsidianClipForm, { mergeAgentWithClips, getObsidianClip } from '../components/Common/ObsidianClipper';
import QuickAddAgent from '../components/ResidentialRecruiter/QuickAddAgent';
import RealtorBotWidget from '../components/RealtorBot/RealtorBotWidget';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud';

const API_ENDPOINTS = {
  recruiters: `${API_BASE}/recruiters`,
  recruiterStats: `${API_BASE}/recruiters/stats`,
  brokerages: `${API_BASE}/brokerages`,
  brokerageStats: `${API_BASE}/brokerages/stats`,
  brokerageCities: `${API_BASE}/brokerages/cities`,
  // New DBeaver endpoints (complete dataset)
  dbeaverBrokerages: `${API_BASE}/dbeaver/brokerages`,
  dbeaverStats: `${API_BASE}/dbeaver/stats`,
  dbeaverCities: `${API_BASE}/dbeaver/cities`,
  search: `${API_BASE}/recruiters/search`,
  filterOptions: `${API_BASE}/recruiters/filter-options`,
  contact: (id) => `${API_BASE}/recruiters/${id}/contact`,
  health: `${API_BASE}/health`,
};

// Ontario Cities
const ONTARIO_CITIES = [
  'All Cities', 'St. Catharines', 'Niagara Falls', 'Welland', 'Thorold', 'Port Colborne',
  'Niagara-on-the-Lake', 'Fort Erie', 'Pelham', 'Lincoln', 'Grimsby', 'West Lincoln', 'Wainfleet',
  'Vaughan', 'Markham', 'Richmond Hill', 'Newmarket', 'Aurora', 
  'Whitchurch-Stouffville', 'King', 'East Gwillimbury', 'Georgina',
  'Mississauga', 'Brampton', 'Caledon',
  'Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
  'Oakville', 'Burlington', 'Milton', 'Halton Hills',
  'Kitchener', 'Waterloo', 'Cambridge', 'Woolwich', 'Wilmot', 'North Dumfries', 'Wellesley',
  'Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York',
  'Hamilton', 'Stoney Creek', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook', 'Mount Hope',
  'Ottawa', 'Kanata', 'Nepean', 'Orleans', 'Barrhaven', 'Stittsville',
  'London', 'Windsor', 'Barrie', 'Guelph', 'Kingston', 'Peterborough', 'Brantford',
  'Sarnia', 'Sault Ste. Marie', 'Sudbury', 'Thunder Bay', 'North Bay',
  'Orillia', 'Midland', 'Penetanguishene', 'Collingwood', 'Wasaga Beach',
  'Innisfil', 'Bradford West Gwillimbury', 'New Tecumseth',
  'Guelph/Eramosa', 'Centre Wellington', 'Fergus', 'Elora', 'Mapleton', 
  'Wellington North', 'Minto', 'Puslinch', 'Erin',
  'Woodstock', 'Stratford', 'Ingersoll', 'Tillsonburg', 'Listowel', 'Strathroy',
  'Chatham', 'Leamington', 'Amherstburg', 'Tecumseh', 'LaSalle',
  'Simcoe', 'Delhi', 'Port Dover', 'Waterford', 'Caledonia', 'Cayuga', 'Dunnville',
  'Orangeville', 'Shelburne', 'Grand Valley', 'Perth', 'Smiths Falls',
  'Carleton Place', 'Brockville', 'Prescott', 'Gananoque', 'Napanee', 'Belleville',
  'Trenton', 'Quinte West', 'Cobourg', 'Port Hope', 'Lindsay', 'Bobcaygeon',
  'Fenelon Falls', 'Picton', 'Wellington', 'Bloomfield', 'Pembroke', 'Renfrew',
  'Arnprior', 'Kemptville', 'Cornwall', 'Alexandria', 'Morrisburg',
  'Hawkesbury', 'L\'Orignal', 'Huntsville', 'Bracebridge', 'Gravenhurst', 'Parry Sound',
  'Temagami', 'Mattawa', 'Sturgeon Falls', 'Espanola', 'Elliot Lake',
  'Blind River', 'Thessalon', 'Wawa', 'White River', 'Marathon', 'Greenstone',
  'Red Lake', 'Dryden', 'Kenora', 'Sioux Lookout', 'Fort Frances', 'Atikokan',
  'Rainy River', 'Emo', 'Manitouwadge', 'Terrace Bay', 'Schreiber', 'Nipigon'
];

// Custom Icons
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// Google "G" Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Known numbered entity to brand name mappings
const BROKERAGE_NAME_MAPPINGS = {
  // Right at Home Realty
  '1000085532 Ontario Inc.': 'Right at Home Realty',
  '1000085532 Ontario Inc': 'Right at Home Realty',
  
  // HomeLife branded brokerages
  'Homelife Miracle Realty Ltd.': 'HomeLife Miracle Realty',
  'Homelife Landmark Realty Inc.': 'HomeLife Landmark Realty',
  'Homelife Silvercity Realty Inc.': 'HomeLife Silvercity Realty',
  'Homelife New World Realty Inc': 'HomeLife New World Realty',
  'Homelife/future Realty Inc.': 'HomeLife/Future Realty',
  'Homelife Galaxy Real Estate Ltd.': 'HomeLife Galaxy Real Estate',
  'Homelife Superstars Real Estate Limited': 'HomeLife Superstars Real Estate',
  'Homelife/cimerman Real Estate Ltd': 'HomeLife/Cimerman Real Estate',
  'Homelife/vision Realty Inc.': 'HomeLife/Vision Realty',
  'Homelife Today Realty Ltd.': 'HomeLife Today Realty',
  'Homelife Local Real Estate Ltd': 'HomeLife Local Real Estate',
  'Homelife Gold Pacific Realty Inc.': 'HomeLife Gold Pacific Realty',
  'Homelife Broadway Realty Inc': 'HomeLife Broadway Realty',
  'Homelife Professionals Realty Inc': 'HomeLife Professionals Realty',
  'Homelife/GTA Realty Inc': 'HomeLife/GTA Realty',
  'Homelife/realty One Ltd.': 'HomeLife/Realty One',
  'Homelife/champions Realty Inc': 'HomeLife/Champions Realty',
  
  // eXp Realty
  'Exp Realty Of Canada Inc': 'eXp Realty of Canada',
  'Exp Realty Of Canada Inc.': 'eXp Realty of Canada',
  
  // iPro Realty
  'Ipro Realty Ltd': 'iPro Realty',
  'Ipro Realty Ltd.': 'iPro Realty',
  
  // RE/MAX brokerages
  'Re/max Real Estate Centre Inc.': 'RE/MAX Real Estate Centre',
  'Re/max Realtron Realty Inc': 'RE/MAX Realtron Realty',
  'Re/max Realtron Realty Inc.': 'RE/MAX Realtron Realty',
  'Re/max Escarpment Realty Inc.': 'RE/MAX Escarpment Realty',
  'Re/max Hallmark Realty Limited': 'RE/MAX Hallmark Realty',
  'Re/max First Realty': 'RE/MAX First Realty',
  'Re/max Unique Inc': 'RE/MAX Unique',
  'Re/max': 'RE/MAX',
  'Re/max West Realty': 'RE/MAX West Realty',
  'Re/max Real Estate Centre': 'RE/MAX Real Estate Centre',
  'Re/max Hallmark Realty': 'RE/MAX Hallmark Realty',
  
  // Royal LePage
  'Royal Lepage Real Estate Services Ltd.': 'Royal LePage Real Estate Services',
  'Royal Lepage Real Estate Services': 'Royal LePage Real Estate Services',
  'Royal Lepage Macro Realty': 'Royal LePage Macro Realty',
  'Royal Lepage Burloak': 'Royal LePage Burloak',
  'Royal Lepage Your Community Realty': 'Royal LePage Your Community Realty',
  'Royal Lepage': 'Royal LePage',
  'Royal Lepage RCR': 'Royal LePage RCR',
  'Royal Lepage Signature Realty': 'Royal LePage Signature Realty',
  'Royal Lepage Terrequity Realty': 'Royal LePage Terrequity Realty',
  'Royal Lepage Real Estate Professionals': 'Royal LePage Real Estate Professionals',
  
  // Century 21
  'Century 21 - Leading Edge Realty Inc.': 'Century 21 Leading Edge Realty',
  'Century 21 People\'s Choice Realty Inc.': 'Century 21 People\'s Choice Realty',
  'Century 21 Percy Fulton Ltd': 'Century 21 Percy Fulton',
  'Century 21 First Canadian Corp': 'Century 21 First Canadian',
  'Century 21 President Realty': 'Century 21 President Realty',
  
  // Other major brands
  'Signature Realty Inc.': 'Signature Realty',
  'Signature Realty Inc': 'Signature Realty',
  'Bay Street Group Inc.': 'Bay Street Group',
  'Forest Hill Real Estate Inc': 'Forest Hill Real Estate',
  'Your Community Realty Inc.': 'Your Community Realty',
  'Zolo Realty (ontario) Inc.': 'Zolo Realty',
  'Zolo Realty': 'Zolo Realty',
  'International Realty Firm Inc.': 'International Realty Firm',
  
  // Coldwell Banker
  'Coldwell Banker Southwest Realty': 'Coldwell Banker Southwest Realty',
  'Coldwell Banker - Peter Benninger Realty': 'Coldwell Banker Peter Benninger Realty',
  'Coldwell Banker Commercial Integrity': 'Coldwell Banker Commercial Integrity',
  
  // Sutton Group
  'Sutton Group-associates Realty Inc.': 'Sutton Group Associates Realty',
  'Sutton Group - Heritage Realty': 'Sutton Group Heritage Realty',
  'Sutton Group - Tower Realty Ltd.': 'Sutton Group Tower Realty',
  'Sutton Group - Ottawa Realty': 'Sutton Group Ottawa Realty',
  
  // Numbered entities with known websites
  '2615267 Ontario Inc.': 'Davenport Realty',
  '2615267 Ontario Inc': 'Davenport Realty',
  '1881384 Ontario Inc.': 'Royal LePage (1881384)',
  '1881384 Ontario Inc': 'Royal LePage (1881384)',
  '2816012 Ontario Inc.': 'Engel & Völkers',
  '2816012 Ontario Inc': 'Engel & Völkers',
  '2540017 Ontario Inc.': 'Power 7 Realty',
  '2540017 Ontario Inc': 'Power 7 Realty',
  '1965128 Ontario Inc.': 'Zumin Real Estate',
  '1965128 Ontario Inc': 'Zumin Real Estate',
  '1906351 Ontario Inc.': 'Keller Williams Complete',
  '1906351 Ontario Inc': 'Keller Williams Complete',
  '2341652 Ontario Limited': 'Keller Williams (2341652)',
  '2716742 Ontario Inc.': 'PropertyZilla',
  '2716742 Ontario Inc': 'PropertyZilla',
  '2819179 Ontario Inc.': 'FFAF Realty',
  '2819179 Ontario Inc': 'FFAF Realty',
  '2734100 Ontario Inc.': '2734100 Realty',
  '2734100 Ontario Inc': '2734100 Realty',
  
  // Keller Williams
  '2150659 Ontario Inc.': 'Keller Williams',
  '1919832 Ontario Inc.': 'Keller Williams',
  '1837915 Ontario Inc.': 'Keller Williams',
  '2773382 Ontario Inc.': 'Keller Williams Legacies',
  
  // Save Max
  '2706375 Ontario Inc.': 'Save Max Realty',
  '1000063733 Ontario Inc.': 'Save Max Realty',
  '1000059635 Ontario Inc.': 'Save Max Pioneer',
  
  // Century 21 numbered
  '2851365 Ontario Inc.': 'Century 21',
  '1927722 Ontario Inc.': 'Century 21',
  '2817145 Ontario Inc.': 'Coldwell Banker',
};

// Clean up brokerage name for display (remove Ontario Inc, numbers, etc.)
const cleanBrokerageName = (name) => {
  if (!name) return 'Independent';
  
  // Check for known mappings first
  if (BROKERAGE_NAME_MAPPINGS[name]) {
    return BROKERAGE_NAME_MAPPINGS[name];
  }
  
  // Remove Ontario Inc, Ontario Inc., and any numbers/suffixes after Inc
  let cleaned = name
    .replace(/\s*Ontario\s+Inc\.?\s*\d*\s*$/i, '')
    .replace(/\s*Inc\.?\s*\d*\s*$/i, '')
    .replace(/\s*Ltd\.?\s*$/i, '')
    .replace(/\s*Limited\s*$/i, '')
    .trim();
  
  // Handle numbered entities that weren't in mappings (e.g., "1234567 Ontario Inc")
  // If it starts with numbers and looks like a numbered corp, show as "Unknown Brokerage"
  if (/^\d+\s+Ontario\s*$/i.test(cleaned) || cleaned === name) {
    // Try to extract just the number part
    const match = name.match(/^(\d+)\s+Ontario/i);
    if (match) {
      return `Brokerage #${match[1]}`;
    }
  }
  
  return cleaned;
};

// Filter out Ontario Inc. brokerages from dropdown
const filterOntarioIncBrokerages = (brokerageList) => {
  if (!brokerageList || !Array.isArray(brokerageList)) return [];
  return brokerageList.filter(name => {
    if (!name || name === 'All Brokerages') return true;
    // Skip brokerages ending with Ontario Inc. pattern
    return !/Ontario\s+Inc\.?\s*\d*$/i.test(name);
  });
};

// Generate Quick Links for an agent
// Uses agent.quickLinks or agent.quick_links from data if available, otherwise generates them
const generateAgentQuickLinks = (agent) => {
  const cleanName = cleanAgentName(agent.name);
  const encodedName = encodeURIComponent(cleanName);
  const encodedBrokerage = encodeURIComponent(agent.brokerage || '');
  const encodedFull = encodeURIComponent(`${cleanName} ${agent.brokerage || ''}`);
  
  // ALWAYS generate links dynamically to ensure consistent format: {name} realtor {platform}
  // This ensures disambiguation for common names across all platforms
  return {
    // Main Links (shown on card) - All use {name} realtor {platform} format for disambiguation
    google: `https://www.google.com/search?q=${encodedName}+realtor`,
    linkedin: `https://www.google.com/search?q=${encodedName}+realtor+linkedin`,
    facebook: `https://www.google.com/search?q=${encodedName}+realtor+facebook`,
    instagram: `https://www.google.com/search?q=${encodedName}+realtor+instagram`,
    realtor: `https://www.google.com/search?q=${encodedName}+realtor+realtor.ca`,
    phone: agent.phone ? `tel:${agent.phone}` : null,
    email: agent.email ? `mailto:${agent.email}` : null,
    
    // Expanded Quick Links - Social platforms
    twitter: `https://www.google.com/search?q=${encodedName}+realtor+twitter`,
    tiktok: `https://www.google.com/search?q=${encodedName}+realtor+tiktok`,
    youtube: `https://www.google.com/search?q=${encodedName}+realtor+youtube`,
    
    // Messaging platforms
    whatsapp: agent.phone ? `https://wa.me/${agent.phone.replace(/\D/g, '')}` : `https://www.google.com/search?q=${encodedName}+realtor+whatsapp`,
    wechat: `https://www.google.com/search?q=${encodedName}+realtor+wechat`,
    messenger: `https://www.google.com/search?q=${encodedName}+realtor+facebook+messenger`,
    
    // Professional links
    linkedin_president: `https://www.google.com/search?q=${encodedBrokerage}+President+OR+CEO+linkedin`,
    cre: `https://www.google.com/search?q=${encodedFull}+commercial+real+estate`,
    homes: `https://www.google.com/search?q=${encodedFull}+homes+for+sale`,
    reviews: `https://www.google.com/search?q=${encodedName}+realtor+reviews`,
    bor: `https://www.google.com/search?q=${encodedBrokerage}+broker+of+record`,
    
    // Contact page search
    contact: `https://www.google.com/search?q=${encodedBrokerage}+contact`,
  };
};

// Check if agent is with EXP Realty
const isExpAgent = (agent) => {
  if (!agent.brokerage) return false;
  const brokerageLower = agent.brokerage.toLowerCase();
  return brokerageLower.includes('exp') || brokerageLower.includes('exprealty');
};

// Clean up agent name (fix ". Name" format)
const cleanAgentName = (name) => {
  if (!name) return 'Unknown';
  // Remove leading ". " if present (data issue where first name is missing)
  return name.replace(/^\.\s*/, '').trim() || 'Unknown';
};

// Agent Card Component - Builder Directory Style
const AgentCard = ({ agent, onQuickLinksToggle, isExpanded, onClip, onEdit }) => {
  // Merge with Obsidian clip data
  const mergedAgent = mergeAgentWithClips(agent);
  const links = generateAgentQuickLinks(mergedAgent);
  const expBadge = isExpAgent(mergedAgent);
  const displayName = cleanAgentName(mergedAgent.name);
  const clipData = getObsidianClip(mergedAgent.id);
  const hasPhone = !!mergedAgent.phone;
  
  // Generate initials for avatar
  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : '??';
  
  // Generate random but consistent color for avatar
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500'];
  const avatarColor = colors[displayName?.length % colors.length] || colors[0];
  
  return (
    <div className={`
      bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden
      transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20
      ${expBadge ? 'opacity-60 grayscale-[0.3]' : ''}
    `}>
      {/* Card Header - Avatar & Basic Info */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`
            w-14 h-14 rounded-xl ${avatarColor} flex items-center justify-center 
            text-white font-bold text-lg shadow-lg flex-shrink-0
          `}>
            {initials}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-200 truncate pr-2">{displayName}</h3>
                <p className="text-sm text-slate-400 truncate">{cleanBrokerageName(agent.brokerage)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit && onEdit(agent)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Edit agent"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {expBadge && (
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full flex-shrink-0">
                    EXP
                  </span>
                )}
              </div>
            </div>
            
            {/* Location & Title */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>{agent.city || 'Ontario'}</span>
              <span>•</span>
              <span>{agent.job_title || 'Agent'}</span>
            </div>
          </div>
        </div>
        
        {/* Stats Row - Builder Style */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm font-medium text-slate-300 capitalize">{agent.status || 'New'}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Contacts</p>
            <p className="text-sm font-medium text-slate-300">{agent.contact_count || 0}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Last</p>
            <p className="text-sm font-medium text-slate-300">
              {agent.last_contacted 
                ? new Date(agent.last_contacted).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
                : 'Never'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Action Buttons - Google Search, LinkedIn, Facebook, Realtor.ca */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {/* Google Search - Primary action */}
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <GoogleIcon />
            <span className="text-[10px] text-slate-400 group-hover:text-white">Google</span>
          </a>
          
          {/* LinkedIn */}
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors group"
          >
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <span className="text-[10px] text-slate-400 group-hover:text-[#0A66C2]">LinkedIn</span>
          </a>
          
          {/* Facebook */}
          <a
            href={links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors group"
          >
            <Facebook className="w-5 h-5 text-[#1877F2]" />
            <span className="text-[10px] text-slate-400 group-hover:text-[#1877F2]">FB</span>
          </a>
          
          {/* Realtor.ca */}
          <a
            href={links.realtor}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 transition-colors group"
          >
            <Globe className="w-5 h-5 text-red-600" />
            <span className="text-[10px] text-slate-400 group-hover:text-red-500">Realtor</span>
          </a>
        </div>
      </div>
      
      {/* Expand Quick Links Button */}
      <button
        onClick={() => onQuickLinksToggle(agent.id)}
        className="w-full py-2 bg-slate-900/30 hover:bg-slate-700/50 border-t border-slate-700/50 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        {isExpanded ? (
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
      {isExpanded && (
        <div className="border-t border-slate-700/50 bg-slate-900/30 p-4 space-y-4">
          {/* Social Media Section */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              Social Media
            </p>
            <div className="grid grid-cols-3 gap-2">
              <QuickLinkButton 
                href={links.facebook} 
                icon={<Facebook className="w-3.5 h-3.5" />} 
                label="Facebook"
                color="bg-[#1877F2]"
              />
              <QuickLinkButton 
                href={links.instagram} 
                icon={<Instagram className="w-3.5 h-3.5" />} 
                label="Instagram"
                color="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <QuickLinkButton 
                href={links.linkedin} 
                icon={<Linkedin className="w-3.5 h-3.5" />} 
                label="LinkedIn"
                color="bg-[#0A66C2]"
              />
              <QuickLinkButton 
                href={links.twitter} 
                icon={<MessageCircle className="w-3.5 h-3.5" />} 
                label="Twitter/X"
                color="bg-slate-700"
              />
              <QuickLinkButton 
                href={links.tiktok} 
                icon={<TikTokIcon />} 
                label="TikTok"
                color="bg-black border border-slate-600"
              />
              <QuickLinkButton 
                href={links.youtube} 
                icon={<Video className="w-3.5 h-3.5" />} 
                label="YouTube"
                color="bg-red-600"
              />
            </div>
          </div>
          
          {/* Messaging Section */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Messaging
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* Call - Phone */}
              {mergedAgent.phone && (
                <QuickLinkButton 
                  href={`tel:${mergedAgent.phone}`} 
                  icon={<Phone className="w-3.5 h-3.5" />} 
                  label="Call"
                  color="bg-emerald-500"
                />
              )}
              
              {/* WhatsApp - Direct link if phone, otherwise search */}
              {mergedAgent.phone ? (
                <QuickLinkButton 
                  href={`https://wa.me/${mergedAgent.phone.replace(/\D/g, '')}`} 
                  icon={<WhatsAppIcon />} 
                  label="WhatsApp"
                  color="bg-green-500"
                />
              ) : (
                <QuickLinkButton 
                  href={`https://www.google.com/search?q=${encodeURIComponent(displayName)}+Realtor+WhatsApp`} 
                  icon={<WhatsAppIcon />} 
                  label="WhatsApp"
                  color="bg-green-500"
                />
              )}
              
              {/* WeChat - Search by name */}
              <QuickLinkButton 
                href={`https://www.google.com/search?q=${encodeURIComponent(displayName)}+Realtor+WeChat`} 
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                } 
                label="WeChat"
                color="bg-green-600"
              />
              
              <QuickLinkButton 
                href={links.messenger} 
                icon={<MessageCircle className="w-3.5 h-3.5" />} 
                label="Messenger"
                color="bg-[#00B2FF]"
              />
              
              {mergedAgent.email && (
                <QuickLinkButton 
                  href={`mailto:${mergedAgent.email}`} 
                  icon={<Mail className="w-3.5 h-3.5" />} 
                  label="Email"
                  color="bg-orange-500"
                />
              )}
              
              <button
                onClick={() => onClip?.(mergedAgent)}
                className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-white text-[10px] font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
              >
                <ClipboardPlus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>
          
          {/* Professional Section */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Building className="w-3 h-3" />
              Professional
            </p>
            <div className="grid grid-cols-3 gap-2">
              <QuickLinkButton 
                href={links.realtor} 
                icon={<Globe className="w-3.5 h-3.5" />} 
                label="Realtor.ca"
                color="bg-red-600"
                fullWidth
              />
              <QuickLinkButton 
                href={links.linkedin_president} 
                icon={<Users className="w-3.5 h-3.5" />} 
                label="Broker CEO"
                color="bg-blue-700"
                fullWidth
              />
              <QuickLinkButton 
                href={links.bor} 
                icon={<Building className="w-3.5 h-3.5" />} 
                label="B.O.R."
                color="bg-amber-600"
                fullWidth
              />
            </div>
          </div>
          
          {/* Search Section */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Search className="w-3 h-3" />
              Search
            </p>
            <div className="grid grid-cols-2 gap-2">
              <QuickLinkButton 
                href={links.google} 
                icon={<Search className="w-3.5 h-3.5" />} 
                label="Google"
                color="bg-slate-600"
                fullWidth
              />
              <QuickLinkButton 
                href={links.contact} 
                icon={<ExternalLink className="w-3.5 h-3.5" />} 
                label="Contact Page"
                color="bg-slate-600"
                fullWidth
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Link Button Component
const QuickLinkButton = ({ href, icon, label, color, fullWidth = false }) => {
  const isMailto = href?.startsWith('mailto:');
  return (
    <a
      href={href}
      target={isMailto ? undefined : '_blank'}
      rel={isMailto ? undefined : 'noopener noreferrer'}
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

// Generate Quick Links for a brokerage
const generateBrokerageQuickLinks = (brokerage) => {
  const encodedName = encodeURIComponent(brokerage.cleanName);
  const encodedFull = encodeURIComponent(brokerage.fullName);
  
  return {
    // Main Links (front card)
    bor: `https://www.google.com/search?q=${encodedName}+broker+of+record`,
    realtor: `https://www.google.com/search?q=${encodedName}+realtor.ca`,
    broker: `https://www.google.com/search?q=${encodedName}+broker`,
    google: `https://www.google.com/search?q=${encodedName}`,
    phone: brokerage.phone ? `tel:${brokerage.phone.replace(/\D/g, '')}` : null,
    
    // Expanded Quick Links
    linkedin: `https://www.google.com/search?q=${encodedName}+linkedin`,
    facebook: `https://www.google.com/search?q=${encodedName}+facebook`,
    instagram: `https://www.google.com/search?q=${encodedName}+instagram`,
    website: `https://www.google.com/search?q=${encodedName}+official+website`,
    
    // Executive search
    president: `https://www.google.com/search?q=${encodedName}+President+OR+CEO+linkedin`,
    careers: `https://www.google.com/search?q=${encodedName}+careers+jobs`,
    
    // Reviews and news
    reviews: `https://www.google.com/search?q=${encodedName}+reviews`,
    news: `https://www.google.com/search?q=${encodedName}+news`,
  };
};

// Brokerage Card Component
const BrokerageCard = ({ brokerage, isExpanded, onToggle }) => {
  const links = generateBrokerageQuickLinks(brokerage);
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-200 truncate">{brokerage.cleanName}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {brokerage.agentCount} agent{brokerage.agentCount !== 1 ? 's' : ''}
              {brokerage.cities.size > 0 && ` • ${Array.from(brokerage.cities).slice(0, 3).join(', ')}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        
        {/* Front Card Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {/* B.O.R Button */}
          <a
            href={links.bor}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Find Broker of Record"
          >
            <span className="font-bold">B.O.R</span>
          </a>
          
          {/* Realtor.ca Button */}
          <a
            href={links.realtor}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-2 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Search on Realtor.ca"
          >
            <span>Realtor</span>
          </a>
          
          {/* Broker Button */}
          <a
            href={links.broker}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-2 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Search Broker"
          >
            <span>Broker</span>
          </a>
          
          {/* Phone or Google Button */}
          {links.phone ? (
            <a
              href={links.phone}
              className="flex items-center justify-center gap-2 px-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-xs font-medium transition-colors"
              title="Call"
            >
              <Phone className="w-4 h-4" />
            </a>
          ) : (
            <a
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors"
              title="Google Search"
            >
              <GoogleIcon />
            </a>
          )}
        </div>
        
        {/* Quick Links Toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center gap-2 w-full mt-3 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 text-xs transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{isExpanded ? 'Less' : 'More'} Quick Links</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Expanded Quick Links */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {/* B.O.R */}
            <QuickLinkButton
              href={links.bor}
              icon={<Building className="w-4 h-4" />}
              label="B.O.R"
              color="bg-purple-600"
            />
            
            {/* Realtor.ca */}
            <QuickLinkButton
              href={links.realtor}
              icon={<Globe className="w-4 h-4" />}
              label="Realtor.ca"
              color="bg-red-600"
            />
            
            {/* Broker */}
            <QuickLinkButton
              href={links.broker}
              icon={<Building className="w-4 h-4" />}
              label="Broker"
              color="bg-amber-600"
            />
            
            {/* Google */}
            <QuickLinkButton
              href={links.google}
              icon={<GoogleIcon />}
              label="Google"
              color="bg-slate-600"
            />
            
            {/* LinkedIn */}
            <QuickLinkButton
              href={links.linkedin}
              icon={<Linkedin className="w-4 h-4" />}
              label="LinkedIn"
              color="bg-blue-700"
            />
            
            {/* Facebook */}
            <QuickLinkButton
              href={links.facebook}
              icon={<Facebook className="w-4 h-4" />}
              label="Facebook"
              color="bg-blue-600"
            />
            
            {/* Instagram */}
            <QuickLinkButton
              href={links.instagram}
              icon={<Instagram className="w-4 h-4" />}
              label="Instagram"
              color="bg-pink-600"
            />
            
            {/* President/CEO */}
            <QuickLinkButton
              href={links.president}
              icon={<Users className="w-4 h-4" />}
              label="President"
              color="bg-amber-600"
            />
            
            {/* Website */}
            <QuickLinkButton
              href={links.website}
              icon={<Globe className="w-4 h-4" />}
              label="Website"
              color="bg-teal-600"
            />
            
            {/* Careers */}
            <QuickLinkButton
              href={links.careers}
              icon={<Briefcase className="w-4 h-4" />}
              label="Careers"
              color="bg-indigo-600"
            />
            
            {/* Reviews */}
            <QuickLinkButton
              href={links.reviews}
              icon={<Star className="w-4 h-4" />}
              label="Reviews"
              color="bg-yellow-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const EXAgentRecruiterEnhanced = ({ initialViewMode = 'agents' }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAgents, setTotalAgents] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [useApi, setUseApi] = useState(true);
  const [jsonMode, setJsonMode] = useState('sample');
  const fullJsonRef = useRef(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0); // Increment to trigger search
  const [selectedBrokerage, setSelectedBrokerage] = useState('All Brokerages');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  
  // Options
  const [brokerages, setBrokerages] = useState(['All Brokerages']);
  const [statuses, setStatuses] = useState(['All Status']);
  const [stats, setStats] = useState(null);
  
  // UI State
  const [activeGroup, setActiveGroup] = useState('brokerage');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedQuickLinks, setExpandedQuickLinks] = useState({});
  const [clipAgent, setClipAgent] = useState(null); // For Obsidian clip modal
  const [viewMode, setViewMode] = useState(initialViewMode); // 'agents' | 'brokerages' | 'brokerageDashboard'
  const [editingAgent, setEditingAgent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Brokerage View State (using DBeaver data)
  const [brokerageData, setBrokerageData] = useState([]);
  const [brokerageLoading, setBrokerageLoading] = useState(false);
  const [brokerageSearch, setBrokerageSearch] = useState('');
  const [brokerageCity, setBrokerageCity] = useState('All Cities');
  const [brokerageSortBy, setBrokerageSortBy] = useState('agents'); // 'agents' | 'name'
  const [brokeragePage, setBrokeragePage] = useState(1);
  const [brokeragePageSize, setBrokeragePageSize] = useState(50); // Default 50 per page
  const [brokerageTotal, setBrokerageTotal] = useState(0);
  const [brokerageStats, setBrokerageStats] = useState(null);
  const [brokerageCities, setBrokerageCities] = useState([]);
  const [useDBeaver, setUseDBeaver] = useState(true); // Use DBeaver data by default

  // Check API health
  useEffect(() => {
    fetch(API_ENDPOINTS.health)
      .then(r => {
        if (!r.ok) throw new Error('API unhealthy');
        return r.json();
      })
      .then(() => {
        setUseApi(true);
        fetch(API_ENDPOINTS.filterOptions)
          .then(r => r.json())
          .then(data => {
            setBrokerages(['All Brokerages', ...filterOntarioIncBrokerages(data.brokerages)]);
            setStatuses(['All Status', ...data.statuses]);
          })
          .catch(console.error);
        
        fetch(API_ENDPOINTS.recruiterStats)
          .then(r => r.json())
          .then(setStats)
          .catch(console.error);
      })
      .catch(() => {
        setUseApi(false);
        fetch('/data/recruiters_meta.json')
          .then(r => r.json())
          .then(data => {
            setBrokerages(['All Brokerages', ...filterOntarioIncBrokerages(data.brokerages || [])]);
            setStatuses(['All Status', 'new', 'contacted', 'engaged', 'converted', 'archived']);
            setStats({
              total: data.total || 0,
              by_city: {},
              by_brokerage: {},
              by_status: { new: data.total || 0 }
            });
          })
          .catch(() => {
            setBrokerages(['All Brokerages']);
            setStatuses(['All Status']);
          });
      });
  }, []);

  // Load brokerage stats and cities on mount (using DBeaver data)
  useEffect(() => {
    // Load DBeaver brokerage stats
    fetch(API_ENDPOINTS.dbeaverStats)
      .then(r => r.json())
      .then(setBrokerageStats)
      .catch(console.error);
    
    // Load DBeaver brokerage cities
    fetch(API_ENDPOINTS.dbeaverCities)
      .then(r => r.json())
      .then(data => setBrokerageCities(data.cities || []))
      .catch(console.error);
  }, []);

  // Load brokerages when filters change (using DBeaver data)
  useEffect(() => {
    if (viewMode !== 'brokerages') return;
    
    setBrokerageLoading(true);
    
    const params = new URLSearchParams({
      page: brokeragePage.toString(),
      limit: brokeragePageSize.toString(),
      sort_by: brokerageSortBy,
    });
    
    if (brokerageSearch) params.append('search', brokerageSearch);
    if (brokerageCity !== 'All Cities') params.append('city', brokerageCity);
    
    // Use DBeaver endpoint for complete data
    fetch(`${API_ENDPOINTS.dbeaverBrokerages}?${params}`)
      .then(r => r.json())
      .then(data => {
        setBrokerageData(data.brokerages || []);
        setBrokerageTotal(data.total || 0);
        setBrokerageLoading(false);
      })
      .catch(err => {
        console.error('Error loading brokerages:', err);
        setBrokerageLoading(false);
      });
  }, [viewMode, brokeragePage, brokeragePageSize, brokerageSearch, brokerageCity, brokerageSortBy]);

  // Build effective search query (name/brokerage/email search only)
  const effectiveSearch = useMemo(() => {
    return searchQuery.trim();
  }, [searchQuery]);

  // Filter function
  const filterJsonData = useCallback((data) => {
    let results = [...data];
    
    // Exclude specific agent(s) - only those with single name "Sunny" (no last name)
    results = results.filter(agent => {
      const name = cleanAgentName(agent.name).trim();
      const nameParts = name.split(/\s+/);
      // Exclude if name is exactly "Sunny" (one word, case insensitive)
      return !(nameParts.length === 1 && nameParts[0].toLowerCase() === 'sunny');
    });
    
    if (effectiveSearch) {
      const searchLower = effectiveSearch.toLowerCase();
      results = results.filter(agent => 
        (agent.name && agent.name.toLowerCase().includes(searchLower)) ||
        (agent.brokerage && agent.brokerage.toLowerCase().includes(searchLower)) ||
        (agent.email && agent.email.toLowerCase().includes(searchLower)) ||
        (agent.city && agent.city.toLowerCase().includes(searchLower)) ||
        (agent.phone && agent.phone.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedBrokerage !== 'All Brokerages') {
      results = results.filter(agent => agent.brokerage === selectedBrokerage);
    }
    
    if (selectedStatus !== 'All Status') {
      results = results.filter(agent => agent.status === selectedStatus);
    }
    
    if (selectedCity !== 'All Cities') {
      results = results.filter(agent => 
        agent.city && agent.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    
    // Sort: Non-EXP agents first, EXP agents last
    results.sort((a, b) => {
      const aIsExp = isExpAgent(a);
      const bIsExp = isExpAgent(b);
      if (aIsExp && !bIsExp) return 1;
      if (!aIsExp && bIsExp) return -1;
      return 0;
    });
    
    return results;
  }, [effectiveSearch, selectedBrokerage, selectedStatus, selectedCity]);

  // Load recruiters
  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      if (useApi) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });
        
        if (effectiveSearch) params.append('search', effectiveSearch);
        if (selectedBrokerage !== 'All Brokerages') params.append('brokerage', selectedBrokerage);
        if (selectedStatus !== 'All Status') params.append('status', selectedStatus);
        if (selectedCity !== 'All Cities') params.append('city', selectedCity);
        
        try {
          const r = await fetch(`${API_ENDPOINTS.recruiters}?${params}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const data = await r.json();
          if (!cancelled) {
            let recruiters = data.recruiters || [];
            // Filter out excluded agents - only those with single name "Sunny" (no last name)
            recruiters = recruiters.filter(agent => {
              const name = cleanAgentName(agent.name).trim();
              const nameParts = name.split(/\s+/);
              return !(nameParts.length === 1 && nameParts[0].toLowerCase() === 'sunny');
            });
            // Sort: Non-EXP agents first
            recruiters.sort((a, b) => {
              const aIsExp = isExpAgent(a);
              const bIsExp = isExpAgent(b);
              if (aIsExp && !bIsExp) return 1;
              if (!aIsExp && bIsExp) return -1;
              return 0;
            });
            setAgents(recruiters);
            setTotalAgents(data.total || 0);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error loading agents from API:', err);
          if (!cancelled) {
            setUseApi(false);
            setLoading(false);
          }
        }
      } else {
        const jsonUrl = jsonMode === 'sample' ? '/data/recruiters_sample.json' : '/data/recruiters_full.json';
        
        try {
          let data;
          if (jsonMode === 'full' && fullJsonRef.current) {
            data = fullJsonRef.current;
          } else {
            const r = await fetch(jsonUrl);
            if (!r.ok) throw new Error('Failed to load recruiter data');
            data = await r.json();
            if (jsonMode === 'full') {
              fullJsonRef.current = data;
            }
          }
          
          const filtered = filterJsonData(data);
          const total = filtered.length;
          const startIdx = (page - 1) * pageSize;
          const paginated = filtered.slice(startIdx, startIdx + pageSize);
          
          if (!cancelled) {
            setAgents(paginated);
            setTotalAgents(total);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error loading agents:', err);
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => { cancelled = true; };
  }, [page, pageSize, effectiveSearch, selectedBrokerage, selectedStatus, selectedCity, useApi, jsonMode, filterJsonData, searchTrigger]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setExpandedQuickLinks({}); // Collapse all quick links on filter change
  }, [searchQuery, selectedBrokerage, selectedCity, selectedStatus, jsonMode]);

  // Reset brokerage page when brokerage filters change
  useEffect(() => {
    setBrokeragePage(1);
  }, [brokerageSearch, brokerageCity, brokerageSortBy]);

  // Group agents
  const groupedAgents = useMemo(() => {
    const groups = {};
    
    agents.forEach(agent => {
      let key;
      switch (activeGroup) {
        case 'brokerage':
          key = agent.brokerage || 'Unknown Brokerage';
          break;
        case 'city':
          key = agent.city || 'Unknown City';
          break;
        case 'status':
          key = agent.status || 'new';
          break;
        default:
          key = 'All Agents';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(agent);
    });
    
    // Sort groups: non-EXP first, then EXP last; within each, sort by count descending
    return Object.entries(groups).sort((a, b) => {
      const aIsExp = a[0].toLowerCase().includes('exp');
      const bIsExp = b[0].toLowerCase().includes('exp');
      if (aIsExp && !bIsExp) return 1;
      if (!aIsExp && bIsExp) return -1;
      return b[1].length - a[1].length;
    });
  }, [agents, activeGroup]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleQuickLinks = (agentId) => {
    setExpandedQuickLinks(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const handleClip = (agent) => {
    setClipAgent(agent);
  };

  const handleClipSave = (updatedAgent) => {
    // Refresh the agents list to show updated data
    setAgents(prev => prev.map(a => 
      a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a
    ));
    setClipAgent(null);
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (updatedAgent) => {
    // Update agents list
    setAgents(prev => prev.map(a => 
      a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a
    ));
    
    // Save to localStorage
    const savedEdits = localStorage.getItem('agent_edits') || '{}';
    const edits = JSON.parse(savedEdits);
    edits[updatedAgent.id] = updatedAgent;
    localStorage.setItem('agent_edits', JSON.stringify(edits));
    
    setIsEditModalOpen(false);
    setEditingAgent(null);
  };

  const handleLoadFullJson = () => {
    setJsonMode('full');
    setLoading(true);
  };

  const handleLoadSampleJson = () => {
    setJsonMode('sample');
    fullJsonRef.current = null;
    setLoading(true);
  };

  const totalPages = Math.ceil(totalAgents / pageSize);
  const brokerageTotalPages = Math.ceil(brokerageTotal / brokeragePageSize);

  if (loading && agents.length === 0 && viewMode !== 'brokerages') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading {totalAgents > 0 ? totalAgents.toLocaleString() : ''} agents...</p>
        </div>
      </div>
    );
  }

  if (error && agents.length === 0 && viewMode !== 'brokerages') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load agents</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              EXP Agent Recruiter
            </h1>
            <p className="text-slate-400 mt-1">Search and recruit top-performing Ontario agents from a database of 96,000+ registrants.</p>
          </div>
          <div className="flex items-center gap-2">
            {!useApi && viewMode === 'agents' && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={handleLoadSampleJson}
                  disabled={jsonMode === 'sample'}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    jsonMode === 'sample' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Sample (500)
                </button>
                <button
                  onClick={handleLoadFullJson}
                  disabled={jsonMode === 'full'}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    jsonMode === 'full' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  96,265 Realtors Ontario</button>
              </div>
            )}
            {/* Quick Add New Agents Button */}
            <QuickAddAgent
              onSaveToObsidian={(name, content) => {
                console.log("Saving to Obsidian:", name);
                fetch("/api/obsidian/quick-link", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `Agents/New/${name}`,
                    content: content,
                    folder: "Agents/New"
                  })
                });
              }}
            />
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>Search by name, brokerage, city, or board</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>View agent stats, contact info, and LinkedIn quick-links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>Track recruitment pipeline and outreach history</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Panel - Agents View */}
      {viewMode === 'agents' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">96,265 Realtors Ontario</p>
                <p className="text-slate-400 text-sm">Total Agents</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {brokerageStats?.total_brokerages?.toLocaleString() || '3,884'}
                </p>
                <p className="text-slate-400 text-sm">Brokerages</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats?.by_status?.contacted || 0}</p>
                <p className="text-slate-400 text-sm">Contacted</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(stats?.by_city || {}).length || 1}</p>
                <p className="text-slate-400 text-sm">Cities</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Panel - Brokerages View - Always show with fallback values */}
      {viewMode === 'brokerages' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {brokerageStats?.total_brokerages?.toLocaleString() || '3,884'}
                </p>
                <p className="text-slate-400 text-sm">Total Brokerages</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {brokerageStats?.total_agents?.toLocaleString() || '95,891'}
                </p>
                <p className="text-slate-400 text-sm">Total Agents</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {brokerageStats?.by_city ? Object.keys(brokerageStats.by_city).length : '100+'}
                </p>
                <p className="text-slate-400 text-sm">Cities</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {brokerageStats?.total_brokerages && brokerageStats?.total_agents
                    ? Math.round(brokerageStats.total_agents / brokerageStats.total_brokerages)
                    : 25
                  }
                </p>
                <p className="text-slate-400 text-sm">Avg Agents/Brokerage</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brokerage Stats Dashboard - Top 10 & Cities (DBeaver Data) */}
      {viewMode === 'brokerages' && brokerageStats && (
        <div className="space-y-4">

          {/* Top Brokerages */}
          {brokerageStats.top_brokerages && brokerageStats.top_brokerages.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Top 10 Brokerages by Agent Count
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {brokerageStats.top_brokerages.map((b, idx) => (
                  <div key={b.name} className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-slate-500">{b.agent_count.toLocaleString()} agents</span>
                    </div>
                    <p className="text-sm text-slate-300 truncate" title={b.name}>
                      {cleanBrokerageName(b.name)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brokerages by City */}
          {brokerageStats.by_city && Object.keys(brokerageStats.by_city).length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Brokerages by City (Top 20)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {Object.entries(brokerageStats.by_city).slice(0, 20).map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => {
                      setBrokerageCity(city);
                      setBrokeragePage(1);
                    }}
                    className="flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <span className="text-sm text-slate-300 truncate">{city}</span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filters - Agents View */}
      {viewMode === 'agents' && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar - Full Width with Normal Size */}
            <div className="relative flex-1 min-w-0 lg:min-w-[500px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by agent name, brokerage, city, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    setExpandedQuickLinks({});
                    // Trigger search by incrementing searchTrigger
                    setSearchTrigger(prev => prev + 1);
                  }
                }}
                className="w-full pl-11 pr-32 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-base placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {/* Search Button */}
                <button
                  onClick={() => {
                    setPage(1);
                    setExpandedQuickLinks({});
                    // Trigger search by incrementing searchTrigger
                    setSearchTrigger(prev => prev + 1);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                {/* Voice Search Button */}
                <VoiceInput
                  onResult={(text) => {
                    setSearchQuery(text);
                    setPage(1);
                    setExpandedQuickLinks({});
                  }}
                  size="md"
                  placeholder="Say: Find agents in Toronto..."
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedBrokerage}
                onChange={(e) => setSelectedBrokerage(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {brokerages.map(b => (
                  <option key={b} value={b}>
                    {b === 'All Brokerages' ? b : cleanBrokerageName(b)}
                  </option>
                ))}
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {ONTARIO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Brokerages Search & Filters - Enhanced Style */}
      {viewMode === 'brokerages' && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search brokerages by name, city... (or use voice 🎤)"
                value={brokerageSearch}
                onChange={(e) => setBrokerageSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setBrokeragePage(1);
                  }
                }}
                className="w-full pl-10 pr-28 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Search Button */}
                <button
                  onClick={() => {
                    setBrokeragePage(1);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </button>
                {/* Voice Search Button */}
                <VoiceInput
                  onResult={(text) => {
                    setBrokerageSearch(text);
                    setBrokeragePage(1);
                  }}
                  size="sm"
                  placeholder="Say: Find brokerages in Toronto..."
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={brokerageCity}
                onChange={(e) => {
                  setBrokerageCity(e.target.value);
                  setBrokeragePage(1);
                }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All Cities">All Cities</option>
                {brokerageCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              
              <select
                value={brokerageSortBy}
                onChange={(e) => setBrokerageSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 flex items-center gap-2"
              >
                <option value="agents">Sort by: Agent Count</option>
                <option value="name">Sort by: Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View Mode & Group By Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Main View Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-fit">
            <button
              onClick={() => setViewMode('agents')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'agents'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setViewMode('brokerages')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'brokerages'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Brokerages
            </button>
          </div>
          
          {/* Group By (only in agents mode) */}
          {viewMode === 'agents' && (
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-fit">
              {['brokerage', 'city', 'status'].map(group => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeGroup === group
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  By {group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Voice Commands Hint */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mic className="w-3 h-3" />
          {viewMode === 'agents' ? (
            <span>Voice: "Find agents in [city]" • "Show [brokerage]" • "Filter contacted"</span>
          ) : (
            <span>Voice: "Find brokerages in [city]" • "Search [brokerage name]"</span>
          )}
        </div>
      </div>

      {/* Results Count & Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          {viewMode === 'agents' ? (
            <>Sample {agents.length.toLocaleString()} of 96,265
            {effectiveSearch && <span className="text-blue-400 ml-2">"{effectiveSearch}"</span>}</>
          ) : (
            <>
              Showing {brokerageData.length.toLocaleString()} of {brokerageTotal.toLocaleString()} brokerages
              {brokerageSearch && <span className="text-blue-400 ml-2">"{brokerageSearch}"</span>}
              {brokerageCity !== 'All Cities' && <span className="text-emerald-400 ml-2">in {brokerageCity}</span>}
            </>
          )}
        </p>
        
        {/* Pagination */}
        <div className="flex items-center gap-2">
          {viewMode === 'agents' ? (
            <>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 px-2">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 text-sm border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value={25}>25/page</option>
                <option value={50}>50/page</option>
                <option value={100}>100/page</option>
              </select>
            </>
          ) : (
            <>
              <button
                onClick={() => setBrokeragePage(p => Math.max(1, p - 1))}
                disabled={brokeragePage === 1}
                className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 px-2">
                Page {brokeragePage} of {brokerageTotalPages || 1}
              </span>
              <button
                onClick={() => setBrokeragePage(p => Math.min(brokerageTotalPages || 1, p + 1))}
                disabled={brokeragePage >= brokerageTotalPages}
                className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-50 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
              <select
                value={brokeragePageSize}
                onChange={(e) => setBrokeragePageSize(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 text-sm border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value={25}>25/page</option>
                <option value={50}>50/page</option>
                <option value={100}>100/page</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Brokerages Loading */}
      {viewMode === 'brokerages' && brokerageLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400">Loading brokerages...</p>
          </div>
        </div>
      )}

      {/* Brokerages Grid */}
      {viewMode === 'brokerages' && !brokerageLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brokerageData.map((brokerage) => (
            <div 
              key={brokerage.name}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors"
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-200 truncate">{brokerage.clean_name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {brokerage.agent_count.toLocaleString()} agent{brokerage.agent_count !== 1 ? 's' : ''}
                    </p>
                    {brokerage.cities && brokerage.cities.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{brokerage.cities.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(brokerage.clean_name)}+broker+of+record`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-2 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    B.O.R
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(brokerage.clean_name)}+realtor.ca`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    Realtor
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(brokerage.clean_name)}+broker`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-2 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    Broker
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(brokerage.clean_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent Groups */}
      {viewMode === 'agents' && (
      <div className="space-y-4">
        {groupedAgents.map(([groupName, groupAgents]) => {
          const expanded = expandedGroups[groupName] !== false;
          const expCount = groupAgents.filter(isExpAgent).length;
          
          return (
            <div key={groupName} className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-4 py-3 bg-slate-800/50 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {activeGroup === 'brokerage' && <Building className="w-5 h-5 text-blue-400" />}
                  {activeGroup === 'city' && <MapPin className="w-5 h-5 text-emerald-400" />}
                  {activeGroup === 'status' && <Activity className="w-5 h-5 text-amber-400" />}
                  <span className="font-semibold text-slate-200">{groupName}</span>
                  <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">
                    {groupAgents.length}
                  </span>
                  {expCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded-full text-xs text-slate-400">
                      {expCount} EXP
                    </span>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {/* Group Content - Agent Cards Grid */}
              {expanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupAgents.map(agent => (
                      <AgentCard 
                        key={agent.id} 
                        agent={agent} 
                        onQuickLinksToggle={toggleQuickLinks}
                        isExpanded={expandedQuickLinks[agent.id]}
                        onClip={handleClip}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
      
      {/* Empty State for Agents */}
      {viewMode === 'agents' && groupedAgents.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400">No agents found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Empty State for Brokerages */}
      {viewMode === 'brokerages' && !brokerageLoading && brokerageData.length === 0 && (
        <div className="text-center py-16">
          <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400">No brokerages found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Obsidian Clip Modal */}
      {clipAgent && (
        <ObsidianClipForm
          agent={clipAgent}
          onSave={handleClipSave}
          onClose={() => setClipAgent(null)}
        />
      )}

      {/* Edit Agent Modal */}
      <UniversalEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleEditSave}
        entity={editingAgent}
        entityType="agent"
        title="Edit Agent"
      />
      
      {/* Realtor Bot Assistant */}
      <RealtorBotWidget context="exp-agent-recruiter" />
    </div>
  );
};

export default EXAgentRecruiterEnhanced;
