using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;
using Spectra.Config;
using Spectra.Core;
using Spectra.Platform;
using Spectra.Services;

namespace Spectra.UI
{
    public partial class MainWindow : Window
    {
        private readonly WindowManager _windowManager = new();
        private readonly HotkeyManager _hotkeyManager = new();
        private readonly ScreenShareMonitor _screenShareMonitor = new();
        private readonly SessionController _sessionController = new();

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
            Closed += MainWindow_Closed;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            var helper = new WindowInteropHelper(this);
            IntPtr hwnd = helper.Handle;

            // Initialize Win32 window management (Capture protection, click-through, transparency)
            _windowManager.Initialize(hwnd);
            _hotkeyManager.Initialize(hwnd);
            RegisterGlobalHotkeys();

            // Screen share monitoring
            _screenShareMonitor.Start();

            // Hook HwndSource to receive WM_HOTKEY messages
            var source = HwndSource.FromHwnd(hwnd);
            source.AddHook(WndProc);

            // Connect SessionController events to UI
            _sessionController.SendToUi += (type, payload) =>
            {
                Dispatcher.Invoke(() =>
                {
                    SendJsonToWeb(type, payload);
                });
            };

            // Initialize WebView2
            await InitializeWebViewAsync();
        }

        private async Task InitializeWebViewAsync()
        {
            try
            {
                var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Path.GetTempPath(), ""Spectra_WebView2_Profile""));
                await WebView.EnsureCoreWebView2Async(env);

