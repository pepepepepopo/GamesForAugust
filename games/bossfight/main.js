const player = {
  element: document.getElementById('player'),
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  speed: 7,
  health: 100
};

const boss = {
  element: document.getElementById('boss'),
  x: window.innerWidth / 2,
  y: 100,
  phase: 0,
  attackTimer: 0,
  specialAttackTimer: 0,
  health: 100,
  raygunAngle: 0,
  isPhase2: false,
  isPhase3: false
};

let projectiles = [];
let gameLoop;
let startTime;
let gameOver = false;
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

const backgroundMusic = document.getElementById('background-music');
const musicToggle = document.getElementById('music-toggle');
let isMusicPlaying = false;

const dialogueSequence = [
  "* So... you've managed to survive this long.",
  "* I must admit, I'm impressed.",
  "* But you know what they say...",
  "* The real battle...",
  "* BEGINS NOW!"
];

let currentDialogue = 0;
let isInDialogue = false;

function init() {
  player.x = screenWidth / 2;
  player.y = screenHeight / 2;
  player.health = 100;
  boss.x = screenWidth / 2;
  boss.y = 100;
  boss.phase = 0;
  boss.attackTimer = 0;
  boss.specialAttackTimer = 0;
  projectiles = [];
  gameOver = false;
  startTime = Date.now();
  
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('health-fill').style.width = '100%';
  
  updatePositions();
  setupAudio();
}

function setupAudio() {
  musicToggle.addEventListener('click', toggleMusic);
  
  // Setup for autoplay restrictions
  document.addEventListener('click', function initAudio() {
    if (!isMusicPlaying) {
      toggleMusic();
    }
    document.removeEventListener('click', initAudio);
  }, { once: true });
}

function toggleMusic() {
  const musicOn = musicToggle.querySelector('.music-on');
  const musicOff = musicToggle.querySelector('.music-off');
  
  if (isMusicPlaying) {
    backgroundMusic.pause();
    musicOn.classList.add('hidden');
    musicOff.classList.remove('hidden');
  } else {
    backgroundMusic.play().catch(console.error);
    musicOn.classList.remove('hidden');
    musicOff.classList.add('hidden');
  }
  
  isMusicPlaying = !isMusicPlaying;
}

function updatePositions() {
  player.element.style.transform = `translate(${player.x}px, ${player.y}px)`;
  boss.element.style.transform = `translate(${boss.x}px, ${boss.y}px) rotate(${boss.attackTimer}deg)`;
}

function movePlayer() {
  const horizontalInput = (keys.ArrowRight || keys.d) - (keys.ArrowLeft || keys.a);
  const verticalInput = (keys.ArrowDown || keys.s) - (keys.ArrowUp || keys.w);
  
  if (horizontalInput !== 0 || verticalInput !== 0) {
    const magnitude = Math.sqrt(horizontalInput * horizontalInput + verticalInput * verticalInput);
    player.x += (horizontalInput / magnitude) * player.speed;
    player.y += (verticalInput / magnitude) * player.speed;
  }
  
  player.x = Math.max(0, Math.min(screenWidth - 20, player.x));
  player.y = Math.max(0, Math.min(screenHeight - 20, player.y));
}

