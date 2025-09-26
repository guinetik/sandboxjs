// Interactive Form Example
// Shows form handling, validation, and DOM updates

console.log("Building interactive form...");

// Create form container
const container = document.createElement('div');
container.style.cssText = `
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: #f8f9fa;
`;

// Form title
const title = document.createElement('h2');
title.textContent = '🚀 User Registration';
title.style.cssText = `
  text-align: center;
  color: #2c3e50;
  margin-bottom: 1.5rem;
`;

// Create form
const form = document.createElement('form');
form.innerHTML = `
  <div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #34495e;">
      Name:
    </label>
    <input type="text" id="name" required
           style="width: 100%; padding: 0.8rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem;">
  </div>

  <div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #34495e;">
      Email:
    </label>
    <input type="email" id="email" required
           style="width: 100%; padding: 0.8rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem;">
  </div>

  <div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #34495e;">
      Favorite Language:
    </label>
    <select id="language" style="width: 100%; padding: 0.8rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem;">
      <option value="">Select...</option>
      <option value="javascript">JavaScript</option>
      <option value="python">Python</option>
      <option value="rust">Rust</option>
      <option value="go">Go</option>
    </select>
  </div>

  <button type="submit" style="
    width: 100%;
    padding: 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background 0.3s;
  ">
    Register 🎯
  </button>
`;

// Result display
const result = document.createElement('div');
result.style.cssText = `
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 5px;
  display: none;
`;

// Form validation and submission
form.onsubmit = (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const language = document.getElementById('language').value;

  if (!name || !email || !language) {
    result.style.cssText += 'background: #e74c3c; color: white; display: block;';
    result.innerHTML = '❌ Please fill in all fields!';
    return;
  }

  result.style.cssText += 'background: #27ae60; color: white; display: block;';
  result.innerHTML = `
    ✅ Registration Successful!<br>
    <strong>Name:</strong> ${name}<br>
    <strong>Email:</strong> ${email}<br>
    <strong>Language:</strong> ${language}
  `;

  console.log('Form submitted:', { name, email, language });

  // Reset form after 3 seconds
  setTimeout(() => {
    form.reset();
    result.style.display = 'none';
  }, 3000);
};

// Add hover effect to button
const submitBtn = form.querySelector('button');
submitBtn.onmouseover = () => submitBtn.style.background = '#2980b9';
submitBtn.onmouseout = () => submitBtn.style.background = '#3498db';

// Assemble the form
container.appendChild(title);
container.appendChild(form);
container.appendChild(result);
document.body.appendChild(container);