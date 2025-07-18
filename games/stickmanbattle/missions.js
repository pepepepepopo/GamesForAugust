import { gameState } from './game-state.js';
import { MISSIONS } from './config.js';
import { updateUICoins } from './ui.js';
import { playSound } from './audio.js';

export class MissionManager {
    constructor() {
        this.activeMissions = new Set();
        this.completedMissions = new Set();
        this.missionProgress = new Map();
        this.lastMissionGenerationTime = 0;
        this.missionCooldownDuration = 60000; // 1 minute in milliseconds
        this.missionBaselines = new Map(); // Track baselines for each active mission
        this.stats = {
            enemiesKilled: 0,
            stickmenSpawned: 0,
            roundsSurvived: 0,
            snipersOwned: 0,
            rocketLaunchersOwned: 0,
            machinesPlaced: 0,
            gorillasDefeated: 0
        };
        
        this.loadFromLocalStorage();
        this.generateRandomMissions();
        
        // Initialize UI after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.updateMissionUI();
        }, 100);
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('missionData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.stats = { 
                    enemiesKilled: 0,
                    stickmenSpawned: 0,
                    roundsSurvived: 0,
                    snipersOwned: 0,
                    rocketLaunchersOwned: 0,
                    machinesPlaced: 0,
                    gorillasDefeated: 0,
                    ...data.stats 
                };
                this.completedMissions = new Set(data.completedMissions || []);
                this.lastMissionGenerationTime = data.lastMissionGenerationTime || 0;
            } catch (e) {
                console.error('Error loading mission data:', e);
            }
        }
    }

    saveToLocalStorage() {
        const data = {
            stats: this.stats,
            completedMissions: Array.from(this.completedMissions),
            lastMissionGenerationTime: this.lastMissionGenerationTime
        };
        localStorage.setItem('missionData', JSON.stringify(data));
    }

    canGenerateNewMissions() {
        const now = Date.now();
        return this.activeMissions.size === 0 && (now - this.lastMissionGenerationTime >= this.missionCooldownDuration);
    }

    generateRandomMissions() {
        // Check if we can generate new missions
        if (this.activeMissions.size > 0) {
            console.log('Cannot generate missions: already have active missions');
            return;
        }

        const now = Date.now();
        if (now - this.lastMissionGenerationTime < this.missionCooldownDuration) {
            const remainingTime = Math.ceil((this.missionCooldownDuration - (now - this.lastMissionGenerationTime)) / 1000);
            console.log(`Cannot generate missions: ${remainingTime} seconds remaining in cooldown`);
            return;
        }

        const availableMissions = Object.values(MISSIONS).filter(mission => 
            !this.completedMissions.has(mission.id) || mission.repeatable
        );
        
        // Select 3 random missions
        const shuffled = availableMissions.sort(() => 0.5 - Math.random());
        this.activeMissions = new Set(shuffled.slice(0, 3).map(m => m.id));
        this.lastMissionGenerationTime = now;
        
        // Clear old progress and set new baselines for fresh missions
        this.missionProgress.clear();
        this.missionBaselines.clear();
        
        this.activeMissions.forEach(missionId => {
            const mission = MISSIONS[missionId];
            if (!mission) return;
            
            // Set baseline to current stats value - missions start fresh
            let baseline = 0;
            switch (mission.type) {
                case 'kill':
                    baseline = this.stats.enemiesKilled;
                    break;
                case 'spawn':
                    baseline = this.stats.stickmenSpawned;
                    break;
                case 'survive':
                    baseline = this.stats.roundsSurvived;
                    break;
                case 'buy_specific':
                    baseline = mission.target === 'sniper' ? this.stats.snipersOwned : this.stats.rocketLaunchersOwned;
                    break;
                case 'place_machines':
                    baseline = this.stats.machinesPlaced;
                    break;
                case 'defeat_gorilla':
                    baseline = this.stats.gorillasDefeated;
                    break;
            }
            
            this.missionBaselines.set(missionId, baseline);
            this.missionProgress.set(missionId, 0); // Start at 0 progress
        });
        
        console.log('Generated new missions:', Array.from(this.activeMissions));
        console.log('Mission baselines:', this.missionBaselines);
        
        // Update UI immediately
        setTimeout(() => {
            this.updateMissionUI();
        }, 50);
    }

    updateProgress(type, value = 1, specific = null) {
        console.log(`Mission progress update: ${type}, value: ${value}, specific: ${specific}`);
        
        // Update stats - use proper accumulation
        switch (type) {
            case 'kill':
                this.stats.enemiesKilled += value;
                break;
            case 'spawn':
                this.stats.stickmenSpawned += value;
                break;
            case 'survive':
                this.stats.roundsSurvived = Math.max(this.stats.roundsSurvived, value);
                break;
            case 'buy_specific':
                if (specific === 'sniper') this.stats.snipersOwned += value;
                if (specific === 'rocket_launcher') this.stats.rocketLaunchersOwned += value;
                break;
            case 'place_machines':
                this.stats.machinesPlaced += value;
                break;
            case 'defeat_gorilla':
                this.stats.gorillasDefeated += value;
                break;
        }

        console.log('Updated stats:', this.stats);

        // Check active missions for completion
        const completedThisUpdate = [];
        this.activeMissions.forEach(missionId => {
            const mission = MISSIONS[missionId];
            if (!mission) return;

            const baseline = this.missionBaselines.get(missionId) || 0;
            let currentStat = 0;
            
            switch (mission.type) {
                case 'kill':
                    currentStat = this.stats.enemiesKilled;
                    break;
                case 'spawn':
                    currentStat = this.stats.stickmenSpawned;
                    break;
                case 'survive':
                    currentStat = this.stats.roundsSurvived;
                    break;
                case 'buy_specific':
                    currentStat = mission.target === 'sniper' ? this.stats.snipersOwned : this.stats.rocketLaunchersOwned;
                    break;
                case 'place_machines':
                    currentStat = this.stats.machinesPlaced;
                    break;
                case 'defeat_gorilla':
                    currentStat = this.stats.gorillasDefeated;
                    break;
            }

            // Calculate progress from baseline
            const progress = Math.max(0, currentStat - baseline);
            this.missionProgress.set(missionId, progress);

            // Check if mission is completed
            if (progress >= mission.target && !completedThisUpdate.includes(missionId)) {
                this.completeMission(missionId);
                completedThisUpdate.push(missionId);
            }
        });

        // Always update UI after progress change
        this.updateMissionUI();
        this.saveToLocalStorage();
    }

    completeMission(missionId) {
        const mission = MISSIONS[missionId];
        if (!mission) return;

        // Award coins
        gameState.playerCoins += mission.reward;
        updateUICoins();
        playSound('coin', 0.8);

        // Mark as completed
        if (!mission.repeatable) {
            this.completedMissions.add(missionId);
        }
        
        this.activeMissions.delete(missionId);
        this.missionBaselines.delete(missionId);

        // Show completion effect
        this.showMissionCompleteEffect(mission);

        // Check if all missions are completed
        if (this.activeMissions.size === 0) {
            console.log('All missions completed! Starting cooldown...');
            this.lastMissionGenerationTime = Date.now();
            // Generate new missions after cooldown
            setTimeout(() => {
                this.generateRandomMissions();
            }, this.missionCooldownDuration);
        }
    }

    showMissionCompleteEffect(mission) {
        const effect = document.createElement('div');
        effect.className = 'mission-complete-effect';
        effect.innerHTML = `
            <div class="mission-complete-title">Mission Complete!</div>
            <div class="mission-complete-name">${mission.name}</div>
            <div class="mission-complete-reward">+${mission.reward} coins</div>
        `;
        document.body.appendChild(effect);

        setTimeout(() => effect.remove(), 3000);
    }

    updateMissionUI() {
        const container = document.getElementById('missions-container');
        if (!container) {
            console.log('Missions container not found, retrying...');
            setTimeout(() => this.updateMissionUI(), 100);
            return;
        }

        container.innerHTML = '';
        
        // Check if we're in cooldown
        const now = Date.now();
        const timeSinceLastGeneration = now - this.lastMissionGenerationTime;
        
        if (this.activeMissions.size === 0 && timeSinceLastGeneration < this.missionCooldownDuration) {
            const remainingTime = Math.ceil((this.missionCooldownDuration - timeSinceLastGeneration) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            const cooldownElement = document.createElement('div');
            cooldownElement.className = 'mission-cooldown';
            cooldownElement.innerHTML = `
                <div class="mission-cooldown-text">New missions available in:</div>
                <div class="mission-cooldown-timer">${minutes}:${seconds.toString().padStart(2, '0')}</div>
            `;
            container.appendChild(cooldownElement);
            
            // Update timer every second during cooldown
            setTimeout(() => this.updateMissionUI(), 1000);
            return;
        }
        
        console.log('Updating mission UI, active missions:', this.activeMissions);
        
        this.activeMissions.forEach(missionId => {
            const mission = MISSIONS[missionId];
            if (!mission) return;

            const progress = this.missionProgress.get(missionId) || 0;
            const progressPercent = Math.min((progress / mission.target) * 100, 100);

            const missionElement = document.createElement('div');
            missionElement.className = 'mission-item';
            missionElement.innerHTML = `
                <div class="mission-header">
                    <span class="mission-name">${mission.name}</span>
                    <span class="mission-reward">+${mission.reward} coins</span>
                </div>
                <div class="mission-description">${mission.description}</div>
                <div class="mission-progress-bar">
                    <div class="mission-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="mission-progress-text">${progress}/${mission.target}</div>
            `;
            container.appendChild(missionElement);
        });
        
        console.log('Mission UI updated successfully');
    }
}

// Global mission manager instance
export const missionManager = new MissionManager();