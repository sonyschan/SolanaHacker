// Simple test script to debug wallet connection
const { chromium } = require('playwright');

async function testWalletConnection() {
  try {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      console.log('CONSOLE:', msg.type(), msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });
    
    console.log('Opening app...');
    await page.goto('http://165.22.136.40:5173');
    
    console.log('Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    console.log('Looking for Connect button...');
    const connectButton = await page.locator('button:has-text("Connect")').first();
    if (await connectButton.isVisible()) {
      console.log('Connect button found, clicking...');
      await connectButton.click();
      
      console.log('Waiting for modal...');
      await page.waitForTimeout(3000);
      
      // Check if wallet modal opened
      const modal = page.locator('.wallet-adapter-modal');
      if (await modal.isVisible()) {
        console.log('✅ Wallet modal opened successfully!');
      } else {
        console.log('❌ Wallet modal did not open');
      }
    } else {
      console.log('❌ Connect button not found');
    }
    
    await page.waitForTimeout(2000);
    await browser.close();
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testWalletConnection();