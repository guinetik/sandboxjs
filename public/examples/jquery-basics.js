// ========================================
// JQUERY BASICS - Simple DOM Manipulation
// ========================================
//
// This example shows basic jQuery functionality:
// - Selecting elements with $
// - Chaining methods
// - Event handling
// - CSS manipulation
//
// 📚 HOW TO LOAD JQUERY:
// 1. Click the "📚 Libs" button in the console panel
// 2. Add jQuery CDN: https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// 3. Click "Run" to see the magic!
//
// ========================================

// Wait for jQuery to be available
function waitForJQuery() {
  if (typeof $ !== 'undefined') {
    runJQueryBasics();
  } else {
    console.log('⏳ Waiting for jQuery to load...');
    setTimeout(waitForJQuery, 100);
  }
}

function runJQueryBasics() {
  console.log('🚀 jQuery Basics Demo Starting!');
  console.log('jQuery version:', $.fn.jquery);
  
  // Create a simple demo container
  const $demo = $(`
    <div id="jquery-basics" style="
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 10000;
      box-sizing: border-box;
      overflow-y: auto;
    ">
      <h4 style="margin: 0 0 10px 0;">🎯 jQuery Basics</h4>
      <div id="basics-content">
        <p id="demo-text">Click the button to see jQuery magic!</p>
        <button id="basics-btn" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 5px;
          cursor: pointer;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">Click Me!</button>
        <div id="counter" style="margin-top: 10px; font-weight: bold;">Clicks: 0</div>
      </div>
    </div>
  `);
  
  // Add to page
  $('body').append($demo);
  
  let clickCount = 0;
  
  // jQuery event handling and chaining
  $('#basics-btn').on('click', function() {
    clickCount++;
    
    // Chain multiple jQuery methods
    $('#demo-text')
      .fadeOut(200)
      .text(`You clicked ${clickCount} time${clickCount !== 1 ? 's' : ''}!`)
      .css({
        'color': clickCount % 2 === 0 ? '#e74c3c' : '#2ecc71',
        'font-weight': 'bold'
      })
      .fadeIn(200);
    
    // Update counter with animation
    $('#counter')
      .text(`Clicks: ${clickCount}`)
      .animate({
        'font-size': '18px'
      }, 100)
      .animate({
        'font-size': '14px'
      }, 100);
    
    // Add some visual feedback
    $(this)
      .css('background', clickCount % 2 === 0 ? '#e67e22' : '#9b59b6')
      .text(clickCount % 2 === 0 ? 'Awesome!' : 'Great!');
  });
  
  // Show jQuery selector examples in console
  console.log('🔍 jQuery Selector Examples:');
  console.log('$("#demo-text") - Select by ID:', $('#demo-text'));
  console.log('$("button") - Select all buttons:', $('button'));
  console.log('$(".demo") - Select by class (if any exist)');
  
  // Demonstrate jQuery utility functions
  console.log('🛠️ jQuery Utility Functions:');
  console.log('$.now() - Current timestamp:', $.now());
  console.log('$.type() - Type checking:', $.type($('#demo-text')));
  
  // Auto-close after 20 seconds
  setTimeout(() => {
    $('#jquery-basics').fadeOut(1000, function() {
      $(this).remove();
    });
  }, 20000);
  
  console.log('✅ jQuery Basics Demo loaded! Click the button!');
}

// Start the demo
waitForJQuery();
