import request from 'request'
import util from 'util'

import loadConfig from './config'
import loadCommands from './commands'
import { afterRequest, decodeTokens } from './utils'

export default async function engine (opts) {
  const config = await loadConfig(opts)
  const commands = await loadCommands()

  const defaultRequestOpts = {}

  const clientId = config.get('client_id')
  const tokens = decodeTokens(config.get('tokens'))
  let envid = config.get('env')
  // env 与第三方库默认参数重名，需要特殊处理一下
  if (typeof envid !== 'string') {
    envid = ''
  }

  if (clientId && tokens[clientId]) {
    const headers = {
      'User-Agent': config.get('ua'),
      Authorization: `Bearer ${tokens[clientId]}`
    }
    if (envid) {
      headers['X-Hydrogen-Env-ID'] = envid
    }
    defaultRequestOpts.headers = headers
  }
  const baseUrl = config.get('base_url')
  if (baseUrl) {
    defaultRequestOpts.baseUrl = baseUrl
  }

  const engine = {
    request: afterRequest(util.promisify(request.defaults(defaultRequestOpts))),
    config,
    cli: Object.keys(commands).reduce((obj, k) => {
      obj[k] = async (...args) => {
        const res = await commands[k].cli(engine, ...args)

        // 当前运行环境信息
        if (clientId && !config.get('json')) {
          console.log('')
          console.log(`- client_id: ${clientId}`)
          console.log(`- ${config.get('prefix')}: v${config.get('version')}`)
          console.log(`- node: ${process.version}`)
          if (envid) {
            console.log(`- env: ${envid}`)
          }
        }

        return res
      }
      return obj
    }, {})
  }

  return engine
}
