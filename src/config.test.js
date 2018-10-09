import loadConfig from './config'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

describe('config', () => {
  it('should create empty rc file', async () => {
    const opts = {
      argv: ['', ''],
      env: {},
      prefix: 'config',
      oshome: __dirname
    }

    await loadConfig(opts)
    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)

    expect(fs.existsSync(iniFile)).toBe(true)

    // cleanup
    rimraf.sync(iniFile)
  })

  it('should get json from rc file', async () => {
    const opts = {
      argv: ['', ''],
      env: {},
      prefix: 'config',
      oshome: __dirname
    }

    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    fs.writeFileSync(iniFile, 'json=false')

    const config = await loadConfig(opts)

    expect(config.get('json')).toBe(false)

    // cleanup
    rimraf.sync(iniFile)
  })

  it('should get env', async () => {
    const opts = {
      argv: ['', ''],
      env: {
        config_cmd: 'cmd'
      },
      prefix: 'config',
      oshome: __dirname
    }

    const config = await loadConfig(opts)
    expect(config.get('cmd')).toBe('cmd')

    // cleanup
    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    rimraf.sync(iniFile)
  })

  it('should get json=true when argv with --json', async () => {
    const opts = {
      argv: ['', '', '--json'],
      env: {},
      prefix: 'config',
      oshome: __dirname
    }

    const config = await loadConfig(opts)

    expect(config.get('json')).toBe(true)

    // cleanup
    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    rimraf.sync(iniFile)
  })

  it('should get cmd and params', async () => {
    const opts = {
      argv: ['', '', 'cmd', 'param1', 'param2'],
      env: {},
      prefix: 'config',
      oshome: __dirname
    }

    const config = await loadConfig(opts)

    expect(config.get('cmd')).toBe('cmd')
    expect(config.get('params')).toEqual(['param1', 'param2'])

    // cleanup
    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    rimraf.sync(iniFile)
  })

  it('should get json=true when argv with --json and rc file with json=false', async () => {
    const opts = {
      argv: ['', '', '--json'],
      env: {},
      prefix: 'config',
      oshome: __dirname
    }

    const iniFile = path.join(opts.oshome, `.${opts.prefix}rc`)
    fs.writeFileSync(iniFile, 'json=false')

    const config = await loadConfig(opts)

    expect(config.get('json')).toBe(true)

    // cleanup
    rimraf.sync(iniFile)
  })
})
