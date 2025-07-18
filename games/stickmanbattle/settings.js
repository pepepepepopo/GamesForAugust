import { setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolume } from './audio.js';

const settingsModal = document.getElementById('settings-modal');
const openBtn = document.getElementById('settings-btn');
const closeBtn = document.getElementById('close-settings-btn');
const musicSlider = document.getElementById('music-volume-slider');
const sfxSlider = document.getElementById('sfx-volume-slider');
const musicValueEl = document.getElementById('music-volume-value');
const sfxValueEl = document.getElementById('sfx-volume-value');

function updateVolumeLabels() {
    musicValueEl.textContent = `${Math.round(musicSlider.value * 100)}%`;
    sfxValueEl.textContent = `${Math.round(sfxSlider.value * 100)}%`;
}

function openSettings() {
    // Set sliders to current values when opening
    musicSlider.value = getMusicVolume();
    sfxSlider.value = getSfxVolume();
    updateVolumeLabels();
    settingsModal.classList.remove('hidden');
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

export function setupSettings() {
    openBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });

    musicSlider.addEventListener('input', (e) => {
        setMusicVolume(e.target.value);
        updateVolumeLabels();
    });

    sfxSlider.addEventListener('input', (e) => {
        setSfxVolume(e.target.value);
        updateVolumeLabels();
    });
    
    // Initialize slider values on page load
    musicSlider.value = getMusicVolume();
    sfxSlider.value = getSfxVolume();
    updateVolumeLabels();
}