using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Spectra.Config;

namespace Spectra.Services
{
    public class CandidateProfile
    {
        public string Name { get; set; } = """";
        public string Company { get; set; } = """";
        public string Role { get; set; } = """";
        public string Resume { get; set; } = """";
        public string Objectives { get; set; } = """";
        public List<string> FocusAreas { get; set; } = new();
        public List<string> SelectedLanguages { get; set; } = new();
    }

    public class ConversationExchange
    {
        public string? Question { get; set; }
        public string? Answer { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ContextManager
    {
        public CandidateProfile Profile { get; set; } = new();
        public List<ConversationExchange> History { get; set; } = new();

        public void Initialize(CandidateProfile profile)
        {
            Profile = profile;
            History.Clear();
        }

        public void AddQuestion(string question)
        {
            History.Add(new ConversationExchange { Question = question });
            TrimHistory();
        }

        public void AddAnswer(string answer)
        {
            if (History.Count > 0 && string.IsNullOrEmpty(History[^1].Answer))
            {
                History[^1].Answer = answer;
            }
            else
            {
                History.Add(new ConversationExchange { Answer = answer });
            }
            TrimHistory();
        }

        public void ResetHistory()
        {
            History.Clear();
        }

        private void TrimHistory()
        {
            int max = Settings.Instance.MaxConversationHistory;
            if (History.Count > max)
            {
                History = History.Skip(History.Count - max).ToList();
            }
        }

        public string BuildPrompt(string question)
        {
            bool isBriefHuman = Profile.FocusAreas.Contains(""brief-human"");

            var sb = new StringBuilder();
            sb.AppendLine(""# IDENTITY & ROLE"");
            sb.AppendLine(""You are an elite, highly experienced Senior/Staff Software Engineer in a live technical interview."");
            sb.AppendLine($""You are interviewing as: {Profile.Name} for the position of: {Profile.Role} at {Profile.Company}."");
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(Profile.Resume))
            {
                sb.AppendLine(""# CANDIDATE RESUME & EXPERIENCE"");
                sb.AppendLine(Profile.Resume);
                sb.AppendLine();
            }

            if (!string.IsNullOrWhiteSpace(Profile.Objectives))
            {
                sb.AppendLine(""# TARGET JOB DESCRIPTION / REQUIREMENTS"");
                sb.AppendLine(Profile.Objectives);
                sb.AppendLine();
            }

            if (Profile.SelectedLanguages.Count > 0)
            {
                sb.AppendLine($""# PREFERRED PROGRAMMING LANGUAGES: {string.Join("", "", Profile.SelectedLanguages)}"");
                sb.AppendLine();
            }

            if (Settings.Instance.IncludeConversationHistory && History.Count > 0)
            {
                sb.AppendLine(""# RECENT CONVERSATION CONTEXT"");
                foreach (var ex in History.TakeLast(3))
                {
                    if (!string.IsNullOrEmpty(ex.Question)) sb.AppendLine($""Interviewer: {ex.Question}"");
                    if (!string.IsNullOrEmpty(ex.Answer)) sb.AppendLine($""Candidate: {ex.Answer}"");
                }
                sb.AppendLine();
            }

            sb.AppendLine(""# CURRENT INTERVIEW QUESTION"");
            sb.AppendLine(question);
            sb.AppendLine();

            sb.AppendLine(""# RESPONSE FORMAT GUIDELINES"");
            if (isBriefHuman)
            {
                sb.AppendLine(""1. Provide a direct, natural, highly confident response in 1 or 2 concise paragraphs."");
                sb.AppendLine(""2. Talk naturally as an expert engineer. Avoid rigid bullet-point dumps or textbook definitions unless asked."");
                sb.AppendLine(""3. Highlight real-world trade-offs, architecture decisions, or practical experience."");
            }
            else
            {
                sb.AppendLine(""1. Start with a direct, high-impact answer / opening hook (1-2 sentences) in bold."");
                sb.AppendLine(""2. Provide structured key bullet points explaining the core architecture, algorithm, or strategy."");
                sb.AppendLine(""3. If coding is required, provide clean, optimal, well-commented code with Time and Space complexity (O(N))."");
            }

            return sb.ToString();
        }
    }
}
