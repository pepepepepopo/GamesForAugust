export class UILayout {
    static calculateMobileLayout(canvas) {
        return {
            isNarrow: canvas.width < 450,
            buttonWidth: canvas.width < 450 ? 50 : 70,
            buttonHeight: canvas.width < 450 ? 24 : 30,
            fontSize: canvas.width < 450 ? '11px' : '14px',
            uiMargin: canvas.width < 450 ? 5 : 10,
            boxWidth: canvas.width < 450 ? 140 : 250
        };
    }

    static drawTextWithShadow(ctx, text, x, y, shadowColor, textColor, shadowX = 1, shadowY = 1) {
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowX, y + shadowY);
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);
    }

    static formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }
}

