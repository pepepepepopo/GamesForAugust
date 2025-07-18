import { gameState } from './game-state.js';
import * as config from './config.js';
import { updateUICoins } from './ui.js';
import { playSound } from './audio.js';
import { createBuyCoinAnimation } from './animations.js';
import { Stickman } from './stickman.js';
import { startMoneyMachinePlacement } from './money-machine.js';

const shopModal = document.getElementById('shop-modal');
const openShopBtn = document.getElementById('open-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
const shopItemsContainer = document.getElementById('shop-items-container');
const searchInput = document.getElementById('shop-search');

async function spawnStickman(typeId, buttonElement) {
    // Handle custom stickman creation
    if (typeId === 'create_custom') {
        if (gameState.playerCoins >= 10000) {
            gameState.playerCoins -= 10000;
            playSound('buy', 0.4);
            createBuyCoinAnimation(buttonElement);
            updateUICoins();
            
            // Close shop modal first
            shopModal.classList.add('hidden');
            
            // Open custom stickman creator
            const { customStickmanManager } = await import('./custom-stickman.js');
            customStickmanManager.openModal();
        }
        return;
    }

    // Check if it's a custom stickman
    if (typeId.startsWith('custom_')) {
        const { customStickmanManager } = await import('./custom-stickman.js');
        const customStickmen = customStickmanManager.getCustomStickmen();
        const customType = customStickmen.find(c => c.id === typeId);
        
        if (customType && gameState.playerCoins >= customType.cost) {
            gameState.playerCoins -= customType.cost;
            playSound('buy', 0.4);
            createBuyCoinAnimation(buttonElement);
            updateUICoins();
            gameState.addPlayerStickman(typeId);
        }
        return;
    }

    // Regular stickman logic
    const stickmanType = config.STICKMAN_TYPES[typeId];
    if (gameState.playerCoins >= stickmanType.cost) {
        gameState.playerCoins -= stickmanType.cost;
        
        if (typeId === 'money_machine') {
            playSound('buy', 0.4);
            createBuyCoinAnimation(buttonElement);
            updateUICoins();
            
            // Close shop modal immediately
            shopModal.classList.add('hidden');
            
            // Start placement mode after a short delay
            setTimeout(() => {
                startMoneyMachinePlacement();
            }, 100);
        } else {
            playSound('buy', 0.4);
            createBuyCoinAnimation(buttonElement);
            updateUICoins();
            gameState.addPlayerStickman(typeId);
        }
    }
}

function updateShopItemButtons() {
    const buttons = shopItemsContainer.querySelectorAll('.buy-btn');
    buttons.forEach(button => {
        const cost = parseInt(button.dataset.cost, 10);
        button.disabled = gameState.playerCoins < cost;
    });
}

function filterShopItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const items = shopItemsContainer.querySelectorAll('.shop-item');
    items.forEach(item => {
        const name = item.dataset.name.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function populateShop() {
    shopItemsContainer.innerHTML = '';
    
    // Add regular stickmen
    for (const typeId in config.STICKMAN_TYPES) {
        const type = config.STICKMAN_TYPES[typeId];
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.dataset.name = type.name;

        item.innerHTML = `
            <div class="shop-item-image" style="background-image: url('${type.image}')"></div>
            <div class="shop-item-name">${type.name}</div>
            <div class="shop-item-cost">
                <img src="/Coin1.png" alt="Coin">
                <span>${type.cost}</span>
            </div>
            <button class="buy-btn" data-type-id="${type.id}" data-cost="${type.cost}">Buy</button>
        `;
        shopItemsContainer.appendChild(item);

        const buyBtn = item.querySelector('.buy-btn');
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            spawnStickman(type.id, e.currentTarget);
        });
    }

    // Add "Create Custom Stickman" item in the shop
    const createCustomItem = document.createElement('div');
    createCustomItem.className = 'shop-item';
    createCustomItem.dataset.name = 'Create Custom Stickman';
    createCustomItem.style.border = '2px solid #FF6B6B';

    createCustomItem.innerHTML = `
        <div class="shop-item-image" style="background-color: #FF6B6B; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white;">✏️</div>
        <div class="shop-item-name">Create Custom Stickman</div>
        <div class="shop-item-cost">
            <img src="/Coin1.png" alt="Coin">
            <span>10000</span>
        </div>
        <button class="buy-btn" data-type-id="create_custom" data-cost="10000">Buy</button>
    `;
    shopItemsContainer.appendChild(createCustomItem);

    const createBtn = createCustomItem.querySelector('.buy-btn');
    createBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        spawnStickman('create_custom', e.currentTarget);
    });

    // Add custom stickmen that have been created
    const { customStickmanManager } = await import('./custom-stickman.js');
    const customStickmen = customStickmanManager.getCustomStickmen();
    
    for (const customType of customStickmen) {
        const item = document.createElement('div');
        item.className = 'shop-item custom-shop-item';
        item.dataset.name = customType.name;
        item.style.border = '2px solid #FFD700';

        item.innerHTML = `
            <div class="shop-item-image" style="background-image: url('${customType.image}'); background-size: cover;"></div>
            <div class="shop-item-name">${customType.name}</div>
            <div class="shop-item-cost">
                <img src="/Coin1.png" alt="Coin">
                <span>${customType.cost}</span>
            </div>
            <button class="buy-btn" data-type-id="${customType.id}" data-cost="${customType.cost}">Buy</button>
            <div style="font-size: 10px; color: #ffeb3b; margin-top: 5px;">Custom (Lost on death)</div>
            <div style="font-size: 9px; color: #ccc; margin-top: 2px; font-style: italic;">"${customType.specialAbility}"</div>
        `;
        shopItemsContainer.appendChild(item);

        const buyBtn = item.querySelector('.buy-btn');
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            spawnStickman(customType.id, e.currentTarget);
        });
    }

    updateShopItemButtons();
}

export function setupShop() {
    openShopBtn.addEventListener('click', () => {
        shopModal.classList.remove('hidden');
        updateShopItemButtons();
    });

    closeShopBtn.addEventListener('click', () => {
        shopModal.classList.add('hidden');
    });

    shopModal.addEventListener('click', (e) => {
        if (e.target === shopModal) {
            shopModal.classList.add('hidden');
        }
    });

    searchInput.addEventListener('input', filterShopItems);

    document.addEventListener('coinsUpdated', updateShopItemButtons);
    
    // Listen for custom stickman updates
    document.addEventListener('refreshShop', populateShop);

    populateShop();
}