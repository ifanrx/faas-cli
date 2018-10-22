import { usageError, ensureAuth } from '../utils'
import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'
import util from 'util'

const mkdir = util.promisify(mkdirp)
const echo = util.promisify(fs.writeFile)

const FUNCTION_TEMPLATE = `exports.main = function functionName(event, callback) {
  callback(null, "hello world")
}`

export const cli = ensureAuth(
  async (engine, functionName, rootFolder = './') => {
    if (!functionName) {
      throw usageError(
        '缺少必填字段 <function_name>',
        '',
        '用法：',
        `    ${engine.config.get(
          'prefix'
        )} new <function_name> [cloud_function_root] [-m remark]`
      )
    }

    const remark = engine.config.get('message')

    await engine.request({
      uri: '/oserve/v1.3/cloud-function/',
      method: 'POST',
      json: {
        name: functionName,
        function_code: FUNCTION_TEMPLATE,
        remark
      }
    })

    const target = path.resolve(rootFolder, functionName)
    const targetfile = path.join(target, 'index.js')
    await mkdir(target)
    await echo(targetfile, FUNCTION_TEMPLATE)

    console.log('创建成功')
    console.log('')
    console.log(target)
    console.log(targetfile)
    console.log('')
    console.log(`- 函数名：${functionName}`)
    console.log(`- 函数根目录: ${rootFolder}`)
  }
)
