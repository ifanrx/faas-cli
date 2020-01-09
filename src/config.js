import cc from 'config-chain'
import nopt from 'nopt'
import osenv from 'osenv'
import fs from 'fs'
import path from 'path'

import pkg from '../package.json'

/**
 * 优先级
 * 1. 命令行参数
 * 2. 环境变量
 * 3. ini rc 文件
 *
 */
export const defaults = {
  argv: process.argv,
  env: process.env,
  prefix: pkg.name,
  oshome: osenv.home(),
  version: pkg.version,
  base_url: 'https://cloud.minapp.com/',
  ua: `ifanr-${pkg.name}/${pkg.version}`
}

export default function loadConfig (opts = {}) {
  return new Promise((resolve, reject) => {
    opts = {
      ...defaults,
      ...opts
    }
    const parsed = nopt(
      {
        json: [Boolean],
        message: [String],
        local: [Boolean],
        envid: [String]
      },
      {
        j: '--json',
        m: '--message',
        l: '--local',
        e: '--envid'
      },
      opts.argv,
      2
    )
    const cmd = parsed.argv.remain.shift() // 命令
    if (cmd) {
      parsed.cmd = cmd
    }
    parsed.params = parsed.argv.remain // 命令行参数

    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    if (!fs.existsSync(iniFile)) {
      fs.writeFileSync(iniFile, '')
    }

    const config = cc(parsed, cc.env(`${opts.prefix}_`, opts.env))

    // 优先读取当前工作目录下的配置文件
    const pwdInitFile = path.resolve(`./.${opts.prefix}rc`)
    if (fs.existsSync(pwdInitFile)) {
      config.addFile(pwdInitFile, 'ini', 'pwdconfig')
    }

    // 读取用户根目录下的配置文件
    config.addFile(iniFile, 'ini', 'config')

    config.add(defaults)

    config.on('load', () => {
      resolve(config)
    })

    config.on('error', reject)
  })
}
