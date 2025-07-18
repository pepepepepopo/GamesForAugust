import { createSniperEffect } from '../animations.js';

export class DamageCalculator {
    static calculateDamage(attacker, target) {
        let damage = attacker.stats.damage;
        
        // Apply bullet resistance for gorillas
        if (target.element.classList.contains('gorilla') && target.stats.bulletResistance) {
            // Check if this is a bullet-based attack
            if (attacker.element.classList.contains('with-gun') || 
                attacker.element.classList.contains('sniper') ||
                attacker.element.classList.contains('on-gun-plane') ||
                attacker.element.classList.contains('rocket-launcher')) {
                damage = 2; // Bullets only do 2 damage to gorillas
            }
        }
        
        return damage;
    }

    static applySnipeEffects(stickman, target, baseDamage) {
        let damage = baseDamage;
        let effectText = 'NICE SHOT';
        
        // Check for headshot
        if (Math.random() < stickman.stats.headShotChance) {
            damage = stickman.stats.headShotDamage;
            effectText = 'HEADSHOT';
        }
        
        // Apply bullet resistance for gorillas
        if (target.element.classList.contains('gorilla') && target.stats.bulletResistance) {
            damage = 2; // Bullets only do 2 damage to gorillas
        }
        
        target.takeDamage(damage);
        createSniperEffect(target.x, target.y, effectText);
    }
}