function createProjectile(x, y, angle, speed, type = 'normal') {
  const projectile = document.createElement('div');
  projectile.className = `projectile ${type !== 'normal' ? type + '-projectile' : ''}`;
  document.getElementById('game-container').appendChild(projectile);
  projectiles.push({
    element: projectile,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type,
    age: 0
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.age++;
    
    if (proj.type === 'spiral') {
      if (proj.age < 60) {  // Spiral formation phase
        const spiralAngle = proj.age * 0.1;
        proj.vx = Math.cos(spiralAngle) * 4;
        proj.vy = Math.sin(spiralAngle) * 4;
      } else if (proj.age === 60) {  // Transition to homing phase
        const angle = Math.atan2(player.y - proj.y, player.x - proj.x);
        proj.vx = Math.cos(angle) * 6;
        proj.vy = Math.sin(angle) * 6;
      }
    }
    
    // Handle bouncing projectiles - now with bounce count tracking
    if (proj.type === 'bouncing') {
      // Initialize bounce counts if they don't exist
      if (!proj.hasOwnProperty('bounceCountX')) {
        proj.bounceCountX = 0;
        proj.bounceCountY = 0;
      }
      
      // Only bounce if we haven't bounced on this axis yet
      if ((proj.x <= 0 || proj.x >= screenWidth) && proj.bounceCountX < 1) {
        proj.vx *= -1;
        proj.bounceCountX++;
      }
      if ((proj.y <= 0 || proj.y >= screenHeight) && proj.bounceCountY < 1) {
        proj.vy *= -1;
        proj.bounceCountY++;
      }
      
      // If we've used up all our bounces and we're out of bounds, remove the projectile
      if ((proj.bounceCountX >= 1 && (proj.x <= 0 || proj.x >= screenWidth)) ||
          (proj.bounceCountY >= 1 && (proj.y <= 0 || proj.y >= screenHeight))) {
        proj.element.remove();
        projectiles.splice(i, 1);
        continue;
      }
    }

    // Handle special projectile behaviors
    if (proj.type === 'trap' && proj.age > 30) {
      // Trap projectiles accelerate after a delay
      proj.vx *= 1.1;
      proj.vy *= 1.1;
    }
    
    proj.x += proj.vx;
    proj.y += proj.vy;
    
    if (proj.x < -100 || proj.x > screenWidth + 100 || 
        proj.y < -100 || proj.y > screenHeight + 100) {
      proj.element.remove();
      projectiles.splice(i, 1);
      continue;
    }
    
    proj.element.style.transform = `translate(${proj.x}px, ${proj.y}px)`;
    
    const dx = proj.x - player.x;
    const dy = proj.y - player.y;
    const hitDistance = proj.type === 'laser-beam' ? 10 : 15;
    
    if (Math.sqrt(dx * dx + dy * dy) < hitDistance) {
      // Different damage amounts for different projectile types
      const damageAmount = {
        'laser-beam': 5,
        'bouncing': 15,
        'trap': 20,
        'fake-safe': 10,
        'boxing': 12
      }[proj.type] || 10;
      
      takeDamage(damageAmount);
      if (proj.type !== 'laser-beam') {
        proj.element.remove();
        projectiles.splice(i, 1);
      }
    }
  }
}

function bossAttack() {
  boss.attackTimer++;
  boss.specialAttackTimer++;
  
  if (!boss.isPhase2) {
    switch (boss.phase) {
      case 0: // Circular attack
        if (boss.attackTimer % 20 === 0) {
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + boss.attackTimer * 0.1;
            createProjectile(boss.x + 25, boss.y + 25, angle, 4);
          }
        }
        break;
        
      case 1: // Aimed attack with spread
        if (boss.attackTimer % 30 === 0) {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          for (let i = -2; i <= 2; i++) {
            createProjectile(boss.x + 25, boss.y + 25, angle + i * 0.2, 5);
          }
        }
        break;
        
      case 2: // Spiral pattern
        if (boss.attackTimer % 5 === 0) {
          const angle = boss.attackTimer * 0.2;
          createProjectile(boss.x + 25, boss.y + 25, angle, 3, 'spiral');
        }
        break;
        
      case 3: // Laser beams
        if (boss.attackTimer % 60 === 0) {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          createProjectile(boss.x + 25, boss.y + 25, angle, 8, 'laser-beam');
        }
        break;

      case 4: // Cross pattern
        if (boss.attackTimer % 40 === 0) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
            createProjectile(boss.x + 25, boss.y + 25, angle + (boss.attackTimer * 0.05), 6, 'cross');
          }
        }
        break;

      case 5: // Rain attack
        if (boss.attackTimer % 10 === 0) {
          const x = Math.random() * screenWidth;
          createProjectile(x, -20, Math.PI / 2, 4, 'rain');
        }
        break;

      case 6: // Burst attack
        if (boss.attackTimer % 120 === 0) {
          const baseAngle = Math.random() * Math.PI * 2;
          for (let i = 0; i < 16; i++) {
            createProjectile(boss.x + 25, boss.y + 25, baseAngle + (i * Math.PI / 8), 7, 'burst');
          }
        }
        break;

      case 7: // Wave pattern
        if (boss.attackTimer % 15 === 0) {
          const waveOffset = Math.sin(boss.attackTimer * 0.1) * 2;
          for (let i = -1; i <= 1; i++) {
            createProjectile(boss.x + 25, boss.y + 25, Math.PI / 2 + waveOffset + (i * 0.3), 5, 'wave');
          }
        }
        break;

      case 8: // Raygun attack
        boss.raygunAngle = (boss.raygunAngle + 0.1) % (Math.PI * 2);
        if (boss.attackTimer % 5 === 0) {
          const baseAngle = boss.raygunAngle;
          for (let i = 0; i < 3; i++) {
            const offset = Math.sin(boss.attackTimer * 0.1) * 0.5;
            createProjectile(boss.x + 25, boss.y + 25, baseAngle + (i * (Math.PI * 2 / 3)) + offset, 9, 'raygun');
          }
        }
        break;

      case 9: // Boxing attack - creates a closing box pattern
        if (boss.attackTimer % 30 === 0) {
          const boxSize = 300 - (boss.attackTimer % 240);
          const centerX = player.x;
          const centerY = player.y;
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2);
            createProjectile(
              centerX + Math.cos(angle) * boxSize,
              centerY + Math.sin(angle) * boxSize,
              angle + Math.PI,
              3,
              'boxing'
            );
          }
        }
        break;

      case 10: // Bouncing attack - projectiles that bounce off walls
        if (boss.attackTimer % 45 === 0) {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          createProjectile(boss.x + 25, boss.y + 25, angle, 8, 'bouncing');
        }
        break;

      case 11: // Fake safe spot attack
        if (boss.attackTimer % 60 === 0) {
          const safeAngle = Math.random() * Math.PI * 2;
          for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            if (Math.abs(angle - safeAngle) > 0.2) {
              createProjectile(boss.x + 25, boss.y + 25, angle, 5, 'fake-safe');
            }
          }
          // Delayed projectile in the "safe" spot
          setTimeout(() => {
            if (!gameOver) {
              createProjectile(boss.x + 25, boss.y + 25, safeAngle, 7, 'trap');
            }
          }, 1000);
        }
        break;
    }
  } else if (boss.isPhase2) {
    const phase2Multiplier = 1.5; // Attacks are 50% faster
    
    switch (boss.phase) {
      case 0: // Enhanced circular attack
        if (boss.attackTimer % Math.floor(15/phase2Multiplier) === 0) {
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + boss.attackTimer * 0.15;
            createProjectile(boss.x + 25, boss.y + 25, angle, 5, 'bouncing');
          }
        }
        break;

      case 1: // Dual spiral chaos
        if (boss.attackTimer % 3 === 0) {
          const angle1 = boss.attackTimer * 0.3;
          const angle2 = boss.attackTimer * 0.3 + Math.PI;
          createProjectile(boss.x + 25, boss.y + 25, angle1, 4, 'spiral');
          createProjectile(boss.x + 25, boss.y + 25, angle2, 4, 'spiral');
        }
        break;

      case 2: // Cross laser storm
        if (boss.attackTimer % 30 === 0) {
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + (boss.attackTimer * 0.1);
            createProjectile(boss.x + 25, boss.y + 25, angle, 10, 'laser-beam');
          }
        }
        break;

      case 3: // Trap maze
        if (boss.attackTimer % 20 === 0) {
          const gridSize = 5;
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              if (Math.random() < 0.7) {
                createProjectile(
                  (screenWidth * (i + 1)) / (gridSize + 1),
                  (screenHeight * (j + 1)) / (gridSize + 1),
                  Math.random() * Math.PI * 2,
                  3,
                  'trap'
                );
              }
            }
          }
        }
        break;

      case 4: // Boxing hurricane
        if (boss.attackTimer % 15 === 0) {
          const angle = boss.attackTimer * 0.2;
          for (let i = 0; i < 8; i++) {
            createProjectile(
              boss.x + Math.cos(angle + i * Math.PI / 4) * 100,
              boss.y + Math.sin(angle + i * Math.PI / 4) * 100,
              angle + i * Math.PI / 4 + Math.PI,
              6,
              'boxing'
            );
          }
        }
        break;

      case 5: // Wave burst
        if (boss.attackTimer % 10 === 0) {
          const baseAngle = Math.sin(boss.attackTimer * 0.05) * Math.PI;
          for (let i = -2; i <= 2; i++) {
            createProjectile(boss.x + 25, boss.y + 25, baseAngle + i * 0.3, 7, 'wave');
            createProjectile(boss.x + 25, boss.y + 25, baseAngle + Math.PI + i * 0.3, 7, 'wave');
          }
        }
        break;

      case 6: // Rain of death
        if (boss.attackTimer % 5 === 0) {
          for (let i = 0; i < 3; i++) {
            const x = Math.random() * screenWidth;
            createProjectile(x, -20, Math.PI / 2, 8, 'rain');
          }
        }
        break;

      case 7: // Orbital raygun
        if (boss.attackTimer % 3 === 0) {
          const orbitRadius = 150;
          const orbitAngle = boss.attackTimer * 0.1;
          const orbitX = boss.x + Math.cos(orbitAngle) * orbitRadius;
          const orbitY = boss.y + Math.sin(orbitAngle) * orbitRadius;
          const aimAngle = Math.atan2(player.y - orbitY, player.x - orbitX);
          createProjectile(orbitX, orbitY, aimAngle, 10, 'raygun');
        }
        break;

      case 8: // Multi-bounce chaos
        if (boss.attackTimer % 25 === 0) {
          for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            createProjectile(boss.x + 25, boss.y + 25, angle, 9, 'bouncing');
          }
        }
        break;

      case 9: // Fake safe zones of doom
        if (boss.attackTimer % 40 === 0) {
          const safeZones = Array(3).fill(0).map(() => Math.random() * Math.PI * 2);
          for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            if (!safeZones.some(safe => Math.abs(angle - safe) < 0.2)) {
              createProjectile(boss.x + 25, boss.y + 25, angle, 6, 'fake-safe');
            }
          }
          setTimeout(() => {
            if (!gameOver) {
              safeZones.forEach(angle => {
                createProjectile(boss.x + 25, boss.y + 25, angle, 8, 'trap');
              });
            }
          }, 800);
        }
        break;

      case 10: // New attack pattern
        if (boss.attackTimer % 90 === 0) {
          // Create a spiral of trap projectiles
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100;
            createProjectile(
              boss.x + Math.cos(angle) * distance,
              boss.y + Math.sin(angle) * distance,
              angle + Math.PI,
              5,
              'trap'
            );
          }
        }
        break;
    }
  } else if (boss.isPhase3) {
    // Phase 3 attack patterns go here
  }
  
  // Change phase timing
  const phaseTime = boss.isPhase2 ? 180 : 240;
  if (boss.attackTimer % phaseTime === 0) {
    boss.phase = (boss.phase + 1) % (boss.isPhase2 ? 11 : 12); 
    boss.x = Math.random() * (screenWidth - 100) + 50;
    boss.y = Math.random() * (screenHeight / 3) + 50;
  }
}

