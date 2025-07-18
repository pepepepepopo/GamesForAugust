export const STICKMAN_COST = 10;
export const ENEMY_KILL_REWARD = 2;

export const BASE_STATS = {
    player_health: 100,
    enemy_health: 50,
    stickman_width: 50,
    attack_cooldown: 1000, // ms
    heal_cooldown: 2000, //ms
};

export const STICKMAN_TYPES = {
    regular: {
        id: 'regular',
        name: 'Stickman',
        cost: 10,
        image: '/Stickman.png',
        cssClass: '',
        stats: {
            health: 100,
            damage: 10,
            attackRange: 60, // A bit more than width
            moveSpeed: 30,
        }
    },
    sword: {
        id: 'sword',
        name: 'Swordman',
        cost: 15,
        image: '/Stickmanwithsword.png',
        cssClass: 'with-sword',
        stats: {
            health: 100,
            damage: 20, // More damage
            attackRange: 75,
            moveSpeed: 30,
        }
    },
    gun: {
        id: 'gun',
        name: 'Gunman',
        cost: 20,
        image: '/Stickmanwithgun.png',
        cssClass: 'with-gun',
        stats: {
            health: 80,
            damage: 15,
            attackRange: 300, // Long range
            moveSpeed: 25,
        }
    },
    bomb: {
        id: 'bomb',
        name: 'Bomber',
        cost: 35,
        image: '/BombStickMan.png',
        cssClass: 'bomb',
        stats: {
            health: 50,
            damage: 80, // Explosion damage
            attackRange: 70, // Detonation range
            moveSpeed: 35,
            explosionRadius: 80,
        }
    },
    medic: {
        id: 'medic',
        name: 'Medic',
        cost: 50,
        image: '/Stickmanmedic.png',
        cssClass: 'medic',
        stats: {
            health: 100,
            damage: 0, // No damage
            attackRange: 0,
            moveSpeed: 28,
            healAmount: 20, // Heal amount for post-round healing
            healRange: 80, // Range to heal from
        }
    },
    sniper: {
        id: 'sniper',
        name: 'Sniper',
        cost: 850,
        image: '/SniperStickman.png',
        cssClass: 'sniper',
        stats: {
            health: 80,
            damage: 100, // Base damage for normal shots
            headShotDamage: 200, // Damage for headshots
            attackRange: 2000, // Map-wide range
            moveSpeed: 20,
            missChance: 0.1, // 10% chance to miss
            headShotChance: 0.8, // 80% chance for headshot
            attackCooldown: 6000, // 6 second reload time
        }
    },
    rocket_launcher: {
        id: 'rocket_launcher',
        name: 'Rocket Launcher',
        cost: 1500,
        image: '/RocketlauncherStickman.png',
        cssClass: 'rocket-launcher',
        stats: {
            health: 90,
            damage: 120, // Explosion damage
            attackRange: 400, // Long range
            moveSpeed: 22,
            explosionRadius: 100,
        }
    },
    car: {
        id: 'car',
        name: 'Stickman on Car',
        cost: 50,
        image: '/Stickmanoncar.png',
        cssClass: 'on-car',
        stats: {
            health: 200,
            damage: 15,
            attackRange: 60,
            moveSpeed: 50, // Faster
        }
    },
    car_sword: {
        id: 'car_sword',
        name: 'Car w/ Sword',
        cost: 60,
        image: '/Stickmanoncarwithsword.png',
        cssClass: 'on-car with-sword',
        stats: {
            health: 200,
            damage: 25, // More damage
            attackRange: 75,
            moveSpeed: 50, // Faster
        }
    },
    car_gun: {
        id: 'car_gun',
        name: 'Car w/ Gun',
        cost: 100,
        image: '/Stickmanoncarwithgun.png',
        cssClass: 'on-car with-gun',
        stats: {
            health: 160,
            damage: 18,
            attackRange: 350, // Long range
            moveSpeed: 45, // Faster
        }
    },
    car_medic: {
        id: 'car_medic',
        name: 'Car w/ Medic',
        cost: 150,
        image: '/Stickmanmediconcar.png',
        cssClass: 'on-car medic',
        stats: {
            health: 200, // More health
            damage: 0, // No damage
            attackRange: 0,
            moveSpeed: 48,
            healAmount: 50, // Increased heal amount for in-combat healing
            healRange: 100,
            healCooldown: 3500, // Cooldown for healing
            healTargetHP: 20 // Heal allies below this absolute HP
        }
    },
    money_machine: {
        id: 'money_machine',
        name: 'Money Machine',
        cost: 45,
        image: '/MoneyMachine.png',
        cssClass: 'money-machine',
        stats: {
            health: 100,
            moneyGenerated: 15,
        }
    },
    gun_plane: {
        id: 'gun_plane',
        name: 'Gun Plane',
        cost: 300,
        image: '/Stickmanongunplane.png',
        cssClass: 'on-gun-plane',
        stats: {
            health: 250,
            damage: 25,
            attackRange: 400,
            moveSpeed: 60,
            altitude: 100, // Flying height above ground
        }
    },
    bomb_plane: {
        id: 'bomb_plane',
        name: 'Bomb Plane',
        cost: 400,
        image: '/Stickmanonbombplane.png',
        cssClass: 'on-bomb-plane',
        stats: {
            health: 250,
            damage: 60,
            attackRange: 300,
            moveSpeed: 55,
            altitude: 100,
            explosionRadius: 90,
        }
    }
};

