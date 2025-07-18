import { gameState, initPhysics } from './game-state.js';
import { startGameLoop } from './game-loop.js';
import { handleStartRound, handleForfeit } from './round-handlers.js';
import { setupUI, updateUICoins } from './ui.js';
import { initAudio, playSound, playBackgroundMusic } from './audio.js';
import { initMoneyMachinePlacement } from './money-machine.js';
import { setupSettings } from './settings.js';
import { missionManager } from './missions.js';
import { customStickmanManager } from './custom-stickman.js';

function initGame() {
    // Show game container and start game logic
    const gameContainer = document.getElementById('game-container');
    gameContainer.classList.remove('hidden');

    // Add floor to game world
    const floorDiv = document.createElement('div');
    floorDiv.classList.add('floor');
    gameState.gameWorld.appendChild(floorDiv);

    // Initialize physics engine
    initPhysics();
    
    updateUICoins();
    setupUI(handleStartRound, handleForfeit);
    initMoneyMachinePlacement();
    setupSettings();
    setupMissions();
    
    startGameLoop();
}

function setupMissions() {
    const toggleBtn = document.getElementById('toggle-missions-btn');
    const container = document.getElementById('missions-container');
    let isCollapsed = false;

    toggleBtn.addEventListener('click', () => {
        if (isCollapsed) {
            container.style.display = 'block';
            toggleBtn.textContent = '−';
        } else {
            container.style.display = 'none';
            toggleBtn.textContent = '+';
        }
        isCollapsed = !isCollapsed;
    });

    // Force update missions UI when setup is called
    setTimeout(() => {
        missionManager.updateMissionUI();
    }, 200);
}

function setupIntro() {
    const introScreen = document.getElementById('intro-screen');
    introScreen.addEventListener('click', async () => {
        try {
            console.log('User clicked - initializing audio...');
            await initAudio(); // Ensure audio is ready
            
            // Ensure audio context is resumed after user interaction
            if (window.audioContext && window.audioContext.state === 'suspended') {
                await window.audioContext.resume();
                console.log('Audio context resumed after user interaction');
            }
            
            // Add a small delay to ensure everything is properly initialized
            setTimeout(() => {
                console.log('Starting background music...');
                playBackgroundMusic(); // Start music on user interaction
                
                // Test sound to verify audio is working
                setTimeout(() => {
                    console.log('Testing coin sound...');
                    playSound('coin', 0.8);
                }, 500);
            }, 200);
        } catch (e) {
            console.error("Error initializing audio:", e);
        }
        
        introScreen.style.display = 'none'; // Hide intro
        
        // Initialize custom stickman manager
        customStickmanManager;
        
        initGame(); // Initialize the rest of the game
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', setupIntro);