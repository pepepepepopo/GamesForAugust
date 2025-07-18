import { Vector2 } from './vector2.js';
import { Block } from './block.js';
import { Pickaxe } from './pickaxe.js';
import { AssetLoader } from './assets.js';
import { Shop } from './shop.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { GameState } from './game-state.js';
import { MusicPlayer } from './music-player.js';
import { Camera } from './camera.js';
import { EffectsManager } from './effects.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.backgroundCanvas = document.getElementById('backgroundCanvas');
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        
        this.gameOver = false;
        
        // Audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sfxGainNode = this.audioContext.createGain();
        this.sfxGainNode.connect(this.audioContext.destination);

        // Auto-save timer
        this.autoSaveTimer = 0;
        this.autoSaveInterval = 30; // Auto-save every 30 seconds

        // Add global error handlers
        this.setupErrorHandlers();

        // Set canvas to fullscreen before initializing modules that might need canvas dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundCanvas.width = window.innerWidth;
        this.backgroundCanvas.height = window.innerHeight;
        
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.blocks = [];
        this.isLoading = true;
        
        // Core Modules - Initialized in dependency order
        this.state = new GameState();
        this.assetLoader = new AssetLoader(this.audioContext);
        this.world = new World(this);
        this.pickaxe = new Pickaxe(380, 50, this); 
        this.ui = new UI(this);
        this.shop = new Shop(this);
        this.musicPlayer = new MusicPlayer();
        this.camera = new Camera();
        this.effects = new EffectsManager(this);
        
        // Stats popup elements
        this.statsPopup = document.getElementById('stats-popup');
        this.statsCloseButton = document.getElementById('stats-close-button');
        
        // Settings popup elements
        this.settingsPopup = document.getElementById('settings-popup');
        this.settingsCloseButton = document.getElementById('settings-close-button');
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.languageSelect = document.getElementById('language-select');
        this.resetProgressButton = document.getElementById('reset-progress-button');
        
        // Set up resize listener and perform initial resize
        this.resizeCanvas(); // Now that all modules are initialized, do an initial resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize game systems
        this.initializeGameSystems();
        
        // Game loop timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1 / 144; // Target 144 updates per second
        this.maxAccumulatedTime = 0.1; // Prevent spiral of death

        this.init().catch(error => {
            console.error("Initialization failed:", error);
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = 'Error during initialization. Please refresh.';
            }
        });
    }

    initializeGameSystems() {
        // Pickaxe power-ups
        this.pickaxeSizeBuff = {
            active: false,
            timer: 0,
            duration: 5, // 5 seconds
            originalSize: { width: this.pickaxe.width, height: this.pickaxe.height }
        };
    }

    triggerAbility(abilityType, position) {
        if (abilityType === 'blaze_aura') {
            const aura = {
                type: 'blaze_aura',
                x: position.x,
                y: position.y,
                life: 1.0, // seconds
                duration: 1.0,
                radius: 0,
                maxRadius: 100, // Insta-break radius
            };
            this.effects.activeAbilities.push(aura);

            // Insta-break blocks within the radius
            const blocksToBreak = this.world.getNearbyBlocks(aura.x - aura.maxRadius, aura.y - aura.maxRadius, aura.maxRadius * 2, aura.maxRadius * 2).filter(block => {
                if (block.destroyed) return false;
                const blockCenterX = block.x + block.width / 2;
                const blockCenterY = block.y + block.height / 2;
                const distance = Math.sqrt(Math.pow(blockCenterX - aura.x, 2) + Math.pow(blockCenterY - aura.y, 2));
                return distance < aura.maxRadius && block.blockType !== 'bedrock';
            });

            blocksToBreak.forEach(block => {
                if (block.destroyed) return;
                block.health = 0; // Directly destroy
                block.destroyed = true;
                this.handleBlockDestruction(block, true); // Pass 'true' for fromAbility
            });

        } else if (abilityType === 'lava_particles') {
            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                this.effects.lavaParticles.push({
                    x: position.x + (Math.random() - 0.5) * 20,
                    y: position.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 5,
                    life: 2.0, // seconds
                });
            }
        } else if (abilityType === 'blaze_rod_rain') {
            const rodCount = 5;
            const spawnWidth = this.world.gridWidth * this.world.blockSize;
            for (let i = 0; i < rodCount; i++) {
                this.world.blazeRods.push({
                    x: this.world.fixedStartX + (Math.random() * spawnWidth),
                    y: position.y - 200 - (Math.random() * 200),
                    vx: (Math.random() - 0.5) * 2,
                    vy: 5 + Math.random() * 3,
                    rotation: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.1,
                    bounces: 0,
                    maxBounces: 2,
                    width: 40,
                    height: 40,
                });
            }
        } else if (abilityType === 'bouncy_ball') {
            const ballCount = 1;
            for (let i = 0; i < ballCount; i++) {
                this.world.bouncyBalls.push({
                    x: position.x - 30, // center it
                    y: position.y - 30,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -8 - Math.random() * 4,
                    rotation: 0,
                    angularVelocity: (Math.random() - 0.5) * 0.2,
                    bounces: 0,
                    maxBounces: 8, // a few less bounces, but more impactful
                    width: 60,
                    height: 60,
                    damage: 2,
                    aoeDamage: 1, // new property for area damage
                });
                this.playSound(this.assetLoader.getAudioAsset('bouncyBallSpawn'), 1.0 + (Math.random() - 0.5) * 0.2);
            }
        }
    }

    setupErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault(); // Prevent the default behavior
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundCanvas.width = window.innerWidth;
        this.backgroundCanvas.height = window.innerHeight;
        
        // Disable image smoothing for pixel art after resize
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Recenter the world grid
        if (this.world) {
            this.world.recenterBlocks(this.canvas.width);
        }
        
        // Re-draw the static background on resize
        if (this.ui) {
            this.ui.drawBackground(this.backgroundCtx);
            this.shop.ui.backgroundCache = null;
            this.shop.ui.summerBackgroundCache = null;
        }
        
        // Update pickaxe sway range but NOT its direct position if it hasn't been dropped.
        // This prevents the pickaxe from snapping to a new centered position on resize.
        const centerX = this.canvas.width / 2;
        const swayWidth = Math.min(300, this.canvas.width * 0.4); // e.g., 40% of screen, max 300px
        const minSwayX = centerX - this.pickaxe.width / 2 - swayWidth / 2;
        const maxSwayX = centerX - this.pickaxe.width / 2 + swayWidth / 2;
        this.pickaxe.setSwayRange(minSwayX, maxSwayX);

        // Add debug key listener here, so it's only added once.
        document.addEventListener('keydown', (e) => {
             if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { // Support Ctrl+D and Cmd+D
                e.preventDefault();
                const debugInfo = document.getElementById('debug-info');
                if (debugInfo) {
                    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
                }
            }
        }, { once: true }); // Use once to avoid multiple listeners
    }

    async init() {
        this.setupLoadingProgress();
        
        try {
            await this.assetLoader.loadAssets();
            this.pickaxe.loadPickaxeImages();
            this.ui.drawBackground(this.backgroundCtx); // Pre-draw the background
            this.applySettings();
            this.hideLoadingAndStartGame();
        } catch (error) {
            console.error('Failed to load assets:', error);
            // Show error message to user
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = 'Failed to load game assets. Please refresh.';
            }
        }
    }

    setupLoadingProgress() {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingProgress && loadingText) {
            this.assetLoader.onProgress = (loaded, total) => {
                const percentage = Math.floor((loaded / total) * 100);
                loadingProgress.style.width = percentage + '%';
                loadingText.textContent = `Loading assets... ${percentage}%`;
            };
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    hideLoadingAndStartGame() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
        this.isLoading = false;

        // Try to resume audio context. This may not work in all browsers without a direct user click.
        // A click on the game canvas later will resume it.
        if (this.audioContext.state === 'suspended') {
             this.audioContext.resume().then(() => {
                this.musicPlayer.play();
             }).catch(e => console.warn("AudioContext resume failed, will retry on next user interaction."));
        } else {
            this.musicPlayer.play();
        }
        
        // Start the game loop with a stable time reference
        this.lastTime = performance.now(); 

        this.syncPickaxeWithState();
        this.world.initializeBlocks();
        this.setupEventListeners();
        this.gameLoop();
    }

    updateCamera() {
        this.camera.update(this.pickaxe, this.canvas);
    }

    setupEventListeners() {
        // Use a single pointerdown event for unified click/touch handling
        this.canvas.addEventListener('pointerdown', (e) => {
            // Resume audio context on any user interaction to enable sounds
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Handle shop clicks first
            if (this.shop.showShop) {
                e.preventDefault();
                this.shop.handleClick(clickX, clickY);
                return;
            }

            if (this.gameOver) {
                this.reset();
                return;
            }
            
            // Check if clicking shop button - adjust for mobile
            const isNarrow = this.canvas.width < 450;
            const buttonWidth = isNarrow ? 50 : 70;
            const buttonHeight = isNarrow ? 24 : 30;
            
            if (clickX >= this.canvas.width - (buttonWidth + 10) && clickX <= this.canvas.width - 10 &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.shop.show();
                return;
            }

            // Check if clicking settings button
            const settingsButtonX = this.canvas.width - (buttonWidth * 2 + 25);
            if (clickX >= settingsButtonX && clickX <= settingsButtonX + buttonWidth &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.showSettings();
                return;
            }

            // Check if clicking stats button - adjust for mobile
            const statsButtonX = this.canvas.width - (buttonWidth * 3 + 40);
            if (clickX >= statsButtonX && clickX <= statsButtonX + buttonWidth &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.showStats();
                return;
            }
            
            // Check if clicking summer event button
            const summerButtonRect = this.ui.getSummerEventButtonRect();
            if (summerButtonRect && clickX >= summerButtonRect.x && clickX <= summerButtonRect.x + summerButtonRect.width &&
                clickY >= summerButtonRect.y && clickY <= summerButtonRect.y + summerButtonRect.height) {
                this.toggleSummerEvent();
                return;
            }
            
            if (!this.pickaxe.isDropped) {
                const pickaxeScreenX = this.pickaxe.x - this.camera.x;
                const pickaxeScreenY = this.pickaxe.y - this.camera.y;
                
                if (clickX >= pickaxeScreenX && clickX <= pickaxeScreenX + this.pickaxe.width &&
                    clickY >= pickaxeScreenY && clickY <= pickaxeScreenY + this.pickaxe.height) {
                    this.pickaxe.nextVariant();
                } else {
                    this.pickaxe.drop();
                }
            } else if (Math.abs(this.pickaxe.velocity.x) < 0.1 && 
                      Math.abs(this.pickaxe.velocity.y) < 0.1) {
                this.reset();
            }
        });

        // Add separate pointer events for shop scrolling
        let touchStartY = 0;
        let isDragging = false;
        
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.shop.showShop) {
                isDragging = true;
                touchStartY = e.clientY;
                // Capture pointer to ensure pointermove/up events are received
                this.canvas.setPointerCapture(e.pointerId);
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.shop.showShop && isDragging) {
                e.preventDefault();
                const touchY = e.clientY;
                const deltaY = touchStartY - touchY;
                this.shop.handleTouchScroll(deltaY);
                touchStartY = touchY;
            }
        });
        
        const stopDrag = (e) => {
            if (this.shop.showShop && isDragging) {
                isDragging = false;
                this.canvas.releasePointerCapture(e.pointerId);
                e.preventDefault();
            }
        };

        this.canvas.addEventListener('pointerup', stopDrag);
        this.canvas.addEventListener('pointercancel', stopDrag);

        // Stats popup listener
        this.statsCloseButton.addEventListener('click', () => this.hideStats());

        // Settings popup listeners
        this.settingsCloseButton.addEventListener('click', () => this.hideSettings());
        this.musicVolumeSlider.addEventListener('input', (e) => this.updateMusicVolume(e.target.value));
        this.sfxVolumeSlider.addEventListener('input', (e) => this.updateSfxVolume(e.target.value));
        this.resetProgressButton.addEventListener('click', () => {
             if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
                this.resetProgress();
            }
        });

        // Add mouse wheel listener for shop scrolling on desktop
        this.canvas.addEventListener('wheel', (e) => {
            if (this.shop.showShop) {
                e.preventDefault();
                this.shop.handleScroll(e.deltaY);
            }
        });
    }

    toggleSummerEvent() {
        this.state.summerEventActive = !this.state.summerEventActive;
        this.state.saveAllState(); // Save all state when toggling summer event
        
        // Reset the world to apply the new block generation rules.
        this.reset();
    }

    resetProgress() {
        this.state.resetProgress();
        this.syncPickaxeWithState();
        this.pickaxe.reset(this.canvas.width / 2 - this.pickaxe.width / 2, 50);
        this.shop.hide();
        this.state.saveAllState(); // Save all state after progress reset
    }

    reset() {
        if (!this.gameOver) { // Only count if a pickaxe actually breaks
            this.state.stats.pickaxesBroken++;
            this.state.saveStats();
        }

        this.gameOver = false;
        this.pickaxe.reset(this.canvas.width / 2 - this.pickaxe.width / 2, 50);
        this.camera = new Camera();
        this.world.initializeBlocks();
        this.world.generationQueue = []; // Clear generation queue on reset
        this.effects.activeAbilities = [];
        this.effects.lavaParticles = [];
        this.accumulator = 0;
    }

    update(dt) {
        if (this.gameOver) return;
        
        // Auto-save timer
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.state.saveAllState();
            this.autoSaveTimer = 0;
        }
        
        this.pickaxe.update(dt);

        if (this.pickaxe.isDropped) {
            // Update deepest depth stat
            const currentDepth = Math.max(0, Math.floor((this.pickaxe.y - 300) / this.world.blockSize));
            if (currentDepth > this.state.stats.deepestDepth) {
                this.state.stats.deepestDepth = currentDepth;
            }
        }
        
        this.updateCamera();
        this.world.generateMoreBlocks();
        this.world.update(dt);
        this.effects.update(dt);
        this.updateBuffs(dt);
    }

    updateBuffs(dt) {
        if (this.pickaxeSizeBuff.active) {
            this.pickaxeSizeBuff.timer -= dt;
            if (this.pickaxeSizeBuff.timer <= 0) {
                // Buff expired, reset pickaxe size
                this.pickaxeSizeBuff.active = false;
                this.pickaxe.width = this.pickaxeSizeBuff.originalSize.width;
                this.pickaxe.height = this.pickaxeSizeBuff.originalSize.height;
            }
        }
    }

    createImpactSparkles(x, y) {
        this.effects.createImpactSparkles(x, y);
    }

    handleBlockHit(block) {
        const wasAlive = !block.destroyed;
        const pickaxeVariant = this.pickaxe.getCurrentVariant();
        
        // Always apply damage on hit
        const efficiencyBonus = this.state.enchantmentLevels.efficiency * 0.5;
        const totalPower = pickaxeVariant.power + efficiencyBonus;
        block.takeDamage(totalPower);
        
        // Create damage indicator
        if (!block.destroyed && wasAlive) {
            this.createDamageIndicator(block.x + block.width / 2, block.y + block.height / 4, `-${totalPower.toFixed(1)}`);
        }
        
        // If the block was just destroyed
        this.handleBlockDestruction(block);

        // Create impact sparkles on hit
        this.createImpactSparkles(this.pickaxe.x + this.pickaxe.width / 2, this.pickaxe.y + this.pickaxe.height / 2);
        
        if (wasAlive && !block.destroyed) {
            // Block was hit but not destroyed, play a 'hit' sound with a higher pitch
            const hitPitch = 1.5 + (Math.random() - 0.5) * 0.4;
            this.playSound(this.assetLoader.getAudioAsset('blockBreak'), hitPitch);
        }
    }

    createDamageIndicator(x, y, text) {
        this.effects.damageIndicators = this.effects.damageIndicators || [];
        this.effects.damageIndicators.push({
            x: x,
            y: y,
            text: text,
            life: 1.5,
            vy: -50,
            alpha: 1.0
        });
    }

    handleBlockDestruction(block, fromAbility = false) {
        if (!block.destroyed) return;

        // Remove block from spatial grid
        this.world.removeBlockFromGrid(block);

        // Award resources and update stats
        this.state.stats.totalBlocksBroken = (this.state.stats.totalBlocksBroken || 0) + 1;
        this.state.stats.blocksBrokenByType = this.state.stats.blocksBrokenByType || {};
        this.state.stats.blocksBrokenByType[block.blockType] = (this.state.stats.blocksBrokenByType[block.blockType] || 0) + 1;

        // Award resources based on block type
        const baseResource = this.getResourceFromBlockType(block.blockType);
        if (baseResource) {
            let amount = 1;
            
            // Apply fortune enchantment
            const fortuneLevel = this.state.enchantmentLevels.fortune;
            if (fortuneLevel > 0 && Math.random() < 0.3 * fortuneLevel) {
                amount += Math.floor(Math.random() * fortuneLevel) + 1;
            }

            this.state.resources[baseResource] = (this.state.resources[baseResource] || 0) + amount;
            this.state.stats.resourcesCollected = this.state.stats.resourcesCollected || {};
            this.state.stats.resourcesCollected[baseResource] = (this.state.stats.resourcesCollected[baseResource] || 0) + amount;
        }

        // Handle experience bottle
        if (block.hasExperienceBottle) {
            this.effects.collectibleEffects.push({
                type: 'experience_bottle',
                x: block.x + block.width / 2,
                y: block.y + block.height / 2,
                vy: -2,
                life: 1.0,
                duration: 1.0
            });
        }

        // Play break sound
        if (!fromAbility) {
            this.playSound(this.assetLoader.getAudioAsset('blockBreak'), 1.0 + (Math.random() - 0.5) * 0.2);
        }

        // Damage pickaxe if it's not from an ability
        if (!fromAbility) {
            const unbreakingLevel = this.state.enchantmentLevels.unbreaking;
            const damageChance = 1 / (unbreakingLevel + 1);
            if (Math.random() < damageChance) {
                this.pickaxe.takeDamage(1);
                if (this.pickaxe.isBroken) {
                    this.gameOver = true;
                }
            }
        }

        // Save stats periodically
        if (Math.random() < 0.1) { // 10% chance to save on each block break
            this.state.saveStats();
        }
    }

    getResourceFromBlockType(blockType) {
        const resourceMap = {
            'stone': 'stone',
            'andesite': 'stone',
            'diorite': 'stone',
            'granite': 'stone',
            'deepslate': 'stone',
            'coal_ore': 'coal',
            'deepslate_coal_ore': 'coal',
            'copper_ore': 'copper',
            'deepslate_copper_ore': 'copper',
            'iron_ore': 'iron',
            'deepslate_iron_ore': 'iron',
            'gold_ore': 'gold',
            'deepslate_gold_ore': 'gold',
            'redstone_ore': 'redstone',
            'deepslate_redstone_ore': 'redstone',
            'diamond_ore': 'diamond',
            'deepslate_diamond_ore': 'diamond',
            'lapis_ore': 'lapis',
            'deepslate_lapis_ore': 'lapis',
            'emerald_ore': 'emerald',
            'deepslate_emerald_ore': 'emerald',
            'obsidian': 'obsidian',
            'sand': 'sand',
            'sandstone': 'sandstone'
        };
        return resourceMap[blockType] || null;
    }

    playSound(audioBuffer, playbackRate = 1.0) {
        if (!audioBuffer || !this.audioContext) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = playbackRate;
            source.connect(this.sfxGainNode);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    createEnchantmentSparkles() {
        this.effects.createEnchantmentSparkles();
    }

    buyEnchantment(type) {
        const success = this.resourceManager.buyEnchantment(type);
        if (success) {
            this.createEnchantmentSparkles();
            // Show success message
            this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} enchantment upgraded!`, '#d85dff');
            console.log(`Bought ${type} enchantment`);
        }
        return success;
    }

    showNotification(message, color = '#4CAF50') {
        this.effects.notifications = this.effects.notifications || [];
        this.effects.notifications.push({
            message: message,
            color: color,
            life: 3.0,
            y: 100,
            alpha: 1.0
        });
    }

    draw() {
        this.ui.draw(this.ctx);
    }

    gameLoop(timestamp) {
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }
        // Use performance.now() for a more reliable time source
        const currentTime = performance.now();
        const dt = (currentTime - this.lastTime) / 1000; // delta time in seconds
        this.lastTime = currentTime;

        // Update playtime stat
        this.state.stats.playTime = (this.state.stats.playTime || 0) + dt;

        if (this.isLoading) {
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // Prevent large DT spikes (e.g., from tab switching)
        this.accumulator += Math.min(dt, this.maxAccumulatedTime);

        // Run a fixed number of updates to prevent the loop from getting stuck
        let updates = 0;
        while (this.accumulator >= this.fixedDeltaTime && updates < 5) {
            this.update(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
            updates++;
        }
        
        // If the accumulator is still too high, just reset it to avoid "spiral of death"
        if (this.accumulator > this.maxAccumulatedTime) {
            this.accumulator = 0;
        }

        this.draw();

        // Debug info
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo.style.display !== 'none') {
            const fps = (1 / dt).toFixed(1);
            debugInfo.textContent = `FPS: ${fps} | Blocks: ${this.blocks.length} | Particles: ${this.effects.lavaParticles.length} | Rods: ${this.world.blazeRods.length} | Balls: ${this.world.bouncyBalls.length} | Sparkles: ${this.effects.impactSparkles.length}`;
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    syncPickaxeWithState() {
        let variantIndex = this.state.currentPickaxeVariant;
        if (variantIndex >= 0 && variantIndex < this.pickaxe.variants.length) {
            const variantName = this.pickaxe.variants[variantIndex].name;
            if (this.state.pickaxePrices[variantName] && this.state.pickaxePrices[variantName].unlocked) {
                this.pickaxe.currentVariant = variantIndex;
            } else {
                this.pickaxe.currentVariant = 0; // Default to wooden if not unlocked
                this.state.currentPickaxeVariant = 0;
                this.state.saveCurrentPickaxeVariant();
            }
        } else {
             this.pickaxe.currentVariant = 0; // Default to wooden if not unlocked
             this.state.currentPickaxeVariant = 0;
             this.state.saveCurrentPickaxeVariant();
        }
        this.pickaxe.updateProperties();
    }

    showStats() {
        this.updateStatsDisplay();
        this.statsPopup.style.display = 'flex';
    }

    hideStats() {
        this.statsPopup.style.display = 'none';
    }

    updateStatsDisplay() {
        const stats = this.state.stats;
        const grid = document.getElementById('stats-grid');
        grid.innerHTML = '';

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [
                h > 0 ? `${h}h` : '',
                m > 0 ? `${m}m` : '',
                `${s}s`
            ].filter(Boolean).join(' ');
        };

        const statsToShow = [
            { label: 'Total Blocks Broken', value: stats.totalBlocksBroken || 0 },
            { label: 'Deepest Depth Reached', value: `${stats.deepestDepth || 0} blocks` },
            { label: 'Total Play Time', value: formatTime(stats.playTime || 0) },
            { label: 'Total Money Earned', value: `${stats.moneyEarned || 0} coins` },
            { label: 'Pickaxes Broken', value: stats.pickaxesBroken || 0 }
        ];

        statsToShow.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `<span class="stat-label">${stat.label}</span><span class="stat-value">${stat.value}</span>`;
            grid.appendChild(statItem);
        });
    }

    showSettings() {
        this.settingsPopup.style.display = 'flex';
    }

    hideSettings() {
        this.settingsPopup.style.display = 'none';
        this.state.saveSettings();
    }

    applySettings() {
        this.musicVolumeSlider.value = this.state.settings.musicVolume;
        this.updateMusicVolume(this.state.settings.musicVolume);

        this.sfxVolumeSlider.value = this.state.settings.sfxVolume;
        this.updateSfxVolume(this.state.settings.sfxVolume);

        this.languageSelect.value = this.state.settings.language;
    }
    
    updateMusicVolume(value) {
        this.state.settings.musicVolume = value;
        if (this.musicPlayer && this.musicPlayer.audioElement) {
            this.musicPlayer.audioElement.volume = value;
        }
    }

    updateSfxVolume(value) {
        this.state.settings.sfxVolume = value;
        this.sfxGainNode.gain.value = value;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});