                string webFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ""web"");
                if (!Directory.Exists(webFolder))
                {
                    webFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "".."", "".."", "".."", ""web"");
                }

                webFolder = Path.GetFullPath(webFolder);
                WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    ""spectra.local"",
                    webFolder,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                WebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
                WebView.CoreWebView2.Settings.AreDevToolsEnabled = Settings.Instance.DevMode;

                WebView.Source = new Uri(""https://spectra.local/index.html"");
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($""Failed to initialize WebView2: {ex.Message}"", ""Error"", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void RegisterGlobalHotkeys()
        {
            // Alt+Z: Toggle Visibility
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.Z, () =>
            {
                _windowManager.ToggleVisibility();
            });

            // Alt+X: Toggle Ghost Mode
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.X, () =>
            {
                _windowManager.ToggleGhostMode();
                SendJsonToWeb(""ghost_mode_toggled"", new { is_ghost = _windowManager.IsGhostMode });
            });

            // Alt+1/2/3: Transparency
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.D1, () => _windowManager.SetTransparency(0.4));
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.D2, () => _windowManager.SetTransparency(0.7));
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.D3, () => _windowManager.SetTransparency(1.0));

            // Alt+S: Capture Screenshot
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.S, () =>
            {
                _sessionController.Vision.CaptureScreen();
                SendJsonToWeb(""screenshot_queued"", new { count = _sessionController.Vision.QueueCount });
            });

            // Alt+R: Reset Screenshot Queue
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.R, () =>
            {
                _sessionController.Vision.ClearQueue();
                SendJsonToWeb(""screenshot_queued"", new { count = 0 });
            });

            // Alt+M: Toggle Mic Mute
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.M, () =>
            {
                _sessionController.Audio.IsMuted = !_sessionController.Audio.IsMuted;
                SendJsonToWeb(""mute_state_changed"", new { is_muted = _sessionController.Audio.IsMuted });
            });

            // Alt+O: Reset Interview Session
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.O, () =>
            {
                _sessionController.ResetSession();
            });

            // Movement Hotkeys: Alt+I/J/Left/Right
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.I, () => _windowManager.MoveWindow(0, -20));
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.J, () => _windowManager.MoveWindow(0, 20));
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.Left, () => _windowManager.MoveWindow(-20, 0));
            _hotkeyManager.Register(NativeMethods.MOD_ALT, Keys.Right, () => _windowManager.MoveWindow(20, 0));
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == NativeMethods.WM_HOTKEY)
            {
                int id = wParam.ToInt32();
                if (_hotkeyManager.ProcessHotkey(id))
                {
                    handled = true;
                }
            }
            return IntPtr.Zero;
        }

        private async void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson;
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                string type = root.GetProperty(""type"").GetString() ?? """";
                var payload = root.TryGetProperty(""payload"", out var p) ? p : root;

                switch (type)
                {
                    case ""start_interview"":
                        var profile = new CandidateProfile
                        {
                            Name = payload.TryGetProperty(""name"", out var n) ? n.GetString() ?? """" : """",
                            Company = payload.TryGetProperty(""company"", out var c) ? c.GetString() ?? """" : """",
                            Role = payload.TryGetProperty(""role"", out var r) ? r.GetString() ?? """" : """",
                            Resume = payload.TryGetProperty(""resume"", out var res) ? res.GetString() ?? """" : """",
                            Objectives = payload.TryGetProperty(""objectives"", out var obj) ? obj.GetString() ?? """" : """"
                        };

                        if (payload.TryGetProperty(""focus"", out var fArr) && fArr.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var item in fArr.EnumerateArray())
                            {
                                var val = item.GetString();
                                if (!string.IsNullOrEmpty(val)) profile.FocusAreas.Add(val);
                            }
                        }

                        string primaryP = payload.TryGetProperty(""primary_provider"", out var pp) ? pp.GetString() ?? """" : """";
                        string primaryM = payload.TryGetProperty(""primary_model"", out var pm) ? pm.GetString() ?? """" : """";
                        string? secP = payload.TryGetProperty(""secondary_provider"", out var sp) ? sp.GetString() : null;
                        string? secM = payload.TryGetProperty(""secondary_model"", out var sm) ? sm.GetString() : null;

                        await _sessionController.StartInterviewAsync(profile, primaryP, primaryM, secP, secM);
                        break;

                    case ""end_interview"":
                        _sessionController.EndInterview();
                        SendJsonToWeb(""interview_ended"", new { status = ""ok"" });
                        break;

                    case ""reset_session"":
                        _sessionController.ResetSession();
                        break;

                    case ""switch_preset"":
                        string preset = payload.TryGetProperty(""preset"", out var ps) ? ps.GetString() ?? ""primary"" : ""primary"";
                        _sessionController.Llm.ActivePreset = preset;
                        SendJsonToWeb(""preset_switched"", new { preset });
                        break;

                    case ""save_deepgram_key"":
                        string key = payload.TryGetProperty(""key"", out var dk) ? dk.GetString() ?? """" : """";
                        Settings.Instance.SaveDeepgramKey(key);
                        SendJsonToWeb(""deepgram_key_saved"", new { status = ""ok"" });
                        break;

                    case ""process_screenshots"":
                        string vProv = payload.TryGetProperty(""provider"", out var vp) ? vp.GetString() ?? """" : """";
                        string vMod = payload.TryGetProperty(""model"", out var vm) ? vm.GetString() ?? """" : """";
                        var langs = new List<string>();
                        if (payload.TryGetProperty(""languages"", out var lArr))
                        {
                            foreach (var l in lArr.EnumerateArray()) langs.Add(l.GetString() ?? """");
                        }
                        await _sessionController.ProcessVisionAnalysisAsync(vProv, vMod, langs);
                        break;

                    case ""get_initial_config"":
                        SendJsonToWeb(""initial_config"", new
                        {
                            deepgram_configured = !string.IsNullOrWhiteSpace(Settings.Instance.DeepgramApiKey),
                            providers = Settings.Instance.Providers,
                            mics = AudioService.GetInputDevices()
                        });
                        break;

                    case ""set_transparency"":
                        if (payload.TryGetProperty(""level"", out var lv))
                        {
                            _windowManager.SetTransparency(lv.GetDouble());
                        }
                        break;

                    case ""toggle_ghost_mode"":
                        _windowManager.ToggleGhostMode();
                        break;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($""WebMessage error: {ex.Message}"");
            }
        }

        private void SendJsonToWeb(string type, object payload)
        {
            if (WebView != null && WebView.CoreWebView2 != null)
            {
                string msg = JsonSerializer.Serialize(new { type, payload });
                WebView.CoreWebView2.PostWebMessageAsString(msg);
            }
        }

        private void MainWindow_Closed(object? sender, EventArgs e)
        {
            _screenShareMonitor.Stop();
            _hotkeyManager.Dispose();
            _sessionController.Dispose();
        }
    }
}
