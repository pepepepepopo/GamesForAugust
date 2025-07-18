import { gameState } from './game-state.js';
import { updateUICoins } from './ui.js';
import { playSound } from './audio.js';
import { createCoinDrop } from './animations.js';
import { missionManager } from './missions.js';

let nextMachineId = 0;

export class MoneyMachine {
    constructor(x, y) {
        this.id = `machine_${Date.now()}_${nextMachineId++}`;
        this.x = x;
        this.y = y;
        this.health = 100;
        this.maxHealth = 100;
        this.isDying = false;
        this.isRemoved = false;

        this.element = document.createElement('div');
        this.element.classList.add('money-machine');
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        // Create health bar
        const healthBarContainer = document.createElement('div');
        healthBarContainer.classList.add('health-bar-container');
        this.healthBar = document.createElement('div');
        this.healthBar.classList.add('health-bar');
        healthBarContainer.appendChild(this.healthBar);
        this.element.appendChild(healthBarContainer);

        this.updateHealthBar();
        gameState.gameWorld.appendChild(this.element);

        // Play placement sound
        playSound('buy', 0.6);
        this.createPlacementEffect();
        
        // Update mission progress for machine placement
        missionManager.updateProgress('place_machines', 1);
    }

    createPlacementEffect() {
        // Create a brief flash effect when placed
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.width = '100px';
        effect.style.height = '100px';
        effect.style.backgroundColor = 'rgba(255, 215, 0, 0.6)';
        effect.style.borderRadius = '50%';
        effect.style.animation = 'placement-flash 0.5s ease-out forwards';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '60';

        this.element.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }

    generateMoney() {
        if (this.isDying || this.health <= 0) return;

        playSound('coin', 0.7);
        
        // Create visual coin drop effect
        const machineHeight = 80;
        const coinY = this.y + machineHeight - 20;
        createCoinDrop(this.x + 40, coinY); // Offset to center of machine

        // Add coins to player
        gameState.playerCoins += 15;
        updateUICoins();

        // Create money generation effect
        this.createMoneyEffect();
    }

    createMoneyEffect() {
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = '50%';
        effect.style.top = '10px';
        effect.style.transform = 'translateX(-50%)';
        effect.style.color = '#FFD700';
        effect.style.fontSize = '24px';
        effect.style.fontWeight = 'bold';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        effect.style.animation = 'money-generation 1s ease-out forwards';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '70';
        effect.textContent = '+$15';

        this.element.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }

    takeDamage(damage) {
        if (this.isDying) return;
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();
        if (this.health === 0) {
            this.die();
        }
    }

    updateHealthBar() {
        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercentage}%`;
    }

    die() {
        if (this.isDying) return;
        this.isDying = true;

        playSound('death', 0.5);
        this.element.classList.add('dying');
        this.element.querySelector('.health-bar-container').style.display = 'none';

        // Create explosion effect for machine destruction
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.width = '120px';
        effect.style.height = '120px';
        effect.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        effect.style.borderRadius = '50%';
        effect.style.animation = 'machine-destruction 0.8s ease-out forwards';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '60';

        this.element.appendChild(effect);

        setTimeout(() => {
            this.element.remove();
            this.isRemoved = true;
        }, 1000);
    }
}

let placingMachine = false;
let machinePreview = null;

export function initMoneyMachinePlacement() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handlePlacementClick);
    document.addEventListener('keydown', handleCancelPlacement);
}

function handleMouseMove(e) {
    if (!placingMachine || !machinePreview) return;

    const gameRect = gameState.gameWorld.getBoundingClientRect();
    const x = e.clientX - gameRect.left - 40; // Center the preview
    const y = e.clientY - gameRect.top - 40;

    // Fix placement area - machines can only be placed on the floor (green area)
    const floorHeight = gameState.gameWorld.clientHeight * 0.15;
    const floorTopY = gameState.gameWorld.clientHeight - floorHeight;
    const maxY = gameState.gameWorld.clientHeight - 80; // Account for machine height

    const clampedX = Math.max(0, Math.min(x, gameState.gameWorld.clientWidth - 80));
    const clampedY = Math.max(floorTopY, Math.min(y, maxY));

    machinePreview.style.left = `${clampedX}px`;
    machinePreview.style.top = `${clampedY}px`;

    // Visual feedback for valid placement - only on floor area
    if (clampedY >= floorTopY && clampedY <= maxY) {
        machinePreview.style.borderColor = '#4CAF50';
    } else {
        machinePreview.style.borderColor = '#f44336';
    }
}

function handlePlacementClick(e) {
    if (!placingMachine || !machinePreview) return;

    e.preventDefault();
    e.stopPropagation();

    const gameRect = gameState.gameWorld.getBoundingClientRect();
    const x = e.clientX - gameRect.left - 40;
    const y = e.clientY - gameRect.top - 40;

    // Check if placement is valid - only on floor area
    const floorHeight = gameState.gameWorld.clientHeight * 0.15;
    const floorTopY = gameState.gameWorld.clientHeight - floorHeight;
    const maxY = gameState.gameWorld.clientHeight - 80;

    const clampedX = Math.max(0, Math.min(x, gameState.gameWorld.clientWidth - 80));
    const clampedY = Math.max(floorTopY, Math.min(y, maxY));

    // Always place on floor area - force valid placement
    const finalY = Math.max(floorTopY, Math.min(clampedY, maxY));
    
    // Create machine at the calculated position
    const machine = new MoneyMachine(clampedX, finalY);
    gameState.moneyMachines.push(machine);
    cancelPlacement();
}

function handleCancelPlacement(e) {
    if (e.key === 'Escape' && placingMachine) {
        cancelPlacement();
        // Refund the cost
        gameState.playerCoins += 45;
        updateUICoins();
    }
}

function cancelPlacement() {
    placingMachine = false;
    if (machinePreview) {
        machinePreview.remove();
        machinePreview = null;
    }
    document.body.style.cursor = 'default';
}

export function startMoneyMachinePlacement() {
    if (placingMachine) return;

    placingMachine = true;
    document.body.style.cursor = 'crosshair';

    // Close shop modal when entering placement mode
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) {
        shopModal.classList.add('hidden');
    }

    // Small delay to prevent immediate placement from the buy button click
    setTimeout(() => {
        // Create preview element
        machinePreview = document.createElement('div');
        machinePreview.classList.add('money-machine-preview');
        machinePreview.style.position = 'absolute';
        machinePreview.style.width = '80px';
        machinePreview.style.height = '80px';
        machinePreview.style.backgroundImage = 'url(/MoneyMachine.png)';
        machinePreview.style.backgroundSize = 'contain';
        machinePreview.style.backgroundRepeat = 'no-repeat';
        machinePreview.style.opacity = '0.5';
        machinePreview.style.border = '2px dashed #4CAF50';
        machinePreview.style.borderRadius = '10px';
        machinePreview.style.pointerEvents = 'none';
        machinePreview.style.zIndex = '100';

        gameState.gameWorld.appendChild(machinePreview);
        console.log('Money machine placement mode activated');
    }, 150); // Increased delay to prevent conflicts
}

export function generateMoneyFromMachines() {
    gameState.moneyMachines.forEach(machine => {
        if (!machine.isDying && machine.health > 0) {
            setTimeout(() => {
                machine.generateMoney();
            }, Math.random() * 2000); // Stagger the money generation
        }
    });
}