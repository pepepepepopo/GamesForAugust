import * as config from './config.js';
import { playSound } from './audio.js';
import { createCoinDrop, createExplosionVisual, createHealEffect, createMissEffect, createSniperEffect } from './animations.js';
import { ProjectileManager } from './combat/projectile-manager.js';
import { SpecialAttacks } from './combat/special-attacks.js';
import { DamageCalculator } from './combat/damage-calculator.js';

export class StickmanCombat {
    static attack(stickman, target) {
        // Use custom attack cooldown for snipers and apply speed multiplier
        const baseCooldown = stickman.stats.attackCooldown || config.BASE_STATS.attack_cooldown;
        const effectiveCooldown = baseCooldown / (stickman.speedMultiplier || 1);
        stickman.lastAttackTime = Date.now();
        stickman.isAttacking = true;

        // Default attack properties
        let attackProps = {
            animationClass: 'punching',
            soundName: 'punch',
            soundVolume: 0.3,
            animationDuration: 300,
            damageDelay: 150
        };

        // Check for sniper miss chance
        if (stickman.element.classList.contains('sniper')) {
            if (Math.random() < stickman.stats.missChance) {
                // Miss!
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
                return;
            }
        }

        // Handle special attack types
        if (SpecialAttacks.handleSpecialAttack(stickman, target, attackProps)) {
            return; // Special attack handled
        }

        // Standard attack handling
        this.executeStandardAttack(stickman, target, attackProps);
    }

    static executeStandardAttack(stickman, target, attackProps) {
        // Apply weapon-specific modifications
        if (stickman.element.classList.contains('with-gun') || stickman.element.classList.contains('sniper')) {
            attackProps.animationClass = 'shooting';
            attackProps.soundName = 'gunshot';
            attackProps.soundVolume = 0.2;
            attackProps.animationDuration = 500;
            attackProps.damageDelay = 100;
        } else if (stickman.element.classList.contains('gorilla')) {
            attackProps.animationClass = 'smashing';
            attackProps.soundName = 'punch';
            attackProps.soundVolume = 0.8;
            attackProps.animationDuration = 800;
            attackProps.damageDelay = 200;
        }
        
        stickman.element.classList.add(attackProps.animationClass);
        
        // Damage is applied mid-animation
        setTimeout(async () => {
            if (stickman.health > 0 && !stickman.isDying) {
                playSound(attackProps.soundName, attackProps.soundVolume);
                
                // Handle damage application
                await this.applyDamage(stickman, target);
            }
        }, attackProps.damageDelay);

        // Remove class and reset state after animation
        setTimeout(() => {
            stickman.element.classList.remove(attackProps.animationClass);
            stickman.isAttacking = false;
        }, attackProps.animationDuration);
    }

    static async applyDamage(stickman, target) {
        // Special handling for gorilla smash
        if (stickman.element.classList.contains('gorilla')) {
            SpecialAttacks.performGorillaSmash(stickman);
            return;
        }

        // Standard damage application
        const distance = Math.hypot(stickman.x - target.x, stickman.y - target.y);
        if (target.health > 0 && !target.isDying && distance <= stickman.stats.attackRange + 10) {
            const damage = DamageCalculator.calculateDamage(stickman, target);
            
            // Apply damage and effects
            if (stickman.element.classList.contains('sniper')) {
                DamageCalculator.applySnipeEffects(stickman, target, damage);
            } else {
                target.takeDamage(damage);
            }
        }
        
        // Check for money machine damage
        if (stickman.type === 'enemy') {
            await this.damageMoneyMachines(stickman);
        }
    }

    static async damageMoneyMachines(stickman) {
        const { gameState } = await import('./game-state.js');
        gameState.moneyMachines.forEach(machine => {
            if (!machine.isDying && machine.health > 0) {
                const machineDistance = Math.hypot(stickman.x - machine.x, stickman.y - machine.y);
                if (machineDistance <= stickman.stats.attackRange + 20) {
                    machine.takeDamage(stickman.stats.damage);
                }
            }
        });
    }

    static heal(stickman, target, isPostRoundHeal = false) {
        stickman.lastHealTime = Date.now();
        stickman.isAttacking = true; // Use attacking state to prevent other actions

        stickman.element.classList.add('healing');
        playSound('heal', 0.5);

        // Heal is applied mid-animation
        setTimeout(() => {
            if (stickman.health > 0 && !stickman.isDying) {
                if (target.health > 0 && !target.isDying) {
                    target.receiveHeal(stickman.stats.healAmount);
                }
            }
        }, 300);

        // Reset state. For post-round healing, the medic becomes available immediately.
        const resetDelay = isPostRoundHeal ? 310 : 600;
        setTimeout(() => {
            stickman.element.classList.remove('healing');
            stickman.isAttacking = false;
        }, resetDelay);
    }

    static async explode(stickman) {
        if(stickman.isDying) return;
        stickman.isDying = true;

        playSound('explosion', 0.6);
        stickman.element.classList.add('exploding');
        stickman.element.querySelector('.health-bar-container').style.display = 'none';
        
        createExplosionVisual(stickman.x, stickman.y, stickman.stats.explosionRadius);
        
        const { gameState } = await import('./game-state.js');
        
        // Determine targets based on stickman type
        let targets = [];
        if (stickman.type === 'player') {
            targets = gameState.enemyStickmen;
        } else {
            targets = gameState.playerStickmen;
        }
        
        const targetsInRange = targets.filter(target => {
            if (target.isDying || target.health <= 0) return false;
            const distance = Math.hypot(stickman.x - target.x, stickman.y - target.y);
            return distance <= stickman.stats.explosionRadius;
        });

        targetsInRange.forEach(target => target.takeDamage(stickman.stats.damage));

        // 90% chance to die from explosion for player bombers. Enemies always die.
        if (stickman.type === 'player' && Math.random() < 0.1) {
             // Survived
            stickman.isDying = false; // It's not dying after all
            stickman.element.classList.remove('exploding');
            stickman.element.querySelector('.health-bar-container').style.display = 'block';
        } else {
            stickman.health = 0;
        }
        
        if (stickman.health === 0) {
            setTimeout(() => {
                stickman.element.remove();
                stickman.isRemoved = true; // Mark for removal from game state array
            }, 500);
        }
    }
}