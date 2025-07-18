import { gameState } from './game-state.js';
import { updateUICoins } from './ui.js';
import { playSound } from './audio.js';
import { createBuyCoinAnimation } from './animations.js';

export class CustomStickman {
    constructor() {
        this.customStickmen = new Map(); // Store custom stickmen by ID
        this.isDrawing = false;
        this.canvas = null;
        this.ctx = null;
        this.modal = null;
        this.currentStep = 'range'; // 'range' or 'drawing'
        this.selectedRange = null; // 'close' or 'long'
    }

    setupCustomStickmanUI() {
        // Create custom stickman modal
        this.modal = document.createElement('div');
        this.modal.id = 'custom-stickman-modal';
        this.modal.className = 'hidden';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 500;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background-color: #333;
            border: 3px solid #666;
            border-radius: 15px;
            padding: 20px;
            max-width: 600px;
            width: 90%;
            color: white;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #555;
            padding-bottom: 10px;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Create Custom Stickman';
        title.style.margin = '0';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 32px;
            cursor: pointer;
            font-weight: bold;
        `;
        closeBtn.addEventListener('click', () => this.closeModal());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create content area that will change based on step
        const content = document.createElement('div');
        content.id = 'custom-stickman-content';

        container.appendChild(header);
        container.appendChild(content);
        this.modal.appendChild(container);
        document.body.appendChild(this.modal);

        this.setupRangeSelection();
    }

    setupRangeSelection() {
        const content = document.getElementById('custom-stickman-content');
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Choose Your Stickman Type</h3>
                <p style="color: #ccc; margin-bottom: 30px;">Select the combat style for your custom stickman:</p>
                
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button id="close-range-btn" style="
                        padding: 20px 30px;
                        background-color: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        flex: 1;
                        max-width: 200px;
                    ">
                        <div style="font-size: 18px; margin-bottom: 8px;">⚔️ Close Range</div>
                        <div style="font-size: 12px; color: #ddd;">Melee combat, fists or weapons</div>
                    </button>
                    
                    <button id="long-range-btn" style="
                        padding: 20px 30px;
                        background-color: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        flex: 1;
                        max-width: 200px;
                    ">
                        <div style="font-size: 18px; margin-bottom: 8px;">🏹 Long Range</div>
                        <div style="font-size: 12px; color: #ddd;">Ranged combat, guns or projectiles</div>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('close-range-btn').addEventListener('click', () => {
            this.selectedRange = 'close';
            this.setupDrawingInterface();
        });

        document.getElementById('long-range-btn').addEventListener('click', () => {
            this.selectedRange = 'long';
            this.setupDrawingInterface();
        });
    }

    setupDrawingInterface() {
        const content = document.getElementById('custom-stickman-content');
        const instructions = this.selectedRange === 'close' ? 
            'Draw your close-range stickman below. Include any melee weapons if desired. AI will analyze your drawing!' :
            'Draw your long-range stickman below. Include both the character AND the weapon/projectile they will use!';

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <button id="back-btn" style="
                    padding: 8px 16px;
                    background-color: #666;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                ">← Back</button>
                <h3 style="display: inline; margin: 0;">${this.selectedRange === 'close' ? 'Close Range' : 'Long Range'} Stickman</h3>
            </div>
            
            <p style="color: #ccc; margin-bottom: 15px; text-align: center;">${instructions}</p>

            <canvas id="drawing-canvas" style="
                border: 2px solid #666;
                background-color: white;
                cursor: crosshair;
                display: block;
                margin: 0 auto 20px;
            "></canvas>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="clear-btn" style="
                    padding: 10px 20px;
                    background-color: #666;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Clear</button>
                <button id="create-btn" style="
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">Create Stickman</button>
            </div>
        `;

        this.canvas = document.getElementById('drawing-canvas');
        this.canvas.width = 400;
        this.canvas.height = 300;
        this.setupCanvas();

        document.getElementById('back-btn').addEventListener('click', () => this.setupRangeSelection());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('create-btn').addEventListener('click', () => this.createCustomStickman());
    }

    setupCanvas() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            drawing = true;
            const rect = this.canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();

