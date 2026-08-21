using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Spectra.Config;

namespace Spectra.Services
{
    public class LlmProviderInstance
    {
        public string Name { get; set; } = """";
        public string BaseUrl { get; set; } = """";
        public string ModelName { get; set; } = """";
        public List<string> ApiKeys { get; set; } = new();
        public int KeyIndex { get; set; } = 0;
        public bool IsHealthy { get; set; } = true;
        public string? LastError { get; set; }

        public string GetCurrentKey()
        {
            if (ApiKeys.Count == 0) return """";
            return ApiKeys[KeyIndex % ApiKeys.Count];
        }

        public void RotateKey()
        {
            if (ApiKeys.Count > 1)
            {
                KeyIndex = (KeyIndex + 1) % ApiKeys.Count;
                Debug.WriteLine($""🔑 Key rotated for {Name} to key #{KeyIndex + 1}/{ApiKeys.Count}"");
            }
        }
    }

    public class MultiLlmManager
    {
        private readonly HttpClient _httpClient;
        public Dictionary<string, LlmProviderInstance> Presets { get; } = new();
        public string ActivePreset { get; set; } = ""primary"";

        public MultiLlmManager()
        {
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        public void Configure(string primaryProvider, string primaryModel, string? secondaryProvider = null, string? secondaryModel = null)
        {
            Presets.Clear();
            var providers = Settings.Instance.Providers;

            var p1 = providers.Find(p => p.Name.Equals(primaryProvider, StringComparison.OrdinalIgnoreCase));
            if (p1 != null)
            {
                var keys = new List<string>();
                if (p1.ApiKeys != null && p1.ApiKeys.Count > 0) keys.AddRange(p1.ApiKeys.FindAll(k => !string.IsNullOrWhiteSpace(k)));
                else if (!string.IsNullOrWhiteSpace(p1.ApiKey)) keys.Add(p1.ApiKey);

                Presets["primary"] = new LlmProviderInstance
                {
                    Name = p1.Name,
                    BaseUrl = p1.BaseUrl.TrimEnd('/'),
                    ModelName = primaryModel,
                    ApiKeys = keys
                };
            }

            if (!string.IsNullOrEmpty(secondaryProvider) && !string.IsNullOrEmpty(secondaryModel))
            {
                var p2 = providers.Find(p => p.Name.Equals(secondaryProvider, StringComparison.OrdinalIgnoreCase));
                if (p2 != null)
                {
                    var keys = new List<string>();
                    if (p2.ApiKeys != null && p2.ApiKeys.Count > 0) keys.AddRange(p2.ApiKeys.FindAll(k => !string.IsNullOrWhiteSpace(k)));
                    else if (!string.IsNullOrWhiteSpace(p2.ApiKey)) keys.Add(p2.ApiKey);

                    Presets["secondary"] = new LlmProviderInstance
                    {
                        Name = p2.Name,
                        BaseUrl = p2.BaseUrl.TrimEnd('/'),
                        ModelName = secondaryModel,
                        ApiKeys = keys
                    };
                }
            }

            ActivePreset = ""primary"";
        }

        public async Task<string> StreamCompletionAsync(string prompt, Func<string, Task> onChunkReceived, CancellationToken cancellationToken = default)
        {
            if (!Presets.TryGetValue(ActivePreset, out var instance) || instance == null)
            {
                if (Presets.TryGetValue(""primary"", out var p)) instance = p;
                else throw new InvalidOperationException(""No LLM provider configured."");
            }

            int attempts = Math.Max(1, instance.ApiKeys.Count);
            Exception? lastEx = null;

            for (int attempt = 0; attempt < attempts; attempt++)
            {
                try
                {
                    string apiKey = instance.GetCurrentKey();
                    var requestBody = new
                    {
                        model = instance.ModelName,
                        messages = new[] { new { role = ""user"", content = prompt } },
                        stream = true,
                        temperature = 0.3,
                        max_tokens = 8000
                    };

                    string jsonBody = JsonSerializer.Serialize(requestBody);
                    using var request = new HttpRequestMessage(HttpMethod.Post, $""{instance.BaseUrl}/chat/completions"");
                    request.Headers.Authorization = new AuthenticationHeaderValue(""Bearer"", apiKey);
                    request.Content = new StringContent(jsonBody, Encoding.UTF8, ""application/json"");

                    using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                    if (!response.IsSuccessStatusCode)
                    {
                        string err = await response.Content.ReadAsStringAsync(cancellationToken);
                        throw new HttpRequestException($""HTTP {response.StatusCode}: {err}"");
                    }

                    using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                    using var reader = new StreamReader(stream);

                    var fullSb = new StringBuilder();

                    while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
                    {
                        string? line = await reader.ReadLineAsync(cancellationToken);
                        if (string.IsNullOrEmpty(line)) continue;
                        if (line.StartsWith(""data: ""))
                        {
                            string data = line.Substring(6).Trim();
                            if (data == ""[DONE]"") break;

                            try
                            {
                                using var doc = JsonDocument.Parse(data);
                                var choices = doc.RootElement.GetProperty(""choices"");
                                if (choices.GetArrayLength() > 0)
                                {
                                    var delta = choices[0].GetProperty(""delta"");
                                    if (delta.TryGetProperty(""content"", out var contentElem))
                                    {
                                        string? chunk = contentElem.GetString();
                                        if (!string.IsNullOrEmpty(chunk))
                                        {
                                            fullSb.Append(chunk);
                                            await onChunkReceived(chunk);
                                        }
                                    }
                                }
                            }
                            catch { }
                        }
                    }

                    instance.IsHealthy = true;
                    instance.LastError = null;
                    return fullSb.ToString();
                }
                catch (Exception ex)
                {
                    lastEx = ex;
                    Debug.WriteLine($""⚡ Provider {instance.Name} key failed: {ex.Message}"");
                    instance.RotateKey();
                }
            }

            instance.IsHealthy = false;
            instance.LastError = lastEx?.Message;
            throw lastEx ?? new Exception(""All API keys failed for this provider."");
        }
    }
}
