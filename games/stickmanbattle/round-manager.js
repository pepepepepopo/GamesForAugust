import * as config from './config.js';
import { Stickman } from './stickman.js';

// Defines the properties of each enemy type for round generation.
export const ENEMY_TYPES = {
    normal: {
        id: 'normal',
        value: 1,
        minRound: 1,
        config: {
            cssClass: '',
            image: '/EnemyStickman.png',
            stats: {
                health: config.ENEMY_HEALTH,
                damage: config.ATTACK_DAMAGE,
                attackRange: config.ATTACK_RANGE,
                moveSpeed: config.MOVE_SPEED,
            }
        }
    },
    sword: {
        id: 'sword',
        value: 2,
        minRound: 10,
        config: {
            cssClass: 'with-sword',
            image: '/EnemyStickmanwithSword.png',
            stats: {
                health: 70,
                damage: 20,
                attackRange: 75,
                moveSpeed: 30,
            }
        }
    },
    gun: {
        id: 'gun',
        value: 4,
        minRound: 20,
        config: {
            cssClass: 'with-gun',
            image: '/EnemyStickmanwithGun.png',
            stats: {
                health: 60,
                damage: 15,
                attackRange: 300,
                moveSpeed: 25,
            }
        }
    },
    bomb: {
        id: 'bomb',
        value: 3,
        minRound: 30,
        config: {
            cssClass: 'bomb',
            image: '/BombEnemyStickman.png',
            stats: {
                health: 40,
                damage: 80, // Explosion damage
                attackRange: 70, // Detonation range
                moveSpeed: 35,
                explosionRadius: 80,
            }
        }
    },
    car: {
        id: 'car',
        value: 5,
        minRound: 40,
        config: {
            cssClass: 'on-car',
            image: '/EnemyStickmanoncar.png',
            stats: {
                health: 150,
                damage: 18,
                attackRange: 65,
                moveSpeed: 45,
            }
        }
    },
    car_sword: {
        id: 'car_sword',
        value: 10,
        minRound: 50,
        config: {
            cssClass: 'on-car with-sword',
            image: '/Enemystickmanwithswordoncar.png',
            stats: {
                health: 180,
                damage: 30,
                attackRange: 80,
                moveSpeed: 45,
            }
        }
    },
    car_gun: {
        id: 'car_gun',
        value: 20,
        minRound: 60,
        config: {
            cssClass: 'on-car with-gun',
            image: '/Enemystickmanwithgunoncar.png',
            stats: {
                health: 160,
                damage: 25,
                attackRange: 320,
                moveSpeed: 40,
            }
        }
    },
    gorilla: {
        id: 'gorilla',
        value: 999, // Special value - handled separately
        minRound: 100,
        config: {
            cssClass: 'gorilla',
            image: '/EnemyGorilla.png',
            stats: {
                health: 500, // Base health per gorilla
                damage: 100,
                attackRange: 150,
                moveSpeed: 60, // Increased from 35 to 60
                jumpCooldown: 5000, // 5 second cooldown
                smashRange: 120,
                bulletResistance: true, // New property for bullet resistance
            }
        }
    },
};

/**
 * Generates an array of enemy stickman configurations for a given round.
 * The total 'value' of enemies increases with the round number.
 * @param {number} roundNumber The current round number.
 * @returns {Array<object>} An array of enemy configurations to be passed to the Stickman constructor.
 */
export function generateRoundEnemies(roundNumber) {
    const enemiesToSpawn = [];
    
    // Check if this is a gorilla round (every 100 rounds)
    if (roundNumber % 100 === 0) {
        const gorillaLevel = Math.floor(roundNumber / 100);
        
        // Spawn multiple gorillas with increasing health
        for (let i = 0; i < gorillaLevel; i++) {
            const gorillaConfig = { ...ENEMY_TYPES.gorilla.config };
            // Each gorilla gets health based on the round level
            gorillaConfig.stats.health = 500 * gorillaLevel;
            gorillaConfig.stats.damage = 100 + (20 * (gorillaLevel - 1));
            gorillaConfig.stats.smashRange = 120 + (20 * (gorillaLevel - 1));
            gorillaConfig.gorillaLevel = gorillaLevel;
            
            enemiesToSpawn.push(gorillaConfig);
        }
        return enemiesToSpawn;
    }
    
    // Regular round generation
    let totalValue = 2 + Math.floor(roundNumber * 1.5); 

    // Determine which enemy types are available for the current round.
    const availableEnemyTypes = Object.values(ENEMY_TYPES)
        .filter(type => type.id !== 'gorilla' && roundNumber >= type.minRound)
        .sort((a, b) => b.value - a.value); // Sort from most to least valuable.

    if (availableEnemyTypes.length === 0) {
        return [];
    }

    // A greedy algorithm to select enemies. It prioritizes filling the value
    // with stronger enemies first, then fills the rest with weaker ones.
    let remainingValue = totalValue;
    while (remainingValue > 0) {
        // Find the most valuable enemy type that can fit within the remaining value.
        const affordableEnemy = availableEnemyTypes.find(type => type.value <= remainingValue);

        if (affordableEnemy) {
            // Add the selected enemy's configuration to the spawn list.
            enemiesToSpawn.push(affordableEnemy.config);
            remainingValue -= affordableEnemy.value;
        } else {
            // If no enemy can fit (e.g., remainingValue is < smallest enemy value), break the loop.
            break;
        }
    }

    return enemiesToSpawn;
}