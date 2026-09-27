// Prompt builder matching Spectra interview intelligence
function buildCandidateProfile(profile = {}) {
    const parts = [];
    if (profile.candidate_name) parts.push(`Candidate Name: ${profile.candidate_name}`);
    if (profile.target_company) parts.push(`Target Company: ${profile.target_company}`);
    if (profile.target_role) parts.push(`Target Role: ${profile.target_role}`);
    if (profile.focus_areas && profile.focus_areas.length) {
        parts.push(`Interview Focus Areas: ${profile.focus_areas.join(', ')}`);
    }
    if (profile.complete_resume) {
        parts.push(`COMPLETE RESUME/BACKGROUND:\n${profile.complete_resume}`);
    }
    if (profile.complete_job_description) {
        parts.push(`COMPLETE JOB DESCRIPTION/REQUIREMENTS:\n${profile.complete_job_description}`);
    }
    if (profile.supplementary_documents) {
        parts.push(`SUPPLEMENTARY DOCUMENTS/PORTFOLIO:\n${profile.supplementary_documents}`);
    }
    return parts.length ? parts.join('\n') + '\n' : '';
}

function getInterviewAnswerPrompt(question, persistentContext = {}, conversationHistory = []) {
    const parts = [];

    parts.push(`You are an expert interview coach providing real-time assistance during a live job interview.
Your goal is to help the candidate give the best possible answer to the interviewer's question.

CRITICAL INSTRUCTIONS:
- Give a direct, high-impact answer. No fluff, no introductory chit-chat.
- If technical/coding: provide clear algorithm steps, complexity (Time & Space), and clean code.
- If behavioral: use the STAR method (Situation, Task, Action, Result) concisely.
- If system design: cover requirements, high-level architecture, key trade-offs, and scaling.
- Keep formatting clean using markdown bullet points and bold headers.`);

    const profileText = buildCandidateProfile(persistentContext);
    if (profileText) {
        parts.push("=================================================================================");
        parts.push("PERSISTENT CANDIDATE CONTEXT:");
        parts.push(profileText);
        parts.push("=================================================================================");
    }

    if (conversationHistory && conversationHistory.length > 0) {
        parts.push("RECENT CONVERSATION HISTORY:");
        const recent = conversationHistory.slice(-5);
        recent.forEach((item, idx) => {
            if (item.interviewer_question) parts.push(`Q${idx + 1}: ${item.interviewer_question}`);
            if (item.ai_response) parts.push(`A${idx + 1}: ${item.ai_response.slice(0, 300)}...`);
        });
        parts.push("=================================================================================");
    }

    parts.push(`CURRENT INTERVIEWER QUESTION:
"${question}"

Provide the answer for the candidate to speak right now:`);

    return parts.join('\n\n');
}

function getVisionPrompt(userPrompt, persistentContext = {}) {
    return `You are an expert technical interview assistant analyzing a screen capture from a live interview or coding test.
The candidate needs quick, accurate, actionable help.

${userPrompt ? `USER REQUEST: "${userPrompt}"` : 'Analyze the code or problem shown on the screen, identify any bugs, provide the optimal solution, and explain clearly.'}

Format your answer with clean markdown, code snippets, and complexity analysis.`;
}

module.exports = {
    buildCandidateProfile,
    getInterviewAnswerPrompt,
    getVisionPrompt
};
