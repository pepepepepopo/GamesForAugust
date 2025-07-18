import { gameState } from './game-state.js';
import * as config from './config.js';
import { playSound } from './audio.js';
import { StickmanCombat } from './stickman-combat.js';
import { StickmanMovement } from './stickman-movement.js';
import { StickmanHealth } from './stickman-health.js';
import { StickmanTypes } from './stickman-types.js';

let nextId = 0;

export class Stickman {
    constructor(type, healthOrTypeId) {
        this.id = nextId++;
        this.type = type;
        this.isAttacking = false;
        this.isDying = false;
        this.isRemoved = false; // New flag
        this.target = null;
        this.healTarget = null;
        this.repositionTarget = null;
        this.lastAttackTime = 0;
        this.lastHealTime = 0;
        this.lastJumpTime = 0; // For gorilla jump cooldown
        this.hasJumpedOnce = false; // New flag to track if gorilla has jumped at least once
        this.isBeingHealed = false; // Flag for medics to coordinate

        this.element = document.createElement('div');
        this.element.classList.add('stickman', this.type);

        if (this.type === 'player') {
            // Check if it's a custom stickman
            if (healthOrTypeId.startsWith('custom_')) {
                this.setupCustomStickman(healthOrTypeId);
            } else {
                this.stickmanType = config.STICKMAN_TYPES[healthOrTypeId];
                this.stats = this.stickmanType.stats;
                this.maxHealth = this.stats.health;
                this.health = this.stats.health;
                this.element.classList.add(...this.stickmanType.cssClass.split(' ').filter(c => c));
                if (this.stickmanType.id === 'car' || this.stickmanType.id.startsWith('car_')) {
                    playSound('car_start', 0.2);
                }
                // Set altitude for flying units
                if (this.stickmanType.id === 'gun_plane' || this.stickmanType.id === 'bomb_plane') {
                    this.altitude = this.stats.altitude;
                    this.isFlying = true;
                }
            }
        } else { // 'enemy'
            const enemyConfig = healthOrTypeId; // This is now an object
            this.stickmanType = null; // Enemies don't have complex types like players yet
            this.stats = enemyConfig.stats;
            this.maxHealth = this.stats.health;
            this.health = this.stats.health;
            this.element.style.backgroundImage = `url('${enemyConfig.image}')`;
            if (enemyConfig.cssClass) {
                 this.element.classList.add(...enemyConfig.cssClass.split(' ').filter(c => c));
            }
            
            // Store gorilla level for scaling
            if (enemyConfig.gorillaLevel) {
                this.gorillaLevel = enemyConfig.gorillaLevel;
            }
        }
        
        const healthBarContainer = document.createElement('div');
        healthBarContainer.classList.add('health-bar-container');
        this.healthBar = document.createElement('div');
        this.healthBar.classList.add('health-bar');
        healthBarContainer.appendChild(this.healthBar);
        this.element.appendChild(healthBarContainer);
        
        const stickmanHeight = this.element.clientHeight || 70;
        const floorHeight = gameState.gameWorld.clientHeight * 0.15;
        const floorTopY = gameState.gameWorld.clientHeight - floorHeight;
        const maxSpawnY = gameState.gameWorld.clientHeight - stickmanHeight;
        
        // Set spawn position based on flying status
        if (this.isFlying) {
            this.y = floorTopY - this.altitude; // Spawn above the ground
        } else {
            this.y = floorTopY + Math.random() * (maxSpawnY - floorTopY);
        }

        if (this.type === 'player') {
            const spawnX = 50 + Math.random() * 100;
            this.x = spawnX;
        } else { // enemy
            const spawnX = gameState.gameWorld.clientWidth - 150 - Math.random() * 100;
            this.x = spawnX;
        }
        
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        
        gameState.gameWorld.appendChild(this.element);
    }

    setRepositionTarget(x, y) {
        this.repositionTarget = { x, y };
    }

    async setupCustomStickman(customId) {
        const { customStickmanManager } = await import('./custom-stickman.js');
        const customStickmen = customStickmanManager.getCustomStickmen();
        const customType = customStickmen.find(c => c.id === customId);
        
        if (customType) {
            this.stickmanType = customType;
            this.stats = customType.stats;
            this.maxHealth = this.stats.health;
            this.health = this.stats.health;
            this.element.style.backgroundImage = `url('${customType.image}')`;
            this.element.style.backgroundSize = 'contain';
            this.element.classList.add('custom-stickman');
            this.isCustom = true;
        }
    }

    async update(deltaTime) {
        if (this.isAttacking || this.isDying) return;

        // Apply game speed multiplier to deltaTime
        const { gameState } = await import('./game-state.js');
        deltaTime *= gameState.speedMultiplier;
        
        // Store speed multiplier on stickman for use in attack cooldowns
        this.speedMultiplier = gameState.speedMultiplier;

        // Handle different stickman types
        if (await StickmanTypes.updateMedic(this, deltaTime)) return;
        if (await StickmanTypes.updateCarMedic(this, deltaTime)) return;
        if (StickmanTypes.updateGunPlane(this, deltaTime)) return;
        if (StickmanTypes.updateBombPlane(this, deltaTime)) return;

        // Attack Logic (for non-medic types)
        const target = this.target;

        if (target && target.health > 0) {
            this.repositionTarget = null; // Clear reposition target if an enemy is present
            
            // Handle bomber explosion
            if (StickmanTypes.updateBomber(this, target)) return;

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= this.stats.attackRange) {
                // Attack
                if (Date.now() - this.lastAttackTime > config.BASE_STATS.attack_cooldown) {
                    this.attack(target);
                }
            } else {
                // Move towards target
                StickmanMovement.moveTowards(this, target, deltaTime);
            }
        } else if (this.repositionTarget) {
            // Repositioning Movement
            StickmanMovement.handleRepositioning(this, deltaTime);
        }
    }

    attack(target) {
        // Check for custom attack cooldown (for snipers and other long-range units)
        const baseCooldown = this.stats.attackCooldown || config.BASE_STATS.attack_cooldown;
        const effectiveCooldown = baseCooldown / (this.speedMultiplier || 1);
        if (Date.now() - this.lastAttackTime < effectiveCooldown) {
            return; // Still on cooldown
        }
        StickmanCombat.attack(this, target);
    }

    heal(target, isPostRoundHeal = false) {
        StickmanCombat.heal(this, target, isPostRoundHeal);
    }

    explode() {
        StickmanCombat.explode(this);
    }

    takeDamage(damage) {
        StickmanHealth.takeDamage(this, damage);
    }
    
    receiveHeal(amount) {
        StickmanHealth.receiveHeal(this, amount);
    }

    updateHealthBar() {
        StickmanHealth.updateHealthBar(this);
    }

    die() {
        // If this is a custom stickman, remove it from the manager
        if (this.isCustom && this.stickmanType) {
            setTimeout(async () => {
                const { customStickmanManager } = await import('./custom-stickman.js');
                customStickmanManager.removeCustomStickman(this.stickmanType.id);
            }, 100);
        }
        
        StickmanHealth.die(this);
    }
}