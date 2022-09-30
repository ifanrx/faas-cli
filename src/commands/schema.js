import path from 'path'
import fs from 'fs'

import {usageError, ensureAuth, validateJSON} from '../utils'
import {isEqual} from 'lodash'

const OPERATION_TYPE = {
  IMPORT: 'import'
}

const batchImportedSchemaIds = []

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
 * 新增数据表
 * @param {*} engine
 * @param {*} schemaConfig 数据表配置
 */
const createSchema = async (engine, schemaConfig) => {
  return engine.request({
    uri: '/oserve/v1.8/table/',
    method: 'POST',
    json: schemaConfig
  })
}

/**
 * 获取数据表列表
 * @param {*} engine
 */
const getSchemaList = async engine => {
  const res = await engine.request({
    uri: '/oserve/v1.8/table/?limit=1000',
    method: 'GET'
  })

  const body = JSON.parse(res.body)
  return body.objects
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

  schemaConfig.schema.fields.forEach(item => {
    if (item.type === 'reference') {
      const [correspondingSchema] = schemaList.filter(schemaItem =>
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

/**
 * 创建数据表
 * @param {*} engine
 * @param {*} schemaConfig
 */
const importSchema = async (engine, schemaConfig) => {
  schemaConfig = await replacePointerSchemaWithId(engine, schemaConfig)

  const response = await createSchema(engine, schemaConfig)

  if (!Array.isArray(schemaConfig.indexes)) return response

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

  return response
}

/**
 * 更新用户表
 * 用户表是每个应用默认生成的，不能导入，只能更新
 * @param {*} engine
 * @param {*} schemaConfig
 */
const updateUserProfile = async (engine, schemaConfig) => {
  const schemaList = await getSchemaList(engine)
  const [userprofile] = schemaList.filter(item => item.name === '_userprofile')

  delete schemaConfig.name // _userprofile 表名无法修改，否则报错

  return engine.request({
    uri: `/oserve/v1.8/table/${userprofile.id}/`,
    method: 'PUT',
    json: schemaConfig
  })
}

/**
 * 检验表是否已存在
 * @param {*} engine
 * @param {*} schemaConfig
 */
const validateExistedSchema = async (engine, schemaConfig) => {
  const schemaList = await getSchemaList(engine)

  const schemaNames = schemaConfig.map(item => item.name)

  for (const item of schemaList) {
    if (schemaNames.includes(item.name)) {
      throw usageError(`${item.name} 表已存在`)
    }
  }
}

/**
 * 上传带有 pointer 的数据表
 * @param {*} engine
 * @param {*} pointerSchema
 * @param {*} previousPointerSchema
 */
const importPointerSchema = async (
  engine,
  pointerSchema,
  previousPointerSchema
) => {
  if (!pointerSchema.length) return
  if (isEqual(pointerSchema, previousPointerSchema)) {
    throw usageError(
      '找不到 Pointer 指向的数据表。如果数据表之间有循环依赖，请在控制台手动建表。'
    )
  }

  const schemaList = await getSchemaList(engine)
  const existedSchemaNames = schemaList.map(item => item.name)

  /**
   * 区分每个含有 pointer 的表是否都指向已存在的表
   * 是则上传，否则待定
   */
  const pending = []
  for (const item of pointerSchema) {
    const pointers = item.schema.fields.reduce((acc, field) => {
      if (field.type === 'reference') {
        acc.push(field.schema_name)
      }
      return acc
    }, [])

    if (!pointers.every(pointer => existedSchemaNames.includes(pointer))) {
      pending.push(item)
      continue
    }

    const res = await importSchema(engine, item)
    batchImportedSchemaIds.push(res.body.id)
  }

  await importPointerSchema(engine, pending, pointerSchema)
}

/**
 * 反向删除已上传的数据表
 * @param {*} engine
 */
const backwardRemoveSchema = async engine => {
  for (let i = batchImportedSchemaIds.length - 1; i >= 0; i--) {
    const schemaId = batchImportedSchemaIds[i]
    await removeSchema(engine, schemaId)
  }
}

/**
 * 批量上传数据表
 * @param {*} engine
 * @param {*} schemaConfig
 */
const batchImportSchema = async (engine, schemaConfig) => {
  // 批量模式下不上传用户表
  schemaConfig = schemaConfig.filter(item => item.name !== '_userprofile')

  /**
   * 重要，必须先检查表是否存在
   * 必须都不存在，方可上传
   * 否则会错删数据表
   */
  await validateExistedSchema(engine, schemaConfig)

  /**
   * 分类含有 pointer 和不含有 pointer 的数据表
   */
  const {withoutPointer, withPointer} = schemaConfig.reduce(
    (final, item) => {
      const hasPointer = item.schema.fields.some(
        field => field.type === 'reference'
      )

      const target = hasPointer ? final.withPointer : final.withoutPointer
      target.push(item)

      return final
    },
    {withoutPointer: [], withPointer: []}
  )

  try {
    /**
     * 1. 优先上传字段不包含 pointer 的数据表
     */
    for (const schemaConfig of withoutPointer) {
      const res = await importSchema(engine, schemaConfig)
      batchImportedSchemaIds.push(res.body.id)
    }

    /**
     * 2. 上传含有 pointer 的数据表
     */
    await importPointerSchema(engine, withPointer)
  } catch (error) {
    // 遇到错误，需把之前已上传的数据表均删除
    await backwardRemoveSchema(engine)
    console.error(error)
    throw usageError('上传失败')
  }

  console.log('上传成功')
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
    const schemaConfig = validateJSON(fileContent)

    if (!schemaConfig) {
      throw usageError('数据表 JSON 格式错误')
    }

    if (!Array.isArray(schemaConfig)) {
      const schemaFunc =
        schemaConfig.name === '_userprofile' ? updateUserProfile : importSchema
      const response = await schemaFunc(engine, schemaConfig)

      console.log('上传成功')
      return response
    }

    return batchImportSchema(engine, schemaConfig)
  }
)
