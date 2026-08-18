import asyncio
import socket
import threading
import uvicorn

from src.app import app
from src.commands import command_monitor
from src.api.session import session_manager

def find_free_port(preferred: int = 8002) -> int:
    """Check if the preferred port is available; if not, find a free one."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', preferred))
            return preferred
        except OSError:
            pass
    # Preferred port is occupied — let the OS pick a free one
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    print(f"⚠️ Port {preferred} is busy, using port {port} instead")
    return port

class UvicornServer:
    """Manages the Uvicorn server as an asyncio task"""
    
    def __init__(self, app, host="127.0.0.1", port=None):
        self.app = app
        self.host = host
        self.port = port if port else find_free_port()
        self.server = None
        self.server_task = None
        
    async def start(self):
        """Start the Uvicorn server as an asyncio task"""
        config = uvicorn.Config(
            app=self.app,
            host=self.host,
            port=self.port,
            log_level="warning",
            loop="asyncio"
        )
        self.server = uvicorn.Server(config)
        self.server_task = asyncio.create_task(self.server.serve())
        print(f"🚀 Uvicorn server started on {self.host}:{self.port}")
        
    async def stop(self):
        """Stop the Uvicorn server gracefully"""
        if self.server:
            self.server.should_exit = True
            if self.server_task and not self.server_task.done():
                try:
                    await asyncio.wait_for(self.server_task, timeout=5.0)
                except asyncio.TimeoutError:
                    self.server_task.cancel()
                    try:
                        await self.server_task
                    except asyncio.CancelledError:
                        pass
        print("🛑 Uvicorn server stopped")

class AsyncioServiceThread:
    """Manages all asyncio services in a dedicated background thread"""
    
    def __init__(self, uvicorn_server, command_monitor):
        self.uvicorn_server = uvicorn_server
        self.command_monitor = command_monitor
        self.thread = None
        self.loop = None
        self.shutdown_event = None
        self.services_task = None
        
    def start(self):
        """Start the asyncio services in a background thread"""
        self.shutdown_event = threading.Event()
        self.thread = threading.Thread(target=self._run_asyncio_thread, daemon=True)
        self.thread.start()
        print("🚀 Asyncio services thread started")
        
    def stop(self):
        """Stop the asyncio services gracefully"""
        if self.shutdown_event:
            print("🛑 Requesting asyncio services shutdown...")
            self.shutdown_event.set()
            
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=10)  # Wait up to 10 seconds
            if self.thread.is_alive():
                print("⚠️ Asyncio thread did not stop gracefully")
            else:
                print("✅ Asyncio services thread stopped")
    
    def _run_asyncio_thread(self):
        """Run the asyncio event loop in this thread"""
        try:
            # Create a new event loop for this thread
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            
            print("🔄 Starting asyncio event loop in background thread")
            
            # Run the async services
            self.loop.run_until_complete(self._run_async_services())
            
        except Exception as e:
            print(f"❌ Error in asyncio thread: {e}")
        finally:
            if self.loop:
                try:
                    # Clean up any remaining tasks
                    pending = asyncio.all_tasks(self.loop)
                    if pending:
                        print(f"🧹 Cancelling {len(pending)} pending tasks...")
                        for task in pending:
                            task.cancel()
                        
                        # Wait for tasks to be cancelled
                        self.loop.run_until_complete(
                            asyncio.gather(*pending, return_exceptions=True)
                        )
                    
                    self.loop.close()
                    print("✅ Asyncio event loop closed")
                except Exception as e:
                    print(f"⚠️ Error during loop cleanup: {e}")
    
    async def _run_async_services(self):
        """Run all async services concurrently"""
        try:
            print("🚀 Starting async services...")
            
            # Start the Uvicorn server
            await self.uvicorn_server.start()
            
            # Start the session cleanup task
            session_manager.start_cleanup_task()
            
            # Start the global command monitor
            await self.command_monitor.start_monitoring()
            
            # Wait for shutdown signal
            while not self.shutdown_event.is_set():
                await asyncio.sleep(0.1)
            
            print("🛑 Shutdown signal received, cleaning up...")
            
        except Exception as e:
            print(f"❌ Error in async services: {e}")
        finally:
            # Cleanup
            await self._cleanup_async_services()
    
    async def _cleanup_async_services(self):
        """Clean up all async services"""
        print("🧹 Cleaning up async services...")
        
        # Stop the command monitor
        await self.command_monitor.stop_monitoring()
        
        # Stop the server
        await self.uvicorn_server.stop()
        
        print("✅ Async services cleanup complete")
