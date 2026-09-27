const OpenAI = require('openai');

class LLMService {
    constructor(providerConfig) {
        this.name = providerConfig.name;
        this.baseURL = providerConfig.baseURL;
        this.model = providerConfig.defaultModel || (providerConfig.models && providerConfig.models[0]?.modelName);
        this.requestParams = providerConfig.requestParams || {};
        
        // Filter out placeholders
        const rawKeys = providerConfig.apiKeys && providerConfig.apiKeys.length 
            ? providerConfig.apiKeys 
            : [providerConfig.apiKey];
            
        this.apiKeys = rawKeys.filter(k => k && !k.includes('YOUR_') && !k.includes('_HERE'));
        this.keyIndex = 0;
        this.client = null;
        this.initClient();
    }

    initClient() {
        const key = this.apiKeys[this.keyIndex] || '';
        if (key) {
            this.client = new OpenAI({
                baseURL: this.baseURL,
                apiKey: key,
                dangerouslyAllowBrowser: false
            });
        } else {
            this.client = null;
        }
    }

    rotateKey() {
        if (this.apiKeys.length <= 1) return;
        this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
        console.log(`[LLM] Rotating key for ${this.name} -> index ${this.keyIndex}`);
        this.initClient();
    }

    async verifyConnection(modelName) {
        if (!this.client) return false;
        try {
            const testModel = modelName || this.model;
            const resp = await this.client.chat.completions.create({
                model: testModel,
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 5
            });
            return Boolean(resp && resp.choices);
        } catch (err) {
            console.error(`[LLM] Verification error for ${this.name}:`, err.message);
            return false;
        }
    }

    async streamAnswer(prompt, onChunk, maxTokens = 2048) {
        if (!this.client) {
            throw new Error(`Provider ${this.name} has no valid API key configured.`);
        }

        let attempts = 0;
        const maxAttempts = Math.max(1, this.apiKeys.length);

        while (attempts < maxAttempts) {
            try {
                const stream = await this.client.chat.completions.create({
                    model: this.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    stream: true,
                    max_tokens: maxTokens,
                    temperature: 0.6,
                    ...this.requestParams
                });

                let fullText = '';
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || '';
                    if (text) {
                        fullText += text;
                        if (onChunk) onChunk(text);
                    }
                }
                return fullText;
            } catch (err) {
                console.warn(`[LLM] Error with ${this.name} (key index ${this.keyIndex}):`, err.message);
                attempts++;
                if (this.apiKeys.length > 1) {
                    this.rotateKey();
                } else {
                    throw err;
                }
            }
        }
        throw new Error(`All keys exhausted for provider ${this.name}`);
    }

    async streamVision(prompt, base64Images = [], onChunk) {
        if (!this.client) {
            throw new Error(`Vision provider ${this.name} has no valid API key.`);
        }

        const content = [{ type: 'text', text: prompt }];
        for (const img of base64Images) {
            const url = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
            content.push({
                type: 'image_url',
                image_url: { url }
            });
        }

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content }],
            stream: true,
            max_tokens: 2500,
            temperature: 0.5
        });

        let fullText = '';
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
                fullText += text;
                if (onChunk) onChunk(text);
            }
        }
        return fullText;
    }
}

module.exports = { LLMService };
