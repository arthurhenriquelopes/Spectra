import ctypes
import ctypes.wintypes as wintypes
from typing import Optional
from src.platform.win32_api import SW_HIDE, SW_SHOWNOACTIVATE, _user32
from src.platform.screen_share import _INDICATORS_LOWER, _SHARE_CLASSES_LOWER, _VERIFICATION_KEYWORDS_LOWER
import time
from threading import Thread

def set_window_handle(manager, window_handle: int):
    """Set the window handle for transparency operations"""
    manager.hwnd = window_handle
    if manager.is_windows and manager.hwnd:
        _enable_transparency(manager)
    
def _enable_transparency(manager):
    """Enable transparency capability for the window"""
    if not manager.is_windows or not manager.hwnd:
        return False
        
    try:
        ex_style = manager.GetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE)
        if not (ex_style & manager.WS_EX_LAYERED):
            new_style = ex_style | manager.WS_EX_LAYERED
            manager.SetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE, new_style)
        return True
    except Exception as e:
        print(f"Error enabling transparency: {e}")
        return False

def set_transparency(manager, transparency: float) -> bool:
    if not manager.is_windows or not manager.hwnd:
        print("Transparency not supported on this platform or no window handle")
        return False
        
    transparency = max(0.0, min(1.0, transparency))
    manager.current_transparency = transparency
    
    try:
        alpha = int(transparency * 255)
        result = manager.SetLayeredWindowAttributes(
            manager.hwnd,
            0,
            alpha,
            manager.LWA_ALPHA
        )
        
        if result:
            print(f"✅ Window transparency set to {transparency*100:.0f}%")
            return True
        else:
            print("❌ Failed to set window transparency")
            return False
            
    except Exception as e:
        print(f"❌ Error setting transparency: {e}")
        return False

def get_transparency(manager) -> float:
    return manager.current_transparency

def set_transparency_percent(manager, percent: int) -> bool:
    transparency = percent / 100.0
    return set_transparency(manager, transparency)

def make_transparent(manager) -> bool:
    return set_transparency(manager, 0.4)

def make_semi_transparent(manager) -> bool:
    return set_transparency(manager, 0.7)

def make_opaque(manager) -> bool:
    return set_transparency(manager, 1.0)

def find_window_by_title(manager, title: str) -> Optional[int]:
    if not manager.is_windows:
        return None
        
    try:
        FindWindowW = manager.user32.FindWindowW
        FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
        FindWindowW.restype = wintypes.HWND
        
        hwnd = FindWindowW(None, title)
        if hwnd:
            set_window_handle(manager, hwnd)
            return hwnd
        return None
    except Exception as e:
        print(f"Error finding window: {e}")
        return None

def set_always_on_top(manager, on_top: bool) -> bool:
    if not manager.is_windows or not manager.hwnd:
        print("Always on top not supported on this platform or no window handle")
        return False
        
    try:
        print(f"🔧 Attempting to set always on top: {on_top}, HWND: {manager.hwnd}")
        
        hwnd_insert_after = manager.HWND_TOPMOST if on_top else manager.HWND_NOTOPMOST
        
        result = manager.SetWindowPos(
            manager.hwnd,
            hwnd_insert_after,
            0, 0, 0, 0,
            manager.SWP_NOMOVE | manager.SWP_NOSIZE
        )
        
        if result:
            status = "on top" if on_top else "normal"
            print(f"✅ Window set to {status}")
            return True
        else:
            error_code = ctypes.windll.kernel32.GetLastError()
            print(f"❌ SetWindowPos failed (Error {error_code}), trying alternative method...")
            return _set_always_on_top_alternative(manager, on_top)
            
    except Exception as e:
        print(f"❌ Error setting always on top: {e}")
        return False

def _set_always_on_top_alternative(manager, on_top: bool) -> bool:
    try:
        ex_style = manager.GetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE)
        
        if on_top:
            new_style = ex_style | manager.WS_EX_TOPMOST
        else:
            new_style = ex_style & ~manager.WS_EX_TOPMOST
        
        result = manager.SetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE, new_style)
        
        if result or ex_style != new_style:
            manager.user32.SetWindowPos(
                manager.hwnd, 0, 0, 0, 0, 0,
                manager.SWP_NOMOVE | manager.SWP_NOSIZE | 0x0020
            )
            status = "on top" if on_top else "normal"
            print(f"✅ Window set to {status} (alternative method)")
            return True
        else:
            print("❌ Alternative method also failed")
            return False
            
    except Exception as e:
        print(f"❌ Error in alternative always-on-top method: {e}")
        return False

