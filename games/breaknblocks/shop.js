import { ShopUI } from './shop-ui.js';
import { ResourceManager } from './resource-manager.js';

export class Shop {
    constructor(game) {
        this.game = game;
        this.state = game.state;
        this.ui = new ShopUI(this, game.assetLoader);
        this.resourceManager = new ResourceManager(this.state);
        this.showShop = false;
        this.shopScrollY = 0;
        this.maxShopScrollY = 0;
        this.isScrolling = false;
    }

    show() {
        this.showShop = true;
        this.shopScrollY = 0;
        this.ui.backgroundCache = null; // Invalidate cache to redraw
        this.ui.summerBackgroundCache = null;
    }

    hide() {
        this.showShop = false;
        this.shopScrollY = 0;
    }

    handleClick(clickX, clickY) {
        const isNarrow = this.game.canvas.width < 450;

        // Check if summer event is active - handle different clicks
        if (this.state.summerEventActive) {
            this.handleSummerEventClick(clickX, clickY);
            return;
        }

        const margin = 20;
        const cardWidth = Math.min(550, this.game.canvas.width * 0.9); 
        const leftX = (this.game.canvas.width - cardWidth) / 2; // Center the cards
        
        // Exit shop button (fixed position, not affected by scroll)
        const exitButtonX = this.game.canvas.width - 120;
        const exitButtonY = 20;
        if (clickX >= exitButtonX && clickX <= exitButtonX + 100 &&
            clickY >= exitButtonY && clickY <= exitButtonY + 40) {
            this.hide();
            return;
        }

        // Reset progress button (fixed position, not affected by scroll)
        const resetButtonX = 20;
        const resetButtonY = 20;
        if (clickX >= resetButtonX && clickX <= resetButtonX + 100 &&
            clickY >= resetButtonY && clickY <= resetButtonY + 40) {
            if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
                this.game.resetProgress();
            }
            return;
        }

        let scrolledClickY = clickY;
        // Only adjust clickY for scrollable content (below header)
        if (clickY > 100) {
            scrolledClickY += this.shopScrollY;
        }

        // --- SECTION VARIABLES ---
        const cardPadding = 15;
        const buttonWidth = isNarrow ? 70 : 75;
        const buttonHeight = 30;
        let currentY = 100; // Start from header bottom

