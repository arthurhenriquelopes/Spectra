using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Spectra.Platform
{
    public class ScreenShareMonitor
    {
        private static readonly string[] Indicators = new[]
        {
            "is sharing your screen",
            "sharing your screen",
            "compartilhando sua tela",
            "screen sharing",
            "está compartilhando a tela"
        };

        private static readonly string[] ShareClasses = new[]
        {
            "cptoolbartoolwindow",
            "zpscreensharetipsbar",
            "screensharetoolbarsubclass"
        };

        private readonly HashSet<IntPtr> _hiddenWindows = new();
        private CancellationTokenSource? _cts;

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => MonitorLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task MonitorLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    ScanAndHideIndicators();
                    await Task.Delay(2000, token);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"ScreenShareMonitor error: {ex.Message}");
                }
            }
        }

        private void ScanAndHideIndicators()
        {
            NativeMethods.EnumWindows((hwnd, lParam) =>
            {
                if (!NativeMethods.IsWindowVisible(hwnd) || _hiddenWindows.Contains(hwnd))
                    return true;

                var titleSb = new StringBuilder(512);
                NativeMethods.GetWindowText(hwnd, titleSb, 512);
                string title = titleSb.ToString().ToLowerInvariant();

                var classSb = new StringBuilder(256);
                NativeMethods.GetClassName(hwnd, classSb, 256);
                string className = classSb.ToString().ToLowerInvariant();

                bool isMatch = false;
                foreach (var ind in Indicators)
                {
                    if (title.Contains(ind))
                    {
                        isMatch = true;
                        break;
                    }
                }

                if (!isMatch)
                {
                    foreach (var cls in ShareClasses)
                    {
                        if (className.Contains(cls))
                        {
                            isMatch = true;
                            break;
                        }
                    }
                }

                if (isMatch)
                {
                    NativeMethods.ShowWindow(hwnd, NativeMethods.SW_HIDE);
                    _hiddenWindows.Add(hwnd);
                    Debug.WriteLine($"🕵️ Hidden screen share banner: '{title}' (Class: {className})");
                }

                return true;
            }, IntPtr.Zero);
        }
    }
}
