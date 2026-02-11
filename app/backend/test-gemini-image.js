/**
 * Test Gemini Image Generation
 * 驗證 gemini_image skill 的整合狀況
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the gemini_image skill from agent
async function testGeminiImageSkill() {
  try {
    console.log('🧪 Testing Gemini Image Skill...\n');
    
    // Dynamically import the ES module
    const skillPath = '../../agent/skills/gemini_image/index.js';
    const fullPath = path.resolve(__dirname, skillPath);
    
    console.log(`📂 Skill path: ${fullPath}`);
    console.log(`🔑 API Key available: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }
    
    // Import skill module
    const skill = await import(`file://${fullPath}`);
    const deps = { workDir: path.resolve(__dirname, '../') };
    const executors = skill.createExecutors(deps);
    
    console.log('✅ Skill module loaded successfully\n');
    
    // Test 1: Generate a simple meme with gemini-2.5-flash-image (UX assets)
    console.log('🎨 Test 1: Generating meme with gemini-2.5-flash-image...');
    const flashResult = await executors.generate_image({
      prompt: 'A funny meme about cryptocurrency going to the moon. Show a cartoon rocket with "HODL" written on it flying towards a smiling moon. Include text overlay "When you finally understand DeFi" at the top and "This is fine 🔥" at the bottom. Internet meme style.',
      model: 'gemini-2.5-flash-image',
      filename: 'test-meme-flash.png'
    });
    
    console.log('📋 Flash result:', flashResult);
    
    // Test 2: Generate an NFT-quality meme with gemini-3-pro-image-preview
    console.log('\n🎨 Test 2: Generating NFT meme with gemini-3-pro-image-preview...');
    const proResult = await executors.generate_image({
      prompt: 'High-quality NFT meme artwork: A majestic crypto whale wearing a crown, swimming through a galaxy of golden coins and blockchain symbols. Photorealistic digital art style. Include elegant text "Diamond Hands Forever" in beautiful typography. This should look like premium digital collectible art.',
      model: 'gemini-3-pro-image-preview', 
      filename: 'test-meme-nft.png'
    });
    
    console.log('📋 Pro result:', proResult);
    
    // Test 3: Check if images were actually generated
    const outputDir = path.resolve(__dirname, '../public/generated');
    const flashImagePath = path.join(outputDir, 'test-meme-flash.png');
    const proImagePath = path.join(outputDir, 'test-meme-nft.png');
    
    console.log('\n📁 Checking generated files...');
    console.log(`Flash image exists: ${fs.existsSync(flashImagePath) ? '✅' : '❌'}`);
    console.log(`Pro image exists: ${fs.existsSync(proImagePath) ? '✅' : '❌'}`);
    
    if (fs.existsSync(flashImagePath)) {
      const flashStats = fs.statSync(flashImagePath);
      console.log(`Flash image size: ${flashStats.size} bytes`);
    }
    
    if (fs.existsSync(proImagePath)) {
      const proStats = fs.statSync(proImagePath);
      console.log(`Pro image size: ${proStats.size} bytes`);
    }
    
    console.log('\n🎉 Gemini Image Skill test completed!');
    
    return {
      success: true,
      tests: {
        flash: flashResult,
        pro: proResult
      },
      files: {
        flash: fs.existsSync(flashImagePath),
        pro: fs.existsSync(proImagePath)
      }
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
  testGeminiImageSkill()
    .then(result => {
      console.log('\n📊 Final Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { testGeminiImageSkill };