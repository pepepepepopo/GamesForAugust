export class CollisionDetector {
    constructor(world) {
        this.world = world;
    }

    sweptAABB(entity, block) {
        // No collision if entity isn't moving
        if (entity.vx === 0 && entity.vy === 0) {
            return { hit: false };
        }
    
        // Calculate the inverse of the entry and exit times for collision on each axis
        const invEntryX = entity.vx > 0 ? block.x - (entity.x + entity.width) : (block.x + block.width) - entity.x;
        const invEntryY = entity.vy > 0 ? block.y - (entity.y + entity.height) : (block.y + block.height) - entity.y;
    
        const invExitX = entity.vx > 0 ? (block.x + block.width) - entity.x : block.x - (entity.x + entity.width);
        const invExitY = entity.vy > 0 ? (block.y + block.height) - entity.y : block.y - (entity.y + block.height);
    
        // Calculate the time of collision (t) on each axis
        const entryTimeX = entity.vx === 0 ? -Infinity : invEntryX / entity.vx;
        const entryTimeY = entity.vy === 0 ? -Infinity : invEntryY / entity.vy;
    
        const exitTimeX = entity.vx === 0 ? Infinity : invExitX / entity.vx;
        const exitTimeY = entity.vy === 0 ? Infinity : invExitY / entity.vy;
    
        // Find the latest entry time and earliest exit time
        const entryTime = Math.max(entryTimeX, entryTimeY);
        const exitTime = Math.min(exitTimeX, exitTimeY);
    
        // If there's no overlap in collision times, no collision occurred
        if (entryTime > exitTime || entryTimeX < 0 && entryTimeY < 0 || entryTime > 1) {
            return { hit: false };
        }
    
        // Determine the normal of the surface that was hit
        let normalX = 0;
        let normalY = 0;
        if (entryTimeX > entryTimeY) {
            normalX = entity.vx > 0 ? -1 : 1;
        } else {
            normalY = entity.vy > 0 ? -1 : 1;
        }
    
        return {
            hit: true,
            time: entryTime,
            normalX: normalX,
            normalY: normalY,
        };
    }

    checkPickaxeBlockCollision(block, pickaxe) {
        // Simple AABB collision check first
        if (pickaxe.x >= block.x + block.width ||
            pickaxe.x + pickaxe.width <= block.x ||
            pickaxe.y >= block.y + block.height ||
            pickaxe.y + pickaxe.height <= block.y) {
            return { hit: false };
        }

        // Calculate overlap on each axis
        const overlapX = Math.min(pickaxe.x + pickaxe.width - block.x, block.x + block.width - pickaxe.x);
        const overlapY = Math.min(pickaxe.y + pickaxe.height - block.y, block.y + block.height - pickaxe.y);

        // Determine collision direction based on smallest overlap and velocity
        let normalX = 0;
        let normalY = 0;

        if (overlapX < overlapY) {
            // Horizontal collision
            if (pickaxe.x < block.x) {
                normalX = -1; // Hit from left
            } else {
                normalX = 1;  // Hit from right
            }
        } else {
            // Vertical collision
            if (pickaxe.y < block.y) {
                normalY = -1; // Hit from above
            } else {
                normalY = 1;  // Hit from below
            }
        }

        return {
            hit: true,
            normalX: normalX,
            normalY: normalY,
            overlapX: overlapX,
            overlapY: overlapY
        };
    }
}