// ==========================================================================
// SPECTRA — PARAKEET AI UI CONTROLLER (1:1 FIDELITY)
// Handles Header Controls, Settings Dropdown, Themes, Private Mode,
// Create Session Stepper, Answer Preferences Modal, AI Instructions Modal,
// Live Session View, and Session History.
// ==========================================================================

const QUESTION_TYPE_PREVIEWS = {
    'behavioral': {
        question: 'Share a time you disagreed with a teammate on a technical choice.',
        answer: 'I once disagreed with a teammate about whether to use a third-party caching tool or build a simple in-memory cache for our backend service.',
        bullets: [
            'My teammate wanted to use Redis right away to save time, but I felt it was too heavy for our current traffic and would add extra cost and setup work.',
            'We set up a quick test to measure how fast our database was without a cache, and we looked at our actual user traffic numbers together.',
            'The data showed that a simple in-memory cache using built-in language structures was sufficient for the next six months without adding external dependencies.',
            'We agreed to use the simple cache for now and set a clear latency trigger for when to migrate.'
        ]
    },
    'coding': {
        question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        answer: 'The optimal approach uses a single-pass Hash Map to achieve O(n) time complexity and O(n) space complexity.',
        bullets: [
            'Maintain a map of value to index as we iterate through nums.',
            'For each number, compute complement = target - nums[i].',
            'If complement exists in map, return [map[complement], i].',
            'Otherwise, insert nums[i] with its current index into the map.'
        ]
    },
    'experience': {
        question: 'How have you handled scaling database read queries under sudden high traffic spikes?',
        answer: 'I mitigated sudden query spikes by implementing read replicas and an asynchronous write-through cache.',
        bullets: [
            'Deployed multi-AZ read replicas to offload read-heavy dashboard and search queries from the primary instance.',
            'Added a distributed Redis layer with short TTLs for frequently queried endpoints.',
            'Established circuit breakers to gracefully degrade non-critical data when load exceeds thresholds.'
        ]
    },
    'how-do-you': {
        question: 'How do you decide between synchronous REST endpoints and asynchronous event-driven messaging?',
        answer: 'I evaluate based on latency sensitivity, coupling requirements, and failure blast radiuses.',
        bullets: [
            'Choose synchronous REST for immediate user-blocking operations where the client requires immediate confirmation.',
            'Choose asynchronous events (Kafka/RabbitMQ) for decoupled background workflows like email dispatch, analytics, or batch processing.',
            'Ensure all asynchronous handlers are idempotent with built-in retry queues and dead-letter queues.'
        ]
    },
    'situational': {
        question: 'What would you do if a critical deployment caused production errors 10 minutes before a company all-hands demo?',
        answer: 'My immediate priority is stabilizing customer impact by triggering a zero-downtime rollback.',
        bullets: [
            'Execute the automated rollback to the last verified stable build immediately without attempting in-place hotfixes.',
            'Notify stakeholders in the incident bridge with a concise status and estimated recovery window.',
            'Once production metrics verify green health, preserve container logs and telemetry for post-mortem debugging.'
        ]
    },
    'system-design': {
        question: 'Design a real-time URL shortening service like Bit.ly that handles 100M new URLs per month.',
        answer: 'The system needs high read availability, fast redirects, and unique 7-character Base62 keys.',
        bullets: [
            'Architecture: API Gateway -> Load Balancer -> Stateless Web Servers -> Distributed Key Generation Service (KGS).',
            'Storage: NoSQL (Cassandra/DynamoDB) for low-latency key-value lookups; Redis cluster for top 20% hottest URLs.',
            'Redundancy: Pre-generate keys in memory blocks to prevent collision overhead and ensure sub-10ms redirect response times.'
        ]
    },
    'technical': {
        question: 'Explain the difference between optimistic locking and pessimistic locking in relational databases.',
        answer: 'Both prevent race conditions during concurrent updates, but differ in contention management.',
        bullets: [
            'Pessimistic Locking: Locks the record immediately via SELECT FOR UPDATE; best for high write contention where collision rollback costs are prohibitive.',
            'Optimistic Locking: Uses a version counter or timestamp column; verifies version hasn\'t changed at commit time.',
            'Optimistic locking provides superior throughput for read-heavy workloads with infrequent collisions.'
        ]
    },
    'tell-me': {
        question: 'Tell me about yourself and walk me through your background as a software engineer.',
        answer: 'I\'m a full-stack engineer specialized in high-performance web systems and developer tooling.',
        bullets: [
            'Over the past several years, I\'ve architected distributed backends, optimized real-time communication pipelines, and built responsive UIs.',
            'At my most recent role, I led the modernization of our core service architecture, cutting latency by 45%.',
            'I thrive in environments where engineering rigor, performance profiling, and clean user experience meet.'
        ]
    }
};

