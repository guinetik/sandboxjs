// Hello World Example
// A simple introduction to the sandbox

console.log("Hello, Sandbox! 👋");

// Create a colorful greeting
const heading = document.createElement('h1');
heading.textContent = 'Welcome to JS Sandbox!';
heading.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
heading.style.backgroundClip = 'text';
heading.style.webkitBackgroundClip = 'text';
heading.style.color = 'transparent';
heading.style.textAlign = 'center';
heading.style.fontSize = '3rem';
heading.style.margin = '2rem 0';

document.body.appendChild(heading);

// Add some interactive content
const button = document.createElement('button');
button.textContent = '🎉 Click me!';
button.style.cssText = `
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 10px;
  background: #4ecdc4;
  color: white;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  transition: transform 0.2s;
`;

button.onmouseover = () => button.style.transform = 'scale(1.05)';
button.onmouseout = () => button.style.transform = 'scale(1)';
button.onclick = () => {
  alert('Hello from the sandbox! 🚀');
  console.log('Button clicked!');
};

document.body.appendChild(button);