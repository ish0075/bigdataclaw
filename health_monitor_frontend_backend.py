#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           FRONTEND & BACKEND HEALTH MONITOR                                  ║
║                                                                              ║
║  Monitors:                                                                   ║
║  • BigDataClaw Frontend (Vite/React)                                        ║
║  • NERVE Recruiter Dashboard                                                ║
║  • Backend APIs (Python/FastAPI)                                            ║
║  • Auto-restart on failure                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import subprocess
import time
import os
import signal
import requests
import json
from datetime import datetime
from pathlib import Path


class FrontendBackendMonitor:
    """Monitor and manage frontend/backend services"""
    
    SERVICES = {
        'bigdataclaw_frontend': {
            'name': 'BigDataClaw Frontend',
            'port': 5173,
            'command': 'npm run dev',
            'directory': '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw',
            'health_url': 'http://localhost:5173',
            'process': None,
            'log_file': 'logs/bigdataclaw_frontend.log'
        },
        'nerve_frontend': {
            'name': 'NERVE Recruiter Dashboard',
            'port': 5174,
            'command': 'npm run dev',
            'directory': '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/nerve',
            'health_url': 'http://localhost:5174',
            'process': None,
            'log_file': 'logs/nerve_frontend.log'
        },
        'nerve_backend': {
            'name': 'NERVE Backend API',
            'port': 3090,
            'command': 'python -m uvicorn main:app --reload --port 3090',
            'directory': '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/nerve/server',
            'health_url': 'http://localhost:3090/health',
            'process': None,
            'log_file': 'logs/nerve_backend.log'
        },
        'api_server': {
            'name': 'BigDataClaw API',
            'port': 8000,
            'command': 'python api_server.py',
            'directory': '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw',
            'health_url': 'http://localhost:8000/health',
            'process': None,
            'log_file': 'logs/api_server.log'
        }
    }
    
    def __init__(self):
        self.status = {}
        self.restart_count = {}
        self.running = True
        Path('logs').mkdir(exist_ok=True)
        
    def check_service_health(self, service_id):
        """Check if a service is healthy"""
        service = self.SERVICES[service_id]
        
        try:
            # Try to connect
            if service_id == 'bigdataclaw_frontend':
                # Vite dev server
                response = requests.get(service['health_url'], timeout=5)
                return response.status_code == 200 or response.status_code == 404
            elif service_id == 'nerve_frontend':
                response = requests.get(service['health_url'], timeout=5)
                return response.status_code == 200 or response.status_code == 404
            else:
                # Backend APIs
                response = requests.get(service['health_url'], timeout=5)
                return response.status_code == 200
        except requests.exceptions.ConnectionError:
            return False
        except requests.exceptions.Timeout:
            return False
        except Exception as e:
            print(f"  ⚠️  Health check error for {service_id}: {e}")
            return False
    
    def check_port_in_use(self, port):
        """Check if a port is already in use"""
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result == 0
        except:
            return False
    
    def start_service(self, service_id):
        """Start a service"""
        service = self.SERVICES[service_id]
        
        print(f"\n🚀 Starting {service['name']}...")
        
        # Check if port is already in use
        if self.check_port_in_use(service['port']):
            print(f"  ℹ️  Port {service['port']} already in use, service may already be running")
            self.status[service_id] = 'running'
            return True
        
        try:
            # Open log file
            log_path = os.path.join(service['directory'], service['log_file'])
            Path(log_path).parent.mkdir(parents=True, exist_ok=True)
            
            log_file = open(log_path, 'a')
            log_file.write(f"\n\n[{datetime.now()}] Starting {service['name']}\n")
            log_file.flush()
            
            # Start process
            process = subprocess.Popen(
                service['command'],
                shell=True,
                cwd=service['directory'],
                stdout=log_file,
                stderr=subprocess.STDOUT,
                preexec_fn=os.setsid  # Create new process group
            )
            
            service['process'] = process
            service['log_file_handle'] = log_file
            
            print(f"  ⏳ Waiting for {service['name']} to start...")
            time.sleep(5)  # Give it time to start
            
            # Check if process is still running
            if process.poll() is None:
                print(f"  ✅ {service['name']} started (PID: {process.pid})")
                self.status[service_id] = 'running'
                return True
            else:
                print(f"  ❌ {service['name']} failed to start")
                self.status[service_id] = 'failed'
                return False
                
        except Exception as e:
            print(f"  ❌ Error starting {service['name']}: {e}")
            self.status[service_id] = 'error'
            return False
    
    def stop_service(self, service_id):
        """Stop a service"""
        service = self.SERVICES[service_id]
        
        if service['process']:
            try:
                # Kill the process group
                os.killpg(os.getpgid(service['process'].pid), signal.SIGTERM)
                service['process'].wait(timeout=5)
                
                if service.get('log_file_handle'):
                    service['log_file_handle'].close()
                    
                print(f"  ✅ Stopped {service['name']}")
            except:
                pass
    
    def restart_service(self, service_id):
        """Restart a service"""
        print(f"\n🔄 Restarting {self.SERVICES[service_id]['name']}...")
        self.stop_service(service_id)
        time.sleep(2)
        return self.start_service(service_id)
    
    def monitor_loop(self):
        """Main monitoring loop"""
        print("="*70)
        print("🏥 FRONTEND/BACKEND HEALTH MONITOR")
        print("="*70)
        print("\nMonitoring:")
        for service_id, service in self.SERVICES.items():
            print(f"  • {service['name']} (port {service['port']})")
        print("\n" + "="*70)
        
        # Initial start
        print("\n🚀 Initial service startup...")
        for service_id in self.SERVICES:
            self.start_service(service_id)
            time.sleep(3)
        
        print("\n" + "="*70)
        print("✅ All services started. Beginning monitoring...")
        print("="*70)
        
        check_interval = 30  # Check every 30 seconds
        
        try:
            while self.running:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Health Check:")
                
                for service_id, service in self.SERVICES.items():
                    is_healthy = self.check_service_health(service_id)
                    
                    if is_healthy:
                        status_icon = "✅"
                        status_text = "HEALTHY"
                        self.restart_count[service_id] = 0
                    else:
                        status_icon = "❌"
                        status_text = "DOWN"
                        
                        # Try to restart
                        restart_count = self.restart_count.get(service_id, 0)
                        if restart_count < 3:
                            print(f"  {status_icon} {service['name']}: {status_text} - Restarting...")
                            self.restart_count[service_id] = restart_count + 1
                            self.restart_service(service_id)
                        else:
                            print(f"  {status_icon} {service['name']}: {status_text} - Max restarts reached")
                    
                    if is_healthy:
                        print(f"  {status_icon} {service['name']}: {status_text}")
                
                # Save status
                self.save_status()
                
                # Wait before next check
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping monitor...")
            self.shutdown()
    
    def save_status(self):
        """Save current status to file"""
        status_data = {
            'timestamp': datetime.now().isoformat(),
            'services': {}
        }
        
        for service_id, service in self.SERVICES.items():
            is_healthy = self.check_service_health(service_id)
            status_data['services'][service_id] = {
                'name': service['name'],
                'port': service['port'],
                'healthy': is_healthy,
                'status': 'healthy' if is_healthy else 'down',
                'restarts': self.restart_count.get(service_id, 0)
            }
        
        with open('logs/frontend_backend_status.json', 'w') as f:
            json.dump(status_data, f, indent=2)
    
    def shutdown(self):
        """Shutdown all services"""
        self.running = False
        print("\n🛑 Stopping all services...")
        for service_id in self.SERVICES:
            self.stop_service(service_id)
        print("✅ All services stopped")
    
    def get_dashboard_url(self):
        """Get URLs for dashboards"""
        return {
            'bigdataclaw': 'http://localhost:5173',
            'nerve_recruiter': 'http://localhost:5174',
            'nerve_api': 'http://localhost:3090/docs',
            'api': 'http://localhost:8000'
        }


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Frontend/Backend Health Monitor')
    parser.add_argument('--start', action='store_true', help='Start all services and monitor')
    parser.add_argument('--stop', action='store_true', help='Stop all services')
    parser.add_argument('--status', action='store_true', help='Show current status')
    parser.add_argument('--restart', help='Restart specific service')
    
    args = parser.parse_args()
    
    monitor = FrontendBackendMonitor()
    
    if args.stop:
        monitor.shutdown()
    elif args.status:
        print("\n📊 Current Status:")
        for service_id, service in monitor.SERVICES.items():
            is_healthy = monitor.check_service_health(service_id)
            status = "✅ HEALTHY" if is_healthy else "❌ DOWN"
            print(f"  {status} - {service['name']} (port {service['port']})")
        
        print("\n🔗 URLs:")
        for name, url in monitor.get_dashboard_url().items():
            print(f"  • {name}: {url}")
    elif args.restart:
        if args.restart in monitor.SERVICES:
            monitor.restart_service(args.restart)
        else:
            print(f"❌ Unknown service: {args.restart}")
            print(f"Available: {', '.join(monitor.SERVICES.keys())}")
    else:
        # Default: start monitoring
        monitor.monitor_loop()


if __name__ == "__main__":
    main()
