const WebSocket = require('ws');

class DeepgramLiveSTT {
    constructor(apiKey, onTranscript) {
        this.apiKey = apiKey;
        this.onTranscript = onTranscript;
        this.ws = null;
        this.isConnected = false;
        this.queue = [];
    }

    connect() {
        if (!this.apiKey || this.apiKey.includes('YOUR_')) {
            console.warn('[STT] No valid Deepgram API key provided.');
            return;
        }

        const url = 'wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&punctuate=true&interim_results=true&smart_format=true';
        this.ws = new WebSocket(url, {
            headers: {
                Authorization: `Token ${this.apiKey}`
            }
        });

        this.ws.on('open', () => {
            this.isConnected = true;
            console.log('[STT] Connected to Deepgram Live Transcription');
            while (this.queue.length > 0) {
                const chunk = this.queue.shift();
                this.ws.send(chunk);
            }
        });

        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.channel && msg.channel.alternatives && msg.channel.alternatives.length > 0) {
                    const alt = msg.channel.alternatives[0];
                    const transcript = alt.transcript;
                    const isFinal = msg.is_final || false;
                    const speaker = (alt.words && alt.words[0]?.speaker !== undefined) ? alt.words[0].speaker : 0;
                    
                    if (transcript && transcript.trim().length > 0) {
                        this.onTranscript({
                            transcript: transcript.trim(),
                            is_final: isFinal,
                            speaker: speaker
                        });
                    }
                }
            } catch (err) {
                console.error('[STT] Error parsing Deepgram message:', err);
            }
        });

        this.ws.on('close', () => {
            this.isConnected = false;
            console.log('[STT] Deepgram connection closed.');
        });

        this.ws.on('error', (err) => {
            console.error('[STT] Deepgram error:', err.message);
        });
    }

    sendAudio(buffer) {
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(buffer);
        } else {
            if (this.queue.length < 50) {
                this.queue.push(buffer);
            }
        }
    }

    close() {
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {}
            this.ws = null;
            this.isConnected = false;
        }
    }
}

async function verifyDeepgramKey(apiKey) {
    if (!apiKey || apiKey.includes('YOUR_')) return false;
    try {
        const resp = await fetch('https://api.deepgram.com/v1/projects', {
            headers: { Authorization: `Token ${apiKey}` }
        });
        return resp.status === 200;
    } catch (e) {
        return false;
    }
}

module.exports = {
    DeepgramLiveSTT,
    verifyDeepgramKey
};
