import nock from 'nock'
import rimraf from 'rimraf'
import util from 'util'
import path from 'path'

import engine from '../engine'
import { formatByte } from '../utils'

const rm = util.promisify(rimraf)
const host = 'https://cloud.minapp.com'
const config = {
  prefix: 'invoke_test',
  oshome: __dirname,
  env: { invoke_test_access_token: '123' }
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)
const formatResult = data => {
  const result = `测试结果：${data.code ? '失败' : '成功'}
  返回结果：
  ${
  data.code
    ? `
    错误类型：${data.error.type}
    错误信息：${data.error.message}
    错误堆栈：${data.error.stack}`
    : `${data.data}`
}

摘要：
  任务 ID：${data.job_id}
  运行时间：${data.execution_time}
  计费时间：${data.billing_time}
  占用内存：${formatByte(data.mem_usage)}

日志：
  ${data.log.replace('\n', '\n  ')}
`
  return result
}

const response = {
  billing_time: 100,
  code: 0,
  data: 'hello world',
  error: {},
  execution_time: 13.46,
  job_id: '490f08ff9b2e4a6b874581de53950e54',
  log:
    '2018-09-21T03:46:26.026Z LOG event.data:  {}\n2018-09-21T03:46:26.029Z LOG return:  hello world\n',
  mem_usage: 78340096
}

describe('cli invoke command', () => {
  it('invoke command with nothing', async () => {
    const e = await engine(config)
    expect.assertions(1)
    await expect(e.cli.invoke()).rejects.toThrowError()
    await rm(rcPath)
  })

  it('invoke command with function name', async () => {
    const functionName = 'invoke_test'
    const link = `/oserve/v1.3/cloud-function/${functionName}/debug/`
    const e = await engine(config)
    expect.assertions(3)
    nock(host)
      .post(link, { function_name: functionName, data: {}, sync: true })
      .reply(200, response)

    let spyMessage = ''
    const spy = jest
      .spyOn(global.console, 'log')
      .mockImplementation(msg => (spyMessage = msg))

    const res = await e.cli.invoke(functionName)

    expect(res.body).toMatchObject(response)
    expect(spy).toHaveBeenCalled()
    expect(spyMessage).toBe(formatResult(res.body))

    spy.mockRestore()
    await rm(rcPath)
  })

  it('invoke command with function name and invalid data', async () => {
    const functionName = 'invoke_invalid_data_test'
    const link = `/oserve/v1.3/cloud-function/${functionName}/debug/`
    const e = await engine(config)
    const postObj = {
      function_name: functionName,
      data: 'invalid json',
      sync: true
    }
    expect.assertions(1)
    nock(host)
      .post(link, postObj)
      .reply(200, response)

    await expect(e.cli.invoke(functionName)).rejects.toThrowError()
    await rm(rcPath)
  })

  it('invoke command with function name and valid data', async () => {
    expect.assertions(1)
    const e = await engine(config)
    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore = output))
    const functionName = 'invoke_valid_data_test'
    const link = `/oserve/v1.3/cloud-function/${functionName}/debug/`
    const postObj = {
      function_name: functionName,
      data: { data1: 'hello', data2: 123 },
      sync: true
    }
    nock(host)
      .post(link, postObj)
      .reply(200, response)
    const res = await e.cli.invoke(functionName, JSON.stringify(postObj.data))
    expect(logStore).toBe(formatResult(res.body))

    await rm(rcPath)
  })

  it('invoke command with json flag', async () => {
    expect.assertions(1)
    const e = await engine({
      ...config,
      env: {
        [`${config.prefix}_json`]: true,
        [`${config.prefix}_access_token`]: '123'
      }
    })
    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore = output))

    const functionName = 'invoke_with_json'
    const link = `/oserve/v1.3/cloud-function/${functionName}/debug/`
    const postObj = {
      function_name: functionName,
      data: { data1: 'hello', data2: 123 },
      sync: true
    }

    nock(host)
      .post(link, postObj)
      .reply(200, response)
    const res = await e.cli.invoke(functionName, JSON.stringify(postObj.data))
    expect(logStore).toBe(JSON.stringify(res.body))

    await rm(rcPath)
  })
})
