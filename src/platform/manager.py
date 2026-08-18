import platform
import ctypes
import ctypes.wintypes as wintypes
from typing import Optional

import src.platform.window_controls as wc
import src.platform.hotkeys as hk

class WindowManager:
    def __init__(self):
        self.hwnd: Optional[int] = None
        self.is_windows = platform.system() == "Windows"
        self.current_transparency = 1.0
        self.is_ghost_mode = False
        self.screen_share_monitor_active = False
        self.hidden_screen_share_windows = set()
        
        # Continuous scrolling state
        self.scrolling_up = False
        self.scrolling_down = False
        self.scroll_thread = None
        self.hotkey_listener = None
        self.alt_pressed = False

        if self.is_windows:
            self._setup_win32_api_definitions()

    def _setup_win32_api_definitions(self):
        """Defines all necessary Win32 API functions, constants, and types."""
        # Constants
        self.GWL_EXSTYLE = -20
        self.WS_EX_LAYERED = 0x80000
        self.WS_EX_TOPMOST = 0x8
        self.WS_EX_TRANSPARENT = 0x20
        self.WS_EX_TOOLWINDOW = 0x80
        self.LWA_ALPHA = 0x2
        self.HWND_TOPMOST = -1
        self.HWND_NOTOPMOST = -2
        self.SWP_NOMOVE = 0x2
        self.SWP_NOSIZE = 0x1
        self.SWP_NOACTIVATE = 0x10
        self.SWP_NOZORDER = 0x4

        self.user32 = ctypes.windll.user32
        
        is_64bit = platform.architecture()[0] == '64bit'
        if is_64bit:
            self.GetWindowLongPtr = self.user32.GetWindowLongPtrW
            self.SetWindowLongPtr = self.user32.SetWindowLongPtrW
        else:
            self.GetWindowLongPtr = self.user32.GetWindowLongW
            self.SetWindowLongPtr = self.user32.SetWindowLongW

        self.GetWindowLongPtr.restype = wintypes.LPARAM
        self.GetWindowLongPtr.argtypes = [wintypes.HWND, ctypes.c_int]
        self.SetWindowLongPtr.restype = wintypes.LPARAM
        self.SetWindowLongPtr.argtypes = [wintypes.HWND, ctypes.c_int, wintypes.LPARAM]

        self.SetLayeredWindowAttributes = self.user32.SetLayeredWindowAttributes
        self.SetLayeredWindowAttributes.argtypes = [wintypes.HWND, wintypes.COLORREF, wintypes.BYTE, wintypes.DWORD]
        self.SetLayeredWindowAttributes.restype = wintypes.BOOL

        self.SetWindowPos = self.user32.SetWindowPos
        self.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
        self.SetWindowPos.restype = wintypes.BOOL

        self.EnumWindows = self.user32.EnumWindows
        self.EnumWindows.argtypes = [ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM), wintypes.LPARAM]
        self.EnumWindows.restype = wintypes.BOOL

        self.GetWindowTextW = self.user32.GetWindowTextW
        self.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
        self.GetWindowTextW.restype = ctypes.c_int

        self.GetClassNameW = self.user32.GetClassNameW
        self.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
        self.GetClassNameW.restype = ctypes.c_int

        class RECT(ctypes.Structure):
            _fields_ = [
                ("left", ctypes.c_long),
                ("top", ctypes.c_long),
                ("right", ctypes.c_long),
                ("bottom", ctypes.c_long)
            ]
        
        self.RECT = RECT

        self.GetWindowRect = self.user32.GetWindowRect
        self.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(RECT)]
        self.GetWindowRect.restype = wintypes.BOOL

    # Window Controls Delegation
    def set_window_handle(self, window_handle: int):
        return wc.set_window_handle(self, window_handle)
        
    def _enable_transparency(self):
        return wc._enable_transparency(self)
        
    def set_transparency(self, transparency: float) -> bool:
        return wc.set_transparency(self, transparency)
        
    def get_transparency(self) -> float:
        return wc.get_transparency(self)
        
    def set_transparency_percent(self, percent: int) -> bool:
        return wc.set_transparency_percent(self, percent)
        
    def make_transparent(self) -> bool:
        return wc.make_transparent(self)
        
    def make_semi_transparent(self) -> bool:
        return wc.make_semi_transparent(self)
        
    def make_opaque(self) -> bool:
        return wc.make_opaque(self)
        
    def find_window_by_title(self, title: str) -> Optional[int]:
        return wc.find_window_by_title(self, title)
        
    def set_always_on_top(self, on_top: bool) -> bool:
        return wc.set_always_on_top(self, on_top)
        
    def _set_always_on_top_alternative(self, on_top: bool) -> bool:
        return wc._set_always_on_top_alternative(self, on_top)
        
    def set_ghost_mode(self, enabled: bool):
        return wc.set_ghost_mode(self, enabled)
        
    def toggle_ghost_mode(self):
        return wc.toggle_ghost_mode(self)
        
    def enable_proctoring_stealth_mode(self):
        return wc.enable_proctoring_stealth_mode(self)
        
    def move_window(self, dx: int, dy: int) -> bool:
        return wc.move_window(self, dx, dy)
        
    def toggle_visibility(self):
        return wc.toggle_visibility(self)
        
    def hide_from_taskbar(self) -> bool:
        return wc.hide_from_taskbar(self)
        
    def get_window_info(self) -> dict:
        return wc.get_window_info(self)
        
    def find_screen_share_indicators(self) -> list:
        return wc.find_screen_share_indicators(self)
        
    def hide_screen_share_indicator(self, hwnd: int) -> bool:
        return wc.hide_screen_share_indicator(self, hwnd)
        
    def hide_all_screen_share_indicators(self) -> int:
        return wc.hide_all_screen_share_indicators(self)
        
    def start_screen_share_monitor(self):
        return wc.start_screen_share_monitor(self)
        
    def stop_screen_share_monitor(self):
        return wc.stop_screen_share_monitor(self)

    # Hotkeys Delegation
    def _write_command_file(self, command_data: dict):
        return hk._write_command_file(self, command_data)
        
    def send_preset_switch_signal(self, preset_key: str):
        return hk.send_preset_switch_signal(self, preset_key)
        
    def send_vision_command(self, command: str):
        return hk.send_vision_command(self, command)
        
    def send_transparency_command(self, level: str):
        return hk.send_transparency_command(self, level)
        
    def send_audio_command(self, command: str):
        return hk.send_audio_command(self, command)
        
    def send_context_aware_command(self, command: str):
        return hk.send_context_aware_command(self, command)
        
    def send_vision_switch_command(self, command: str):
        return hk.send_vision_switch_command(self, command)
        
    def send_interview_command(self, command: str):
        return hk.send_interview_command(self, command)
        
    def send_scroll_command(self, direction: str):
        return hk.send_scroll_command(self, direction)
        
    def _continuous_scroll_loop(self):
        return hk._continuous_scroll_loop(self)
        
    def _start_continuous_scrolling(self):
        return hk._start_continuous_scrolling(self)
        
    def _start_hotkey_listener_thread(self):
        return hk._start_hotkey_listener_thread(self)
        
    def start_hotkey_listener(self):
        return hk.start_hotkey_listener(self)

