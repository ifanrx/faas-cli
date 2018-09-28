import { usageError, ensureAuth } from '../utils'

export const cli = ensureAuth(async (engine, functionName) => {
  if (!functionName) {
    throw usageError(
      '函数名必填',
      '',
      '用法：',
      '',
      `${engine.config.get('prefix')} delete <function_name>`
    )
  }

  const response = await engine.request({
    uri: `/oserve/v1.3/cloud-function/${functionName}/`,
    method: 'DELETE',
    headers: {
      json: true
    }
  })

  console.log('删除成功')

  return response
})
