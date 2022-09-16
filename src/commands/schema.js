import path from 'path'
import fs from 'fs'
import prettyjson from 'prettyjson'

import { usageError, ensureAuth, validateJSON } from '../utils'

const OPERATION_TYPE = {
  CREATE: 'create'
}

/**
 * 创建索引
 * 只能单个创建
 * @param {*} engine
 * @param {*} schemaId 数据表 id
 * @param {*} fields 索引
 */
const createIndex = async (engine, schemaId, schemaIndex) => {
  return engine.request({
    uri: `/oserve/v2.6/schema/${schemaId}/index/`,
    method: 'POST',
    json: schemaIndex
  })
}

/**
 * 删除数据表
 * @param {*} engine
 * @param {*} schemaId 数据表 id
 */
const removeSchema = async (engine, schemaId) => {
  return engine.request({
    uri: `/oserve/v1.8/table/${schemaId}/`,
    method: 'DELETE'
  })
}

/**
 * 获取数据表列表
 * @param {*} engine
 */
const getSchemaList = async engine => {
  return engine.request({
    uri: '/oserve/v1.8/table/?limit=1000',
    method: 'GET'
  })
}

/**
 * 替换 pointer 指向的表名为 id
 * @param {*} engine
 * @param {*} schemaConfig
 */
const replacePointerSchemaWithId = async (engine, schemaConfig) => {
  if (!schemaConfig.schema || !schemaConfig.schema.fields) {
    throw usageError('缺少 schema.fields 字段')
  }

  const schemaList = await getSchemaList(engine)
  schemaList.body = JSON.parse(schemaList.body)

  schemaConfig.schema.fields.forEach(item => {
    if (item.type === 'reference') {
      const [correspondingSchema] = schemaList.body.objects.filter(schemaItem =>
        [schemaItem.name, schemaItem.id].includes(item.schema_name)
      )

      if (!correspondingSchema) {
        throw usageError(
          `找不到 ${item.name} 字段指向的 ${item.schema_name} 表 id`
        )
      }

      item.schema_id = correspondingSchema.id

      delete item.schema_name
    }
  })

  return schemaConfig
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
        )} schema <operation_type> <schema_name> [schema_root_folder]`
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
    let schemaConfig = validateJSON(fileContent)

    if (!schemaConfig) {
      throw usageError('数据表 JSON 格式错误')
    }

    schemaConfig = await replacePointerSchemaWithId(engine, schemaConfig)

    const response = await engine.request({
      uri: '/oserve/v1.8/table/',
      method: 'POST',
      json: schemaConfig
    })

    if (schemaConfig.indexes && schemaConfig.indexes.length) {
      /**
       * open-api 只支持单个创建索引
       * 需要循环遍历，逐个创建
       * 如果创建索引时出错，需把前面创建的数据表删除
       */
      for (const schemaIndex of schemaConfig.indexes) {
        try {
          await createIndex(engine, response.body.id, schemaIndex)
        } catch (error) {
          await removeSchema(engine, response.body.id)
          throw error
        }
      }
    }

    if (engine.config.get('json')) {
      console.log(JSON.stringify(response.body))
    } else {
      console.log(prettyjson.render(response.body))
    }

    return response
  }
)
