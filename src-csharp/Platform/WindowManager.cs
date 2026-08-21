using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Spectra.Platform
{
    public class WindowManager
    {
        private IntPtr _hwnd;
        private bool _isGhostMode = false;
        private double _currentTransparency = 1.0;

        public IntPtr Hwnd => _hwnd;
        public bool IsGhostMode => _isGhostMode;
        public double CurrentTransparency => _currentTransparency;

        public void Initialize(IntPtr hwnd)
        {
            _hwnd = hwnd;
            EnableTransparencyStyle();
            ApplyCaptureProtection();
            SetAlwaysOnTop(true);
            HideFromTaskbar();
        }

        public bool ApplyCaptureProtection()
        {
            if (_hwnd == IntPtr.Zero) return false;

            // Try primary WDA_EXCLUDEFROMCAPTURE (0x11)
            bool success = NativeMethods.SetWindowDisplayAffinity(_hwnd, NativeMethods.WDA_EXCLUDEFROMCAPTURE);
            if (!success)
            {
                // Fallback to legacy monitor exclusion (0x02 or 0x01)
                success = NativeMethods.SetWindowDisplayAffinity(_hwnd, 0x00000002);
            }

            Debug.WriteLine(success ? ""✅ Capture Protection Applied (Excluded from capture)"" : ""❌ Capture Protection Failed"");
            return success;
        }

        private void EnableTransparencyStyle()
        {
            if (_hwnd == IntPtr.Zero) return;
            try
            {
                IntPtr exStyle = NativeMethods.GetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE);
                uint currentStyle = (uint)exStyle.ToInt64();
                if ((currentStyle & NativeMethods.WS_EX_LAYERED) == 0)
                {
                    uint newStyle = currentStyle | NativeMethods.WS_EX_LAYERED;
                    NativeMethods.SetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE, new IntPtr(newStyle));
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($""Error enabling transparency style: {ex.Message}"");
            }
        }

        public bool SetTransparency(double opacity)
        {
            if (_hwnd == IntPtr.Zero) return false;
            try
            {
                opacity = Math.Clamp(opacity, 0.1, 1.0);
                _currentTransparency = opacity;
                byte alpha = (byte)(opacity * 255);

                bool res = NativeMethods.SetLayeredWindowAttributes(_hwnd, 0, alpha, NativeMethods.LWA_ALPHA);
                return res;
            }
            catch
            {
                return false;
            }
        }

        public void SetGhostMode(bool enabled)
        {
            if (_hwnd == IntPtr.Zero) return;
            try
            {
                IntPtr exStyle = NativeMethods.GetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE);
                uint currentStyle = (uint)exStyle.ToInt64();
                uint newStyle = enabled
                    ? currentStyle | NativeMethods.WS_EX_TRANSPARENT
                    : currentStyle & ~NativeMethods.WS_EX_TRANSPARENT;

                NativeMethods.SetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE, new IntPtr(newStyle));
                _isGhostMode = enabled;
                SetAlwaysOnTop(true);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($""Error toggling ghost mode: {ex.Message}"");
            }
        }

        public void ToggleGhostMode()
        {
            SetGhostMode(!_isGhostMode);
        }

        public void ToggleVisibility()
        {
            if (_hwnd == IntPtr.Zero) return;
            if (NativeMethods.IsWindowVisible(_hwnd))
            {
                NativeMethods.ShowWindow(_hwnd, NativeMethods.SW_HIDE);
            }
            else
            {
                NativeMethods.ShowWindow(_hwnd, NativeMethods.SW_SHOWNOACTIVATE);
                SetAlwaysOnTop(true);
            }
        }

        public bool SetAlwaysOnTop(bool onTop)
        {
            if (_hwnd == IntPtr.Zero) return false;
            IntPtr insertAfter = onTop ? NativeMethods.HWND_TOPMOST : NativeMethods.HWND_NOTOPMOST;
            return NativeMethods.SetWindowPos(_hwnd, insertAfter, 0, 0, 0, 0, NativeMethods.SWP_NOMOVE | NativeMethods.SWP_NOSIZE | NativeMethods.SWP_NOACTIVATE);
        }

        public bool HideFromTaskbar()
        {
            if (_hwnd == IntPtr.Zero) return false;
            try
            {
                IntPtr exStyle = NativeMethods.GetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE);
                uint currentStyle = (uint)exStyle.ToInt64();
                uint newStyle = (currentStyle | NativeMethods.WS_EX_TOOLWINDOW) & ~NativeMethods.WS_EX_APPWINDOW;
                NativeMethods.SetWindowLongPtr(_hwnd, NativeMethods.GWL_EXSTYLE, new IntPtr(newStyle));
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool MoveWindow(int dx, int dy)
        {
            if (_hwnd == IntPtr.Zero) return false;
            if (NativeMethods.GetWindowRect(_hwnd, out var rect))
            {
                int newX = rect.Left + dx;
                int newY = rect.Top + dy;
                return NativeMethods.SetWindowPos(_hwnd, IntPtr.Zero, newX, newY, 0, 0, NativeMethods.SWP_NOSIZE | NativeMethods.SWP_NOACTIVATE | NativeMethods.SWP_NOZORDER);
            }
            return false;
        }
    }
}
