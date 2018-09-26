import request from 'request'
import prettyjson from 'prettyjson'
import { usageError } from '../error'

export async function cli (engine, functionName, data) {
  if (!functionName) {
    throw usageError(
      '函数名必填',
      '',
      '用法：',
      '',
      `${engine.name} invoke <function_name> [data]`
    )
  }

  const json = await engine.config.get('json')
  const accessToken = await engine.config.get('access_token')

  if (!accessToken) {
    throw usageError('请先登录')
  }

  const result = await invoke({
    accessToken,
    functionName,
    data
  })

  if (json) {
    console.log(JSON.stringify(result))
  } else {
    console.log(prettyjson.render(result))
  }

  return result
}

export function invoke ({ accessToken, functionName, data = {}, sync = true }) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: `https://cloud.minapp.com/oserve/v1.3/cloud-function/${functionName}/debug/`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        json: {
          function_name: functionName,
          data,
          sync
        }
      },
      (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode === 404) {
          return reject(usageError(body || '没有此函数'))
        }

        if (res.statusCode === 401 || res.statusCode === 403) {
          return reject(usageError('请先登录'))
        }

        resolve(body)
      }
    )
  })
}
