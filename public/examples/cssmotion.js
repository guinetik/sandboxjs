const box = document.createElement('div');
  box.style.width = '100px';
  box.style.height = '100px';
  box.style.backgroundColor = 'red';
  box.style.animation = 'spin 2s linear infinite';

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(box);