import { gameState } from '../game-state.js';
import { createExplosionVisual } from '../animations.js';
import { playSound } from '../audio.js';
import { DamageCalculator } from './damage-calculator.js';

export class ProjectileManager {
    static async fireRocket(stickman, target) {
        const { gameState } = await import('../game-state.js');
        
        // Create rocket projectile
        const rocket = document.createElement('div');
        rocket.className = 'rocket-projectile';
        rocket.style.position = 'absolute';
        rocket.style.width = '20px';
        rocket.style.height = '6px';
        rocket.style.backgroundImage = 'url(/Rocketlaunchermicle.png)';
        rocket.style.backgroundSize = 'contain';
        rocket.style.backgroundRepeat = 'no-repeat';
        rocket.style.backgroundPosition = 'center';
        rocket.style.zIndex = '30';
        rocket.style.left = `${stickman.x + 25}px`; // Start from stickman center
        rocket.style.top = `${stickman.y + 35}px`;
        
        gameState.gameWorld.appendChild(rocket);
        
        // Calculate trajectory
        const startX = stickman.x + 25;
        const startY = stickman.y + 35;
        const endX = target.x + 25;
        const endY = target.y + 35;
        
        // Calculate angle for rocket rotation
        const angle = Math.atan2(endY - startY, endX - startX);
        rocket.style.transform = `rotate(${angle}rad)`;
        
        // Animate rocket movement
        this.animateRocket(rocket, startX, startY, endX, endY, stickman);
    }

    static animateRocket(rocket, startX, startY, endX, endY, stickman) {
        const duration = 600; // milliseconds
        const startTime = performance.now();
        
        function animateRocket(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;
            
            rocket.style.left = `${currentX}px`;
            rocket.style.top = `${currentY}px`;
            
            if (progress < 1) {
                requestAnimationFrame(animateRocket);
            } else {
                // Rocket has reached target - explode
                ProjectileManager.explodeRocket(rocket, endX, endY, stickman);
            }
        }
        
        requestAnimationFrame(animateRocket);
    }

    static async explodeRocket(rocket, endX, endY, stickman) {
        rocket.remove();
        
        // Create explosion effect
        createExplosionVisual(endX, endY, stickman.stats.explosionRadius);
        playSound('explosion', 0.6);
        
        // Damage only enemy targets in explosion radius
        const { gameState } = await import('../game-state.js');
        const targets = stickman.type === 'player' ? gameState.enemyStickmen : gameState.playerStickmen;
        const targetsInRange = targets.filter(t => {
            if (t.isDying || t.health <= 0) return false;
            const distance = Math.hypot(endX - (t.x + 25), endY - (t.y + 35));
            return distance <= stickman.stats.explosionRadius;
        });
        
        targetsInRange.forEach(t => {
            const damage = DamageCalculator.calculateDamage(stickman, t);
            t.takeDamage(damage);
        });
    }

    static async dropBomb(stickman, target) {
        const { gameState } = await import('../game-state.js');
        
        // Create bomb projectile that falls down
        const bomb = document.createElement('div');
        bomb.className = 'bomb-projectile';
        bomb.style.position = 'absolute';
        bomb.style.width = '15px';
        bomb.style.height = '15px';
        bomb.style.backgroundColor = 'black';
        bomb.style.borderRadius = '50%';
        bomb.style.zIndex = '30';
        bomb.style.left = `${stickman.x + 60}px`; // Start from plane center
        bomb.style.top = `${stickman.y + 30}px`;
        
        gameState.gameWorld.appendChild(bomb);
        
        // Calculate drop trajectory (straight down)
        const startX = stickman.x + 60;
        const startY = stickman.y + 30;
        const floorHeight = gameState.gameWorld.clientHeight * 0.15;
        const endY = gameState.gameWorld.clientHeight - floorHeight;
        
        // Animate bomb falling
        this.animateBomb(bomb, startX, startY, endY, stickman);
    }

    static animateBomb(bomb, startX, startY, endY, stickman) {
        const duration = 1200; // milliseconds
        const startTime = performance.now();
        
        function animateBomb(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentY = startY + (endY - startY) * progress;
            
            bomb.style.top = `${currentY}px`;
            
            if (progress < 1) {
                requestAnimationFrame(animateBomb);
            } else {
                // Bomb has hit ground - explode
                ProjectileManager.explodeBomb(bomb, startX, endY, stickman);
            }
        }
        
        requestAnimationFrame(animateBomb);
    }

    static async explodeBomb(bomb, startX, endY, stickman) {
        bomb.remove();
        
        // Create explosion effect
        createExplosionVisual(startX, endY, stickman.stats.explosionRadius);
        playSound('explosion', 0.6);
        
        // Damage enemies in explosion radius
        const { gameState } = await import('../game-state.js');
        const targets = gameState.enemyStickmen;
        const targetsInRange = targets.filter(t => {
            if (t.isDying || t.health <= 0) return false;
            const distance = Math.hypot(startX - (t.x + 25), endY - (t.y + 35));
            return distance <= stickman.stats.explosionRadius;
        });
        
        targetsInRange.forEach(t => {
            t.takeDamage(stickman.stats.damage);
        });
    }
}