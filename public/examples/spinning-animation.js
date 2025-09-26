// CSS Animation Example
// Demonstrates CSS animations and DOM manipulation

console.log("Creating spinning animation...");

// Add custom styles
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes rainbow {
    0% { background-color: #ff6b6b; }
    16% { background-color: #feca57; }
    33% { background-color: #48dbfb; }
    50% { background-color: #ff9ff3; }
    66% { background-color: #54a0ff; }
    83% { background-color: #5f27cd; }
    100% { background-color: #ff6b6b; }
  }
`;
document.head.appendChild(style);

// Create spinning box
const spinner = document.createElement('div');
spinner.style.cssText = `
  width: 100px;
  height: 100px;
  margin: 50px auto;
  animation: spin 2s linear infinite, rainbow 3s ease-in-out infinite;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 24px;
`;
spinner.textContent = '🌀';

// Create pulsing title
const title = document.createElement('h2');
title.textContent = 'Spinning & Pulsing Animation';
title.style.cssText = `
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite;
  color: #2c3e50;
  margin: 2rem 0;
`;

// Add control button
const controlBtn = document.createElement('button');
controlBtn.textContent = '⏸️ Pause';
controlBtn.style.cssText = `
  display: block;
  margin: 2rem auto;
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background: #e74c3c;
  color: white;
  cursor: pointer;
  font-size: 16px;
`;

let isPaused = false;
controlBtn.onclick = () => {
  if (isPaused) {
    spinner.style.animationPlayState = 'running';
    title.style.animationPlayState = 'running';
    controlBtn.textContent = '⏸️ Pause';
    controlBtn.style.background = '#e74c3c';
  } else {
    spinner.style.animationPlayState = 'paused';
    title.style.animationPlayState = 'paused';
    controlBtn.textContent = '▶️ Play';
    controlBtn.style.background = '#27ae60';
  }
  isPaused = !isPaused;
};

document.body.appendChild(title);
document.body.appendChild(spinner);
document.body.appendChild(controlBtn);