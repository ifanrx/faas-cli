import log from 'npmlog'
import pkg from '../package.json'

function addError (type) {
  return (...args) => {
    const err = new Error(args.join('\n'))
    err.type = type
    return err
  }
}

const handlers = {
  EUSAGE: [
    err => {
      if (err.message) {
        err.message.split('\n').forEach(msg => {
          log.warn('', msg)
        })
        log.warn('')
      }
    },
    'usageError'
  ],
  EAUTH: [
    err => {
      if (err.message) {
        if (err.message) {
          err.message.split('\n').forEach(msg => {
            log.notice('', msg)
          })
          log.notice('')
        }
      }
    },
    'authError'
  ]
}

// exports all errors
Object.keys(handlers).forEach(key => {
  exports[handlers[key][1]] = addError(key)
})

exports.errorHandler = function errorHandler (err) {
  if (!err) {
    process.exit(1)
  }

  if (handlers[err.type]) {
    handlers[err.type][0](err)
    process.exit(1)
  }

  err.message && log.error(err.message)

  if (err.stack) {
    log.error('', err.stack)
    log.error('', '')
    log.error('', '')
    log.error('', pkg.name + ':', pkg.version, 'node:', process.version)
    log.error('', '请复制此日志创建一个问题 ' + pkg.bugs.url)
    log.error('')
  }
  process.exit(1)
}

exports.ensureAuth = cli => async (engine, ...args) => {
  if (!engine.config.get('access_token')) throw exports.authError('请先登录')
  return cli(engine, ...args)
}

exports.afterRequest = request => async (...args) => {
  const response = await request(...args)

  if (response.statusCode === 401) {
    throw exports.authError('登录凭证已过期，请重新登录。')
  }

  if (response.statusCode === 403) {
    throw exports.authError('权限不足。')
  }

  if (response.statusCode === 404) {
    throw exports.usageError('不存在。')
  }

  if ([200, 201, 202, 204].indexOf(response.statusCode) === -1) {
    let message = response.body
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message)
      } catch (err) {
        message = ''
      }
    }

    if (typeof message === 'object') {
      message = JSON.stringify(message)
    }

    throw exports.usageError(response.statusCode, message)
  }

  return response
}

exports.formatByte = byte => {
  const divisor = 1024
  const unit = ['Byte', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (Math.floor(byte / divisor) > 1) {
    i++
    byte = byte / divisor
  }
  return byte.toFixed(2) + unit[i]
}
