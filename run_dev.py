#!/usr/bin/env python3
"""
Development runner for Solicitor Brain
Consolidated master version with context managers and enhanced features
"""

import os
import sys
import subprocess
import time
import psutil
import webbrowser
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import click
import requests
from contextlib import ExitStack


class DevRunner:
    def __init__(self) -> None:
        self.processes: List[Tuple[str, subprocess.Popen[str]]] = []
        self.root_dir = Path(__file__).parent
        self.venv_path = self.root_dir / "venv"
        self.exit_stack = ExitStack()

    def check_requirements(self) -> bool:
        """Check if all requirements are met"""
        print("🔍 Checking requirements...")

        # Check Python version
        if sys.version_info < (3, 11):
            print("❌ Python 3.11+ required")
            return False

        # Check if venv exists
        venv_path = self.root_dir / ".venv"
        if not venv_path.exists():
            print("📦 Creating virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)

        # Install requirements
        pip_path = venv_path / "bin" / "pip"
        if not pip_path.exists():
            pip_path = venv_path / "Scripts" / "pip.exe"  # Windows

        print("📦 Checking Python dependencies...")
        # Only install if needed
        try:
            import fastapi
            import uvicorn
            import psutil as psutil_check
            # Verify imports are working
            _ = (fastapi.__version__, uvicorn.__version__, psutil_check.__version__)
            print("✓ Dependencies already installed")
        except ImportError:
            print("📦 Installing Python dependencies...")
            subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)

        # Check frontend dependencies
        frontend_modules = self.root_dir / "frontend" / "node_modules"
        if not frontend_modules.exists():
            print("📦 Installing frontend dependencies...")
            subprocess.run(["pnpm", "install"], cwd=self.root_dir / "frontend", check=True)

        return True

    def start_service(
        self, name: str, cmd: List[str], cwd: Optional[Path] = None, env: Optional[Dict[str, str]] = None
    ) -> subprocess.Popen[str]:
        """Start a service and track the process"""
        print(f"🚀 Starting {name}...")

        process_env = os.environ.copy()
        if env:
            process_env.update(env)

        process = subprocess.Popen(
            cmd,
            cwd=cwd or self.root_dir,
            env=process_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        self.processes.append((name, process))
        return process

    def kill_process_on_port(self, port: int) -> None:
        """Kill any process using the specified port"""
        try:
            for conn in psutil.net_connections():
                if hasattr(conn, "laddr") and conn.laddr and conn.laddr.port == port and conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        print(f"🔪 Killing process {proc.name()} (PID: {conn.pid}) on port {port}")
                        proc.terminate()
                        try:
                            proc.wait(timeout=5)
                        except psutil.TimeoutExpired:
                            proc.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
        except Exception as e:
            print(f"⚠️  Could not check port {port}: {e}")

    def kill_existing_services(self) -> None:
        """Kill any existing services on our ports"""
        print("🧹 Cleaning up existing services...")

        # Kill processes on our main ports
        self.kill_process_on_port(8000)  # Backend
        self.kill_process_on_port(3000)  # Frontend
        self.kill_process_on_port(11434)  # Ollama

        # Give processes time to die
        time.sleep(1)

    def wait_for_service(self, url: str, timeout: int = 30) -> bool:
        """Wait for a service to be ready with visual progress"""
        start_time = time.time()
        dots = 0
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=1)
                if response.status_code in [200, 404]:
                    print()  # New line after dots
                    return True
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                pass
            
            # Show progress dots
            dots = (dots + 1) % 4
            print(f"\r{'.' * dots}   ", end='', flush=True)
            time.sleep(0.5)
        
        print()  # New line after dots
        return False

    async def monitor_output(self, name: str, process: subprocess.Popen[str]) -> None:
        """Monitor and display process output"""
        if process.stdout:
            for line in process.stdout:
                print(f"[{name}] {line.rstrip()}")

    def run(self) -> None:
        """Run all services"""
        if not self.check_requirements():
            return

        # Kill any existing services first
        self.kill_existing_services()

        # Clear screen for clean start
        os.system('clear' if os.name != 'nt' else 'cls')
        
        print("""
╔═══════════════════════════════════════════════════════════════════╗
║                      SOLICITOR BRAIN v0.1.0                       ║
║                   AI-Powered Legal Assistant                      ║
╠═══════════════════════════════════════════════════════════════════╣
║  🏃 Starting development environment...                           ║
╚═══════════════════════════════════════════════════════════════════╝
""")

        # Set development environment
        os.environ["DEBUG"] = "true"
        os.environ["PYTHONPATH"] = str(self.root_dir)

        # Start PostgreSQL if not running
        pg_status = subprocess.run(["systemctl", "is-active", "postgresql"], capture_output=True, text=True)
        if pg_status.stdout.strip() != "active":
            print("⚠️  PostgreSQL is not running. Start it with:")
            print("    sudo systemctl start postgresql")
            return

        # Start Redis if not running
        redis_status = subprocess.run(["systemctl", "is-active", "redis-server"], capture_output=True, text=True)
        if redis_status.stdout.strip() != "active":
            print("⚠️  Redis is not running. Start it with:")
            print("    sudo systemctl start redis-server")
            return

        # Start Ollama if not running
        try:
            requests.get("http://localhost:11434/api/tags", timeout=2)
        except (requests.exceptions.RequestException, requests.exceptions.Timeout):
            print("🤖 Starting Ollama...")
            self.start_service("Ollama", ["ollama", "serve"], env={"OLLAMA_HOST": "0.0.0.0:11434"})
            time.sleep(3)

        # Start backend
        python_path = self.root_dir / ".venv" / "bin" / "python"
        if not python_path.exists():
            python_path = self.root_dir / ".venv" / "Scripts" / "python.exe"  # Windows

        self.start_service(
            "Backend",
            [
                str(python_path),
                "-m",
                "uvicorn",
                "backend.main:app",
                "--reload",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
            ],
            env={"PYTHONPATH": str(self.root_dir)},
        )

        # Wait for backend
        print("⏳ Waiting for backend...")
        if not self.wait_for_service("http://localhost:8000/health"):
            print("❌ Backend failed to start")
            self.cleanup()
            return
        print("✅ Backend ready")

        # Start frontend
        self.start_service("Frontend", ["pnpm", "dev"], cwd=self.root_dir / "frontend")

        # Wait for frontend
        print("⏳ Waiting for frontend...")
        if not self.wait_for_service("http://localhost:3000"):
            print("❌ Frontend failed to start")
            self.cleanup()
            return
        print("✅ Frontend ready")

        # Clear screen and show success
        os.system('clear' if os.name != 'nt' else 'cls')
        
        print("""
╔═══════════════════════════════════════════════════════════════════╗
║               🎉 SOLICITOR BRAIN IS RUNNING! 🎉                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📍 Access Points:                                                ║
║  ├─ Frontend:     http://localhost:3000                          ║
║  ├─ Backend API:  http://localhost:8000                          ║
║  └─ API Docs:     http://localhost:8000/docs                     ║
║                                                                   ║
║  🔑 Development Credentials:                                      ║
║  ├─ Email:    test@example.com                                   ║
║  └─ Password: test                                               ║
║                                                                   ║
║  🛠️  VS Code Debugging:                                           ║
║  1. Open VS Code: code .                                         ║
║  2. Go to Run and Debug (Ctrl+Shift+D)                          ║
║  3. Select 'Full Stack' and press F5                            ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  ⚠️  AI outputs are organisational assistance only –              ║
║     verify before use.                                           ║
╚═══════════════════════════════════════════════════════════════════╝
""")
        
        # Automatically open browser
        print("\n🌐 Opening browser...")
        time.sleep(2)  # Give frontend a moment to fully start
        webbrowser.open("http://localhost:3000")
        
        print("\nPress Ctrl+C to stop all services...")

        # Wait for interrupt
        try:
            while True:
                time.sleep(1)
                # Check if any process has died
                for name, process in self.processes:
                    if process.poll() is not None:
                        print(f"\n❌ {name} has stopped unexpectedly!")
                        self.cleanup()
                        return
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down...")
            self.cleanup()

    def cleanup(self) -> None:
        """Clean up all processes"""
        for name, process in self.processes:
            if process.poll() is None:
                print(f"Stopping {name}...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        print("👋 Goodbye!")


@click.command()
@click.option("--reset-db", is_flag=True, help="Reset the database")
def main(reset_db: bool) -> None:
    """Run Solicitor Brain in development mode"""
    if reset_db:
        print("🗑️  Resetting database...")
        # Add database reset logic here

    runner = DevRunner()
    runner.run()


if __name__ == "__main__":
    main()