def set_ghost_mode(manager, enabled: bool):
    if not manager.is_windows or not manager.hwnd:
        return

    try:
        current_style = manager.GetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE)
        if enabled:
            new_style = current_style | manager.WS_EX_TRANSPARENT
            print("👻 Ghost Mode Enabled (click-through)")
        else:
            new_style = current_style & ~manager.WS_EX_TRANSPARENT
            print("🖱️ Ghost Mode Disabled (normal interaction)")

        manager.SetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE, new_style)
        manager.is_ghost_mode = enabled
        
        set_always_on_top(manager, True)
        
    except Exception as e:
        print(f"❌ Error setting ghost mode: {e}")

def toggle_ghost_mode(manager):
    set_ghost_mode(manager, not manager.is_ghost_mode)

def enable_proctoring_stealth_mode(manager):
    if not manager.is_windows or not manager.hwnd:
        print("❌ Proctoring stealth mode requires Windows and valid window handle")
        return False
    
    try:
        print("🎯 Enabling PROCTORING STEALTH MODE...")
        set_ghost_mode(manager, True)
        hide_from_taskbar(manager)
        set_always_on_top(manager, True)
        set_transparency(manager, 0.7)
        
        print("✅ PROCTORING STEALTH MODE ENABLED")
        print("   🚨 IMPORTANT: Use ONLY global hotkeys to interact:")
        print("   📌 Alt+Z: Toggle visibility (no focus change)")
        print("   📌 Alt+X: Toggle ghost mode")
        print("   📌 Alt+1/2/3: Adjust transparency")
        print("   📌 DO NOT click on the window - it will trigger focus detection!")
        return True
        
    except Exception as e:
        print(f"❌ Error enabling proctoring stealth mode: {e}")
        return False

def move_window(manager, dx: int, dy: int) -> bool:
    if not manager.is_windows or not manager.hwnd:
        print("❌ Window movement requires Windows and valid window handle")
        return False
    
    try:
        rect = manager.RECT()
        if not manager.GetWindowRect(manager.hwnd, ctypes.byref(rect)):
            print("❌ Failed to get current window position")
            return False
        
        new_x = rect.left + dx
        new_y = rect.top + dy
        
        result = manager.SetWindowPos(
            manager.hwnd,
            0,
            new_x, new_y,
            0, 0,
            manager.SWP_NOSIZE | manager.SWP_NOACTIVATE | manager.SWP_NOZORDER
        )
        
        if result:
            direction = ""
            if dx > 0: direction += f"right {dx}px "
            elif dx < 0: direction += f"left {abs(dx)}px "
            if dy > 0: direction += f"down {dy}px"
            elif dy < 0: direction += f"up {abs(dy)}px"
            
            print(f"🎯 Window moved {direction.strip()} (stealth - no focus change)")
            return True
        else:
            print("❌ Failed to move window")
            return False
            
    except Exception as e:
        print(f"❌ Error moving window: {e}")
        return False

def toggle_visibility(manager):
    if not manager.is_windows or not manager.hwnd:
        print("Window visibility control not supported or no window handle.")
        return

    if _user32.IsWindowVisible(manager.hwnd):
        _user32.ShowWindow(manager.hwnd, SW_HIDE)
        print("🕵️‍ Window hidden via global hotkey.")
    else:
        _user32.ShowWindow(manager.hwnd, SW_SHOWNOACTIVATE)
        print("✨ Window shown via global hotkey (stealth - no focus change).")
        set_always_on_top(manager, True)

def hide_from_taskbar(manager) -> bool:
    if not manager.is_windows or not manager.hwnd:
        print("Cannot hide from taskbar: Not on Windows or no window handle")
        return False
    try:
        ex_style = manager.GetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE)
        new_style = (ex_style | manager.WS_EX_TOOLWINDOW) & ~0x40000
        manager.SetWindowLongPtr(manager.hwnd, manager.GWL_EXSTYLE, new_style)
        print("✅ Window hidden from taskbar")
        return True
    except Exception as e:
        print(f"❌ Error hiding from taskbar: {e}")
        return False

