export class EffectsManager {
    constructor(game) {
        this.game = game;
        this.enchantmentSparkles = [];
        this.collectibleEffects = [];
        this.impactSparkles = [];
        this.activeAbilities = [];
        this.lavaParticles = [];
        this.damageIndicators = [];
        this.notifications = [];
    }

    createImpactSparkles(x, y) {
        const count = 10 + Math.floor(Math.random() * 5);
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.impactSparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                color: Math.random() < 0.7 ? '#FFFFFF' : '#ADD8E6'
            });
        }
    }

    createEnchantmentSparkles() {
        const sparkleCount = 15;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const radius = 50 + Math.random() * 100;
            const x = this.game.canvas.width / 2 + Math.cos(angle) * radius;
            const y = this.game.canvas.height / 2 + Math.sin(angle) * radius;
            
            this.enchantmentSparkles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 2 + Math.random() * 6,
                life: 0.7,
                duration: 0.7
            });
        }
    }

    update(dt) {
        this.updateCanvasEffects(dt);
        this.updateAbilityEffects(dt);
        this.updateDamageIndicators(dt);
        this.updateNotifications(dt);
    }

    updateCanvasEffects(dt) {
        // Update enchantment sparkles (screen space)
        for (let i = this.enchantmentSparkles.length - 1; i >= 0; i--) {
            const s = this.enchantmentSparkles[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.life -= dt;
            if (s.life <= 0) {
                this.enchantmentSparkles.splice(i, 1);
            }
        }

        // Update collectible effects (world space)
        for (let i = this.collectibleEffects.length - 1; i >= 0; i--) {
            const e = this.collectibleEffects[i];
            e.y += e.vy * dt;
            e.life -= dt;
            if (e.life <= 0) {
                this.collectibleEffects.splice(i, 1);
            }
        }
        
        // Update impact sparkles
        for (let i = this.impactSparkles.length - 1; i >= 0; i--) {
            const p = this.impactSparkles[i];
            p.vx *= 0.95; // air friction
            p.vy += 0.2; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) {
                this.impactSparkles.splice(i, 1);
            }
        }
    }

    updateAbilityEffects(dt) {
        // Update ability visual effects
        for (let i = this.activeAbilities.length - 1; i >= 0; i--) {
            const ability = this.activeAbilities[i];
            ability.life -= dt;
            if (ability.type === 'blaze_aura') {
                ability.radius = (1 - (ability.life / ability.duration)) * ability.maxRadius;
            }
            if (ability.life <= 0) {
                this.activeAbilities.splice(i, 1);
            }
        }

        // Update lava particles
        this.updateLavaParticles(dt);
    }

    updateLavaParticles(dt) {
        for (let i = this.lavaParticles.length - 1; i >= 0; i--) {
            const p = this.lavaParticles[i];
            p.vy += 0.1; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;

            let shouldRemove = p.life <= 0 || p.y > this.game.camera.y + this.game.canvas.height + 50;

            if (!shouldRemove) {
                const block = this.game.world.getBlockAt(p.x, p.y);
                if (block && !block.destroyed) {
                    block.takeDamage(0.5); // Lava particles deal small damage
                    this.game.handleBlockDestruction(block, true);
                    shouldRemove = true; // Particle is destroyed on impact
                }
            }
            
            if (shouldRemove) {
                this.lavaParticles.splice(i, 1);
            }
        }
    }

    updateDamageIndicators(dt) {
        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const indicator = this.damageIndicators[i];
            indicator.y += indicator.vy * dt;
            indicator.vy *= 0.95; // Slow down over time
            indicator.life -= dt;
            indicator.alpha = Math.max(0, indicator.life / 1.5);
            
            if (indicator.life <= 0) {
                this.damageIndicators.splice(i, 1);
            }
        }
    }

    updateNotifications(dt) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.life -= dt;
            notification.alpha = Math.max(0, notification.life / 3.0);
            
            if (notification.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }

    drawWorldSpaceEffects(ctx) {
        // Draw impact sparkles
        this.impactSparkles.forEach(p => {
            const size = 1 + p.life * 4; // particle shrinks as it dies
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life > 0.5 ? 1 : p.life * 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Draw damage indicators
        this.damageIndicators.forEach(indicator => {
            ctx.font = 'bold 14px "Minecraft Seven", monospace';
            ctx.textAlign = 'center';
            ctx.globalAlpha = indicator.alpha;
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(indicator.text, indicator.x + 1, indicator.y + 1);
            
            // Main text
            ctx.fillStyle = '#FF4444';
            ctx.fillText(indicator.text, indicator.x, indicator.y);
            
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'left';
        });

        // Draw lava particles
        this.lavaParticles.forEach(p => {
            const size = 3 + p.life; // particle shrinks as it dies
            ctx.fillStyle = Math.random() < 0.5 ? '#ff4500' : '#ffa500';
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        });
        
        // Draw collectible effects
        const expBottleImage = this.game.assetLoader.getAsset('experience_bottle');
        if (expBottleImage && expBottleImage.complete) {
            this.collectibleEffects.forEach(e => {
                if (e.type === 'experience_bottle') {
                    const progress = 1 - (e.life / e.duration);
                    const scale = 1.0 - (progress * 0.8); // shrinks to 20%
                    const alpha = 1.0 - progress;
                    const width = 32 * scale;
                    const height = 32 * scale;
                    
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(expBottleImage, e.x - width / 2, e.y - height / 2, width, height);
                    ctx.globalAlpha = 1.0;
                }
            });
        }
    }

    drawScreenSpaceEffects(ctx) {
        // Draw enchantment sparkles
        this.enchantmentSparkles.forEach(s => {
            const progress = 1 - (s.life / s.duration);
            const scale = 0.5 + progress;
            const alpha = 1.0 - progress;
            
            ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * scale / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw notifications
        this.notifications.forEach((notification, index) => {
            const y = notification.y + (index * 40);
            ctx.font = 'bold 16px "Minecraft Seven", monospace';
            ctx.textAlign = 'center';
            ctx.globalAlpha = notification.alpha;
            
            // Background
            const textWidth = ctx.measureText(notification.message).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.game.canvas.width / 2 - textWidth / 2 - 10, y - 20, textWidth + 20, 30);
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(notification.message, this.game.canvas.width / 2 + 1, y + 1);
            
            // Main text
            ctx.fillStyle = notification.color;
            ctx.fillText(notification.message, this.game.canvas.width / 2, y);
            
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'left';
        });
    }
}