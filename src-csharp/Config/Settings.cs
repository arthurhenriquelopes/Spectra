using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Spectra.Config
{
    public class Settings
    {
        private static Settings? _instance;
        public static Settings Instance => _instance ??= Load();

        public string DeepgramApiKey { get; set; } = """";
        public bool TrackCandidateResponses { get; set; } = true;
        public bool IncludeConversationHistory { get; set; } = true;
        public int MaxConversationHistory { get; set; } = 6;
        public bool GenerateFullAnswers { get; set; } = true;
        public bool PersonalizeAnswers { get; set; } = true;
        public bool DevMode { get; set; } = false;

        public List<ProviderItem> Providers { get; set; } = new();

        public static Settings Load()
        {
            var s = new Settings();
            string envPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "".env"");
            if (!File.Exists(envPath))
            {
                // Try parent folder
                envPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "".."", "".."", "".."", "".env"");
            }

            if (File.Exists(envPath))
            {
                foreach (var line in File.ReadAllLines(envPath))
                {
                    var trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith(""#"")) continue;
                    int eqIdx = trimmed.IndexOf('=');
                    if (eqIdx > 0)
                    {
                        string key = trimmed.Substring(0, eqIdx).Trim();
                        string val = trimmed.Substring(eqIdx + 1).Trim().Trim('""', '\'');

                        switch (key)
                        {
                            case ""DEEPGRAM_API_KEY"": s.DeepgramApiKey = val; break;
                            case ""TRACK_CANDIDATE_RESPONSES"": s.TrackCandidateResponses = val.Equals(""true"", StringComparison.OrdinalIgnoreCase); break;
                            case ""INCLUDE_CONVERSATION_HISTORY"": s.IncludeConversationHistory = val.Equals(""true"", StringComparison.OrdinalIgnoreCase); break;
                            case ""MAX_CONVERSATION_HISTORY"": int.TryParse(val, out int m); s.MaxConversationHistory = m > 0 ? m : 6; break;
                            case ""GENERATE_FULL_ANSWERS"": s.GenerateFullAnswers = val.Equals(""true"", StringComparison.OrdinalIgnoreCase); break;
                            case ""PERSONALIZE_ANSWERS"": s.PersonalizeAnswers = val.Equals(""true"", StringComparison.OrdinalIgnoreCase); break;
                            case ""DEV_MODE"": s.DevMode = val.Equals(""true"", StringComparison.OrdinalIgnoreCase); break;
                        }
                    }
                }
            }

            string providersPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ""ai_providers.json"");
            if (!File.Exists(providersPath))
            {
                providersPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "".."", "".."", "".."", ""ai_providers.json"");
            }

            if (File.Exists(providersPath))
            {
                try
                {
                    string json = File.ReadAllText(providersPath);
                    s.Providers = JsonSerializer.Deserialize<List<ProviderItem>>(json) ?? new();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($""Error loading ai_providers.json: {ex.Message}"");
                }
            }

            return s;
        }

        public void SaveDeepgramKey(string key)
        {
            DeepgramApiKey = key;
            string envPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "".env"");
            if (File.Exists(envPath))
            {
                var lines = new List<string>(File.ReadAllLines(envPath));
                bool updated = false;
                for (int i = 0; i < lines.Count; i++)
                {
                    if (lines[i].TrimStart().StartsWith(""DEEPGRAM_API_KEY=""))
                    {
                        lines[i] = $""DEEPGRAM_API_KEY=\""{key}\"""";
                        updated = true;
                        break;
                    }
                }
                if (!updated)
                {
                    lines.Add($""DEEPGRAM_API_KEY=\""{key}\"""");
                }
                File.WriteAllLines(envPath, lines);
            }
        }
    }
}
