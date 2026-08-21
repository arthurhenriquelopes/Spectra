using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Spectra.Config
{
    public class ModelItem
    {
        [JsonPropertyName(""modelName"")]
        public string ModelName { get; set; } = """";

        [JsonPropertyName(""description"")]
        public string? Description { get; set; }

        [JsonPropertyName(""requestParams"")]
        public Dictionary<string, object>? RequestParams { get; set; }
    }

    public class ProviderItem
    {
        [JsonPropertyName(""name"")]
        public string Name { get; set; } = """";

        [JsonPropertyName(""baseURL"")]
        public string BaseUrl { get; set; } = """";

        [JsonPropertyName(""apiKey"")]
        public string? ApiKey { get; set; }

        [JsonPropertyName(""apiKeys"")]
        public List<string>? ApiKeys { get; set; }

        [JsonPropertyName(""models"")]
        public List<object> RawModels { get; set; } = new();

        [JsonIgnore]
        public List<ModelItem> NormalizedModels
        {
            get
            {
                var list = new List<ModelItem>();
                foreach (var m in RawModels)
                {
                    if (m is string str)
                    {
                        list.Add(new ModelItem { ModelName = str, Description = str });
                    }
                    else if (m is System.Text.Json.JsonElement elem)
                    {
                        if (elem.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            var s = elem.GetString() ?? """";
                            list.Add(new ModelItem { ModelName = s, Description = s });
                        }
                        else if (elem.ValueKind == System.Text.Json.JsonValueKind.Object)
                        {
                            var modelName = elem.TryGetProperty(""modelName"", out var p) ? p.GetString() ?? """" : """";
                            var desc = elem.TryGetProperty(""description"", out var d) ? d.GetString() : modelName;
                            list.Add(new ModelItem { ModelName = modelName, Description = desc });
                        }
                    }
                }
                return list;
            }
        }
    }
}