function takeDamage(amount) {
  player.health -= amount;
  document.getElementById('health-fill').style.width = `${player.health}%`;
  
  if (player.health <= 0) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  const survivalTime = Math.floor((Date.now() - startTime) / 1000);
  
  // Calculate statistics
  const projectilesAvoided = projectiles.length;
  const phase = boss.isPhase2 ? "Phase 2" : "Phase 1";
  
  const gameOverScreen = document.getElementById('game-over');
  gameOverScreen.innerHTML = `
    <h1>Game Over!</h1>
    <p>You fought valiantly for ${survivalTime} seconds!</p>
    <div class="stats">
      <div class="stat-item">
        <span>Time Survived:</span>
        <span>${survivalTime}s</span>
      </div>
      <div class="stat-item">
        <span>Final Phase:</span>
        <span>${phase}</span>
      </div>
      <div class="stat-item">
        <span>Projectiles Avoided:</span>
        <span>${projectilesAvoided}</span>
      </div>
    </div>
    <p>Can you survive longer next time?</p>
    <button onclick="restartGame()">Try Again</button>
  `;
  
  gameOverScreen.classList.remove('hidden');
  clearInterval(gameLoop);
  
  if (isMusicPlaying) {
    backgroundMusic.pause();
    const phase2Music = document.getElementById('phase2-music');
    phase2Music.pause();
  }
}

