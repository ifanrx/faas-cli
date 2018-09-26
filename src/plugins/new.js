import { usageError } from '../error'
import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'

const FUNCTION_TEMPLATE = `exports.main = function functionName(event, callback) {
  callback(null, "hello world")
}`

export async function cli (engine, functionName, target = './') {
  return new Promise((resolve, reject) => {
    if (!functionName) {
      return reject(
        usageError(
          '函数名必填',
          '',
          '用法：',
          '',
          `${engine.name} new <function_name> [target]`
        )
      )
    }

    const joined = path.join(process.cwd(), target, functionName)
    mkdirp(joined, err => {
      if (err) {
        return reject(err)
      }

      fs.writeFile(path.join(joined, 'index.js'), FUNCTION_TEMPLATE, err => {
        if (err) {
          return reject(err)
        }

        console.log(`已经创建了云函数 ${functionName}\n`)
      })
    })
  })
}
