export class ShopUI {
    constructor(shop, assetLoader) {
        this.shop = shop;
        this.game = shop.game;
        this.state = shop.state;
        this.assetLoader = assetLoader;
        this.backgroundCache = null;
        this.summerBackgroundCache = null;
    }

    draw(ctx, canvas) {
        if (this.state.summerEventActive) {
            this.drawSummerShop(ctx, canvas);
        } else {
            this.drawMainShop(ctx, canvas);
        }
    }
    
    drawShopBackground(ctx, canvas) {
        if (this.backgroundCache) {
            ctx.drawImage(this.backgroundCache, 0, 0);
            return;
        }
        
        const cache = document.createElement('canvas');
        cache.width = canvas.width;
        cache.height = canvas.height;
        const cacheCtx = cache.getContext('2d');
        
        cacheCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        cacheCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = this.assetLoader.getAsset('stone');
        if (texture && texture.complete) {
            cacheCtx.globalAlpha = 0.15;
            const pattern = cacheCtx.createPattern(texture, 'repeat');
            cacheCtx.fillStyle = pattern;
            cacheCtx.fillRect(0, 0, canvas.width, canvas.height);
            cacheCtx.globalAlpha = 1;
        }
        
        ctx.drawImage(cache, 0, 0);
        this.backgroundCache = cache;
    }

