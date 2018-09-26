import request from 'request'
import prettyjson from 'prettyjson'
import path from 'path'
import fs from 'fs'

import { usageError } from '../error'

export async function cli (engine, functionName, target = '.') {
  if (!functionName) {
    throw usageError(
      '函数名必填',
      '',
      '用法：',
      '',
      `${engine.name} deploy <function_name> [target]`
    )
  }

  const json = await engine.config.get('json')
  const accessToken = await engine.config.get('access_token')

  if (!accessToken) {
    throw usageError('请先登录')
  }

  let targetFile = path.join(process.cwd(), target, functionName) + '.js'
  if (!fs.existsSync(targetFile)) {
    targetFile = path.join(process.cwd(), target, functionName, 'index.js')
    if (!fs.existsSync(targetFile)) {
      throw usageError(
        '不存在此云函数文件',
        '',
        `云函数根目录：${target}`,
        `函数名：${functionName}`
      )
    }
  }

  let functionCode = fs.readFileSync(targetFile, 'utf8')

  const result = await deploy({
    accessToken,
    functionName,
    functionCode
  })

  if (json) {
    console.log(JSON.stringify(result))
  } else {
    if (result && result.audit_status === 'approved') {
      console.log('部署成功')
    } else {
      console.log(prettyjson.render(result))
    }
  }

  return result
}

export function deploy ({ accessToken, functionName, functionCode, remark = '' }) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: 'https://cloud.minapp.com/oserve/v1.3/cloud-function/',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        json: {
          name: functionName,
          function_code: functionCode,
          remark
        }
      },
      (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode === 401 || res.statusCode === 403) {
          return reject(usageError('请先登录'))
        }

        resolve(body)
      }
    )
  })
}
