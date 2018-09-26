import cc from 'config-chain'
import { usageError } from './error'
import pkg from '../package.json'

let cfg

export default function load (nopts) {
  return new Promise((resolve, reject) => {
    if (cfg) resolve(cfg)
    cfg = cc(nopts)
      .addFile(nopts[`${pkg.name}rc`], 'ini', 'config')
      .on('load', () => {
        resolve(cfg)
      })
      .on('error', reject)
  })
}

export function set (key, value) {
  return new Promise((resolve, reject) => {
    if (!key && !value) {
      return reject(usageError('key, value 必填'))
    }

    cfg.set(key, value, 'config')
    cfg.on('save', () => {
      resolve(cfg)
    })
    cfg.on('error', reject)
    cfg.save('config')
  })
}

export function get (key) {
  return new Promise(resolve => {
    const data = cfg.sources.config.data

    if (cfg.get('json') && !key) {
      return resolve(data)
    }

    if (cfg.get('json') && key) {
      return resolve({ [key]: data[key] })
    }

    if (key) {
      return resolve(cfg.sources.config.data[key])
    }

    return data
  })
}