function updateTimer() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('timer').textContent = `${seconds}s`;
}

function gameUpdate() {
  if (gameOver) return;
  
  const survivalTime = Math.floor((Date.now() - startTime) / 1000);
  
  if (survivalTime === 120 && !isInDialogue && !boss.isPhase2) {
    startDialogueSequence();
    return;
  } else if (survivalTime === 240 && boss.isPhase2) {
    startPhase3();
    return;
  }
  
  if (!isInDialogue) {
    movePlayer();
    bossAttack();
    updateProjectiles();
    updatePositions();
    updateTimer();
  }
}

function startPhase2() {
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  document.body.appendChild(flash);
  
  setTimeout(() => flash.remove(), 500);
  
  document.getElementById('game-container').classList.add('phase2');
  boss.isPhase2 = true;
  
  boss.x = screenWidth / 2;
  boss.y = screenHeight / 3;
  
  player.speed = 8;
  
  boss.attackTimer = 0;
  boss.phase = 0;

  if (isMusicPlaying) {
    backgroundMusic.pause();
    const phase2Music = document.getElementById('phase2-music');
    phase2Music.currentTime = 0;
    phase2Music.play().catch(console.error);
  }
}

function startPhase3() {
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  document.body.appendChild(flash);
  
  setTimeout(() => flash.remove(), 500);
  
  document.getElementById('game-container').classList.add('phase3');
  boss.isPhase2 = false;
  boss.isPhase3 = true;
  
  boss.x = screenWidth / 2;
  boss.y = screenHeight / 3;
  player.speed = 9;
  
  boss.attackTimer = 0;
  boss.phase = 0;
  
  projectiles.forEach(proj => proj.element.remove());
  projectiles = [];
}

