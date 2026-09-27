const { LLMService } = require('./llm');
const { DeepgramLiveSTT, verifyDeepgramKey } = require('./stt');
const { getInterviewAnswerPrompt, getVisionPrompt } = require('./prompts');
const fs = require('fs');
const path = require('path');

function resolveProviderConfig(conf) {
    if (!conf) return null;
    const name = conf.name || conf.provider;
    if (!name) return conf;

    try {
        const rootDir = path.resolve(__dirname, '../../');
        const providersPath = path.join(rootDir, 'ai_providers.json');
        if (fs.existsSync(providersPath)) {
            const list = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
            const found = list.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (found) {
                return {
                    ...found,
                    ...conf,
                    model: conf.model || found.defaultModel,
                    defaultModel: conf.model || found.defaultModel
                };
            }
        }
    } catch (e) {
        console.error('Error resolving provider config:', e);
    }
    return conf;
}

class InterviewSession {
    constructor(sessionId, sendJsonCallback) {
        this.sessionId = sessionId;
        this.sendJson = sendJsonCallback;
        
        this.primaryLLM = null;
        this.secondaryLLM = null;
        this.primaryVision = null;
        this.secondaryVision = null;
        this.activePreset = 'Primary';

        this.stt = null;
        this.deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';

        this.persistentContext = {};
        this.conversationHistory = [];
        this.state = {
            is_muted: false,
            process_all_speakers: true,
            is_universally_muted: false
        };

        this.currentInterviewerSpeech = '';
        this.silenceTimer = null;
        this.isProcessingAI = false;
    }

    setDeepgramKey(key) {
        this.deepgramApiKey = key;
    }

    async handleVerifyDeepgram(payload) {
        const key = payload?.key || this.deepgramApiKey;
        const valid = await verifyDeepgramKey(key);
        this.sendJson('api_key_status', { service: 'deepgram', valid });
    }

    async handleStartInterview(payload) {
        try {
            console.log(`[Session ${this.sessionId}] Initializing interview providers...`);
            this.state.is_muted = payload.is_muted || false;
            this.state.process_all_speakers = payload.process_all_speakers !== false;
            this.state.is_universally_muted = payload.is_universally_muted || false;
            this.persistentContext = payload.onboardingData || {};

            if (payload.aiProvider) {
                this.primaryLLM = new LLMService(resolveProviderConfig(payload.aiProvider));
            }
            if (payload.aiSecondaryProvider) {
                this.secondaryLLM = new LLMService(resolveProviderConfig(payload.aiSecondaryProvider));
            }
            if (payload.visionProvider) {
                this.primaryVision = new LLMService(resolveProviderConfig(payload.visionProvider));
            }
            if (payload.visionSecondaryProvider) {
                this.secondaryVision = new LLMService(resolveProviderConfig(payload.visionSecondaryProvider));
            }

            // Start STT
            if (this.stt) {
                this.stt.close();
            }
            this.stt = new DeepgramLiveSTT(this.deepgramApiKey, (data) => this.onTranscript(data));
            this.stt.connect();

            // Health checks
            const healthResults = {
                primary: this.primaryLLM ? Boolean(this.primaryLLM.client) : false,
                secondary: this.secondaryLLM ? Boolean(this.secondaryLLM.client) : false
            };

            this.sendJson('preset_initialized', {
                current_preset: 'Primary',
                available_presets: ['Primary', 'Secondary'],
                health_status: healthResults
            });
            console.log(`[Session ${this.sessionId}] Interview started successfully.`);
        } catch (err) {
            console.error(`[Session ${this.sessionId}] Error starting interview:`, err);
            this.sendJson('error', { message: `Failed to initialize: ${err.message}` });
        }
    }

    onTranscript(data) {
        const { transcript, is_final, speaker } = data;
        this.sendJson('transcript_update', {
            transcript,
            is_final,
            speaker
        });

        if (this.state.is_universally_muted) return;

        if (is_final) {
            this.currentInterviewerSpeech += ' ' + transcript;
            this.resetSilenceTimer();
        }
    }

    resetSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }

        // Trigger AI after 1.8 seconds of silence following interviewer speech
        this.silenceTimer = setTimeout(() => {
            const question = this.currentInterviewerSpeech.trim();
            if (question.length > 5 && !this.isProcessingAI) {
                this.currentInterviewerSpeech = '';
                this.triggerAIAnswer(question);
            }
        }, 1800);
    }

    async triggerAIAnswer(question) {
        this.isProcessingAI = true;
        const llm = (this.activePreset === 'Secondary' && this.secondaryLLM) ? this.secondaryLLM : this.primaryLLM;

        if (!llm) {
            this.sendJson('error', { message: 'No AI provider active for interview answers.' });
            this.isProcessingAI = false;
            return;
        }

        const prompt = getInterviewAnswerPrompt(question, this.persistentContext, this.conversationHistory);
        this.sendJson('ai_processing_started', { prompt: question });

        const startTime = Date.now();
        let fullAnswer = '';

        try {
            fullAnswer = await llm.streamAnswer(prompt, (chunk) => {
                this.sendJson('ai_answer_chunk', { chunk });
            });

            const durationMs = Date.now() - startTime;
            this.conversationHistory.push({
                interviewer_question: question,
                ai_response: fullAnswer
            });

            this.sendJson('ai_answer_complete', {
                full_answer: fullAnswer,
                duration_ms: durationMs
            });
        } catch (err) {
            console.error('[Session] AI Answer generation failed:', err.message);
            this.sendJson('error', { message: `AI error: ${err.message}` });
        } finally {
            this.isProcessingAI = false;
        }
    }

    handleAudioChunk(payload) {
        if (!this.stt || this.state.is_universally_muted) return;
        const b64 = payload.audio_b64;
        if (b64) {
            try {
                const buffer = Buffer.from(b64, 'base64');
                this.stt.sendAudio(buffer);
            } catch (err) {
                console.warn('[Session] Invalid audio chunk:', err.message);
            }
        }
    }

    async handleAnalyzeVision(payload) {
        const { images = [], prompt = '' } = payload;
        const visionService = (this.activePreset === 'Secondary' && this.secondaryVision) 
            ? this.secondaryVision 
            : (this.primaryVision || this.primaryLLM);

        if (!visionService) {
            this.sendJson('error', { message: 'No vision provider configured.' });
            return;
        }

        this.sendJson('ai_processing_started', { prompt: prompt || 'Screen analysis' });
        const visionPrompt = getVisionPrompt(prompt, this.persistentContext);
        const startTime = Date.now();

        try {
            const answer = await visionService.streamVision(visionPrompt, images, (chunk) => {
                this.sendJson('ai_answer_chunk', { chunk });
            });

            this.sendJson('ai_answer_complete', {
                full_answer: answer,
                duration_ms: Date.now() - startTime
            });
        } catch (err) {
            console.error('[Session] Vision analysis failed:', err.message);
            this.sendJson('error', { message: `Vision error: ${err.message}` });
        }
    }

    handleSwitchPreset(payload) {
        const target = payload.preset || 'Primary';
        this.activePreset = target;
        this.sendJson('preset_switched', {
            current_preset: target,
            preset_name: target
        });
    }

    handleResetSession() {
        this.conversationHistory = [];
        this.currentInterviewerSpeech = '';
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.isProcessingAI = false;
        this.sendJson('session_reset_complete', {});
    }

    destroy() {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        if (this.stt) this.stt.close();
    }
}

module.exports = { InterviewSession };
