import { StickmanMovement } from './stickman-movement.js';
import { StickmanCombat } from './stickman-combat.js';
import * as config from './config.js';

export class StickmanTypes {
    static async updateMedic(stickman, deltaTime) {
        const { gameState } = await import('./game-state.js');
        
        // Prevent normal medic from doing anything during a combat round
        if (stickman.stickmanType?.id === 'medic' && gameState.roundInProgress) {
            return true; // Handled
        }

        // Normal Medic Logic (Post-Round)
        if (stickman.stickmanType?.id === 'medic' && !gameState.roundInProgress) {
            // Clear any combat or repositioning targets
            stickman.target = null;
            stickman.repositionTarget = null;

            // If not currently healing something, find a target
            if (!stickman.healTarget) {
                 const injuredAllies = gameState.playerStickmen.filter(p =>
                    p.health > 0 &&
                    !p.isDying &&
                    p.health < p.maxHealth &&
                    !p.isBeingHealed && // Custom flag to prevent multiple medics targeting one patient
                    p.id !== stickman.id && // Cannot target self
                    p.stickmanType?.id !== 'medic' && p.stickmanType?.id !== 'car_medic'
                );

                if (injuredAllies.length > 0) {
                    stickman.healTarget = StickmanMovement.findClosestTarget(stickman, injuredAllies);
                    if (stickman.healTarget) {
                        stickman.healTarget.isBeingHealed = true; // Mark patient as being tended to
                    }
                }
            }
            
            // If a heal target is assigned, move and heal
            if (stickman.healTarget) {
                const target = stickman.healTarget;
                // Check if target is still valid (not dead, still injured)
                if (target.health > 0 && !target.isDying && target.health < target.maxHealth) {
                    const dx = target.x - stickman.x;
                    const dy = target.y - stickman.y;
                    const distance = Math.hypot(dx, dy);
                    
                    if (distance <= stickman.stats.healRange) {
                        StickmanCombat.heal(stickman, target, true); // Pass flag for post-round heal
                        target.isBeingHealed = false; // Free up patient
                        stickman.healTarget = null; // Find new patient in next frame
                    } else {
                        // Move towards heal target
                        const moveSpeed = stickman.stats.moveSpeed * deltaTime;
                        stickman.x += (dx / distance) * moveSpeed;
                        stickman.y += (dy / distance) * moveSpeed;
                        StickmanMovement.clampToFloor(stickman);
                        stickman.element.style.left = `${stickman.x}px`;
                        stickman.element.style.top = `${stickman.y}px`;
                    }
                } else {
                     // Target is dead or fully healed, drop them
                    target.isBeingHealed = false;
                    stickman.healTarget = null;
                }
            }
            return true; // Handled
        }

        return false; // Not handled
    }

    static async updateCarMedic(stickman, deltaTime) {
        const { gameState } = await import('./game-state.js');
        
        // Car Medic Logic (In-Combat)
        if (stickman.stickmanType?.id === 'car_medic' && gameState.roundInProgress) {
            const healTarget = stickman.healTarget;
            if (healTarget && healTarget.health > 0 && !healTarget.isDying) {
                const dx = healTarget.x - stickman.x;
                const dy = healTarget.y - stickman.y;
                const distance = Math.hypot(dx, dy);

                if (distance <= stickman.stats.healRange) {
                    if (Date.now() - stickman.lastHealTime > stickman.stats.healCooldown) {
                        StickmanCombat.heal(stickman, healTarget);
                    }
                } else {
                    // Move towards heal target
                    const moveSpeed = stickman.stats.moveSpeed * deltaTime;
                    stickman.x += (dx / distance) * moveSpeed;
                    stickman.y += (dy / distance) * moveSpeed;
                    StickmanMovement.clampToFloor(stickman);
                    stickman.element.style.left = `${stickman.x}px`;
                    stickman.element.style.top = `${stickman.y}px`;
                }
            }
             // Car medics only perform healing logic and do not attack.
            return true; // Handled
        }

        return false; // Not handled
    }

    static updateBomber(stickman, target) {
        // Special case for Bomber (both player and enemy)
        if (stickman.element.classList.contains('bomb') && target) {
            const dx = target.x - stickman.x;
            const dy = target.y - stickman.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance <= stickman.stats.attackRange) {
                if (!stickman.isDying) StickmanCombat.explode(stickman);
                return true; // Handled
            }
        }

        return false; // Not handled
    }

    static updateGunPlane(stickman, deltaTime) {
        if (stickman.stickmanType?.id === 'gun_plane') {
            // Gun planes fly overhead and shoot down at enemies
            const target = stickman.target;
            if (target && target.health > 0) {
                // Stay at altitude and move horizontally towards target
                const dx = target.x - stickman.x;
                const distance = Math.abs(dx);
                
                if (distance <= stickman.stats.attackRange) {
                    // Attack from above - apply speed multiplier to cooldown
                    const baseCooldown = 2000; // 2 second base cooldown
                    const speedMultiplier = stickman.type === 'player' ? 
                        (async () => {
                            const { gameState } = await import('./game-state.js');
                            return gameState.speedMultiplier || 1;
                        })() : 1;
                    
                    // For async operation, we need to handle this differently
                    const effectiveCooldown = baseCooldown / (stickman.speedMultiplier || 1);
                    if (Date.now() - stickman.lastAttackTime > effectiveCooldown) {
                        stickman.attack(target);
                    }
                } else {
                    // Move horizontally towards target while maintaining altitude
                    const moveSpeed = stickman.stats.moveSpeed * deltaTime;
                    stickman.x += (dx > 0 ? 1 : -1) * moveSpeed;
                    stickman.element.style.left = `${stickman.x}px`;
                }
            }
            return true; // Handled
        }
        return false; // Not handled
    }

    static updateBombPlane(stickman, deltaTime) {
        if (stickman.stickmanType?.id === 'bomb_plane') {
            // Bomb planes fly overhead and drop bombs
            const target = stickman.target;
            if (target && target.health > 0) {
                const dx = target.x - stickman.x;
                const distance = Math.abs(dx);
                
                if (distance <= stickman.stats.attackRange) {
                    // Drop bomb - apply speed multiplier to cooldown
                    const baseCooldown = 3000; // 3 second base cooldown
                    const effectiveCooldown = baseCooldown / (stickman.speedMultiplier || 1);
                    if (Date.now() - stickman.lastAttackTime > effectiveCooldown) {
                        stickman.attack(target);
                    }
                } else {
                    // Move horizontally towards target
                    const moveSpeed = stickman.stats.moveSpeed * deltaTime;
                    stickman.x += (dx > 0 ? 1 : -1) * moveSpeed;
                    stickman.element.style.left = `${stickman.x}px`;
                }
            }
            return true; // Handled
        }
        return false; // Not handled
    }
}