# Global instance
window_manager = WindowManager()

# Convenience functions for easy use
def set_app_transparency(transparency: float) -> bool:
    return window_manager.set_transparency(transparency)

def set_app_transparency_percent(percent: int) -> bool:
    return window_manager.set_transparency_percent(percent)

def make_app_transparent() -> bool:
    return window_manager.make_transparent()

def make_app_semi_transparent() -> bool:
    return window_manager.make_semi_transparent()

def make_app_opaque() -> bool:
    return window_manager.make_opaque()

def find_aura_window() -> bool:
    hwnd = window_manager.find_window_by_title("Spectra")
    return hwnd is not None

def set_app_always_on_top(on_top: bool) -> bool:
    return window_manager.set_always_on_top(on_top)

def get_transparency_info() -> dict:
    return window_manager.get_window_info()

def hide_screen_share_indicators() -> int:
    return window_manager.hide_all_screen_share_indicators()

def start_screen_share_monitor():
    window_manager.start_screen_share_monitor()

def stop_screen_share_monitor():
    window_manager.stop_screen_share_monitor()

def enable_proctoring_stealth_mode():
    return window_manager.enable_proctoring_stealth_mode()

def move_window(dx: int, dy: int) -> bool:
    return window_manager.move_window(dx, dy)

def test_screen_share_detection():
    print("🔍 Testing screen share indicator detection...")
    indicators = window_manager.find_screen_share_indicators()
    
    if not indicators:
        print("✅ No screen sharing indicators currently detected")
        return []
    
    print(f"🚨 Found {len(indicators)} screen sharing indicator(s):")
    for i, indicator in enumerate(indicators, 1):
        print(f"   {i}. Title: '{indicator['title']}'")
        print(f"      Class: '{indicator['class']}'") 
        print(f"      HWND: {hex(indicator['hwnd'])}")
        print()
    
    return indicators
