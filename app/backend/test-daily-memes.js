/**
 * Test Daily Memes Generation
 * 測試每日 meme 生成功能
 */

require('dotenv').config();
const geminiService = require('./services/geminiService');
const newsService = require('./services/newsService');

async function testDailyMemesGeneration() {
  try {
    console.log('🧪 Testing Daily Memes Generation...\n');
    
    console.log('🔑 API Key available:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }
    
    // Test 1: Test API connections
    console.log('📡 Test 1: Testing API connections...');
    const connectionTest = await geminiService.testConnection();
    console.log('Connection result:', connectionTest);
    
    if (!connectionTest.success) {
      throw new Error(`API connection failed: ${connectionTest.message}`);
    }
    
    // Test 2: Get mock news data
    console.log('\n📰 Test 2: Getting news data...');
    const mockNews = [
      { title: 'Bitcoin hits new all-time high above $100,000' },
      { title: 'Solana network processes record-breaking transactions' },
      { title: 'New DeFi protocol launches with innovative staking mechanism' }
    ];
    console.log('News data:', mockNews);
    
    // Test 3: Generate single meme prompt
    console.log('\n🎨 Test 3: Generating meme prompt...');
    const samplePrompt = await geminiService.generateMemePrompt(mockNews[0].title);
    console.log('Generated prompt:', samplePrompt.substring(0, 200) + '...');
    
    // Test 4: Generate single meme image
    console.log('\n🖼️ Test 4: Generating single meme image...');
    const imageResult = await geminiService.generateMemeImage(samplePrompt);
    console.log('Image generation result:');
    console.log('- Success:', imageResult.success);
    console.log('- Image URL:', imageResult.fallbackUrl);
    console.log('- File size:', imageResult.fileSize || 'N/A');
    console.log('- Development mode:', imageResult.developmentMode);
    
    // Test 5: Generate daily memes (only 1 for quick test)
    console.log('\n🎯 Test 5: Generating daily memes (1 for quick test)...');
    const dailyMemes = await geminiService.generateDailyMemes(mockNews, 1);
    
    console.log('\n✅ Daily memes generated:');
    dailyMemes.forEach((meme, index) => {
      console.log(`\nMeme ${index + 1}:`);
      console.log('- ID:', meme.id);
      console.log('- Title:', meme.title);
      console.log('- Description:', meme.description);
      console.log('- Image URL:', meme.imageUrl);
      console.log('- News Source:', meme.newsSource);
      console.log('- Image Generated:', meme.metadata.imageGenerated);
      console.log('- File Size:', meme.metadata.fileSize, 'bytes');
    });
    
    return {
      success: true,
      connectionTest,
      generatedMemes: dailyMemes.length,
      memes: dailyMemes,
      message: 'Daily memes generation test completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run test if called directly
if (require.main === module) {
  testDailyMemesGeneration()
    .then(result => {
      console.log('\n📊 Final Result:', JSON.stringify({
        success: result.success,
        generatedMemes: result.generatedMemes,
        message: result.message,
        error: result.error
      }, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { testDailyMemesGeneration };