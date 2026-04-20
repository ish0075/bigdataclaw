import React from 'react'
import { 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Linkedin, 
  ExternalLink,
  MessageCircle,
  Building2,
  MapPin,
  Star,
  ArrowUpRight
} from 'lucide-react'
import { useResidentialAgentStore } from '../../stores/residentialAgentStore'

// Custom SVG icons for platforms not in Lucide
const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const WeChatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
  </svg>
)

const STATUS_CONFIG = {
  new: { 
    color: 'border-l-gray-500', 
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-400',
    label: 'New'
  },
  contacted: { 
    color: 'border-l-yellow-500', 
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400',
    label: 'Contacted'
  },
  added: { 
    color: 'border-l-blue-500', 
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    label: 'Added'
  },
  friend: { 
    color: 'border-l-green-500', 
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400',
    label: 'Friend',
    pulse: true
  },
  declined: { 
    color: 'border-l-red-500', 
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
    label: 'Declined'
  }
}

const AgentCard = ({ agent, onClick }) => {
  const { updateStatus } = useResidentialAgentStore()
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.new
  
  const handleActionClick = (e, action) => {
    e.stopPropagation()
    action()
  }
  
  const getRealtorCaUrl = () => {
    if (agent.realtorCaUrl) return agent.realtorCaUrl
    const searchQuery = encodeURIComponent(`${agent.name} realtor realtor.ca`)
    return `https://www.google.com/search?q=${searchQuery}`
  }
  
  return (
    <div 
      onClick={onClick}
      className={`
        p-5 hover:bg-bg-input/30 transition-colors cursor-pointer
        border-l-4 ${statusConfig.color}
        ${agent.status === 'declined' ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`font-semibold text-text-primary text-lg ${agent.status === 'declined' ? 'line-through' : ''}`}>
                {agent.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Building2 className="w-3 h-3" />
                <span>{agent.brokerage}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{agent.city || 'Ontario'}</span>
                </div>
              </div>
            </div>
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.badge}`}>
              {statusConfig.label}
            </span>
          </div>
          
          {/* Info Grid - Like Lender Cards */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-text-muted">Specialties</p>
              <p className="font-medium text-text-primary text-sm">
                {agent.specialties?.slice(0, 2).join(', ') || 'General'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Status</p>
              <p className={`font-medium text-sm ${statusConfig.text}`}>
                {statusConfig.label}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Notes</p>
              <p className="font-medium text-text-primary text-sm">
                {agent.notes?.length || 0} notes
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Last Contact</p>
              <p className="font-medium text-text-primary text-sm">
                {agent.lastContacted 
                  ? new Date(agent.lastContacted).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
                  : 'Never'
                }
              </p>
            </div>
          </div>

          {/* Social Links Row */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-text-muted">Connect:</span>
            {agent.facebook && (
              <a 
                href={agent.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-blue-500/20 text-text-secondary hover:text-blue-400 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}
            {agent.instagram && (
              <a 
                href={`https://instagram.com/${agent.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-pink-500/20 text-text-secondary hover:text-pink-400 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            )}
            {agent.tiktok && (
              <a 
                href={`https://tiktok.com/@${agent.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-purple-500/20 text-text-secondary hover:text-purple-400 transition-colors"
                title="TikTok"
              >
                <TikTokIcon />
              </a>
            )}
            {agent.linkedin && (
              <a 
                href={agent.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-blue-600/20 text-text-secondary hover:text-blue-600 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}
            {agent.email && (
              <a 
                href={`mailto:${agent.email}`}
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-accent-blue/20 text-text-secondary hover:text-accent-blue transition-colors"
                title="Email"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
            {agent.phone && (
              <a 
                href={`tel:${agent.phone}`}
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-accent-green/20 text-text-secondary hover:text-accent-green transition-colors"
                title="Call"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
            {agent.whatsapp && (
              <a 
                href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-green-500/20 text-text-secondary hover:text-green-500 transition-colors"
                title="WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            )}
            {agent.wechat && (
              <a 
                href={`weixin://dl/chat?${agent.wechat}`}
                onClick={(e) => handleActionClick(e, () => {})}
                className="p-1.5 rounded bg-bg-input hover:bg-green-600/20 text-text-secondary hover:text-green-600 transition-colors"
                title={`WeChat: ${agent.wechat}`}
              >
                <WeChatIcon />
              </a>
            )}
            <a 
              href={getRealtorCaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleActionClick(e, () => {})}
              className="p-1.5 rounded bg-bg-input hover:bg-accent-red/20 text-text-secondary hover:text-accent-red transition-colors"
              title="View on Realtor.ca"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
          <button 
            onClick={(e) => handleActionClick(e, onClick)}
            className="px-4 py-2 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 text-sm font-medium flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Details
          </button>
          {agent.phone && (
            <a 
              href={`tel:${agent.phone.replace(/\D/g, '')}`}
              onClick={(e) => handleActionClick(e, () => {})}
              className="px-4 py-2 rounded-lg bg-bg-input hover:bg-accent-green/20 text-text-secondary hover:text-accent-green text-sm font-medium flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          <select
            value={agent.status}
            onChange={(e) => handleActionClick(e, () => updateStatus(agent.id, e.target.value))}
            className="text-xs px-2 py-2 rounded border bg-bg-input text-text-secondary border-border-subtle cursor-pointer hover:border-accent-blue"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="added">Added</option>
            <option value="friend">Friend</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default AgentCard
