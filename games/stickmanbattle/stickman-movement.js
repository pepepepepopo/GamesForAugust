import { gameState } from './game-state.js';

export class StickmanMovement {
    static clampToFloor(stickman) {
        const stickmanHeight = stickman.element.clientHeight || 70;
        const floorHeight = gameState.gameWorld.clientHeight * 0.15;
        const floorTopY = gameState.gameWorld.clientHeight - floorHeight;
        const max_y = gameState.gameWorld.clientHeight - stickmanHeight;
        stickman.y = Math.max(floorTopY, Math.min(stickman.y, max_y));
    }

    static moveTowards(stickman, target, deltaTime) {
        const dx = target.x - stickman.x;
        const dy = target.y - stickman.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const moveSpeed = stickman.stats.moveSpeed * deltaTime;
            stickman.x += (dx / distance) * moveSpeed;
            stickman.y += (dy / distance) * moveSpeed;
            StickmanMovement.clampToFloor(stickman);
            stickman.element.style.left = `${stickman.x}px`;
            stickman.element.style.top = `${stickman.y}px`;
        }
    }

    static handleRepositioning(stickman, deltaTime) {
        if (!stickman.repositionTarget) return false;

        const dx = stickman.repositionTarget.x - stickman.x;
        const dy = stickman.repositionTarget.y - stickman.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 5) { // Arrived at target
            stickman.repositionTarget = null;
            return true;
        } else {
            // Move towards reposition target
            const moveSpeed = (stickman.stats.moveSpeed * 1.5) * deltaTime; // Move a bit faster when repositioning
            stickman.x += (dx / distance) * moveSpeed;
            stickman.y += (dy / distance) * moveSpeed;
            StickmanMovement.clampToFloor(stickman);
            stickman.element.style.left = `${stickman.x}px`;
            stickman.element.style.top = `${stickman.y}px`;
            return false;
        }
    }

    static findClosestTarget(stickman, targets) {
        if (targets.length === 0) return null;
        let closestTarget = null;
        let minDistance = Infinity;
        for (const target of targets) {
            const distance = Math.abs(stickman.x - target.x);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }
        return closestTarget;
    }
}