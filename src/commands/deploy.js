import prettyjson from 'prettyjson'
import path from 'path'
import fs from 'fs'

import { usageError, ensureAuth } from '../utils'

export const cli = ensureAuth(
  async (engine, functionName, rootFolder = './') => {
    if (!functionName) {
      throw usageError(
        '缺少必填字段 <function_name>',
        '',
        '用法：',
        `    ${engine.config.get(
          'prefix'
        )} deploy <function_name> [cloud_function_root] [-m remark]`
      )
    }

    const candidate = [
      path.resolve(rootFolder, functionName) + '.js',
      path.resolve(rootFolder, functionName, 'index.js')
    ]

    let targetFile

    candidate.forEach(file => {
      if (fs.existsSync(file)) {
        targetFile = file
      }
    })

    if (!targetFile) {
      throw usageError(
        '云函数文件不存在',
        '',
        candidate.join('\n'),
        '',
        `- 函数名：${functionName}`,
        `- 函数根目录: ${rootFolder}`
      )
    }

    const functionCode = fs.readFileSync(targetFile, 'utf8')

    if (!functionCode) {
      throw usageError('云函数代码不能为空')
    }

    const remark = engine.config.get('message')

    try {
      const response = await engine.request({
        uri: `/oserve/v1.3/cloud-function/${functionName}/`,
        method: 'PATCH',
        json: {
          name: functionName,
          function_code: functionCode,
          remark
        }
      })

      if (engine.config.get('json')) {
        console.log(JSON.stringify(response.body))
      } else {
        console.log(prettyjson.render(response.body))
      }
    } catch (err) {
      // 如果不存在则尝试创建
      if (err.type === 'EUSAGE') {
        const createResponse = await engine.request({
          uri: '/oserve/v1.3/cloud-function/',
          method: 'POST',
          json: {
            name: functionName,
            function_code: functionCode,
            remark
          }
        })

        if (engine.config.get('json')) {
          console.log(JSON.stringify(createResponse.body))
        } else {
          console.log(prettyjson.render(createResponse.body))
        }
      } else {
        throw err
      }
    }
  }
)
