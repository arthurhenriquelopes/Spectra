// ==========================================================================
// SPECTRA — PARAKEET AI UI CONTROLLER
// Handles Header Controls, Settings Dropdown, Themes, Private Mode,
// Create Session Stepper, and Session History.
// ==========================================================================

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
            documentsName: localStorage.getItem('spectra_saved_docs_name') || ''
        };

        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindHeaderControls();
        this.bindSettingsDropdown();
        this.bindCreateSessionFlow();
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
                const isActive = menuDropdown.classList.toggle('active');
                menuBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            });

            document.addEventListener('click', (e) => {
                if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
                    menuDropdown.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    menuDropdown.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
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

        const hubView = document.getElementById('parakeet-hub-view');
        const createView = document.getElementById('parakeet-create-view');
        const step1Content = document.getElementById('create-step-1');
        const step2Content = document.getElementById('create-step-2');
        const step1Circle = document.getElementById('step-circle-1');
        const step2Circle = document.getElementById('step-circle-2');

        // Open Create Modal
        if (openCreateBtn) {
            openCreateBtn.addEventListener('click', () => {
                if (hubView) hubView.style.display = 'none';
                if (createView) createView.style.display = 'flex';
                this.goToStep(1);
            });
        }

        // Cancel and Return to Hub
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => {
                if (createView) createView.style.display = 'none';
                if (hubView) hubView.style.display = 'flex';
            });
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

        // Bind focus preset pills in Step 2
        document.querySelectorAll('#create-step-2 .session-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });
    }

    goToStep(stepNumber) {
        this.activeStep = stepNumber;
        const step1Content = document.getElementById('create-step-1');
        const step2Content = document.getElementById('create-step-2');
        const step1Item = document.getElementById('step-item-1');
        const step2Item = document.getElementById('step-item-2');
        const nextBtn = document.getElementById('btn-create-session-next');
        const backBtn = document.getElementById('btn-create-session-back');
        const startBtn = document.getElementById('btn-start-session-live');

        if (stepNumber === 1) {
            if (step1Content) step1Content.style.display = 'flex';
            if (step2Content) step2Content.style.display = 'none';
            if (step1Item) step1Item.classList.add('active');
            if (step2Item) step2Item.classList.remove('active');
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (backBtn) backBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
        } else {
            if (step1Content) step1Content.style.display = 'none';
            if (step2Content) step2Content.style.display = 'flex';
            if (step1Item) step1Item.classList.remove('active');
            if (step2Item) step2Item.classList.add('active');
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

    getSelectedFocusAreas() {
        const active = [];
        document.querySelectorAll('#create-step-2 .session-type-btn.active').forEach(btn => {
            const p = btn.getAttribute('data-preset');
            if (p) active.push(p);
        });
        return active.length ? active : ['coding', 'dsa', 'system-design'];
    }

    async launchSession() {
        // Collect onboarding state for backend interview session
        const onboardingData = {
            candidate_name: 'Arthur Henrique',
            target_company: this.sessionData.company || 'Tech Company',
            target_role: this.sessionData.type === 'interview' ? 'Software Engineer' : 'General Discussion',
            complete_resume: this.sessionData.resumeContent,
            complete_job_description: this.sessionData.jobDescription,
            supplementary_documents: this.sessionData.documentsContent,
            focus_areas: this.getSelectedFocusAreas()
        };

        if (window.startInterview) {
            await window.startInterview(onboardingData);
        } else if (window.webSocketHandler) {
            window.webSocketHandler.sendMessage('start_interview', {
                aiProvider: { provider: 'Cerebras', model: 'gpt-oss-120b' },
                onboardingData: onboardingData,
                is_muted: false,
                process_all_speakers: true,
                is_universally_muted: false
            });
            const hubView = document.getElementById('parakeet-hub-view');
            const bottomBar = document.getElementById('parakeet-bottom-bar');
            const createView = document.getElementById('parakeet-create-view');
            const liveView = document.getElementById('parakeet-live-view');
            if (hubView) hubView.style.display = 'none';
            if (bottomBar) bottomBar.style.display = 'none';
            if (createView) createView.style.display = 'none';
            if (liveView) liveView.style.display = 'flex';
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

        // Default samples matching screenshot 1
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
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <h4>No sessions yet</h4>
                    <p>Click "+ Create Session" below to start your first interview preparation.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = history.map(item => `
            <div class="session-card">
                <div class="session-card-header">
                    <div>
                        <div class="session-card-date">${item.date}</div>
                        <div class="session-card-title">${item.title}</div>
                        <div class="session-card-subtitle">${item.subtitle}</div>
                    </div>
                    <button type="button" class="session-card-menu-btn" title="Options" aria-label="Session options">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
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
                    <button class="btn-view-transcript">View Transcript</button>
                </div>
            </div>
        `).join('');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.parakeetUI = new ParakeetUIController();
});
