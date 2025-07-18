export class ResourceManager {
    constructor(state) {
        this.state = state;
    }

    sellResource(resource, amount) {
        if (amount <= 0 || !this.state.resources[resource] || this.state.resources[resource] < amount) {
            console.log(`Cannot sell ${amount} ${resource} - not enough resources`);
            return false;
        }
        
        const earnings = amount * this.state.sellPrices[resource];
        this.state.resources[resource] -= amount;
        this.state.money += earnings;
        this.state.stats.moneyEarned = (this.state.stats.moneyEarned || 0) + earnings;
        this.state.saveAllState();
        return true;
    }

    smeltResource(resource, amount) {
        const coalPerItem = this.state.smeltingCost.coal || 1;
        const totalCoalCost = amount * coalPerItem;

        if (amount <= 0 || this.state.resources[resource] < amount || this.state.resources.coal < totalCoalCost) {
            console.log(`Cannot smelt ${amount} ${resource} - insufficient resources or coal`);
            return false;
        }
        
        this.state.resources[resource] -= amount;
        this.state.smeltedResources[resource] = (this.state.smeltedResources[resource] || 0) + amount;
        this.state.resources.coal -= totalCoalCost;
        this.state.saveAllState();
        return true;
    }

    sellSmeltedResource(resource, amount) {
        if (amount <= 0 || !this.state.smeltedResources[resource] || this.state.smeltedResources[resource] < amount) {
            console.log(`Cannot sell ${amount} ${resource} ingots - not enough smelted resources`);
            return false;
        }
        
        const earnings = amount * this.state.smeltedSellPrices[resource];
        this.state.smeltedResources[resource] -= amount;
        this.state.money += earnings;
        this.state.stats.moneyEarned = (this.state.stats.moneyEarned || 0) + earnings;
        this.state.saveAllState();
        return true;
    }

    buyEnchantment(type) {
        const currentLevel = this.state.enchantmentLevels[type];
        const maxLevel = this.state.maxEnchantmentLevels[type];
        
        if (currentLevel >= maxLevel) {
            console.log(`${type} enchantment is already at max level`);
            return false;
        }

        const cost = this.state.getEnchantmentCost(type, currentLevel);
        if (this.state.money >= cost.money && this.state.resources.lapis >= cost.lapis) {
            this.state.money -= cost.money;
            this.state.resources.lapis -= cost.lapis;
            this.state.enchantmentLevels[type]++;
            this.state.saveAllState();
            return true;
        }
        console.log(`Cannot afford ${type} enchantment - need ${cost.money} coins and ${cost.lapis} lapis`);
        return false;
    }

    canAffordPickaxe(type) {
        const pickaxeData = this.state.pickaxePrices[type];
        if (!pickaxeData || pickaxeData.unlocked) return false;
        
        let canAfford = this.state.money >= pickaxeData.price;
        for (const [itemType, amount] of Object.entries(pickaxeData.requirements || {})) {
            let userAmount;
            if (this.state.nonSmeltableResources.includes(itemType)) {
                userAmount = this.state.resources[itemType] || 0;
            } else { // Assumes it's an ingot
                const rawType = itemType.replace('_ingot', '');
                userAmount = this.state.smeltedResources[rawType] || 0;
            }
            if (userAmount < amount) canAfford = false;
        }
        return canAfford;
    }

    buyPickaxe(type) {
        if (!this.canAffordPickaxe(type)) {
            console.log(`Cannot afford ${type} pickaxe`);
            return false;
        }
        
        const pickaxeData = this.state.pickaxePrices[type];
        this.state.money -= pickaxeData.price;
        
        // Consume required items
        for (const [itemType, amount] of Object.entries(pickaxeData.requirements || {})) {
            if (this.state.nonSmeltableResources.includes(itemType)) {
                this.state.resources[itemType] -= amount;
            } else {
                const rawType = itemType.replace('_ingot', '');
                this.state.smeltedResources[rawType] -= amount;
            }
        }
        
        pickaxeData.unlocked = true;
        this.state.saveAllState();
        return true;
    }
}