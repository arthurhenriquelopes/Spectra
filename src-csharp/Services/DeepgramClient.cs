using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Spectra.Services
{
    public class TranscriptResult
    {
        public string Transcript { get; set; } = "";
        public bool IsFinal { get; set; }
        public int Speaker { get; set; }
        public double Confidence { get; set; }
    }

    public class DeepgramClient : IDisposable
    {
        private ClientWebSocket? _ws;
        private CancellationTokenSource? _cts;
        private readonly string _apiKey;

        public event Action<TranscriptResult>? TranscriptReceived;
        public bool IsConnected => _ws != null && _ws.State == WebSocketState.Open;

        public DeepgramClient(string apiKey)
        {
            _apiKey = apiKey;
        }

        public async Task<bool> ConnectAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                Disconnect();
                _cts = new CancellationTokenSource();
                _ws = new ClientWebSocket();
                _ws.Options.SetRequestHeader("Authorization", $"Token {_apiKey}");

                string uri = "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&punctuate=true&interim_results=true&diarize=true&smart_format=true&endpointing=300";
                await _ws.ConnectAsync(new Uri(uri), cancellationToken);

                _ = Task.Run(() => ReceiveLoop(_cts.Token));
                Console.WriteLine("✅ Connected to Deepgram Nova-2 STT stream");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Deepgram connection error: {ex.Message}");
                return false;
            }
        }

        public async Task SendAudioAsync(byte[] audioData)
        {
            if (_ws != null && _ws.State == WebSocketState.Open)
            {
                try
                {
                    await _ws.SendAsync(new ArraySegment<byte>(audioData), WebSocketMessageType.Binary, true, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Deepgram send error: {ex.Message}");
                }
            }
        }

        private async Task ReceiveLoop(CancellationToken token)
        {
            var buffer = new byte[8192];
            while (!token.IsCancellationRequested && _ws != null && _ws.State == WebSocketState.Open)
            {
                try
                {
                    using var ms = new MemoryStream();
                    WebSocketReceiveResult result;
                    do
                    {
                        result = await _ws.ReceiveAsync(new ArraySegment<byte>(buffer), token);
                        if (result.MessageType == WebSocketMessageType.Close)
                        {
                            await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", CancellationToken.None);
                            return;
                        }
                        ms.Write(buffer, 0, result.Count);
                    } while (!result.EndOfMessage);

                    ms.Seek(0, SeekOrigin.Begin);
                    using var reader = new StreamReader(ms, Encoding.UTF8);
                    string json = await reader.ReadToEndAsync(token);

                    ParseTranscriptJson(json);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Deepgram receive error: {ex.Message}");
                    break;
                }
            }
        }

        private void ParseTranscriptJson(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("channel", out var channel) &&
                    channel.TryGetProperty("alternatives", out var alts) &&
                    alts.GetArrayLength() > 0)
                {
                    var alt = alts[0];
                    string transcript = alt.TryGetProperty("transcript", out var t) ? t.GetString() ?? "" : "";
                    bool isFinal = root.TryGetProperty("is_final", out var f) && f.GetBoolean();
                    double confidence = alt.TryGetProperty("confidence", out var c) ? c.GetDouble() : 0.0;
                    int speaker = 0;

                    if (alt.TryGetProperty("words", out var words) && words.GetArrayLength() > 0)
                    {
                        var firstWord = words[0];
                        if (firstWord.TryGetProperty("speaker", out var spk))
                        {
                            speaker = spk.GetInt32();
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(transcript))
                    {
                        TranscriptReceived?.Invoke(new TranscriptResult
                        {
                            Transcript = transcript,
                            IsFinal = isFinal,
                            Speaker = speaker,
                            Confidence = confidence
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing Deepgram JSON: {ex.Message}");
            }
        }

        public void Disconnect()
        {
            _cts?.Cancel();
            if (_ws != null)
            {
                try
                {
                    if (_ws.State == WebSocketState.Open)
                    {
                        _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client close", CancellationToken.None).Wait(500);
                    }
                    _ws.Dispose();
                }
                catch { }
                finally
                {
                    _ws = null;
                }
            }
        }

        public void Dispose()
        {
            Disconnect();
        }
    }
}
