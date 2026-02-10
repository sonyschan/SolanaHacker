// Simple test script to debug wallet connection
import { chromium } from 'playwright';

async function testWalletConnection() {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      // Filter out noise but show wallet-related messages
      if (text.includes('WalletButton') || 
          text.includes('WalletModal') || 
          text.includes('wallet') ||
          text.includes('Connect') ||
          text.includes('Error') ||
          text.includes('error')) {
        console.log(`CONSOLE ${type.upper()}:`, text);
      }
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
    
    // Try different selectors
    const selectors = [
      'button:has-text("Connect & Start")',
      'button:has-text("Connect Wallet")', 
      'button:has-text("Connect")',
      'button[class*="wallet"]'
    ];
    
    let connectButton = null;
    for (const selector of selectors) {
      connectButton = page.locator(selector).first();
      if (await connectButton.isVisible()) {
        console.log(`✅ Found connect button with selector: ${selector}`);
        break;
      }
    }
    
    if (connectButton && await connectButton.isVisible()) {
      console.log('Clicking Connect button...');
      await connectButton.click();
      
      console.log('Waiting for response...');
      await page.waitForTimeout(3000);
      
      // Check if wallet modal opened
      const modal = page.locator('.wallet-adapter-modal');
      if (await modal.isVisible()) {
        console.log('✅ Wallet modal opened successfully!');
        
        // Check for wallet options
        const walletItems = await page.locator('.wallet-adapter-modal .wallet-adapter-modal-list li').count();
        console.log(`Found ${walletItems} wallet options`);
        
      } else {
        console.log('❌ Wallet modal did not open');
        
        // Check for any error messages or states
        const body = await page.locator('body').textContent();
        if (body.includes('error') || body.includes('Error')) {
          console.log('Found error text in body');
        }
      }
    } else {
      console.log('❌ Connect button not found or not visible');
      
      // Debug: Show all button text
      const buttons = await page.locator('button').allTextContents();
      console.log('Available buttons:', buttons);
    }
    
    await browser.close();
    console.log('Test completed.');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testWalletConnection();