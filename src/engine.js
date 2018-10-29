import request from 'request'
import util from 'util'

import loadConfig from './config'
import loadCommands from './commands'
import { afterRequest } from './utils'

export default async function engine (opts) {
  const config = await loadConfig(opts)
  const commands = await loadCommands()

  const defaultRequestOpts = {}
  const accessToken = config.get('access_token')
  if (accessToken) {
    defaultRequestOpts['headers'] = {
      'User-Agent': config.get('ua'),
      Authorization: `Bearer ${accessToken}`
    }
  }
  const baseUrl = config.get('base_url')
  if (baseUrl) {
    defaultRequestOpts['baseUrl'] = baseUrl
  }

  const engine = {
    request: afterRequest(util.promisify(request.defaults(defaultRequestOpts))),
    config,
    cli: Object.keys(commands).reduce((obj, k) => {
      obj[k] = (...args) => commands[k].cli(engine, ...args)
      return obj
    }, {})
  }

  return engine
}
