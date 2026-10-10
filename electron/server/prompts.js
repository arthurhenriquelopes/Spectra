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
    const prefs = persistentContext.answerPreferences || {};
    const format = prefs.format || 'Script + bullets';
    const length = prefs.length || 'Balanced';
    const tone = prefs.tone || 'Simple';
    const useStarMethod = prefs.useStarMethod || false;
    const useFillerWords = prefs.useFillerWords || false;
    const extraInstructions = persistentContext.aiInstructions || persistentContext.extraContext || '';

    const instructions = [];

    // 1. Role and core purpose
    instructions.push(`You are an elite live interview assistant providing real-time answers to the candidate during their job interview.`);
    instructions.push(`Your goal is to give the candidate immediate, natural, and winning answers that sound authentic and highly competent.`);

    // 2. Format requirements (Spectra responseFormat 1:1)
    if (format === 'Bullets only' || format === 'bullets') {
        instructions.push(`FORMAT: Provide only concise bullet points (2 to 4 bullets). No long paragraphs. Use clear markdown bullet points with bold keywords.`);
    } else if (format === 'Concise script' || format === 'paragraph') {
        instructions.push(`FORMAT: Provide a continuous natural spoken script that the candidate can speak word-for-word.`);
    } else {
        // Balanced: Script + bullets
        instructions.push(`FORMAT: Start with ONE punchy opening sentence the candidate can speak immediately to buy time and sound confident. Then follow with 2-3 structured markdown bullet points providing the technical substance or examples.`);
    }

    // 3. Length requirements (Spectra responseLength 1:1)
    if (length === 'Concise' || length === 'concise' || length === 'Short') {
        instructions.push(`LENGTH: Concise / Short. Deliver the core answer in under 40-60 words so it can be spoken in 20 seconds. Zero fluff.`);
    } else if (length === 'Comprehensive' || length === 'detailed' || length === 'Long') {
        instructions.push(`LENGTH: Detailed / Comprehensive. Provide full technical depth, mention trade-offs, architecture patterns, and edge cases.`);
    } else {
        // Balanced
        instructions.push(`LENGTH: Balanced. Provide the essential answer with relevant technical context (around 60-100 words total).`);
    }

    // 4. Tone requirements (Spectra responseTone 1:1)
    if (tone === 'Formal' || tone === 'formal') {
        instructions.push(`TONE: Formal and authoritative. Use precise industry terminology, corporate professionalism, and clean technical diction.`);
    } else if (tone === 'Conversational' || tone === 'casual') {
        instructions.push(`TONE: Conversational and relaxed. Speak like a collaborative senior colleague in an informal technical chat.`);
    } else {
        // Simple
        instructions.push(`TONE: Simple and direct. Use plain language with zero unnecessary buzzwords or complex jargon.`);
    }

    // 5. STAR Method (Situation, Task, Action, Result)
    if (useStarMethod) {
        instructions.push(`METHODOLOGY: Strictly apply the STAR method:
- Situation: 1 brief sentence on context/problem.
- Task: 1 sentence on the challenge/goal.
- Action: What YOU specifically did (technical decisions, implementation).
- Result: Concrete measurable impact and lessons learned.`);
    }

    // 6. Natural filler words (Spectra useFillerWords 1:1)
    if (useFillerWords) {
        instructions.push(`NATURAL SPEECH: Begin with a subtle natural conversational pause/phrase (e.g., "Well,", "To be fair,", "Honestly, in my experience,") so it sounds completely spontaneous rather than read.`);
    }

    // 7. Extra Candidate Instructions
    if (extraInstructions && extraInstructions.trim()) {
        instructions.push(`CANDIDATE'S PERSONAL INSTRUCTIONS:
${extraInstructions.trim()}`);
    }

    // 8. Coding / System Design specifics
    instructions.push(`TECHNICAL INSTRUCTIONS:
- For LeetCode / Coding: state the optimal time and space complexity upfront, give clean readable code in a single markdown code block, and briefly explain edge cases.
- For System Design: cover functional requirements, data flow, scale estimates, storage choices, and failure modes.`);

    const parts = [instructions.join('\n\n')];

    const profileText = buildCandidateProfile(persistentContext);
    if (profileText) {
        parts.push("=================================================================================");
        parts.push("PERSISTENT CANDIDATE CONTEXT & TARGET ROLE:");
        parts.push(profileText);
        parts.push("=================================================================================");
    }

    if (conversationHistory && conversationHistory.length > 0) {
        parts.push("RECENT CONVERSATION HISTORY:");
        const recent = conversationHistory.slice(-5);
        recent.forEach((item, idx) => {
            if (item.interviewer_question) parts.push(`Q${idx + 1}: ${item.interviewer_question}`);
            if (item.ai_response) parts.push(`A${idx + 1}: ${item.ai_response.slice(0, 250)}...`);
        });
        parts.push("=================================================================================");
    }

    parts.push(`CURRENT INTERVIEWER QUESTION:
"${question}"

Provide the winning response for the candidate right now:`);

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
