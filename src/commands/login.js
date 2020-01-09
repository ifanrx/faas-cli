import fs from 'fs'
import path from 'path'
import { usageError, decodeTokens, encodeTokens } from '../utils'

export async function cli (engine, clientId, clientSecret) {
  if (!clientId || !clientSecret) {
    throw usageError(
      '缺少必填字段 <client_id> 和 <client_secret>',
      '',
      '用法：',
      `    ${engine.config.get('prefix')} login <client_id> <client_secret>`
    )
  }

  const authResponse = await engine.request({
    uri: '/api/oauth2/hydrogen/openapi/authorize/',
    method: 'POST',
    json: {
      client_id: clientId,
      client_secret: clientSecret
    },
    jar: true,
    followAllRedirects: true
  })

  const code = authResponse.body.code

  const response = await engine.request({
    uri: '/api/oauth2/access_token/',
    method: 'POST',
    formData: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code
    }
  })

  if (engine.config.get('json')) {
    console.log(response.body)
  } else {
    await save(engine, JSON.parse(response.body), clientId)
  }

  return response
}

function save (engine, data, clientId) {
  return new Promise((resolve, reject) => {
    let tokens = decodeTokens(engine.config.get('tokens'))
    tokens[clientId] = data.access_token
    tokens = encodeTokens(tokens)

    // 登录成功，更新全局 tokens
    engine.config.set('tokens', tokens, 'config')

    // 如果标记 local，保存 client_id 到当前工作目录
    if (engine.config.get('local')) {
      const pwdInitFile = path.resolve(`./.${engine.config.get('prefix')}rc`)
      fs.writeFileSync(pwdInitFile, `client_id=${clientId}\n`)
    } else {
      // 否则更新全局的 client_id
      engine.config.set('client_id', clientId, 'config')
    }

    engine.config.on('save', () => {
      console.log('登录成功')
      resolve()
    })

    engine.config.on('error', reject)

    engine.config.save('config', 'ini')
  })
}
