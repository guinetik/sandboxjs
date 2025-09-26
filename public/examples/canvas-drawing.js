// Canvas Drawing Example
// Interactive canvas with mouse/touch drawing

console.log("Setting up canvas drawing...");

// Create canvas
const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 400;
canvas.style.cssText = `
  border: 3px solid #34495e;
  border-radius: 10px;
  display: block;
  margin: 1rem auto;
  cursor: crosshair;
  background: white;
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
`;

// Color picker
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#e74c3c';
colorPicker.style.cssText = `
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

// Brush size
const sizeSlider = document.createElement('input');
sizeSlider.type = 'range';
sizeSlider.min = '1';
sizeSlider.max = '20';
sizeSlider.value = '3';
sizeSlider.style.cssText = `
  width: 150px;
`;

const sizeLabel = document.createElement('span');
sizeLabel.textContent = 'Size: 3px';
sizeLabel.style.cssText = `
  color: #34495e;
  font-weight: bold;
`;

// Clear button
const clearBtn = document.createElement('button');
clearBtn.textContent = '🗑️ Clear';
clearBtn.style.cssText = `
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Drawing functions
function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();

  lastX = currentX;
  lastY = currentY;
}

function stopDrawing() {
  isDrawing = false;
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const mouseEvent = new MouseEvent('mouseup', {});
  canvas.dispatchEvent(mouseEvent);
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
controls.appendChild(colorPicker);
controls.appendChild(sizeSlider);
controls.appendChild(sizeLabel);
controls.appendChild(clearBtn);

document.body.appendChild(title);
document.body.appendChild(canvas);
document.body.appendChild(controls);

// Draw a welcome message
ctx.font = '20px Arial';
ctx.fillStyle = '#7f8c8d';
ctx.textAlign = 'center';
ctx.fillText('Start drawing with your mouse or finger!', canvas.width/2, canvas.height/2);

console.log('Canvas ready for drawing! 🖌️');