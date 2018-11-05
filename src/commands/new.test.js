import nock from 'nock'
import path from 'path'
import rimraf from 'rimraf'
import util from 'util'
import engine from '../engine'
import fs from 'fs'
import mkdirp from 'mkdirp'

const rm = util.promisify(rimraf)
const pmkdirp = util.promisify(mkdirp)
const config = {
  oshome: __dirname,
  prefix: 'new_test',
  env: {
    new_test_client_id: '123',
    new_test_tokens: '123:123'
  }
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

const funcName = 'new_test'
const host = 'https://cloud.minapp.com'
const link = '/oserve/v1.3/cloud-function/'

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

describe('cli login command', () => {
  it('new command with nothing', async () => {
    expect.assertions(1)
    const e = await engine(config)
    await expect(e.cli.new()).rejects.toThrow()
  })

  it('new with specific function name', async () => {
    const folderPath = path.join(process.cwd(), funcName)
    const filePath = path.join(folderPath, 'index.js')
    const e = await engine(config)
    expect.assertions(3)

    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore += output))

    const reqObj = {
      name: funcName,
      function_code: funcCode
    }
    nock(host)
      .post(link, reqObj)
      .reply(200, response)

    await e.cli.new(funcName)
    await expect(fs.statSync(folderPath).isDirectory()).toBe(true)
    await expect(fs.existsSync(filePath)).toBe(true)
    const expectedStr = [
      '创建成功',
      '',
      folderPath,
      filePath,
      '',
      `- 函数名：${funcName}`,
      `- 函数根目录: ./`
    ].join('')
    expect(logStore.indexOf(expectedStr) > -1).toBe(true)
    await rm(folderPath)
    await rm(rcPath)
  })

  it('new with specific function name and specific target', async () => {
    const target = 'new_command_test_target_folder'
    const targetPath = path.join(process.cwd(), target)
    const funcPath = path.join(targetPath, funcName)
    const e = await engine(config)
    expect.assertions(3)

    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore += output))

    const reqObj = {
      name: funcName,
      function_code: funcCode
    }
    nock(host)
      .post(link, reqObj)
      .reply(200, response)

    await pmkdirp(funcPath)
    await e.cli.new(funcName, target)
    await expect(fs.statSync(funcPath).isDirectory()).toBe(true)
    await expect(fs.existsSync(path.join(funcPath, 'index.js'))).toBe(true)
    const expectedStr = [
      '创建成功',
      '',
      funcPath,
      path.join(funcPath, 'index.js'),
      '',
      `- 函数名：${funcName}`,
      `- 函数根目录: ${target}`
    ].join('')
    expect(logStore.indexOf(expectedStr) > -1).toBe(true)
    await rm(targetPath)
    await rm(rcPath)
  })
})
