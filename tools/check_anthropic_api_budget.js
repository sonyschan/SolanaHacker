/**
 * Anthropic API Budget Checker Tool
 * 檢查 Anthropic API 當前的使用量、Rate Limits 和剩餘額度
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function check_anthropic_api_budget() {
    try {
        // 執行我們的 rate limits checker
        const scriptPath = path.join(process.cwd(), 'scripts/get_anthropic_limits.cjs');
        const { stdout, stderr } = await execAsync(`node ${scriptPath}`);

        if (stderr && !stderr.includes('dotenv')) {
            throw new Error(`Script error: ${stderr}`);
        }

        // 解析輸出獲取結構化資料
        const output = stdout.trim();
        
        // 提取數值資訊（簡化版解析）
        const requestsMatch = output.match(/📨 Requests: (\d+)\/(\d+) \(([0-9.]+)%\)/);
        const inputTokensMatch = output.match(/📝 Input Tokens: ([0-9,]+)\/([0-9,]+) \(([0-9.]+)%\)/);
        const outputTokensMatch = output.match(/📤 Output Tokens: ([0-9,]+)\/([0-9,]+) \(([0-9.]+)%\)/);
        const totalTokensMatch = output.match(/🔢 Total Tokens: ([0-9,]+)\/([0-9,]+) \(([0-9.]+)%\)/);
        const resetTimeMatch = output.match(/⏰ Reset Time:\s+(.+?) \(台北時間\)/);

        const result = {
            status: 'success',
            timestamp: new Date().toISOString(),
            data: {
                requests: requestsMatch ? {
                    used: parseInt(requestsMatch[1]),
                    total: parseInt(requestsMatch[2]),
                    percentage: parseFloat(requestsMatch[3]),
                    remaining: parseInt(requestsMatch[2]) - parseInt(requestsMatch[1])
                } : null,
                input_tokens: inputTokensMatch ? {
                    used: parseInt(inputTokensMatch[1].replace(/,/g, '')),
                    total: parseInt(inputTokensMatch[2].replace(/,/g, '')),
                    percentage: parseFloat(inputTokensMatch[3]),
                    remaining: parseInt(inputTokensMatch[2].replace(/,/g, '')) - parseInt(inputTokensMatch[1].replace(/,/g, ''))
                } : null,
                output_tokens: outputTokensMatch ? {
                    used: parseInt(outputTokensMatch[1].replace(/,/g, '')),
                    total: parseInt(outputTokensMatch[2].replace(/,/g, '')),
                    percentage: parseFloat(outputTokensMatch[3]),
                    remaining: parseInt(outputTokensMatch[2].replace(/,/g, '')) - parseInt(outputTokensMatch[1].replace(/,/g, ''))
                } : null,
                total_tokens: totalTokensMatch ? {
                    used: parseInt(totalTokensMatch[1].replace(/,/g, '')),
                    total: parseInt(totalTokensMatch[2].replace(/,/g, '')),
                    percentage: parseFloat(totalTokensMatch[3]),
                    remaining: parseInt(totalTokensMatch[2].replace(/,/g, '')) - parseInt(totalTokensMatch[1].replace(/,/g, ''))
                } : null,
                reset_time: resetTimeMatch ? resetTimeMatch[1].trim() : null
            },
            raw_output: output
        };

        // 健康狀態檢查
        let health_status = 'healthy';
        let warnings = [];

        if (result.data.requests && result.data.requests.percentage > 80) {
            health_status = 'warning';
            warnings.push(`Request quota almost exhausted: ${result.data.requests.percentage}%`);
        }

        if (result.data.total_tokens && result.data.total_tokens.percentage > 80) {
            health_status = 'warning';
            warnings.push(`Token quota almost exhausted: ${result.data.total_tokens.percentage}%`);
        }

        result.health = {
            status: health_status,
            warnings: warnings
        };

        return result;

    } catch (error) {
        return {
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            data: null
        };
    }
}

export const check_anthropic_api_budget_config = {
    name: 'check_anthropic_api_budget',
    description: 'Check Anthropic API usage, rate limits, and remaining quota. Returns current usage statistics and quota health status.',
    category: 'development',
    subcategory: 'api_management',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    examples: [
        {
            title: "Check API Budget",
            example: "check_anthropic_api_budget()",
            description: "Get current Anthropic API usage and remaining quota"
        }
    ],
    returns: {
        success: {
            status: 'success',
            data: {
                requests: { used: 'number', total: 'number', percentage: 'number', remaining: 'number' },
                input_tokens: { used: 'number', total: 'number', percentage: 'number', remaining: 'number' },
                output_tokens: { used: 'number', total: 'number', percentage: 'number', remaining: 'number' },
                total_tokens: { used: 'number', total: 'number', percentage: 'number', remaining: 'number' },
                reset_time: 'string (datetime)'
            },
            health: {
                status: 'healthy|warning|critical',
                warnings: ['array of warning messages']
            }
        },
        error: {
            status: 'error',
            error: 'string (error message)'
        }
    },
    notes: [
        "This tool makes a minimal API call to get rate limit information from headers",
        "Rate limits reset every hour",
        "Monitor usage to avoid hitting limits",
        "Use health.warnings to get quota alerts"
    ]
};