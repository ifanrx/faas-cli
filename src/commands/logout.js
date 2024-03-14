import { decodeTokens, encodeTokens, usageError } from '../utils'

export function cli (engine) {
  return new Promise((resolve, reject) => {
    const tokenKey = engine.config.get('qa') ? 'qa_tokens' : 'tokens'

    if (engine.config.get('qa') && !engine.config.get('base_url')) {
      throw usageError('缺少必填字段 base_url')
    }

    const clientId = engine.config.get('client_id')
    const tokens = decodeTokens(engine.config.get(tokenKey))

    if (tokens[clientId]) {
      delete tokens[clientId]
    }

    engine.config
      .set(tokenKey, encodeTokens(tokens), 'config')
      .on('save', () => {
        console.log('注销成功')
        resolve()
      })
      .on('error', reject)
      .save('config', 'ini')
  })
}
