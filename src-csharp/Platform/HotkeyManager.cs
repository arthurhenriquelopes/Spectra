using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Forms;

namespace Spectra.Platform
{
    public class HotkeyManager : IDisposable
    {
        private IntPtr _hwnd;
        private readonly Dictionary<int, Action> _hotkeyActions = new();
        private int _currentId = 1;

        public void Initialize(IntPtr hwnd)
        {
            _hwnd = hwnd;
        }

        public void Register(uint modifiers, Keys key, Action action)
        {
            int id = _currentId++;
            if (NativeMethods.RegisterHotKey(_hwnd, id, modifiers | NativeMethods.MOD_NOREPEAT, (uint)key))
            {
                _hotkeyActions[id] = action;
            }
            else
            {
                Debug.WriteLine($"⚠️ Failed to register hotkey: {modifiers}+{key}");
            }
        }

        public bool ProcessHotkey(int id)
        {
            if (_hotkeyActions.TryGetValue(id, out var action))
            {
                action?.Invoke();
                return true;
            }
            return false;
        }

        public void Dispose()
        {
            foreach (var id in _hotkeyActions.Keys)
            {
                NativeMethods.UnregisterHotKey(_hwnd, id);
            }
            _hotkeyActions.Clear();
        }
    }
}
