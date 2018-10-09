import { usageError } from '../utils'

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
    await save(engine, JSON.parse(response.body))
  }

  return response
}

function save (engine, data) {
  return new Promise((resolve, reject) => {
    engine.config
      .set('access_token', data.access_token, 'config')
      .on('save', () => {
        console.log('登录成功')
        resolve()
      })
      .on('error', reject)
      .save('config', 'ini')
  })
}
