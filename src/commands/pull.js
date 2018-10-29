import { usageError, ensureAuth } from '../utils'
import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'
import util from 'util'

const mkdir = util.promisify(mkdirp)
const echo = util.promisify(fs.writeFile)

export const cli = ensureAuth(
  async (engine, functionName, rootFolder = './') => {
    if (!functionName) {
      throw usageError(
        '缺少必填字段 <function_name>',
        '',
        '用法：',
        `    ${engine.config.get(
          'prefix'
        )} deploy <function_name> [cloud_function_root]`
      )
    }

    const response = await engine.request({
      uri: `/oserve/v1.3/cloud-function/${functionName}/`,
      method: 'GET',
      json: true
    })

    const data = response.body

    const target = path.resolve(rootFolder, functionName)
    const targetfile = path.join(target, 'index.js')
    await mkdir(target)
    await echo(targetfile, data.function_code)

    if (engine.config.get('json')) {
      console.log(JSON.stringify(data))
    } else {
      console.log('拉取代码成功')
      console.log('')
      console.log(target)
      console.log(targetfile)
      console.log('')
      console.log(`- 函数名：${functionName}`)
      console.log(`- 函数根目录: ${rootFolder}`)
    }
  }
)
