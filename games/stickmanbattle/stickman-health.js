import { createCoinDrop, createHealEffect } from './animations.js';
import { playSound } from './audio.js';

export class StickmanHealth {
    static takeDamage(stickman, damage) {
        if (stickman.isDying) return;
        stickman.health = Math.max(0, stickman.health - damage);
        StickmanHealth.updateHealthBar(stickman);
        if (stickman.health === 0) {
            StickmanHealth.die(stickman);
        }
    }
    
    static receiveHeal(stickman, amount) {
        if (stickman.isDying || stickman.health <= 0) return;
        stickman.health = Math.min(stickman.maxHealth, stickman.health + amount);
        StickmanHealth.updateHealthBar(stickman);
        // Create visual effect at the stickman's position
        const effectY = stickman.y + (stickman.element.clientHeight || 70) / 2;
        createHealEffect(stickman.x, effectY);
    }

    static updateHealthBar(stickman) {
        const healthPercentage = (stickman.health / stickman.maxHealth) * 100;
        stickman.healthBar.style.width = `${healthPercentage}%`;
    }

    static async die(stickman) {
        if(stickman.isDying) return;
        stickman.isDying = true;

        playSound('death', 0.5);
        stickman.element.classList.add('dying');
        // Hide health bar immediately
        stickman.element.querySelector('.health-bar-container').style.display = 'none';

        if (stickman.type === 'enemy') {
            const { gameState } = await import('./game-state.js');
            const { missionManager } = await import('./missions.js');
            
            const stickmanHeight = 70; // From CSS
            const floorHeight = gameState.gameWorld.clientHeight * 0.15;
            const yPos = gameState.gameWorld.clientHeight - floorHeight - stickmanHeight;
            createCoinDrop(stickman.x, yPos);
            
            // Update mission progress for enemy kills
            missionManager.updateProgress('kill', 1);
            
            // Check if this was a gorilla
            if (stickman.element.classList.contains('gorilla')) {
                missionManager.updateProgress('defeat_gorilla', 1);
            }
        }

        setTimeout(() => {
            stickman.element.remove();
            stickman.isRemoved = true; // Mark for removal from game state array
        }, 1000); // Corresponds to animation duration
    }
}