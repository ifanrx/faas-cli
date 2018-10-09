import columnify from 'columnify'
import { ensureAuth } from '../utils'

export const cli = ensureAuth(async (engine, limit = 20, offset = 0) => {
  const response = await engine.request({
    uri: '/oserve/v1.3/cloud-function/',
    json: true,
    method: 'GET',
    qs: {
      offset,
      limit
    }
  })

  if (engine.config.get('json')) {
    console.log(JSON.stringify(response.body))
  } else {
    const data = response.body

    if (data.objects.length === 0) {
      console.log('没有云函数')
    } else {
      const view = data.objects.map(item => ({
        函数名: item.name,
        状态: item.audit_status
      }))
      console.log(columnify(view))
    }
  }

  return response
})
