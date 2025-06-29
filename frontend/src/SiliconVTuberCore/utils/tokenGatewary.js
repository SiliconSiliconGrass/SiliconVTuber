import tokens from '@/tokens/tokens.token.js'

/**
 * 获取一些预存token
 * @param {string} tokenName token的名称（相当于索引）
 * @returns {string} token
 */
export function getToken(tokenName) {
    return tokens[tokenName];
}
