export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(pickaxe, canvas) {
        const targetY = pickaxe.y - canvas.height / 3;
        this.y += (targetY - this.y) * 0.05;
        this.x = 0;
    }
}

