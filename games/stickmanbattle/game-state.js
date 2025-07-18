import Matter from 'matter-js';

const { Engine, World, Bodies, Runner } = Matter;

let engine;
let world;
let runner;
let isGameOver = false;

export const gameState = {
    playerCoins: 100,
    currentRound: 0,
    roundsSurvived: 0,
    legitimateRoundsSurvived: 0,
    roundInProgress: false,
    postRoundHealingActive: false,
    playerStickmen: [],
    enemyStickmen: [],
    flyingCoins: [],
    moneyMachines: [],
    gameWorld: document.getElementById('game-world'),
    isSpeedUp: false,
    speedMultiplier: 1,
    get engine() { return engine; },
    get world() { return world; },
    get isGameOver() { return isGameOver; },
    set isGameOver(value) { isGameOver = value; },
    async addPlayerStickman(typeId) {
        const { Stickman } = await import('./stickman.js');
        const { missionManager } = await import('./missions.js');
        
        const newStickman = new Stickman('player', typeId);
        this.playerStickmen.push(newStickman);
        
        console.log(`Adding player stickman: ${typeId}`);
        
        // Update mission progress for spawning
        missionManager.updateProgress('spawn', 1);
        
        // Update mission progress for specific purchases
        if (typeId === 'sniper') {
            missionManager.updateProgress('buy_specific', 1, 'sniper');
        } else if (typeId === 'rocket_launcher') {
            missionManager.updateProgress('buy_specific', 1, 'rocket_launcher');
        }
    }
};

export function initPhysics() {
    // Initialize Matter.js engine
    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = 0.5; // Lighter gravity

    // Create a static ground body
    const floorHeight = gameState.gameWorld.clientHeight * 0.15;
    const ground = Bodies.rectangle(
        gameState.gameWorld.clientWidth / 2, 
        gameState.gameWorld.clientHeight - floorHeight / 2, 
        gameState.gameWorld.clientWidth, 
        floorHeight, 
        { isStatic: true }
    );
    World.add(world, ground);

    // Start the physics engine
    runner = Runner.run(engine);
}

export function stopPhysics() {
    Runner.stop(runner);
}