import prettyjson from 'prettyjson'
import { usageError, ensureAuth } from '../utils'

export const cli = ensureAuth(async (engine, functionName, data = {}) => {
  if (!functionName) {
    throw usageError(
      '函数名必填',
      '',
      '用法：',
      '',
      `${engine.config.get('prefix')} invoke <function_name> [data]`
    )
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (err) {
      throw usageError('data 不是合法的 JSON')
    }
  }

  const response = await engine.request({
    uri: `/oserve/v1.3/cloud-function/${functionName}/debug/`,
    method: 'POST',
    json: { function_name: functionName, data, sync: true }
  })

  const body = response.body

  if (engine.config.get('json')) {
    console.log(JSON.stringify(body))
  } else {
    console.log(prettyjson.render(body))
  }

  return response
})
