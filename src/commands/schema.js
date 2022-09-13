import path from 'path'
import fs from 'fs'
import prettyjson from 'prettyjson'

import { usageError, ensureAuth, validateJSON } from '../utils'

const OPERATION_TYPE = {
  CREATE: 'create'
}

export const cli = ensureAuth(
  async (engine, operationType, schemaName, rootFolder = './') => {
    if (!operationType || !schemaName) {
      throw usageError(
        '缺少必填字段 <operation_type> 和 <schema_name>',
        '',
        '用法：',
        `    ${engine.config.get(
          'prefix'
        )} schema <operation_type> <schema_name>`
      )
    }

    if (!Object.values(OPERATION_TYPE).includes(operationType)) {
      throw usageError('请输入有效的 <operation_type>')
    }

    if (!schemaName.endsWith('.json')) {
      schemaName = `${schemaName}.json`
    }

    const targetFile = path.resolve(rootFolder, schemaName)

    if (!fs.existsSync(targetFile)) {
      throw usageError(
        '数据表文件不存在',
        '',
        `- 数据表名：${schemaName}`,
        `- 数据表根目录: ${rootFolder}`
      )
    }

    const fileContent = fs.readFileSync(targetFile, 'utf8')
    const schemaConfig = validateJSON(fileContent)

    if (!schemaConfig) {
      throw usageError('数据表 JSON 格式错误')
    }

    const response = await engine.request({
      uri: '/oserve/v1.8/table/',
      method: 'POST',
      json: schemaConfig
    })

    if (engine.config.get('json')) {
      console.log(JSON.stringify(response.body))
    } else {
      console.log(prettyjson.render(response.body))
    }

    return response
  }
)
