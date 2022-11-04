import path from 'path'
import fs from 'fs'
import request from 'request'
import archiver from 'archiver'
import rimraf from 'rimraf'

import { usageError, ensureAuth } from '../utils'

const OPERATION_TYPE = {
  UPLOAD: 'upload'
}

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

const deployDashboard = (engine, url) => {
  return engine.request({
    uri: '/oserve/v2.6/miniapp/custom-userdash/',
    method: 'POST',
    json: {
      repository_path: url,
      url_refresh: 'true'
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

export const cli = ensureAuth(async (engine, operationType, filePath) => {
  if (!operationType || !filePath) {
    throw usageError(
      '缺少必填字段 <operation_type> 和 <file_path>',
      '',
      '用法：',
      `    ${engine.config.get(
        'prefix'
      )} dashboard <operation_type> <file_path>`
    )
  }

  if (operationType !== OPERATION_TYPE.UPLOAD) {
    throw usageError(
      '无效的 <operation_type>',
      '',
      '目前支持的类型为：',
      Object.values(OPERATION_TYPE).join(', ')
    )
  }

  const targetFile = path.resolve('./', filePath)

  if (!fs.existsSync(targetFile)) {
    throw usageError('文件不存在')
  }

  const isDirectory = fs.lstatSync(targetFile).isDirectory()

  console.log('isDirectory', fs.lstatSync(targetFile).isDirectory())

  if (!isDirectory && !targetFile.endsWith('.zip')) {
    throw usageError('请提供 .zip 后缀的压缩包文件')
  }

  let zippedFile
  if (isDirectory) {
    zippedFile = await zipDir(targetFile)
  }

  const url = await upload(engine, isDirectory ? zippedFile : targetFile)

  await deployDashboard(engine, url)

  if (zippedFile) {
    rimraf(zippedFile, err => {
      if (err) throw err
    })
  }

  return 'ok'
})
