#!/usr/bin/env node

/**
 * Anthropic API Rate Limits Checker
 * 透過 API 調用獲取當前的 rate limit 資訊
 */

const https = require('https');
const path = require('path');

// 從環境變數讀取 API key
require('dotenv').config({ path: path.join(__dirname, '../../agent/.env') });

const API_KEY = process.env.ANTHROPIC_API_KEY;

function getAnthropicLimits() {
    return new Promise((resolve, reject) => {
        const testData = JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "Hi" }]
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

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const limits = {};
                
                // 解析 rate limit headers
                Object.keys(res.headers).forEach(key => {
                    if (key.startsWith('anthropic-ratelimit-')) {
                        const cleanKey = key.replace('anthropic-ratelimit-', '');
                        limits[cleanKey] = res.headers[key];
                    }
                });

                // 計算使用百分比
                const usage = {
                    requests: {
                        used: parseInt(limits['requests-limit']) - parseInt(limits['requests-remaining']),
                        total: parseInt(limits['requests-limit']),
                        remaining: parseInt(limits['requests-remaining']),
                        percentage: ((parseInt(limits['requests-limit']) - parseInt(limits['requests-remaining'])) / parseInt(limits['requests-limit']) * 100).toFixed(1)
                    },
                    input_tokens: {
                        used: parseInt(limits['input-tokens-limit']) - parseInt(limits['input-tokens-remaining']),
                        total: parseInt(limits['input-tokens-limit']),
                        remaining: parseInt(limits['input-tokens-remaining']),
                        percentage: ((parseInt(limits['input-tokens-limit']) - parseInt(limits['input-tokens-remaining'])) / parseInt(limits['input-tokens-limit']) * 100).toFixed(1)
                    },
                    output_tokens: {
                        used: parseInt(limits['output-tokens-limit']) - parseInt(limits['output-tokens-remaining']),
                        total: parseInt(limits['output-tokens-limit']),
                        remaining: parseInt(limits['output-tokens-remaining']),
                        percentage: ((parseInt(limits['output-tokens-limit']) - parseInt(limits['output-tokens-remaining'])) / parseInt(limits['output-tokens-limit']) * 100).toFixed(1)
                    },
                    total_tokens: {
                        used: parseInt(limits['tokens-limit']) - parseInt(limits['tokens-remaining']),
                        total: parseInt(limits['tokens-limit']),
                        remaining: parseInt(limits['tokens-remaining']),
                        percentage: ((parseInt(limits['tokens-limit']) - parseInt(limits['tokens-remaining'])) / parseInt(limits['tokens-limit']) * 100).toFixed(1)
                    }
                };

                resolve({
                    status: res.statusCode,
                    limits: limits,
                    usage: usage,
                    reset_time: limits['requests-reset']
                });
            });
        });

        req.on('error', reject);
        req.write(testData);
        req.end();
    });
}

async function main() {
    try {
        const result = await getAnthropicLimits();
        
        console.log('🏦 Anthropic API Rate Limits');
        console.log('============================\n');
        
        console.log('📊 Current Usage:');
        console.log(`  📨 Requests: ${result.usage.requests.used}/${result.usage.requests.total} (${result.usage.requests.percentage}%)`);
        console.log(`  📝 Input Tokens: ${result.usage.input_tokens.used.toLocaleString()}/${result.usage.input_tokens.total.toLocaleString()} (${result.usage.input_tokens.percentage}%)`);
        console.log(`  📤 Output Tokens: ${result.usage.output_tokens.used.toLocaleString()}/${result.usage.output_tokens.total.toLocaleString()} (${result.usage.output_tokens.percentage}%)`);
        console.log(`  🔢 Total Tokens: ${result.usage.total_tokens.used.toLocaleString()}/${result.usage.total_tokens.total.toLocaleString()} (${result.usage.total_tokens.percentage}%)`);
        
        console.log('\n⏰ Reset Time:');
        console.log(`  ${new Date(result.reset_time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} (台北時間)`);
        
        console.log('\n🆔 Organization ID:');
        console.log(`  ${result.limits['organization-id'] || 'N/A'}`);
        
        // 警告檢查
        console.log('\n⚠️  Status:');
        if (parseFloat(result.usage.requests.percentage) > 80) {
            console.log('  🔴 Request quota almost exhausted!');
        } else if (parseFloat(result.usage.requests.percentage) > 50) {
            console.log('  🟡 Request quota over 50%');
        } else {
            console.log('  🟢 Request quota looks good');
        }
        
        if (parseFloat(result.usage.total_tokens.percentage) > 80) {
            console.log('  🔴 Token quota almost exhausted!');
        } else if (parseFloat(result.usage.total_tokens.percentage) > 50) {
            console.log('  🟡 Token quota over 50%');
        } else {
            console.log('  🟢 Token quota looks good');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getAnthropicLimits };