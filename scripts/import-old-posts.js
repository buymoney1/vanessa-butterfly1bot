// scripts/import-old-posts.js
const TELEGRAM_BOT_TOKEN = "8884309206:AAF9vJ8BsgYt5Zv5egTfzHseWSKMQ_AQXps";

let lastUpdateId = 0;

async function getUpdates() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30&allowed_updates=["message","channel_post"]`
    );
    const data = await response.json();
    
    if (data.ok && data.result.length > 0) {
      console.log(`📥 Found ${data.result.length} updates`);
      
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        
        if (update.channel_post) {
          console.log('📌 Channel post:', update.channel_post.text?.substring(0, 100));
        }
        
        if (update.message) {
          console.log('💬 Message:', update.message.text?.substring(0, 100));
        }
      }
    } else {
      console.log('⏳ No new updates...');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('🚀 Starting import...');
console.log('📋 Instructions:');
console.log('1. Forward posts from @vanes_butterfly1 to your bot');
console.log('2. Bot will save them automatically');
console.log('3. Press Ctrl+C to stop');
console.log('---');

// Run every 3 seconds
setInterval(getUpdates, 3000);
getUpdates();