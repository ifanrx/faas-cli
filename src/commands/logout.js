import { decodeTokens, encodeTokens } from '../utils'

export function cli (engine) {
  return new Promise((resolve, reject) => {
    const clientId = engine.config.get('client_id')
    const tokens = decodeTokens(engine.config.get('tokens'))

    if (tokens[clientId]) {
      delete tokens[clientId]
    }

    engine.config
      .set('tokens', encodeTokens(tokens), 'config')
      .on('save', () => {
        console.log('注销成功')
        resolve()
      })
      .on('error', reject)
      .save('config', 'ini')
  })
}
