import time
import ctypes
import ctypes.wintypes as wintypes
from typing import Optional

from src.platform.win32_api import _user32, WDA_EXCLUDEFROMCAPTURE, _HAS_GET_DISPLAY_AFFINITY
from src.platform.manager import window_manager

def apply_capture_protection(window):
    """
    Applies display affinity to exclude the window from screen capture.

    This function is the heart of the "stealth" feature. It first tries to get
    the window handle directly from a private pywebview attribute and, if that fails,
    falls back to searching for the window by its title.

    Args:
        window: The pywebview window object.
    """
    hwnd = None
    print("🛡️ APPLYING SCREEN CAPTURE PROTECTION...")

    # --- Method 1: Get handle from pywebview's private attribute ---
    hwnd = getattr(window, '_hwnd', None)
    print(f"🔍 Method 1 (window._hwnd): {hex(hwnd) if hwnd else 'Not found'}")

    # --- Method 2: Fallback to finding the window by title ---
    if not hwnd:
        print("⚠️ Private attribute not found, trying title search...")
        time.sleep(0.2)
        hwnd = _user32.FindWindowW(None, window.title)
        print(f"🔍 Method 2 (FindWindowW with title '{window.title}'): {hex(hwnd) if hwnd else 'Not found'}")

    # --- Method 3: Try multiple search attempts with delay ---
    if not hwnd:
        print("⚠️ Trying multiple search attempts...")
        for attempt in range(5):
            time.sleep(0.05)
            hwnd = _user32.FindWindowW(None, "Spectra")
            if hwnd:
                print(f"🔍 Method 3 (attempt {attempt + 1}): Found {hex(hwnd)}")
                break
        
    # --- Apply the Protection ---
    if not hwnd:
        print("❌ CRITICAL: Could not obtain window handle! Screen capture protection NOT applied!")
        print("   This means the window WILL be visible in screen recordings!")
        return False

    print(f"🛡️ Applying WDA_EXCLUDEFROMCAPTURE (0x{WDA_EXCLUDEFROMCAPTURE:08X}) to window {hex(hwnd)}...")
    success = _user32.SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)

    if success:
        print(f"✅ SUCCESS: Window {hex(hwnd)} is now HIDDEN from screen capture!")
        print("   🎯 Window will appear as BLACK RECTANGLE in recordings/screen sharing")
        
        # Set window handle and hide from taskbar
        window_manager.set_window_handle(hwnd)
        window_manager.hide_from_taskbar()
        
        # Start screen share indicator monitoring
        window_manager.start_screen_share_monitor()
        
        # Verify the protection was applied
        verify_protection(hwnd)
        return True
    else:
        error_code = ctypes.GetLastError()
        print(f"❌ FAILED: SetWindowDisplayAffinity failed! Error Code: {error_code}")
        print("   🚨 WARNING: Window WILL be visible in screen recordings!")
        return False

def verify_protection(hwnd) -> Optional[bool]:
    """Verify that capture protection is actually applied.

    Returns True when the window's display affinity reads back as
    WDA_EXCLUDEFROMCAPTURE, False when it reads back as something else, and
    None when verification was not possible (API unavailable, call failed, or
    an unexpected error). Diagnostic only - this never raises and the result
    can safely be ignored.
    """
    try:
        print(f"🔬 Verifying protection on window {hex(hwnd)}...")
        
        if _HAS_GET_DISPLAY_AFFINITY:
            affinity = wintypes.DWORD(0)
            if _user32.GetWindowDisplayAffinity(hwnd, ctypes.byref(affinity)):
                if affinity.value == WDA_EXCLUDEFROMCAPTURE:
                    print(f"✅ CONFIRMED: display affinity is WDA_EXCLUDEFROMCAPTURE (0x{affinity.value:08X})")
                    return True
                print(f"❌ MISMATCH: display affinity is 0x{affinity.value:08X}, expected 0x{WDA_EXCLUDEFROMCAPTURE:08X}")
                print("   🚨 WARNING: Window may still be visible in screen recordings!")
                return False
            print(f"⚠️ GetWindowDisplayAffinity failed (Error Code: {ctypes.GetLastError()}) - falling back to handle check")
        else:
            print("⚠️ GetWindowDisplayAffinity unavailable on this system - falling back to handle check")

        is_window_valid = _user32.IsWindow(hwnd)
        if is_window_valid:
            print("✅ Window handle is valid - protection likely applied")
        else:
            print("❌ Window handle is invalid - protection may have failed")
        return None
            
    except Exception as e:
        print(f"⚠️ Could not verify protection: {e}")
