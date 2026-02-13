#!/usr/bin/env node
/**
 * 工具使用頻率自動分析腳本
 * 每3天執行一次，分析最近的工具使用情況
 */

const fs = require('fs');
const path = require('path');

// 分析最近3天的 journal 文件
const journalDir = path.join(__dirname, '..', 'memory', 'journal');
const now = new Date();
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

// 統計工具使用
const toolUsage = {};

console.log(`開始分析 ${threeDaysAgo.toISOString().split('T')[0]} 到 ${now.toISOString().split('T')[0]} 的工具使用情況...`);

try {
  // 讀取最近3天的 journal 檔案
  const files = fs.readdirSync(journalDir).filter(f => {
    const dateStr = f.replace('.md', '');
    const date = new Date(dateStr);
    return date >= threeDaysAgo && date <= now && !isNaN(date.getTime());
  });

  console.log(`找到 ${files.length} 個 journal 檔案: ${files.join(', ')}`);

  files.forEach(file => {
    const content = fs.readFileSync(path.join(journalDir, file), 'utf8');
    
    // 尋找工具調用記錄
    const toolInvokes = content.match(/<invoke name="(\w+)">/g) || [];
    
    toolInvokes.forEach(invoke => {
      const toolMatch = invoke.match(/<invoke name="(\w+)">/);
      if (toolMatch) {
        const tool = toolMatch[1];
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      }
    });
  });

  // 生成分析報告
  const sortedUsage = Object.entries(toolUsage).sort(([,a], [,b]) => b - a);
  const highFreq = sortedUsage.filter(([,count]) => count > 10);
  const mediumFreq = sortedUsage.filter(([,count]) => count >= 3 && count <= 10);
  const lowFreq = sortedUsage.filter(([,count]) => count < 3);
  
  const totalTools = sortedUsage.length;
  const totalUsage = Object.values(toolUsage).reduce((a,b) => a+b, 0);

  console.log(`\n工具使用統計:`);
  console.log(`總工具數: ${totalTools}, 總使用次數: ${totalUsage}`);
  console.log(`高頻工具 (>10次): ${highFreq.length}個`);
  console.log(`中頻工具 (3-10次): ${mediumFreq.length}個`);
  console.log(`低頻工具 (<3次): ${lowFreq.length}個`);

  // 寫入分析結果到今天的 journal
  const today = now.toISOString().split('T')[0];
  const journalPath = path.join(journalDir, `${today}.md`);
  
  const time = now.toTimeString().slice(0,5);
  const analysisEntry = `
## ${time} — 🔄 TOOL ANALYSIS (自動分析)

### 工具使用頻率分析 (最近3天)
**分析期間**: ${threeDaysAgo.toISOString().split('T')[0]} ~ ${today}  
**數據來源**: ${files.length}個 journal 檔案

**高頻工具** (>10次): ${highFreq.map(([tool, count]) => `${tool}(${count})`).join(', ') || '無'}  
**中頻工具** (3-10次): ${mediumFreq.map(([tool, count]) => `${tool}(${count})`).join(', ') || '無'}  
**低頻工具** (<3次): ${lowFreq.map(([tool, count]) => `${tool}(${count})`).join(', ') || '無'}

**總計**: ${totalTools}個工具，${totalUsage}次使用

### 📊 前10名最常用工具
${sortedUsage.slice(0, 10).map(([tool, count], i) => `${i+1}. ${tool}: ${count}次`).join('\n')}

### 分類調整建議
${highFreq.length > 0 ? '✅ 高頻工具保持核心分類，確保快速載入' : ''}
${mediumFreq.length > 0 ? '📊 中頻工具使用穩定，維持當前分類策略' : ''}
${lowFreq.length > 0 ? '🔄 低頻工具考慮按需載入，優化 token 使用' : ''}

---
`;

  fs.appendFileSync(journalPath, analysisEntry);
  console.log(`\n✅ 分析完成，結果已寫入 ${journalPath}`);

} catch (error) {
  console.error('❌ 分析過程中發生錯誤:', error.message);
  
  // 記錄錯誤到今天的 journal
  const today = now.toISOString().split('T')[0];
  const journalPath = path.join(journalDir, `${today}.md`);
  const time = now.toTimeString().slice(0,5);
  
  const errorEntry = `
## ${time} — ❌ TOOL ANALYSIS ERROR

工具使用分析執行失敗: ${error.message}

---
`;
  
  fs.appendFileSync(journalPath, errorEntry);
}