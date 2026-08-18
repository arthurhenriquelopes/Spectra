import { devLog, devWarn } from './config.js';
import screenshotService from './screenshot-service.js';

export class StateManager {
    constructor() {
        this.appState = {
            onboardingData: {},
            socket: null,
            aiProviders: [],
            selectedProvider: {
                name: null,
                model: null,
            },
            selectedSecondaryProvider: {
                name: null,
                model: null,
            },
            selectedVisionProvider: {
                name: null,
                model: null,
            },
            selectedSecondaryVisionProvider: {
                name: null,
                model: null,
            },
            selectedLanguages: [],
            currentPreset: null,
            availablePresets: [],
            systemStatus: null,
            visionMode: {
                isActive: false,
                screenshotQueue: [],
                maxScreenshots: 4,
                currentVisionProvider: 'primary',
                lastSwitchTime: 0,
                switchCooldown: 1000
            }
        };
        
        // DOM form elements
        this.onboardingForm = {};
        this.initializeFormElements();

        // Initialize resume upload handler
        this.initResumeUpload();

        // Vision mode debouncing
        this.lastVisionToggleTime = 0;
        this.visionToggleCooldown = 500;
        this.lastScreenshotTime = 0;
        this.screenshotCooldown = 300;
    }

    initializeFormElements() {
        // Initialize DOM elements safely
        this.onboardingForm = {
            name: document.getElementById('user-name'),
            company: document.getElementById('user-company'),
            role: document.getElementById('user-role'),
            resume: document.getElementById('user-resume'),
            focusCheckboxes: document.querySelectorAll('input[name="focus"]'),
            objectives: document.getElementById('user-objectives'),
            providerSelect: document.getElementById('ai-provider-select'),
            modelSelect: document.getElementById('ai-model-select'),
            secondaryProviderSelect: document.getElementById('ai-secondary-provider-select'),
            secondaryModelSelect: document.getElementById('ai-secondary-model-select'),
            visionProviderSelect: document.getElementById('vision-provider-select'),
            visionModelSelect: document.getElementById('vision-model-select'),
            visionSecondaryProviderSelect: document.getElementById('vision-secondary-provider-select'),
            visionSecondaryModelSelect: document.getElementById('vision-secondary-model-select'),
            languageCheckboxes: document.querySelectorAll('input[name="language"]'),
        };
    }

    getState() {
        return this.appState;
    }

    updateState(updates) {
        Object.assign(this.appState, updates);
    }

    setSocket(socket) {
        this.appState.socket = socket;
    }

