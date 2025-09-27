/**
 * Autocomplete setup for CodeMirror
 * Provides intelligent code completion for JavaScript
 */

export function setupAutocomplete(cm, options = {}) {
  // Store reference to advanced autocomplete instance for scope access
  let advancedAutocomplete = null;
  // JavaScript keywords
  const jsKeywords = [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
    'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
    'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
    'with', 'yield', 'true', 'false', 'null', 'undefined'
  ];

  // Browser globals
  const browserGlobals = [
    'document', 'window', 'console', 'navigator', 'location', 'history',
    'localStorage', 'sessionStorage', 'fetch', 'Promise', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Math', 'JSON',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame'
  ];

  /**
   * Runtime introspection - discover methods from actual browser objects
   */
  function getObjectMethods(obj, prototype = null) {
    if (!obj) return [];

    const methods = new Set();

    // Get methods from the object instance
    Object.getOwnPropertyNames(obj).forEach(name => {
      try {
        if (typeof obj[name] === 'function' && !name.startsWith('_')) {
          methods.add(name);
        }
      } catch (e) {
        // Some properties might throw when accessed
      }
    });

    // Get methods from prototype if provided
    if (prototype) {
      Object.getOwnPropertyNames(prototype).forEach(name => {
        try {
          if (typeof prototype[name] === 'function' &&
              name !== 'constructor' && !name.startsWith('_')) {
            methods.add(name);
          }
        } catch (e) {
          // Some properties might throw when accessed
        }
      });
    }

    // Also walk up the prototype chain for more methods
    let currentProto = prototype || Object.getPrototypeOf(obj);
    while (currentProto && currentProto !== Object.prototype) {
      try {
        Object.getOwnPropertyNames(currentProto).forEach(name => {
          try {
            if (typeof currentProto[name] === 'function' &&
                name !== 'constructor' && !name.startsWith('_')) {
              methods.add(name);
            }
          } catch (e) {
            // Some properties might throw when accessed
          }
        });
        currentProto = Object.getPrototypeOf(currentProto);
      } catch (e) {
        break;
      }
    }

    return Array.from(methods).sort();
  }

  // Get methods from actual browser objects
  const consoleMethods = getObjectMethods(console);
  const windowMethods = getObjectMethods(window, Window.prototype);
  const documentMethods = getObjectMethods(document, Document.prototype);
  const arrayMethods = getObjectMethods([], Array.prototype);
  const stringMethods = getObjectMethods('', String.prototype);
  const mathMethods = getObjectMethods(Math);

  // Debug: Verify runtime introspection worked
  console.log('🔍 Autocomplete setup complete:');
  console.log('  - Window methods:', windowMethods.length);
  console.log('  - Document methods:', documentMethods.length);
  console.log('  - Console methods:', consoleMethods.length);

  // Cache commonly used object methods for performance
  const methodCache = {
    console: consoleMethods,
    window: windowMethods,
    document: documentMethods,
    Array: arrayMethods,
    String: stringMethods,
    Math: mathMethods,
    // Add more as needed
    localStorage: getObjectMethods(localStorage, Storage.prototype),
    sessionStorage: getObjectMethods(sessionStorage, Storage.prototype),
    navigator: getObjectMethods(navigator, Navigator.prototype),
    location: getObjectMethods(location, Location.prototype)
  };

  // Custom hint function
  function javascriptHint(cm, options) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const start = token.start;
    const end = cursor.ch;
    const line = cursor.line;
    const currentWord = token.string;

    // Get the full line up to cursor position
    const fullTextToCursor = cm.getLine(line).substring(0, end);

    let suggestions = [];

    // Check if we're after a dot (property access)
    // Look for pattern: object.partial_method where cursor is after the partial method
    const dotMatch = fullTextToCursor.match(/(\w+)\.(\w*)$/);

    if (dotMatch) {
      const objectName = dotMatch[1];
      const partialMethod = dotMatch[2] || '';

      console.log(`🔍 Object access: ${objectName}.${partialMethod}`);

      // Provide context-specific completions using runtime introspection
      if (methodCache[objectName]) {
        let allMethods = methodCache[objectName];
        console.log(`🔍 Found ${allMethods.length} methods for ${objectName}`);

        // Filter methods based on what user has typed after the dot
        if (partialMethod) {
          suggestions = allMethods.filter(method =>
            method.toLowerCase().startsWith(partialMethod.toLowerCase())
          );
          console.log(`🔍 Filtered to ${suggestions.length} methods for "${partialMethod}":`, suggestions.slice(0, 5));
        } else {
          suggestions = allMethods;
        }
      } else if (objectName === 'Array') {
        suggestions = methodCache.Array;
      } else if (objectName === 'String' || textBefore.match(/["'].*["']\.$/)) {
        suggestions = methodCache.String;
      } else {
        // Try to introspect the object dynamically
        try {
          const globalObj = window[objectName];
          if (globalObj) {
            suggestions = getObjectMethods(globalObj, globalObj.constructor?.prototype);
          } else {
            // Fallback to generic object methods
            suggestions = getObjectMethods({}, Object.prototype);
          }
        } catch (e) {
          // Fallback to basic object methods
          suggestions = ['toString', 'valueOf', 'hasOwnProperty', 'constructor'];
        }
      }
    } else {
      // Not after a dot - suggest globals, keywords, and user variables
      const allSuggestions = [...jsKeywords, ...browserGlobals];

      // Add user-defined variables from scope analysis
      if (advancedAutocomplete && advancedAutocomplete.scopeVariables) {
        const userVariables = Array.from(advancedAutocomplete.scopeVariables.keys());
        allSuggestions.push(...userVariables);
      }

      if (currentWord) {
        suggestions = allSuggestions.filter(item =>
          item.toLowerCase().startsWith(currentWord.toLowerCase())
        );
      } else {
        suggestions = allSuggestions;
      }
    }

    // Calculate the correct start position for replacement
    let replaceStart = start;
    let replaceEnd = end;

    if (dotMatch) {
      // For object.method completion, only replace the method part
      const dotIndex = fullTextToCursor.lastIndexOf('.');
      replaceStart = dotIndex + 1;
    }

    return {
      list: suggestions.map(text => ({
        text: text,
        displayText: text,
        className: 'autocomplete-item',
        render: (element, self, data) => {
          element.textContent = data.displayText;
          if (jsKeywords.includes(data.text)) {
            element.className += ' keyword';
          } else if (browserGlobals.includes(data.text)) {
            element.className += ' global';
          } else if (advancedAutocomplete && advancedAutocomplete.scopeVariables &&
                    advancedAutocomplete.scopeVariables.has(data.text)) {
            element.className += ' user-variable';
          } else {
            element.className += ' method';
          }
        }
      })),
      from: CodeMirror.Pos(line, replaceStart),
      to: CodeMirror.Pos(line, replaceEnd)
    };
  }

  // Register the hint function
  CodeMirror.registerHelper('hint', 'javascript', javascriptHint);

  // Configure autocomplete
  const existingKeys = cm.getOption('extraKeys') || {};
  cm.setOption('extraKeys', {
    ...existingKeys,
    'Ctrl-Space': 'autocomplete',
    '.': function(cm) {
      cm.replaceSelection('.');
      setTimeout(() => {
        cm.execCommand('autocomplete');
      }, 100);
    }
  });

  // Show hints automatically while typing
  if (options.autoComplete !== false) {
    let timeout;
    cm.on('inputRead', function(cm, change) {
      if (timeout) clearTimeout(timeout);
      
      const cur = cm.getCursor();
      const token = cm.getTokenAt(cur);
      
      // Don't autocomplete in strings or comments
      if (token.type && (token.type.includes('string') || token.type.includes('comment'))) {
        return;
      }
      
      // Trigger autocomplete after a short delay
      if (change.text[0] && /\w|\.$/.test(change.text[0])) {
        timeout = setTimeout(() => {
          cm.execCommand('autocomplete');
        }, 100); // Faster response
      }

      // Also trigger on any typing after a dot
      const line = cm.getLine(cur.line);
      const textBefore = line.substring(0, cur.ch);
      if (textBefore.match(/\w+\.\w*$/)) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          cm.execCommand('autocomplete');
        }, 50); // Very fast for object methods
      }
    });
  }

  // Return a function to set the advanced autocomplete instance
  return {
    setAdvancedInstance: (instance) => {
      advancedAutocomplete = instance;
    },
    hint: javascriptHint
  };
}

// CSS for autocomplete styling
export const autocompleteStyles = `
  .CodeMirror-hints {
    position: absolute;
    z-index: 10;
    overflow: hidden;
    list-style: none;
    margin: 0;
    padding: 2px;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-family: monospace;
    font-size: 90%;
    max-height: 20em;
    overflow-y: auto;
  }

  .CodeMirror-hint {
    margin: 0;
    padding: 4px 8px;
    border-radius: 2px;
    white-space: pre;
    cursor: pointer;
  }

  .CodeMirror-hint-active {
    background: #2a2a2a;
    color: #fff;
  }

  .autocomplete-item {
    display: flex;
    align-items: center;
  }

  .autocomplete-item.keyword {
    color: #c678dd;
  }

  .autocomplete-item.global {
    color: #61afef;
  }

  .autocomplete-item.method {
    color: #e06c75;
  }

  .autocomplete-item.user-variable {
    color: #ffffff;
    font-weight: 500;
  }

  /* Integrate with your neon glow theme */
  .CodeMirror-hints {
    backdrop-filter: blur(10px);
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;
