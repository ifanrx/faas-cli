import request from 'request'
import { usageError } from '../error'

export async function cli (engine, limit, offset) {
  const json = await engine.config.get('json')
  const accessToken = await engine.config.get('access_token')

  if (!accessToken) {
    throw usageError('请先登录')
  }

  const result = await list({
    accessToken,
    limit,
    offset
  })

  if (json) {
    console.log(JSON.stringify(result))
  } else {
    console.log('可用的云函数：')
    result.objects.forEach(item => {
      console.log(item.name)
    })
  }

  return result
}

export function list ({ accessToken, limit = 20, offset = 0 }) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: 'https://cloud.minapp.com/oserve/v1.3/cloud-function/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          json: true
        },
        qs: {
          offset,
          limit
        }
      },
      (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode === 401 || res.statusCode === 403) {
          return reject(usageError('请先登录'))
        }

        resolve(JSON.parse(body))
      }
    )
  })
}