    handleOnboarding() {
        const requiredFields = {
            'user-name': 'Name',
            'user-role': 'Role',
            'user-resume': 'Resume',
            'user-objectives': 'Job Description',
            'ai-provider-select': 'AI Provider',
            'ai-model-select': 'AI Model'
        };

        let allValid = true;

        for (const [id, name] of Object.entries(requiredFields)) {
            const element = document.getElementById(id);
            if (!element || !element.value) {
                alert(`${name} is a required field.`);
                allValid = false;
                break;
            }
        }

        const focusCheckboxes = Array.from(this.onboardingForm.focusCheckboxes || []).filter(cb => cb.checked);
        if (focusCheckboxes.length === 0) {
            alert('Please select at least one Interview Focus.');
            allValid = false;
        }

        if (!allValid) return false;

        // Validate secondary provider selection
        const secondaryProvider = this.onboardingForm.secondaryProviderSelect?.value || '';
        const secondaryModel = this.onboardingForm.secondaryModelSelect?.value || '';
        
        if ((secondaryProvider && !secondaryModel) || (!secondaryProvider && secondaryModel)) {
            alert('If you select a secondary provider, you must also select a secondary model (or leave both empty).');
            return false;
        }

        if (secondaryProvider && secondaryModel) {
            const primaryProvider = this.onboardingForm.providerSelect?.value || '';
            const primaryModel = this.onboardingForm.modelSelect?.value || '';
            
            if (primaryProvider === secondaryProvider && primaryModel === secondaryModel) {
                alert('Primary and secondary AI models cannot be the same. Please select different models.');
                return false;
            }
        }

        // Validate vision providers
        const visionProvider = this.onboardingForm.visionProviderSelect?.value || '';
        const visionModel = this.onboardingForm.visionModelSelect?.value || '';
        
        if ((visionProvider && !visionModel) || (!visionProvider && visionModel)) {
            alert('If you select a vision provider, you must also select a vision model (or leave both empty).');
            return false;
        }

        const secondaryVisionProvider = this.onboardingForm.visionSecondaryProviderSelect?.value || '';
        const secondaryVisionModel = this.onboardingForm.visionSecondaryModelSelect?.value || '';
        
        if ((secondaryVisionProvider && !secondaryVisionModel) || (!secondaryVisionProvider && secondaryVisionModel)) {
            alert('If you select a secondary vision provider, you must also select a secondary vision model (or leave both empty).');
            return false;
        }

        // Store validated data
        const focus = focusCheckboxes.map(cb => cb.value);
        const selectedLanguages = Array.from(this.onboardingForm.languageCheckboxes || [])
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        this.appState.onboardingData = {
            name: this.onboardingForm.name?.value || '',
            company: this.onboardingForm.company?.value || '',
            role: this.onboardingForm.role?.value || '',
            resume: this.onboardingForm.resume?.value || '',
            focus: focus,
            objectives: this.onboardingForm.objectives?.value || '',
        };

        this.appState.selectedProvider.name = this.onboardingForm.providerSelect?.value || null;
        this.appState.selectedProvider.model = this.onboardingForm.modelSelect?.value || null;
        this.appState.selectedSecondaryProvider.name = secondaryProvider || null;
        this.appState.selectedSecondaryProvider.model = secondaryModel || null;
        this.appState.selectedVisionProvider.name = visionProvider || null;
        this.appState.selectedVisionProvider.model = visionModel || null;
        this.appState.selectedSecondaryVisionProvider.name = secondaryVisionProvider || null;
        this.appState.selectedSecondaryVisionProvider.model = secondaryVisionModel || null;
        this.appState.selectedLanguages = selectedLanguages;

        devLog("Onboarding data captured:", this.appState);
        return true;
    }

