import {
  MIN_LEFT_PANE_WIDTH,
  MIN_RIGHT_PANE_WIDTH,
  MIN_CONSOLE_HEIGHT,
  MIN_PREVIEW_HEIGHT,
  RESIZE_HANDLE_WIDTH
} from '../core/constants.js';

/**
 * Shared resize functionality for panes
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

/**
 * Creates a horizontal resize handler
 * @param {Object} config - Configuration object
 * @param {HTMLElement} config.container - Container element
 * @param {HTMLElement} config.leftPane - Left pane element
 * @param {HTMLElement} config.rightPane - Right pane element
 * @param {HTMLElement} config.handle - Resize handle element
 * @param {Function} config.onResize - Callback when resize completes
 * @returns {Object} Handler functions and cleanup
 */
export function createHorizontalResizeHandler(config) {
  const { container, leftPane, rightPane, handle, onResize } = config;

  let isResizing = false;
  let startX = 0;
  let startLeftWidth = 0;
  let startRightWidth = 0;

  const handleStart = (e) => {
    isResizing = true;
    // Support both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    startX = clientX;
    handle.classList.add('dragging');

    startLeftWidth = leftPane.getBoundingClientRect().width;
    startRightWidth = rightPane.getBoundingClientRect().width;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    e.preventDefault();
  };

  const handleMove = (e) => {
    if (!isResizing) return;

    // Support both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const deltaX = clientX - startX;
    const containerRect = container.getBoundingClientRect();
    const totalWidth = containerRect.width - RESIZE_HANDLE_WIDTH - 10; // Subtract handle and padding

    // Calculate new widths with constraints
    const newLeftWidth = Math.max(
      MIN_LEFT_PANE_WIDTH,
      Math.min(totalWidth - MIN_RIGHT_PANE_WIDTH, startLeftWidth + deltaX)
    );
    const newRightWidth = totalWidth - newLeftWidth;

    // Update grid template
    container.style.gridTemplateColumns = `${newLeftWidth}px ${RESIZE_HANDLE_WIDTH}px ${newRightWidth}px`;

    e.preventDefault();
  };

  const handleEnd = () => {
    if (!isResizing) return;

    isResizing = false;
    handle.classList.remove('dragging');

    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    if (onResize) onResize();
  };

  // Add both mouse and touch event listeners
  handle.addEventListener('mousedown', handleStart);
  handle.addEventListener('touchstart', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('touchmove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchend', handleEnd);

  return {
    handleStart,
    handleMove,
    handleEnd,
    cleanup: () => {
      handle.removeEventListener('mousedown', handleStart);
      handle.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    }
  };
}

/**
 * Creates a vertical resize handler
 * @param {Object} config - Configuration object
 * @param {HTMLElement} config.container - Container element
 * @param {HTMLElement} config.topPane - Top pane element
 * @param {HTMLElement} config.bottomPane - Bottom pane element
 * @param {HTMLElement} config.handle - Resize handle element
 * @param {Function} config.onResize - Callback when resize completes
 * @param {Function} config.shouldResize - Optional function to check if resize should proceed
 * @returns {Object} Handler functions and cleanup
 */
export function createVerticalResizeHandler(config) {
  const { container, topPane, bottomPane, handle, onResize, shouldResize } = config;
  
  let isResizing = false;
  let startY = 0;
  let startTopHeight = 0;
  let startBottomHeight = 0;

  const handleStart = (e) => {
    // Check if resizing is allowed
    if (shouldResize && !shouldResize()) return;

    isResizing = true;
    // Support both mouse and touch events
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    startY = clientY;
    handle.classList.add('dragging');

    const topRect = topPane.getBoundingClientRect();
    const bottomRect = bottomPane.getBoundingClientRect();

    startTopHeight = topRect.height;
    startBottomHeight = bottomRect.height;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    e.preventDefault();
  };

  const handleMove = (e) => {
    if (!isResizing) return;

    // Support both mouse and touch events
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const deltaY = clientY - startY;
    const totalContentHeight = startTopHeight + startBottomHeight;

    // Calculate new heights with constraints
    const newTopHeight = Math.max(
      MIN_CONSOLE_HEIGHT,
      Math.min(totalContentHeight - MIN_PREVIEW_HEIGHT, startTopHeight + deltaY)
    );
    const newBottomHeight = totalContentHeight - newTopHeight;

    // Update grid template
    container.style.gridTemplateRows = `auto ${newTopHeight}px 8px ${newBottomHeight}px auto`;

    e.preventDefault();
  };

  const handleEnd = () => {
    if (!isResizing) return;

    isResizing = false;
    handle.classList.remove('dragging');

    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    if (onResize) onResize();
  };

  // Add both mouse and touch event listeners
  handle.addEventListener('mousedown', handleStart);
  handle.addEventListener('touchstart', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('touchmove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchend', handleEnd);

  return {
    handleStart,
    handleMove,
    handleEnd,
    cleanup: () => {
      handle.removeEventListener('mousedown', handleStart);
      handle.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    }
  };
}
