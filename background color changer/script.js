// Select elements
const colorButtons = document.querySelectorAll('.color-btn');
const randomBtn = document.getElementById('randomBtn');
const resetBtn = document.getElementById('resetBtn');
const colorDisplay = document.getElementById('colorDisplay');

// Function to change background color
function changeBackground(color) {
    document.body.style.backgroundColor = color;
    colorDisplay.textContent = `Current Color: ${color.toUpperCase()}`;
}

// Add event listeners to color buttons
colorButtons.forEach(button => {
    button.addEventListener('click', () => {
        const color = button.getAttribute('data-color');
        changeBackground(color);
    });
});

// Generate random color function
function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

// Random button event listener
randomBtn.addEventListener('click', () => {
    const randomColor = getRandomColor();
    changeBackground(randomColor);
});

// Reset button event listener
resetBtn.addEventListener('click', () => {
    changeBackground('#FFFFFF');
});
