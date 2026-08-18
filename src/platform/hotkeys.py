from threading import Thread
from pynput import keyboard
import time
import os
import json
import tempfile
from datetime import datetime
from src.platform.win32_api import SCROLL_AMOUNT_PX, SCROLL_INTERVAL_MS

def _write_command_file(manager, command_data: dict):
    """Write command to temp file for inter-process communication"""
    temp_dir = tempfile.gettempdir()
    command_file = os.path.join(temp_dir, "spectra_command.json")
    
    with open(command_file, "w") as f:
        json.dump(command_data, f)
    
    print(f"📄 Command written to: {command_file}")

def send_preset_switch_signal(manager, preset_key: str):
    """Send preset switch signal to the application"""
    try:
        print(f"🔄 Global hotkey triggered: Switching to {preset_key} preset")
        _write_command_file(manager, {
            "command": "switch_preset",
            "preset_key": preset_key,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending preset switch signal: {e}")

def send_vision_command(manager, command: str):
    """Send vision-related command to the application"""
    try:
        print(f"👁️ Global hotkey triggered: {command}")
        _write_command_file(manager, {
            "command": command,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending vision command: {e}")

def send_transparency_command(manager, level: str):
    """Send transparency command to the application"""
    try:
        print(f"🔍 Global hotkey triggered: set_transparency_{level}")
        _write_command_file(manager, {
            "command": "set_transparency",
            "level": level,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending transparency command: {e}")

def send_audio_command(manager, command: str):
    """Send audio-related command to the application"""
    try:
        print(f"🎤 Global hotkey triggered: {command}")
        _write_command_file(manager, {
            "command": command,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending audio command: {e}")

def send_context_aware_command(manager, command: str):
    """Send command for context-aware actions like auto-selecting presets."""
    try:
        print(f"🔄 Global hotkey triggered: {command}")
        _write_command_file(manager, {
            "command": "context_aware_action",
            "action": command,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending context-aware command: {e}")

def send_vision_switch_command(manager, command: str):
    """Send command to switch vision model"""
    try:
        print(f"👁️ Global hotkey triggered: {command}")
        _write_command_file(manager, {
            "command": command,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending vision switch command: {e}")

def send_interview_command(manager, command: str):
    """Send interview-related command to the application"""
    try:
        print(f"🎤 Global hotkey triggered: {command}")
        _write_command_file(manager, {
            "command": command,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending interview command: {e}")

def send_scroll_command(manager, direction: str):
    """Send scroll command to the application"""
    try:
        print(f"📜 Global hotkey triggered: scroll_{direction} ({SCROLL_AMOUNT_PX}px)")
        _write_command_file(manager, {
            "command": "scroll",
            "direction": direction,
            "amount": SCROLL_AMOUNT_PX,
            "timestamp": datetime.now().isoformat(),
            "source": "global_hotkey"
        })
    except Exception as e:
        print(f"❌ Error sending scroll command: {e}")

def _continuous_scroll_loop(manager):
    """Continuous scrolling loop that runs while scroll keys are held"""
    while manager.scrolling_up or manager.scrolling_down:
        try:
            if manager.scrolling_up:
                send_scroll_command(manager, "up")
            elif manager.scrolling_down:
                send_scroll_command(manager, "down")
            
            time.sleep(SCROLL_INTERVAL_MS / 1000)
        except Exception as e:
            print(f"❌ Error in continuous scroll loop: {e}")
            break
    
    manager.scroll_thread = None
    print("🔄 Continuous scroll loop ended")

def _start_continuous_scrolling(manager):
    """Start the continuous scrolling thread if not already running"""
    if manager.scroll_thread is None or not manager.scroll_thread.is_alive():
        manager.scroll_thread = Thread(target=lambda: _continuous_scroll_loop(manager), daemon=True)
        manager.scroll_thread.start()
        print("🔄 Started continuous scroll loop")

def _start_hotkey_listener_thread(manager):
    """The actual listener thread for global hotkeys."""
    print("🎧 Starting global hotkey listener thread...")

    def on_hide_show():
        manager.toggle_visibility()
        return False

    def on_toggle_ghost():
        manager.toggle_ghost_mode()
        return False

    def on_toggle_vision_mode():
        send_vision_command(manager, "toggle_vision_mode")
        return False

    def on_capture_screenshot():
        send_vision_command(manager, "capture_screenshot")
        return False

    def on_process_screenshots():
        send_vision_command(manager, "process_screenshots")
        return False

    def on_switch_primary():
        send_preset_switch_signal(manager, "primary")
        return False

    def on_switch_secondary():
        send_preset_switch_signal(manager, "secondary")
        return False

    def on_auto_select():
        send_context_aware_command(manager, "auto_select_preset")
        return False

    def on_switch_vision_model():
        send_vision_switch_command(manager, "switch_vision_model")
        return False

    def on_transparency_transparent():
        send_transparency_command(manager, "transparent")
        return False

    def on_transparency_semi():
        send_transparency_command(manager, "semi")
        return False

    def on_transparency_opaque():
        send_transparency_command(manager, "opaque")
        return False

    def on_toggle_mic_mute():
        send_audio_command(manager, "toggle_mic_mute")
        return False

    def on_toggle_universal_mute():
        send_audio_command(manager, "toggle_universal_mute")
        return False

    def on_reset_screenshot_queue():
        send_vision_command(manager, "reset_screenshot_queue")
        return False

    def on_enable_proctoring_stealth():
        manager.enable_proctoring_stealth_mode()
        return False

    def on_move_left():
        manager.move_window(-20, 0)
        return False

    def on_move_right():
        manager.move_window(20, 0)
        return False

    def on_move_up():
        manager.move_window(0, -20)
        return False

    def on_move_down():
        manager.move_window(0, 20)
        return False

    def on_reset_interview():
        send_interview_command(manager, "reset_interview")
        return False

    def on_scroll_up_start():
        if not manager.scrolling_up:
            manager.scrolling_up = True
            _start_continuous_scrolling(manager)
            print("🔼 Starting continuous scroll up")
        return False

    def on_scroll_down_start():
        if not manager.scrolling_down:
            manager.scrolling_down = True
            _start_continuous_scrolling(manager)
            print("🔽 Starting continuous scroll down")
        return False

    def start_release_listener():
        def on_key_release(key):
            try:
                if key == keyboard.Key.up and manager.scrolling_up:
                    manager.scrolling_up = False
                    print("🛑 Stopped continuous scroll up")
                elif key == keyboard.Key.down and manager.scrolling_down:
                    manager.scrolling_down = False
                    print("🛑 Stopped continuous scroll down")
            except:
                pass

        def on_key_press(key):
            pass

        release_listener = keyboard.Listener(
            on_press=on_key_press,
            on_release=on_key_release,
            suppress=False
        )
        release_listener.start()
        release_listener.join()

    release_thread = Thread(target=start_release_listener, daemon=True)
    release_thread.start()

    hotkey_map = {
        '<alt>+x': on_toggle_ghost,
        '<alt>+z': on_hide_show,
        '<alt>+v': on_toggle_vision_mode,
        '<alt>+s': on_capture_screenshot,
        '<alt>+p': on_process_screenshots,
        '<alt>+r': on_reset_screenshot_queue,
        '<alt>+q': on_switch_primary,
        '<alt>+w': on_switch_secondary,
        '<alt>+e': on_auto_select,
        '<alt>+t': on_switch_vision_model,
        '<alt>+m': on_toggle_mic_mute,
        '<alt>+u': on_toggle_universal_mute,
        '<alt>+1': on_transparency_transparent,
        '<alt>+2': on_transparency_semi,
        '<alt>+3': on_transparency_opaque,
        '<alt>+<shift>+s': on_enable_proctoring_stealth,
        '<alt>+<left>': on_move_left,
        '<alt>+<right>': on_move_right,
        '<alt>+i': on_move_up,
        '<alt>+j': on_move_down,
        '<alt>+o': on_reset_interview,
        '<alt>+<up>': on_scroll_up_start,
        '<alt>+<down>': on_scroll_down_start,
    }
    
    with keyboard.GlobalHotKeys(hotkey_map) as h:
        h.join()

def start_hotkey_listener(manager):
    """Starts the global hotkey listener in a separate thread."""
    if not manager.is_windows:
        print("Global hotkeys not supported on this platform.")
        return

    print("🚀 Initializing global hotkey listener...")
    print("   Alt+X: Toggle ghost mode (click-through)")
    print("   Alt+Z: Toggle window visibility (stealth - no focus)")
    print("   Alt+Left/Right Arrow: Move window left/right (stealth - no focus)")
    print("   Alt+I: Move window up (stealth - no focus)")
    print("   Alt+J: Move window down (stealth - no focus)")
    print("   Alt+Up Arrow: Continuous scroll up (hold for continuous)")
    print("   Alt+Down Arrow: Continuous scroll down (hold for continuous)")
    print("   Alt+V: Toggle vision mode")
    print("   Alt+S: Capture screenshot")
    print("   Alt+P: Process screenshots with AI")
    print("   Alt+R: Reset screenshot queue")
    print("   Alt+O: Reset interview session")
    print("   Alt+Q: Switch to primary AI preset")
    print("   Alt+W: Switch to secondary AI preset")
    print("   Alt+E: Auto-select best AI preset")
    print("   Alt+T: Switch vision model")
    print("   Alt+M: Toggle microphone mute")
    print("   Alt+U: Toggle universal mute (pause)")
    print("   Alt+1: Set transparent (40% opacity)")
    print("   Alt+2: Set semi-transparent (70% opacity)")
    print("   Alt+3: Set opaque (100% opacity)")
    print("   Alt+Shift+S: Enable proctoring stealth mode")
    
    if not manager.hwnd:
        if not manager.find_window_by_title("Spectra"):
             print("❌ Cannot start hotkey listener: Spectra window not found.")
             return
    
    listener_thread = Thread(target=lambda: _start_hotkey_listener_thread(manager), daemon=True)
    listener_thread.start()