class ParakeetUIController {
    constructor() {
        this.currentTheme = localStorage.getItem('spectra_theme') || 'light';
        this.isPrivateMode = true;
        this.currentZoom = 1.0;
        this.activeStep = 1;

        // Session creation state
        this.sessionData = {
            type: 'interview',
            company: '',
            jobDescription: '',
            resumeContent: localStorage.getItem('spectra_saved_resume') || '',
            resumeName: localStorage.getItem('spectra_saved_resume_name') || 'Arthur_Henrique_Lopes_Feitosa.pdf',
            documentsContent: localStorage.getItem('spectra_saved_docs') || '',
            documentsName: localStorage.getItem('spectra_saved_docs_name') || '',
            language: localStorage.getItem('spectra_lang') || 'English',
            model: localStorage.getItem('spectra_model') || 'Cerebras',
            autoGenerate: localStorage.getItem('spectra_auto_gen') !== 'false',
            saveTranscript: localStorage.getItem('spectra_save_transcript') !== 'false',
            aiInstructions: localStorage.getItem('spectra_ai_instructions') || '',
            answerPreferences: this.loadSavedAnswerPreferences()
        };

        this.init();
    }

    loadSavedAnswerPreferences() {
        try {
            const raw = localStorage.getItem('spectra_answer_prefs');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            format: 'Script + bullets',
            length: 'Balanced',
            tone: 'Simple',
            questionType: 'behavioral'
        };
    }

    saveAnswerPreferences(prefs) {
        this.sessionData.answerPreferences = prefs;
        localStorage.setItem('spectra_answer_prefs', JSON.stringify(prefs));
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindHeaderControls();
        this.bindSettingsDropdown();
        this.bindCreateSessionFlow();
        this.bindAnswerPreferencesModal();
        this.bindAiInstructionsModal();
        this.bindAiProvidersModal();
        this.bindTranscriptModal();
        this.bindLiveSessionControls();
        this.loadInitialPrivateMode();
        this.renderSessionCards();
    }

    // --- Theme Management ---
    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('spectra_theme', theme);
        
        let effectiveTheme = theme;
        if (theme === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);

