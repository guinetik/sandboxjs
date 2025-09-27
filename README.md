# JS Sandbox

A modular JavaScript sandbox for testing and experimenting with code in a safe, isolated environment. Built with vanilla ES6 modules and designed for maintainability.

This project was vibe-coded from a monolithic [codepen.io](https://codepen.io/guinetik/pen/XJXXegw) demo into a proper modular architecture.

![demo](demo.png)

## Features

- **Sandboxed execution**: JavaScript runs in an isolated iframe with no same-origin access
- **Syntax validation**: Catches syntax errors before execution using Function constructor
- **Real-time console**: Captures console.log, info, warn, error with proper styling
- **Code persistence**: Automatically saves code to localStorage
- **CodeMirror integration**: Optional enhanced editor with syntax highlighting
- **Examples system**: Dropdown loader with built-in code examples
- **Live preview**: Toggle iframe preview for DOM manipulation examples
- **Resizable panes**: Drag to resize editor/console horizontally and console/preview vertically
- **Timeout protection**: Configurable execution timeout to prevent infinite loops
- **Event system**: External communication for integration with other tools
- **📚 CDN Library Management**: User-controlled allowlist system for external libraries (jQuery, Lodash, etc.)
- **⛶ Fullscreen Modes**: Toggle between editor-focused and console-focused layouts

## Architecture

```
src/
├── core/                  # Core functionality
│   ├── sandbox.js         # Iframe execution engine
│   ├── console.js         # Console output handler
│   ├── template.js        # HTML template engine
│   ├── storage.js         # LocalStorage persistence
│   ├── logger.js          # Debug logging
│   ├── events.js          # Event emitter
│   └── examples.js        # Examples loader
├── editors/               # Editor adapters
│   ├── base.js           # Base editor interface
│   ├── codemirror.js     # CodeMirror adapter
│   └── textarea.js       # Fallback textarea adapter
├── libraries/             # CDN library management
│   ├── manager.js         # Library state & allowlist management
│   └── dialog.js          # Library management UI dialog
├── ui/                   # User interface
│   ├── controller.js     # Main app controller
│   ├── examples-dropdown.js  # Examples UI component
│   ├── fullscreen.js     # Fullscreen mode manager
│   └── styles.css        # Application styles
└── index.js              # Entry point
```

## Usage

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Optional: CodeMirror -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>

  <link rel="stylesheet" href="src/ui/styles.css">
</head>
<body>
  <div class="app">
    <!-- Panes structure -->
  </div>
  <script type="module" src="src/index.js"></script>
</body>
</html>
```

### Programmatic API

```javascript
import { SandboxController } from './src/ui/controller.js';

const sandbox = new SandboxController({
  timeLimit: 5000,
  debug: true,
  defaultCode: 'console.log("Hello world");'
});

// Listen to events
sandbox.on('code:execute:complete', () => {
  console.log('Code finished executing');
});

// Control the sandbox
sandbox.setCode('alert("test")');
sandbox.run();
```

## Examples

The sandbox includes built-in examples demonstrating various features:

- **Hello World**: Basic DOM manipulation with interactive button
- **CSS Animations**: Spinning box with controls and rainbow colors
- **Interactive Form**: Form validation and submission handling
- **Canvas Drawing**: Mouse/touch drawing on HTML5 canvas

Examples are loaded from the `examples/` directory and automatically discovered at runtime.

## New Features

### 📚 CDN Library Management

Load external libraries (jQuery, Lodash, React, etc.) directly from CDNs with a user-controlled security model:

**Features:**
- **Trusted Domain Allowlist**: Pre-approved CDNs (cdnjs, unpkg, jsdelivr) + user-managed domains
- **Dynamic CSP Generation**: Security policies updated automatically based on allowed domains
- **Persistent Storage**: Libraries and domain preferences saved to localStorage
- **Domain Warning System**: Explicit consent required for new CDN domains

**Usage:**
1. Click the 📚 button in the console header
2. Paste any CDN URL (e.g., `https://unpkg.com/lodash@4.17.21/lodash.min.js`)
3. Approve new domains when prompted
4. Libraries automatically load in future sandbox executions

**Example:**
```javascript
// After adding jQuery via the library manager:
$('body').append('<h1>Hello from jQuery!</h1>');

// After adding Lodash:
console.log(_.chunk([1, 2, 3, 4, 5], 2)); // [[1, 2], [3, 4], [5]]
```

### ⛶ Fullscreen Modes

Toggle between focused layouts for different workflows:

**Editor Fullscreen** (⛶ button in editor header):
- Hides console/preview panels
- Maximum screen real estate for coding
- Ideal for writing longer scripts

**Console Fullscreen** (⛶ button in console header):
- Hides editor panel
- Focus on output and debugging
- Perfect for analyzing results

**Mobile Responsive**: Fullscreen modes automatically optimize for touch devices.

## Technical Details

### Sandbox Isolation

Code executes in an iframe without `allow-same-origin`, providing true isolation from the parent page. Communication happens via postMessage for console output and status updates.

### Editor System

Pluggable editor architecture supports multiple editors:
- CodeMirror (when available)
- Fallback textarea (always available)

### Theme System & Event Architecture

The theming system is built on pure event-driven architecture using a central EventEmitter:

- **Theme Switcher**: Manages theme selection dropdown and CSS loading with localStorage persistence
- **Event-Driven Communication**: All components communicate through events (`THEME_READY`, `THEME_CHANGE`, `THEME_LOAD_START`)
- **CodeMirror Integration**: Editor adapters listen for theme events and apply themes dynamically
- **Glass Effect**: Themes automatically get glass-morphism treatment with reduced background opacity to show neon glow

```javascript
// Event flow example
themeSwitcher.switchTheme('blackboard');
// → Emits THEME_CHANGE event
// → Editor receives event and applies theme
// → Glass effect reduces background opacity by 30%
// → Neon glow shines through semi-transparent background
```

### Neon Glow Effects

Apple-inspired glass morphism with animated neon borders:

- **NeonGlowManager**: Handles color rotation and glow application
- **Automatic Color Cycling**: 8-second transitions through hue spectrum
- **Glass Integration**: Editor backgrounds become semi-transparent to reveal underlying glow
- **Performance Optimized**: Uses CSS transforms and backdrop-filter for smooth animations

### Error Handling

- Syntax errors caught via Function constructor before execution
- Runtime errors captured via iframe error handlers
- Promise rejections handled and displayed
- Timeout protection prevents runaway code

### State Management

- Code persistence via localStorage
- Theme preferences saved and restored across sessions
- Resizable pane positions maintained during session
- Preview state synchronized with UI controls

## Browser Support

Modern browsers with ES6 module support. No build tools required.

## Development

This was live-coded as a refactoring exercise, transforming a single 500+ line HTML file into a maintainable modular codebase. The focus was on:

- Clean separation of concerns
- Reusable components
- Comprehensive documentation
- Event-driven architecture
- Extensible design patterns

Built by Guinetik in collaboration with Claude (Anthropic).