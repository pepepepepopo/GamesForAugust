import { gameState } from './game-state.js';
import { Stickman } from './stickman.js';
import { showRoundDisplay, updateRoundsSurvivedUI } from './ui.js';
import { generateRoundEnemies } from './round-manager.js';
import { generateMoneyFromMachines } from './money-machine.js';
import { missionManager } from './missions.js';

export function handleStartRound() {
    if (gameState.roundInProgress || gameState.isGameOver) return;
    
    gameState.roundInProgress = true;
    document.getElementById('start-round-btn').disabled = true;
    gameState.currentRound++;
    
    // Reset post-round healing flag at the start of a new round
    gameState.postRoundHealingActive = false;
    // Clear any leftover healing flags on stickmen
    gameState.playerStickmen.forEach(p => { p.isBeingHealed = false; });

    showRoundDisplay(gameState.currentRound);

    // Use the new round manager to generate enemies
    const enemiesToSpawn = generateRoundEnemies(gameState.currentRound);
    enemiesToSpawn.forEach(enemyConfig => {
        const newEnemy = new Stickman('enemy', enemyConfig);
        gameState.enemyStickmen.push(newEnemy);
    });
}

export async function handleRoundEnd() {
    gameState.roundInProgress = false;
    gameState.roundsSurvived++;
    
    // Only increment legitimate rounds if this was the next sequential round
    if (gameState.currentRound === gameState.legitimateRoundsSurvived + 1) {
        gameState.legitimateRoundsSurvived++;
    }
    
    // Update mission progress for surviving rounds
    missionManager.updateProgress('survive', gameState.legitimateRoundsSurvived);
    
    updateRoundsSurvivedUI();
    document.getElementById('start-round-btn').disabled = false;

    // Clear any leftover healing flags on stickmen
    gameState.playerStickmen.forEach(p => { p.isBeingHealed = false; });

    // --- New Repositioning Logic ---
    const stickmanHeight = 70; // from CSS
    const floorHeight = gameState.gameWorld.clientHeight * 0.15;
    const floorTopY = gameState.gameWorld.clientHeight - floorHeight;
    const max_y = gameState.gameWorld.clientHeight - stickmanHeight;
    const repositionAreaWidth = gameState.gameWorld.clientWidth * 0.4; // Use 40% of the screen width for repositioning

    gameState.playerStickmen.forEach(stickman => {
        if (stickman.health > 0 && !stickman.isDying) {
            // Don't reposition medics - they need to stay put to heal
            if (stickman.stickmanType?.id !== 'medic') {
                const targetX = 50 + Math.random() * repositionAreaWidth;
                const targetY = floorTopY + Math.random() * (max_y - floorTopY);
                stickman.setRepositionTarget(targetX, targetY);
            }
        }
    });

    // Generate money from machines after round ends
    generateMoneyFromMachines();
}

export function handleForfeit() {
    if (gameState.isGameOver) return;
    
    console.log(`Player forfeited.`);
    handleGameOver();
}

async function handleGameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;

    // Stop physics
    // Runner.stop(runner);

    const gameOverScreen = document.getElementById('game-over-screen');
    const finalRoundsEl = document.getElementById('final-rounds-survived');
    finalRoundsEl.textContent = gameState.legitimateRoundsSurvived;
    gameOverScreen.classList.remove('hidden');

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
        location.reload(); // Simplest way to restart the game
    }, { once: true });
}