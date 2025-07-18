import { BLOCK_DEFINITIONS } from './block-definitions.js';

export class Block {
    constructor(x, y, width, height, blockType = 'stone') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.blockType = blockType;
        this.destroyed = false;
        this.hasExperienceBottle = false;

        const definition = BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS['stone'];
        this.health = definition.health;
        this.maxHealth = definition.health;
        this.isDeepslate = definition.isDeepslate || false;
        
        this.damageState = 0;
    }

    takeDamage(damage) {
        if (this.destroyed) return;
        this.health -= damage;
        
        const damageRatio = Math.max(0, 1 - this.health / this.maxHealth);
        this.damageState = Math.min(window.damageSprites.length, Math.floor(damageRatio * (window.damageSprites.length + 1)));

        if (this.health <= 0) {
            this.health = 0;
            this.destroyed = true;
        }
    }

    draw(ctx) {
        if (this.destroyed) return;
        
        const definition = BLOCK_DEFINITIONS[this.blockType] || BLOCK_DEFINITIONS['stone'];
        const baseImage = window[definition.textureKey];
        
        if (baseImage && baseImage.complete) {
            ctx.drawImage(baseImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = definition.fallbackColor || '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        if (this.damageState > 0) {
            const spriteIndex = this.damageState - 1;
            if (spriteIndex < window.damageSprites.length) {
                const damageSprite = window.damageSprites[spriteIndex];
                if (damageSprite && damageSprite.complete) {
                    ctx.globalAlpha = 0.8;
                    ctx.drawImage(damageSprite, this.x, this.y, this.width, this.height);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    intersects(pickaxe) {
        return pickaxe.x < this.x + this.width &&
               pickaxe.x + pickaxe.width > this.x &&
               pickaxe.y < this.y + this.height &&
               pickaxe.y + pickaxe.height > this.y;
    }
}