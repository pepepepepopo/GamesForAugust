export class AssetLoader {
    constructor(audioContext) {
        this.assets = {};
        this.audioAssets = {};
        this.damageSprites = [];
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.onProgress = null;
        this.audioContext = audioContext;
        this.iconAssets = {}; // For non-block images like pickaxes, icons, etc.
    }

    async loadAssets() {
        // Count total assets to load
        const assetPaths = [
            // Sounds
            { type: 'audio', path: 'stone.wav', key: 'blockBreak' },
            { type: 'audio', path: 'bounce.mp3', key: 'bounce' },
            { type: 'audio', path: 'bouncy_ball_spawn.mp3', key: 'bouncyBallSpawn' },

            // Block Textures
            { type: 'image', path: 'stone.png', key: 'stone' },
            { type: 'image', path: 'andesite.png', key: 'andesite' },
            { type: 'image', path: 'diorite.png', key: 'diorite' },
            { type: 'image', path: 'granite.png', key: 'granite' },
            { type: 'image', path: 'coal_ore.png', key: 'coalOre' },
            { type: 'image', path: 'copper_ore.png', key: 'copperOre' },
            { type: 'image', path: 'iron_ore.png', key: 'ironOre' },
            { type: 'image', path: 'gold_ore.png', key: 'goldOre' },
            { type: 'image', path: 'bedrock.png', key: 'bedrock' },
            { type: 'image', path: 'obsidian.png', key: 'obsidian' },
            { type: 'image', path: 'deepslate.png', key: 'deepslate' },
            { type: 'image', path: 'deepslate_coal_ore.png', key: 'deepslateCoalOre' },
            { type: 'image', path: 'deepslate_copper_ore.png', key: 'deepslateCopperOre' },
            { type: 'image', path: 'deepslate_iron_ore.png', key: 'deepslateIronOre' },
            { type: 'image', path: 'deepslate_gold_ore.png', key: 'deepslateGoldOre' },
            { type: 'image', path: 'deepslate_redstone_ore.png', key: 'deepslateRedstoneOre' },
            { type: 'image', path: 'deepslate_diamond_ore.png', key: 'deepslateDiamondOre' },
            { type: 'image', path: 'deepslate_lapis_ore.png', key: 'deepslateLapisOre' },
            { type: 'image', path: 'redstone_ore.png', key: 'redstoneOre' },
            { type: 'image', path: 'diamond_ore.png', key: 'diamondOre' },
            { type: 'image', path: 'lapis_ore.png', key: 'lapisOre' },
            { type: 'image', path: 'emerald_ore.png', key: 'emeraldOre' },
            { type: 'image', path: 'deepslate_emerald_ore (2).png', key: 'deepslateEmeraldOre' },

            // Summer Event Textures
            { type: 'image', path: 'sand (1).png', key: 'sand' },
            { type: 'image', path: 'sandstone (1).png', key: 'sandstone' },
            { type: 'image', path: '4237953594.webp', key: 'iceCreamIcon' },
            
            // Resource Icons
            { type: 'image', path: 'coal.png', key: 'coalIcon' },
            { type: 'image', path: 'raw_copper.png', key: 'copperIcon' },
            { type: 'image', path: 'raw_iron.png', key: 'ironIcon' },
            { type: 'image', path: 'raw_gold.png', key: 'goldIcon' },
            { type: 'image', path: 'redstone.png', key: 'redstoneIcon' },
            { type: 'image', path: 'diamond.png', key: 'diamondIcon' },
            { type: 'image', path: 'lapis_lazuli.png', key: 'lapisIcon' },
            { type: 'image', path: 'emerald.png', key: 'emeraldIcon' },
            { type: 'image', path: '18461548-newpiskel_m-Photoroom.png', key: 'moneyIcon' },
            { type: 'image', path: 'copper_ingot.png', key: 'copperIngotIcon' },
            { type: 'image', path: 'iron_ingot.png', key: 'ironIngotIcon' },
            { type: 'image', path: 'gold_ingot.png', key: 'goldIngotIcon' },

            // Pickaxe Images
            { type: 'image', path: 'wooden_pickaxe.png', key: 'woodenPickaxe' },
            { type: 'image', path: 'stone_pickaxe.png', key: 'stonePickaxe' },
            { type: 'image', path: 'iron_pickaxe.png', key: 'ironPickaxe' },
            { type: 'image', path: 'golden_pickaxe.png', key: 'goldenPickaxe' },
            { type: 'image', path: 'diamond_pickaxe.png', key: 'diamondPickaxe' },
            { type: 'image', path: 'Grid_Obsidian_Pickaxe.png', key: 'obsidianPickaxe' },
            { type: 'image', path: 'netherite_pickaxe.png', key: 'netheritePickaxe' },
            { type: 'image', path: 'blaze_rod.png', key: 'blazeRod' },
            { type: 'image', path: 'lava pickaxe.png', key: 'lavaPickaxe' },
            { type: 'image', path: 'snd pickaxe.webp', key: 'blazePickaxe' },
            { type: 'image', path: 'sprite_4 (1).png', key: 'fishPickaxe' },
            { type: 'image', path: 'beach-ball-pixel-art-free-png.webp', key: 'bouncyBall' },

            // Misc
            { type: 'image', path: 'experience_bottle.png', key: 'experience_bottle' },
            { type: 'image', path: 'enchanted_book.png', key: 'enchantedBook' },
        ];

        const damageSpritePaths = [
            'sprite - 2025-06-20T113201.201.png', 'sprite - 2025-06-20T113200.409.png',
            'sprite - 2025-06-20T113159.673.png', 'sprite - 2025-06-20T113158.740.png',
            'sprite - 2025-06-20T113157.764.png', 'sprite - 2025-06-20T113155.665.png'
        ];

        this.totalAssets = assetPaths.length + damageSpritePaths.length;
        this.loadedCount = 0;

        const assetPromises = [];

        assetPaths.forEach(asset => {
            if (asset.type === 'image') {
                assetPromises.push(this.loadImageWithProgress(asset.path, asset.key));
            } else if (asset.type === 'audio') {
                assetPromises.push(this.loadAudioWithProgress(asset.path, asset.key));
            }
        });
        
        damageSpritePaths.forEach((path, index) => {
            assetPromises.push(this.loadDamageSpriteWithProgress(path, index));
        });

        await Promise.all(assetPromises);

        // Set global references for backward compatibility with block.js
        window.stoneImage = this.assets.stone;
        window.andesiteImage = this.assets.andesite;
        window.dioriteImage = this.assets.diorite;
        window.graniteImage = this.assets.granite;
        window.coalOreImage = this.assets.coalOre;
        window.copperOreImage = this.assets.copperOre;
        window.ironOreImage = this.assets.ironOre;
        window.goldOreImage = this.assets.goldOre;
        window.bedrockImage = this.assets.bedrock;
        window.deepslateImage = this.assets.deepslate;
        window.deepslateCoalOreImage = this.assets.deepslateCoalOre;
        window.deepslateCopperOreImage = this.assets.deepslateCopperOre;
        window.deepslateIronOreImage = this.assets.deepslateIronOre;
        window.deepslateGoldOreImage = this.assets.deepslateGoldOre;
        window.redstoneOreImage = this.assets.redstoneOre;
        window.deepslateRedstoneOreImage = this.assets.deepslateRedstoneOre;
        window.diamondOreImage = this.assets.diamondOre;
        window.deepslateDiamondOreImage = this.assets.deepslateDiamondOre;
        window.lapisOreImage = this.assets.lapisOre;
        window.deepslateLapisOreImage = this.assets.deepslateLapisOre;
        window.emeraldOreImage = this.assets.emeraldOre;
        window.deepslateEmeraldOreImage = this.assets.deepslateEmeraldOre;
        window.obsidianImage = this.assets.obsidian;
        window.sandImage = this.assets.sand;
        window.sandstoneImage = this.assets.sandstone;
        window.damageSprites = this.damageSprites;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async loadImageWithProgress(src, key) {
        try {
            const img = await this.loadImage(src);
            if (key.endsWith('Icon') || key.endsWith('Pickaxe') || key === 'blazeRod' || key === 'enchantedBook' || key === 'bouncyBall' || key === 'experience_bottle') {
                this.iconAssets[key] = img;
            } else {
                this.assets[key] = img;
            }
        } catch (error) {
            console.error(`Failed to load image: ${src}`, error);
            // Create a fallback image or continue without it
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    async loadAudioWithProgress(src, key) {
        if (!this.audioContext) {
            this.loadedCount++;
            this.updateProgress();
            return;
        }
        
        try {
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioAssets[key] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load audio: ${src}`, error);
            // Don't throw, just log and continue
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    async loadDamageSpriteWithProgress(src, index) {
        try {
            const img = await this.loadImage(src);
            this.damageSprites[index] = img;
        } catch (error) {
            console.error(`Failed to load damage sprite: ${src}`, error);
            // Continue without this damage sprite
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    updateProgress() {
        if (this.onProgress) {
            this.onProgress(this.loadedCount, this.totalAssets);
        }
    }

    getAsset(name) {
        return this.assets[name] || this.iconAssets[name];
    }

    getAudioAsset(name) {
        return this.audioAssets[name];
    }

    getDamageSprite(index) {
        return this.damageSprites[index];
    }
}