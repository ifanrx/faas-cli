import nock from 'nock'
import columnify from 'columnify'
import rimraf from 'rimraf'
import util from 'util'
import path from 'path'

import engine from '../engine'

const rm = util.promisify(rimraf)
const host = 'https://cloud.minapp.com'
const config = {
  prefix: 'list_test',
  oshome: __dirname,
  env: { list_test_access_token: '123' }
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

const response = {
  meta: {
    limit: 20,
    next: null,
    offset: 0,
    previous: null,
    total_count: 16
  },
  objects: [
    {
      audit_status: 'approved',
      created_at: 1538028220,
      created_by: '许诺',
      function_code: `exports.main = function functionName(event, callback) { callback(null, "hello world") }`,
      id: 1161,
      name: 'sendCollectProteinTemplateMessage',
      plan_circle: 'P_FREE',
      remark: '定时发送收取蛋白模板消息',
      updated_at: 1538044673,
      updated_by: '许诺'
    }
  ]
}

describe('cli list command', () => {
  const link = '/oserve/v1.3/cloud-function/'
  const query = { limit: 20, offset: 0 }

  // 监听 console.log
  let logStore = ''
  console.log = jest.fn(output => (logStore = output))

  it('list command with nothing', async () => {
    const e = await engine(config)
    expect.assertions(3)

    nock(host)
      .get(link)
      .query(query)
      .reply(401)
    await expect(e.cli.list()).rejects.toThrowError()

    nock(host)
      .get(link)
      .query(query)
      .reply(200, response)

    const res = await e.cli.list()
    await rm(rcPath)
    const view = res.body.objects.map(item => ({
      函数名: item.name,
      状态: item.audit_status
    }))
    expect(res.body).toMatchObject(response)
    expect(logStore).toBe(columnify(view))
  })

  it('list command with json', async () => {
    const e = await engine({
      ...config,
      env: { list_test_json: true, list_test_access_token: '123' }
    })
    expect.assertions(1)

    nock(host)
      .get(link)
      .query(query)
      .reply(200, response)

    const res = await e.cli.list()
    await rm(rcPath)
    expect(logStore).toBe(JSON.stringify(res.body))
  })
})
