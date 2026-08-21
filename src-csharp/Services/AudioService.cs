using System;
using System.Collections.Generic;
using NAudio.Wave;

namespace Spectra.Services
{
    public class AudioService : IDisposable
    {
        private WaveInEvent? _waveIn;
        private bool _isMuted = false;

        public event Action<byte[]>? AudioDataAvailable;
        public bool IsMuted
        {
            get => _isMuted;
            set => _isMuted = value;
        }

        public bool IsRecording => _waveIn != null;

        public static List<string> GetInputDevices()
        {
            var devices = new List<string>();
            for (int i = 0; i < WaveInEvent.DeviceCount; i++)
            {
                var caps = WaveInEvent.GetCapabilities(i);
                devices.Add(caps.ProductName);
            }
            return devices;
        }

        public bool Start(int deviceNumber = 0)
        {
            try
            {
                Stop();

                _waveIn = new WaveInEvent
                {
                    DeviceNumber = Math.Max(0, deviceNumber),
                    WaveFormat = new WaveFormat(16000, 16, 1), // 16kHz, 16-bit, Mono (Deepgram optimized)
                    BufferMilliseconds = 100
                };

                _waveIn.DataAvailable += (s, e) =>
                {
                    if (!_isMuted && e.BytesRecorded > 0)
                    {
                        byte[] buffer = new byte[e.BytesRecorded];
                        Array.Copy(e.Buffer, buffer, e.BytesRecorded);
                        AudioDataAvailable?.Invoke(buffer);
                    }
                };

                _waveIn.StartRecording();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to start audio recording: {ex.Message}");
                return false;
            }
        }

        public void Stop()
        {
            if (_waveIn != null)
            {
                try
                {
                    _waveIn.StopRecording();
                    _waveIn.Dispose();
                }
                catch { }
                finally
                {
                    _waveIn = null;
                }
            }
        }

        public void Dispose()
        {
            Stop();
        }
    }
}
