/**
 * Advanced Autocomplete Features
 * 
 * This file demonstrates how to enhance the basic autocomplete
 * with more Chrome DevTools-like features
 */

import { Logger } from "../../core/logger";

export class AdvancedAutocomplete {
  constructor(cm, options = {}) {
    this.cm = cm;
    this.options = options;
    this.logger = new Logger({
      enabled: options.debug || false,
      prefix: 'AdvancedAutocomplete'
    });
    
    // Track variables in scope
    this.scopeVariables = new Map();
    
    // Track imported libraries from CDN
    this.loadedLibraries = new Map();
    
    // Initialize scope tracking
    this.initScopeTracking();
  }

  /**
   * Initialize scope tracking by analyzing code
   */
  initScopeTracking() {
    this.cm.on('change', () => {
      this.analyzeScopeVariables();
    });
    
    // Initial analysis
    this.analyzeScopeVariables();
  }

  /**
   * Analyze code to extract variable declarations
   */
  analyzeScopeVariables() {
    const code = this.cm.getValue();
    
    // Simple regex patterns for variable detection
    const patterns = {
      // const/let/var declarations
      variables: /(?:const|let|var)\s+(\w+)/g,
      // function declarations
      functions: /function\s+(\w+)/g,
      // class declarations
      classes: /class\s+(\w+)/g,
      // arrow functions assigned to variables
      arrowFunctions: /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g
    };
    
    this.scopeVariables.clear();
    
    // Extract all declarations
    Object.entries(patterns).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        if (name) {
          this.scopeVariables.set(name, {
            type: type,
            line: this.getLineNumber(code, match.index),
            value: this.extractValue(code, match.index)
          });
        }
      }
    });
    
    this.logger.info('Scope analysis complete:', this.scopeVariables.size, 'variables found');
  }

  /**
   * Get line number from character index
   */
  getLineNumber(text, index) {
    return text.substring(0, index).split('\n').length - 1;
  }

  /**
   * Extract the value or type of a variable
   */
  extractValue(code, startIndex) {
    // Simple extraction - could be enhanced
    const snippet = code.substring(startIndex, startIndex + 100);
    const match = snippet.match(/=\s*([^;,\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * Enhanced hint provider with scope awareness
   */
  provideHints(cm, options) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const line = cm.getLine(cursor.line);
    const start = token.start;
    const end = cursor.ch;
    
    let suggestions = [];
    
    // Add scope variables
    if (!line.substring(0, start).endsWith('.')) {
      this.scopeVariables.forEach((info, name) => {
        if (name.toLowerCase().startsWith(token.string.toLowerCase())) {
          suggestions.push({
            text: name,
            displayText: name,
            type: info.type,
            className: 'scope-variable',
            hint: () => cm.replaceRange(name, {line: cursor.line, ch: start}, cursor)
          });
        }
      });
    }
    
    // Add property suggestions for known objects
    if (line.substring(0, start).endsWith('.')) {
      const objMatch = line.substring(0, start - 1).match(/(\w+)$/);
      if (objMatch) {
        const objName = objMatch[1];
        const objInfo = this.scopeVariables.get(objName);
        
        if (objInfo && objInfo.value) {
          // Provide intelligent suggestions based on value
          suggestions = this.getPropertySuggestions(objInfo.value);
        }
      }
    }
    
    return {
      list: suggestions,
      from: CodeMirror.Pos(cursor.line, start),
      to: CodeMirror.Pos(cursor.line, end)
    };
  }

  /**
   * Get property suggestions based on object type
   */
  getPropertySuggestions(value) {
    const suggestions = [];
    
    // Detect array literals
    if (value.startsWith('[')) {
      return ['length', 'push', 'pop', 'map', 'filter', 'reduce', 'forEach'].map(method => ({
        text: method,
        displayText: method + '()',
        className: 'array-method'
      }));
    }
    
    // Detect object literals
    if (value.startsWith('{')) {
      // Could parse the object to get actual properties
      return ['hasOwnProperty', 'toString', 'valueOf'].map(method => ({
        text: method,
        displayText: method + '()',
        className: 'object-method'
      }));
    }
    
    // Detect string literals
    if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
      return ['length', 'charAt', 'split', 'substring', 'replace'].map(method => ({
        text: method,
        displayText: method + (method === 'length' ? '' : '()'),
        className: 'string-method'
      }));
    }
    
    return suggestions;
  }
}

/**
 * Type inference system for better autocomplete
 */
export class TypeInference {
  constructor() {
    this.typeMap = new Map();
  }

  /**
   * Infer type from value
   */
  inferType(value) {
    if (!value) return 'any';
    
    // String literals
    if (/^["'`]/.test(value)) return 'string';
    
    // Number literals
    if (/^\d+(\.\d+)?$/.test(value)) return 'number';
    
    // Boolean literals
    if (/^(true|false)$/.test(value)) return 'boolean';
    
    // Array literals
    if (/^\[/.test(value)) return 'array';
    
    // Object literals
    if (/^\{/.test(value)) return 'object';
    
    // Function expressions
    if (/^function/.test(value) || /^=>/.test(value)) return 'function';
    
    // Constructor calls
    if (/^new\s+(\w+)/.test(value)) {
      const match = value.match(/^new\s+(\w+)/);
      return match[1].toLowerCase();
    }
    
    return 'any';
  }
}

/**
 * Documentation provider for hover hints
 */
export class DocumentationProvider {
  constructor() {
    this.docs = {
      'console.log': {
        signature: 'console.log(...data: any[]): void',
        description: 'Outputs a message to the console',
        example: 'console.log("Hello", "World");'
      },
      'Array.prototype.map': {
        signature: 'map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[]',
        description: 'Creates a new array with the results of calling a provided function on every element',
        example: '[1, 2, 3].map(x => x * 2); // [2, 4, 6]'
      },
      // Add more documentation entries
    };
  }

  /**
   * Get documentation for a symbol
   */
  getDocumentation(symbol) {
    return this.docs[symbol] || null;
  }
}

// CSS for advanced autocomplete features
export const advancedStyles = `
  /* Scope variables */
  .CodeMirror-hint.scope-variable {
    padding-left: 20px;
    position: relative;
  }
  
  .CodeMirror-hint.scope-variable:before {
    content: "📦";
    position: absolute;
    left: 4px;
  }
  
  /* Type indicators */
  .CodeMirror-hint.string-method:before {
    content: "📝";
  }
  
  .CodeMirror-hint.array-method:before {
    content: "📋";
  }
  
  .CodeMirror-hint.object-method:before {
    content: "📦";
  }
  
  /* Documentation popup */
  .cm-documentation-popup {
    position: absolute;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  }
  
  .cm-documentation-popup .signature {
    color: #61afef;
    font-family: monospace;
    margin-bottom: 4px;
  }
  
  .cm-documentation-popup .description {
    color: #abb2bf;
    margin-bottom: 4px;
  }
  
  .cm-documentation-popup .example {
    color: #98c379;
    font-family: monospace;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px;
    border-radius: 2px;
  }
`;