    initResumeUpload() {
        const fileInput = document.getElementById('resume-pdf-upload');
        const statusSpan = document.getElementById('resume-upload-status');
        const resumeTextarea = document.getElementById('user-resume');
        
        if (!fileInput) return;
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const maxSize = 5 * 1024 * 1024; // 5MB limit
            if (file.size > maxSize) {
                statusSpan.textContent = '❌ File too large (max 5MB)';
                statusSpan.className = 'upload-status error';
                return;
            }
            
            statusSpan.textContent = '⏳ Reading...';
            statusSpan.className = 'upload-status loading';
            
            try {
                if (file.name.endsWith('.txt')) {
                    // Plain text file
                    const text = await file.text();
                    resumeTextarea.value = text;
                    statusSpan.textContent = `✅ ${file.name} loaded`;
                    statusSpan.className = 'upload-status success';
                } else if (file.name.endsWith('.pdf')) {
                    // PDF - extract text using basic approach
                    const arrayBuffer = await file.arrayBuffer();
                    const text = this._extractTextFromPDF(arrayBuffer);
                    if (text && text.trim().length > 50) {
                        resumeTextarea.value = text.trim();
                        statusSpan.textContent = `✅ ${file.name} parsed`;
                        statusSpan.className = 'upload-status success';
                    } else {
                        statusSpan.textContent = '⚠️ Could not parse PDF. Please paste text manually.';
                        statusSpan.className = 'upload-status error';
                    }
                }
            } catch (err) {
                console.error('Resume upload error:', err);
                statusSpan.textContent = '❌ Error reading file';
                statusSpan.className = 'upload-status error';
            }
        });
    }
    
    _extractTextFromPDF(arrayBuffer) {
        // Lightweight PDF text extraction without external libraries.
        // Works for most text-based PDFs (not scanned images).
        try {
            const bytes = new Uint8Array(arrayBuffer);
            const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
            
            // Extract text between BT...ET blocks (PDF text objects)
            const textBlocks = [];
            const btEtRegex = /BT\s([\s\S]*?)\s*ET/g;
            let match;
            
            while ((match = btEtRegex.exec(text)) !== null) {
                const block = match[1];
                // Extract text from Tj and TJ operators
                const tjRegex = /\(([^)]*?)\)\s*Tj/g;
                let tjMatch;
                while ((tjMatch = tjRegex.exec(block)) !== null) {
                    textBlocks.push(tjMatch[1]);
                }
                // Extract from TJ arrays
                const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
                let tjArrMatch;
                while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
                    const arrContent = tjArrMatch[1];
                    const strRegex = /\(([^)]*?)\)/g;
                    let strMatch;
                    while ((strMatch = strRegex.exec(arrContent)) !== null) {
                        textBlocks.push(strMatch[1]);
                    }
                }
            }
            
            // Decode PDF escape sequences
            let result = textBlocks.join(' ')
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\{2}/g, '\\')
                .replace(/\s{3,}/g, '\n\n')
                .replace(/  +/g, ' ');
            
            return result;
        } catch (e) {
            console.error('PDF extraction error:', e);
            return '';
        }
    }

    isLiveInterviewActive() {
        const currentView = document.querySelector('.view.active');
        return currentView && currentView.id === 'live-view';
    }

    // Vision Mode Functions

    /**
     * Images the selected vision provider accepts in one request.
     * Returns undefined when the provider does not declare a limit, which
     * leaves the screenshot queue on its default cap.
     */
    _visionMaxImages(providerName) {
        const provider = (this.appState.aiProviders || []).find(p => p.name === providerName);
        return provider?.maxImages;
    }

    toggleVisionMode() {
        console.log('🎮 toggleVisionMode called (could be from global hotkey)');
        
        // Debounce rapid calls
        const now = Date.now();
        if (now - this.lastVisionToggleTime < this.visionToggleCooldown) {
            console.log('🎮 Ignoring rapid vision mode toggle (debounced)');
            return false;
        }
        this.lastVisionToggleTime = now;
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Vision mode only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before using vision mode');
            } else {
                alert('Please start the interview before using vision mode');
            }
            return false;
        }
        
        if (!this.appState.selectedVisionProvider.name || !this.appState.selectedVisionProvider.model) {
            console.warn('⚠️ Vision mode requires a vision model to be configured');
            if (window.presetManager) {
                presetManager.showErrorNotification('Vision model not configured. Please set up a vision provider in onboarding.');
            } else {
                alert('Vision model not configured. Please configure a vision provider in onboarding.');
            }
            return false;
        }
        
        this.appState.visionMode.isActive = !this.appState.visionMode.isActive;
        
        if (this.appState.visionMode.isActive) {
            const currentProvider = this.appState.visionMode.currentVisionProvider === 'primary' 
                ? this.appState.selectedVisionProvider 
                : this.appState.selectedSecondaryVisionProvider;
                
            screenshotService.setVisionConfig(currentProvider.name, currentProvider.model, this._visionMaxImages(currentProvider.name));
            screenshotService.setProgrammingLanguages(this.appState.selectedLanguages);
            screenshotService.showVisionMode(true);
            
            if (window.muteManager) {
                muteManager.setUniversalMute(true);
            }
            
            devLog('👁️ Vision mode activated (global hotkey)');
            console.log('👁️ Vision mode activated - Audio processing paused');
        } else {
            screenshotService.showVisionMode(false);
            
            if (window.muteManager) {
                muteManager.setUniversalMute(false);
            }
            
            devLog('👁️ Vision mode deactivated (global hotkey)');
            console.log('👁️ Vision mode deactivated - Audio processing resumed');
        }
        
        return this.appState.visionMode.isActive;
    }

    switchVisionModel() {
        devLog('🔄 switchVisionModel called');

        if (!this.isLiveInterviewActive()) {
            const msg = 'Vision model can only be switched during a live interview.';
            devWarn(msg);
            if (window.presetManager) presetManager.showErrorNotification(msg);
            return false;
        }

        if (!this.appState.visionMode.isActive) {
            const msg = 'Vision model switching is only available in Vision Mode (Alt+V).';
            devWarn(msg);
            if (window.presetManager) presetManager.showErrorNotification(msg);
            return false;
        }

        const now = Date.now();
        if (now - this.appState.visionMode.lastSwitchTime < this.appState.visionMode.switchCooldown) {
            devLog('🔄 Vision model switch cooldown active, ignoring.');
            return false;
        }

        if (!this.appState.selectedSecondaryVisionProvider || !this.appState.selectedSecondaryVisionProvider.name || !this.appState.selectedSecondaryVisionProvider.model) {
            const msg = 'No secondary vision model configured.';
            devWarn(msg, 'Please select one in the onboarding screen.');
            if (window.presetManager) presetManager.showErrorNotification(msg, 'Please select one on the onboarding screen.');
            return false;
        }

        this.appState.visionMode.lastSwitchTime = now;

        const wasOnPrimary = this.appState.visionMode.currentVisionProvider === 'primary';
        this.appState.visionMode.currentVisionProvider = wasOnPrimary ? 'secondary' : 'primary';

        const currentProviderConfig = wasOnPrimary
            ? this.appState.selectedSecondaryVisionProvider
            : this.appState.selectedVisionProvider;

        screenshotService.setVisionConfig(currentProviderConfig.name, currentProviderConfig.model, this._visionMaxImages(currentProviderConfig.name));
        screenshotService.updateQueueUI();

        const providerType = wasOnPrimary ? 'Secondary (2°)' : 'Primary (1°)';
        const message = `Switched to ${providerType} Vision Model: ${currentProviderConfig.model}`;
        
        if (window.presetManager) {
            presetManager.showSuccessNotification(message);
        }
        
        devLog(`🔄 Switched to ${providerType} vision model:`, currentProviderConfig);
        return true;
    }

    // Screenshot Functions
    async captureScreenshot() {
        console.log('🎮 captureScreenshot called (could be from global hotkey)');
        
        const now = Date.now();
        if (now - this.lastScreenshotTime < this.screenshotCooldown) {
            console.log('🎮 Ignoring rapid screenshot capture (debounced)');
            return false;
        }
        this.lastScreenshotTime = now;
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Screenshots only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before taking screenshots');
            } else {
                alert('Please start the interview before taking screenshots');
            }
            return false;
        }
        
        if (!this.appState.visionMode.isActive) {
            console.warn('⚠️ Screenshots can only be taken in vision mode - use Alt+V to enter vision mode first');
            if (window.presetManager) {
                presetManager.showErrorNotification('Enter vision mode first (Alt+V) before taking screenshots');
            } else {
                alert('Enter vision mode first (Alt+V) before taking screenshots');
            }
            return false;
        }
        
        console.log('📸 Taking screenshot via global hotkey');
        return await screenshotService.captureScreenshot();
    }

    async processScreenshots() {
        console.log('🎮 processScreenshots called (could be from global hotkey)');
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Screenshot processing only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before processing screenshots');
            } else {
                alert('Please start the interview before processing screenshots');
            }
            return false;
        }
        
        if (!this.appState.visionMode.isActive) {
            console.warn('⚠️ Screenshots can only be processed in vision mode - use Alt+V to enter vision mode first');
            if (window.presetManager) {
                presetManager.showErrorNotification('Enter vision mode first (Alt+V) before processing screenshots');
            } else {
                alert('Enter vision mode first (Alt+V) before processing screenshots');
            }
            return false;
        }
        
        console.log('🔄 Processing screenshots via global hotkey');
        return await screenshotService.processQueue();
    }

    async resetScreenshotQueue() {
        console.log('🎮 resetScreenshotQueue called (could be from global hotkey)');
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Screenshot queue reset only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before resetting screenshot queue');
            } else {
                alert('Please start the interview before resetting screenshot queue');
            }
            return false;
        }
        
        if (!this.appState.visionMode.isActive) {
            console.warn('⚠️ Screenshot queue can only be reset in vision mode - use Alt+V to enter vision mode first');
            if (window.presetManager) {
                presetManager.showErrorNotification('Enter vision mode first (Alt+V) before resetting screenshot queue');
            } else {
                alert('Enter vision mode first (Alt+V) before resetting screenshot queue');
            }
            return false;
        }
        
        console.log('🗑️ Resetting screenshot queue via global hotkey');
        screenshotService.clearQueue();
        return true;
    }

    // Audio Toggle Functions
    toggleMicMute() {
        console.log('🎮 toggleMicMute called (could be from global hotkey)');
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Microphone mute only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before using microphone controls');
            } else {
                alert('Please start the interview before using microphone controls');
            }
            return false;
        }
        
        if (window.muteManager) {
            const currentStatus = muteManager.getMuteStatus();
            const newMicStatus = !currentStatus.microphone;
            muteManager.setMicrophoneMute(newMicStatus);
            
            const status = newMicStatus ? 'muted' : 'unmuted';
            console.log(`🎤 Microphone ${status} via global hotkey`);
            
            if (window.presetManager) {
                presetManager.showSwitchNotification({
                    message: `Microphone ${status}`,
                    type: 'audio'
                });
            }
            
            devLog(`🎤 Microphone ${status} (global hotkey)`);
            return true;
        } else {
            console.warn('⚠️ Mute manager not available');
            return false;
        }
    }

    toggleUniversalMute() {
        console.log('🎮 toggleUniversalMute called (could be from global hotkey)');
        
        if (!this.isLiveInterviewActive()) {
            console.warn('⚠️ Universal mute only available during live interview');
            if (window.presetManager) {
                presetManager.showErrorNotification('Start the interview first before using audio controls');
            } else {
                alert('Please start the interview before using audio controls');
            }
            return false;
        }
        
        if (window.muteManager) {
            const currentStatus = muteManager.getMuteStatus();
            const newUniversalStatus = !currentStatus.universal;
            muteManager.setUniversalMute(newUniversalStatus);
            
            const status = newUniversalStatus ? 'paused' : 'active';
            console.log(`⏸️ System ${status} via global hotkey`);
            
            if (window.presetManager) {
                presetManager.showSwitchNotification({
                    message: `System ${status}`,
                    type: 'audio'
                });
            }
            
            devLog(`⏸️ System ${status} (global hotkey)`);
            return true;
        } else {
            console.warn('⚠️ Mute manager not available');
            return false;
        }
    }

    getSystemStatus() {
        if (this.appState.socket && this.appState.socket.readyState === WebSocket.OPEN) {
            this.appState.socket.send(JSON.stringify({ 
                type: 'get_system_status', 
                payload: {} 
            }));
        }
    }

    // Comprehensive state clearing for interview end
    clearInterviewState() {
        console.log('🧹 Clearing interview state...');
        
        // Reset vision mode completely
        this.appState.visionMode = {
            isActive: false,
            screenshotQueue: [],
            maxScreenshots: 4,
            currentVisionProvider: 'primary',
            lastSwitchTime: 0,
            switchCooldown: 1000
        };

        // Clear preset and system status
        this.appState.currentPreset = null;
        this.appState.systemStatus = null;

        // Reset timers and debouncing
        this.lastVisionToggleTime = 0;
        this.lastScreenshotTime = 0;

        // Clear screenshot service
        if (window.screenshotService) {
            screenshotService.clearQueue();
            screenshotService.showVisionMode(false);
        }

        // Reset mute manager
        if (window.muteManager) {
            muteManager.setMicrophoneMute(false);
            muteManager.setUniversalMute(false);
        }

        // Clear any pending vision analysis
        if (window.visionAnalysisResolver) {
            window.visionAnalysisResolver = null;
        }

        console.log('✅ Interview state cleared successfully');
        return true;
    }

    // Reset to initial state (for complete restart)
    resetToInitialState() {
        console.log('🔄 Resetting to initial state...');
        
        // Clear interview state first
        this.clearInterviewState();

        // Clear socket reference (but don't close it here - let WebSocketHandler handle that)
        this.appState.socket = null;

        // Keep onboarding data and provider selections intact
        // This allows user to restart interview without re-entering data
        
        console.log('✅ Reset to initial state complete');
        return true;
    }
} 