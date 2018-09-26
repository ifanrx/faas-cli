import pkg from '../package.json'
import loadConfig from './config'
import loadPlugins from './plugins'

let engine

export default (opts = {}) =>
  new Promise((resolve, reject) => {
    if (engine) {
      return resolve(engine)
    }
    Promise.all([loadConfig(opts), loadPlugins()])
      .then(([config, plugins]) => {
        engine = {
          version: pkg.version,
          name: pkg.name,
          config,
          cli: {}
        }

        Object.keys(plugins).forEach(k => {
          if (plugins[k].cli) {
            engine.cli[k] = (...args) => {
              return plugins[k].cli(engine, ...args)
            }
          }
        })
        resolve(engine)
      })
      .catch(reject)
  })
