import Matter from 'matter-js';
import { gameState } from './game-state.js';
import { updateUICoins } from './ui.js';
import { playSound } from './audio.js';
import * as config from './config.js';

export function createBuyCoinAnimation(buttonElement) {
    const rect = buttonElement.getBoundingClientRect();
    const gameContainer = document.getElementById('game-container');
    const containerRect = gameContainer.getBoundingClientRect();
    
    for (let i = 0; i < 5; i++) {
        const coin = document.createElement('div');
        coin.classList.add('buy-coin-effect');
        gameContainer.appendChild(coin);

        // Start at a random point on the button
        const startX = rect.left - containerRect.left + Math.random() * rect.width;
        const startY = rect.top - containerRect.top + Math.random() * rect.height;
        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;

        const coinTargetEl = document.getElementById('coin-display');
        const targetRect = coinTargetEl.getBoundingClientRect();

        // Animate to the main coin display
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        requestAnimationFrame(() => {
            coin.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
            coin.style.opacity = '0';
        });

        setTimeout(() => {
            coin.remove();
        }, 500);
    }
}

export function createExplosionVisual(x, y, radius) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion-effect';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    explosion.style.width = `${radius * 2}px`;
    explosion.style.height = `${radius * 2}px`;

    gameState.gameWorld.appendChild(explosion);
    setTimeout(() => explosion.remove(), 400); // match animation duration
}

export function createHealEffect(x, y) {
    const healEffect = document.createElement('div');
    healEffect.className = 'heal-effect';
    healEffect.style.left = `${x}px`;
    healEffect.style.top = `${y}px`;

    gameState.gameWorld.appendChild(healEffect);
    setTimeout(() => healEffect.remove(), 600); // match animation duration
}

export function createCoinDrop(x, y) {
    const coinEl = document.createElement('div');
    coinEl.classList.add('coin-drop');
    gameState.gameWorld.appendChild(coinEl);

    // Give it an initial position before physics takes over
    const stickmanHeight = 70; // from CSS
    coinEl.style.left = `${x}px`;
    coinEl.style.top = `${y - stickmanHeight / 2}px`; // Start from near stickman's center

    // Create a physics body for the coin
    const coinBody = Matter.Bodies.rectangle(x, y, 35, 35, { 
        restitution: 0.4, // bounciness
        frictionAir: 0.01
    });

    Matter.World.add(gameState.world, coinBody);
    
    // Give it a little initial pop upwards
    Matter.Body.applyForce(coinBody, coinBody.position, {
        x: (Math.random() - 0.5) * 0.01, // random horizontal force
        y: -0.015 // upward force
    });
    
    const coinCountEl = document.getElementById('coin-count');
    const coinTargetRect = coinCountEl.getBoundingClientRect();
    const gameRect = gameState.gameWorld.getBoundingClientRect();
    const targetX = coinTargetRect.left + coinTargetRect.width / 2 - gameRect.left;
    const targetY = coinTargetRect.top + coinTargetRect.height / 2 - gameRect.top;
    
    gameState.flyingCoins.push({ 
        element: coinEl, 
        body: coinBody,
        targetX, 
        targetY,
        startTime: Date.now()
    });
}

export async function updateFlyingCoins() {
    const now = Date.now();
    const { gameState } = await import('./game-state.js');
    const speedMultiplier = gameState.speedMultiplier || 1;
    
    gameState.flyingCoins.forEach(coin => {
        if (!coin.flyingToUI) {
            // Update the coin element's position from its physics body
            coin.element.style.left = `${coin.body.position.x}px`;
            coin.element.style.top = `${coin.body.position.y}px`;

            // Check if it's time to start flying to the UI (affected by speed)
            if (now - coin.startTime > (1000 / speedMultiplier)) { 
                coin.flyingToUI = true;
                coin.flyStartTime = now;
                coin.startFlyX = coin.body.position.x;
                coin.startFlyY = coin.body.position.y;
                Matter.World.remove(gameState.world, coin.body); // Remove from physics simulation
            }
        } else {
            // Animate coin flying to the coin count display (affected by speed)
            const flyDuration = 500 / speedMultiplier; // ms
            const progress = Math.min((now - coin.flyStartTime) / flyDuration, 1);
            
            const currentX = coin.startFlyX + (coin.targetX - coin.startFlyX) * progress;
            const currentY = coin.startFlyY + (coin.targetY - coin.startFlyY) * progress;

            coin.element.style.left = `${currentX}px`;
            coin.element.style.top = `${currentY}px`;
        }
    });

    // Clean up collected coins (affected by speed)
    gameState.flyingCoins = gameState.flyingCoins.filter(coin => {
        if (coin.flyingToUI && now - coin.flyStartTime >= (500 / speedMultiplier)) {
            coin.element.remove();
            gameState.playerCoins += config.ENEMY_KILL_REWARD;
            updateUICoins();
            playSound('coin', 0.5);
            return false; // Remove from array
        }
        return true; // Keep in array
    });
}

export function createMissEffect(x, y) {
    const missEffect = document.createElement('div');
    missEffect.className = 'miss-effect';
    missEffect.textContent = 'MISS';
    missEffect.style.left = `${x}px`;
    missEffect.style.top = `${y}px`;

    gameState.gameWorld.appendChild(missEffect);
    setTimeout(() => missEffect.remove(), 1000);
}

export function createSniperEffect(x, y, text) {
    const sniperEffect = document.createElement('div');
    sniperEffect.className = 'sniper-effect';
    sniperEffect.textContent = text;
    sniperEffect.style.left = `${x}px`;
    sniperEffect.style.top = `${y}px`;
    
    // Different colors for different shot types
    if (text === 'HEADSHOT') {
        sniperEffect.style.color = '#ff0000';
        sniperEffect.style.fontSize = '28px';
    } else {
        sniperEffect.style.color = '#00ff00';
        sniperEffect.style.fontSize = '24px';
    }

    gameState.gameWorld.appendChild(sniperEffect);
    setTimeout(() => sniperEffect.remove(), 1200);
}