import { usageError, ensureAuth, formatByte } from '../utils'

const formatResult = data => {
  const INDENTATION = '  '
  const result = []
  result.push(`测试结果：${data.code ? '失败' : '成功'}`)
  result.push(`${INDENTATION}返回结果：`)
  if (data.code) {
    result.push(`${INDENTATION}错误类型：${data.error.type}`)
    result.push(`${INDENTATION}错误信息：${data.error.message}`)
    result.push(`${INDENTATION}错误堆栈：${data.error.stack}`)
  } else {
    if (typeof data.data === 'object') {
      if (Object.keys(data.data).length > 0) {
        JSON.stringify(data.data, null, 2).split('\n').forEach(item => {
          result.push(`${INDENTATION}${item}`)
        })
      } else {
        result.push(`${INDENTATION}${'{}'}`)
      }
    } else {
      result.push(`${INDENTATION}${data.data}`)
    }
  }

  const others = `

摘要：
  任务 ID：${data.job_id}
  运行时间：${data.execution_time} ms
  计费时间：${data.billing_time} ms
  占用内存：${formatByte(data.mem_usage)}

日志：
  ${data.log.replace('\n', '\n  ')}
`

  return result.join('\n') + others
}

export const cli = ensureAuth(async (engine, functionName, data = {}) => {
  if (!functionName) {
    throw usageError(
      '缺少必填字段 <function_name>',
      '',
      '用法：',
      `    ${engine.config.get('prefix')} invoke <function_name> [data]`
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
    console.log(formatResult(body))
  }

  return response
})
