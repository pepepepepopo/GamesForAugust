import { Block } from './block.js';
import { BLOCK_DEFINITIONS } from './block-definitions.js';
import { CollisionDetector } from './collision.js';

export class World {
    constructor(game) {
        this.game = game;
        this.blockSize = 40;
        this.gridWidth = 7;
        this.barrierWidth = 40;
        this.generatedRows = 0;
        
        this.fixedStartX = null;
        this.fixedLeftBarrierX = null;
        this.fixedRightBarrierX = null;
        
        this.coalClusterChance = 0.4;
        this.andesiteClusterChance = 0.6;

        this.generationQueue = [];
        this.bouncyBalls = [];
        this.blazeRods = [];

        // Spatial Grid for collision optimization
        this.spatialGrid = new Map();
        this.gridCellSize = this.blockSize * 2; // Check a smaller, more focused area
        
        this.collisionDetector = new CollisionDetector(this);
    }

    _getGridKey(x, y) {
        const cellX = Math.floor(x / this.gridCellSize);
        const cellY = Math.floor(y / this.gridCellSize);
        return `${cellX},${cellY}`;
    }

    _addBlockToGrid(block) {
        const key = this._getGridKey(block.x, block.y);
        if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key).push(block);
    }
    
    removeBlockFromGrid(block) {
        const key = this._getGridKey(block.x, block.y);
        if (this.spatialGrid.has(key)) {
            const cell = this.spatialGrid.get(key);
            const index = cell.indexOf(block);
            if (index > -1) {
                cell.splice(index, 1);
            }
        }
    }
    
    getBlockAt(x, y) {
        const key = this._getGridKey(x, y);
        if (this.spatialGrid.has(key)) {
            const blocksInCell = this.spatialGrid.get(key);
            for (const block of blocksInCell) {
                if (!block.destroyed &&
                    x >= block.x && x <= block.x + block.width &&
                    y >= block.y && y <= block.y + block.height) {
                    return block;
                }
            }
        }
        return null;
    }

    getNearbyBlocks(x, y, width, height) {
        const nearby = new Set();
        const startX = Math.floor(x / this.gridCellSize);
        const startY = Math.floor(y / this.gridCellSize);
        const endX = Math.floor((x + width) / this.gridCellSize);
        const endY = Math.floor((y + height) / this.gridCellSize);

        for (let i = startX; i <= endX; i++) {
            for (let j = startY; j <= endY; j++) {
                const key = `${i},${j}`;
                if (this.spatialGrid.has(key)) {
                    this.spatialGrid.get(key).forEach(block => {
                        if (!block.destroyed) {
                           nearby.add(block);
                        }
                    });
                }
            }
        }
        return [...nearby];
    }

    initializeBlocks() {
        this.game.blocks = [];
        this.spatialGrid.clear();
        this.generatedRows = 0;
        
        const centerX = this.game.canvas.width / 2;
        const gridPixelWidth = this.gridWidth * this.blockSize;
        this.fixedStartX = centerX - (gridPixelWidth / 2);
        
        this.fixedLeftBarrierX = this.fixedStartX - this.barrierWidth;
        this.fixedRightBarrierX = this.fixedStartX + (this.gridWidth * this.blockSize);
        
        this.game.pickaxe.x = this.game.canvas.width / 2 - this.game.pickaxe.width / 2;
        this.game.pickaxe.initialX = this.game.pickaxe.x;
        
        const initialRows = this.game.state.summerEventActive ? 50 : 30;
        for (let row = 0; row < initialRows; row++) {
            this.generateRow(row);
        }
        this.generatedRows = initialRows;
    }

    generateRow(row) {
        const y = 300 + row * this.blockSize;
        
        for (let col = 0; col < this.gridWidth; col++) {
            const x = this.fixedStartX + col * this.blockSize;
            
            if (this.game.state.summerEventActive) {
                const sandTypeRand = Math.random();
                const blockType = sandTypeRand < 0.7 ? 'sand' : 'sandstone';
                const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
                this.game.blocks.push(block);
                this._addBlockToGrid(block);
                continue;
            }
            
            const blockType = this.determineBlockType(row, col);
            const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
            
            // Add chance for experience bottle
            const bottleChance = 0.01; // 1% chance for any block to have a bottle
            if (Math.random() < bottleChance && block.blockType !== 'bedrock' && block.blockType !== 'obsidian') {
                block.hasExperienceBottle = true;
            }

            this.game.blocks.push(block);
            this._addBlockToGrid(block);
        }
    }

    determineBlockType(row, col) {
        const depth = row;
        const isDeepslate = this.isDeepslateLayer(depth);
        const adjacentInfo = {
            coal: this.hasAdjacentBlock(row, col, ['coal_ore', 'deepslate_coal_ore']),
            andesite: this.hasAdjacentBlock(row, col, ['andesite']),
            diorite: this.hasAdjacentBlock(row, col, ['diorite']),
            granite: this.hasAdjacentBlock(row, col, ['granite']),
        };

        if (!isDeepslate) {
            if (adjacentInfo.andesite && Math.random() < this.andesiteClusterChance) return 'andesite';
            if (adjacentInfo.diorite && Math.random() < this.andesiteClusterChance) return 'diorite';
            if (adjacentInfo.granite && Math.random() < this.andesiteClusterChance) return 'granite';
        }
        if (adjacentInfo.coal && Math.random() < this.coalClusterChance) {
            return isDeepslate ? 'deepslate_coal_ore' : 'coal_ore';
        }

        const obsidianChance = depth > 70 ? (depth - 70) * 0.0005 : 0;
        if (Math.random() < obsidianChance) return 'obsidian';

        const oreType = this.chooseOreByDepth(depth);
        if (oreType && Math.random() < 0.55) {
            const oreDef = BLOCK_DEFINITIONS[oreType + '_ore'];
            if (isDeepslate && oreDef && oreDef.deepslateVariant) {
                return 'deepslate_' + oreType + '_ore';
            }
            return oreType + '_ore';
        }
        
        if (isDeepslate) return 'deepslate';
        
        const stoneTypeRand = Math.random();
        if (stoneTypeRand < 0.15) return 'andesite';
        if (stoneTypeRand < 0.30) return 'diorite';
        if (stoneTypeRand < 0.45) return 'granite';
        return 'stone';
    }

    isDeepslateLayer(depth) {
        let isDeepslate = depth >= 45;
        if (depth >= 40 && depth < 50) {
            const transitionFactor = (depth - 40) / 10;
            const randomChance = Math.random();
            if (depth < 45) {
                isDeepslate = randomChance < transitionFactor * 0.2;
            } else {
                isDeepslate = randomChance < 0.8 + transitionFactor * 0.2;
            }
        }
        return isDeepslate;
    }

    chooseOreByDepth(depth) {
        let chances = {
            coal: 0.12, copper: 0.10, iron: 0.08, gold: 0.06, 
            redstone: 0.05, diamond: 0.03, lapis: 0.04, emerald: 0.025
        };

        const depthMultiplier = 1 + (depth * 0.008);
        chances.coal *= depthMultiplier * 0.9;
        chances.copper *= depthMultiplier;
        chances.iron *= depthMultiplier;
        chances.gold *= depthMultiplier * 1.5;
        chances.redstone *= depthMultiplier * 1.8;
        chances.diamond *= depthMultiplier * 2.5;
        chances.lapis *= depthMultiplier * 1.2;
        chances.emerald *= depthMultiplier * 2.0;

        const oreProbArray = Object.entries(chances).sort((a, b) => b[1] - a[1]);
        const oreRand = Math.random();
        let cumulativeChance = 0;
        
        for(const [ore, chance] of oreProbArray) {
            if (oreRand < cumulativeChance + chance) {
                return ore;
            }
            cumulativeChance += chance;
        }
        return null;
    }

    hasAdjacentBlock(row, col, blockTypes) {
        const checkPositions = [
            { r: row, c: col - 1 }, { r: row, c: col + 1 }, { r: row - 1, c: col }
        ];

        for (const pos of checkPositions) {
            if (pos.c >= 0 && pos.c < this.gridWidth && pos.r >= 0) {
                const blockX = this.fixedStartX + pos.c * this.blockSize;
                const blockY = 300 + pos.r * this.blockSize;
                
                // Use the grid for a faster lookup
                const nearbyBlocks = this.getNearbyBlocks(blockX, blockY, this.blockSize, this.blockSize);
                const existingBlock = nearbyBlocks.find(b => 
                    !b.destroyed && Math.abs(b.x - blockX) < 1 && Math.abs(b.y - blockY) < 1
                );
                
                if (existingBlock && blockTypes.includes(existingBlock.blockType)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    recenterBlocks(newCanvasWidth) {
        if (this.fixedStartX === null) return; // Not initialized yet

        const oldStartX = this.fixedStartX;
        
        const centerX = newCanvasWidth / 2;
        const gridPixelWidth = this.gridWidth * this.blockSize;
        const newStartX = centerX - (gridPixelWidth / 2);

        const deltaX = newStartX - oldStartX;

        if (Math.abs(deltaX) < 1) {
            return; // No significant change
        }

        this.fixedStartX = newStartX;
        this.fixedLeftBarrierX += deltaX;
        this.fixedRightBarrierX += deltaX;

        // Move all blocks
        for (const block of this.game.blocks) {
            block.x += deltaX;
        }

        // Rebuild spatial grid since block positions changed
        this.spatialGrid.clear();
        for (const block of this.game.blocks) {
            this._addBlockToGrid(block);
        }

        // Move other world objects
        for (const ball of this.bouncyBalls) {
            ball.x += deltaX;
        }
        for (const rod of this.blazeRods) {
            rod.x += deltaX;
        }
    }
    
    generateMoreBlocks() {
        const cameraBottom = this.game.camera.y + this.game.canvas.height;
        const lastBlockY = 300 + this.generatedRows * this.blockSize;

        // Generate more blocks if the camera is close to the bottom and queue is not full
        if (cameraBottom > lastBlockY - this.game.canvas.height * 1.5 && this.generationQueue.length < 40) {
            const rowsToGenerate = 20; // Generate a chunk of rows at a time
            for(let i = 0; i < rowsToGenerate; i++) {
                this.generationQueue.push(this.generatedRows + i);
            }
            this.generatedRows += rowsToGenerate;
        }
    }

    update(dt) {
        this.processGenerationQueue();
        this.checkCollisions();
        this.updateProjectiles(dt);
    }

    updateProjectiles(dt) {
        this.updateBlazeRods(dt);
        this.updateBouncyBalls(dt);
    }

    updateBouncyBalls(dt) {
        const gravity = 0.3;
        const bounceFactor = 0.9;
        const friction = 0.99;
    
        for (let i = this.bouncyBalls.length - 1; i >= 0; i--) {
            const ball = this.bouncyBalls[i];
            ball.vy += gravity;
            ball.vx *= friction;
    
            const prevX = ball.x;
            const prevY = ball.y;
    
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.rotation += ball.angularVelocity;
    
            // Wall collisions
            if (ball.x < this.fixedLeftBarrierX + this.barrierWidth) {
                ball.x = this.fixedLeftBarrierX + this.barrierWidth;
                ball.vx *= -bounceFactor;
                ball.bounces++;
                ball.angularVelocity *= -1;
                this.game.playSound(this.game.assetLoader.getAudioAsset('bounce'), 1.0 + (Math.random() - 0.5) * 0.2);
            }
            if (ball.x + ball.width > this.fixedRightBarrierX) {
                ball.x = this.fixedRightBarrierX - ball.width;
                ball.vx *= -bounceFactor;
                ball.bounces++;
                ball.angularVelocity *= -1;
                this.game.playSound(this.game.assetLoader.getAudioAsset('bounce'), 1.0 + (Math.random() - 0.5) * 0.2);
            }

            // Block collision
            const entity = {
                x: prevX,
                y: prevY,
                width: ball.width,
                height: ball.height,
                vx: ball.vx,
                vy: ball.vy,
            };
            const nearbyBlocks = this.getNearbyBlocks(entity.x, entity.y, entity.width + Math.abs(entity.vx), entity.height + Math.abs(entity.vy));
            
            let closestCollision = { time: Infinity };

            for (const block of nearbyBlocks) {
                if (block.destroyed) continue;
                const collision = this.collisionDetector.sweptAABB(entity, block);
                if (collision.hit && collision.time < closestCollision.time) {
                    closestCollision = { ...collision, block };
                }
            }

            if (closestCollision.time < 1) {
                const { time, normalX, normalY, block } = closestCollision;
                ball.bounces++;
                
                // Move entity to point of collision
                ball.x = prevX + ball.vx * time;
                ball.y = prevY + ball.vy * time;

                if (normalX !== 0) { // Horizontal collision
                    ball.vx *= -bounceFactor;
                    ball.angularVelocity += (ball.vy / 50) * Math.sign(ball.vx);
                }
                if (normalY !== 0) { // Vertical collision
                    if (ball.vy > 0) { // Hitting top of a block
                        ball.vy = -14; // Strong upward bounce
                        ball.vx += (Math.random() - 0.5) * 10;
                        ball.angularVelocity += (Math.random() - 0.5) * 0.5;
                    } else { // Hitting bottom of a block
                        ball.vy *= -bounceFactor;
                    }
                }
                
                // Damage block
                block.takeDamage(ball.damage);
                this.game.handleBlockDestruction(block, true);
                this.game.playSound(this.game.assetLoader.getAudioAsset('bounce'), 0.8 + (Math.random() - 0.5) * 0.2);
                
                this.game.createImpactSparkles(ball.x + ball.width / 2, ball.y + ball.height / 2);

                const adjacentPositions = [
                    { dx: -this.blockSize, dy: 0 }, { dx: this.blockSize, dy: 0 },
                    { dx: 0, dy: -this.blockSize }, { dx: 0, dy: this.blockSize }
                ];

                adjacentPositions.forEach(pos => {
                    const adjBlock = this.getBlockAt(block.x + pos.dx, block.y + pos.dy);
                    if (adjBlock && !adjBlock.destroyed) {
                        adjBlock.takeDamage(ball.aoeDamage);
                        this.game.handleBlockDestruction(adjBlock, true);
                    }
                });
            }
    
            const shouldRemove = ball.bounces >= ball.maxBounces || ball.y > this.game.camera.y + this.game.canvas.height + 100;
            if (shouldRemove) {
                this.bouncyBalls.splice(i, 1);
            }
        }
    }
    
    updateBlazeRods(dt) {
        const gravity = 0.4;
        const bounceFactor = 0.9; 
        const friction = 0.98;

        for (let i = this.blazeRods.length - 1; i >= 0; i--) {
            const rod = this.blazeRods[i];
            rod.vy += gravity;
            rod.vx *= friction;

            const prevX = rod.x;
            const prevY = rod.y;

            rod.x += rod.vx;
            rod.y += rod.vy;
            rod.rotation += rod.angularVelocity;

            // Check for wall collisions
            if (rod.x < this.fixedLeftBarrierX + this.barrierWidth) {
                rod.x = this.fixedLeftBarrierX + this.barrierWidth;
                rod.vx *= -bounceFactor;
                rod.bounces++;
            }
            if (rod.x + rod.width > this.fixedRightBarrierX) {
                rod.x = this.fixedRightBarrierX - rod.width;
                rod.vx *= -bounceFactor;
                rod.bounces++;
            }

            // Check for block collisions using CCD
            const entity = {
                x: prevX,
                y: prevY,
                width: rod.width,
                height: rod.height,
                vx: rod.vx,
                vy: rod.vy,
            };
            const nearbyBlocks = this.getNearbyBlocks(entity.x, entity.y, entity.width + Math.abs(entity.vx), entity.height + Math.abs(entity.vy));
            
            let closestCollision = { time: Infinity };

            for (const block of nearbyBlocks) {
                if (block.destroyed) continue;
                const collision = this.collisionDetector.sweptAABB(entity, block);
                if (collision.hit && collision.time < closestCollision.time) {
                    closestCollision = { ...collision, block };
                }
            }

            if (closestCollision.time < 1) {
                const { time, normalX, normalY, block } = closestCollision;
                rod.bounces++;
                
                // Move entity to point of collision
                rod.x = prevX + rod.vx * time;
                rod.y = prevY + rod.vy * time;

                if (normalX !== 0) {
                    rod.vx *= -bounceFactor;
                    rod.angularVelocity += (rod.vy / 50) * Math.sign(rod.vx);
                }
                if (normalY !== 0) {
                     if (rod.vy > 0) { // Hitting top of a block
                        rod.vy = -14; // Strong upward velocity like the pickaxe
                        rod.vx += (Math.random() - 0.5) * 10;
                        rod.angularVelocity += (Math.random() - 0.5) * 0.5;
                    } else { // Hitting bottom of a block
                        rod.vy *= -bounceFactor;
                    }
                }

                // Damage block
                block.takeDamage(1.5); // Blaze rods deal some damage
                this.game.handleBlockDestruction(block, true);
                this.game.playSound(this.game.assetLoader.getAudioAsset('blockBreak'), 1.2 + Math.random() * 0.2);
                this.game.createImpactSparkles(rod.x + rod.width / 2, rod.y + rod.height / 2);
            }

            const shouldRemove = rod.bounces >= rod.maxBounces || rod.y > this.game.camera.y + this.game.canvas.height + 100;
            if (shouldRemove) {
                this.blazeRods.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        const pickaxe = this.game.pickaxe;
        if (pickaxe.isBroken || !pickaxe.isDropped) return;

        // --- Barrier Collisions ---
        if (pickaxe.x < this.fixedLeftBarrierX + this.barrierWidth) {
            pickaxe.x = this.fixedLeftBarrierX + this.barrierWidth;
            pickaxe.velocity.x *= -pickaxe.bounce;
        }
        if (pickaxe.x + pickaxe.width > this.fixedRightBarrierX) {
            pickaxe.x = this.fixedRightBarrierX - pickaxe.width;
            pickaxe.velocity.x *= -pickaxe.bounce;
        }

        // --- Block Collisions ---
        this.handleBlockCollisions();
    }
    
    handleBlockCollisions() {
        const pickaxe = this.game.pickaxe;
        // Get blocks that might collide with the pickaxe
        const sweepBox = {
            x: Math.min(pickaxe.x, pickaxe.prevX) - 5,
            y: Math.min(pickaxe.y, pickaxe.prevY) - 5,
            width: Math.abs(pickaxe.x - pickaxe.prevX) + pickaxe.width + 10,
            height: Math.abs(pickaxe.y - pickaxe.prevY) + pickaxe.height + 10
        };
        
        const nearbyBlocks = this.getNearbyBlocks(sweepBox.x, sweepBox.y, sweepBox.width, sweepBox.height);
        
        // Check for collisions with each block
        for (const block of nearbyBlocks) {
            if (block.destroyed) continue;
            
            const collision = this.collisionDetector.checkPickaxeBlockCollision(block, pickaxe);
            if (collision.hit) {
                this.resolvePickaxeBlockCollision(block, collision);
            }
        }
    }

    resolvePickaxeBlockCollision(block, collision) {
        const pickaxe = this.game.pickaxe;
        const { normalX, normalY, overlapX, overlapY } = collision;

        // Move pickaxe out of the block
        if (normalX !== 0) {
            pickaxe.x += normalX * overlapX;
            pickaxe.velocity.x *= -pickaxe.bounce;
            pickaxe.angularVelocity += (pickaxe.velocity.y / 50) * Math.sign(pickaxe.velocity.x);
        }
        
        if (normalY !== 0) {
            pickaxe.y += normalY * overlapY;
            
            if (normalY < 0) {
                // Hitting top of block from above - give strong upward bounce
                pickaxe.velocity.y = -14;
                
                const stability = pickaxe.getCurrentVariant().stability || 1;
                const chaosFactor = 10 / stability;
                const spinFactor = 0.5 / stability;
                
                pickaxe.velocity.x += (Math.random() - 0.5) * chaosFactor;
                pickaxe.angularVelocity += (Math.random() - 0.5) * spinFactor;
            } else {
                // Hitting bottom of block from below
                pickaxe.velocity.y *= -pickaxe.bounce;
            }
        }

        // Handle block damage and destruction
        this.game.handleBlockHit(block);
    }
    
    draw(ctx) {
        const bedrockImage = this.game.assetLoader.getAsset('bedrock');
        const cameraTop = this.game.camera.y;
        const cameraBottom = cameraTop + this.game.canvas.height;

        const startY = Math.floor(cameraTop / this.blockSize) * this.blockSize;
        const endY = Math.ceil(cameraBottom / this.blockSize) * this.blockSize;
        
        if (bedrockImage && bedrockImage.complete) {
            for (let y = startY; y < endY; y += this.blockSize) {
                ctx.drawImage(bedrockImage, this.fixedLeftBarrierX, y, this.barrierWidth, this.blockSize);
                ctx.drawImage(bedrockImage, this.fixedRightBarrierX, y, this.barrierWidth, this.blockSize);
            }
        } else {
            ctx.fillStyle = '#4A4A4A';
            const height = endY - startY;
            ctx.fillRect(this.fixedLeftBarrierX, startY, this.barrierWidth, height);
            ctx.fillRect(this.fixedRightBarrierX, startY, this.barrierWidth, height);
        }
    }

    processGenerationQueue() {
        // Process a few rows per frame to spread the load
        const rowsPerFrame = 2; 
        for (let i = 0; i < rowsPerFrame && this.generationQueue.length > 0; i++) {
            const row = this.generationQueue.shift();
            if (row !== undefined) {
                this.generateRow(row);
            }
        }
    }
}