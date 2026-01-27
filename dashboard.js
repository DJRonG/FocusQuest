/**
 * FocusQuest Dashboard - Main Application
 * A comprehensive productivity and focus management system
 */

const FocusQuest = {
    // State
    state: {
        tasks: [],
        quests: [],
        settings: {
            name: 'Focus Seeker',
            email: '',
            apiKey: '',
            aiSuggestions: true,
            insights: true,
            focusDuration: 25,
            breakDuration: 5,
            soundNotify: true
        },
        stats: {
            completedToday: 0,
            streak: 0,
            focusTimeToday: 0,
            weeklyGoal: 70,
            lastActiveDate: null
        },
        calendar: {
            connected: null,
            events: []
        },
        environment: {
            lighting: false,
            ambientSound: 'none'
        },
        currentMode: 'work',
        focusTimer: {
            duration: 25 * 60,
            remaining: 25 * 60,
            isRunning: false,
            taskId: null,
            interval: null
        }
    },

    // Initialize application
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderAll();
        this.updateGreeting();
        this.updateDateDisplay();
        this.checkStreak();
        this.loadDailyQuote();
        this.generateMiniCalendar();
        this.generateDaySchedule();
        
        // Check for hash navigation
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.showSection(hash);
        }
        
        console.log('FocusQuest initialized');
    },

    // Storage functions
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('focusquest_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.state = { ...this.state, ...data };
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
        
        // Initialize with default data if empty
        if (this.state.tasks.length === 0) {
            this.state.tasks = [
                { id: 1, text: 'Welcome to FocusQuest!', status: 'done', priority: 'low', category: 'work', timeBlock: null, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
                { id: 2, text: 'Create your first task', status: 'todo', priority: 'high', category: 'work', timeBlock: 'morning', createdAt: new Date().toISOString() },
                { id: 3, text: 'Try the Focus Timer', status: 'todo', priority: 'medium', category: 'work', timeBlock: 'afternoon', createdAt: new Date().toISOString() },
                { id: 4, text: 'Explore AI features', status: 'todo', priority: 'medium', category: 'work', timeBlock: null, createdAt: new Date().toISOString() }
            ];
        }
        
        if (this.state.quests.length === 0) {
            this.state.quests = [
                { id: 1, title: 'Getting Started', description: 'Learn the basics of FocusQuest and complete your first tasks.', taskIds: [2, 3, 4], deadline: null },
                { id: 2, title: 'Productivity Master', description: 'Complete 10 focus sessions and maintain a 7-day streak.', taskIds: [], deadline: null }
            ];
        }
    },

    saveToStorage() {
        try {
            localStorage.setItem('focusquest_data', JSON.stringify(this.state));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    },

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMode(btn.dataset.mode);
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Add task form
        document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTaskFromForm();
        });

        // Add quest form
        document.getElementById('addQuestForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuestFromForm();
        });

        // Chat form
        document.getElementById('chatForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendChatMessage();
        });

        // Quick add button
        document.getElementById('quickAddBtn')?.addEventListener('click', () => {
            this.showSection('tasks');
            document.getElementById('taskInput')?.focus();
        });

        // Global search
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Task filters
        document.getElementById('taskFilter')?.addEventListener('change', () => this.renderTasks());
        document.getElementById('priorityFilter')?.addEventListener('change', () => this.renderTasks());

        // Settings inputs
        document.getElementById('settingName')?.addEventListener('change', (e) => {
            this.state.settings.name = e.target.value;
            this.saveToStorage();
            this.updateGreeting();
        });
    },

    // Navigation
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const section = document.getElementById(`section-${sectionId}`);
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (section) section.classList.add('active');
        if (navItem) navItem.classList.add('active');
        
        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('open');
        
        // Update hash
        window.location.hash = sectionId;
    },

    // Mode toggle (work/personal)
    setMode(mode) {
        this.state.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        this.renderTasks();
        this.renderTimeBlocks();
        this.saveToStorage();
    },

    // Greeting and date
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'evening';
        if (hour < 12) greeting = 'morning';
        else if (hour < 17) greeting = 'afternoon';
        
        const greetingEl = document.getElementById('greeting-time');
        const nameEl = document.getElementById('user-name');
        
        if (greetingEl) greetingEl.textContent = greeting;
        if (nameEl) nameEl.textContent = this.state.settings.name;
    },

    updateDateDisplay() {
        const dateEl = document.getElementById('date-display');
        if (dateEl) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    // Streak checking
    checkStreak() {
        const today = new Date().toDateString();
        const lastActive = this.state.stats.lastActiveDate;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                this.state.stats.streak++;
            } else if (lastActive !== today) {
                this.state.stats.streak = 1;
            }
            
            this.state.stats.lastActiveDate = today;
            this.state.stats.completedToday = 0;
            this.state.stats.focusTimeToday = 0;
            this.saveToStorage();
        }
        
        this.updateStats();
    },

    updateStats() {
        const completedToday = this.state.tasks.filter(t => {
            if (t.status !== 'done' || !t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toDateString();
            return completedDate === new Date().toDateString();
        }).length;
        
        document.getElementById('stat-completed').textContent = completedToday;
        document.getElementById('stat-streak').textContent = this.state.stats.streak;
        document.getElementById('stat-focus').textContent = Math.floor(this.state.stats.focusTimeToday / 60) + 'h';
        
        const weeklyProgress = Math.min(100, Math.round((completedToday / this.state.stats.weeklyGoal) * 100));
        document.getElementById('stat-progress').textContent = weeklyProgress + '%';
    },

    // Task Management
    addTaskFromForm() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('taskPriority').value;
        const timeBlock = document.getElementById('taskTimeBlock').value || null;
        const questId = document.getElementById('taskQuest').value || null;
        const deadline = document.getElementById('taskDeadline').value || null;
        
        if (!input.value.trim()) return;
        
        const task = {
            id: Date.now(),
            text: input.value.trim(),
            status: 'todo',
            priority: priority,
            category: this.state.currentMode === 'work' ? 'work' : 'personal',
            timeBlock: timeBlock,
            questId: questId ? parseInt(questId) : null,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            completedAt: null,
            aiInsight: null
        };
        
        this.state.tasks.push(task);
        this.saveToStorage();
        this.renderAll();
        
        // Reset form
        input.value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskTimeBlock').value = '';
        document.getElementById('taskDeadline').value = '';
        
        this.showToast('Task added successfully!', 'success');
    },

    updateTaskStatus(taskId, newStatus) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const oldStatus = task.status;
        task.status = newStatus;
        
        if (newStatus === 'done' && oldStatus !== 'done') {
            task.completedAt = new Date().toISOString();
            this.state.stats.completedToday++;
            this.saveToStorage();
            
            // Show transition screen
            this.showTransition(task);
            
            // Generate AI insight if enabled
            if (this.state.settings.insights) {
                this.generateTaskInsight(task);
            }
        } else if (newStatus !== 'done') {
            task.completedAt = null;
        }
        
        this.saveToStorage();
        this.renderAll();
    },

    deleteTask(taskId) {
        this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
        this.saveToStorage();
        this.renderAll();
        this.showToast('Task deleted', 'info');
    },

    // Render functions
    renderAll() {
        this.renderTasks();
        this.renderTimeBlocks();
        this.renderQuests();
        this.updateStats();
        this.updateQuestDropdown();
        this.updateFocusTaskSelect();
    },

    renderTasks() {
        const statusFilter = document.getElementById('taskFilter')?.value || 'all';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
        
        const lists = {
            todo: document.getElementById('list-todo'),
            inprogress: document.getElementById('list-inprogress'),
            done: document.getElementById('list-done')
        };
        
        // Clear lists
        Object.values(lists).forEach(list => { if (list) list.innerHTML = ''; });
        
        // Filter tasks
        let filteredTasks = this.state.tasks.filter(task => {
            const categoryMatch = this.state.currentMode === 'work' 
                ? task.category === 'work' 
                : task.category !== 'work';
            const statusMatch = statusFilter === 'all' || 
                (statusFilter === 'todo' && task.status === 'todo') ||
                (statusFilter === 'inprogress' && task.status === 'inprogress') ||
                (statusFilter === 'done' && task.status === 'done');
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            
            return categoryMatch && statusMatch && priorityMatch;
        });
        
        // Count tasks
        const counts = { todo: 0, inprogress: 0, done: 0 };
        
        filteredTasks.forEach(task => {
            const statusKey = task.status === 'inprogress' ? 'inprogress' : task.status;
            counts[statusKey]++;
            
            const list = lists[statusKey];
            if (list) {
                list.appendChild(this.createTaskCard(task));
            }
        });
        
        // Update counts
        document.getElementById('count-todo').textContent = counts.todo;
        document.getElementById('count-inprogress').textContent = counts.inprogress;
        document.getElementById('count-done').textContent = counts.done;
    },

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;
        
        // Drag events
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        const quest = task.questId ? this.state.quests.find(q => q.id === task.questId) : null;
        
        card.innerHTML = `
            <div class="task-card-header">
                <span class="task-title">${this.escapeHtml(task.text)}</span>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
            <div class="task-meta">
                ${task.timeBlock ? `<span>🕐 ${task.timeBlock}</span>` : ''}
                ${task.deadline ? `<span>📅 ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                ${quest ? `<span>🏆 ${quest.title}</span>` : ''}
            </div>
            <div class="task-actions">
                ${task.status === 'todo' ? `
                    <button class="task-action-btn" onclick="FocusQuest.updateTaskStatus(${task.id}, 'inprogress')">▶ Start</button>
                ` : ''}
                ${task.status === 'inprogress' ? `
                    <button class="task-action-btn" onclick="FocusQuest.updateTaskStatus(${task.id}, 'done')">✓ Complete</button>
                    <button class="task-action-btn" onclick="FocusQuest.updateTaskStatus(${task.id}, 'todo')">⏸ Pause</button>
                ` : ''}
                ${task.status === 'done' ? `
                    <button class="task-action-btn" onclick="FocusQuest.updateTaskStatus(${task.id}, 'todo')">↺ Reopen</button>
                ` : ''}
                <button class="task-action-btn" onclick="FocusQuest.showTaskDetail(${task.id})">📝 Details</button>
                <button class="task-action-btn" onclick="FocusQuest.deleteTask(${task.id})">🗑</button>
            </div>
        `;
        
        // Click to view details
        card.querySelector('.task-title').addEventListener('click', () => {
            this.showTaskDetail(task.id);
        });
        
        return card;
    },

    renderTimeBlocks() {
        const container = document.getElementById('timeBlocks');
        if (!container) return;
        
        const blocks = ['morning', 'afternoon', 'evening'];
        const icons = { morning: '🌅', afternoon: '☀️', evening: '🌙' };
        const times = { morning: '6 AM - 12 PM', afternoon: '12 PM - 6 PM', evening: '6 PM - 12 AM' };
        
        container.innerHTML = blocks.map(block => {
            const tasks = this.state.tasks.filter(t => 
                t.timeBlock === block && 
                t.status !== 'done' &&
                (this.state.currentMode === 'work' ? t.category === 'work' : t.category !== 'work')
            );
            
            return `
                <div class="time-block ${block}">
                    <div class="time-block-header">
                        <span>${icons[block]} ${block.charAt(0).toUpperCase() + block.slice(1)}</span>
                        <span style="font-size: 0.8rem; opacity: 0.7;">${times[block]}</span>
                    </div>
                    <div class="time-block-tasks">
                        ${tasks.map(t => `
                            <div class="time-block-task" onclick="FocusQuest.showTaskDetail(${t.id})">
                                <span class="task-priority ${t.priority}" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
                                ${this.escapeHtml(t.text)}
                            </div>
                        `).join('')}
                        ${tasks.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.85rem;">No tasks scheduled</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderQuests() {
        const container = document.getElementById('questsGrid');
        if (!container) return;
        
        container.innerHTML = this.state.quests.map(quest => {
            const linkedTasks = this.state.tasks.filter(t => t.questId === quest.id);
            const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
            const progress = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
            
            return `
                <div class="quest-card">
                    <div class="quest-header">
                        <span class="quest-icon">🏆</span>
                        <span class="quest-title">${this.escapeHtml(quest.title)}</span>
                    </div>
                    <p class="quest-description">${this.escapeHtml(quest.description)}</p>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="quest-stats">
                        <span>${completedTasks}/${linkedTasks.length} tasks</span>
                        <span>${progress}% complete</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateQuestDropdown() {
        const select = document.getElementById('taskQuest');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">No Quest</option>' + 
            this.state.quests.map(q => `<option value="${q.id}">${this.escapeHtml(q.title)}</option>`).join('');
        select.value = currentValue;
    },

    updateFocusTaskSelect() {
        const select = document.getElementById('focusTaskSelect');
        if (!select) return;
        
        const activeTasks = this.state.tasks.filter(t => t.status !== 'done');
        select.innerHTML = '<option value="">Select a task...</option>' +
            activeTasks.map(t => `<option value="${t.id}">${this.escapeHtml(t.text)}</option>`).join('');
    },

    // Quest Management
    openAddQuestModal() {
        document.getElementById('addQuestModal').classList.add('active');
    },

    closeAddQuestModal() {
        document.getElementById('addQuestModal').classList.remove('active');
        document.getElementById('addQuestForm').reset();
    },

    addQuestFromForm() {
        const title = document.getElementById('questTitle').value.trim();
        const description = document.getElementById('questDescription').value.trim();
        const deadline = document.getElementById('questDeadline').value || null;
        
        if (!title) return;
        
        const quest = {
            id: Date.now(),
            title,
            description,
            taskIds: [],
            deadline
        };
        
        this.state.quests.push(quest);
        this.saveToStorage();
        this.renderQuests();
        this.updateQuestDropdown();
        this.closeAddQuestModal();
        this.showToast('Quest created!', 'success');
    },

    // Task Detail Modal
    showTaskDetail(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('taskDetailModal');
        const content = document.getElementById('taskDetailContent');
        
        const quest = task.questId ? this.state.quests.find(q => q.id === task.questId) : null;
        
        content.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="margin-bottom: 16px;">${this.escapeHtml(task.text)}</h2>
                
                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Status</span>
                        <span class="task-priority ${task.status === 'done' ? 'low' : task.status === 'inprogress' ? 'medium' : 'high'}">${task.status}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Priority</span>
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                    </div>
                    ${task.timeBlock ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Time Block</span>
                        <span>${task.timeBlock}</span>
                    </div>
                    ` : ''}
                    ${task.deadline ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Deadline</span>
                        <span>${new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    ${quest ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Quest</span>
                        <span>🏆 ${this.escapeHtml(quest.title)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Created</span>
                        <span>${new Date(task.createdAt).toLocaleString()}</span>
                    </div>
                    ${task.completedAt ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Completed</span>
                        <span>${new Date(task.completedAt).toLocaleString()}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${task.aiInsight ? `
                <div style="background: var(--bg-card); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 8px;">🤖 AI Insight</h4>
                    <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.6;">${this.escapeHtml(task.aiInsight)}</p>
                </div>
                ` : ''}
                
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    ${task.status === 'todo' ? `
                        <button class="btn-primary" onclick="FocusQuest.updateTaskStatus(${task.id}, 'inprogress'); FocusQuest.closeTaskDetail();">Start Task</button>
                    ` : ''}
                    ${task.status === 'inprogress' ? `
                        <button class="btn-primary" onclick="FocusQuest.updateTaskStatus(${task.id}, 'done'); FocusQuest.closeTaskDetail();">Complete Task</button>
                    ` : ''}
                    <button class="btn-secondary" onclick="FocusQuest.startFocusWithTask(${task.id}); FocusQuest.closeTaskDetail();">🧠 Focus on This</button>
                    <button class="btn-danger" onclick="FocusQuest.deleteTask(${task.id}); FocusQuest.closeTaskDetail();">Delete</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    },

    closeTaskDetail() {
        document.getElementById('taskDetailModal').classList.remove('active');
    },

    // Focus Timer
    setTimer(minutes) {
        document.querySelectorAll('.timer-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        this.state.focusTimer.duration = minutes * 60;
        this.state.focusTimer.remaining = minutes * 60;
        this.updateTimerDisplay();
    },

    toggleFocusTimer() {
        if (this.state.focusTimer.isRunning) {
            this.pauseFocusTimer();
        } else {
            this.startFocusTimer();
        }
    },

    startFocusTimer() {
        const taskSelect = document.getElementById('focusTaskSelect');
        if (taskSelect && taskSelect.value) {
            this.state.focusTimer.taskId = parseInt(taskSelect.value);
            this.updateTaskStatus(this.state.focusTimer.taskId, 'inprogress');
        }
        
        this.state.focusTimer.isRunning = true;
        document.getElementById('focusStartBtn').textContent = 'Pause Session';
        document.getElementById('focusStartBtn').classList.add('active');
        
        this.state.focusTimer.interval = setInterval(() => {
            this.state.focusTimer.remaining--;
            this.state.stats.focusTimeToday++;
            this.updateTimerDisplay();
            
            if (this.state.focusTimer.remaining <= 0) {
                this.completeFocusSession();
            }
        }, 1000);
        
        this.saveToStorage();
    },

    pauseFocusTimer() {
        this.state.focusTimer.isRunning = false;
        clearInterval(this.state.focusTimer.interval);
        document.getElementById('focusStartBtn').textContent = 'Resume Session';
        document.getElementById('focusStartBtn').classList.remove('active');
    },

    completeFocusSession() {
        clearInterval(this.state.focusTimer.interval);
        this.state.focusTimer.isRunning = false;
        this.state.focusTimer.remaining = this.state.focusTimer.duration;
        
        document.getElementById('focusStartBtn').textContent = 'Start Focus Session';
        document.getElementById('focusStartBtn').classList.remove('active');
        
        this.updateTimerDisplay();
        this.saveToStorage();
        this.updateStats();
        
        if (this.state.settings.soundNotify) {
            this.playNotificationSound();
        }
        
        this.showToast('🎉 Focus session complete! Great work!', 'success');
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.state.focusTimer.remaining / 60);
        const seconds = this.state.focusTimer.remaining % 60;
        
        document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');
        
        // Update progress ring
        const progress = document.getElementById('timerProgress');
        if (progress) {
            const circumference = 565.48; // 2 * PI * 90
            const offset = circumference * (1 - this.state.focusTimer.remaining / this.state.focusTimer.duration);
            progress.style.strokeDashoffset = offset;
        }
    },

    startFocusSession() {
        this.showSection('focus');
    },

    startFocusWithTask(taskId) {
        const select = document.getElementById('focusTaskSelect');
        if (select) select.value = taskId;
        this.showSection('focus');
    },

    // Environment Controls
    toggleLighting() {
        this.state.environment.lighting = !this.state.environment.lighting;
        const btn = document.getElementById('lightingToggle');
        btn.classList.toggle('active', this.state.environment.lighting);
        btn.querySelector('.toggle-status').textContent = this.state.environment.lighting ? 'On' : 'Off';
        this.saveToStorage();
        this.showToast(`Focus lighting ${this.state.environment.lighting ? 'on' : 'off'}`, 'info');
    },

    setAmbientSound(sound) {
        // Stop all sounds
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Update buttons
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === sound);
        });
        
        this.state.environment.ambientSound = sound;
        
        if (sound !== 'none') {
            const audio = document.getElementById(`audio-${sound}`);
            if (audio) {
                audio.volume = 0.3;
                audio.play().catch(e => console.log('Audio autoplay prevented'));
            }
        }
        
        this.saveToStorage();
    },

    activateScene(sceneId) {
        const scenes = {
            'deep-focus': { lighting: true, sound: 'none' },
            'relax': { lighting: false, sound: 'rain' },
            'energize': { lighting: true, sound: 'cafe' },
            'wind-down': { lighting: false, sound: 'forest' }
        };
        
        const scene = scenes[sceneId];
        if (!scene) return;
        
        this.state.environment.lighting = scene.lighting;
        document.getElementById('lightingToggle').classList.toggle('active', scene.lighting);
        document.getElementById('lightingToggle').querySelector('.toggle-status').textContent = scene.lighting ? 'On' : 'Off';
        
        this.setAmbientSound(scene.sound);
        this.saveToStorage();
        
        this.showToast(`Scene "${sceneId.replace('-', ' ')}" activated`, 'success');
    },

    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6Xj4GAd3F0eYOOl5qVjoOAd3N0eIKLkJKOiYWBfnl4eX2EiYuKiIWCf3x6e3+EiYyMioeDgX58e3x/g4eJiYiGhIKAfXt7fYCDhoeHhoWDgX99fHx+gYOGhoeGhYSDgX59fH1/gYOFhoaFhYSDgX99fX1/gYOFhYaFhIOCgX9+fX1/gIKEhYWFhIOCgX9+fn5/gIKDhIWEhIOCgH9+fn5/gIGDhISEhIOCgH9+fn5/gIGCg4SEhIOCgH9+fn5/gIGCg4OEg4KBgH9+fn9/gIGCg4ODg4KBgH9+fn9/gIGCgoODg4KBgH9/fn9/gIGBgoKDg4KBgH9/fn9/gIGBgoKCg4KBgH9/f39/gIGBgoKCgoKBgH9/f39/gIGBggKCgoKBgH9/f39/gIGBgoKCgoGBgH9/f3+AgIGBgoKCgoGBgH9/f3+AgIGBgYKCgoGBgH9/f3+AgIGBgYKCgYGBgH9/f3+AgIGBgYGCgYGBgH9/f3+AgIGBgYGBgYGAgH9/f3+AgIGBgYGBgYGAgH9/f3+AgICBgYGBgYGAgH9/f3+AgICBgYGBgYCAgH9/f39/gICBgYGBgYCAgH9/f39/gICBgYGBgICAgH9/f39/gICBgYGBgICAgH9/f39/gICAgYGBgICAgH9/f39/gICAgYGAgICAgH9/f39/gICAgYCAgICAgH9/f39/gICAgICAgICAgH9/f39/gICAgICAgICAf39/f39/gICAgICAgICAf39/f39/gICAgICAgICAf39/f39/gICAgICAgICAf39/f3+AgICAgICAgICAf39/f3+AgICAgICAgIB/f39/f3+AgICAgICAgIB/f39/f3+AgICAgICAgIB/f39/f39/gICAgICAgIB/f39/f39/gICAgICAgIB/f39/f39/gICAgICAgIB/f39/');
        audio.play().catch(e => {});
    },

    // Calendar Functions
    connectCalendar(provider) {
        // Simulate calendar connection
        this.state.calendar.connected = provider;
        this.state.calendar.events = this.generateMockEvents();
        this.saveToStorage();
        
        document.querySelectorAll('.connect-btn').forEach(btn => {
            btn.classList.remove('connected');
        });
        document.querySelector(`.connect-btn.${provider}`)?.classList.add('connected');
        
        this.generateDaySchedule();
        this.showToast(`Connected to ${provider} calendar`, 'success');
    },

    syncCalendar() {
        if (!this.state.calendar.connected) {
            this.showToast('Please connect a calendar first', 'info');
            return;
        }
        this.state.calendar.events = this.generateMockEvents();
        this.generateDaySchedule();
        this.showToast('Calendar synced', 'success');
    },

    generateMockEvents() {
        const today = new Date();
        return [
            { id: 1, title: 'Team Standup', start: new Date(today.setHours(9, 0)), end: new Date(today.setHours(9, 30)) },
            { id: 2, title: 'Project Review', start: new Date(today.setHours(11, 0)), end: new Date(today.setHours(12, 0)) },
            { id: 3, title: 'Lunch Break', start: new Date(today.setHours(12, 30)), end: new Date(today.setHours(13, 30)) },
            { id: 4, title: 'Deep Work Block', start: new Date(today.setHours(14, 0)), end: new Date(today.setHours(16, 0)) },
            { id: 5, title: 'Weekly Sync', start: new Date(today.setHours(16, 30)), end: new Date(today.setHours(17, 0)) }
        ];
    },

    generateMiniCalendar() {
        const container = document.getElementById('miniCalendar');
        if (!container) return;
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        let html = `
            <div class="mini-calendar-header">
                <span>${monthNames[month]} ${year}</span>
                <div class="mini-calendar-nav">
                    <button onclick="FocusQuest.changeMonth(-1)">‹</button>
                    <button onclick="FocusQuest.changeMonth(1)">›</button>
                </div>
            </div>
            <div class="mini-calendar-grid">
                <div class="mini-calendar-day">Su</div>
                <div class="mini-calendar-day">Mo</div>
                <div class="mini-calendar-day">Tu</div>
                <div class="mini-calendar-day">We</div>
                <div class="mini-calendar-day">Th</div>
                <div class="mini-calendar-day">Fr</div>
                <div class="mini-calendar-day">Sa</div>
        `;
        
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="mini-calendar-date other-month"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && month === today.getMonth();
            html += `<div class="mini-calendar-date ${isToday ? 'today' : ''}">${day}</div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    generateDaySchedule() {
        const container = document.getElementById('daySchedule');
        if (!container) return;
        
        let html = '';
        for (let hour = 6; hour <= 22; hour++) {
            const timeStr = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
            const events = this.state.calendar.events.filter(e => {
                const eventHour = new Date(e.start).getHours();
                return eventHour === hour;
            });
            
            html += `
                <div class="schedule-hour">
                    <div class="schedule-time">${timeStr}</div>
                    <div class="schedule-content">
                        ${events.map(e => `<div class="schedule-event">${this.escapeHtml(e.title)}</div>`).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    changeMonth(delta) {
        // Simplified - would need state management for full implementation
        this.generateMiniCalendar();
    },

    // AI Features
    openAIChat() {
        document.getElementById('aiChatModal').classList.add('active');
    },

    closeAIChat() {
        document.getElementById('aiChatModal').classList.remove('active');
    },

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        const chatMessages = document.getElementById('chatMessages');
        
        // Add user message
        chatMessages.innerHTML += `<div class="chat-message user"><p>${this.escapeHtml(message)}</p></div>`;
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Generate response
        const response = await this.generateAIResponse(message);
        
        chatMessages.innerHTML += `<div class="chat-message assistant"><p>${response}</p></div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    async generateAIResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        // Simple intent detection
        if (lowerMsg.includes('add task') || lowerMsg.includes('create task')) {
            const taskText = message.replace(/add task|create task/gi, '').trim();
            if (taskText) {
                this.state.tasks.push({
                    id: Date.now(),
                    text: taskText,
                    status: 'todo',
                    priority: 'medium',
                    category: this.state.currentMode === 'work' ? 'work' : 'personal',
                    createdAt: new Date().toISOString()
                });
                this.saveToStorage();
                this.renderAll();
                return `I've added "${taskText}" to your task list. Anything else you'd like me to help with?`;
            }
            return 'What task would you like me to add? Just tell me what needs to be done.';
        }
        
        if (lowerMsg.includes('how many tasks') || lowerMsg.includes('task count')) {
            const todo = this.state.tasks.filter(t => t.status === 'todo').length;
            const inProgress = this.state.tasks.filter(t => t.status === 'inprogress').length;
            const done = this.state.tasks.filter(t => t.status === 'done').length;
            return `You have ${todo} tasks to do, ${inProgress} in progress, and ${done} completed. Would you like me to help prioritize your tasks?`;
        }
        
        if (lowerMsg.includes('suggest') || lowerMsg.includes('prioritize') || lowerMsg.includes('what should')) {
            const highPriority = this.state.tasks.filter(t => t.status !== 'done' && t.priority === 'high');
            if (highPriority.length > 0) {
                return `I'd suggest focusing on "${highPriority[0].text}" first since it's marked as high priority. Would you like me to start a focus session for this task?`;
            }
            const todo = this.state.tasks.filter(t => t.status === 'todo');
            if (todo.length > 0) {
                return `Based on your task list, I'd recommend starting with "${todo[0].text}". Ready to begin?`;
            }
            return 'Great news - you don\'t have any pending tasks! Would you like to add a new task or create a quest?';
        }
        
        if (lowerMsg.includes('focus') || lowerMsg.includes('timer')) {
            return 'I can help you start a focus session. Would you like me to set up a 25-minute Pomodoro session? Just say "start focus" or head to the Focus Mode section.';
        }
        
        if (lowerMsg.includes('start focus')) {
            this.showSection('focus');
            return 'I\'ve opened the Focus Mode for you. Select a task and click "Start Focus Session" when you\'re ready!';
        }
        
        // Default response
        const responses = [
            'I can help you manage tasks, start focus sessions, or provide productivity insights. What would you like to do?',
            'Try asking me to "add task [description]", "suggest next task", or "start focus session".',
            'I\'m here to help boost your productivity! You can ask about your tasks, start a focus session, or get prioritization suggestions.'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    async getAIPrioritySuggestion() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();
        
        if (!taskText) {
            this.showToast('Enter a task description first', 'info');
            return;
        }
        
        // Simple priority suggestion logic
        const highKeywords = ['urgent', 'asap', 'important', 'critical', 'deadline', 'today'];
        const lowKeywords = ['maybe', 'someday', 'eventually', 'when possible', 'nice to have'];
        
        const lowerText = taskText.toLowerCase();
        
        let suggestedPriority = 'medium';
        if (highKeywords.some(kw => lowerText.includes(kw))) {
            suggestedPriority = 'high';
        } else if (lowKeywords.some(kw => lowerText.includes(kw))) {
            suggestedPriority = 'low';
        }
        
        document.getElementById('taskPriority').value = suggestedPriority;
        this.showToast(`AI suggests ${suggestedPriority} priority`, 'info');
    },

    async generateTaskInsight(task) {
        // Simple insight generation
        const insights = [
            'Great job completing this task! Consider blocking similar tasks together in the future for better efficiency.',
            'Task completed! You\'re making excellent progress toward your goals.',
            'Well done! Remember to take a short break to maintain your focus.',
            'Fantastic work! This completion brings you closer to your quest objectives.',
            'Task finished! Consider reflecting on what went well and what could be improved.'
        ];
        
        task.aiInsight = insights[Math.floor(Math.random() * insights.length)];
        this.saveToStorage();
    },

    // Transition Screen
    showTransition(completedTask) {
        const screen = document.getElementById('transitionScreen');
        const title = document.getElementById('transitionTitle');
        const message = document.getElementById('transitionMessage');
        const insight = document.getElementById('transitionInsight');
        const next = document.getElementById('transitionNext');
        
        title.textContent = 'Task Complete!';
        message.textContent = `"${completedTask.text}" has been marked as done.`;
        
        if (completedTask.aiInsight) {
            insight.innerHTML = `<strong>💡 Insight:</strong> ${completedTask.aiInsight}`;
            insight.style.display = 'block';
        } else {
            insight.style.display = 'none';
        }
        
        // Find next task
        const nextTask = this.state.tasks.find(t => t.status === 'todo' && t.priority === 'high') ||
                        this.state.tasks.find(t => t.status === 'todo');
        
        if (nextTask) {
            next.innerHTML = `<strong>📋 Next up:</strong> ${this.escapeHtml(nextTask.text)}`;
            next.style.display = 'block';
        } else {
            next.style.display = 'none';
        }
        
        screen.classList.add('active');
    },

    closeTransition() {
        document.getElementById('transitionScreen').classList.remove('active');
    },

    // Daily Quote
    loadDailyQuote() {
        const quotes = [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
            { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
            { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
            { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
            { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "Your mind is for having ideas, not holding them.", author: "David Allen" }
        ];
        
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const quote = quotes[dayOfYear % quotes.length];
        
        document.getElementById('daily-quote').textContent = `"${quote.text}"`;
        document.getElementById('quote-author').textContent = `— ${quote.author}`;
    },

    // Search
    handleSearch(query) {
        if (!query.trim()) return;
        
        const results = this.state.tasks.filter(t => 
            t.text.toLowerCase().includes(query.toLowerCase())
        );
        
        if (results.length > 0) {
            this.showSection('tasks');
            // Highlight or filter to show results
        }
    },

    // Settings
    saveProfile() {
        this.state.settings.name = document.getElementById('settingName').value;
        this.state.settings.email = document.getElementById('settingEmail').value;
        this.saveToStorage();
        this.updateGreeting();
        this.showToast('Profile saved', 'success');
    },

    saveAISettings() {
        this.state.settings.apiKey = document.getElementById('settingApiKey').value;
        this.state.settings.aiSuggestions = document.getElementById('settingAISuggestions').checked;
        this.state.settings.insights = document.getElementById('settingInsights').checked;
        this.saveToStorage();
        this.showToast('AI settings saved', 'success');
    },

    // Data Management
    exportData() {
        const data = JSON.stringify(this.state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusquest-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Data exported', 'success');
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.state = { ...this.state, ...data };
                    this.saveToStorage();
                    this.renderAll();
                    this.showToast('Data imported successfully', 'success');
                } catch (err) {
                    this.showToast('Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('focusquest_data');
            window.location.reload();
        }
    },

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Drag and drop for Kanban
document.addEventListener('DOMContentLoaded', () => {
    FocusQuest.init();
    
    // Setup drag and drop
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });
        
        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });
        
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatus = column.dataset.status === 'inprogress' ? 'inprogress' : column.dataset.status;
            
            FocusQuest.updateTaskStatus(taskId, newStatus);
        });
    });
});

// Make FocusQuest globally accessible
window.FocusQuest = FocusQuest;
