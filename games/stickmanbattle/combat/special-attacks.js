import { playSound } from '../audio.js';
import { createExplosionVisual, createMissEffect } from '../animations.js';
import { ProjectileManager } from './projectile-manager.js';
import { DamageCalculator } from './damage-calculator.js';

export class SpecialAttacks {
    static handleSpecialAttack(stickman, target, attackProps) {
        // Check for sniper miss chance
        if (stickman.element.classList.contains('sniper')) {
            if (Math.random() < stickman.stats.missChance) {
                this.handleSniperMiss(stickman, target, attackProps);
                return true;
            }
        }

        // Handle rocket launcher special attack
        if (stickman.element.classList.contains('rocket-launcher')) {
            this.handleRocketLauncherAttack(stickman, target, attackProps);
            return true;
        }

        // Handle bomb plane special attack
        if (stickman.element.classList.contains('on-bomb-plane')) {
            this.handleBombPlaneAttack(stickman, target, attackProps);
            return true;
        }

        // Handle gun plane special attack
        if (stickman.element.classList.contains('on-gun-plane')) {
            this.handleGunPlaneAttack(stickman, target, attackProps);
            return true;
        }

        return false; // No special attack handled
    }

    static handleSniperMiss(stickman, target, attackProps) {
        attackProps.animationClass = 'shooting';
        attackProps.soundName = 'gunshot';
        attackProps.soundVolume = 0.2;
        attackProps.animationDuration = 500;
        attackProps.damageDelay = 100;
        
        stickman.element.classList.add(attackProps.animationClass);
        
        setTimeout(() => {
            playSound(attackProps.soundName, attackProps.soundVolume);
            createMissEffect(target.x, target.y);
        }, attackProps.damageDelay);
        
        setTimeout(() => {
            stickman.element.classList.remove(attackProps.animationClass);
            stickman.isAttacking = false;
        }, attackProps.animationDuration);
    }

    static handleRocketLauncherAttack(stickman, target, attackProps) {
        attackProps.animationClass = 'shooting';
        attackProps.soundName = 'gunshot';
        attackProps.soundVolume = 0.3;
        attackProps.animationDuration = 800;
        attackProps.damageDelay = 200;
        
        stickman.element.classList.add(attackProps.animationClass);
        
        setTimeout(() => {
            if (stickman.health > 0 && !stickman.isDying) {
                playSound(attackProps.soundName, attackProps.soundVolume);
                ProjectileManager.fireRocket(stickman, target);
            }
        }, attackProps.damageDelay);
        
        setTimeout(() => {
            stickman.element.classList.remove(attackProps.animationClass);
            stickman.isAttacking = false;
        }, attackProps.animationDuration);
    }

    static handleBombPlaneAttack(stickman, target, attackProps) {
        attackProps.animationClass = 'bombing';
        attackProps.soundName = 'gunshot';
        attackProps.soundVolume = 0.3;
        attackProps.animationDuration = 1000;
        attackProps.damageDelay = 300;
        
        stickman.element.classList.add(attackProps.animationClass);
        
        setTimeout(() => {
            if (stickman.health > 0 && !stickman.isDying) {
                playSound(attackProps.soundName, attackProps.soundVolume);
                ProjectileManager.dropBomb(stickman, target);
            }
        }, attackProps.damageDelay);
        
        setTimeout(() => {
            stickman.element.classList.remove(attackProps.animationClass);
            stickman.isAttacking = false;
        }, attackProps.animationDuration);
    }

    static handleGunPlaneAttack(stickman, target, attackProps) {
        attackProps.animationClass = 'shooting';
        attackProps.soundName = 'gunshot';
        attackProps.soundVolume = 0.3;
        attackProps.animationDuration = 1000;
        attackProps.damageDelay = 300;
        
        stickman.element.classList.add(attackProps.animationClass);
        
        setTimeout(() => {
            if (stickman.health > 0 && !stickman.isDying) {
                playSound(attackProps.soundName, attackProps.soundVolume);
                // Apply damage directly for gun planes
                if (target.health > 0 && !target.isDying) {
                    const damage = DamageCalculator.calculateDamage(stickman, target);
                    target.takeDamage(damage);
                }
            }
        }, attackProps.damageDelay);
        
        setTimeout(() => {
            stickman.element.classList.remove(attackProps.animationClass);
            stickman.isAttacking = false;
        }, attackProps.animationDuration);
    }

    static async performGorillaSmash(stickman) {
        const { gameState } = await import('../game-state.js');
        
        // Gorilla can damage multiple targets in range
        const targets = gameState.playerStickmen.filter(target => {
            if (target.isDying || target.health <= 0) return false;
            const distance = Math.hypot(stickman.x - target.x, stickman.y - target.y);
            return distance <= stickman.stats.smashRange;
        });

        targets.forEach(target => target.takeDamage(stickman.stats.damage));
        
        // Visual effect for smash
        createExplosionVisual(stickman.x, stickman.y, stickman.stats.smashRange);
    }
}