            lastX = currentX;
            lastY = currentY;
        });

        this.canvas.addEventListener('mouseup', () => {
            drawing = false;
        });

        this.canvas.addEventListener('mouseout', () => {
            drawing = false;
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    openModal() {
        // Setup UI if not already done
        if (!this.modal) {
            this.setupCustomStickmanUI();
        }
        this.modal.classList.remove('hidden');
        this.currentStep = 'range';
        this.selectedRange = null;
        this.setupRangeSelection();
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.currentStep = 'range';
        this.selectedRange = null;
    }

    // Generate a proper UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async createCustomStickman() {
        // Convert canvas to data URL
        const imageDataUrl = this.canvas.toDataURL();
        
        // Check if canvas is empty
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = this.canvas.width;
        emptyCanvas.height = this.canvas.height;
        if (imageDataUrl === emptyCanvas.toDataURL()) {
            alert('Please draw something first!');
            return;
        }

        // Close the modal immediately
        this.closeModal();

        try {
            // Enhanced AI prompt based on range type
            const rangeType = this.selectedRange;
            const systemPrompt = `You are analyzing a ${rangeType} range stickman drawing to determine its combat properties. 

${rangeType === 'close' ? 
    'This is a CLOSE RANGE fighter. Look for melee weapons like swords, clubs, or fists. Base stats should favor high damage and health for close combat.' :
    'This is a LONG RANGE fighter. Look for ranged weapons like guns, bows, or projectiles. Base stats should favor high attack range and moderate damage.'
}

Based on the drawing, determine:
- name: A creative name for this stickman
- health: Health points (${rangeType === 'close' ? '100-300' : '60-200'})
- damage: Attack damage (${rangeType === 'close' ? '20-100' : '15-80'})
- attackRange: Attack range in pixels (${rangeType === 'close' ? '60-150' : '200-500'})
- moveSpeed: Movement speed (${rangeType === 'close' ? '25-50' : '20-40'})
- cost: Cost in coins (50-800 based on power level)
- specialAbility: Brief description of any special ability based on the drawing

Respond with JSON only, no other text.`;

            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this ${rangeType} range stickman drawing and determine its combat properties:`
                            },
                            {
                                type: "image_url",
                                image_url: { url: imageDataUrl }
                            }
                        ]
                    }
                ],
                json: true
            });

            const properties = JSON.parse(completion.content);
            
            // Create custom stickman type with range-appropriate constraints
            const customId = `custom_${this.generateUUID()}`;
            const customStickman = {
                id: customId,
                name: properties.name || `Custom ${rangeType === 'close' ? 'Warrior' : 'Ranger'}`,
                cost: Math.max(50, Math.min(800, properties.cost || 100)),
                image: imageDataUrl,
                cssClass: 'custom-stickman',
                rangeType: rangeType,
                stats: {
                    health: Math.max(rangeType === 'close' ? 100 : 60, Math.min(rangeType === 'close' ? 300 : 200, properties.health || 120)),
                    damage: Math.max(rangeType === 'close' ? 20 : 15, Math.min(rangeType === 'close' ? 100 : 80, properties.damage || 30)),
                    attackRange: Math.max(rangeType === 'close' ? 60 : 200, Math.min(rangeType === 'close' ? 150 : 500, properties.attackRange || (rangeType === 'close' ? 80 : 300))),
                    moveSpeed: Math.max(rangeType === 'close' ? 25 : 20, Math.min(rangeType === 'close' ? 50 : 40, properties.moveSpeed || 30)),
                },
                specialAbility: properties.specialAbility || 'No special ability',
                isCustom: true
            };

            this.customStickmen.set(customId, customStickman);

            // Show success message
            this.showCreationSuccess(customStickman);

            // Refresh shop to include new custom stickman
            document.dispatchEvent(new CustomEvent('refreshShop'));

        } catch (error) {
            console.error('Error creating custom stickman:', error);
            alert('Failed to create custom stickman. Please try again.');
        }
    }

    showCreationSuccess(customStickman) {
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 1000;
            border: 3px solid #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            max-width: 400px;
        `;

        successModal.innerHTML = `
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Custom Stickman Created!</h2>
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">${customStickman.name}</p>
            <p style="margin: 0 0 10px 0; color: #FFD700;">Range: ${customStickman.rangeType === 'close' ? 'Close Range ⚔️' : 'Long Range 🏹'}</p>
            <p style="margin: 0 0 10px 0;">Cost: ${customStickman.cost} coins</p>
            <p style="margin: 0 0 10px 0;">Health: ${customStickman.stats.health}</p>
            <p style="margin: 0 0 10px 0;">Damage: ${customStickman.stats.damage}</p>
            <p style="margin: 0 0 10px 0;">Range: ${customStickman.stats.attackRange}</p>
            <p style="margin: 0 0 15px 0; font-style: italic; font-size: 14px;">"${customStickman.specialAbility}"</p>
            <p style="margin: 0; font-size: 14px; color: #ffeb3b;">Your custom stickman is now available in the shop!</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #ffeb3b;">Note: It will be lost if it dies!</p>
        `;

        document.body.appendChild(successModal);
        setTimeout(() => successModal.remove(), 6000);
    }

    getCustomStickmen() {
        return Array.from(this.customStickmen.values());
    }

    removeCustomStickman(id) {
        this.customStickmen.delete(id);
        document.dispatchEvent(new CustomEvent('refreshShop'));
    }
}

// Global instance
export const customStickmanManager = new CustomStickman();