// Sound management using HTML5 Audio for better compatibility
let audioInitialized = false;
let musicVolume = 0.5;
let sfxVolume = 1.0;
let backgroundMusic = null;
const audioElements = {};

const soundPaths = {
    buy: '/Buying Sound.mp3',
    punch: '/punch-notification_sound-493565 (1).mp3',
    coin: '/mario-coin-sound-effect.mp3',
    death: '/playerdeath.wav',
    gunshot: '/Roblox pistol shooting and reloading sound (mp3cut.net).mp3',
    explosion: '/explode.mp3',
    car_start: '/car engine starting.mp3',
    heal: '/heal.mp3',
    background: '/Wii Party Soundtrack - Main Menu Music.mp3'
};

export async function initAudio() {
    console.log('Initializing HTML5 Audio system...');
    
    // Load volumes from localStorage
    musicVolume = localStorage.getItem('musicVolume') !== null ? parseFloat(localStorage.getItem('musicVolume')) : 0.5;
    sfxVolume = localStorage.getItem('sfxVolume') !== null ? parseFloat(localStorage.getItem('sfxVolume')) : 1.0;

    try {
        // Pre-load all audio elements
        for (const [name, path] of Object.entries(soundPaths)) {
            if (name === 'background') continue; // Handle background music separately
            
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = sfxVolume;
            audioElements[name] = audio;
            
            // Add error handling
            audio.addEventListener('error', (e) => {
                console.error(`Error loading audio ${name}:`, e);
            });
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`Audio loaded: ${name}`);
            });
        }
        
        // Initialize background music
        backgroundMusic = new Audio(soundPaths.background);
        backgroundMusic.loop = true;
        backgroundMusic.volume = musicVolume;
        backgroundMusic.preload = 'auto';
        
        audioInitialized = true;
        console.log('HTML5 Audio system initialized successfully');
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

export function playSound(name, volume = 1.0) {
    try {
        if (!audioInitialized || !audioElements[name]) {
            console.warn(`Sound ${name} not ready or not found.`);
            return;
        }
        
        const audio = audioElements[name];
        // Reset to beginning and set volume
        audio.currentTime = 0;
        audio.volume = Math.min(volume * sfxVolume, 1.0);
        
        // Play with promise handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`Playing sound: ${name} at volume ${audio.volume}`);
            }).catch(error => {
                console.error(`Error playing sound ${name}:`, error);
            });
        }
    } catch (error) {
        console.error(`Error in playSound for ${name}:`, error);
    }
}

export function playBackgroundMusic() {
    try {
        if (!audioInitialized || !backgroundMusic) {
            console.warn('Background music not ready or not found.');
            return;
        }
        
        backgroundMusic.currentTime = 0;
        backgroundMusic.volume = musicVolume;
        
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Background music started at volume:', backgroundMusic.volume);
            }).catch(error => {
                console.error('Error playing background music:', error);
            });
        }
    } catch (error) {
        console.error('Error starting background music:', error);
    }
}

export function setMusicVolume(level) {
    musicVolume = parseFloat(level);
    if (backgroundMusic) {
        backgroundMusic.volume = musicVolume;
    }
    localStorage.setItem('musicVolume', musicVolume.toString());
}

export function setSfxVolume(level) {
    sfxVolume = parseFloat(level);
    // Update all loaded sound effects
    for (const audio of Object.values(audioElements)) {
        if (audio && audio.volume !== undefined) {
            audio.volume = sfxVolume;
        }
    }
    localStorage.setItem('sfxVolume', sfxVolume.toString());
}

export function getMusicVolume() {
    return musicVolume;
}

export function getSfxVolume() {
    return sfxVolume;
}