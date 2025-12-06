# Google Analytics Event Tracking

This document describes the Google Analytics (GA) event tracking implementation in the JavaScript Sandbox application.

## Overview

The application automatically tracks user interactions and sends them to Google Analytics when a GA measurement ID is configured via the `VITE_GA_ID` environment variable.

## Architecture

The GA tracking system consists of:

- **GA Initialization** (`src/index.js`): Loads and initializes the gtag.js library
- **GA Tracker** (`src/analytics/ga-tracker.js`): Listens to internal application events and maps them to GA events
- **Event System** (`src/core/events.js`): Internal event emitter that all components use

## Configuration

### Environment Variable

Set the `VITE_GA_ID` environment variable with your Google Analytics Measurement ID (format: `G-XXXXXXXXXX`):

```bash
# Development
VITE_GA_ID=G-XXXXXXXXXX npm run dev

# Production (via GitHub Actions)
# Set VITE_GA_ID in repository secrets
```

### Initialization

GA tracking is automatically initialized when:
1. `VITE_GA_ID` is set
2. The application runs in a browser environment
3. The sandbox controller is initialized

The tracker listens to all relevant events from the application's event emitter.

## Tracked Events

### Code Execution Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `code:execute:start` | `code_execute` | `{ action: 'start' }` | User starts code execution |
| `code:execute:complete` | `code_execute` | `{ action: 'complete' }` | Code execution completes successfully |
| `code:execute:timeout` | `code_execute` | `{ action: 'timeout' }` | Code execution times out |

### Code Editing Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `code:change` | `code_change` | `{ action: 'edit' }` | User edits code (throttled to 2 seconds) |

### Example Loading Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `example:load` | `example_load` | `{ example_name: string }` | User starts loading an example |
| `example:loaded` | `example_loaded` | `{ example_name: string }` | Example successfully loaded |

### Theme Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `theme:change` | `theme_change` | `{ theme_name: string }` | User changes editor theme |

### Editor Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `editor:change` | `editor_change` | `{ editor_type: string }` | User switches editor (ACE, CodeMirror, textarea) |

### Library Management Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `library:manager:open` | `library_manager` | `{ action: 'open' }` | User opens library manager dialog |
| `library:added` | `library_add` | `{ library_url: string }` | User adds a library (URL sanitized) |
| `library:removed` | `library_remove` | `{ library_url: string }` | User removes a library (URL sanitized) |
| `domain:added` | `domain_trust` | `{ domain: string }` | User trusts a new CDN domain |
| `libraries:cleared` | `libraries_clear` | `{ action: 'clear_all' }` | User clears all libraries |

### Fullscreen Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `fullscreen:editor` | `fullscreen` | `{ mode: 'editor' }` | User enters editor fullscreen mode |
| `fullscreen:console` | `fullscreen` | `{ mode: 'console' }` | User enters console fullscreen mode |
| `fullscreen:exit` | `fullscreen` | `{ mode: 'exit' }` | User exits fullscreen mode |

### Sandbox Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `sandbox:reset` | `sandbox_reset` | `{ action: 'reset' }` | User resets the sandbox |
| `console:clear` | `console_clear` | `{ action: 'clear' }` | User clears the console |

### Share Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `share:success` | `share` | `{ action: 'success' }` | User successfully shares code |
| `share:error` | `share` | `{ action: 'error' }` | Share operation fails |

### Initialization Events

| Internal Event | GA Event Name | Parameters | Description |
|---------------|---------------|------------|-------------|
| `init:complete` | `app_init` | `{ action: 'complete' }` | Application initialization completes |

## Data Privacy & Sanitization

### URL Sanitization

Library URLs are sanitized before tracking:
- Only domain and path are included (query parameters and fragments removed)
- Prevents tracking of sensitive data in URLs
- Example: `https://cdnjs.cloudflare.com/lodash.js?v=4.17.21` → `cdnjs.cloudflare.com/lodash.js`

### Domain Sanitization

Domain names are cleaned:
- Protocol removed (`https://` or `http://`)
- Path and query parameters removed
- Example: `https://unpkg.com/react@18/` → `unpkg.com`

## Manual Tracking

You can manually track custom events using the GA tracker instance:

```javascript
// Access the tracker from the sandbox controller
const tracker = window.sandbox.gaTracker;

// Track a custom event
tracker.track('custom_event', {
  custom_param: 'value'
});
```

## Disabling Tracking

Tracking can be disabled by:

1. **Not setting `VITE_GA_ID`**: Tracking won't initialize
2. **Programmatically**: Set `tracker.options.enabled = false` (requires access to tracker instance)

## Debug Mode

Enable debug logging for GA tracking:

```javascript
// When initializing sandbox
initSandbox({ debug: true });
```

This will log all tracked events to the console.

## Implementation Details

### Event Throttling

- **Code changes**: Tracked after 2 seconds of inactivity to avoid spam from rapid typing

### Error Handling

- All tracking calls are wrapped in try-catch blocks
- Failures are logged as warnings but don't interrupt application flow
- Tracking gracefully degrades if GA is unavailable

### Performance

- Event listeners are registered once during initialization
- No performance impact when GA is not configured
- Minimal overhead when tracking is active

## Testing

To test GA tracking:

1. Set `VITE_GA_ID` in your environment
2. Open browser DevTools → Network tab
3. Filter for `google-analytics.com` or `googletagmanager.com`
4. Perform actions in the application
5. Verify events are sent to GA

Alternatively, use the GA Debugger Chrome extension to see events in real-time.

## Future Enhancements

Potential improvements:

- Track code execution duration
- Track error types and frequencies
- Track feature usage patterns
- Track user session duration
- Track code complexity metrics