// Find the cheapest stickman cost dynamically
export const CHEAPEST_STICKMAN_COST = Math.min(...Object.values(STICKMAN_TYPES).map(s => s.cost));

// Kept for backward compatibility or simple logic
export const PLAYER_HEALTH = BASE_STATS.player_health;
export const ENEMY_HEALTH = BASE_STATS.enemy_health;
export const STICKMAN_WIDTH = BASE_STATS.stickman_width;
export const ATTACK_COOLDOWN = BASE_STATS.attack_cooldown;
export const MOVE_SPEED = 30;
export const ATTACK_RANGE = STICKMAN_WIDTH + 5;
export const ATTACK_DAMAGE = 10;

export const MISSIONS = {
    kill_10_enemies: {
        id: 'kill_10_enemies',
        name: 'Kill 10 Enemies',
        description: 'Defeat 10 enemies in battle',
        type: 'kill',
        target: 10,
        reward: 25,
        repeatable: true
    },
    kill_50_enemies: {
        id: 'kill_50_enemies',
        name: 'Enemy Slayer',
        description: 'Defeat 50 enemies in battle',
        type: 'kill',
        target: 50,
        reward: 100,
        repeatable: true
    },
    spawn_20_stickmen: {
        id: 'spawn_20_stickmen',
        name: 'Army Builder',
        description: 'Spawn 20 stickmen',
        type: 'spawn',
        target: 20,
        reward: 30,
        repeatable: true
    },
    spawn_5_stickmen: {
        id: 'spawn_5_stickmen',
        name: 'First Regiment',
        description: 'Spawn 5 stickmen',
        type: 'spawn',
        target: 5,
        reward: 15,
        repeatable: true
    },
    spawn_50_stickmen: {
        id: 'spawn_50_stickmen',
        name: 'Commander',
        description: 'Spawn 50 stickmen',
        type: 'spawn',
        target: 50,
        reward: 75,
        repeatable: true
    },
    survive_5_rounds: {
        id: 'survive_5_rounds',
        name: 'First Steps',
        description: 'Survive 5 rounds',
        type: 'survive',
        target: 5,
        reward: 25,
        repeatable: true
    },
    survive_10_rounds: {
        id: 'survive_10_rounds',
        name: 'Survivor',
        description: 'Survive 10 rounds',
        type: 'survive',
        target: 10,
        reward: 50,
        repeatable: true
    },
    survive_25_rounds: {
        id: 'survive_25_rounds',
        name: 'Veteran',
        description: 'Survive 25 rounds',
        type: 'survive',
        target: 25,
        reward: 150,
        repeatable: true
    },
    survive_50_rounds: {
        id: 'survive_50_rounds',
        name: 'Elite Warrior',
        description: 'Survive 50 rounds',
        type: 'survive',
        target: 50,
        reward: 300,
        repeatable: true
    },
    buy_sniper: {
        id: 'buy_sniper',
        name: 'Sharpshooter',
        description: 'Purchase a sniper',
        type: 'buy_specific',
        target: 1,
        reward: 200,
        repeatable: false
    },
    buy_rocket_launcher: {
        id: 'buy_rocket_launcher',
        name: 'Heavy Artillery',
        description: 'Purchase a rocket launcher',
        type: 'buy_specific',
        target: 1,
        reward: 400,
        repeatable: false
    },
    place_3_money_machines: {
        id: 'place_3_money_machines',
        name: 'Business Starter',
        description: 'Place 3 money machines',
        type: 'place_machines',
        target: 3,
        reward: 50,
        repeatable: true
    },
    place_5_money_machines: {
        id: 'place_5_money_machines',
        name: 'Entrepreneur',
        description: 'Place 5 money machines',
        type: 'place_machines',
        target: 5,
        reward: 100,
        repeatable: true
    },
    defeat_gorilla: {
        id: 'defeat_gorilla',
        name: 'Gorilla Hunter',
        description: 'Defeat a gorilla boss',
        type: 'defeat_gorilla',
        target: 1,
        reward: 500,
        repeatable: true
    }
};