function restartGame() {
  // Reset game state
  boss.isPhase2 = false;
  boss.isPhase3 = false;
  player.speed = 7;
  
  // Remove phase-specific classes
  document.getElementById('game-container').classList.remove('phase2', 'phase3');
  
  // Clear all existing elements
  projectiles.forEach(proj => proj.element.remove());
  projectiles = [];
  
  // Reset music
  if (isMusicPlaying) {
    const phase2Music = document.getElementById('phase2-music');
    phase2Music.pause();
    phase2Music.currentTime = 0;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(console.error);
  }
  
  // Initialize new game
  init();
  gameLoop = setInterval(gameUpdate, 1000 / 60);
}

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  a: false,
  d: false,
  w: false,
  s: false
};

function handleResize() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  player.x = Math.min(player.x, screenWidth - 20);
  player.y = Math.min(player.y, screenHeight - 20);
}

window.addEventListener('resize', handleResize);

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() in keys) {
    keys[e.key.toLowerCase()] = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key.toLowerCase() in keys) {
    keys[e.key.toLowerCase()] = false;
  }
});

function startDialogueSequence() {
  isInDialogue = true;
  currentDialogue = 0;
  const dialogueBox = document.createElement('div');
  dialogueBox.id = 'dialogue-box';
  dialogueBox.innerHTML = `
    <p id="dialogue-text"></p>
    <span id="dialogue-continue">▼</span>
  `;
  document.getElementById('game-container').appendChild(dialogueBox);
  dialogueBox.style.display = 'block';
  
  // Clear all projectiles
  projectiles.forEach(proj => proj.element.remove());
  projectiles = [];
  
  showNextDialogue();
  
  document.addEventListener('click', handleDialogueClick);
}

function handleDialogueClick() {
  if (!isInDialogue) return;
  
  if (currentDialogue < dialogueSequence.length - 1) {
    currentDialogue++;
    showNextDialogue();
  } else {
    endDialogueSequence();
  }
}

function showNextDialogue() {
  const dialogueText = document.getElementById('dialogue-text');
  dialogueText.textContent = dialogueSequence[currentDialogue];
}

function endDialogueSequence() {
  document.removeEventListener('click', handleDialogueClick);
  const dialogueBox = document.getElementById('dialogue-box');
  dialogueBox.style.display = 'none';
  dialogueBox.remove();
  isInDialogue = false;
  
  // Transition to phase 2
  startPhase2();
}

// Start the game
init();
gameLoop = setInterval(gameUpdate, 1000 / 60);