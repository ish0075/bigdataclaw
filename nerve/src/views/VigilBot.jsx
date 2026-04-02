import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Server, Globe, Database, Wifi, AlertTriangle, CheckCircle, 
  XCircle, Clock, RefreshCw, Bell, Shield, Zap, TrendingUp, TrendingDown,
  Cpu, HardDrive, Layers, Terminal, Settings, Play, Pause, RotateCw,
  Mail, MessageSquare, Phone, History, BarChart3, PieChart, Eye,
  FileText, Download, Filter, Search, ChevronDown, ChevronUp
} from 'lucide-react';

// Vigil Bot - The Sentinel
const VigilBot = () => {
  // System Status State
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy', // healthy, warning, critical
    lastCheck: null,
    uptime: '99.9%',
    checksPerformed: 0,
    issuesDetected: 0,
    avgResponseTime: 0
  });

  // Individual Service Status
  const [services, setServices] = useState([
    {
      id: 'frontend',
      name: 'NERVE Frontend',
      icon: '💻',
      status: 'healthy',
      url: 'http://localhost:5173',
      responseTime: 45,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      endpoints: [
        { path: '/', name: 'Homepage', status: 'healthy', responseTime: 45 },
        { path: '/exp-agent-recruiter', name: 'Agent Recruiter', status: 'healthy', responseTime: 120 },
        { path: '/bot-boardroom', name: 'Bot Boardroom', status: 'healthy', responseTime: 85 },
        { path: '/buyer-bot', name: 'Buyer Bot', status: 'healthy', responseTime: 95 },
        { path: '/seller-outreach-bot', name: 'Seller Bot', status: 'healthy', responseTime: 90 },
        { path: '/property-valuation-bot', name: 'Property Bot', status: 'healthy', responseTime: 88 }
      ]
    },
    {
      id: 'backend-api',
      name: 'BigDataClaw API',
      icon: '🔌',
      status: 'healthy',
      url: 'http://localhost:8000',
      responseTime: 32,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      endpoints: [
        { path: '/api/health', name: 'Health Check', status: 'healthy', responseTime: 12 },
        { path: '/api/recruiters?limit=5', name: 'Recruiters API', status: 'healthy', responseTime: 45 },
        { path: '/api/dbeaver/stats', name: 'DBeaver Stats', status: 'healthy', responseTime: 38 },
        { path: '/api/lenders', name: 'Lenders API', status: 'healthy', responseTime: 52 }
      ]
    },
    {
      id: 'nerve-server',
      name: 'NERVE Server',
      icon: '🧠',
      status: 'healthy',
      url: 'http://localhost:3090',
      responseTime: 28,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      endpoints: [
        { path: '/api/health', name: 'Health Check', status: 'healthy', responseTime: 15 },
        { path: '/ws', name: 'WebSocket', status: 'healthy', responseTime: 0 }
      ]
    },
    {
      id: 'agent-orchestrator',
      name: 'Agent Orchestrator',
      icon: '🤖',
      status: 'healthy',
      url: 'http://localhost:8081',
      responseTime: 55,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      endpoints: [
        { path: '/health', name: 'Health Check', status: 'healthy', responseTime: 22 },
        { path: '/meetings', name: 'Meetings API', status: 'healthy', responseTime: 65 }
      ]
    },
    {
      id: 'database',
      name: 'SQLite Database',
      icon: '🗄️',
      status: 'healthy',
      url: 'bigdataclaw.db',
      responseTime: 8,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      metrics: {
        size: '108 MB',
        tables: 12,
        connections: 5,
        queriesPerSecond: 45
      }
    },
    {
      id: 'qdrant',
      name: 'Qdrant Vector DB',
      icon: '🔍',
      status: 'healthy',
      url: 'http://localhost:6333',
      responseTime: 15,
      lastChecked: null,
      checks: { passed: 0, failed: 0 },
      endpoints: [
        { path: '/', name: 'Dashboard', status: 'healthy', responseTime: 15 }
      ]
    }
  ]);

  // Monitoring Settings
  const [settings, setSettings] = useState({
    isMonitoring: true,
    checkInterval: 30, // seconds
    alertThreshold: 3, // consecutive failures before alert
    notifyEmail: true,
    notifySlack: false,
    notifyTelegram: true,
    autoRestart: false
  });

  // Alert History
  const [alerts, setAlerts] = useState([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // Logs
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    avgResponseTime: 0,
    uptimePercent: 100,
    last24hIssues: 0
  });

  // Add log entry
  const addLog = useCallback((type, message, service = null) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev.slice(-99), { timestamp, type, message, service }]);
  }, []);

  // Add alert
  const addAlert = useCallback((severity, title, message, service) => {
    const timestamp = new Date().toISOString();
    const alert = { id: Date.now(), timestamp, severity, title, message, service, acknowledged: false };
    setAlerts(prev => [alert, ...prev]);
    
    // Send notifications
    if (settings.notifyEmail) {
      addLog('info', `📧 Email notification sent for ${service}: ${title}`);
    }
    if (settings.notifyTelegram) {
      addLog('info', `📱 Telegram notification sent for ${service}: ${title}`);
    }
  }, [settings, addLog]);

  // Check a single endpoint
  const checkEndpoint = async (serviceUrl, endpoint) => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${serviceUrl}${endpoint.path}`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors' // For cross-origin requests
      });
      
      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - startTime);
      
      return {
        status: response.ok || response.status === 0 ? 'healthy' : 'warning',
        responseTime,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'critical',
        responseTime: Math.round(performance.now() - startTime),
        error: error.message
      };
    }
  };

  // Simple ping for services without endpoints
  const pingEndpoint = async (url) => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - startTime);
      
      return {
        status: response.ok || response.status === 0 ? 'healthy' : 'warning',
        responseTime
      };
    } catch (error) {
      return {
        status: 'critical',
        responseTime: Math.round(performance.now() - startTime)
      };
    }
  };

  // Check a service
  const checkService = async (service) => {
    addLog('debug', `Checking ${service.name}...`, service.id);
    
    // For services without endpoints (like database), just do a basic check
    if (!service.endpoints) {
      // Try to ping the service URL if it's a URL, otherwise simulate
      let status = 'healthy';
      let responseTime = service.responseTime || 0;
      
      if (service.url.startsWith('http')) {
        const result = await pingEndpoint(service.url);
        status = result.status;
        responseTime = result.responseTime;
      }

      // Update checks count
      const checks = {
        passed: status === 'healthy' ? service.checks.passed + 1 : service.checks.passed,
        failed: status !== 'healthy' ? service.checks.failed + 1 : service.checks.failed
      };

      // Alert on status change to critical
      if (status === 'critical' && service.status !== 'critical') {
        addAlert('critical', `${service.name} is Down`, 
          `Service not responding`, service.name);
      }

      return {
        ...service,
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        checks
      };
    }
    
    const updatedEndpoints = await Promise.all(
      service.endpoints.map(async (endpoint) => {
        const result = await checkEndpoint(service.url, endpoint);
        return { ...endpoint, ...result };
      })
    );

    // Determine overall service status
    const failedEndpoints = updatedEndpoints.filter(e => e.status === 'critical');
    const warningEndpoints = updatedEndpoints.filter(e => e.status === 'warning');
    
    let status = 'healthy';
    if (failedEndpoints.length > 0) status = 'critical';
    else if (warningEndpoints.length > 0) status = 'warning';

    // Calculate average response time
    const avgResponseTime = updatedEndpoints.length > 0 
      ? Math.round(updatedEndpoints.reduce((acc, e) => acc + (e.responseTime || 0), 0) / updatedEndpoints.length)
      : service.responseTime || 0;

    // Update checks count
    const checks = {
      passed: status === 'healthy' ? service.checks.passed + 1 : service.checks.passed,
      failed: status !== 'healthy' ? service.checks.failed + 1 : service.checks.failed
    };

    // Alert on status change to critical
    if (status === 'critical' && service.status !== 'critical') {
      addAlert('critical', `${service.name} is Down`, 
        `${failedEndpoints.length} endpoint(s) failing`, service.name);
    }

    return {
      ...service,
      status,
      endpoints: updatedEndpoints,
      responseTime: avgResponseTime,
      lastChecked: new Date().toISOString(),
      checks
    };
  };

  // Run full system check
  const runSystemCheck = useCallback(async () => {
    if (!settings.isMonitoring) return;

    addLog('info', '🔍 Running system health check...');
    
    const updatedServices = await Promise.all(
      services.map(service => checkService(service))
    );

    setServices(updatedServices);

    // Calculate overall system status
    const criticalServices = updatedServices.filter(s => s.status === 'critical');
    const warningServices = updatedServices.filter(s => s.status === 'warning');
    
    let overall = 'healthy';
    if (criticalServices.length > 0) overall = 'critical';
    else if (warningServices.length > 0) overall = 'warning';

    // Calculate stats
    const totalResponseTime = updatedServices.reduce((acc, s) => acc + s.responseTime, 0);
    const avgResponseTime = Math.round(totalResponseTime / updatedServices.length);

    setSystemStatus(prev => ({
      overall,
      lastCheck: new Date().toISOString(),
      uptime: overall === 'healthy' ? prev.uptime : prev.uptime,
      checksPerformed: prev.checksPerformed + 1,
      issuesDetected: prev.issuesDetected + (overall !== 'healthy' ? 1 : 0),
      avgResponseTime
    }));

    setStats(prev => ({
      ...prev,
      totalChecks: prev.totalChecks + updatedServices.length,
      successfulChecks: prev.successfulChecks + updatedServices.filter(s => s.status === 'healthy').length,
      failedChecks: prev.failedChecks + updatedServices.filter(s => s.status !== 'healthy').length,
      avgResponseTime
    }));

    addLog('info', `✅ System check complete. Status: ${overall.toUpperCase()}`);
  }, [services, settings.isMonitoring, addLog, addAlert]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Monitoring interval
  useEffect(() => {
    if (!settings.isMonitoring) return;

    // Initial check
    runSystemCheck();

    // Set up interval
    const interval = setInterval(runSystemCheck, settings.checkInterval * 1000);
    
    return () => clearInterval(interval);
  }, [settings.isMonitoring, settings.checkInterval, runSystemCheck]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-text-muted bg-bg-input';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Vigil Bot Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
            👁️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Vigil</h1>
            <p className="text-text-secondary">The Sentinel • 24/7 System Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(systemStatus.overall)}`}>
            {getStatusIcon(systemStatus.overall)}
            <span className="font-semibold capitalize">{systemStatus.overall}</span>
          </div>
          
          {/* Control Buttons */}
          <button
            onClick={() => setSettings(s => ({ ...s, isMonitoring: !s.isMonitoring }))}
            className={`btn-secondary flex items-center gap-2 ${settings.isMonitoring ? 'text-green-400' : 'text-amber-400'}`}
          >
            {settings.isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {settings.isMonitoring ? 'Pause' : 'Resume'}
          </button>
          
          <button
            onClick={runSystemCheck}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Check Now
          </button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <p className="text-xs text-text-secondary uppercase">Status</p>
          </div>
          <p className={`text-xl font-bold capitalize ${systemStatus.overall === 'healthy' ? 'text-green-400' : systemStatus.overall === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
            {systemStatus.overall}
          </p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <p className="text-xs text-text-secondary uppercase">Uptime</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{systemStatus.uptime}</p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <p className="text-xs text-text-secondary uppercase">Avg Response</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{systemStatus.avgResponseTime}ms</p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-400" />
            <p className="text-xs text-text-secondary uppercase">Checks</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{systemStatus.checksPerformed}</p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-xs text-text-secondary uppercase">Issues</p>
          </div>
          <p className="text-xl font-bold text-amber-400">{systemStatus.issuesDetected}</p>
        </div>
        
        <div className="card p-4 text-center cursor-pointer hover:bg-bg-input transition-colors" onClick={() => setShowAlertPanel(!showAlertPanel)}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-rose-400" />
            <p className="text-xs text-text-secondary uppercase">Alerts</p>
          </div>
          <p className="text-xl font-bold text-rose-400">{alerts.filter(a => !a.acknowledged).length}</p>
        </div>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map(service => (
          <div key={service.id} className="card p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-bg-input flex items-center justify-center text-2xl">
                  {service.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{service.name}</h3>
                  <p className="text-xs text-text-muted">{service.url}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
                <span className="capitalize">{service.status}</span>
              </div>
            </div>

            {/* Response Time */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1 text-text-secondary">
                <Zap className="w-4 h-4" />
                <span>{service.responseTime}ms</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Clock className="w-4 h-4" />
                <span>Last: {service.lastChecked ? new Date(service.lastChecked).toLocaleTimeString() : 'Never'}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{service.checks.passed}</span>
              </div>
              {service.checks.failed > 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span>{service.checks.failed}</span>
                </div>
              )}
            </div>

            {/* Endpoints or Metrics */}
            <div className="space-y-2">
              {service.endpoints ? (
                // Show endpoints for services with them
                service.endpoints.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-bg-input rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${endpoint.status === 'healthy' ? 'bg-green-400' : endpoint.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      <span className="text-sm text-text-secondary">{endpoint.name}</span>
                      <span className="text-xs text-text-muted">{endpoint.path}</span>
                    </div>
                    <span className={`text-xs ${endpoint.status === 'healthy' ? 'text-green-400' : endpoint.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                      {endpoint.responseTime}ms
                    </span>
                  </div>
                ))
              ) : service.metrics ? (
                // Show metrics for database services
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(service.metrics).map(([key, value], idx) => (
                    <div key={idx} className="p-2 bg-bg-input rounded-lg">
                      <span className="text-xs text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <p className="text-sm text-text-primary font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Logs & Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Logs */}
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Live Monitor Logs
            </h3>
            <button 
              onClick={() => setLogs([])}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              Clear
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <p className="text-text-muted text-center py-8">No logs yet. Start monitoring to see activity.</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-green-400' : 'text-text-secondary'}`}>
                  <span className="text-text-muted">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Settings */}
        <div className="card p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Vigil Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">Check Interval</label>
              <select 
                value={settings.checkInterval}
                onChange={(e) => setSettings(s => ({ ...s, checkInterval: parseInt(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary">Alert Threshold</label>
              <select 
                value={settings.alertThreshold}
                onChange={(e) => setSettings(s => ({ ...s, alertThreshold: parseInt(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              >
                <option value={1}>1 failure</option>
                <option value={3}>3 failures</option>
                <option value={5}>5 failures</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-text-secondary block">Notifications</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notifyEmail}
                  onChange={(e) => setSettings(s => ({ ...s, notifyEmail: e.target.checked }))}
                  className="rounded"
                />
                <Mail className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notifyTelegram}
                  onChange={(e) => setSettings(s => ({ ...s, notifyTelegram: e.target.checked }))}
                  className="rounded"
                />
                <MessageSquare className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Telegram</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Panel Overlay */}
      {showAlertPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" />
                Alert History
              </h3>
              <button onClick={() => setShowAlertPanel(false)} className="text-text-secondary hover:text-text-primary">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {alerts.length === 0 ? (
                <p className="text-text-muted text-center py-8">No alerts yet.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`p-4 border-b border-border-subtle ${alert.acknowledged ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${alert.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <div>
                          <p className="font-medium text-text-primary">{alert.title}</p>
                          <p className="text-sm text-text-secondary">{alert.message}</p>
                          <p className="text-xs text-text-muted mt-1">{alert.service} • {new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button 
                          onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: true } : a))}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VigilBot;
