import { gameState, stopPhysics } from './game-state.js';
import { assignTargets, assignCarMedicHealTargets } from './game-targeting.js';
import { updateFlyingCoins } from './animations.js';
import * as config from './config.js';

let isGameRunning = false;
let lastTime = 0;

export function startGameLoop() {
    if (isGameRunning) return;
    isGameRunning = true;
    requestAnimationFrame(gameLoop);
}

export function stopGameLoop() {
    isGameRunning = false;
}

export function handleGameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;

    // Stop physics
    stopPhysics();

    const gameOverScreen = document.getElementById('game-over-screen');
    const finalRoundsEl = document.getElementById('final-rounds-survived');
    finalRoundsEl.textContent = gameState.legitimateRoundsSurvived;
    gameOverScreen.classList.remove('hidden');

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
        location.reload(); // Simplest way to restart the game
    }, { once: true });
}

async function gameLoop(timestamp) {
    if (gameState.isGameOver || !isGameRunning) return;
    
    if (!lastTime) lastTime = timestamp;
    let deltaTime = (timestamp - lastTime) / 1000;
    
    // Apply speed multiplier
    deltaTime *= gameState.speedMultiplier;
    
    lastTime = timestamp;

    // Filter out dying stickmen before updates
    const alivePlayerStickmen = gameState.playerStickmen.filter(s => !s.isDying);
    const aliveEnemyStickmen = gameState.enemyStickmen.filter(s => !s.isDying);

    // --- Post-round healing phase check ---
    if (gameState.postRoundHealingActive) {
        const stillInjured = alivePlayerStickmen.some(p => 
            p.health < p.maxHealth &&
            p.stickmanType?.id !== 'medic' && p.stickmanType?.id !== 'car_medic'
        );
        if (!stillInjured) {
            gameState.postRoundHealingActive = false;
        }
    }

    // --- Target assignment at the beginning of each frame ---
    if (gameState.roundInProgress) {
        assignTargets(alivePlayerStickmen, aliveEnemyStickmen);
        assignTargets(aliveEnemyStickmen, alivePlayerStickmen);

        // Assign heal targets for CAR MEDICS ONLY during combat
        const carMedics = alivePlayerStickmen.filter(p => p.stickmanType?.id === 'car_medic');
        if (carMedics.length > 0) {
            assignCarMedicHealTargets(carMedics, alivePlayerStickmen);
        }

    } else {
        // Clear targets when round is not in progress
        alivePlayerStickmen.forEach(s => {
            s.target = null;
            // Don't clear heal targets for normal medics - they need them for post-round healing
            if (s.stickmanType?.id !== 'medic') {
                s.healTarget = null;
            }
        });
        aliveEnemyStickmen.forEach(s => s.target = null);
    }

    // Update stickmen
    alivePlayerStickmen.forEach(p => p.update(deltaTime));
    aliveEnemyStickmen.forEach(e => e.update(deltaTime));

    // Update coin animations
    updateFlyingCoins();

    // Remove destroyed money machines
    gameState.moneyMachines = gameState.moneyMachines.filter(m => !m.isRemoved);

    // Remove dead stickmen from arrays. This is now based on their `isDying` flag and animation timeout
    // So we need to filter them out of the main arrays.
    gameState.playerStickmen = gameState.playerStickmen.filter(s => !s.isRemoved);
    gameState.enemyStickmen = gameState.enemyStickmen.filter(s => !s.isRemoved);
    
    // Check for round end
    if (gameState.roundInProgress && gameState.enemyStickmen.length === 0 && document.querySelectorAll('.enemy.dying').length === 0) {
        const { handleRoundEnd } = await import('./round-handlers.js');
        handleRoundEnd();
    }

    // Check for game over condition
    // This happens when no player stickmen are left (alive or dying)
    // and the player can't afford the cheapest one.
    if (gameState.playerStickmen.length === 0 && document.querySelectorAll('.player.dying').length === 0) {
        if (gameState.playerCoins < config.CHEAPEST_STICKMAN_COST) {
            console.log(`Game over condition met. No stickmen left and insufficient coins (${gameState.playerCoins} < ${config.CHEAPEST_STICKMAN_COST})`);
            handleGameOver();
        }
    }

    requestAnimationFrame(gameLoop);
}