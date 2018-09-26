import request from 'request'
import { usageError } from '../error'
import * as config from '../config'

export function cli (engine, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    if (!clientId || !clientSecret) {
      reject(
        usageError(
          '请输入 client_id 和 client_secret',
          '',
          '用法：',
          `${engine.name} login <client_id> <client_secret>`
        )
      )
    }

    login({ clientId, clientSecret })
      .then(data => {
        config
          .set('access_token', data.access_token)
          .then(() => {
            console.log('已登录')
            resolve()
          })
          .catch(reject)
      })
      .catch(reject)
  })
}

function login ({ clientId, clientSecret }) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: 'https://cloud.minapp.com/api/oauth2/hydrogen/openapi/authorize/',
        method: 'POST',
        json: {
          client_id: clientId,
          client_secret: clientSecret
        },
        jar: true, // 允许记住 cookie
        followAllRedirects: true // 允许重定向
      },
      (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (body.status === 'error') {
          return reject(usageError(body.error_msg))
        }

        const code = body.code

        request(
          {
            uri: 'https://cloud.minapp.com/api/oauth2/access_token/',
            method: 'POST',
            formData: {
              // 指定 data 以 "Content-Type": "multipart/form-data" 传送
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'authorization_code',
              code
            }
          },
          (err, res, body) => {
            if (err) {
              return reject(err)
            }
            if (body && body.error) {
              return reject(usageError(body.error))
            }

            resolve(JSON.parse(body))
          }
        )
      }
    )
  })
}
