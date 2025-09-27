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

  // Console methods
  const consoleMethods = [
    'log', 'error', 'warn', 'info', 'debug', 'trace', 'table', 'group',
    'groupEnd', 'groupCollapsed', 'clear', 'count', 'assert', 'time', 'timeEnd'
  ];

  // DOM methods
  const domMethods = [
    'getElementById', 'getElementsByClassName', 'getElementsByTagName',
    'querySelector', 'querySelectorAll', 'createElement', 'createTextNode',
    'appendChild', 'removeChild', 'insertBefore', 'replaceChild',
    'addEventListener', 'removeEventListener', 'dispatchEvent'
  ];

  // Array methods
  const arrayMethods = [
    'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat',
    'join', 'reverse', 'sort', 'filter', 'map', 'reduce', 'forEach',
    'some', 'every', 'find', 'findIndex', 'includes', 'indexOf', 'lastIndexOf'
  ];

  // Custom hint function
  function javascriptHint(cm, options) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const start = token.start;
    const end = cursor.ch;
    const line = cursor.line;
    const currentWord = token.string;

    // Get context - what comes before the current token
    const textBefore = cm.getLine(line).substring(0, start);
    
    let suggestions = [];

    // Check if we're after a dot (property access)
    if (textBefore.endsWith('.')) {
      const objectMatch = textBefore.match(/(\w+)\.$/);
      if (objectMatch) {
        const objectName = objectMatch[1];
        
        // Provide context-specific completions
        if (objectName === 'console') {
          suggestions = consoleMethods;
        } else if (objectName === 'document') {
          suggestions = domMethods;
        } else if (objectName === 'Math') {
          suggestions = ['PI', 'E', 'abs', 'ceil', 'floor', 'round', 'max', 'min', 
                        'pow', 'sqrt', 'random', 'sin', 'cos', 'tan', 'log'];
        } else if (objectName === 'Array' || textBefore.match(/\[.*\]\.$/)) {
          suggestions = arrayMethods;
        } else if (objectName === 'String' || textBefore.match(/["'].*["']\.$/)) {
          suggestions = ['length', 'charAt', 'charCodeAt', 'concat', 'indexOf',
                        'lastIndexOf', 'match', 'replace', 'search', 'slice',
                        'split', 'substr', 'substring', 'toLowerCase', 'toUpperCase',
                        'trim', 'trimStart', 'trimEnd'];
        } else {
          // Generic object methods
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
      from: CodeMirror.Pos(line, start),
      to: CodeMirror.Pos(line, end)
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
        }, 300);
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
