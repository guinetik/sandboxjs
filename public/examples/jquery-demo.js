// ========================================
// JQUERY DEMO - Interactive Web Page
// ========================================
// 
// This example demonstrates jQuery's powerful features:
// - DOM manipulation and event handling
// - Animations and effects
// - AJAX-like functionality
// - Plugin-like extensions
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
    runJQueryDemo();
  } else {
    console.log('⏳ Waiting for jQuery to load...');
    setTimeout(waitForJQuery, 100);
  }
}

function runJQueryDemo() {
  console.log('🚀 jQuery Demo Starting!');
  console.log('jQuery version:', $.fn.jquery);
  
  // Create a demo container
  const $demo = $(`
    <div id="jquery-demo" style="
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      z-index: 10000;
      box-sizing: border-box;
      overflow-y: auto;
    ">
      <h3 style="margin: 0 0 15px 0; text-align: center;">🎨 jQuery Demo</h3>
      <div id="demo-content">
        <button id="animate-btn" style="
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 25px;
          cursor: pointer;
          margin: 5px;
          transition: all 0.3s ease;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">Animate Me!</button>
        <button id="ajax-btn" style="
          background: #4ecdc4;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 25px;
          cursor: pointer;
          margin: 5px;
          transition: all 0.3s ease;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">AJAX Demo</button>
        <button id="plugin-btn" style="
          background: #45b7d1;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 25px;
          cursor: pointer;
          margin: 5px;
          transition: all 0.3s ease;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">Plugin Demo</button>
        <div id="demo-output" style="
          margin-top: 15px;
          padding: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          min-height: 50px;
          font-size: 14px;
        "></div>
      </div>
    </div>
  `);
  
  // Add to page
  $('body').append($demo);
  
  // Animation demo
  $('#animate-btn').on('click', function() {
    const $btn = $(this);
    const $output = $('#demo-output');
    
    $output.html('🎭 Starting animation sequence...');
    
    // Chain multiple animations
    $btn.animate({ 
      transform: 'rotate(360deg)',
      scale: '1.2'
    }, 500)
    .animate({ 
      transform: 'rotate(0deg)',
      scale: '1'
    }, 500)
    .fadeOut(300)
    .fadeIn(300, function() {
      $output.html('✨ Animation complete! jQuery makes it so smooth!');
    });
  });
  
  // AJAX-like demo (simulated)
  $('#ajax-btn').on('click', function() {
    const $output = $('#demo-output');
    $output.html('🌐 Simulating AJAX request...');
    
    // Simulate async operation
    setTimeout(() => {
      const mockData = {
        users: [
          { name: 'Alice', age: 28, city: 'New York' },
          { name: 'Bob', age: 32, city: 'San Francisco' },
          { name: 'Charlie', age: 25, city: 'Chicago' }
        ]
      };
      
      let html = '<h4>📊 Mock API Response:</h4>';
      $.each(mockData.users, function(index, user) {
        html += `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 5px;">
          👤 ${user.name} (${user.age}) - ${user.city}
        </div>`;
      });
      
      $output.html(html);
    }, 1500);
  });
  
  // Plugin-like functionality demo
  $('#plugin-btn').on('click', function() {
    const $output = $('#demo-output');
    $output.html('🔌 Creating custom jQuery plugin...');
    
    // Create a simple plugin
    $.fn.rainbowText = function() {
      return this.each(function() {
        const $this = $(this);
        const text = $this.text();
        let rainbowText = '';
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < text.length; i++) {
          const color = colors[i % colors.length];
          rainbowText += `<span style="color: ${color};">${text[i]}</span>`;
        }
        
        $this.html(rainbowText);
      });
    };
    
    // Use the plugin
    setTimeout(() => {
      $output.html('🌈 <span id="rainbow-demo">jQuery Plugin Magic!</span>');
      $('#rainbow-demo').rainbowText();
    }, 1000);
  });
  
  // Add some hover effects
  $('#jquery-demo button').hover(
    function() { $(this).css('transform', 'translateY(-2px)'); },
    function() { $(this).css('transform', 'translateY(0)'); }
  );
  
  // Auto-close after 30 seconds
  setTimeout(() => {
    $('#jquery-demo').fadeOut(1000, function() {
      $(this).remove();
    });
  }, 30000);
  
  console.log('✅ jQuery Demo loaded! Try the buttons!');
}

// Start the demo
waitForJQuery();