def get_window_info(manager) -> dict:
    return {
        "transparency": manager.current_transparency,
        "transparency_percent": int(manager.current_transparency * 100),
        "is_transparent": manager.current_transparency < 1.0,
        "platform_supported": manager.is_windows,
        "window_handle": manager.hwnd,
        "screen_share_monitor_active": manager.screen_share_monitor_active,
        "hidden_screen_share_windows": len(manager.hidden_screen_share_windows)
    }

def find_screen_share_indicators(manager) -> list:
    if not manager.is_windows:
        return []
    
    found_windows = []
    
    def enum_windows_callback(hwnd, lparam):
        try:
            title_buffer = ctypes.create_unicode_buffer(512)
            title_length = manager.GetWindowTextW(hwnd, title_buffer, 512)
            title = title_buffer.value if title_length > 0 else ""
            
            class_buffer = ctypes.create_unicode_buffer(256)
            class_length = manager.GetClassNameW(hwnd, class_buffer, 256)
            class_name = class_buffer.value if class_length > 0 else ""
            
            is_indicator = False
            title_lower = title.lower()
            for indicator_text in _INDICATORS_LOWER:
                if indicator_text in title_lower:
                    is_indicator = True
                    break
            
            if not is_indicator:
                class_name_lower = class_name.lower()
                for share_class in _SHARE_CLASSES_LOWER:
                    if share_class in class_name_lower:
                        if any(keyword in title_lower for keyword in _VERIFICATION_KEYWORDS_LOWER):
                            is_indicator = True
                            break
            
            if is_indicator and _user32.IsWindowVisible(hwnd):
                found_windows.append({
                    'hwnd': hwnd,
                    'title': title,
                    'class': class_name
                })
                print(f"🔍 Found screen share indicator: '{title}' (Class: {class_name})")
            
        except Exception as e:
            pass
        
        return True
    
    try:
        callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        callback = callback_type(enum_windows_callback)
        manager.EnumWindows(callback, 0)
    except Exception as e:
        print(f"❌ Error enumerating windows: {e}")
    
    return found_windows

def hide_screen_share_indicator(manager, hwnd: int) -> bool:
    if not manager.is_windows:
        return False
    
    try:
        result = _user32.ShowWindow(hwnd, SW_HIDE)
        if result:
            print(f"✅ Hidden screen share indicator (HWND: {hex(hwnd)})")
            manager.hidden_screen_share_windows.add(hwnd)
            return True
        
        try:
            manager.SetWindowPos(
                hwnd, 0, 
                -10000, -10000,
                0, 0,
                manager.SWP_NOSIZE
            )
            print(f"✅ Moved screen share indicator off-screen (HWND: {hex(hwnd)})")
            return True
        except:
            pass
        
        try:
            _user32.ShowWindow(hwnd, 6)
            print(f"✅ Minimized screen share indicator (HWND: {hex(hwnd)})")
            return True
        except:
            pass
            
        print(f"❌ Failed to hide screen share indicator (HWND: {hex(hwnd)})")
        return False
        
    except Exception as e:
        print(f"❌ Error hiding screen share indicator: {e}")
        return False

def hide_all_screen_share_indicators(manager) -> int:
    if not manager.is_windows:
        return 0
    
    indicators = find_screen_share_indicators(manager)
    hidden_count = 0
    
    for indicator in indicators:
        hwnd = indicator['hwnd']
        if hwnd not in manager.hidden_screen_share_windows:
            if hide_screen_share_indicator(manager, hwnd):
                hidden_count += 1
    
    if hidden_count > 0:
        print(f"🕵️ Successfully hidden {hidden_count} screen sharing indicator(s)")
    
    return hidden_count

def start_screen_share_monitor(manager):
    from src.platform.win32_api import SCREEN_SHARE_SCAN_INTERVAL_S
    if not manager.is_windows or manager.screen_share_monitor_active:
        return
    
    print("🔍 Starting screen sharing indicator monitor...")
    manager.screen_share_monitor_active = True
    
    def monitor_thread():
        while manager.screen_share_monitor_active:
            try:
                hide_all_screen_share_indicators(manager)
                time.sleep(SCREEN_SHARE_SCAN_INTERVAL_S)
            except Exception as e:
                print(f"❌ Error in screen share monitor: {e}")
                time.sleep(2.0)
    
    monitor = Thread(target=monitor_thread, daemon=True)
    monitor.start()
    print("✅ Screen sharing indicator monitor started")

def stop_screen_share_monitor(manager):
    if manager.screen_share_monitor_active:
        manager.screen_share_monitor_active = False
        print("🛑 Screen sharing indicator monitor stopped")
