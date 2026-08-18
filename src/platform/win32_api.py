import os
import ctypes
import ctypes.wintypes as wintypes
from dotenv import dotenv_values

_ENV_FILE_VALUES = dotenv_values(".env")

def _env_setting(name: str, default, minimum, cast=int):
    """Resolve a numeric setting, falling back to the default when missing or malformed.

    Never raises: this module is imported from main.py before any UI exists, so a
    typo in .env must not take the whole app down.
    """
    raw = os.environ.get(name) or _ENV_FILE_VALUES.get(name)
    if not raw:
        return default
    try:
        value = cast(str(raw).strip())
    except (TypeError, ValueError):
        print(f"⚠️ Invalid {name}={raw!r} in .env, using default {default}")
        return default
    return value if value >= minimum else minimum

SCROLL_AMOUNT_PX = _env_setting("SCROLL_SPEED_PX", 200, 1)
SCROLL_INTERVAL_MS = _env_setting("SCROLL_INTERVAL_MS", 50, 10)
SCREEN_SHARE_SCAN_INTERVAL_S = _env_setting("SCREEN_SHARE_SCAN_INTERVAL_S", 1.0, 0.2, float)

# --- Win32 API Constants ---
WDA_EXCLUDEFROMCAPTURE = 0x00000011
SW_HIDE = 0
SW_SHOW = 5
SW_SHOWNOACTIVATE = 4

# Load the user32 library
_user32 = ctypes.windll.user32

# Define the function signature for SetWindowDisplayAffinity
_user32.SetWindowDisplayAffinity.restype  = wintypes.BOOL
_user32.SetWindowDisplayAffinity.argtypes = (wintypes.HWND, wintypes.DWORD)

# Define the function signature for FindWindowW
_user32.FindWindowW.restype               = wintypes.HWND
_user32.FindWindowW.argtypes              = (wintypes.LPCWSTR, wintypes.LPCWSTR)

# Define function signatures for ShowWindow and IsWindowVisible
_user32.ShowWindow.argtypes = (wintypes.HWND, wintypes.INT)
_user32.ShowWindow.restype = wintypes.BOOL
_user32.IsWindowVisible.argtypes = (wintypes.HWND,)
_user32.IsWindowVisible.restype = wintypes.BOOL

# Define the function signature for GetWindowDisplayAffinity
try:
    _user32.GetWindowDisplayAffinity.restype = wintypes.BOOL
    _user32.GetWindowDisplayAffinity.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.DWORD))
    _HAS_GET_DISPLAY_AFFINITY = True
except AttributeError:
    _HAS_GET_DISPLAY_AFFINITY = False

# IsWindow is used as the fallback verification check
_user32.IsWindow.argtypes = (wintypes.HWND,)
_user32.IsWindow.restype = wintypes.BOOL
