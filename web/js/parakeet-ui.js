// ==========================================================================
// SPECTRA — PARAKEET AI UI CONTROLLER (1:1 FIDELITY)
// Handles Header Controls, Settings Dropdown, Themes, Private Mode,
// Create Session Stepper, Answer Preferences Modal, AI Instructions Modal,
// Live Session View, and Session History.
// ==========================================================================

const QUESTION_TYPE_PREVIEWS = {
    'behavioral': {
        question: 'Share a time you disagreed with a teammate on a technical choice.',
        tones: {
            'Simple': {
                answer: 'I once disagreed with a teammate about whether to use a third-party caching tool or build a simple in-memory cache for our backend service.',
                bullets: [
                    'My teammate wanted to use Redis right away to save time, but I felt it was too heavy for our current traffic and would add extra cost and setup work.',
                    'We set up a quick test to measure how fast our database was without a cache, and we looked at our actual user traffic numbers together.',
                    'The data showed that a simple in-memory cache using built-in language structures was sufficient for the next six months without adding external dependencies.',
                    'We agreed to use the simple cache for now and set a clear latency trigger for when to migrate.'
                ]
            },
            'Professional': {
                answer: 'During a backend optimization initiative, a colleague and I held differing views on the appropriate caching strategy for our microservices layer.',
                bullets: [
                    'My colleague advocated for an immediate Redis integration to accelerate development velocity, whereas I identified concerns regarding operational overhead relative to our actual throughput metrics.',
                    'I proposed a data-driven evaluation: we benchmarked existing query latencies against projected traffic growth and total cost of ownership for each approach.',
                    'The analysis conclusively demonstrated that a lightweight in-process cache would satisfy performance requirements for the foreseeable planning horizon without introducing external infrastructure dependencies.',
                    'We reached consensus on a phased approach, deploying the simpler solution with defined latency thresholds that would trigger a migration to distributed caching.'
                ]
            },
            'Conversational': {
                answer: 'So basically, me and a teammate got into it about caching — they wanted Redis, I thought it was overkill for what we actually needed.',
                bullets: [
                    'They were like "let\'s just throw Redis at it," but honestly our traffic didn\'t justify the extra infra at that point.',
                    'Instead of just arguing about it, we pulled up the actual numbers — database response times, real user traffic, the whole deal.',
                    'Turns out a simple in-memory cache would totally cover us for at least six months, no extra setup needed.',
                    'So we went with that, and agreed on a specific latency number that would tell us "okay, now it\'s time to upgrade."'
                ]
            }
        }
    },
    'coding': {
        question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        tones: {
            'Simple': {
                answer: 'The optimal approach uses a single-pass Hash Map to achieve O(n) time complexity and O(n) space complexity.',
                bullets: [
                    'Maintain a map of value to index as we iterate through nums.',
                    'For each number, compute complement = target - nums[i].',
                    'If complement exists in map, return [map[complement], i].',
                    'Otherwise, insert nums[i] with its current index into the map.'
                ]
            },
            'Professional': {
                answer: 'The optimal solution leverages a hash table for single-pass O(n) time complexity with O(n) auxiliary space, avoiding the O(n\u00b2) brute-force approach.',
                bullets: [
                    'Initialize an empty hash map to store each element\'s value as key and its index as value during traversal.',
                    'At each iteration index i, compute the complement as target minus nums[i] and perform a constant-time lookup in the map.',
                    'If the complement is present, the solution pair has been identified — return the stored index and the current index i.',
                    'If absent, insert the current element into the map and proceed, guaranteeing at most one full pass through the array.'
                ]
            },
            'Conversational': {
                answer: 'The trick here is to use a hash map so you only need to go through the array once — O(n) time, O(n) space.',
                bullets: [
                    'As you walk through the array, keep a map that remembers what numbers you\'ve already seen and where.',
                    'For each number, just check: "Hey, is the number I need to hit the target already in my map?"',
                    'If yes — awesome, you found your pair, return both indices.',
                    'If no — toss the current number into the map and keep going.'
                ]
            }
        }
    },
    'experience': {
        question: 'How have you handled scaling database read queries under sudden high traffic spikes?',
        tones: {
            'Simple': {
                answer: 'I mitigated sudden query spikes by implementing read replicas and an asynchronous write-through cache.',
                bullets: [
                    'Deployed multi-AZ read replicas to offload read-heavy dashboard and search queries from the primary instance.',
                    'Added a distributed Redis layer with short TTLs for frequently queried endpoints.',
                    'Established circuit breakers to gracefully degrade non-critical data when load exceeds thresholds.',
                    'Monitored query patterns with dashboards to identify hotspots before they became critical.'
                ]
            },
            'Professional': {
                answer: 'I implemented a multi-tier read-scaling architecture combining horizontal replication with intelligent caching layers to absorb unpredictable traffic surges.',
                bullets: [
                    'Provisioned cross-availability-zone read replicas with connection pooling to distribute read-heavy analytical and dashboard workloads away from the primary writer instance.',
                    'Introduced a Redis cluster with adaptive TTL policies calibrated to data volatility, achieving a 92% cache hit rate on high-frequency endpoints.',
                    'Deployed circuit breaker patterns with configurable degradation policies to maintain core transaction throughput when auxiliary data services experienced saturation.',
                    'Established real-time observability through query-level telemetry dashboards, enabling proactive identification of emerging hotspots before threshold breaches.'
                ]
            },
            'Conversational': {
                answer: 'When we got hit with traffic spikes, I basically set up read replicas and a Redis cache so the main database wouldn\'t buckle.',
                bullets: [
                    'First thing — spun up read replicas across availability zones so all the dashboard and search stuff stopped hammering the primary DB.',
                    'Then I stuck a Redis layer in front of the most-hit endpoints with short TTLs so stale data wasn\'t an issue.',
                    'Added circuit breakers too, so if things got really wild, less important features would gracefully back off instead of everything crashing.',
                    'Set up monitoring dashboards so we could actually see problems coming before users started complaining.'
                ]
            }
        }
    },
    'how-do-you': {
        question: 'How do you decide between synchronous REST endpoints and asynchronous event-driven messaging?',
        tones: {
            'Simple': {
                answer: 'I evaluate based on latency sensitivity, coupling requirements, and failure blast radiuses.',
                bullets: [
                    'Choose synchronous REST for immediate user-blocking operations where the client requires immediate confirmation.',
                    'Choose asynchronous events (Kafka/RabbitMQ) for decoupled background workflows like email dispatch, analytics, or batch processing.',
                    'Ensure all asynchronous handlers are idempotent with built-in retry queues and dead-letter queues.',
                    'Hybrid approaches work well — synchronous acknowledgment followed by async processing.'
                ]
            },
            'Professional': {
                answer: 'The decision framework centers on three axes: response latency requirements, service coupling tolerance, and failure isolation boundaries.',
                bullets: [
                    'Synchronous REST is appropriate when the consumer requires immediate, transactional confirmation and the operation latency budget is well-defined.',
                    'Asynchronous event-driven architectures via Kafka or RabbitMQ are indicated for workflows where temporal decoupling, independent scalability, and failure isolation outweigh immediate response needs.',
                    'All asynchronous consumers must implement idempotency guarantees with dedicated retry policies and dead-letter queue strategies for poison message handling.',
                    'Frequently, a hybrid pattern — synchronous command acceptance followed by asynchronous downstream orchestration — provides the optimal balance of responsiveness and resilience.'
                ]
            },
            'Conversational': {
                answer: 'Honestly, it comes down to: does the user need an answer right now, or can this happen in the background?',
                bullets: [
                    'If the user is sitting there waiting — like submitting a payment or logging in — that needs to be synchronous REST, no question.',
                    'But stuff like sending emails, updating analytics, or kicking off reports? That\'s perfect for async with Kafka or RabbitMQ.',
                    'The big thing with async is making sure your handlers are idempotent — because messages will get retried, and you don\'t want double-charges or duplicate emails.',
                    'A lot of times I end up doing both — quick sync response to say "got it," then async processing behind the scenes.'
                ]
            }
        }
    },
    'situational': {
        question: 'What would you do if a critical deployment caused production errors 10 minutes before a company all-hands demo?',
        tones: {
            'Simple': {
                answer: 'My immediate priority is stabilizing customer impact by triggering a zero-downtime rollback.',
                bullets: [
                    'Execute the automated rollback to the last verified stable build immediately without attempting in-place hotfixes.',
                    'Notify stakeholders in the incident bridge with a concise status and estimated recovery window.',
                    'Once production metrics verify green health, preserve container logs and telemetry for post-mortem debugging.',
                    'After the demo, conduct a blameless post-mortem to identify the root cause and improve the deployment pipeline.'
                ]
            },
            'Professional': {
                answer: 'The immediate operational priority is customer impact mitigation through an automated rollback to the last verified stable release artifact.',
                bullets: [
                    'Initiate the pre-configured rollback pipeline targeting the last green deployment artifact, avoiding ad-hoc hotfixes which introduce additional risk under time pressure.',
                    'Simultaneously communicate via the established incident bridge, providing stakeholders with a structured status update including scope assessment and estimated time to resolution.',
                    'Upon confirmation of service health via synthetic monitors and key business metrics, preserve all forensic artifacts — container logs, distributed traces, and deployment manifests — for subsequent root cause analysis.',
                    'Post-incident, facilitate a blameless retrospective focused on systemic improvements: deployment gate coverage, canary analysis thresholds, and pre-demo change freeze policies.'
                ]
            },
            'Conversational': {
                answer: 'First instinct: roll it back. Don\'t try to fix it live — that\'s how you make things worse under pressure.',
                bullets: [
                    'Hit the rollback button right away to get back to the last build that was working. No heroics, no quick patches.',
                    'Then immediately let people know what\'s going on — short message in the incident channel: "We saw errors, we\'re rolling back, ETA 3 minutes."',
                    'Once things are green again, grab all the logs before anything gets rotated — you\'ll need those for figuring out what went wrong later.',
                    'After the dust settles, do a proper post-mortem. No finger-pointing, just "how do we make sure this doesn\'t happen before the next big demo?"'
                ]
            }
        }
    },
    'system-design': {
        question: 'Design a real-time URL shortening service like Bit.ly that handles 100M new URLs per month.',
        tones: {
            'Simple': {
                answer: 'The system needs high read availability, fast redirects, and unique 7-character Base62 keys.',
                bullets: [
                    'Architecture: API Gateway -> Load Balancer -> Stateless Web Servers -> Distributed Key Generation Service (KGS).',
                    'Storage: NoSQL (Cassandra/DynamoDB) for low-latency key-value lookups; Redis cluster for top 20% hottest URLs.',
                    'Redundancy: Pre-generate keys in memory blocks to prevent collision overhead and ensure sub-10ms redirect response times.',
                    'Analytics: Stream click events via Kafka to a separate analytics pipeline for real-time and batch reporting.'
                ]
            },
            'Professional': {
                answer: 'The architecture must prioritize read-path latency optimization, horizontal scalability for write ingestion at approximately 38 writes/second sustained, and deterministic key uniqueness guarantees.',
                bullets: [
                    'The request path flows through a globally distributed API Gateway with geographic routing, through a Layer 7 load balancer, into stateless application servers backed by a dedicated Key Generation Service (KGS) that pre-allocates Base62 key blocks to eliminate real-time collision resolution.',
                    'The persistence layer utilizes a partitioned NoSQL store such as Cassandra or DynamoDB for O(1) key-value lookups, supplemented by a Redis cluster caching the top 20% most-accessed short URLs to achieve sub-5ms P99 redirect latency.',
                    'Key uniqueness is guaranteed through the KGS which pre-generates and distributes monotonically increasing key ranges to application nodes, avoiding distributed coordination overhead at write time.',
                    'Click telemetry is streamed through Kafka into both a real-time Flink pipeline for live dashboards and a batch ETL process for historical analytics and link expiration management.'
                ]
            },
            'Conversational': {
                answer: 'Think of it as: you need something that can create short links fast and redirect people even faster — we\'re talking sub-10ms redirects.',
                bullets: [
                    'The basic flow: request hits an API gateway, goes to a stateless web server, which grabs a pre-generated short key from a Key Generation Service — no collisions, no delays.',
                    'For storage, you want something like DynamoDB or Cassandra — dead simple key-value lookups. Then throw Redis in front for the popular links that get clicked a ton.',
                    'The clever bit is pre-generating keys in batches so you never have to worry about two servers picking the same short URL at the same time.',
                    'For analytics — clicks stream through Kafka so you can build dashboards without slowing down the actual redirect path.'
                ]
            }
        }
    },
    'technical': {
        question: 'Explain the difference between optimistic locking and pessimistic locking in relational databases.',
        tones: {
            'Simple': {
                answer: 'Both prevent race conditions during concurrent updates, but differ in contention management.',
                bullets: [
                    'Pessimistic Locking: Locks the record immediately via SELECT FOR UPDATE; best for high write contention where collision rollback costs are prohibitive.',
                    'Optimistic Locking: Uses a version counter or timestamp column; verifies version hasn\'t changed at commit time.',
                    'Optimistic locking provides superior throughput for read-heavy workloads with infrequent collisions.',
                    'Choose pessimistic for financial transactions; optimistic for content updates and user profiles.'
                ]
            },
            'Professional': {
                answer: 'Both concurrency control mechanisms address data integrity under concurrent modification, but employ fundamentally different strategies for contention resolution and throughput optimization.',
                bullets: [
                    'Pessimistic locking acquires an exclusive row-level lock at read time via SELECT FOR UPDATE, serializing access and preventing concurrent modifications. This is optimal for high-contention scenarios where transaction rollback costs — both computational and business-logical — are prohibitive.',
                    'Optimistic locking defers conflict detection to commit time by maintaining a version counter or timestamp column. The transaction proceeds without locks, and at write time, the database verifies the version has not been incremented by another transaction since the initial read.',
                    'Optimistic strategies deliver significantly higher throughput in read-dominant workloads with statistically low collision probability, as they eliminate lock acquisition overhead and reduce connection hold times.',
                    'Selection criteria: employ pessimistic locking for financial instruments, inventory reservation, and sequential workflows; employ optimistic locking for content management, user preferences, and collaborative editing scenarios.'
                ]
            },
            'Conversational': {
                answer: 'Both solve the same problem — "what happens when two people try to edit the same row at once?" — but they go about it very differently.',
                bullets: [
                    'Pessimistic locking is like putting a "do not touch" sign on the row the moment you read it. Nobody else can change it until you\'re done. Great for stuff like bank transactions.',
                    'Optimistic locking is more chill — it lets everyone read freely, but when you go to save, it checks: "has anyone else changed this since you read it?" If yes, your update gets rejected.',
                    'Optimistic is way faster for most apps because you\'re not holding locks. But if collisions happen a lot, you end up retrying constantly and it gets annoying.',
                    'Rule of thumb: money and inventory? Pessimistic. Blog posts and user settings? Optimistic.'
                ]
            }
        }
    },
    'tell-me': {
        question: 'Tell me about yourself and walk me through your background as a software engineer.',
        tones: {
            'Simple': {
                answer: 'I\'m a full-stack engineer specialized in high-performance web systems and developer tooling.',
                bullets: [
                    'Over the past several years, I\'ve architected distributed backends, optimized real-time communication pipelines, and built responsive UIs.',
                    'At my most recent role, I led the modernization of our core service architecture, cutting latency by 45%.',
                    'I thrive in environments where engineering rigor, performance profiling, and clean user experience meet.',
                    'I\'m particularly excited about roles that combine deep technical challenges with tangible user impact.'
                ]
            },
            'Professional': {
                answer: 'I am a full-stack software engineer with deep expertise in distributed systems architecture, real-time data processing, and performance-critical web platform development.',
                bullets: [
                    'Throughout my career, I have designed and implemented distributed backend systems, optimized real-time communication infrastructure, and delivered high-fidelity frontend experiences across multiple product verticals.',
                    'In my most recent engagement, I spearheaded the comprehensive modernization of a legacy monolithic architecture into a microservices-based platform, achieving a 45% reduction in end-to-end response latency and a 3x improvement in deployment frequency.',
                    'I am driven by the intersection of engineering excellence, quantitative performance analysis, and delivering exceptional user experiences that directly impact business outcomes.',
                    'I am actively seeking opportunities that combine architecturally significant technical challenges with meaningful, measurable product impact.'
                ]
            },
            'Conversational': {
                answer: 'Hey! So I\'m a full-stack dev who really loves building fast, reliable systems — the kind of stuff where performance and user experience really matter.',
                bullets: [
                    'I\'ve spent the last few years jumping between backend architecture and frontend work — building APIs, optimizing real-time pipelines, and making UIs that actually feel good to use.',
                    'The thing I\'m most proud of recently is leading a big platform modernization that cut our response times nearly in half — 45% faster, which users definitely noticed.',
                    'What gets me going is that sweet spot where you\'re solving a genuinely hard technical problem and the result is something users can actually feel.',
                    'I\'m looking for a place where I can keep doing that — tackling real engineering challenges that make a real difference.'
                ]
            }
        }
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
            companyDomain: '',
            companyLogo: '',
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

        // Session Type Selector (Interview vs Regular vs Mock)
        const typeInterviewBtn = document.getElementById('type-interview-btn');
        const typeRegularBtn = document.getElementById('type-regular-btn');
        const typeMockBtn = document.getElementById('type-mock-btn');
        if (typeInterviewBtn && typeRegularBtn) {
            typeInterviewBtn.addEventListener('click', () => {
                typeInterviewBtn.classList.add('active');
                typeRegularBtn.classList.remove('active');
                if (typeMockBtn) typeMockBtn.classList.remove('active');
                this.sessionData.type = 'interview';
            });
            typeRegularBtn.addEventListener('click', () => {
                typeRegularBtn.classList.add('active');
                typeInterviewBtn.classList.remove('active');
                if (typeMockBtn) typeMockBtn.classList.remove('active');
                this.sessionData.type = 'regular';
            });
            if (typeMockBtn) {
                typeMockBtn.addEventListener('click', () => {
                    typeMockBtn.classList.add('active');
                    typeInterviewBtn.classList.remove('active');
                    typeRegularBtn.classList.remove('active');
                    this.sessionData.type = 'mock';
                });
            }
        }

        // Job Link Import Modal Controller
        const pasteJobLinkBtn = document.getElementById('btn-paste-job-link');
        const jobImportModal = document.getElementById('job-import-modal');
        const closeJobModalBtn = document.getElementById('btn-close-job-modal');
        const cancelJobModalBtn = document.getElementById('btn-cancel-job-modal');
        const confirmJobImportBtn = document.getElementById('btn-confirm-job-import');
        const jobUrlInput = document.getElementById('job-url-input');
        const jobPasteClipboardBtn = document.getElementById('btn-job-paste-clipboard');
        const jobImportStatus = document.getElementById('job-import-status');

        const openJobModal = async () => {
            if (!jobImportModal) return;
            jobImportModal.style.display = 'flex';
            if (jobImportStatus) {
                jobImportStatus.style.display = 'none';
                jobImportStatus.className = 'job-import-status';
                jobImportStatus.textContent = '';
            }
            if (jobUrlInput) {
                jobUrlInput.value = '';
                // Try reading clipboard automatically to prefill if it looks like a URL
                try {
                    const clipText = await navigator.clipboard.readText();
                    if (clipText && (clipText.startsWith('http://') || clipText.startsWith('https://'))) {
                        jobUrlInput.value = clipText.trim();
                    }
                } catch (e) {}
                jobUrlInput.focus();
            }
        };

        const closeJobModal = () => {
            if (jobImportModal) jobImportModal.style.display = 'none';
        };

        if (pasteJobLinkBtn) {
            pasteJobLinkBtn.addEventListener('click', openJobModal);
        }
        if (closeJobModalBtn) closeJobModalBtn.addEventListener('click', closeJobModal);
        if (cancelJobModalBtn) cancelJobModalBtn.addEventListener('click', closeJobModal);

        if (jobImportModal) {
            jobImportModal.addEventListener('click', (e) => {
                if (e.target === jobImportModal) closeJobModal();
            });
        }

        if (jobPasteClipboardBtn && jobUrlInput) {
            jobPasteClipboardBtn.addEventListener('click', async () => {
                try {
                    const clipText = await navigator.clipboard.readText();
                    if (clipText) {
                        jobUrlInput.value = clipText.trim();
                        jobUrlInput.focus();
                    }
                } catch (e) {
                    console.log('[Paste] Clipboard read error:', e);
                }
            });
        }

        if (confirmJobImportBtn && jobUrlInput) {
            confirmJobImportBtn.addEventListener('click', async () => {
                const url = jobUrlInput.value.trim();
                if (!url) {
                    if (jobImportStatus) {
                        jobImportStatus.style.display = 'flex';
                        jobImportStatus.className = 'job-import-status error';
                        jobImportStatus.textContent = 'Please enter or paste a job link.';
                    }
                    return;
                }

                // Loading feedback
                const origBtnText = confirmJobImportBtn.innerHTML;
                confirmJobImportBtn.disabled = true;
                confirmJobImportBtn.innerHTML = `<span>Importing...</span>`;
                if (jobImportStatus) {
                    jobImportStatus.style.display = 'flex';
                    jobImportStatus.className = 'job-import-status loading';
                    jobImportStatus.textContent = 'Fetching and extracting job details...';
                }

                try {
                    const resp = await fetch('/api/job-parse-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                    });
                    const data = await resp.json();

                    if (!data.success) {
                        throw new Error(data.error || 'Failed to extract job details.');
                    }

                    // 1. Populate Company Name & Logo
                    if (data.company) {
                        const companyInput = document.getElementById('session-company-input');
                        if (companyInput) companyInput.value = data.company;
                        this.sessionData.company = data.company;

                        if (data.logo) {
                            this.sessionData.companyLogo = data.logo;
                            const logoImg = document.getElementById('company-logo-img');
                            const logoWrap = document.getElementById('company-selected-logo');
                            const clearBtn = document.getElementById('company-clear-btn');
                            if (logoImg && logoWrap) {
                                logoImg.src = data.logo;
                                logoImg.alt = data.company;
                                logoWrap.style.display = 'flex';
                                companyInput?.closest('.company-input-container')?.classList.add('has-logo');
                            }
                            if (clearBtn) clearBtn.style.display = 'flex';
                        }
                    }

                    // 2. Populate Job Description
                    if (data.description) {
                        const jobDescInput = document.getElementById('session-jobdesc-input');
                        if (jobDescInput) jobDescInput.value = data.description;
                        this.sessionData.jobDescription = data.description;
                    }

                    if (jobImportStatus) {
                        jobImportStatus.style.display = 'flex';
                        jobImportStatus.className = 'job-import-status success';
                        jobImportStatus.textContent = 'Job imported successfully!';
                    }

                    setTimeout(() => {
                        closeJobModal();
                        confirmJobImportBtn.disabled = false;
                        confirmJobImportBtn.innerHTML = origBtnText;
                    }, 500);

                } catch (err) {
                    console.error('[JobImport] Parse error:', err);
                    if (jobImportStatus) {
                        jobImportStatus.style.display = 'flex';
                        jobImportStatus.className = 'job-import-status error';
                        jobImportStatus.textContent = err.message || 'Error importing job.';
                    }
                    confirmJobImportBtn.disabled = false;
                    confirmJobImportBtn.innerHTML = origBtnText;
                }
            });
        }

        // Inputs binding — Company autocomplete with Logo.dev
        const companyInput = document.getElementById('session-company-input');
        const companyDropdown = document.getElementById('company-dropdown');
        const companyLogoWrap = document.getElementById('company-selected-logo');
        const companyLogoImg = document.getElementById('company-logo-img');
        const companyClearBtn = document.getElementById('company-clear-btn');
        let companySearchTimer = null;

        // Starter cache by first letter (e.g. 'a' -> a-starter.json, 'b' -> b-starter.json)
        this.starterCache = {};

        if (companyInput && companyDropdown) {
            companyInput.addEventListener('input', async (e) => {
                const query = e.target.value.trim();
                this.sessionData.company = query;

                if (companySearchTimer) clearTimeout(companySearchTimer);

                if (query.length < 1) {
                    companyDropdown.style.display = 'none';
                    companyDropdown.innerHTML = '';
                    return;
                }

                const renderItems = (items) => {
                    if (!items || items.length === 0) {
                        companyDropdown.style.display = 'none';
                        companyDropdown.innerHTML = '';
                        return;
                    }

                    companyDropdown.innerHTML = items.map((item, i) => `
                        <div class="company-dropdown-item" data-index="${i}" data-name="${item.name}" data-logo="${item.logo_url || item.logo}">
                            <img class="company-dropdown-logo" src="${item.logo_url || item.logo}" alt="" onerror="this.style.display='none'" />
                            <span class="company-dropdown-name">${item.name}</span>
                        </div>
                    `).join('');

                    companyDropdown.style.display = 'block';

                    companyDropdown.querySelectorAll('.company-dropdown-item').forEach(el => {
                        el.addEventListener('click', () => {
                            const name = el.dataset.name;
                            const logo = el.dataset.logo;

                            companyInput.value = name;
                            this.sessionData.company = name;
                            this.sessionData.companyLogo = logo;

                            if (companyLogoWrap && companyLogoImg && logo) {
                                companyLogoImg.src = logo;
                                companyLogoImg.alt = name;
                                companyLogoWrap.style.display = 'flex';
                                companyInput.closest('.company-input-container').classList.add('has-logo');
                            }
                            if (companyClearBtn) companyClearBtn.style.display = 'flex';

                            companyDropdown.style.display = 'none';
                            companyDropdown.innerHTML = '';
                        });
                    });
                };

                const firstChar = query[0].toLowerCase();
                const starterFileName = /^[a-z]$/.test(firstChar) ? `${firstChar}-starter.json` : 'other-starter.json';

                // Fetch starter file if not in cache yet
                if (!this.starterCache[starterFileName]) {
                    try {
                        const resp = await fetch(`/data/companies/${starterFileName}`);
                        if (resp.ok) {
                            const list = await resp.json();
                            this.starterCache[starterFileName] = Array.isArray(list) ? list : [];
                        } else {
                            this.starterCache[starterFileName] = [];
                        }
                    } catch (err) {
                        this.starterCache[starterFileName] = [];
                    }
                }

                // If user changed input while fetching, re-check
                if (companyInput.value.trim() !== query) return;

                const candidateList = this.starterCache[starterFileName] || [];
                const qLower = query.toLowerCase();
                const startsWith = [];
                const contains = [];

                for (const item of candidateList) {
                    const n = item.name || '';
                    const nl = n.toLowerCase();
                    if (nl.startsWith(qLower)) {
                        startsWith.push(item);
                    } else if (nl.includes(qLower)) {
                        contains.push(item);
                    }
                }

                startsWith.sort((a, b) => a.name.length - b.name.length);
                contains.sort((a, b) => a.name.length - b.name.length);
                const localMatches = [...startsWith, ...contains].slice(0, 8);

                // Render purely from our local starter database
                renderItems(localMatches);
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.company-autocomplete-wrapper')) {
                    companyDropdown.style.display = 'none';
                }
            });
        }

        // Company clear button
        if (companyClearBtn) {
            companyClearBtn.addEventListener('click', () => {
                companyInput.value = '';
                this.sessionData.company = '';
                this.sessionData.companyDomain = '';
                this.sessionData.companyLogo = '';
                if (companyLogoWrap) companyLogoWrap.style.display = 'none';
                companyInput.closest('.company-input-container').classList.remove('has-logo');
                companyClearBtn.style.display = 'none';
                companyInput.focus();
            });
        }
        const jobDescInput = document.getElementById('session-jobdesc-input');
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
            if (cvSelector) cvSelector.title = this.sessionData.resumeName;
        }
        if (this.sessionData.documentsName && docLabel) {
            docLabel.textContent = this.sessionData.documentsName;
            if (docSelector) docSelector.title = this.sessionData.documentsName;
        }

        if (cvSelector && cvFileInput) {
            cvSelector.addEventListener('click', () => cvFileInput.click());
            cvFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.sessionData.resumeName = file.name;
                    if (cvLabel) cvLabel.textContent = file.name;
                    if (cvSelector) cvSelector.title = file.name;
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
                    if (docSelector) docSelector.title = file.name;
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

        const renderPreview = () => {
            const previewBox = document.getElementById('answer-preview-content');
            if (!previewBox) return;

            const prefs = this.sessionData.answerPreferences;
            const qType = prefs.questionType || 'behavioral';
            const format = prefs.format || 'Script + bullets';
            const length = prefs.length || 'Balanced';
            const tone = prefs.tone || 'Simple';

            const typeData = QUESTION_TYPE_PREVIEWS[qType] || QUESTION_TYPE_PREVIEWS['behavioral'];
            const toneData = (typeData.tones && typeData.tones[tone]) || typeData.tones['Simple'];

            const answer = toneData.answer;
            let bullets = [...toneData.bullets];

            // Length: controls how many bullets to show
            if (length === 'Concise') {
                bullets = bullets.slice(0, 2);
            } else if (length === 'Comprehensive') {
                // Show all bullets (already full)
            } else {
                // Balanced: show up to 3
                bullets = bullets.slice(0, 3);
            }

            // Format: controls the structure
            let html = `<p class="preview-question"><strong>Question:</strong> ${typeData.question}</p>`;

            if (format === 'Script + bullets') {
                html += `<p class="preview-answer"><strong>Answer:</strong> ${answer}</p>`;
                html += `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
            } else if (format === 'Bullets only') {
                html += `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
            } else if (format === 'Concise script') {
                html += `<p class="preview-answer"><strong>Answer:</strong> ${answer}</p>`;
            }

            previewBox.innerHTML = html;
        };

        // Open modal
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                updateLabels();
                renderPreview();
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

        // Option cards click to cycle values — each re-renders the preview
        if (formatCard) {
            formatCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.format;
                const nextIdx = (formats.indexOf(current) + 1) % formats.length;
                this.sessionData.answerPreferences.format = formats[nextIdx];
                updateLabels();
                renderPreview();
            });
        }

        if (lengthCard) {
            lengthCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.length;
                const nextIdx = (lengths.indexOf(current) + 1) % lengths.length;
                this.sessionData.answerPreferences.length = lengths[nextIdx];
                updateLabels();
                renderPreview();
            });
        }

        if (toneCard) {
            toneCard.addEventListener('click', () => {
                const current = this.sessionData.answerPreferences.tone;
                const nextIdx = (tones.indexOf(current) + 1) % tones.length;
                this.sessionData.answerPreferences.tone = tones[nextIdx];
                updateLabels();
                renderPreview();
            });
        }

        // Question type change
        if (qTypeSelect) {
            qTypeSelect.addEventListener('change', (e) => {
                this.sessionData.answerPreferences.questionType = e.target.value;
                renderPreview();
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
                renderPreview();
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

    // --- Live Session Controls & Parakeet AiMessagesScreen 1:1 ---
    bindLiveSessionControls() {
        const endBtn = document.getElementById('end-interview-btn');
        const resetBtn = document.getElementById('reset-interview-btn');
        const hubView = document.getElementById('parakeet-hub-view');
        const bottomBar = document.getElementById('parakeet-bottom-bar');
        const liveView = document.getElementById('parakeet-live-view');

        // Toolbar Buttons
        const answerBtn = document.getElementById('btn-live-trigger-answer');
        const screenshotBtn = document.getElementById('btn-live-capture-screenshot');
        const chatToggleBtn = document.getElementById('btn-live-toggle-chat');
        const autoAnswerToggle = document.getElementById('live-auto-answer-toggle');
        const transcriptToggleBtn = document.getElementById('btn-live-toggle-transcript');
        const opacityDownBtn = document.getElementById('btn-opacity-down');
        const opacityUpBtn = document.getElementById('btn-opacity-up');
        const opacityLabel = document.getElementById('live-opacity-label');
        const langSelect = document.getElementById('live-lang-select');

        // AI Messages Navigation & Header
        const aiPrevBtn = document.getElementById('btn-ai-prev');
        const aiNextBtn = document.getElementById('btn-ai-next');
        const aiCounter = document.getElementById('ai-message-counter');
        const aiNewBadge = document.getElementById('ai-message-new-badge');
        const aiClearBtn = document.getElementById('btn-ai-clear');
        const aiCopyBtn = document.getElementById('btn-ai-copy');
        const aiCopyText = document.getElementById('btn-ai-copy-text');
        const aiMinimizeBtn = document.getElementById('btn-ai-minimize');
        const aiScreen = document.getElementById('ai-messages-screen');
        const aiCardBody = document.getElementById('ai-message-card-body');

        // Transcript Drawer
        const transcriptDrawer = document.getElementById('transcript-drawer');
        const closeTranscriptBtn = document.getElementById('btn-close-transcript-drawer');
        const clearTranscriptBtn = document.getElementById('btn-clear-transcript');

        // Chat Drawer
        const chatDrawer = document.getElementById('live-chat-drawer');
        const chatInput = document.getElementById('live-chat-input');
        const chatSendBtn = document.getElementById('btn-live-chat-send');
        const chatCloseBtn = document.getElementById('btn-live-chat-close');

        // State initialization
        this.aiAnswers = [];
        this.currentAiAnswerIndex = -1;
        this.currentOpacity = 100;
        this.isAutoAnswerActive = this.sessionData.autoGenerate;

        // Auto Answer Toggle
        if (autoAnswerToggle) {
            autoAnswerToggle.checked = this.sessionData.autoGenerate;
            this.isAutoAnswerActive = this.sessionData.autoGenerate;
            autoAnswerToggle.addEventListener('change', (e) => {
                this.isAutoAnswerActive = e.target.checked;
                this.sessionData.autoGenerate = e.target.checked;
            });
        }

        // Language Select
        if (langSelect) {
            langSelect.value = this.sessionData.language === 'Português' ? 'pt-BR' : 'en';
            langSelect.addEventListener('change', (e) => {
                this.sessionData.language = e.target.value;
            });
        }

        // Trigger Answer Button
        if (answerBtn) {
            answerBtn.addEventListener('click', () => {
                this.triggerManualAiAnswer();
            });
        }

        // Screenshot Capture Button
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this.triggerSilentScreenshot();
            });
        }

        // Chat Toggle
        if (chatToggleBtn && chatDrawer) {
            chatToggleBtn.addEventListener('click', () => {
                const isOpen = chatDrawer.style.display !== 'none';
                chatDrawer.style.display = isOpen ? 'none' : 'flex';
                if (!isOpen && chatInput) {
                    setTimeout(() => chatInput.focus(), 50);
                }
            });
        }

        if (chatCloseBtn && chatDrawer) {
            chatCloseBtn.addEventListener('click', () => {
                chatDrawer.style.display = 'none';
            });
        }

        const sendChatMessage = () => {
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;
            chatInput.value = '';
            if (chatDrawer) chatDrawer.style.display = 'none';
            this.triggerManualAiAnswer(text);
        };

        if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendChatMessage();
                } else if (e.key === 'Escape') {
                    if (chatDrawer) chatDrawer.style.display = 'none';
                }
            });
        }

        // Transcript Drawer Toggle
        if (transcriptToggleBtn && transcriptDrawer) {
            transcriptToggleBtn.addEventListener('click', () => {
                const isOpen = transcriptDrawer.style.display !== 'none';
                transcriptDrawer.style.display = isOpen ? 'none' : 'flex';
            });
        }

        if (closeTranscriptBtn && transcriptDrawer) {
            closeTranscriptBtn.addEventListener('click', () => {
                transcriptDrawer.style.display = 'none';
            });
        }

        if (clearTranscriptBtn) {
            clearTranscriptBtn.addEventListener('click', () => {
                const stream = document.getElementById('conversation-stream');
                if (stream) {
                    stream.innerHTML = `
                        <div class="speech-bubble interviewer initial">
                            <div class="speech-sender-tag">Interviewer</div>
                            <div>Transcript cleared. Listening for new conversation...</div>
                        </div>
                    `;
                }
            });
        }

        // Opacity Stepper
        const opacityLevels = [25, 45, 65, 85, 100];
        const updateOpacityUI = (val) => {
            this.currentOpacity = val;
            if (opacityLabel) opacityLabel.textContent = `${val}%`;
            fetch('/api/transparency/percent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ percent: val })
            }).catch(() => {});
        };

        if (opacityDownBtn) {
            opacityDownBtn.addEventListener('click', () => {
                let idx = opacityLevels.findIndex(lvl => lvl >= this.currentOpacity);
                if (idx > 0) updateOpacityUI(opacityLevels[idx - 1]);
            });
        }

        if (opacityUpBtn) {
            opacityUpBtn.addEventListener('click', () => {
                let idx = opacityLevels.findIndex(lvl => lvl >= this.currentOpacity);
                if (idx < opacityLevels.length - 1 && idx !== -1) updateOpacityUI(opacityLevels[idx + 1]);
            });
        }

        // Navigation Stepper (Prev / Next)
        if (aiPrevBtn) {
            aiPrevBtn.addEventListener('click', () => {
                if (this.currentAiAnswerIndex > 0) {
                    this.currentAiAnswerIndex--;
                    this.renderCurrentAiAnswer();
                }
            });
        }

        if (aiNextBtn) {
            aiNextBtn.addEventListener('click', () => {
                if (this.currentAiAnswerIndex < this.aiAnswers.length - 1) {
                    this.currentAiAnswerIndex++;
                    this.renderCurrentAiAnswer();
                }
            });
        }

        // Clear Answers
        if (aiClearBtn) {
            aiClearBtn.addEventListener('click', () => {
                this.aiAnswers = [];
                this.currentAiAnswerIndex = -1;
                this.renderCurrentAiAnswer();
            });
        }

        // Copy Full Answer
        if (aiCopyBtn) {
            aiCopyBtn.addEventListener('click', async () => {
                const current = this.aiAnswers[this.currentAiAnswerIndex];
                if (!current || !current.rawAnswer) return;
                try {
                    await navigator.clipboard.writeText(current.rawAnswer);
                    if (aiCopyText) aiCopyText.textContent = 'Copied!';
                    setTimeout(() => {
                        if (aiCopyText) aiCopyText.textContent = 'Copy';
                    }, 1500);
                } catch (e) {
                    console.log('Copy failed:', e);
                }
            });
        }

        // Minimize / Expand Answer Box
        if (aiMinimizeBtn && aiScreen) {
            aiMinimizeBtn.addEventListener('click', () => {
                aiScreen.classList.toggle('minimized');
                if (aiCardBody) {
                    aiCardBody.style.display = aiScreen.classList.contains('minimized') ? 'none' : 'flex';
                }
            });
        }

        // End Call
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

        // Reset Session
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.resetInterview) {
                    window.resetInterview();
                }
            });
        }

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (!liveView || liveView.style.display === 'none') return;

            // Ctrl+Enter: Trigger Answer
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.triggerManualAiAnswer();
            }
            // Ctrl+Shift+S: Screenshot
            else if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                this.triggerSilentScreenshot();
            }
            // Ctrl+K: Chat Toggle
            else if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                if (chatToggleBtn) chatToggleBtn.click();
            }
            // Ctrl+T: Transcript Toggle
            else if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                if (transcriptToggleBtn) transcriptToggleBtn.click();
            }
            // Ctrl+Left: Previous Answer
            else if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                if (aiPrevBtn && !aiPrevBtn.disabled) aiPrevBtn.click();
            }
            // Ctrl+Right: Next Answer
            else if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                if (aiNextBtn && !aiNextBtn.disabled) aiNextBtn.click();
            }
            // Ctrl+Shift+Delete: Clear Answers
            else if (e.ctrlKey && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault();
                if (aiClearBtn) aiClearBtn.click();
            }
        });
    }

    // Format Answer Content with Opening Script, Bullets & Code Blocks
    formatAiAnswerContent(text) {
        if (!text) return '';

        const codeBlocks = [];
        let processed = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const blockId = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push({ lang: lang || 'code', code: code.trim() });
            return blockId;
        });

        const lines = processed.split('\n').map(l => l.trim()).filter(Boolean);
        let openingScript = '';
        const bulletItems = [];
        const normalParagraphs = [];

        let firstLineUsed = false;
        if (lines.length > 0 && !lines[0].startsWith('•') && !lines[0].startsWith('-') && !lines[0].startsWith('*')) {
            openingScript = lines[0].replace(/^["']|["']$/g, '');
            firstLineUsed = true;
        }

        for (let i = firstLineUsed ? 1 : 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                bulletItems.push(line.replace(/^[•\-*]\s*/, ''));
            } else {
                normalParagraphs.push(line);
            }
        }

        let html = '';

        if (openingScript) {
            html += `
                <div class="ai-opening-script">
                    <span class="ai-opening-script-label">Opening Script · Say this first</span>
                    <div>"${this.escapeHtml(openingScript)}"</div>
                </div>
            `;
        }

        if (bulletItems.length > 0) {
            html += `<ul class="ai-answer-bullets">`;
            for (const item of bulletItems) {
                const formatted = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html += `<li>${formatted}</li>`;
            }
            html += `</ul>`;
        }

        for (const p of normalParagraphs) {
            if (p.startsWith('__CODE_BLOCK_')) {
                html += p;
            } else {
                const formatted = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html += `<p style="margin: 8px 0;">${formatted}</p>`;
            }
        }

        html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, idx) => {
            const block = codeBlocks[parseInt(idx, 10)];
            if (!block) return '';
            const codeEscaped = this.escapeHtml(block.code);
            return `
                <div class="ai-code-block-wrap">
                    <div class="ai-code-header">
                        <span>${this.escapeHtml(block.lang.toUpperCase())}</span>
                        <button type="button" class="ai-code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(block.code)}'))">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copy Code
                        </button>
                    </div>
                    <pre class="ai-code-content"><code>${codeEscaped}</code></pre>
                </div>
            `;
        });

        return html;
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    detectQuestionCategory(question) {
        const q = (question || '').toLowerCase();
        if (/leetcode|two sum|algorithm|array|binary tree|graph|dp|complexity|time complexity|space complexity|sort|matrix|hash/i.test(q)) {
            return 'Coding';
        }
        if (/system design|scale|latency|database|cache|redis|kafka|microservice|load balancer|architect|throughput/i.test(q)) {
            return 'System Design';
        }
        if (/tell me about a time|conflict|disagree|challenge|failure|leader|team|proud|situation/i.test(q)) {
            return 'Behavioral';
        }
        if (/difference between|what is|explain|how does|why use|spring|react|sql|java|python|docker|kubernetes/i.test(q)) {
            return 'Technical';
        }
        return 'Interview';
    }

    onStreamingAiAnswerChunk(chunk) {
        if (this.currentAiAnswerIndex === -1 || !this.aiAnswers[this.currentAiAnswerIndex]) return;
        this.aiAnswers[this.currentAiAnswerIndex].rawAnswer += chunk;
        this.renderCurrentAiAnswer(true);
    }

    onStreamingAiAnswerStart(questionPrompt) {
        const category = this.detectQuestionCategory(questionPrompt);
        const newItem = {
            question: questionPrompt || 'Interview Question',
            category: category,
            rawAnswer: '',
            isStreaming: true,
            timestamp: new Date()
        };

        this.aiAnswers.push(newItem);
        this.currentAiAnswerIndex = this.aiAnswers.length - 1;
        this.renderCurrentAiAnswer(true);
    }

    onStreamingAiAnswerComplete(fullAnswer) {
        if (this.currentAiAnswerIndex === -1 || !this.aiAnswers[this.currentAiAnswerIndex]) return;
        this.aiAnswers[this.currentAiAnswerIndex].rawAnswer = fullAnswer || this.aiAnswers[this.currentAiAnswerIndex].rawAnswer;
        this.aiAnswers[this.currentAiAnswerIndex].isStreaming = false;
        this.renderCurrentAiAnswer(false);
    }

    renderCurrentAiAnswer(isStreaming = false) {
        const prevBtn = document.getElementById('btn-ai-prev');
        const nextBtn = document.getElementById('btn-ai-next');
        const counter = document.getElementById('ai-message-counter');
        const newBadge = document.getElementById('ai-message-new-badge');
        const catBadge = document.getElementById('ai-question-category');
        const qText = document.getElementById('ai-detected-question-text');
        const contentBox = document.getElementById('ai-answer-content');

        if (this.aiAnswers.length === 0 || this.currentAiAnswerIndex < 0) {
            if (counter) counter.textContent = '0 of 0';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            if (newBadge) newBadge.style.display = 'none';
            if (qText) qText.textContent = 'Waiting for interviewer question or click "Answer" / "Screenshot"...';
            if (contentBox) {
                contentBox.innerHTML = `
                    <div class="ai-empty-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        <p>Answers from your AI coach will stream here in real time.</p>
                        <div class="ai-shortcuts-hint">
                            <span><kbd>Ctrl+↵</kbd> Answer</span>
                            <span><kbd>Ctrl+⇧+S</kbd> Screenshot</span>
                            <span><kbd>Ctrl+K</kbd> Ask</span>
                        </div>
                    </div>
                `;
            }
            return;
        }

        const item = this.aiAnswers[this.currentAiAnswerIndex];
        const isLatest = this.currentAiAnswerIndex === this.aiAnswers.length - 1;

        if (counter) counter.textContent = `${this.currentAiAnswerIndex + 1} of ${this.aiAnswers.length}`;
        if (prevBtn) prevBtn.disabled = this.currentAiAnswerIndex <= 0;
        if (nextBtn) nextBtn.disabled = this.currentAiAnswerIndex >= this.aiAnswers.length - 1;
        if (newBadge) newBadge.style.display = (!isLatest && this.aiAnswers.length > 1) ? 'inline-block' : 'none';

        if (catBadge) catBadge.textContent = item.category || 'Interview';
        if (qText) qText.textContent = item.question || 'Interview Question';

        if (contentBox) {
            let html = this.formatAiAnswerContent(item.rawAnswer);
            if (isStreaming || item.isStreaming) {
                html += `<span class="ai-streaming-cursor"></span>`;
            }
            contentBox.innerHTML = html;
        }
    }

    async triggerManualAiAnswer(promptText) {
        let question = promptText;
        if (!question) {
            const bubbles = document.querySelectorAll('#conversation-stream .speech-bubble.interviewer');
            if (bubbles.length > 0) {
                for (let i = bubbles.length - 1; i >= 0; i--) {
                    const text = bubbles[i].textContent.replace('Interviewer', '').trim();
                    if (text && !text.includes('loopback audio listening') && !text.includes('Transcript cleared')) {
                        question = text;
                        break;
                    }
                }
            }
        }
        if (!question) {
            question = 'Give a strong opening answer and technical summary for the target role: ' + (this.sessionData.company || 'Software Engineer');
        }

        this.onStreamingAiAnswerStart(question);

        if (window.webSocketHandler) {
            window.webSocketHandler.sendMessage('user_query', { query: question });
        } else {
            try {
                const resp = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: question,
                        context: {
                            target_company: this.sessionData.company,
                            complete_job_description: this.sessionData.jobDescription,
                            complete_resume: this.sessionData.resumeContent,
                            aiInstructions: this.sessionData.aiInstructions,
                            answerPreferences: this.sessionData.answerPreferences
                        }
                    })
                });
                const data = await resp.json();
                this.onStreamingAiAnswerComplete(data.reply || data.response || 'No response generated.');
            } catch (err) {
                this.onStreamingAiAnswerComplete('Failed to generate AI response: ' + err.message);
            }
        }
    }

    async triggerSilentScreenshot() {
        this.onStreamingAiAnswerStart('Analyzing live screen capture (LeetCode / Technical Diagram)...');
        try {
            const resp = await fetch('/api/screenshot/native', { method: 'POST' });
            const data = await resp.json();
            if (data.success && data.image) {
                if (window.webSocketHandler) {
                    window.webSocketHandler.sendMessage('analyze_vision', {
                        images: [data.image],
                        prompt: 'Analyze the problem, code, or architecture shown on the screen and give the optimal solution.'
                    });
                }
            } else {
                throw new Error(data.detail || 'Could not capture native screenshot');
            }
        } catch (err) {
            this.onStreamingAiAnswerComplete('Screenshot analysis failed: ' + err.message);
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