        // Update active theme toggle buttons
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
        });
    }

    // --- Private Mode (Anti-Proctoring / Screenshot Toggle) ---
    async loadInitialPrivateMode() {
        if (window.spectraAPI && window.spectraAPI.getPrivateMode) {
            this.isPrivateMode = await window.spectraAPI.getPrivateMode();
        }
        const privateToggle = document.getElementById('private-mode-toggle');
        if (privateToggle) {
            privateToggle.checked = this.isPrivateMode;
        }
    }

    setPrivateMode(enabled) {
        this.isPrivateMode = enabled;
        if (window.spectraAPI && window.spectraAPI.setPrivateMode) {
            window.spectraAPI.setPrivateMode(enabled);
        }
        console.log(`[UI] Private mode: ${enabled ? 'ON (Hidden from capture)' : 'OFF (Visible in screenshots)'}`);
    }

    // --- Header Window Controls ---
    bindHeaderControls() {
        const closeBtn = document.getElementById('parakeet-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.spectraAPI && window.spectraAPI.closeApp) {
                    window.spectraAPI.closeApp();
                } else {
                    window.close();
                }
            });
        }

        const minimizeBtn = document.getElementById('parakeet-minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                if (window.spectraAPI && window.spectraAPI.minimizeApp) {
                    window.spectraAPI.minimizeApp();
                }
            });
        }

        const moveBtn = document.getElementById('parakeet-move-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => {
                if (window.spectraAPI && window.spectraAPI.openMoveOverlay) {
                    window.spectraAPI.openMoveOverlay();
                }
            });
        }
    }

    // --- Settings Dropdown ---
    bindSettingsDropdown() {
        const menuBtn = document.getElementById('parakeet-settings-menu-btn');
        const menuDropdown = document.getElementById('parakeet-dropdown-menu');
        const privateToggle = document.getElementById('private-mode-toggle');

        if (menuBtn && menuDropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuDropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
                    menuDropdown.classList.remove('active');
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    menuDropdown.classList.remove('active');
                }
            });
        }

        // Private switch
        if (privateToggle) {
            privateToggle.addEventListener('change', (e) => {
                this.setPrivateMode(e.target.checked);
            });
        }

        // Theme toggle buttons in menu
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTheme = btn.getAttribute('data-theme');
                this.applyTheme(targetTheme);
            });
        });

        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.currentZoom = Math.min(1.4, this.currentZoom + 0.1);
                document.body.style.zoom = this.currentZoom;
            });
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.currentZoom = Math.max(0.7, this.currentZoom - 0.1);
                document.body.style.zoom = this.currentZoom;
            });
        }
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                this.currentZoom = 1.0;
                document.body.style.zoom = 1.0;
            });
        }
    }

    // --- Create Session Modal Flow ---
    bindCreateSessionFlow() {
        const openCreateBtn = document.getElementById('btn-open-create-session');
        const cancelCreateBtn = document.getElementById('btn-cancel-create-session');
        const nextStepBtn = document.getElementById('btn-create-session-next');
        const backStepBtn = document.getElementById('btn-create-session-back');
        const startLiveBtn = document.getElementById('btn-start-session-live');
        const step1Item = document.getElementById('step-item-1');
        const step2Item = document.getElementById('step-item-2');

        const hubView = document.getElementById('parakeet-hub-view');
        const bottomBar = document.getElementById('parakeet-bottom-bar');
        const createView = document.getElementById('parakeet-create-view');

        // Open Create Flow (Expands window horizontally for Details & Preferences)
        if (openCreateBtn) {
            openCreateBtn.addEventListener('click', () => {
                if (window.spectraAPI && window.spectraAPI.setWindowMode) {
                    window.spectraAPI.setWindowMode('create');
                }
                if (hubView) hubView.style.display = 'none';
                if (bottomBar) bottomBar.style.display = 'none';
                if (createView) createView.style.display = 'flex';
                this.goToStep(1);
            });
        }

        // Cancel and Return to Hub (Restores default window dimensions)
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => {
                if (window.spectraAPI && window.spectraAPI.setWindowMode) {
                    window.spectraAPI.setWindowMode('hub');
                }
                if (createView) createView.style.display = 'none';
                if (hubView) hubView.style.display = 'flex';
                if (bottomBar) bottomBar.style.display = 'flex';
            });
        }

        // Stepper sidebar click listeners
        if (step1Item) {
            step1Item.addEventListener('click', () => this.goToStep(1));
        }
        if (step2Item) {
            step2Item.addEventListener('click', () => this.goToStep(2));
        }

        // Session Type Selector (Interview vs Regular)
        const typeInterviewBtn = document.getElementById('type-interview-btn');
        const typeRegularBtn = document.getElementById('type-regular-btn');
        if (typeInterviewBtn && typeRegularBtn) {
            typeInterviewBtn.addEventListener('click', () => {
                typeInterviewBtn.classList.add('active');
                typeRegularBtn.classList.remove('active');
                this.sessionData.type = 'interview';
            });
            typeRegularBtn.addEventListener('click', () => {
                typeRegularBtn.classList.add('active');
                typeInterviewBtn.classList.remove('active');
                this.sessionData.type = 'regular';
            });
        }

        // Inputs binding
        const companyInput = document.getElementById('session-company-input');
        const jobDescInput = document.getElementById('session-jobdesc-input');
        if (companyInput) {
            companyInput.addEventListener('input', (e) => {
                this.sessionData.company = e.target.value.trim();
            });
        }
        if (jobDescInput) {
            jobDescInput.addEventListener('input', (e) => {
                this.sessionData.jobDescription = e.target.value.trim();
            });
        }

        // Language & Model selections
        const langSelect = document.getElementById('pref-language-select');
        if (langSelect) {
            langSelect.value = this.sessionData.language;
            langSelect.addEventListener('change', (e) => {
                this.sessionData.language = e.target.value;
                localStorage.setItem('spectra_lang', e.target.value);
            });
        }

        const modelSelect = document.getElementById('create-ai-provider-select');
        if (modelSelect) {
            modelSelect.value = this.sessionData.model;
            modelSelect.addEventListener('change', (e) => {
                this.sessionData.model = e.target.value;
                localStorage.setItem('spectra_model', e.target.value);
            });
        }

        // Toggles in Step 2
        const autoGenToggle = document.getElementById('auto-generate-toggle');
        if (autoGenToggle) {
            autoGenToggle.checked = this.sessionData.autoGenerate;
            autoGenToggle.addEventListener('change', (e) => {
                this.sessionData.autoGenerate = e.target.checked;
                localStorage.setItem('spectra_auto_gen', e.target.checked);
            });
        }

        const saveTranscriptToggle = document.getElementById('save-transcript-toggle');
        if (saveTranscriptToggle) {
            saveTranscriptToggle.checked = this.sessionData.saveTranscript;
            saveTranscriptToggle.addEventListener('change', (e) => {
                this.sessionData.saveTranscript = e.target.checked;
                localStorage.setItem('spectra_save_transcript', e.target.checked);
            });
        }

        // Context selectors (CV & Docs)
        this.bindContextUploaders();

        // Next Step (from Details to Preferences)
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', () => {
                this.goToStep(2);
            });
        }

        // Back to Details
        if (backStepBtn) {
            backStepBtn.addEventListener('click', () => {
                this.goToStep(1);
            });
        }

        // Launch Live Session
        if (startLiveBtn) {
            startLiveBtn.addEventListener('click', () => {
                this.launchSession();
            });
        }
    }

    goToStep(stepNumber) {
        this.activeStep = stepNumber;
        const step1Content = document.getElementById('create-step-1');
        const step2Content = document.getElementById('create-step-2');
        const step1Item = document.getElementById('step-item-1');
        const step2Item = document.getElementById('step-item-2');
        const cancelBtn = document.getElementById('btn-cancel-create-session');
        const nextBtn = document.getElementById('btn-create-session-next');
        const backBtn = document.getElementById('btn-create-session-back');
        const startBtn = document.getElementById('btn-start-session-live');

        if (stepNumber === 1) {
            if (step1Content) step1Content.style.display = 'flex';
            if (step2Content) step2Content.style.display = 'none';
            if (step1Item) step1Item.classList.add('active');
            if (step2Item) step2Item.classList.remove('active');
            if (cancelBtn) cancelBtn.style.display = 'inline-flex';
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (backBtn) backBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
        } else {
            if (step1Content) step1Content.style.display = 'none';
            if (step2Content) step2Content.style.display = 'flex';
            if (step1Item) step1Item.classList.remove('active');
            if (step2Item) step2Item.classList.add('active');
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (backBtn) backBtn.style.display = 'inline-flex';
            if (startBtn) startBtn.style.display = 'inline-flex';
        }
    }

    bindContextUploaders() {
        const cvSelector = document.getElementById('cv-resume-selector');
        const docSelector = document.getElementById('documents-selector');
        const cvFileInput = document.getElementById('cv-file-input');
        const docFileInput = document.getElementById('doc-file-input');
        const cvLabel = document.getElementById('cv-resume-label');
        const docLabel = document.getElementById('documents-label');

        if (this.sessionData.resumeName && cvLabel) {
            cvLabel.textContent = this.sessionData.resumeName;
        }
        if (this.sessionData.documentsName && docLabel) {
            docLabel.textContent = this.sessionData.documentsName;
        }

        if (cvSelector && cvFileInput) {
            cvSelector.addEventListener('click', () => cvFileInput.click());
            cvFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.sessionData.resumeName = file.name;
                    if (cvLabel) cvLabel.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.sessionData.resumeContent = event.target.result;
                        localStorage.setItem('spectra_saved_resume', event.target.result);
                        localStorage.setItem('spectra_saved_resume_name', file.name);
                    };
                    reader.readAsText(file);
                }
            });
        }

        if (docSelector && docFileInput) {
            docSelector.addEventListener('click', () => docFileInput.click());
            docFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.sessionData.documentsName = file.name;
                    if (docLabel) docLabel.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.sessionData.documentsContent = event.target.result;
                        localStorage.setItem('spectra_saved_docs', event.target.result);
                        localStorage.setItem('spectra_saved_docs_name', file.name);
                    };
                    reader.readAsText(file);
                }
            });
        }
    }

    // --- Answer Preferences Modal & Dynamic Preview ---
    bindAnswerPreferencesModal() {
        const openBtn = document.getElementById('btn-open-answer-prefs');
        const modal = document.getElementById('answer-prefs-modal');
        const closeBtn = document.getElementById('btn-close-answer-prefs');
        const saveBtn = document.getElementById('btn-answer-prefs-save');
        const defaultBtn = document.getElementById('btn-answer-prefs-default');

        const qTypeSelect = document.getElementById('question-type-select');
        const formatCard = document.getElementById('pref-format-card');
        const lengthCard = document.getElementById('pref-length-card');
        const toneCard = document.getElementById('pref-tone-card');

        const formatVal = document.getElementById('pref-format-value');
        const lengthVal = document.getElementById('pref-length-value');
        const toneVal = document.getElementById('pref-tone-value');

        const formats = ['Script + bullets', 'Bullets only', 'Concise script'];
        const lengths = ['Balanced', 'Concise', 'Comprehensive'];
        const tones = ['Simple', 'Professional', 'Conversational'];

        const updateLabels = () => {
            if (formatVal) formatVal.textContent = this.sessionData.answerPreferences.format;
            if (lengthVal) lengthVal.textContent = this.sessionData.answerPreferences.length;
            if (toneVal) toneVal.textContent = this.sessionData.answerPreferences.tone;
            if (qTypeSelect) qTypeSelect.value = this.sessionData.answerPreferences.questionType;
        };

        const renderPreview = (qType) => {
            const previewBox = document.getElementById('answer-preview-content');
            if (!previewBox) return;

            const data = QUESTION_TYPE_PREVIEWS[qType] || QUESTION_TYPE_PREVIEWS['behavioral'];
            const bulletItems = data.bullets.map(b => `<li>${b}</li>`).join('');

            previewBox.innerHTML = `
                <p class="preview-question"><strong>Question:</strong> ${data.question}</p>
                <p class="preview-answer"><strong>Answer:</strong> ${data.answer}</p>
                <ul>${bulletItems}</ul>
            `;
        };

        // Open modal
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                updateLabels();
                renderPreview(this.sessionData.answerPreferences.questionType);
                modal.style.display = 'flex';
            });
        }

        // Close modal
        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        // Option cards click to cycle values
        if (formatCard) {
            formatCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.format;
                const nextIdx = (formats.indexOf(current) + 1) % formats.length;
                this.sessionData.answerPreferences.format = formats[nextIdx];
                updateLabels();
            });
        }

        if (lengthCard) {
            lengthCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.length;
                const nextIdx = (lengths.indexOf(current) + 1) % lengths.length;
                this.sessionData.answerPreferences.length = lengths[nextIdx];
                updateLabels();
            });
        }

        if (toneCard) {
            toneCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.tone;
                const nextIdx = (tones.indexOf(current) + 1) % tones.length;
                this.sessionData.answerPreferences.tone = tones[nextIdx];
                updateLabels();
            });
        }

        // Question type change
        if (qTypeSelect) {
            qTypeSelect.addEventListener('change', (e) => {
                this.sessionData.answerPreferences.questionType = e.target.value;
                renderPreview(e.target.value);
            });
        }

        // Reset to default
        if (defaultBtn) {
            defaultBtn.addEventListener('click', () => {
                this.sessionData.answerPreferences = {
                    format: 'Script + bullets',
                    length: 'Balanced',
                    tone: 'Simple',
                    questionType: 'behavioral'
                };
                updateLabels();
                renderPreview('behavioral');
            });
        }

        // Save
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveAnswerPreferences(this.sessionData.answerPreferences);
                closeModal();
            });
        }
    }

    // --- AI Instructions Modal ---
    bindAiInstructionsModal() {
        const addBtn = document.getElementById('btn-add-instructions');
        const modal = document.getElementById('ai-instructions-modal');
        const closeBtn = document.getElementById('btn-close-ai-instructions');
        const clearBtn = document.getElementById('btn-clear-instructions');
        const saveBtn = document.getElementById('btn-save-instructions');
        const textarea = document.getElementById('ai-instructions-input');

        if (this.sessionData.aiInstructions && addBtn) {
            addBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Edit
            `;
        }

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                if (textarea) textarea.value = this.sessionData.aiInstructions || '';
                modal.style.display = 'flex';
            });
        }

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        if (clearBtn && textarea) {
            clearBtn.addEventListener('click', () => {
                textarea.value = '';
            });
        }

        if (saveBtn && textarea) {
            saveBtn.addEventListener('click', () => {
                const val = textarea.value.trim();
                this.sessionData.aiInstructions = val;
                localStorage.setItem('spectra_ai_instructions', val);
                if (addBtn) {
                    addBtn.innerHTML = val ? `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Edit
                    ` : `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add
                    `;
                }
                closeModal();
            });
        }
    }

    // --- Live Session Controls ---
    bindLiveSessionControls() {
        const endBtn = document.getElementById('end-interview-btn');
        const resetBtn = document.getElementById('reset-interview-btn');
        const hubView = document.getElementById('parakeet-hub-view');
        const bottomBar = document.getElementById('parakeet-bottom-bar');
        const liveView = document.getElementById('parakeet-live-view');

        if (endBtn) {
            endBtn.addEventListener('click', () => {
                if (window.endInterview) {
                    window.endInterview();
                }
                if (window.spectraAPI && window.spectraAPI.setWindowMode) {
                    window.spectraAPI.setWindowMode('hub');
                }
                if (liveView) liveView.style.display = 'none';
                if (hubView) hubView.style.display = 'flex';
                if (bottomBar) bottomBar.style.display = 'flex';
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.resetInterview) {
                    window.resetInterview();
                }
            });
        }
    }

    async launchSession() {
        if (window.spectraAPI && window.spectraAPI.setWindowMode) {
            window.spectraAPI.setWindowMode('hub');
        }

        const hubView = document.getElementById('parakeet-hub-view');
        const bottomBar = document.getElementById('parakeet-bottom-bar');
        const createView = document.getElementById('parakeet-create-view');
        const liveView = document.getElementById('parakeet-live-view');

        if (hubView) hubView.style.display = 'none';
        if (bottomBar) bottomBar.style.display = 'none';
        if (createView) createView.style.display = 'none';
        if (liveView) liveView.style.display = 'flex';

        const onboardingData = {
            candidate_name: 'Arthur Henrique',
            target_company: this.sessionData.company || 'Tech Company',
            target_role: this.sessionData.type === 'interview' ? 'Software Engineer' : 'General Discussion',
            complete_resume: this.sessionData.resumeContent,
            complete_job_description: this.sessionData.jobDescription,
            supplementary_documents: this.sessionData.documentsContent,
            language: this.sessionData.language,
            model: this.sessionData.model,
            autoGenerate: this.sessionData.autoGenerate,
            saveTranscript: this.sessionData.saveTranscript,
            aiInstructions: this.sessionData.aiInstructions,
            answerPreferences: this.sessionData.answerPreferences,
            focus_areas: ['coding', 'dsa', 'system-design']
        };

        if (window.startInterview) {
            await window.startInterview(onboardingData);
        } else if (window.webSocketHandler) {
            window.webSocketHandler.sendMessage('start_interview', {
                aiProvider: { provider: this.sessionData.model || 'Cerebras', model: 'gpt-oss-120b' },
                onboardingData: onboardingData,
                is_muted: false,
                process_all_speakers: true,
                is_universally_muted: false
            });
        }

        // Save session in history
        this.saveSessionToHistory({
            title: this.sessionData.company || 'Interview Session',
            subtitle: this.sessionData.type === 'interview' ? 'Technical Interview' : 'Regular Call',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
            duration: 'In progress',
            type: this.sessionData.type === 'interview' ? 'Interview' : 'Regular'
        });
    }

    // --- Session History Cards ---
    saveSessionToHistory(session) {
        const history = this.getSessionHistory();
        history.unshift(session);
        localStorage.setItem('spectra_session_history', JSON.stringify(history.slice(0, 10)));
        this.renderSessionCards();
    }

    getSessionHistory() {
        try {
            const raw = localStorage.getItem('spectra_session_history');
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        return [
            {
                title: 'Insi',
                subtitle: 'Java Full Stack',
                date: 'SEP 24, 2026',
                duration: '10m 0s · Free Session',
                type: 'Interview'
            },
            {
                title: 'insi',
                subtitle: 'Java Full Stack',
                date: 'SEP 24, 2026',
                duration: '10m 0s · Free Session',
                type: 'Interview'
            }
        ];
    }

    renderSessionCards() {
        const listContainer = document.getElementById('parakeet-session-cards-list');
        if (!listContainer) return;

        const history = this.getSessionHistory();
        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="session-empty-state">
                    <h4>You have no sessions yet</h4>
                    <p>Your sessions will appear here once created.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = history.map((item, index) => `
            <div class="session-card" data-card-index="${index}">
                <div class="session-card-header">
                    <div>
                        <div class="session-card-date">${item.date}</div>
                        <div class="session-card-title">${item.title}</div>
                        <div class="session-card-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="session-card-menu-wrap">
                        <button class="session-card-menu-btn" data-session-index="${index}" title="Options">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                        <div class="session-card-dropdown" id="session-dropdown-${index}">
                            <button type="button" class="session-dropdown-item btn-card-copy" data-session-index="${index}">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy Transcript</span>
                            </button>
                            <button type="button" class="session-dropdown-item btn-card-rename" data-session-index="${index}">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                <span>Rename</span>
                            </button>
                            <button type="button" class="session-dropdown-item danger btn-card-delete" data-session-index="${index}">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                <span>Delete Session</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="session-badges-row">
                    <span class="session-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                        ${item.type || 'Interview'}
                    </span>
                    <span class="session-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        Transcript
                    </span>
                </div>
                <div class="session-card-footer">
                    <div class="session-status-info">
                        <span class="status-dot"></span>
                        <span>Ended · ${item.duration}</span>
                    </div>
                    <button class="btn-view-transcript" data-session-index="${index}">View Transcript</button>
                </div>
            </div>
        `).join('');

        this.bindSessionCardActions();
    }

    bindSessionCardActions() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.session-card-menu-wrap')) {
                document.querySelectorAll('.session-card-dropdown.active').forEach(d => {
                    d.classList.remove('active');
                });
            }
        });

        // 3-dots button click
        document.querySelectorAll('.session-card-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = btn.getAttribute('data-session-index');
                const targetDropdown = document.getElementById(`session-dropdown-${idx}`);
                
                // Close other dropdowns
                document.querySelectorAll('.session-card-dropdown.active').forEach(d => {
                    if (d !== targetDropdown) d.classList.remove('active');
                });

                if (targetDropdown) {
                    targetDropdown.classList.toggle('active');
                }
            });
        });

        // Delete Session
        document.querySelectorAll('.btn-card-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-session-index'), 10);
                const history = this.getSessionHistory();
                history.splice(idx, 1);
                localStorage.setItem('spectra_session_history', JSON.stringify(history));
                this.renderSessionCards();
            });
        });

        // Rename Session
        document.querySelectorAll('.btn-card-rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-session-index'), 10);
                const history = this.getSessionHistory();
                const currentTitle = history[idx]?.title || '';
                const newTitle = prompt('Enter new session title:', currentTitle);
                if (newTitle && newTitle.trim()) {
                    history[idx].title = newTitle.trim();
                    localStorage.setItem('spectra_session_history', JSON.stringify(history));
                    this.renderSessionCards();
                }
            });
        });

        // Copy Transcript
        document.querySelectorAll('.btn-card-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-session-index'), 10);
                const history = this.getSessionHistory();
                const item = history[idx];
                if (item) {
                    const textToCopy = `Session: ${item.title} (${item.subtitle})\nDate: ${item.date}\nType: ${item.type}\nStatus: ${item.duration}`;
                    navigator.clipboard.writeText(textToCopy);
                    const span = btn.querySelector('span');
                    if (span) {
                        const original = span.textContent;
                        span.textContent = 'Copied!';
                        setTimeout(() => { span.textContent = original; }, 1500);
                    }
                }
            });
        });

        // View Transcript Button
        document.querySelectorAll('.btn-view-transcript').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-session-index'), 10);
                const history = this.getSessionHistory();
                if (history[idx]) {
                    this.openTranscriptForSession(history[idx]);
                }
            });
        });
    }

    // --- Transcript Modal ---
    bindTranscriptModal() {
        const modal = document.getElementById('view-transcript-modal');
        const closeBtn = document.getElementById('btn-close-transcript-modal');
        const doneBtn = document.getElementById('btn-close-transcript-done');
        const copyBtn = document.getElementById('btn-copy-transcript-content');
        const contentBox = document.getElementById('transcript-modal-content');

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (doneBtn) doneBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        if (copyBtn && contentBox) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(contentBox.innerText);
                const prev = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = prev; }, 1500);
            });
        }
    }

    openTranscriptForSession(session) {
        const modal = document.getElementById('view-transcript-modal');
        const titleEl = document.getElementById('transcript-modal-title');
        const metaEl = document.getElementById('transcript-modal-meta');
        const contentBox = document.getElementById('transcript-modal-content');

        if (!modal || !contentBox) return;

        if (titleEl) titleEl.textContent = `${session.title} — Transcript`;
        if (metaEl) metaEl.textContent = `${session.subtitle} · ${session.date} (${session.duration})`;

        const transcriptData = session.transcript || [
            { speaker: 'Interviewer', text: `Welcome to the ${session.title} interview. Could you walk me through your technical background and experience?` },
            { speaker: 'Spectra AI', text: `Certainly! I'm a software engineer specialized in high-performance distributed systems, low-latency architectures, and reliable full-stack engineering.` },
            { speaker: 'Interviewer', text: 'How do you approach optimizing database queries and cache invalidation under high concurrent loads?' },
            { speaker: 'Spectra AI', text: 'I start by profiling slow query logs and index usage. For caching, I deploy Redis read-through caches with bounded TTLs and asynchronous write-back queues to protect primary database replicas.' }
        ];

        contentBox.innerHTML = transcriptData.map(item => `
            <div>
                <span style="font-weight: 700; color: ${item.speaker === 'Interviewer' ? 'var(--text-muted)' : 'var(--brand-green)'}; font-size: 11px; text-transform: uppercase;">
                    ${item.speaker}:
                </span>
                <p style="margin-top: 3px; color: var(--text-main); font-size: 12.5px;">${item.text}</p>
            </div>
        `).join('');

        modal.style.display = 'flex';
    }

    // --- AI Providers Modal ---
    bindAiProvidersModal() {
        const openBtn = document.getElementById('menu-open-providers-btn');
        const modal = document.getElementById('ai-providers-modal');
        const closeBtn = document.getElementById('btn-close-providers-modal');
        const cancelBtn = document.getElementById('btn-cancel-providers-modal');
        const saveBtn = document.getElementById('btn-save-all-providers');
        const saveText = document.getElementById('save-providers-text');
        const deepgramInput = document.getElementById('modal-deepgram-key');
        const deepgramBadge = document.getElementById('deepgram-status-badge');
        const container = document.getElementById('dynamic-providers-container');

        let fullProviders = [];

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        const loadData = async () => {
            try {
                // Fetch Deepgram key
                const dResp = await fetch('/api/deepgram-key');
                if (dResp.ok) {
                    const dData = await dResp.json();
                    if (deepgramInput) {
                        deepgramInput.value = dData.key || '';
                        if (deepgramBadge) {
                            if (dData.key) {
                                deepgramBadge.textContent = 'Configured';
                                deepgramBadge.className = 'provider-status-badge valid';
                            } else {
                                deepgramBadge.textContent = 'Missing Key';
                                deepgramBadge.className = 'provider-status-badge missing';
                            }
                        }
                    }
                }

                // Fetch full providers
                const pResp = await fetch('/api/ai-providers/full');
                if (pResp.ok) {
                    fullProviders = await pResp.json();
                    renderProvidersList();
                }
            } catch (err) {
                console.error('Failed to load AI providers in modal:', err);
            }
        };

        const renderProvidersList = () => {
            if (!container) return;
            container.innerHTML = fullProviders.map((p, idx) => {
                const keyVal = (p.apiKeys && p.apiKeys[0]) ? p.apiKeys[0] : (p.apiKey || '');
                const hasKey = Boolean(keyVal);
                let host = '';
                try { if (p.baseURL) host = new URL(p.baseURL).hostname; } catch (e) {}

                return `
                    <div class="provider-key-card" data-provider-index="${idx}">
                        <div class="provider-key-header">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="provider-badge-tag">LLM</span>
                                <strong>${p.name}</strong>
                                <span style="font-size: 11px; color: var(--text-muted);">${host}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="provider-status-badge ${hasKey ? 'valid' : 'missing'}" id="status-badge-${idx}">
                                    ${hasKey ? 'Configured' : 'Missing Key'}
                                </span>
                                <button type="button" class="btn-test-provider" data-provider-name="${p.name}" data-provider-index="${idx}">
                                    Test
                                </button>
                            </div>
                        </div>
                        <div class="key-input-wrapper">
                            <input type="password" class="form-input provider-key-input" id="key-input-${idx}" data-provider-index="${idx}" value="${keyVal}" placeholder="Enter ${p.name} API Key..." autocomplete="off">
                            <button type="button" class="btn-toggle-eye" data-target="key-input-${idx}" title="Show/Hide Key">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Eye toggles
            container.querySelectorAll('.btn-toggle-eye').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('data-target');
                    const targetInput = document.getElementById(targetId);
                    if (targetInput) {
                        targetInput.type = targetInput.type === 'password' ? 'text' : 'password';
                    }
                });
            });

            // Test buttons
            container.querySelectorAll('.btn-test-provider').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const provName = btn.getAttribute('data-provider-name');
                    const idx = btn.getAttribute('data-provider-index');
                    const badge = document.getElementById(`status-badge-${idx}`);
                    const input = document.getElementById(`key-input-${idx}`);
                    const currentKey = input ? input.value.trim() : '';

                    btn.textContent = 'Testing...';
                    btn.disabled = true;

                    try {
                        const resp = await fetch('/api/verify-provider', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: provName, key: currentKey })
                        });
                        const resData = await resp.json();
                        if (resData.valid) {
                            btn.textContent = '✓ OK';
                            if (badge) {
                                badge.textContent = 'Connected';
                                badge.className = 'provider-status-badge valid';
                            }
                        } else {
                            btn.textContent = '✕ Failed';
                            if (badge) {
                                badge.textContent = 'Invalid Key';
                                badge.className = 'provider-status-badge missing';
                            }
                        }
                    } catch (e) {
                        btn.textContent = '✕ Error';
                    } finally {
                        setTimeout(() => {
                            btn.textContent = 'Test';
                            btn.disabled = false;
                        }, 2500);
                    }
                });
            });
        };

        // Eye toggle for Deepgram
        const dgEye = document.querySelector('.btn-toggle-eye[data-target="modal-deepgram-key"]');
        if (dgEye && deepgramInput) {
            dgEye.addEventListener('click', () => {
                deepgramInput.type = deepgramInput.type === 'password' ? 'text' : 'password';
            });
        }

        // Open modal from settings menu
        if (openBtn && modal) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuDropdown = document.getElementById('parakeet-dropdown-menu');
                if (menuDropdown) menuDropdown.classList.remove('active');
                modal.style.display = 'flex';
                loadData();
            });
        }

        // Save keys
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;
                if (saveText) saveText.textContent = 'Saving...';

                try {
                    // Save Deepgram Key
                    if (deepgramInput) {
                        const dgVal = deepgramInput.value.trim();
                        await fetch('/api/save-deepgram-key', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key: dgVal })
                        });
                    }

                    // Collect keys for all providers
                    const inputs = container.querySelectorAll('.provider-key-input');
                    inputs.forEach(inp => {
                        const pIdx = parseInt(inp.getAttribute('data-provider-index'), 10);
                        if (!isNaN(pIdx) && fullProviders[pIdx]) {
                            const val = inp.value.trim();
                            if (fullProviders[pIdx].apiKeys) {
                                fullProviders[pIdx].apiKeys = val ? [val] : [];
                            } else {
                                fullProviders[pIdx].apiKey = val;
                            }
                        }
                    });

                    // Save AI providers
                    await fetch('/api/save-ai-providers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ providers: fullProviders })
                    });

                    if (saveText) saveText.textContent = '✓ Saved!';
                    setTimeout(() => {
                        closeModal();
                        if (saveText) saveText.textContent = 'Save Keys';
                        saveBtn.disabled = false;
                    }, 1000);
                } catch (e) {
                    console.error('Error saving keys:', e);
                    if (saveText) saveText.textContent = 'Save Failed';
                    setTimeout(() => {
                        if (saveText) saveText.textContent = 'Save Keys';
                        saveBtn.disabled = false;
                    }, 2000);
                }
            });
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.parakeetUI = new ParakeetUIController();
});