    drawSummerShopBackground(ctx, canvas) {
        if (this.summerBackgroundCache) {
            ctx.drawImage(this.summerBackgroundCache, 0, 0);
            return;
        }

        const cache = document.createElement('canvas');
        cache.width = canvas.width;
        cache.height = canvas.height;
        const cacheCtx = cache.getContext('2d');
        
        const texture = this.assetLoader.getAsset('sand');
        if (texture && texture.complete) {
            cacheCtx.fillStyle = this.assetLoader.getAsset('sand');
            const pattern = cacheCtx.createPattern(texture, 'repeat');
            cacheCtx.fillStyle = pattern;
            cacheCtx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            cacheCtx.fillStyle = '#F4E4BC'; // Fallback sand color
            cacheCtx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Add a blue "water" area at the top
        const gradient = cacheCtx.createLinearGradient(0, 0, 0, 150);
        gradient.addColorStop(0, '#3E83C4');
        gradient.addColorStop(1, '#6AADD8');
        cacheCtx.fillStyle = gradient;
        cacheCtx.fillRect(0, 0, canvas.width, 100);
        
        ctx.drawImage(cache, 0, 0);
        this.summerBackgroundCache = cache;
    }

    drawTextWithShadow(ctx, text, x, y, shadowColor, textColor, shadowX = 2, shadowY = 2) {
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowX, y + shadowY);
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);
    }

    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }

    drawHeader(ctx, canvas, isSummer = false) {
        const moneyIcon = this.assetLoader.getAsset('moneyIcon');
        ctx.font = 'bold 24px "Minecraft Seven", monospace';
        ctx.textAlign = 'right';
        const moneyText = `${this.formatNumber(this.state.money)}`;
        const textWidth = ctx.measureText(moneyText).width;
        
        const moneyBoxX = canvas.width / 2 - (textWidth + 40) / 2;
        const moneyBoxWidth = textWidth + 50;
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(moneyBoxX, 20, moneyBoxWidth, 40);
        
        this.drawTextWithShadow(ctx, moneyText, moneyBoxX + moneyBoxWidth - 15, 48, '#333', '#FFD700');
        
        if (moneyIcon && moneyIcon.complete) {
            ctx.drawImage(moneyIcon, moneyBoxX + 10, 25, 30, 30);
        }

        ctx.textAlign = 'left';

        // Exit Button
        const exitButtonX = canvas.width - 120;
        ctx.fillStyle = isSummer ? '#E53935' : '#D32F2F';
        ctx.fillRect(exitButtonX, 20, 100, 40);
        ctx.font = 'bold 20px "Minecraft Seven", monospace';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'EXIT', exitButtonX + 50, 48, isSummer ? '#8f1f1f' : '#555', 'white');
        ctx.textAlign = 'left';
    }

    drawSectionTitle(ctx, title, y) {
        ctx.font = 'bold 28px "Minecraft Seven", monospace';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, title, this.game.canvas.width / 2, y, '#333', '#FFF');
        ctx.textAlign = 'left';
    }

    drawButton(ctx, text, x, y, width, height, enabled = true, fontSize = 16) {
        const color = enabled ? '#4CAF50' : '#555';
        const shadowColor = enabled ? '#2e6b31' : '#333';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.font = `bold ${fontSize}px "Minecraft Seven", monospace`;
        ctx.textAlign = 'center';
        
        const yOffset = fontSize <= 14 ? 5 : 6;
        this.drawTextWithShadow(ctx, text, x + width / 2, y + height / 2 + yOffset, shadowColor, 'white');
        ctx.textAlign = 'left';
    }

    drawMainShop(ctx, canvas) {
        this.drawShopBackground(ctx, canvas);
        this.drawHeader(ctx, canvas);
        
        ctx.save();
        ctx.translate(0, -this.shop.shopScrollY);

        const isNarrow = canvas.width < 450;
        const margin = 20;
        const cardWidth = Math.min(550, canvas.width * 0.9);
        const leftX = (canvas.width - cardWidth) / 2;
        let currentY = 100;

        // --- Sections ---
        currentY = this.drawResourceSelling(ctx, currentY, leftX, cardWidth, isNarrow);
        currentY = this.drawSellAllSection(ctx, currentY, leftX, cardWidth, isNarrow);
        currentY = this.drawSmelting(ctx, currentY, leftX, cardWidth, isNarrow);
        currentY = this.drawSmeltedSelling(ctx, currentY, leftX, cardWidth, isNarrow);
        currentY = this.drawEnchantments(ctx, currentY, leftX, cardWidth, isNarrow);
        currentY = this.drawPickaxes(ctx, currentY, leftX, cardWidth, isNarrow);
        
        ctx.restore();
        this.shop.maxShopScrollY = Math.max(0, currentY - canvas.height + this.shop.shopScrollY + 50);
    }

    drawSellAllSection(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Quick Sell', startY + 40);
        let currentY = startY + 70;
        
        // Sell All Resources button
        ctx.fillStyle = 'rgba(0,50,100,0.6)';
        ctx.fillRect(x, currentY, width, 80);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(x, currentY, width, 80);
        
        ctx.font = 'bold 24px "Minecraft Seven", monospace';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'Sell All Resources', x + width / 2, currentY + 35, '#333', '#FFD700');
        
        const totalValue = this.calculateAllResourcesValue();
        ctx.font = '16px "Minecraft Seven", monospace';
        this.drawTextWithShadow(ctx, `Total Value: ${this.formatNumber(totalValue)} coins`, x + width / 2, currentY + 60, '#333', '#4CAF50');
        
        ctx.textAlign = 'left';
        
        return currentY + 90;
    }

    calculateAllResourcesValue() {
        let total = 0;
        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        resources.forEach(res => {
            total += (this.state.resources[res] || 0) * this.state.sellPrices[res];
        });
        
        // Add smelted resources
        const smeltableResources = ['copper', 'iron', 'gold'];
        smeltableResources.forEach(res => {
            total += (this.state.smeltedResources[res] || 0) * this.state.smeltedSellPrices[res];
        });
        
        return total;
    }

    drawResourceSelling(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Sell Resources', startY + 40);
        let currentY = startY + 70;
        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        
        resources.forEach(res => {
            this.drawResourceCard(ctx, res, this.state.resources[res], this.state.sellPrices[res], 'Sell', this.shop.sellResource.bind(this.shop), currentY, x, width, isNarrow);
            currentY += 105;
        });
        return currentY;
    }
    
    drawSmelting(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Smelt Items', startY + 40);
        let currentY = startY + 70;
        const smeltableResources = ['copper', 'iron', 'gold'];
        
        smeltableResources.forEach(res => {
            this.drawResourceCard(ctx, res, this.state.resources[res], `1 Coal`, 'Smelt', this.shop.smeltResource.bind(this.shop), currentY, x, width, isNarrow, true);
            currentY += 105;
        });
        return currentY;
    }
    
    drawSmeltedSelling(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Sell Ingots', startY + 40);
        let currentY = startY + 70;
        const smeltableResources = ['copper', 'iron', 'gold'];

        smeltableResources.forEach(res => {
            this.drawResourceCard(ctx, `${res}_ingot`, this.state.smeltedResources[res], this.state.smeltedSellPrices[res], 'Sell', this.shop.sellSmeltedResource.bind(this.shop), currentY, x, width, isNarrow);
            currentY += 105;
        });
        return currentY;
    }
    
    drawResourceCard(ctx, resource, amount, price, actionText, actionFn, y, x, width, isNarrow, isSmelting = false) {
        // Card background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, width, 95);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(x, y, width, 95);

        // Icon
        const iconKey = resource.includes('_ingot') ? `${resource.replace('_ingot', '')}IngotIcon` : (this.assetLoader.getAsset(`${resource}Icon`) ? `${resource}Icon` : resource);
        const icon = this.assetLoader.getAsset(iconKey);
        if (icon && icon.complete) {
            ctx.drawImage(icon, x + 15, y + 15, 64, 64);
        }

        // Text
        ctx.font = 'bold 20px "Minecraft Seven", monospace';
        const resourceName = resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        this.drawTextWithShadow(ctx, resourceName, x + 90, y + 35, '#333', 'white');
        
        ctx.font = '16px "Minecraft Seven", monospace';
        this.drawTextWithShadow(ctx, `Owned: ${this.formatNumber(amount)}`, x + 90, y + 60, '#333', '#eee');
        
        const priceText = isSmelting ? `Cost: ${price}` : `Value: ${price}`;
        this.drawTextWithShadow(ctx, priceText, x + 90, y + 80, '#333', '#FFD700');

        // Buttons
        const buttonWidth = 75;
        const buttonHeight = 30;
        const hasAmount = amount > 0;
        const coalPerItem = this.state.smeltingCost.coal || 1;
        const hasCoal = isSmelting ? this.state.resources.coal >= coalPerItem : true;

        this.drawButton(ctx, `${actionText} 1`, x + width - 15 - buttonWidth * 2 - 10, y + 32, buttonWidth, buttonHeight, hasAmount && hasCoal);
        this.drawButton(ctx, `${actionText} All`, x + width - 15 - buttonWidth, y + 32, buttonWidth, buttonHeight, hasAmount && hasCoal);
    }

    drawEnchantments(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Enchant Pickaxe', startY + 40);
        let currentY = startY + 70;
        const enchantments = [
            { id: 'efficiency', name: 'Efficiency', desc: 'Break blocks faster.' },
            { id: 'unbreaking', name: 'Unbreaking', desc: 'Pickaxe has a chance to not take damage.' },
            { id: 'fortune', name: 'Fortune', desc: 'Chance to get more resources from ores.' }
        ];

        enchantments.forEach(enchant => {
            this.drawEnchantmentCard(ctx, enchant, currentY, x, width, isNarrow);
            currentY += 120;
        });

        return currentY;
    }

    drawEnchantmentCard(ctx, enchant, y, x, width, isNarrow) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, width, 110);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(x, y, width, 110);
        
        const icon = this.assetLoader.getAsset('enchantedBook');
        if (icon && icon.complete) {
            ctx.drawImage(icon, x + 15, y + 23, 64, 64);
        }
        
        const currentLevel = this.state.enchantmentLevels[enchant.id];
        const maxLevel = this.state.maxEnchantmentLevels[enchant.id];
        const levelText = currentLevel >= maxLevel ? ` (MAX)` : ` ${'I'.repeat(currentLevel + 1)}`;
        ctx.font = 'bold 20px "Minecraft Seven", monospace';
        this.drawTextWithShadow(ctx, enchant.name + levelText, x + 90, y + 35, '#333', '#d85dff');
        
        ctx.font = '14px "Minecraft Seven", monospace';
        this.drawTextWithShadow(ctx, enchant.desc, x + 90, y + 55, '#333', '#eee');
        
        if (currentLevel < maxLevel) {
            const cost = this.state.getEnchantmentCost(enchant.id, currentLevel);
            const costText = `${this.formatNumber(cost.money)} coins, ${this.formatNumber(cost.lapis)} Lapis`;
            this.drawTextWithShadow(ctx, `Cost: ${costText}`, x + 90, y + 75, '#333', '#FFD700');
            
            const canAfford = this.state.money >= cost.money && this.state.resources.lapis >= cost.lapis;
            this.drawButton(ctx, 'Upgrade', x + width - 15 - 80, y + (110 - 30) / 2, 75, 30, canAfford);
        } else {
             this.drawTextWithShadow(ctx, 'Max Level Reached!', x + 90, y + 75, '#333', '#4CAF50');
        }
    }
    
    drawPickaxes(ctx, startY, x, width, isNarrow) {
        this.drawSectionTitle(ctx, 'Upgrade Pickaxe', startY + 40);
        let currentY = startY + 70;
        const pickaxes = Object.keys(this.state.pickaxePrices).filter(p => {
            const pickaxeData = this.state.pickaxePrices[p];
            // Show if it's not a summer event pickaxe, OR if it's a summer event pickaxe that is unlocked.
            return !pickaxeData.requiresSummerEvent || pickaxeData.unlocked;
        });

        pickaxes.forEach(key => {
            this.drawPickaxeCard(ctx, key, currentY, x, width, isNarrow);
            currentY += 120;
        });

        return currentY;
    }

    drawPickaxeCard(ctx, type, y, x, width, isNarrow, buttonWidth = 75, buttonHeight = 30) {
        const pickaxeData = this.state.pickaxePrices[type];
        const isEquipped = this.game.pickaxe.variants[this.game.pickaxe.currentVariant].name === type;

        ctx.fillStyle = isEquipped ? 'rgba(0,50,150,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, width, 110);
        ctx.strokeStyle = isEquipped ? '#87CEFA' : 'rgba(255,255,255,0.2)';
        ctx.strokeRect(x, y, width, 110);
        
        const icon = this.assetLoader.getAsset(`${type}Pickaxe`);
        if (icon && icon.complete) {
            ctx.drawImage(icon, x + 15, y + 23, 64, 64);
        }
        
        const nameText = type.charAt(0).toUpperCase() + type.slice(1);
        ctx.font = 'bold 20px "Minecraft Seven", monospace';
        this.drawTextWithShadow(ctx, nameText, x + 90, y + 35, '#333', 'white');
        
        if (pickaxeData.unlocked) {
            const buttonText = isEquipped ? 'Equipped' : 'Equip';
            const fontSize = isEquipped ? 14 : 16;
            this.drawButton(ctx, buttonText, x + width - 15 - buttonWidth, y + 40, buttonWidth, buttonHeight, !isEquipped, fontSize);
            
            // Show stats for unlocked pickaxes
            const variantData = this.game.pickaxe.variants.find(v => v.name === type);
            if (variantData) {
                ctx.font = '14px "Minecraft Seven", monospace';
                this.drawTextWithShadow(ctx, `Power: ${variantData.power}, Dur: ${variantData.maxDurability}`, x + 90, y + 60, '#333', '#eee');
                if (variantData.ability) {
                    const abilityName = variantData.ability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                     this.drawTextWithShadow(ctx, `Ability: ${abilityName}`, x + 90, y + 80, '#333', '#50C878');
                }
            }
        } else {
            let canAfford = this.state.money >= pickaxeData.price;
            const reqs = [];
            if (pickaxeData.price > 0) {
                reqs.push(`${this.formatNumber(pickaxeData.price)} coins`);
            }
            
            for (const [item, amount] of Object.entries(pickaxeData.requirements || {})) {
                const itemName = item.replace('_ingot', '').charAt(0).toUpperCase() + item.replace('_ingot', '').slice(1);
                reqs.push(`${amount} ${itemName}`);
                const userAmount = item.includes('_ingot') ? this.state.smeltedResources[item.replace('_ingot', '')] : this.state.resources[item];
                if (!userAmount || userAmount < amount) canAfford = false;
            }

            const reqText = reqs.join(', ');
            ctx.font = '14px "Minecraft Seven", monospace';
            this.drawTextWithShadow(ctx, `Cost: ${reqText}`, x + 90, y + 60, '#333', '#FFD700');
            this.drawButton(ctx, 'Buy', x + width - 15 - buttonWidth, y + 40, buttonWidth, buttonHeight, canAfford);
        }
    }

    drawSummerShop(ctx, canvas) {
        this.drawSummerShopBackground(ctx, canvas);
        this.drawHeader(ctx, canvas, true);

        const isNarrow = canvas.width < 450;
        const margin = 20;
        const cardWidth = Math.min(550, canvas.width * 0.9);
        const leftX = (canvas.width - cardWidth) / 2;
        let currentY = 120;

        const summerPickaxes = ['lava', 'blaze', 'fish'];
        summerPickaxes.forEach(key => {
            this.drawPickaxeCard(ctx, key, currentY, leftX, cardWidth, isNarrow, 85, 40);
            currentY += 130;
        });

        this.drawResourceCard(ctx, 'sand', this.state.resources.sand, this.state.sellPrices.sand, 'Sell', this.shop.sellResource.bind(this.shop), currentY, leftX, cardWidth, isNarrow);
        currentY += 105;
        this.drawResourceCard(ctx, 'sandstone', this.state.resources.sandstone, this.state.sellPrices.sandstone, 'Sell', this.shop.sellResource.bind(this.shop), currentY, leftX, cardWidth, isNarrow);
    }
}