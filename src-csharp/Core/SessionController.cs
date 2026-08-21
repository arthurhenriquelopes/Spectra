using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Spectra.Config;
using Spectra.Services;

namespace Spectra.Core
{
    public class SessionController : IDisposable
    {
        public AudioService Audio { get; } = new();
        public DeepgramClient? Deepgram { get; private set; }
        public MultiLlmManager Llm { get; } = new();
        public VisionService Vision { get; } = new();
        public ContextManager Context { get; } = new();

        public event Action<string, object>? SendToUi;

        private readonly StringBuilder _transcriptBuffer = new();
        private CancellationTokenSource? _silenceCts;
        private readonly object _bufferLock = new();
        private bool _isActive = false;

        public bool IsActive => _isActive;

        public async Task<bool> StartInterviewAsync(
            CandidateProfile profile,
            string primaryProvider, string primaryModel,
            string? secondaryProvider, string? secondaryModel,
            int micIndex = 0)
        {
            try
            {
                Context.Initialize(profile);
                Llm.Configure(primaryProvider, primaryModel, secondaryProvider, secondaryModel);

                string deepgramKey = Settings.Instance.DeepgramApiKey;
                if (string.IsNullOrWhiteSpace(deepgramKey))
                {
                    SendToUi?.Invoke("error", new { message = "Deepgram API Key is missing. Please set it in Advanced Config." });
                    return false;
                }

                Deepgram = new DeepgramClient(deepgramKey);
                Deepgram.TranscriptReceived += OnTranscriptReceived;

                bool deepgramOk = await Deepgram.ConnectAsync();
                if (!deepgramOk)
                {
                    SendToUi?.Invoke("error", new { message = "Failed to connect to Deepgram STT." });
                    return false;
                }

                Audio.AudioDataAvailable += async (data) =>
                {
                    if (Deepgram != null && Deepgram.IsConnected)
                    {
                        await Deepgram.SendAudioAsync(data);
                    }
                };

                bool audioOk = Audio.Start(micIndex);
                if (!audioOk)
                {
                    SendToUi?.Invoke("error", new { message = "Failed to access microphone." });
                    return false;
                }

                _isActive = true;
                SendToUi?.Invoke("session_created", new { session_id = Guid.NewGuid().ToString() });
                return true;
            }
            catch (Exception ex)
            {
                SendToUi?.Invoke("error", new { message = $"Failed to start interview: {ex.Message}" });
                return false;
            }
        }

        private void OnTranscriptReceived(TranscriptResult result)
        {
            if (!_isActive) return;

            SendToUi?.Invoke("transcript_update", new
            {
                transcript = result.Transcript,
                is_final = result.IsFinal,
                speaker = result.Speaker,
                confidence = result.Confidence
            });

            if (result.IsFinal && !string.IsNullOrWhiteSpace(result.Transcript))
            {
                lock (_bufferLock)
                {
                    _transcriptBuffer.Append(" ").Append(result.Transcript);
                }

                _silenceCts?.Cancel();
                _silenceCts = new CancellationTokenSource();
                var token = _silenceCts.Token;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await Task.Delay(1500, token);
                        if (!token.IsCancellationRequested)
                        {
                            await ProcessAggregatedTranscriptAsync();
                        }
                    }
                    catch (OperationCanceledException) { }
                }, token);
            }
        }

        private async Task ProcessAggregatedTranscriptAsync()
        {
            string question;
            lock (_bufferLock)
            {
                question = _transcriptBuffer.ToString().Trim();
                _transcriptBuffer.Clear();
            }

            if (string.IsNullOrWhiteSpace(question)) return;

            SendToUi?.Invoke("ai_processing_started", new { question });

            try
            {
                Context.AddQuestion(question);
                string prompt = Context.BuildPrompt(question);

                string fullAnswer = await Llm.StreamCompletionAsync(prompt, async (chunk) =>
                {
                    SendToUi?.Invoke("ai_answer_chunk", new { chunk, chunk_type = "chunk" });
                    await Task.Yield();
                });

                Context.AddAnswer(fullAnswer);
                SendToUi?.Invoke("ai_answer_complete", new
                {
                    answer = fullAnswer,
                    provider = Llm.ActivePreset,
                    success = true
                });
            }
            catch (Exception ex)
            {
                SendToUi?.Invoke("error", new { message = $"Error processing AI answer: {ex.Message}" });
            }
        }

        public async Task ProcessVisionAnalysisAsync(string provider, string model, List<string> languages)
        {
            try
            {
                SendToUi?.Invoke("ai_processing_started", new { question = "[Analyzing Screen Images...]" });
                string answer = await Vision.AnalyzeQueueAsync(provider, model, languages);
                SendToUi?.Invoke("vision_analysis_result", new
                {
                    success = true,
                    analysis = answer,
                    provider,
                    model
                });
            }
            catch (Exception ex)
            {
                SendToUi?.Invoke("vision_analysis_result", new
                {
                    success = false,
                    error = ex.Message
                });
            }
        }

        public void ResetSession()
        {
            lock (_bufferLock)
            {
                _transcriptBuffer.Clear();
            }
            _silenceCts?.Cancel();
            Context.ResetHistory();
            SendToUi?.Invoke("session_reset_complete", new { status = "ok" });
        }

        public void EndInterview()
        {
            _isActive = false;
            _silenceCts?.Cancel();
            Audio.Stop();
            Deepgram?.Disconnect();
            Deepgram = null;
        }

        public void Dispose()
        {
            EndInterview();
            Audio.Dispose();
        }
    }
}
