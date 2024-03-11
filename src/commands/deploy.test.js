import nock from 'nock'
import rimraf from 'rimraf'
import util from 'util'
import path from 'path'
import fs from 'fs'
import prettyjson from 'prettyjson'

import engine from '../engine'

const rm = util.promisify(rimraf)
const funcName = 'deploy_test'
const host = 'https://cloud.minapp.com'
const link = `/oserve/v1.3/cloud-function/${funcName}/`
const config = {
  prefix: 'deploy_test',
  oshome: __dirname,
  env: {
    deploy_test_client_id: '123',
    deploy_test_tokens: '123:123'
  }
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

const funcCode =
  'exports.main = function functionName(event, callback) {\n  callback(null, "hello world")\n}'
const response = {
  audit_status: 'approved',
  created_at: 1535903214,
  created_by: 'somebody',
  function_code: funcCode,
  id: 847,
  name: funcName,
  plan_circle: 'P_FREE',
  remark: '',
  updated_at: 1537710962,
  updated_by: 'somebody'
}

describe('cli deploy command', () => {
  it('deploy command with nothing', async () => {
    const e = await engine(config)
    expect.assertions(1)
    await expect(e.cli.deploy()).rejects.toThrowError()
    await rm(rcPath)
  })

  it('deploy command with function name', async () => {
    let e = await engine(config)
    expect.assertions(3)

    // funcName file not exist
    await expect(e.cli.deploy(funcName)).rejects.toThrowError()

    // 监听 console.log
    let logStore = []
    console.log = jest.fn(output => logStore.push(output))

    // create function file
    const testFilePath = path.join(process.cwd(), funcName + '.js')
    fs.writeFileSync(testFilePath, funcCode)

    const reqObj = {
      name: funcName,
      function_code: funcCode
    }
    nock(host)
      .patch(link, reqObj)
      .reply(200, response)

    logStore = []
    await e.cli.deploy(funcName)
    expect(logStore[0]).toBe(prettyjson.render(response))

    // with json flag
    e = await engine({
      ...config,
      env: {
        [`${config.prefix}_json`]: true,
        [`${config.prefix}_client_id`]: '123',
        deploy_test_tokens: '123:123'
      }
    })

    nock(host)
      .patch(link, reqObj)
      .reply(200, response)

    logStore = []
    await e.cli.deploy(funcName)
    expect(logStore[0]).toBe(JSON.stringify(response))

    // clean
    await rm(testFilePath)
  })

  it('deploy command with message', async () => {
    const message = 'deploy test message'
    const e = await engine({
      ...config,
      env: {
        [`${config.prefix}_message`]: message,
        [`${config.prefix}_client_id`]: '123',
        [`${config.prefix}_tokens`]: '123:123'
      }
    })
    expect.assertions(1)

    // 监听 console.log
    const logStore = []
    console.log = jest.fn(output => logStore.push(output))

    // create function file
    const testFilePath = path.join(process.cwd(), funcName + '.js')
    fs.writeFileSync(testFilePath, funcCode)

    const reqObj = {
      name: funcName,
      function_code: funcCode,
      remark: message
    }

    const messageResp = { ...response, remark: message }
    nock(host)
      .patch(link, reqObj)
      .reply(200, messageResp)

    await e.cli.deploy(funcName)
    expect(logStore[0]).toBe(prettyjson.render(messageResp))

    await rm(testFilePath)
    await rm(rcPath)
  })
})
