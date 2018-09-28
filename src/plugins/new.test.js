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
  prefix: 'new_test'
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

describe('cli login command', () => {
  it('new command with nothing', async () => {
    expect.assertions(1)
    const e = await engine(config)
    await expect(e.cli.new()).rejects.toThrow()
  })

  it('new with specific function name', async () => {
    const name = 'new_commannd_test_folder'
    const folderPath = path.join(process.cwd(), name)
    const filePath = path.join(folderPath, 'index.js')
    expect.assertions(3)
    const e = await engine(config)

    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore += output))

    await e.cli.new(name)
    await expect(fs.statSync(folderPath).isDirectory()).toBe(true)
    await expect(fs.existsSync(filePath)).toBe(true)
    expect(logStore).toBe(
      [
        '创建成功',
        '',
        folderPath,
        filePath,
        '',
        `- 函数名：${name}`,
        `- 函数根目录: ./`
      ].join('')
    )
    await rm(folderPath)
    await rm(rcPath)
  })

  it('new with specific function name and specific target', async () => {
    const name = 'new_command_test_with_target_folder'
    const target = 'new_command_test_target_folder'
    const targetPath = path.join(process.cwd(), target)
    const funcPath = path.join(targetPath, name)
    const e = await engine(config)
    expect.assertions(3)

    // 监听 console.log
    let logStore = ''
    console.log = jest.fn(output => (logStore += output))
    await pmkdirp(funcPath)
    await e.cli.new(name, target)
    await expect(fs.statSync(funcPath).isDirectory()).toBe(true)
    await expect(fs.existsSync(path.join(funcPath, 'index.js'))).toBe(true)
    expect(logStore).toBe(
      [
        '创建成功',
        '',
        funcPath,
        path.join(funcPath, 'index.js'),
        '',
        `- 函数名：${name}`,
        `- 函数根目录: ${target}`
      ].join('')
    )
    await rm(targetPath)
    await rm(rcPath)
  })
})
