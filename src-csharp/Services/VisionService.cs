using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Spectra.Config;

namespace Spectra.Services
{
    public class VisionService
    {
        private readonly List<string> _screenshotQueue = new();
        private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(45) };

        public int QueueCount => _screenshotQueue.Count;

        public string CaptureScreen()
        {
            var bounds = Screen.PrimaryScreen.Bounds;
            using var bitmap = new Bitmap(bounds.Width, bounds.Height);
            using (var g = Graphics.FromImage(bitmap))
            {
                g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
            }

            using var ms = new MemoryStream();
            bitmap.Save(ms, ImageFormat.Jpeg);
            string base64 = Convert.ToBase64String(ms.ToArray());

            if (_screenshotQueue.Count >= 4)
            {
                _screenshotQueue.RemoveAt(0);
            }
            _screenshotQueue.Add(base64);

            return base64;
        }

        public void ClearQueue()
        {
            _screenshotQueue.Clear();
        }

        public async Task<string> AnalyzeQueueAsync(string providerName, string modelName, List<string> languages, CancellationToken cancellationToken = default)
        {
            if (_screenshotQueue.Count == 0)
            {
                CaptureScreen();
            }

            var provider = Settings.Instance.Providers.Find(p => p.Name.Equals(providerName, StringComparison.OrdinalIgnoreCase));
            if (provider == null) throw new InvalidOperationException($""Vision provider '{providerName}' not configured."");

            string apiKey = provider.ApiKey ?? (provider.ApiKeys?.Count > 0 ? provider.ApiKeys[0] : """");
            string baseUrl = provider.BaseUrl.TrimEnd('/');

            var contentList = new List<object>
            {
                new { type = ""text"", text = $""You are an expert technical interviewer and competitive programmer. Analyze the attached screenshot(s) containing a coding problem, LeetCode challenge, system architecture diagram, or math question. Provide the optimal solution, clean commented code (preferred languages: {string.Join("", "", languages)}), time and space complexity."" }
            };

            foreach (var b64 in _screenshotQueue)
            {
                contentList.Add(new
                {
                    type = ""image_url"",
                    image_url = new { url = $""data:image/jpeg;base64,{b64}"" }
                });
            }

            var requestBody = new
            {
                model = modelName,
                messages = new[] { new { role = ""user"", content = contentList } },
                max_tokens = 4000,
                temperature = 0.2
            };

            string json = JsonSerializer.Serialize(requestBody);
            using var request = new HttpRequestMessage(HttpMethod.Post, $""{baseUrl}/chat/completions"");
            request.Headers.Authorization = new AuthenticationHeaderValue(""Bearer"", apiKey);
            request.Content = new StringContent(json, Encoding.UTF8, ""application/json"");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            string responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(responseJson);
            string answer = doc.RootElement.GetProperty(""choices"")[0].GetProperty(""message"").GetProperty(""content"").GetString() ?? """";

            ClearQueue();
            return answer;
        }
    }
}
