/**
 * Ontario Municipalities Structure
 * Based on AMO (Association of Municipalities of Ontario)
 * https://www.amo.on.ca/about-us/municipal-101/ontario-municipalities
 */

// Niagara Region Municipalities
export const NIAGARA_REGION = {
  name: 'Niagara Region',
  type: 'regional',
  cities: [
    'St. Catharines',
    'Niagara Falls',
    'Welland',
    'Thorold',
    'Port Colborne',
    'Niagara-on-the-Lake',
    'Fort Erie',
    'Pelham',
    'Lincoln',
    'Grimsby',
    'West Lincoln',
    'Wainfleet'
  ]
}

// All Ontario Regions
export const ONTARIO_REGIONS = {
  'Niagara Region': NIAGARA_REGION,
  
  'York Region': {
    name: 'York Region',
    type: 'regional',
    cities: ['Vaughan', 'Markham', 'Richmond Hill', 'Newmarket', 'Aurora', 'Whitchurch-Stouffville', 'King', 'East Gwillimbury', 'Georgina']
  },
  
  'Peel Region': {
    name: 'Peel Region',
    type: 'regional',
    cities: ['Mississauga', 'Brampton', 'Caledon']
  },
  
  'Durham Region': {
    name: 'Durham Region',
    type: 'regional',
    cities: ['Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington', 'Uxbridge', 'Scugog', 'Brock']
  },
  
  'Halton Region': {
    name: 'Halton Region',
    type: 'regional',
    cities: ['Oakville', 'Burlington', 'Milton', 'Halton Hills']
  },
  
  'Waterloo Region': {
    name: 'Waterloo Region',
    type: 'regional',
    cities: ['Kitchener', 'Waterloo', 'Cambridge', 'Woolwich', 'Wilmot', 'North Dumfries', 'Wellesley']
  },
  
  'Toronto': {
    name: 'Toronto',
    type: 'single-tier',
    cities: ['Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York']
  },
  
  'Ottawa': {
    name: 'Ottawa',
    type: 'single-tier',
    cities: ['Ottawa', 'Kanata', 'Nepean', 'Orleans', 'Barrhaven', 'Stittsville', 'Manor Park', 'Rockcliffe Park']
  },
  
  'Hamilton': {
    name: 'Hamilton',
    type: 'single-tier',
    cities: ['Hamilton', 'Stoney Creek', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook', 'Mount Hope']
  },
  
  'London': {
    name: 'London',
    type: 'single-tier',
    cities: ['London']
  },
  
  'Windsor': {
    name: 'Windsor',
    type: 'single-tier',
    cities: ['Windsor', 'LaSalle', 'Tecumseh']
  },
  
  'Greater Sudbury': {
    name: 'Greater Sudbury',
    type: 'single-tier',
    cities: ['Sudbury', 'Greater Sudbury', 'Lively', 'Copper Cliff', 'Coniston']
  },
  
  'Thunder Bay': {
    name: 'Thunder Bay',
    type: 'single-tier',
    cities: ['Thunder Bay']
  },
  
  'Kingston': {
    name: 'Kingston',
    type: 'single-tier',
    cities: ['Kingston']
  },
  
  'Barrie': {
    name: 'Barrie',
    type: 'single-tier',
    cities: ['Barrie']
  },
  
  'Guelph': {
    name: 'Guelph',
    type: 'single-tier',
    cities: ['Guelph']
  },
  
  'Peterborough': {
    name: 'Peterborough',
    type: 'single-tier',
    cities: ['Peterborough']
  },
  
  'Brantford': {
    name: 'Brantford',
    type: 'single-tier',
    cities: ['Brantford']
  },
  
  'Sarnia': {
    name: 'Sarnia',
    type: 'single-tier',
    cities: ['Sarnia', 'Point Edward']
  },
  
  'Sault Ste. Marie': {
    name: 'Sault Ste. Marie',
    type: 'single-tier',
    cities: ['Sault Ste. Marie']
  },
  
  'Stratford': {
    name: 'Stratford',
    type: 'single-tier',
    cities: ['Stratford', 'St. Marys']
  },
  
  'Kawartha Lakes': {
    name: 'Kawartha Lakes',
    type: 'single-tier',
    cities: ['Lindsay', 'Bobcaygeon', 'Fenelon Falls']
  },
  
  'Norfolk County': {
    name: 'Norfolk County',
    type: 'single-tier',
    cities: ['Simcoe', 'Delhi', 'Port Dover', 'Waterford']
  },
  
  'Haldimand County': {
    name: 'Haldimand County',
    type: 'single-tier',
    cities: ['Caledonia', 'Cayuga', 'Dunnville', 'Hagersville']
  },
  
  'Chatham-Kent': {
    name: 'Chatham-Kent',
    type: 'single-tier',
    cities: ['Chatham', 'Wallaceburg', 'Tilbury', 'Blenheim', 'Ridgetown']
  },
  
  'Simcoe County': {
    name: 'Simcoe County',
    type: 'county',
    cities: ['Barrie', 'Orillia', 'Midland', 'Penetanguishene', 'Collingwood', 'Wasaga Beach', 'Innisfil', 'Bradford West Gwillimbury', 'New Tecumseth']
  },
  
  'Wellington County': {
    name: 'Wellington County',
    type: 'county',
    cities: ['Guelph/Eramosa', 'Centre Wellington', 'Fergus', 'Elora', 'Mapleton', 'Wellington North', 'Minto', 'Puslinch', 'Erin']
  },
  
  'Middlesex County': {
    name: 'Middlesex County',
    type: 'county',
    cities: ['London', 'Strathroy-Caradoc', 'Middlesex Centre', 'North Middlesex', 'Southwest Middlesex', 'Adelaide Metcalfe', 'Lucan Biddulph']
  },
  
  'Oxford County': {
    name: 'Oxford County',
    type: 'county',
    cities: ['Woodstock', 'Tillsonburg', 'Ingersoll', 'Zorra', 'East Zorra-Tavistock', 'South-West Oxford', 'Blenheim', 'Norwich']
  },
  
  'Elgin County': {
    name: 'Elgin County',
    type: 'county',
    cities: ['St. Thomas', 'Aylmer', 'Port Stanley', 'Belmont', 'Dutton/Dunwich', 'Malahide', 'Southwold', 'West Elgin', 'Bayham', 'Central Elgin']
  },
  
  'Grey County': {
    name: 'Grey County',
    type: 'county',
    cities: ['Owen Sound', 'Hanover', 'Meaford', 'The Blue Mountains', 'Grey Highlands', 'West Grey', 'Chatsworth', 'Southgate']
  },
  
  'Bruce County': {
    name: 'Bruce County',
    type: 'county',
    cities: ['Southampton', 'Port Elgin', 'Kincardine', 'Walkerton', 'Chesley', 'Paisley', 'Teeswater', 'Lions Head', 'Tobermory', 'Arran-Elderslie', 'Brockton', 'Huron-Kinloss', 'Northern Bruce Peninsula', 'South Bruce', 'Saugeen Shores', 'South Bruce Peninsula']
  },
  
  'Huron County': {
    name: 'Huron County',
    type: 'county',
    cities: ['Goderich', 'Clinton', 'Seaforth', 'Exeter', 'Wingham', 'Blyth', 'Zurich', 'Ashfield-Colborne-Wawanosh', 'Bluewater', 'Central Huron', 'Howick', 'Huron East', 'Morris-Turnberry', 'North Huron', 'South Huron']
  },
  
  'Perth County': {
    name: 'Perth County',
    type: 'county',
    cities: ['Stratford', 'St. Marys', 'Listowel', 'Milverton', 'Mitchell', 'North Perth', 'Perth East', 'Perth South', 'West Perth']
  },
  
  'Dufferin County': {
    name: 'Dufferin County',
    type: 'county',
    cities: ['Orangeville', 'Shelburne', 'Grand Valley', 'Mono', 'Amaranth', 'East Garafraxa', 'Melancthon', 'Mulmur']
  },
  
  'Lanark County': {
    name: 'Lanark County',
    type: 'county',
    cities: ['Perth', 'Smiths Falls', 'Carleton Place', 'Mississippi Mills', 'Almonte', 'Beckwith', 'Drummond/North Elmsley', 'Lanark Highlands', 'Montague', 'Tay Valley']
  },
  
  'Leeds and Grenville': {
    name: 'Leeds and Grenville',
    type: 'united-counties',
    cities: ['Brockville', 'Prescott', 'Gananoque', 'Athens', 'Augusta', 'Edwardsburgh/Cardinal', 'Elizabethtown-Kitley', 'Front of Yonge', 'Leeds and the Thousand Islands', 'Merrickville-Wolford', 'North Grenville', 'Rideau Lakes', 'Westport']
  },
  
  'Lennox and Addington': {
    name: 'Lennox and Addington',
    type: 'county',
    cities: ['Napanee', 'Greater Napanee', 'Addington Highlands', 'Loyalist', 'Stone Mills']
  },
  
  'Frontenac County': {
    name: 'Frontenac County',
    type: 'county',
    cities: ['Kingston', 'Frontenac Islands', 'North Frontenac', 'Central Frontenac', 'South Frontenac']
  },
  
  'Hastings County': {
    name: 'Hastings County',
    type: 'county',
    cities: ['Belleville', 'Quinte West', 'Bancroft', 'Deseronto', 'Carlow/Mayo', 'Faraday', 'Hastings Highlands', 'Limerick', 'Madoc', 'Marmora and Lake', 'Stirling-Rawdon', 'Tudor and Cashel', 'Tweed', 'Tyendinaga', 'Wollaston']
  },
  
  'Northumberland County': {
    name: 'Northumberland County',
    type: 'county',
    cities: ['Cobourg', 'Port Hope', 'Brighton', 'Alderville First Nation', 'Alnwick/Haldimand', 'Cramahe', 'Hamilton Township', 'Trent Hills']
  },
  
  'Peterborough County': {
    name: 'Peterborough County',
    type: 'county',
    cities: ['Peterborough', 'Lakefield', 'Douro-Dummer', 'Asphodel-Norwood', 'Havelock-Belmont-Methuen', 'North Kawartha', 'Selwyn', 'Trent Lakes']
  },
  
  'Renfrew County': {
    name: 'Renfrew County',
    type: 'county',
    cities: ['Pembroke', 'Renfrew', 'Arnprior', 'Deep River', 'Admaston/Bromley', 'Bonnechere Valley', 'Brudenell, Lyndoch and Raglan', 'Greater Madawaska', 'Laurentian Hills', 'Laurentian Valley', 'Madawaska Valley', 'McNab/Braeside', 'North Algona Wilberforce', 'Whitewater Region']
  },
  
  'Prescott and Russell': {
    name: 'Prescott and Russell',
    type: 'united-counties',
    cities: ['Hawkesbury', 'Alfred and Plantagenet', 'Casselman', 'Champlain', 'Clarence-Rockland', 'East Hawkesbury', 'Russell', 'The Nation']
  },
  
  'Stormont, Dundas and Glengarry': {
    name: 'Stormont, Dundas and Glengarry',
    type: 'united-counties',
    cities: ['Cornwall', 'Alexandria', 'Morrisburg', 'Winchester', 'North Dundas', 'North Glengarry', 'North Stormont', 'South Dundas', 'South Glengarry', 'South Stormont']
  },
  
  // Northern Ontario - District Municipalities
  'Thunder Bay District': {
    name: 'Thunder Bay District',
    type: 'district',
    cities: ['Thunder Bay', 'Greenstone', 'Marathon', 'Manitouwadge', 'Nipigon', 'Red Rock', 'Schreiber', 'Terrace Bay', 'Conmee', 'Dorion', 'Gillies', 'Neebing', 'OConnor', 'Oliver Paipoonge', 'Red Rock', 'Schreiber']
  },
  
  'Rainy River District': {
    name: 'Rainy River District',
    type: 'district',
    cities: ['Fort Frances', 'Atikokan', 'Rainy River', 'Alberton', 'Chapple', 'Dawson', 'Emo', 'La Vallee', 'Lake of the Woods', 'Morley']
  },
  
  'Kenora District': {
    name: 'Kenora District',
    type: 'district',
    cities: ['Kenora', 'Dryden', 'Sioux Lookout', 'Red Lake', 'Ear Falls', 'Ignace', 'Machin', 'Pickle Lake', 'Sioux Narrows-Nestor Falls']
  },
  
  'Cochrane District': {
    name: 'Cochrane District',
    type: 'district',
    cities: ['Timmins', 'Cochrane', 'Hearst', 'Kapuskasing', 'Smooth Rock Falls', 'Black River-Matheson', 'Fauquier-Strickland', 'Greater Madawaska', 'Iroquois Falls', 'James Bay Frontier', 'Mattice-Val Cote', 'Moosonee', 'Opasatika', 'Val Rita-Harty']
  },
  
  'Algoma District': {
    name: 'Algoma District',
    type: 'district',
    cities: ['Sault Ste. Marie', 'Elliot Lake', 'Blind River', 'Spanish', 'Thessalon', 'Bruce Mines', 'Dubreuilville', 'Hilton', 'Hilton Beach', 'Huron Shores', 'Jocelyn', 'Johnson', 'Laird', 'Macdonald, Meredith and Aberdeen Additional', 'Plummer Additional', 'Prince', 'St. Joseph', 'Tarbutt', 'The North Shore', 'Wawa', 'White River']
  },
  
  'Sudbury District': {
    name: 'Sudbury District',
    type: 'district',
    cities: ['Espanola', 'Chapleau', 'French River', 'Killarney', 'Markstay-Warren', 'St. Charles', 'Sables-Spanish Rivers', 'Baldwin', 'Nairn and Hyman']
  },
  
  'Manitoulin District': {
    name: 'Manitoulin District',
    type: 'district',
    cities: ['Gore Bay', 'Northeastern Manitoulin and the Islands', 'Assiginack', 'Billings', 'Burpee and Mills', 'Central Manitoulin', 'Cockburn Island', 'Gordon/Barrie Island', 'Robinson', 'Tehkummah']
  },
  
  'Parry Sound District': {
    name: 'Parry Sound District',
    type: 'district',
    cities: ['Parry Sound', 'Powassan', 'Burks Falls', 'Armour', 'Carling', 'Joly', 'Kearney', 'Machar', 'Magnetawan', 'McDougall', 'McKellar', 'McMurrich/Monteith', 'Nipissing', 'Ryerson', 'Seguin', 'Strong', 'The Archipelago', 'Whitestone']
  },
  
  'Nipissing District': {
    name: 'Nipissing District',
    type: 'district',
    cities: ['North Bay', 'Temagami', 'Mattawa', 'Callander', 'Corbeil', 'Astounding', 'Bonfield', 'Calvin', 'Chisholm', 'East Ferris', 'Mattawa', 'Papineau-Cameron', 'South Algonquin', 'Temagami', 'West Nipissing']
  }
}

// Helper functions
export const getAllRegions = () => Object.keys(ONTARIO_REGIONS)

export const getCitiesForRegion = (regionName) => {
  const region = ONTARIO_REGIONS[regionName]
  return region ? region.cities : []
}

export const getRegionForCity = (cityName) => {
  for (const [regionName, region] of Object.entries(ONTARIO_REGIONS)) {
    if (region.cities.some(c => c.toLowerCase() === cityName.toLowerCase())) {
      return regionName
    }
  }
  return null
}

export const getAllCities = () => {
  return Object.values(ONTARIO_REGIONS).flatMap(r => r.cities)
}

export const cityExists = (cityName) => {
  return getAllCities().some(c => c.toLowerCase() === cityName.toLowerCase())
}

export const getRegionType = (regionName) => {
  const region = ONTARIO_REGIONS[regionName]
  return region ? region.type : null
}

export const getRegionsByType = () => {
  return Object.entries(ONTARIO_REGIONS).reduce((acc, [name, data]) => {
    if (!acc[data.type]) acc[data.type] = []
    acc[data.type].push(name)
    return acc
  }, {})
}

export const REGION_TYPE_LABELS = {
  'regional': 'Regional Municipality',
  'single-tier': 'Single-Tier Municipality',
  'county': 'County',
  'united-counties': 'United Counties',
  'district': 'District Municipality'
}

// Niagara specific exports
export const getNiagaraCities = () => NIAGARA_REGION.cities
export const getNiagaraRegionName = () => NIAGARA_REGION.name
export const isNiagaraCity = (cityName) => {
  return NIAGARA_REGION.cities.some(c => c.toLowerCase() === cityName.toLowerCase())
}

// GTA cities
export const GTA_CITIES = [
  'Vaughan', 'Markham', 'Richmond Hill', 'Newmarket', 'Aurora', 'Whitchurch-Stouffville', 'King', 'East Gwillimbury', 'Georgina',
  'Mississauga', 'Brampton', 'Caledon',
  'Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
  'Oakville', 'Burlington', 'Milton', 'Halton Hills',
  'Toronto', 'North York', 'Scarborough', 'Etobicoke'
]

// Golden Horseshoe
export const GOLDEN_HORSESHOE_CITIES = [
  ...GTA_CITIES,
  ...NIAGARA_REGION.cities,
  'Hamilton', 'Stoney Creek', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook'
]

export default ONTARIO_REGIONS
