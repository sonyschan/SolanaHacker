#!/usr/bin/env node

const { GoogleGenerativeAI } = require('../app/node_modules/@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI('AIzaSyBsKIIBRaSfjgdtpBS8cyAKjZ7XzToF8Jc');

async function generateMemeForgeePlaceholder() {
  try {
    console.log('🚀 正在生成 MemeForge placeholder...');
    
    // 使用 Gemini 3 Pro Image - 同樣的模型如生產環境
    const model = genAI.getGenerativeModel({ model: 'gemini-3.0-pro-image' });
    
    const prompt = `Create a stylish placeholder image for MemeForge app with these requirements:
    
    STYLE: Modern, clean, tech-savvy design
    COLORS: Purple/violet gradient background (#8B5CF6 to #6366F1)
    TEXT: "MemeForge" as main title, "AI Generated Meme" as subtitle
    ELEMENTS: 
    - Robot/AI icon (🤖 style)
    - Cryptocurrency/blockchain elements (subtle)
    - Loading dots or progress indicator
    - Professional but playful feeling
    
    LAYOUT: Center-aligned, perfect for 400x300px placeholder
    MOOD: Anticipation, high-tech, Web3 vibes
    
    Make it look like a premium loading state for an AI meme generation app.`;

    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    });

    const imageData = result.response;
    
    if (imageData && imageData.candidates && imageData.candidates[0]) {
      // 檢查是否有圖片數據
      const candidate = imageData.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // 保存圖片
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            const outputPath = path.join(__dirname, '../app/public/placeholder-meme.png');
            
            // 確保目錄存在
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, imageBuffer);
            console.log('✅ Placeholder 圖片已生成:', outputPath);
            console.log('📏 圖片大小:', (imageBuffer.length / 1024).toFixed(2) + 'KB');
            return outputPath;
          }
        }
      }
    }
    
    throw new Error('沒有收到有效的圖片數據');
    
  } catch (error) {
    console.error('❌ 生成 placeholder 失敗:', error.message);
    
    // Fallback: 生成 CSS-based placeholder
    console.log('🔧 正在建立 CSS-based fallback...');
    return createCSSPlaceholder();
  }
}

function createCSSPlaceholder() {
  // 建立 CSS-based placeholder 組件
  const placeholderComponent = `import React from 'react';

const MemeForgeePlaceholder = ({ title = "AI Generated Meme", width = 400, height = 300 }) => (
  <div 
    className="flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 text-white text-center p-6 rounded-lg shadow-lg relative overflow-hidden"
    style={{ width, height }}
  >
    {/* 背景動畫 */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] animate-pulse"></div>
    
    <div className="relative z-10">
      {/* 主要 Logo */}
      <div className="text-5xl mb-3 animate-bounce">🤖</div>
      
      {/* 主標題 */}
      <div className="font-bold text-xl mb-1 text-purple-100">MemeForge</div>
      
      {/* 副標題 */}
      <div className="text-sm opacity-75 mb-3">{title}</div>
      
      {/* Loading 指示器 */}
      <div className="flex justify-center space-x-1 mb-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-0"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
      </div>
      
      {/* Web3 標記 */}
      <div className="text-xs opacity-50 flex items-center justify-center">
        <span className="mr-1">⚡</span>
        AI Powered
        <span className="ml-1">⚡</span>
      </div>
    </div>
  </div>
);

export default MemeForgeePlaceholder;`;

  const outputPath = path.join(__dirname, '../app/src/components/MemeForgeePlaceholder.jsx');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, placeholderComponent);
  console.log('✅ CSS Placeholder 組件已建立:', outputPath);
  return outputPath;
}

// 執行
if (require.main === module) {
  generateMemeForgeePlaceholder()
    .then(result => {
      console.log('🎉 Placeholder 生成完成!');
      console.log('📁 檔案位置:', result);
    })
    .catch(error => {
      console.error('💥 生成失敗:', error);
      process.exit(1);
    });
}

module.exports = { generateMemeForgeePlaceholder };