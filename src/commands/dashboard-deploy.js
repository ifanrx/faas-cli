import path from 'path'
import fs from 'fs'
import request from 'request'
import archiver from 'archiver'
import rimraf from 'rimraf'

import { usageError, ensureAuth } from '../utils'

const getUploadCredentials = engine => {
  return engine.request({
    uri: '/oserve/v2.1/upload/',
    method: 'POST',
    json: {
      filename: 'output.zip'
    }
  })
}

const upload = async (engine, filePath) => {
  const { body: credentials } = await getUploadCredentials(engine)

  const opt = {
    uri: credentials.upload_url,
    method: 'POST',
    formData: {
      authorization: credentials.authorization,
      policy: credentials.policy,
      file: fs.createReadStream(filePath)
    }
  }

  return new Promise(resolve => {
    request(opt, err => {
      if (err) throw err

      resolve(credentials.path)
    })
  })
}

const deployDashboard = (engine, url, refresh) => {
  return engine.request({
    uri: '/oserve/v2.6/miniapp/custom-userdash/',
    method: 'POST',
    json: {
      repository_path: url,
      url_refresh: refresh == null ? false : refresh
    }
  })
}

/**
 * 打包文件夹
 * @param {*} dirPath 文件夹路径
 */
const zipDir = dirPath => {
  return new Promise(resolve => {
    const outputPath = path.resolve('./', './output.zip')
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.on('error', err => {
      throw err
    })

    archive.pipe(output)
    archive.directory(dirPath, false)
    archive.finalize().then(() => resolve(outputPath))
  })
}

export const cli = ensureAuth(async (engine, filePath) => {
  if (!filePath) {
    throw usageError(
      '缺少必填字段 <file_path>',
      '',
      '用法：',
      `    ${engine.config.get('prefix')} dashboard-deploy <file_path>`
    )
  }

  const targetFile = path.resolve('./', filePath)

  if (!fs.existsSync(targetFile)) {
    throw usageError('文件不存在')
  }

  const isDirectory = fs.lstatSync(targetFile).isDirectory()

  if (!isDirectory && !targetFile.endsWith('.zip')) {
    throw usageError('请提供 .zip 后缀的压缩包文件')
  }

  const refresh = engine.config.get('refresh')

  let zippedFile
  if (isDirectory) {
    zippedFile = await zipDir(targetFile)
  }

  const url = await upload(engine, isDirectory ? zippedFile : targetFile)

  await deployDashboard(engine, url, refresh)

  if (zippedFile) {
    rimraf(zippedFile, err => {
      if (err) throw err
    })
  }

  console.log('上传完毕')

  return 'ok'
})
