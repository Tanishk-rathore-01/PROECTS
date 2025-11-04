let count = 0;
const elements = {};

const actions = {
    increment: () => { count++; updateDisplay('Increased!'); },
    decrement: () => { count--; updateDisplay('Decreased!'); },
    reset: () => { 
        const oldCount = count;
        count = 0; 
        updateDisplay(oldCount ? `Counter reset from ${oldCount}` : 'Counter reset!');
    }
};

const updateDisplay = (message = '') => {
    if (elements.display) {
        elements.display.style.transform = 'scale(1.2)';
        elements.display.textContent = count;
        setTimeout(() => elements.display.style.transform = 'scale(1)', 100);
        
        if (message && elements.message) {
            elements.message.textContent = message;
            elements.message.style.opacity = '1';
            setTimeout(() => elements.message.style.opacity = '0', 1000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    elements.display = document.getElementById('main');
    elements.message = document.getElementById('message');
    
    // Keyboard controls
    document.addEventListener('keydown', ({ key }) => {
        if (key === 'ArrowUp' || key === '+') actions.increment();
        else if (key === 'ArrowDown' || key === '-') actions.decrement();
        else if (key.toLowerCase() === 'r') actions.reset();
    });

    updateDisplay('Welcome! Use keyboard arrows or buttons to count');
});