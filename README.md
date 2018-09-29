# ifxc [![Build Status](https://travis-ci.org/ifanrx/faas-cli.svg?branch=master)](https://travis-ci.org/ifanrx/faas-cli)

这是一个用于[知晓云函数](https://doc.minapp.com/cloud-function/)的命令行工具。

## 快速开始

1. 安装运行时 [node.js](https://nodejs.org/)
2. 安装本命令行工具

   通过 npm 安装：

   ```
   $ npm install -g  ifxc
   ```

   通过 yarn 安装：

   ```
   $ yarn global add ifxc
   ```

3. 调用

   ```
   $ ifxc
   用法：
    ifxc <command>

   支持的 command 有：
      delete, deploy, invoke, list, login, logout, new

   - ifxc: v1.1.0
   - node: v8.10.0
   ```

## 命令的使用

通用的 flag：

-j, --json         调用命令成功后，以 json 格式返回结果

### 删除知晓云函数

谨慎操作，此操作会将服务器上的云函数删除。

```
$ ifxc delete <funciton_name>
```

* function_name 函数名称，必填，已存在的云函数

### 部署知晓云函数

谨慎操作，此操作会将本地云函数代码部署到服务，如果服务器已经同名云函数，将覆盖。

```
$ ifxc deploy <function_name> [function_root_folder] [-m remark]
```

* function_name 函数名，必填，云函数名称
* function_root_folder 存放云函数代码的本地目录，选填，默认是当前目录，相对路径
* remark 备注，选填，默认空字符串

### 调用知晓云函数

```
$ ifxc invoke <funciton_name>
```

* function_name 函数名，必填，已存在的云函数

### 列出知晓云函数

```
$ ifxc list
```

### 登录

```
$ ifxc login <client_id> <client_secret>
```
### 注销

```
$ ifxc logout
```

### 本地创建一个云函数文件

```
$ ifxc new <function_name> [function_root_folder]
```

* function_name 函数名，必填，云函数名称
* function_root_folder 存放云函数代码的本地目录，选填，默认是当前目录，相对路径
