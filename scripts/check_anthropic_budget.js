#!/usr/bin/env node

/**
 * Anthropic API Budget Checker
 * 檢查 Anthropic API 使用量和剩餘額度
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 從環境變數讀取 API key
require('dotenv').config({ path: path.join(__dirname, '../agent/.env') });

const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
    console.error('❌ 找不到 ANTHROPIC_API_KEY');
    process.exit(1);
}

/**
 * 調用 Anthropic API
 */
function makeAPICall(endpoint, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.anthropic.com',
            path: endpoint,
            method: method,
            headers: {
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

/**
 * 檢查可用的 API 端點
 */
async function checkAvailableEndpoints() {
    console.log('🔍 檢查 Anthropic API 可用端點...\n');

    // 常見的可能端點
    const endpoints = [
        '/v1/usage',           // 使用量查詢
        '/v1/billing',         // 帳單資訊
        '/v1/account',         // 帳戶資訊  
        '/v1/credits',         // 額度資訊
        '/v1/organization',    // 組織資訊
        '/v1/me',             // 用戶資訊
        '/v1/messages',       // 測試基本連接
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 嘗試端點: ${endpoint}`);
            const result = await makeAPICall(endpoint);
            
            console.log(`   狀態: ${result.status}`);
            
            if (result.status === 200) {
                console.log('   ✅ 成功！回應:');
                console.log('   ', JSON.stringify(result.data, null, 2));
            } else if (result.status === 401) {
                console.log('   ❌ 認證失敗 (API key 問題)');
            } else if (result.status === 404) {
                console.log('   ❌ 端點不存在');
            } else {
                console.log('   ⚠️  其他錯誤:', result.data);
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`   💥 請求失敗: ${error.message}\n`);
        }
    }
}

/**
 * 測試基本 API 連接
 */
async function testAPIConnection() {
    console.log('🧪 測試基本 API 連接...\n');
    
    try {
        // 嘗試一個簡單的請求來驗證 API key
        const testData = JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1,
            messages: [
                {
                    role: "user",
                    content: "Hi"
                }
            ]
        });

        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'content-length': testData.length
            }
        };

        const result = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
            });
            req.on('error', reject);
            req.write(testData);
            req.end();
        });

        if (result.status === 200) {
            console.log('✅ API key 有效！');
            
            // 檢查回應 headers 中的使用量資訊
            console.log('\n📊 回應 Headers 中的使用量資訊:');
            Object.keys(result.headers).forEach(key => {
                if (key.toLowerCase().includes('usage') || 
                    key.toLowerCase().includes('limit') || 
                    key.toLowerCase().includes('remaining') ||
                    key.toLowerCase().includes('anthropic')) {
                    console.log(`   ${key}: ${result.headers[key]}`);
                }
            });

        } else {
            console.log(`❌ API 測試失敗 (${result.status}):`, result.data);
        }

    } catch (error) {
        console.log('💥 API 連接測試失敗:', error.message);
    }
}

/**
 * 主函數
 */
async function main() {
    console.log('💰 Anthropic API Budget Checker');
    console.log('================================\n');

    // 隱藏 API key 顯示
    const maskedKey = API_KEY ? `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}` : 'None';
    console.log(`🔑 API Key: ${maskedKey}\n`);

    await testAPIConnection();
    await checkAvailableEndpoints();

    console.log('\n📝 如果沒有找到直接的 usage 端點，你可能需要:');
    console.log('   1. 登入 Anthropic Console (https://console.anthropic.com)');
    console.log('   2. 查看 Usage 或 Billing 頁面');
    console.log('   3. 或者聯繫 Anthropic 支援了解 API usage 端點');
}

// 執行主函數
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { makeAPICall, checkAvailableEndpoints };