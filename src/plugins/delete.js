import request from 'request'
import { usageError } from '../error'

export async function cli (engine, functionName) {
  if (!functionName) {
    throw usageError(
      '函数名必填',
      '',
      '用法：',
      '',
      `${engine.name} delete <function_name>`
    )
  }

  const json = await engine.config.get('json')
  const accessToken = await engine.config.get('access_token')

  if (!accessToken) {
    throw usageError('请先登录')
  }

  const result = await del({
    accessToken,
    functionName
  })

  if (json) {
    console.log(JSON.stringify(result))
  } else {
    console.log('删除成功')
  }

  return result
}

export function del ({ accessToken, functionName }) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: `https://cloud.minapp.com/oserve/v1.3/cloud-function/${functionName}/`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          json: true
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
