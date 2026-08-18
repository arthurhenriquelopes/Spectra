import os
import tempfile
import threading
import time
import asyncio
import aiofiles
import orjson
import webview

class GlobalCommandMonitor:
    """Monitors the temp command file for global hotkey commands"""
    
    def __init__(self):
        self.command_file = os.path.join(tempfile.gettempdir(), "spectra_command.json")
        self.last_command_time = 0
        self.running = False
        self.websocket_manager = None
        self.startup_time = time.time()
        self.startup_delay = 5  # Ignore commands for first 5 seconds after startup
        self.last_processed_command = None
        self.command_cooldown = 0.5  # 500ms cooldown between same commands
        self._monitor_task = None
        
    def set_websocket_manager(self, ws_manager):
        """Set the websocket manager for sending commands"""
        self.websocket_manager = ws_manager
        
    async def start_monitoring(self):
        """Start the command monitoring task"""
        # Clean up any old command files
        try:
            if os.path.exists(self.command_file):
                os.remove(self.command_file)
                print("🧹 Cleared old global command file")
        except Exception as e:
            print(f"⚠️ Could not clear old command file: {e}")
        
        self.running = True
        self._monitor_task = asyncio.create_task(self._async_monitor_loop())
        print("🎮 Global command monitor started")
        
    async def stop_monitoring(self):
        """Stop the command monitoring"""
        self.running = False
        if self._monitor_task and not self._monitor_task.done():
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        print("🎮 Global command monitor stopped")
    
    async def _async_monitor_loop(self):
        """Async monitoring loop that checks for commands with improved performance"""
        while self.running:
            try:
                if os.path.exists(self.command_file):
                    # Check file modification time
                    file_mtime = os.path.getmtime(self.command_file)
                    
                    if file_mtime > self.last_command_time:
                        self.last_command_time = file_mtime
                        
                        # Read and process the command using async file I/O
                        try:
                            async with aiofiles.open(self.command_file, 'rb') as f:
                                file_content = await f.read()
                                command_data = orjson.loads(file_content)
                            
                            # Process the command
                            if self._process_command(command_data):
                                # Clean up the command file after successful processing
                                try:
                                    os.remove(self.command_file)
                                    print(f"🧹 Cleaned up command file after processing")
                                except Exception as cleanup_error:
                                    # Don't fail if cleanup fails
                                    pass
                            
                        except (orjson.JSONDecodeError, IOError) as e:
                            # Ignore file read errors (file might be being written)
                            pass
                            
                await asyncio.sleep(0.2)  # Check every 200ms (reduced frequency)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ Error in command monitor: {e}")
                await asyncio.sleep(1)  # Wait longer on error
                
    def _process_command(self, command_data):
        """Process a command from the global hotkey"""
        command = command_data.get('command', '')
        source = command_data.get('source', '')
        timestamp_str = command_data.get('timestamp', '')
        
        if source != 'global_hotkey':
            return False  # Only process global hotkey commands
        
        # Ignore commands during startup to prevent processing old/accidental commands
        if time.time() - self.startup_time < self.startup_delay:
            print(f"🎮 Ignoring global command during startup: {command}")
            return False
        
        # Create a unique command identifier for deduplication
        command_id = f"{command}_{command_data.get('level', '')}_{command_data.get('preset_key', '')}_{command_data.get('direction', '')}"
        current_time = time.time()
        
        # Check for duplicate commands within cooldown period
        if (self.last_processed_command and 
            self.last_processed_command['id'] == command_id and 
            current_time - self.last_processed_command['time'] < self.command_cooldown):
            print(f"🎮 Ignoring duplicate command within cooldown: {command}")
            return False
        
        # Update last processed command
        self.last_processed_command = {
            'id': command_id,
            'time': current_time,
            'command': command
        }
            
        print(f"🎮 Processing global command: {command}")
        
        # Execute the command by sending it to the browser
        try:
            if command == 'toggle_vision_mode':
                self._execute_browser_command('if (window.toggleVisionMode) { window.toggleVisionMode(); } else { console.warn("toggleVisionMode not available"); }')
            elif command == 'capture_screenshot':
                self._execute_browser_command('if (window.captureScreenshot) { window.captureScreenshot(); } else { console.warn("captureScreenshot not available"); }')
            elif command == 'process_screenshots':
                self._execute_browser_command('if (window.processScreenshots) { window.processScreenshots(); } else { console.warn("processScreenshots not available"); }')
            elif command == 'reset_screenshot_queue':
                self._execute_browser_command('if (window.resetScreenshotQueue) { window.resetScreenshotQueue(); } else { console.warn("resetScreenshotQueue not available"); }')
            elif command == 'switch_preset':
                preset_key = command_data.get('preset_key', 'primary')
                self._execute_browser_command(f'if (window.switchPreset) {{ window.switchPreset("{preset_key}"); }} else {{ console.warn("switchPreset not available"); }}')
            elif command == 'set_transparency':
                transparency_level = command_data.get('level', 'opaque')
                self._execute_browser_command(f'if (window.setTransparency) {{ window.setTransparency("{transparency_level}"); }} else {{ console.warn("setTransparency not available"); }}')
            elif command == 'toggle_mic_mute':
                self._execute_browser_command('if (window.toggleMicMute) { window.toggleMicMute(); } else { console.warn("toggleMicMute not available"); }')
            elif command == 'toggle_universal_mute':
                self._execute_browser_command('if (window.toggleUniversalMute) { window.toggleUniversalMute(); } else { console.warn("toggleUniversalMute not available"); }')
            elif command == 'switch_vision_model':
                self._execute_browser_command('if (window.switchVisionModel) { window.switchVisionModel(); } else { console.warn("switchVisionModel not available"); }')
            elif command == 'reset_interview':
                self._execute_browser_command('if (window.resetInterview) { window.resetInterview(); } else { console.warn("resetInterview not available"); }')
            elif command == 'scroll':
                direction = command_data.get('direction', 'down')
                amount = command_data.get('amount', 150)
                # Use smooth scrolling with the specified amount
                if direction == 'up':
                    scroll_amount = -amount
                else:
                    scroll_amount = amount
                js_code = f'document.getElementById("conversation-stream").scrollBy({{ top: {scroll_amount}, left: 0, behavior: "smooth" }})'
                self._execute_browser_command(js_code)
            elif command == 'context_aware_action':
                action = command_data.get('action', '')
                if action == 'auto_select_preset':
                    # Auto-select AI preset
                    self._execute_browser_command('if (window.switchPreset) { window.switchPreset("auto"); } else { console.warn("switchPreset not available"); }')
                else:
                    print(f"⚠️ Unknown context-aware action: {action}")
                    return False
            else:
                print(f"⚠️ Unknown global command: {command}")
                return False
                
            return True  # Command processed successfully
            
        except Exception as e:
            print(f"❌ Error executing global command: {e}")
            return False
            
    def _execute_browser_command(self, js_code):
        """Execute JavaScript code in the browser"""
        try:
            # Use webview's evaluate_js to run the command
            if hasattr(webview, 'windows') and webview.windows:
                window = webview.windows[0]  # Get the first (main) window
                
                # Add a small delay to ensure the page is loaded
                time.sleep(0.1)
                
                # Try to execute with error handling
                try:
                    result = window.evaluate_js(js_code)
                    print(f"✅ Executed global command in browser: {js_code.split('&&')[0]}...")
                except Exception as js_error:
                    # If direct execution fails, try wrapping in setTimeout
                    wrapped_code = f"setTimeout(() => {{ try {{ {js_code} }} catch(e) {{ console.warn('Global command error:', e); }} }}, 100);"
                    window.evaluate_js(wrapped_code)
                    print(f"✅ Executed global command in browser (delayed): {js_code.split('&&')[0]}...")
            else:
                print("⚠️ No webview window available for command execution")
        except Exception as e:
            print(f"❌ Failed to execute browser command: {e}")

command_monitor = GlobalCommandMonitor()
