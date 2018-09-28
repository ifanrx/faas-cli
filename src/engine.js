import request from 'request'
import util from 'util'

import loadConfig from './config'
import loadPlugins from './plugins'
import { afterRequest } from './utils'

export default async function engine (opts) {
  const config = await loadConfig(opts)
  const plugins = await loadPlugins()

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
    cli: Object.keys(plugins).reduce((obj, k) => {
      obj[k] = (...args) => plugins[k].cli(engine, ...args)
      return obj
    }, {})
  }

  return engine
}
