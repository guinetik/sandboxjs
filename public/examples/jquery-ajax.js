// ========================================
// JQUERY AJAX & DATA - API Integration
// ========================================
//
// This example demonstrates:
// - jQuery AJAX functionality
// - JSON data handling
// - Dynamic content creation
// - Error handling
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
    runJQueryAjax();
  } else {
    console.log('⏳ Waiting for jQuery to load...');
    setTimeout(waitForJQuery, 100);
  }
}

function runJQueryAjax() {
  console.log('🚀 jQuery AJAX Demo Starting!');
  console.log('jQuery version:', $.fn.jquery);
  
  // Create demo container
  const $demo = $(`
    <div id="jquery-ajax" style="
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      background: linear-gradient(45deg, #1e3c72, #2a5298);
      color: white;
      padding: 20px;
      border-radius: 15px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      z-index: 10000;
      overflow-y: auto;
      box-sizing: border-box;
    ">
      <h4 style="margin: 0 0 15px 0; text-align: center;">🌐 jQuery AJAX Demo</h4>
      <div id="ajax-content">
        <button id="fetch-users" style="
          background: #27ae60;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 5px;
          cursor: pointer;
          margin: 5px;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">Fetch Random Users</button>
        <button id="fetch-quotes" style="
          background: #8e44ad;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 5px;
          cursor: pointer;
          margin: 5px;
          width: 100%;
          font-size: 14px;
          min-height: 44px;
        ">Get Inspirational Quote</button>
        <div id="ajax-output" style="
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
  
  // Fetch random users demo
  $('#fetch-users').on('click', function() {
    const $btn = $(this);
    const $output = $('#ajax-output');
    
    $btn.prop('disabled', true).text('Loading...');
    $output.html('🔄 Fetching random users...');
    
    // Simulate AJAX call with mock data
    $.ajax({
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      timeout: 5000,
      success: function(data) {
        // Take first 3 users
        const users = data.slice(0, 3);
        let html = '<h5>👥 Random Users:</h5>';
        
        $.each(users, function(index, user) {
          html += `
            <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;">
              <strong>${user.name}</strong><br>
              📧 ${user.email}<br>
              🌐 ${user.website}<br>
              🏢 ${user.company.name}
            </div>
          `;
        });
        
        $output.html(html);
      },
      error: function(xhr, status, error) {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data:', error);
        const mockUsers = [
          { name: 'John Doe', email: 'john@example.com', website: 'johndoe.com', company: { name: 'Tech Corp' } },
          { name: 'Jane Smith', email: 'jane@example.com', website: 'janesmith.com', company: { name: 'Design Inc' } },
          { name: 'Bob Johnson', email: 'bob@example.com', website: 'bobjohnson.com', company: { name: 'Startup Co' } }
        ];
        
        let html = '<h5>👥 Mock Users (API unavailable):</h5>';
        $.each(mockUsers, function(index, user) {
          html += `
            <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;">
              <strong>${user.name}</strong><br>
              📧 ${user.email}<br>
              🌐 ${user.website}<br>
              🏢 ${user.company.name}
            </div>
          `;
        });
        
        $output.html(html);
      },
      complete: function() {
        $btn.prop('disabled', false).text('Fetch Random Users');
      }
    });
  });
  
  // Fetch quotes demo
  $('#fetch-quotes').on('click', function() {
    const $btn = $(this);
    const $output = $('#ajax-output');
    
    $btn.prop('disabled', true).text('Loading...');
    $output.html('🔄 Getting inspirational quote...');
    
    // Simulate AJAX call with mock data
    setTimeout(() => {
      const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
      ];
      
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      const html = `
        <div style="text-align: center; padding: 15px;">
          <h5>💭 Inspirational Quote:</h5>
          <div style="
            font-style: italic;
            font-size: 16px;
            margin: 10px 0;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            border-left: 4px solid #f39c12;
          ">
            "${randomQuote.text}"
          </div>
          <div style="font-weight: bold; color: #f39c12;">
            — ${randomQuote.author}
          </div>
        </div>
      `;
      
      $output.html(html);
      $btn.prop('disabled', false).text('Get Inspirational Quote');
    }, 1500);
  });
  
  // Add hover effects
  $('#jquery-ajax button').hover(
    function() { $(this).css('opacity', '0.8'); },
    function() { $(this).css('opacity', '1'); }
  );
  
  // Auto-close after 45 seconds
  setTimeout(() => {
    $('#jquery-ajax').fadeOut(1000, function() {
      $(this).remove();
    });
  }, 45000);
  
  console.log('✅ jQuery AJAX Demo loaded! Try the buttons!');
  console.log('💡 This demo shows:');
  console.log('   - $.ajax() for API calls');
  console.log('   - Success/error handling');
  console.log('   - Dynamic content creation');
  console.log('   - jQuery chaining and effects');
}

// Start the demo
waitForJQuery();