        // --- Resource selling buttons ---
        currentY += 70; // Section title space
        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        resources.forEach((resource, index) => {
            const cardY = currentY + index * 105;
            
            // Sell 1 button
            const sell1X = leftX + cardWidth - cardPadding - buttonWidth * 2 - 10;
            const sell1Y = cardY + 32;
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                scrolledClickY >= sell1Y && scrolledClickY <= sell1Y + buttonHeight &&
                this.state.resources[resource] > 0) {
                this.sellResource(resource, 1);
                return;
            }
            
            // Sell All button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = cardY + 32;
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                scrolledClickY >= sellAllY && scrolledClickY <= sellAllY + buttonHeight &&
                this.state.resources[resource] > 0) {
                this.sellResource(resource, this.state.resources[resource]);
                return;
            }
        });
        currentY += resources.length * 105 + 70;

        // --- Sell All Resources button ---
        const sellAllSectionY = currentY;
        if (clickX >= leftX && clickX <= leftX + cardWidth &&
            scrolledClickY >= sellAllSectionY && scrolledClickY <= sellAllSectionY + 80) {
            this.sellAllResources();
            return;
        }
        currentY += 90;

        // --- Smelting buttons ---
        const smeltableResources = ['copper', 'iron', 'gold'];
        smeltableResources.forEach((resource, index) => {
            const cardY = currentY + index * 105;
            
            // Smelt 1 button
            const smelt1X = leftX + cardWidth - cardPadding - buttonWidth * 2 - 10;
            const smelt1Y = cardY + 32;
            if (clickX >= smelt1X && clickX <= smelt1X + buttonWidth &&
                scrolledClickY >= smelt1Y && scrolledClickY <= smelt1Y + buttonHeight &&
                this.state.resources[resource] > 0 && this.state.resources.coal > 0) {
                this.smeltResource(resource, 1);
                return;
            }
            
            // Smelt All button
            const smeltAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const smeltAllY = cardY + 32;
            if (clickX >= smeltAllX && clickX <= smeltAllX + buttonWidth &&
                scrolledClickY >= smeltAllY && scrolledClickY <= smeltAllY + buttonHeight &&
                this.state.resources[resource] > 0 && this.state.resources.coal > 0) {
                const coalPerItem = this.state.smeltingCost.coal || 1;
                const maxSmeltFromCoal = Math.floor(this.state.resources.coal / coalPerItem);
                const maxSmelt = Math.min(this.state.resources[resource], maxSmeltFromCoal);
                this.smeltResource(resource, maxSmelt);
                return;
            }
        });
        currentY += smeltableResources.length * 105 + 70;

        // --- Smelted resource selling buttons ---
        smeltableResources.forEach((resource, index) => {
            const cardY = currentY + index * 105;
            
            // Sell 1 smelted button
            const sell1X = leftX + cardWidth - cardPadding - buttonWidth * 2 - 10;
            const sell1Y = cardY + 32;
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                scrolledClickY >= sell1Y && scrolledClickY <= sell1Y + buttonHeight &&
                this.state.smeltedResources[resource] > 0) {
                this.sellSmeltedResource(resource, 1);
                return;
            }
            
            // Sell All smelted button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = cardY + 32;
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                scrolledClickY >= sellAllY && scrolledClickY <= sellAllY + buttonHeight &&
                this.state.smeltedResources[resource] > 0) {
                this.sellSmeltedResource(resource, this.state.smeltedResources[resource]);
                return;
            }
        });
        currentY += smeltableResources.length * 105 + 70;

        // --- Enchantment upgrade buttons ---
        const enchantmentTypes = ['efficiency', 'unbreaking', 'fortune'];
        enchantmentTypes.forEach((type, index) => {
            const cardY = currentY + index * 120;
            const buttonY = cardY + 40;

            const currentLevel = this.state.enchantmentLevels[type];
            const maxLevel = this.state.maxEnchantmentLevels[type];
            
            if (currentLevel < maxLevel) {
                const buttonX = leftX + cardWidth - cardPadding - 75;
                if (clickX >= buttonX && clickX <= buttonX + 75 &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + 30) {
                    this.buyEnchantment(type);
                    return;
                }
            }
        });
        currentY += enchantmentTypes.length * 120 + 70;

        // --- Pickaxe purchase/equip buttons ---
        const pickaxeTypes = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'obsidian', 'netherite'];
        pickaxeTypes.forEach((type, index) => {
            const cardY = currentY + index * 120;
            const buttonY = cardY + 40;
            
            const pickaxeData = this.state.pickaxePrices[type];
            const buttonX = leftX + cardWidth - cardPadding - 75;
            
            if (!pickaxeData.unlocked) {
                // Buy button
                if (clickX >= buttonX && clickX <= buttonX + 75 &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + 30) {
                    this.buyPickaxe(type);
                    return;
                }
            } else {
                // Equip button
                const isCurrentlyEquipped = this.game.pickaxe.variants[this.game.pickaxe.currentVariant].name === type;
                if (!isCurrentlyEquipped && clickX >= buttonX && clickX <= buttonX + 75 &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + 30) {
                    this.equipPickaxe(type, index);
                    return;
                }
            }
        });

        // Check for unlocked event pickaxes to handle their clicks
        const eventPickaxes = ['lava', 'blaze', 'fish'];
        const unlockedEventPickaxes = eventPickaxes.filter(key => this.state.pickaxePrices[key].unlocked);

        if (unlockedEventPickaxes.length > 0) {
            currentY += 100; // Spacing for event pickaxe section
            let eventPickaxeSectionContentY = currentY + 70;
            const eventPickaxeMap = { lava: 7, blaze: 8, fish: 9 };

            unlockedEventPickaxes.forEach((type) => {
                const index = eventPickaxeMap[type];
                const cardY = eventPickaxeSectionContentY;
                const buttonY = cardY + 30;
                const buttonX = leftX + cardWidth - cardPadding - buttonWidth - 5;

                // Equip button for event pickaxe
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + buttonHeight) {
                    this.equipPickaxe(type, index);
                }
                eventPickaxeSectionContentY += 120;
            });
        }
    }

    handleSummerEventClick(clickX, clickY) {
        // Close button
        const exitButtonX = this.game.canvas.width - 120;
        const exitButtonY = 20;
        if (clickX >= exitButtonX && clickX <= exitButtonX + 100 &&
            clickY >= exitButtonY && clickY <= exitButtonY + 40) {
            this.hide();
            return;
        }

        const margin = 20;
        const cardWidth = Math.min(550, this.game.canvas.width * 0.9);
        const leftX = (this.game.canvas.width - cardWidth) / 2;

        // --- Summer Event Layout Variables ---
        const cardPadding = 15;
        const buttonWidth = 85;
        const buttonHeight = 40;
        let currentY = 120;

        // Lava Pickaxe button
        const lavaCardY = currentY;
        const lavaButtonY = lavaCardY + 35;
        const lavaButtonX = leftX + cardWidth - cardPadding - buttonWidth;
        const lavaData = this.state.pickaxePrices.lava;
        
        if (clickX >= lavaButtonX && clickX <= lavaButtonX + buttonWidth &&
            clickY >= lavaButtonY && clickY <= lavaButtonY + buttonHeight) {
            if (lavaData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 7) this.equipPickaxe('lava', 7);
            } else if (this.state.money >= lavaData.price) {
                this.state.money -= lavaData.price;
                lavaData.unlocked = true;
                this.equipPickaxe('lava', 7);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Blaze Pickaxe button
        const blazeCardY = currentY;
        const blazeButtonY = blazeCardY + 35;
        const blazeButtonX = leftX + cardWidth - cardPadding - buttonWidth;
        const blazeData = this.state.pickaxePrices.blaze;
        
        if (clickX >= blazeButtonX && clickX <= blazeButtonX + buttonWidth &&
            clickY >= blazeButtonY && clickY <= blazeButtonY + buttonHeight) {
            if (blazeData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 8) this.equipPickaxe('blaze', 8);
            } else if (this.state.money >= blazeData.price) {
                this.state.money -= blazeData.price;
                blazeData.unlocked = true;
                this.equipPickaxe('blaze', 8);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Fish Pickaxe button
        const fishCardY = currentY;
        const fishButtonY = fishCardY + 35;
        const fishButtonX = leftX + cardWidth - cardPadding - buttonWidth;
        const fishData = this.state.pickaxePrices.fish;

        if (clickX >= fishButtonX && clickX <= fishButtonX + buttonWidth &&
            clickY >= fishButtonY && clickY <= fishButtonY + buttonHeight) {
            if (fishData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 9) this.equipPickaxe('fish', 9);
            } else if (this.state.money >= fishData.price) {
                this.state.money -= fishData.price;
                fishData.unlocked = true;
                this.equipPickaxe('fish', 9);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Sand selling buttons
        const sandCardY = currentY;
        const sandButtonY = sandCardY + 32;
        
        // Sand sell 1 button
        const sandSell1X = leftX + cardWidth - cardPadding - 150;
        if (clickX >= sandSell1X && clickX <= sandSell1X + 75 &&
            clickY >= sandButtonY && clickY <= sandButtonY + 30) {
            this.sellResource('sand', 1);
        }
        
        // Sand sell all button
        const sandSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandSellAllX && clickX <= sandSellAllX + 75 &&
            clickY >= sandButtonY && clickY <= sandButtonY + 30) {
            this.sellResource('sand', this.state.resources.sand);
        }
        currentY += 105;

        // Sandstone selling buttons
        const sandstoneCardY = currentY;
        const sandstoneButtonY = sandstoneCardY + 32;
        
        // Sandstone sell 1 button
        const sandstoneSell1X = leftX + cardWidth - cardPadding - 150;
        if (clickX >= sandstoneSell1X && clickX <= sandstoneSell1X + 75 &&
            clickY >= sandstoneButtonY && clickY <= sandstoneButtonY + 30) {
            this.sellResource('sandstone', 1);
        }
        
        // Sandstone sell all button
        const sandstoneSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandstoneSellAllX && clickX <= sandstoneSellAllX + 75 &&
            clickY >= sandstoneButtonY && clickY <= sandstoneButtonY + 30) {
            this.sellResource('sandstone', this.state.resources.sandstone);
        }
    }

    sellResource(resource, amount) {
        if (this.resourceManager.sellResource(resource, amount)) {
            console.log(`Sold ${amount} ${resource}`);
        }
    }

    smeltResource(resource, amount) {
        if (this.resourceManager.smeltResource(resource, amount)) {
            console.log(`Smelted ${amount} ${resource}`);
        }
    }

    sellSmeltedResource(resource, amount) {
        if (this.resourceManager.sellSmeltedResource(resource, amount)) {
            console.log(`Sold ${amount} ${resource} ingots`);
        }
    }

    buyEnchantment(type) {
        const success = this.resourceManager.buyEnchantment(type);
        if (success) {
            this.game.createEnchantmentSparkles(); // Visual feedback
            this.game.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} enchantment upgraded!`, '#d85dff');
            console.log(`Bought ${type} enchantment`);
        }
        return success;
    }

    buyPickaxe(type) {
        if (this.resourceManager.buyPickaxe(type)) {
            console.log(`Bought ${type} pickaxe`);
        }
    }

    equipPickaxe(type, index) {
        if (this.state.pickaxePrices[type].unlocked && this.game.pickaxe.currentVariant !== index) {
            this.game.pickaxe.currentVariant = index;
            this.game.pickaxe.updateProperties();
            this.state.currentPickaxeVariant = index;
            this.state.saveAllState();
            console.log(`Equipped ${type} pickaxe`);
        }
    }

    sellAllResources() {
        let totalEarned = 0;
        let totalItemsSold = 0;
        
        // Sell all regular resources
        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        resources.forEach(res => {
            const amount = this.state.resources[res] || 0;
            if (amount > 0) {
                const earnings = amount * this.state.sellPrices[res];
                totalEarned += earnings;
                totalItemsSold += amount;
                this.state.resources[res] = 0;
            }
        });
        
        // Sell all smelted resources
        const smeltableResources = ['copper', 'iron', 'gold'];
        smeltableResources.forEach(res => {
            const amount = this.state.smeltedResources[res] || 0;
            if (amount > 0) {
                const earnings = amount * this.state.smeltedSellPrices[res];
                totalEarned += earnings;
                totalItemsSold += amount;
                this.state.smeltedResources[res] = 0;
            }
        });
        
        if (totalEarned > 0) {
            this.state.money += totalEarned;
            this.state.stats.moneyEarned = (this.state.stats.moneyEarned || 0) + totalEarned;
            this.state.saveAllState();
            
            this.game.showNotification(`Sold ${totalItemsSold} items for ${totalEarned} coins!`, '#FFD700');
            console.log(`Sold all resources for ${totalEarned} coins`);
        }
    }

    handleScroll(deltaY) {
        if (!this.showShop) return;
        const scrollSpeed = 1;
        this.shopScrollY += deltaY * scrollSpeed;
        this.shopScrollY = Math.max(0, Math.min(this.maxShopScrollY, this.shopScrollY));
    }

    handleTouchScroll(deltaY) {
        if (!this.showShop) return;
        const scrollSpeed = 1.5;
        this.shopScrollY += deltaY * scrollSpeed;
        this.shopScrollY = Math.max(0, Math.min(this.maxShopScrollY, this.shopScrollY));
    }

    draw(ctx, canvas) {
        if (!this.showShop) return;
        this.ui.draw(ctx, canvas);
    }
}