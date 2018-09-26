import log from 'npmlog'
import pkg from '../package.json'

export function errorHandler (err) {
  if (!err) {
    process.exit(1)
  }

  if (err.type === 'EUSAGE') {
    if (err.message) {
      log.error(err.message)
      console.log('')
    }
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

export function usageError (...args) {
  const err = new Error(args.join('\n'))
  err.type = 'EUSAGE'
  return err
}
