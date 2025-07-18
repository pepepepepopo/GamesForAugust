import { UILayout } from './ui-layout.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.backgroundPattern = null;
    }
    
    draw(ctx) {
        // Clear only the game canvas, background is static
        ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // If shop is open, draw it and stop
        if (this.game.shop.showShop) {
            this.game.shop.draw(ctx, this.game.canvas);
            return;
        }

        // --- WORLD SPACE DRAWING ---
        ctx.save();
        ctx.translate(-this.game.camera.x, -this.game.camera.y);
        
        // Draw world elements (like barriers)
        this.game.world.draw(ctx);
        
        // Draw visible blocks
        const visibleBlocks = this.game.world.getNearbyBlocks(this.game.camera.x, this.game.camera.y, this.game.canvas.width, this.game.canvas.height);
        visibleBlocks.forEach(block => {
            if (!block.destroyed) {
                block.draw(ctx);
            }
        });
        
        this.drawProjectiles(ctx);
        this.game.effects.drawWorldSpaceEffects(ctx);
        
        this.game.pickaxe.draw(ctx);
        
        // Draw trajectory line
        if (!this.game.pickaxe.isDropped && !this.game.pickaxe.isBroken) {
            this.drawTrajectoryLine(ctx);
        }
        
        ctx.restore();
        
        // --- SCREEN SPACE DRAWING ---
        this.drawOverlays(ctx);
        this.game.effects.drawScreenSpaceEffects(ctx);
    }

    drawProjectiles(ctx) {
        // Draw bouncy balls
        const bouncyBallImage = this.game.assetLoader.getAsset('bouncyBall');
        if (bouncyBallImage && bouncyBallImage.complete) {
            this.game.world.bouncyBalls.forEach(ball => {
                ctx.save();
                ctx.translate(ball.x + ball.width / 2, ball.y + ball.height / 2);
                ctx.rotate(ball.rotation);
                ctx.drawImage(bouncyBallImage, -ball.width / 2, -ball.height / 2, ball.width, ball.height);
                ctx.restore();
            });
        }
        
        // Draw blaze rods
        const blazeRodImage = this.game.assetLoader.getAsset('blazeRod');
        if (blazeRodImage && blazeRodImage.complete) {
            this.game.world.blazeRods.forEach(rod => {
                ctx.save();
                ctx.translate(rod.x + rod.width / 2, rod.y + rod.height / 2);
                ctx.rotate(rod.rotation);
                ctx.drawImage(blazeRodImage, -rod.width / 2, -rod.height / 2, rod.width, rod.height);
                ctx.restore();
            });
        }
    }

    drawTrajectoryLine(ctx) {
        const pickaxe = this.game.pickaxe;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(pickaxe.x + pickaxe.width/2, pickaxe.y + pickaxe.height);
        ctx.lineTo(pickaxe.x + pickaxe.width/2, pickaxe.y + 2000);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawOverlays(ctx) {
        // Calculate if we're on a narrow screen (mobile)
        const layout = UILayout.calculateMobileLayout(this.game.canvas);
        
        // Draw shop button
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(this.game.canvas.width - (layout.buttonWidth + 10), 10, layout.buttonWidth, layout.buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${layout.fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, 'SHOP', this.game.canvas.width - (layout.buttonWidth/2 + 10), 10 + (layout.buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Draw settings button
        const settingsButtonX = this.game.canvas.width - (layout.buttonWidth * 2 + 25);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(settingsButtonX, 10, layout.buttonWidth, layout.buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${layout.fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, 'CONFIG', settingsButtonX + (layout.buttonWidth/2), 10 + (layout.buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Draw stats button
        const statsButtonX = this.game.canvas.width - (layout.buttonWidth * 3 + 40);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(statsButtonX, 10, layout.buttonWidth, layout.buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${layout.fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, 'STATS', statsButtonX + (layout.buttonWidth/2), 10 + (layout.buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Calculate UI layout
        let currentUIY = 10;
        
        // Make resource panel narrower on small screens
        let boxHeight = this.game.state.summerEventActive ? (layout.isNarrow ? 60 : 84) : (layout.isNarrow ? 240 : 318);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(layout.uiMargin, currentUIY, layout.boxWidth, boxHeight);
        
        this.drawResources(ctx, currentUIY, layout);
        
        currentUIY += boxHeight + 5;
        
        if (!this.game.pickaxe.isBroken) {
            this.drawDurabilityBar(ctx, currentUIY, layout);
            currentUIY += (layout.isNarrow ? 35 : 45) + 5;
        }

        const buffY = currentUIY;
        this.drawBuffIndicators(ctx, buffY, layout);

        currentUIY += 30; // space for buffs if they appear

        this.drawSummerEventButton(ctx, currentUIY, layout);

        if (this.game.gameOver) {
            this.drawGameOverScreen(ctx, layout.isNarrow);
        }
    }
    
    drawResources(ctx, currentUIY, layout) {
        const titleFontSize = layout.isNarrow ? '11px' : '14px';
        const itemFontSize = layout.isNarrow ? '10px' : '13px';
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${titleFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        UILayout.drawTextWithShadow(ctx, 'Resources', 15, currentUIY + (layout.isNarrow ? 14 : 18), 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.9)', 1, 1);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, currentUIY + (layout.isNarrow ? 18 : 24));
        ctx.lineTo(layout.boxWidth - 5, currentUIY + (layout.isNarrow ? 18 : 24));
        ctx.stroke();

        const itemHeight = layout.isNarrow ? 18 : 22;
        const iconSize = layout.isNarrow ? 12 : 16;
        const textOffset = layout.isNarrow ? 18 : 25;
        let itemY = currentUIY + (layout.isNarrow ? 22 : 32);

        const resourcesToDraw = this.game.state.summerEventActive ? 
            ['sand', 'sandstone'] : 
            ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'obsidian'];

        resourcesToDraw.forEach(res => {
            const iconKey = res === 'stone' ? 'stone' : res === 'obsidian' ? 'obsidian' : res === 'sand' ? 'sand' : res === 'sandstone' ? 'sandstone' : `${res}Icon`;
            const icon = this.game.assetLoader.getAsset(iconKey);
            if (icon && icon.complete) {
                ctx.drawImage(icon, 15, itemY, iconSize, iconSize);
            } else {
                ctx.fillStyle = '#666';
                ctx.fillRect(15, itemY, iconSize, iconSize);
            }

            const name = res.charAt(0).toUpperCase() + res.slice(1);
            ctx.fillStyle = 'white';
            ctx.font = `${itemFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
            UILayout.drawTextWithShadow(ctx, name, 15 + textOffset, itemY + (iconSize/2) + 3, 'rgba(0,0,0,0.7)', 'white', 1, 1);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `bold ${itemFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'right';
            UILayout.drawTextWithShadow(ctx, `${UILayout.formatNumber(this.game.state.resources[res])}`, layout.boxWidth - 5, itemY + (iconSize/2) + 3, 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.8)', 1, 1);
            ctx.textAlign = 'left';

            itemY += itemHeight;
        });
    }

    drawDurabilityBar(ctx, currentUIY, layout) {
        const durabilityBarHeight = layout.isNarrow ? 35 : 45;
        const fontSize = layout.isNarrow ? '10px' : '12px';
        const smallFontSize = layout.isNarrow ? '8px' : '10px';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(layout.uiMargin, currentUIY, layout.boxWidth, durabilityBarHeight);
        
        const variant = this.game.pickaxe.getCurrentVariant();
        const durabilityPercent = this.game.pickaxe.getDurabilityPercent();
        
        // Warning text for low durability
        let titleColor = 'white';
        let titleText = `${variant.name.charAt(0).toUpperCase() + variant.name.slice(1)} Pickaxe`;
        
        if (durabilityPercent <= 0.25 && durabilityPercent > 0) {
            titleColor = '#FF4444';
            titleText = `⚠ ${titleText} ⚠`;
        } else if (durabilityPercent <= 0.1 && durabilityPercent > 0) {
            titleColor = '#FF0000';
            titleText = `⚠⚠ CRITICAL ${titleText.replace('⚠ ', '').replace(' ⚠', '')} ⚠⚠`;
        }
        
        ctx.fillStyle = titleColor;
        ctx.font = `${fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        UILayout.drawTextWithShadow(ctx, titleText, 15, currentUIY + (layout.isNarrow ? 12 : 15), 'rgba(0,0,0,0.7)', titleColor, 1, 1);
        
        const barY = currentUIY + (layout.isNarrow ? 16 : 20);
        const barHeight = layout.isNarrow ? 12 : 15;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(15, barY, layout.boxWidth - 20, barHeight);
        
        const fillWidth = (layout.boxWidth - 20) * durabilityPercent;
        
        if (durabilityPercent > 0.5) ctx.fillStyle = '#4CAF50';
        else if (durabilityPercent > 0.25) ctx.fillStyle = '#FF9800';
        else ctx.fillStyle = '#F44336';
        
        ctx.fillRect(15, barY, fillWidth, barHeight);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${smallFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, `${variant.durability}/${variant.maxDurability}`, layout.uiMargin + layout.boxWidth / 2, barY + (barHeight/2) + 3, 'rgba(0,0,0,0.9)', 'rgba(255, 255, 255, 0.9)', 1, 1);
        ctx.textAlign = 'left';
    }

    drawSummerEventButton(ctx, y, layout) {
        const { uiMargin, isNarrow } = layout;
        const buttonHeight = isNarrow ? 24 : 30;
        const buttonWidth = isNarrow ? 55 : 70;
        const fontSize = isNarrow ? '8px' : '10px';
        const iconSize = isNarrow ? 18 : 24;
        
        ctx.fillStyle = this.game.state.summerEventActive ? 'rgba(255, 165, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(uiMargin, y, buttonWidth, buttonHeight);
        
        const iceCreamIcon = this.game.assetLoader.getAsset('iceCreamIcon');
        const textColor = this.game.state.summerEventActive ? 'black' : 'white';
        if (iceCreamIcon && iceCreamIcon.complete) {
            const iconY = y + (buttonHeight - iconSize) / 2;
            ctx.drawImage(iceCreamIcon, uiMargin + 5, iconY, iconSize, iconSize);
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
            const textX = uiMargin + 5 + iconSize + (isNarrow ? 2 : 3);
            UILayout.drawTextWithShadow(ctx, 'SUMMER', textX, y + (buttonHeight/2) - 3, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            UILayout.drawTextWithShadow(ctx, 'EVENT', textX, y + (buttonHeight/2) + 7, 'rgba(0,0,0,0.7)', textColor, 1, 1);
        } else {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            UILayout.drawTextWithShadow(ctx, 'SUMMER', uiMargin + buttonWidth/2, y + (buttonHeight/2) - 3, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            UILayout.drawTextWithShadow(ctx, 'EVENT', uiMargin + buttonWidth/2, y + (buttonHeight/2) + 7, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            ctx.textAlign = 'left';
        }
    }
    
    drawGameOverScreen(ctx, isNarrow = false) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        const titleFontSize = isNarrow ? '32px' : '48px';
        const subtitleFontSize = isNarrow ? '18px' : '24px';
        const infoFontSize = isNarrow ? '14px' : '18px';
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${titleFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, 'PICKAXE BROKEN!', this.game.canvas.width / 2, this.game.canvas.height / 2 - (isNarrow ? 30 : 50), 'rgba(0,0,0,0.7)', 'white', 2, 2);
        
        ctx.font = `${subtitleFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        UILayout.drawTextWithShadow(ctx, 'Click to restart with a new pickaxe', this.game.canvas.width / 2, this.game.canvas.height / 2 + 10, 'rgba(0,0,0,0.7)', 'white', 2, 2);
        
        ctx.font = `${infoFontSize} "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        UILayout.drawTextWithShadow(ctx, 'Your resources have been saved!', this.game.canvas.width / 2, this.game.canvas.height / 2 + (isNarrow ? 35 : 50), 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.8)', 1, 1);
        
        ctx.textAlign = 'left';
    }

    drawBuffIndicators(ctx, startY, layout) {
        let currentY = startY;
        if (this.game.pickaxeSizeBuff.active) {
            this.drawBuffIndicator(ctx, currentY, layout, 'Size Up!', this.game.pickaxeSizeBuff.timer / this.game.pickaxeSizeBuff.duration, '#2196F3');
            currentY += (layout.isNarrow ? 24 : 30);
        }
    }

    drawBuffIndicator(ctx, y, layout, text, progress, color) {
        const height = layout.isNarrow ? 20 : 25;
        const fontSize = layout.isNarrow ? '10px' : '12px';

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(layout.uiMargin, y, layout.boxWidth, height);

        // Progress Fill
        ctx.fillStyle = color;
        ctx.fillRect(layout.uiMargin, y, layout.boxWidth * progress, height);

        // Text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize} "Minecraft Seven", monospace`;
        ctx.textAlign = 'center';
        UILayout.drawTextWithShadow(ctx, text, layout.uiMargin + layout.boxWidth / 2, y + height / 2 + 4, 'rgba(0,0,0,0.8)', 'white');
        ctx.textAlign = 'left';
    }

    drawBackground(ctx) {
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = isDarkMode ? '#111' : '#EFEFEF';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        this.drawAnimatedGrid(ctx, isDarkMode);
    }

    createBackgroundPattern(isDarkMode) {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        const gridSize = 40;
        patternCanvas.width = gridSize;
        patternCanvas.height = gridSize;

        patternCtx.fillStyle = isDarkMode ? '#111' : '#EFEFEF';
        patternCtx.fillRect(0, 0, gridSize, gridSize);
        patternCtx.strokeStyle = isDarkMode ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.4)';
        patternCtx.lineWidth = 1;
        
        patternCtx.beginPath();
        patternCtx.moveTo(gridSize - 0.5, 0);
        patternCtx.lineTo(gridSize - 0.5, gridSize);
        patternCtx.stroke();
        
        patternCtx.beginPath();
        patternCtx.moveTo(0, gridSize - 0.5);
        patternCtx.lineTo(gridSize, gridSize - 0.5);
        patternCtx.stroke();
        
        this.backgroundPattern = this.game.backgroundCtx.createPattern(patternCanvas, 'repeat');
    }

    drawAnimatedGrid(ctx, isDarkMode) {
        if (!this.backgroundPattern) {
            this.createBackgroundPattern(isDarkMode);
        }
        
        const pattern = this.backgroundPattern;
        if (pattern) {
            const offsetX = (this.game.camera.x * 0.1) % 40;
            const offsetY = (this.game.camera.y * 0.1) % 40;
            ctx.save();
            ctx.translate(-offsetX, -offsetY);
            ctx.fillStyle = pattern;
            ctx.fillRect(offsetX, offsetY, this.game.canvas.width + 40, this.game.canvas.height + 40);
            ctx.restore();
        }
    }

    getSummerEventButtonRect() {
        const layout = UILayout.calculateMobileLayout(this.game.canvas);
        const { uiMargin, isNarrow } = layout;

        let y = 10;
        y += this.game.state.summerEventActive ? (isNarrow ? 60 : 84) : (isNarrow ? 240 : 318);
        y += 5; // Margin after resource box

        if (!this.game.pickaxe.isBroken) {
            y += (isNarrow ? 35 : 45) + 5; // Durability bar height + margin
        }

        // Add height for any active buffs
        if (this.game.pickaxeSizeBuff.active) {
            y += (isNarrow ? 24 : 30);
        }
        // NOTE: This space is hardcoded in drawOverlays, so we reflect that here.
        // It's not ideal, but it's consistent with the drawing logic.
        y += 30;

        return {
            x: uiMargin,
            y: y,
            width: isNarrow ? 55 : 70,
            height: isNarrow ? 24 : 30,
        };
    }
}