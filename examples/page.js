// Create a colorful heading
const heading = document.createElement('h1');
heading.textContent = 'Hello from the Sandbox!';
heading.style.color = 'blue';
heading.style.textAlign = 'center';
document.body.appendChild(heading);

// Create a button
const button = document.createElement('button');
button.textContent = 'Click me!';
button.style.padding = '10px 20px';
button.style.fontSize = '16px';
button.style.backgroundColor = '#4CAF50';
button.style.color = 'white';
button.style.border = 'none';
button.style.borderRadius = '5px';
button.style.cursor = 'pointer';

button.onclick = function () {
    alert('Button clicked in sandbox!');
};

document.body.appendChild(button);

// Add some styled content
const div = document.createElement('div');
div.innerHTML = `
    <p style="color: red; font-size: 18px;">This is rendered HTML!</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  `;
document.body.appendChild(div);

console.log('DOM elements created!');