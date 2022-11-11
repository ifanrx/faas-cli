# mincloud [![Build Status](https://travis-ci.org/ifanrx/faas-cli.svg?branch=master)](https://travis-ci.org/ifanrx/faas-cli)

这是一个用于知晓云[云函数](https://doc.minapp.com/cloud-function/)的命令行工具。

## 快速开始

1. 安装运行时 [node.js](https://nodejs.org/)
2. 安装本命令行工具

   通过 npm 安装：

   ```
   $ npm install -g mincloud
   ```

   通过 yarn 安装：

   ```
   $ yarn global add mincloud
   ```

3. 调用

   ```
   $ mincloud
   用法：
    mincloud <command>

   支持的 command 有：
      delete, deploy, invoke, list, login, logout, new

   - mincloud: v1.1.0
   - node: v8.10.0
   ```

## 命令的使用

flag        | 说明
------------|-------------------------------------
-j, --json  | 调用命令成功后，以 json 格式返回结果
-e, --env | 可选，表示在指定的环境中执行命令

在知晓云[设置页面](https://cloud.minapp.com/dashboard/#/app/settings/app/)，选择环境，并查看环境 ID。

### 删除云函数

必须先登录，请参考 `mincloud login`。谨慎操作，此操作会将服务器上的云函数删除。

```
$ mincloud delete <funciton_name>
```

参数          | 必填  | 默认值 |  说明
--------------|-------|--------|-----------------
function_name | 是    | 无     | 已经存在的云函数

### 部署云函数

必须先登录，请参考 `mincloud login`。

```
$ mincloud deploy <function_name> [cloud_function_root] [-m remark]
```

参数                | 必填  | 默认值        |  说明
--------------------|-------|---------------|--------------------------------------------------------------------------
function_name       | 是    | 无            | 云函数名，指定的是 `<funciton_name>.js` 或者 `<function_name>/index.js`
cloud_function_root | 否    | 当前目录 `./` | 用于存放云函数代码的本地目录

flag          | 说明
--------------|------------------------------------
-m, --message | 备注信息

### 调用云函数

必须先登录，请参考 `mincloud login`。

```
$ mincloud invoke <funciton_name> [data]
```

参数          | 必填  | 默认值      |  说明
--------------|-------|-------------|-----------------
function_name | 是    | 无          | 已经存在的云函数
data          | 否    | 空对象 `{}` | JSON 数据

### 列出云函数

必须先登录，请参考 `mincloud login`。

```
$ mincloud list
```

### 登录

使用知晓云[客户端凭证](https://cloud.minapp.com/dashboard/#/app/settings/app/)登录，令牌将保存在本地文件 `.mincloudrc` 中；若过期，请重新登录。

查找令牌的步骤：
1. 在当前工作目录的 `.mincloudrc` 中查找 `client_id`；若找不到，则在用户根目录的 `.mincloudrc` 中查找。
2. 通过找到的 `client_id` 到用户根目录的 `.mincloudrc` 中查找客户端登录凭证。

```
$ mincloud login <client_id> <client_secret>
```

参数          | 必填  | 默认值 |  说明
--------------|-------|--------|-----------------------
client_id     | 是    | 无     | 知晓云的客户端 ID
client_secret | 是    | 无     | 知晓云的客户端密钥

flag          | 说明
--------------|------------------------------------
-l, --local   | 在当前工作目录保存 client_id

### 注销

```
$ mincloud logout
```

### 本地创建一个云函数文件

必须先登录，请参考 `mincloud login`。

此命令将在服务器上创建一个简单的云函数，本地创建云函数代码，
文件夹即函数名，入口文件即 `<function_name>/index.js`。

```
$ mincloud new <function_name> [cloud_function_root] [-m remark]
```

参数                | 必填  | 默认值        |  说明
--------------------|-------|---------------|--------------------------------------------------------------------------
function_name       | 是    | 无            | 云函数名
cloud_function_root | 否    | 当前目录 `./` | 用于存放云函数代码的本地目录

flag          | 说明
--------------|------------------------------------
-m, --message | 备注信息

### 从服务器上拉取一个已存在的云函数代码到本地

必须先登录，请参考 `mincloud login`。

请谨慎操作，如果本地有此代码文件，将会覆盖。

```
$ mincloud pull <function_name> [cloud_function_root]
```

参数                | 必填  | 默认值        |  说明
--------------------|-------|---------------|--------------------------------------------------------------------------
function_name       | 是    | 无            | 云函数名
cloud_function_root | 否    | 当前目录 `./` | 用于存放云函数代码的本地目录

### 运营后台部署

必须先登录，请参考 `mincloud login`。

该命令可将本地前端项目部署到运营后台。

```
$ mincloud dashboard-deploy <file_path>
```

参数                | 必填  | 默认值        |  说明
--------------------|-------|---------------|--------------------------------------------------------------------------
file_path           | 是    | 无            | 文件路径，可以是一个目录，或者是一个 zip 文件。如果是 zip 文件，则注意压缩时需把项目根路径压缩，而不是把项目目录文件夹压缩。
