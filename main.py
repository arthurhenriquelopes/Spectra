import os
import sys
import shutil
import time
from pathlib import Path

# Force UTF-8 for standard output/error, and fix NoneType crash in pythonw.exe
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w')
elif hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w')
elif hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# --- Auto-create .env from .env.example if missing ---
_env_path = Path(".env")
_env_example_path = Path(".env.example")

if not _env_path.exists() and _env_example_path.exists():
    shutil.copy2(_env_example_path, _env_path)
    print("📄 Created .env from .env.example — please fill in your API keys!")
elif not _env_path.exists() and not _env_example_path.exists():
    print("⚠️ No .env or .env.example found. The app may fail to start without a .env file.")

import webview

from src.config.settings import settings, print_config_debug
from src.server import UvicornServer, AsyncioServiceThread, find_free_port
from src.commands import command_monitor
from src.app import app
import src.platform as platform_mod

# --- Development Flag ---
DEV_MODE = settings.DEV_MODE
print_config_debug()

# --- Global instances ---
uvicorn_server = UvicornServer(app)
asyncio_service_thread = AsyncioServiceThread(uvicorn_server, command_monitor)


def setup_webview_window():
    """Setup and configure the webview window"""
    window = webview.create_window(
        'Spectra',
        f'http://127.0.0.1:{uvicorn_server.port}',
        width=1000,
        height=750,
        resizable=True
    )

    def on_window_shown():
        print(f"🔧 Window shown event fired. DEV_MODE = {DEV_MODE}")
        if not DEV_MODE:
            print("🛡️ DEV_MODE is False - Applying screen capture protection...")
            protection_success = platform_mod.apply_capture_protection(window)
            if protection_success:
                print("✅ Screen capture protection successfully applied!")
            else:
                print("❌ CRITICAL: Screen capture protection FAILED!")
        else:
            print("ℹ️ DEV_MODE is True. Skipping screen capture protection.")

        import time
        time.sleep(1.0)

        if platform_mod.find_aura_window():
            print("🔍 Window found - setting up always-on-top only")
            time.sleep(0.5)
            always_on_top_success = False
            for attempt in range(3):
                always_on_top_success = platform_mod.set_app_always_on_top(True)
                if always_on_top_success:
                    print("📌 Window set to always stay on top")
                    break
                else:
                    print(f"⚠️ Always-on-top attempt {attempt + 1} failed, retrying...")
                    time.sleep(0.3)
            if not always_on_top_success:
                print("⚠️ Failed to set always on top after 3 attempts")
            print("ℹ️ Transparency will be applied only during live interview")
        else:
            print("⚠️ Could not find Spectra window for window management")

        platform_mod.window_manager.start_hotkey_listener()

    def on_window_closing():
        print("🛑 Window closing, shutting down services...")
        asyncio_service_thread.stop()
        return True

    window.events.shown += on_window_shown
    window.events.closing += on_window_closing
    return window


def main():
    """Main application entry point"""
    print("🚀 Starting Spectra...")
    try:
        asyncio_service_thread.start()
        time.sleep(2)
        window = setup_webview_window()
        print("🖥️ Starting pywebview on main thread...")
        webview.start(debug=DEV_MODE, icon='assets/spectra_icon.ico')
    except KeyboardInterrupt:
        print("🛑 Application interrupted by user")
    except Exception as e:
        print(f"❌ Application error: {e}")
    finally:
        print("🧹 Final cleanup...")
        asyncio_service_thread.stop()
        print("✅ Application shutdown complete")

if __name__ == '__main__':
    main()