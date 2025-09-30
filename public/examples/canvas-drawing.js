// Canvas Drawing Example
// Interactive canvas with mouse/touch drawing

console.log("Setting up canvas drawing...");

// Get available space for responsive sizing
const getCanvasSize = () => {
  const maxWidth = Math.min(window.innerWidth - 40, 600); // 20px margin on each side
  const aspectRatio = 4/3;
  const height = Math.min(maxWidth / aspectRatio, 400);
  return { width: maxWidth, height };
};

// Create canvas
const canvas = document.createElement('canvas');
const { width, height } = getCanvasSize();
canvas.width = width;
canvas.height = height;
canvas.style.cssText = `
  border: 2px solid #34495e;
  border-radius: 8px;
  display: block;
  margin: 1rem auto;
  cursor: crosshair;
  background: white;
  max-width: 100%;
  height: auto;
  touch-action: none;
`;

const ctx = canvas.getContext('2d');
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.strokeStyle = '#e74c3c';

// Title
const title = document.createElement('h2');
title.textContent = '🎨 Canvas Drawing Pad';
title.style.cssText = `
  text-align: center;
  color: #2c3e50;
  margin: 1rem 0;
`;

// Controls
const controls = document.createElement('div');
controls.style.cssText = `
  text-align: center;
  margin: 1rem 0;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0 1rem;
`;

// Color picker
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#e74c3c';
colorPicker.style.cssText = `
  width: 60px;
  height: 50px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`;

// Brush size container for better mobile layout
const sizeContainer = document.createElement('div');
sizeContainer.style.cssText = `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

// Brush size
const sizeSlider = document.createElement('input');
sizeSlider.type = 'range';
sizeSlider.min = '1';
sizeSlider.max = '20';
sizeSlider.value = '3';
sizeSlider.style.cssText = `
  width: 120px;
  height: 40px;
  cursor: pointer;
`;

const sizeLabel = document.createElement('span');
sizeLabel.textContent = 'Size: 3px';
sizeLabel.style.cssText = `
  color: #34495e;
  font-weight: bold;
  font-size: 14px;
`;

// Clear button
const clearBtn = document.createElement('button');
clearBtn.textContent = '🗑️ Clear';
clearBtn.style.cssText = `
  padding: 1rem 1.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  min-height: 50px;
  font-weight: bold;
`;

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Drawing functions with proper coordinate scaling
function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  isDrawing = true;
  const coords = getCoordinates(e);
  lastX = coords.x;
  lastY = coords.y;
}

function draw(e) {
  if (!isDrawing) return;

  const coords = getCoordinates(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();

  lastX = coords.x;
  lastY = coords.y;
}

function stopDrawing() {
  isDrawing = false;
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Improved touch events for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startDrawing(touch);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  draw(touch);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  stopDrawing();
});

canvas.addEventListener('touchcancel', (e) => {
  e.preventDefault();
  stopDrawing();
});

// Control event listeners
colorPicker.addEventListener('change', (e) => {
  ctx.strokeStyle = e.target.value;
});

sizeSlider.addEventListener('input', (e) => {
  ctx.lineWidth = e.target.value;
  sizeLabel.textContent = `Size: ${e.target.value}px`;
});

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  console.log('Canvas cleared!');
});

// Assemble everything
sizeContainer.appendChild(sizeSlider);
sizeContainer.appendChild(sizeLabel);

controls.appendChild(colorPicker);
controls.appendChild(sizeContainer);
controls.appendChild(clearBtn);

document.body.appendChild(title);
document.body.appendChild(canvas);
document.body.appendChild(controls);

// Draw a welcome message (responsive font size)
const fontSize = Math.max(16, Math.min(24, canvas.width / 30));
ctx.font = `${fontSize}px Arial`;
ctx.fillStyle = '#7f8c8d';
ctx.textAlign = 'center';
ctx.fillText('Start drawing with your mouse or finger!', canvas.width/2, canvas.height/2);

// Add window resize handler for responsiveness
window.addEventListener('resize', () => {
  const newSize = getCanvasSize();
  canvas.width = newSize.width;
  canvas.height = newSize.height;

  // Redraw welcome message
  const newFontSize = Math.max(16, Math.min(24, canvas.width / 30));
  ctx.font = `${newFontSize}px Arial`;
  ctx.fillStyle = '#7f8c8d';
  ctx.textAlign = 'center';
  ctx.fillText('Start drawing with your mouse or finger!', canvas.width/2, canvas.height/2);

  // Restore drawing settings
  ctx.lineWidth = sizeSlider.value;
  ctx.lineCap = 'round';
  ctx.strokeStyle = colorPicker.value;
});

console.log('Canvas ready for drawing! 🖌️');