/**
 * R2 state helpers — same pattern as traderhan.
 */
export async function getState(env, key) {
  try {
    const obj = await env.R2_BUCKET.get(key);
    return obj ? JSON.parse(await obj.text()) : null;
  } catch {
    return null;
  }
}

export async function putState(env, key, data) {
  await env.R2_BUCKET.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' }
  });
}

/**
 * Get today's date in GMT+8 (YYYY-MM-DD)
 */
export function todayGMT8() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().split('T')[0];
}
