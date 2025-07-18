import * as config from './config.js';
import { playSound } from './audio.js';
import { createBuyCoinAnimation } from './animations.js';
import { Stickman } from './stickman.js';
import { setupShop } from './shop.js';

const startRoundBtn = document.getElementById('start-round-btn');
const speedUpBtn = document.getElementById('speed-up-btn');
const coinCountEl = document.getElementById('coin-count');
const roundDisplayEl = document.getElementById('round-display');
const roundsSurvivedCountEl = document.getElementById('rounds-survived-count');
const openShopBtn = document.getElementById('open-shop-btn');
const shopModal = document.getElementById('shop-modal');
const forfeitBtn = document.getElementById('forfeit-btn');

export async function updateUICoins() {
    const { gameState } = await import('./game-state.js');
    coinCountEl.textContent = gameState.playerCoins;
    // Update shop button states based on new coin count
    document.dispatchEvent(new CustomEvent('coinsUpdated'));
}

export async function updateRoundsSurvivedUI() {
    const { gameState } = await import('./game-state.js');
    const displayText = gameState.currentRound === gameState.legitimateRoundsSurvived ? 
        gameState.roundsSurvived : 
        `${gameState.legitimateRoundsSurvived} (${gameState.roundsSurvived})`;
    roundsSurvivedCountEl.textContent = displayText;
}

async function handleSpawnStickman(event) {
    const { gameState } = await import('./game-state.js');
    if (gameState.playerCoins >= config.STICKMAN_COST) {
        gameState.playerCoins -= config.STICKMAN_COST;
        playSound('buy', 0.4);
        createBuyCoinAnimation(event);
        updateUICoins();
        const newStickman = new Stickman('player', config.PLAYER_HEALTH);
        gameState.playerStickmen.push(newStickman);
    }
}

export function showRoundDisplay(roundNumber) {
    roundDisplayEl.textContent = `ROUND ${roundNumber}`;
    roundDisplayEl.classList.add('visible');

    setTimeout(() => {
        roundDisplayEl.classList.remove('visible');
    }, 2000); // Display for 2 seconds
}

export function showRoundSurvived(roundNumber) {
    roundSurvivedEl.textContent = `ROUND ${roundNumber} SURVIVED!`;
    roundSurvivedEl.classList.add('visible');

    setTimeout(() => {
        roundSurvivedEl.classList.remove('visible');
    }, 2500); // Display for 2.5 seconds
}

export function setupUI(startRoundCallback, forfeitCallback) {
    setupShop(); // Initialize the shop UI

    startRoundBtn.addEventListener('click', async () => {
        // Ensure audio context is ready when starting a round
        if (window.audioContext && window.audioContext.state === 'suspended') {
            try {
                await window.audioContext.resume();
                console.log('Audio context resumed');
            } catch (error) {
                console.error('Error resuming audio context:', error);
            }
        }
        
        // Test sound when starting round
        playSound('punch', 0.5);
        startRoundCallback();
    });

    // Add speed up functionality
    speedUpBtn.addEventListener('click', async () => {
        const { gameState } = await import('./game-state.js');
        gameState.isSpeedUp = !gameState.isSpeedUp;
        gameState.speedMultiplier = gameState.isSpeedUp ? 2 : 1;
        
        if (gameState.isSpeedUp) {
            speedUpBtn.textContent = 'Normal Speed (1x)';
            speedUpBtn.classList.add('active');
        } else {
            speedUpBtn.textContent = 'Speed Up (2x)';
            speedUpBtn.classList.remove('active');
        }
    });

    forfeitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to forfeit?')) {
            console.log('Player confirmed forfeit');
            forfeitCallback();
        }
    });
}