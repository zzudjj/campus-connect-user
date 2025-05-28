# Campus Connect API 文档

## 目录

- [1. 概述](#1-概述)
- [2. 通用响应格式](#2-通用响应格式)
- [3. 用户模块](#3-用户模块)
  - [3.1 用户注册](#31-用户注册)
  - [3.2 用户登录](#32-用户登录)
  - [3.3 更新用户信息](#33-更新用户信息)
  - [3.4 获取用户个人资料](#34-获取用户个人资料)
  - [3.5 获取用户公开资料](#35-获取用户公开资料)
  - [3.6 发送注册验证码](#36-发送注册验证码)
  - [3.7 批量获取用户简要信息](#37-批量获取用户简要信息)
  - [3.8 获取所有用户简要信息](#38-获取所有用户简要信息)
- [4. 密码重置模块](#4-密码重置模块)
  - [4.1 请求密码重置验证码](#41-请求密码重置验证码)
  - [4.2 验证邮箱验证码](#42-验证邮箱验证码)
  - [4.3 重置密码](#43-重置密码)
- [5. 图片验证码模块](#5-图片验证码模块)
  - [5.1 生成图片验证码](#51-生成图片验证码)
  - [5.2 验证图片验证码](#52-验证图片验证码)
- [6. 文件上传](#6-文件上传)
  - [6.1 上传图片/视频](#61-上传图片视频)
- [7. 动态模块](#7-动态模块)
  - [7.1 获取所有动态](#71-获取所有动态)
  - [7.2 获取热门动态](#72-获取热门动态)
  - [7.3 获取最新动态](#73-获取最新动态)
  - [7.4 获取当前用户动态](#74-获取当前用户动态)
  - [7.5 获取指定用户动态](#75-获取指定用户动态)
  - [7.6 发布动态](#76-发布动态)
  - [7.7 上传动态媒体文件](#77-上传动态媒体文件)
  - [7.8 获取动态媒体文件](#78-获取动态媒体文件)
- [8. 标签模块](#8-标签模块)
  - [8.1 获取所有标签](#81-获取所有标签)
  - [8.2 创建标签](#82-创建标签)
  - [8.3 添加标签到动态](#83-添加标签到动态)
- [9. 评论模块](#9-评论模块)
  - [9.1 发表评论](#91-发表评论)
  - [9.2 获取动态评论列表](#92-获取动态评论列表)
  - [9.3 获取评论回复列表](#93-获取评论回复列表)
  - [9.4 删除评论](#94-删除评论)
  - [9.5 获取评论数量](#95-获取评论数量)
  - [9.6 批量获取评论数量](#96-批量获取评论数量)
  - [9.7 获取根评论下所有回复](#97-获取根评论下所有回复)
- [10. 点赞模块](#10-点赞模块)
  - [10.1 添加点赞](#101-添加点赞)
  - [10.2 取消点赞](#102-取消点赞)
  - [10.3 切换点赞状态](#103-切换点赞状态)
  - [10.4 获取点赞状态](#104-获取点赞状态)
  - [10.5 获取点赞数](#105-获取点赞数)
  - [10.6 获取用户点赞列表](#106-获取用户点赞列表)
- [11. 好友模块](#11-好友模块)
  - [11.1 发送好友请求](#111-发送好友请求)
  - [11.2 接受好友请求](#112-接受好友请求)
  - [11.3 拒绝好友请求](#113-拒绝好友请求)
  - [11.4 获取收到的好友请求](#114-获取收到的好友请求)
  - [11.5 获取发送的好友请求](#115-获取发送的好友请求)
  - [11.6 获取待处理的好友请求数量](#116-获取待处理的好友请求数量)
  - [11.7 获取好友列表](#117-获取好友列表)
  - [11.8 删除好友](#118-删除好友)
- [12. 聊天模块](#12-聊天模块)
  - [12.1 发送消息](#121-发送消息)
  - [12.2 获取聊天历史](#122-获取聊天历史)
  - [12.3 分页获取聊天历史](#123-分页获取聊天历史)
  - [12.4 获取会话列表](#124-获取会话列表)
  - [12.5 标记消息为已读](#125-标记消息为已读)
  - [12.6 标记所有消息为已读](#126-标记所有消息为已读)
  - [12.7 获取未读消息数量](#127-获取未读消息数量)
  - [12.8 获取未读消息详情](#128-获取未读消息详情)
  - [12.9 删除消息](#129-删除消息)
  - [12.10 检查用户在线状态](#1210-检查用户在线状态)
  - [11.9 检查好友关系](#119-检查好友关系)
- [12. 即时通信模块](#12-即时通信模块)
  - [12.1 发送消息](#121-发送消息)
  - [12.2 获取聊天历史](#122-获取聊天历史)
  - [12.3 分页获取聊天历史](#123-分页获取聊天历史)
  - [12.4 获取会话列表](#124-获取会话列表)
  - [12.5 标记消息为已读](#125-标记消息为已读)
  - [12.6 标记所有消息为已读](#126-标记所有消息为已读)
  - [12.7 获取未读消息数量](#127-获取未读消息数量)
  - [12.8 获取未读消息详情](#128-获取未读消息详情)
  - [12.9 删除消息](#129-删除消息)
  - [12.10 检查用户在线状态](#1210-检查用户在线状态)
  - [12.11 WebSocket连接](#1211-websocket连接)
- [13. 数据模型](#13-数据模型)
  - [13.1 用户模型](#131-用户模型)
  - [13.2 消息模型](#132-消息模型)

## 1. 概述

Campus Connect API 是一个面向校园社交平台的RESTful API接口。所有API都返回JSON格式数据，并采用标准HTTP状态码表示请求结果。

- 基础URL: `http://localhost:8080`
- 认证方式: JWT令牌，在请求头中以`token`字段传递

## 2. 通用响应格式

所有API返回统一的JSON格式:

```json
{
  "code": 200,          // 状态码，200表示成功，其他表示失败
  "message": "success", // 响应消息
  "data": {}            // 响应数据，可能是对象、数组或null
}
```

### 常见状态码

| 状态码 | 描述 |
| ------ | ---- |
| 200    | 请求成功 |
| 400    | 请求参数错误 |
| 401    | 未认证，需要登录 |
| 403    | 权限不足 |
| 404    | 资源不存在 |
| 500    | 服务器内部错误 |

## 3. 用户模块

### 3.1 用户注册

注册新用户账号。注册需要先获取邮箱验证码。

**请求URL**: `/user/register`

**请求方式**: `POST`

**请求参数**:

请求包含两个实体：User对象和VerifyCodeRequest对象

**User对象参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱（唯一） |
| passwordHash | String | 是 | 用户密码(这里前端填明文密码即可) |
| nickname | String | 是 | 用户昵称（唯一） |
| avatarUrl | String | 否 | 用户头像URL |
| department | String | 否 | 所属院系 |
| school | String | 否 | 所属学校 |
| beforeCardUrl | String | 否 | 校园卡正面照片URL |
| afterCardUrl | String | 否 | 校园卡反面照片URL |

**VerifyCodeRequest对象参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |
| code | String | 是 | 邮箱验证码 |

**请求示例**:

```json
// 注意：这里包含两个实体对象，在实际请求中需要根据前端框架正确处理多实体参数
{
  "user": {
    "email": "example@university.edu",
    "nickname": "Campus_User",
    "passwordHash": "yourpasswordhash"
  },
  "request": {
    "email": "example@university.edu",
    "code": "123456"
  }
}
```

这里的四个注册字段：学校、院系、校园卡正面照片URL和反面照片URL在注册页面是不必渲染的，因为根据业务逻辑，后面应该有一个专门的认证页面来上传校园卡的这两张图片，并且等到管理员审核通过之后，服务器端会自动识别并填写学校和院系这两个字段。

注册前需要先使用 `/user/sendCode` 接口获取邮箱验证码。

**响应示例**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

**错误返回**:

```json
{
  "code": 400,
  "message": "验证码错误或已过期",
  "data": null
}
```

### 3.2 用户登录

用户登录获取认证令牌。

**请求URL**: `/user/login`

**请求方式**: `POST`

**请求头**:
- `Content-Type`: `application/json`

**请求参数** (@RequestBody):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |
| passwordHash | String | 是 | 密码 |

**请求示例**:

```json
{
  "email": "example@university.edu",
  "passwordHash": "password123"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "email": "example@university.edu",
      "nickname": "Campus_User",
      "avatarUrl": "https://example.com/avatar.jpg",
      "authStatus": 0,
      "accountStatus": 0,
      "department": "计算机科学与技术",
      "school": "某大学",
      "createTime": "2025-05-20T10:00:00",
      "updateTime": "2025-05-20T10:00:00"
    }
  }
}
```

### 3.3 更新用户信息

更新当前登录用户的个人信息。

**请求URL**: `/user/update`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| userId | Integer | 是 | 用户ID |
| nickname | String | 否 | 用户昵称 |
| avatarUrl | String | 否 | 用户头像URL |
| department | String | 否 | 所属院系 |
| school | String | 否 | 所属学校 |
| beforeCardUrl | String | 否 | 校园卡正面照片URL |
| afterCardUrl | String | 否 | 校园卡反面照片URL |

**请求示例**:

```json
{
  "userId": 1,
  "nickname": "New_Nickname",
  "department": "电子工程学院"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null
}
```

### 3.4 获取用户个人资料

获取当前登录用户的个人资料。

**请求URL**: `/user/profile`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "email": "example@university.edu",
    "nickname": "Campus_User",
    "avatarUrl": "https://example.com/avatar.jpg",
    "authStatus": 0,
    "accountStatus": 0,
    "department": "计算机科学与技术",
    "school": "某大学",
    "createTime": "2025-05-20T10:00:00",
    "updateTime": "2025-05-20T10:00:00"
  }
}
```

### 3.5 获取用户公开资料

获取指定用户的公开资料，不需要登录即可访问。

**请求URL**: `/user/publicProfile`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| userId | Integer | 是 | 要查询的用户ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "nickname": "Campus_User",
    "avatarUrl": "https://example.com/avatar.jpg",
    "department": "计算机科学与技术系",
    "school": "某大学",
    "authStatus": 1,
    "accountStatus": 0,
    "createdAt": "2025-05-01T10:00:00"
  }
}
```

### 3.6 发送注册验证码

发送邮箱验证码。

**请求URL**: `/user/sendCode`

**请求方式**: `POST`

**请求头**:
- `Content-Type`: `application/json`

**请求参数** (@RequestBody):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |

**请求示例**:

```json
{
  "email": "example@university.edu"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "验证码已发送到您的邮箱",
  "data": null
}
```

### 3.7 批量获取用户简要信息

根据用户ID数组批量获取用户的简要信息（头像、昵称、认证状态）。

**请求URL**: `/user/batchUserInfo`

**请求方式**: `POST`

**请求头**:
- `Content-Type`: `application/json`

**请求体** (@RequestBody):

```json
[1, 2, 3, 4]
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "1": {
      "nickname": "张三",
      "avatarUrl": "https://example.com/avatar/1.jpg",
      "authStatus": 1
    },
    "2": {
      "nickname": "李四",
      "avatarUrl": "https://example.com/avatar/2.jpg",
      "authStatus": 0
    },
    "3": {
      "nickname": "王五",
      "avatarUrl": "https://example.com/avatar/3.jpg",
      "authStatus": 1
    }
  }
}
```

### 3.8 获取所有用户简要信息

获取系统中所有用户的简要信息列表，包括用户ID、昵称、头像URL、认证状态等。

**请求URL**: `/user/allUsersInfo`

**请求方式**: `GET`

**请求头**:
- `token`: `{token值}` (需要登录验证)

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "userId": 1,
      "nickname": "张三",
      "avatarUrl": "https://example.com/avatar/1.jpg",
      "authStatus": 1,
      "department": "计算机科学与技术",
      "school": "某大学"
    },
    {
      "userId": 2,
      "nickname": "李四",
      "avatarUrl": "https://example.com/avatar/2.jpg",
      "authStatus": 0,
      "department": "软件工程",
      "school": "某大学"
    },
    {
      "userId": 3,
      "nickname": "王五",
      "avatarUrl": "https://example.com/avatar/3.jpg",
      "authStatus": 1,
      "department": "人工智能",
      "school": "某大学"
    }
  ]
}
```

## 4. 密码重置模块

### 4.1 请求密码重置验证码

向用户邮箱发送密码重置验证码。

**请求URL**: `/password/forgot`

**请求方式**: `POST`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |

**请求示例**:

```json
{
  "email": "example@university.edu"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "验证码已发送到您的邮箱",
  "data": null
}
```

### 4.2 验证邮箱验证码

验证用户提交的邮箱验证码是否有效。

**请求URL**: `/password/verify`

**请求方式**: `POST`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |
| code | String | 是 | 验证码 |

**请求示例**:

```json
{
  "email": "example@university.edu",
  "code": "123456"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "验证码正确",
  "data": null
}
```

### 4.3 重置密码

使用验证码重置用户密码。

**请求URL**: `/password/reset`

**请求方式**: `POST`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| email | String | 是 | 用户邮箱 |
| code | String | 是 | 验证码 |
| newPassword | String | 是 | 新密码 |

**请求示例**:

```json
{
  "email": "example@university.edu",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

## 5. 图片验证码模块

### 5.1 生成图片验证码

生成图片验证码，返回验证码ID和图片Base64编码。

**请求URL**: `/captcha/generate`

**请求方式**: `GET`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "captchaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "captchaImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...(省略部分内容)"
  }
}
```

### 5.2 验证图片验证码

验证用户输入的图片验证码。

**请求URL**: `/captcha/verify`

**请求方式**: `POST`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| captchaId | String | 是 | 验证码ID |
| code | String | 是 | 用户输入的验证码 |

**请求示例**:

```json
{
  "captchaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "ABC123"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "验证成功",
  "data": null
}
```

## 6. 文件上传

### 6.1 上传图片/视频

上传图片或视频文件。

**请求URL**: `/upload`

**请求方式**: `POST`

**Content-Type**: `multipart/form-data`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| file | File | 是 | 要上传的文件 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": "https://example-cos.com/path/to/file.jpg"
}
```

## 7. 动态模块

### 7.1 获取所有动态

获取所有动态列表。

**请求URL**: `/post/all`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（可选，未登录用户也可访问）

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "postId": 1,
      "userId": 101,
      "content": "这是一条动态内容",
      "hotScore": 85.6,
      "likeNum": 42,
      "commentNum": 18,
      "viewNum": 356,
      "visibility": 0,
      "createdAt": "2025-05-20T14:30:45",
      "updatedAt": "2025-05-20T14:30:45"
    },
    // 更多动态...
  ]
}
```

### 7.2 获取热门动态

获取热门动态列表，按热度排序。

**请求URL**: `/post/hot`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（可选，未登录用户也可访问）

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| start | Integer | 否 | 起始位置，默认为0 |
| PostNum | Integer | 否 | 获取条数，默认为15 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [1, 5, 12, 8, 24]  // 返回热门动态的ID列表
}
```

### 7.3 获取最新动态

获取最新动态列表，按发布时间排序。

**请求URL**: `/post/new`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（可选，未登录用户也可访问）

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| start | Integer | 否 | 起始位置，默认为0 |
| PostNum | Integer | 否 | 获取条数，默认为15 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [30, 29, 28, 27, 26]  // 返回最新动态的ID列表
}
```

### 7.4 获取当前用户动态

获取当前登录用户发布的所有动态，按发布时间降序排序。

**请求URL**: `/post/myPosts`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（必需）

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "postId": 42,
      "userId": 10001,
      "content": "这是我的动态！",
      "visibility": 0,
      "createdAt": "2023-06-15T14:30:00",
      "updatedAt": "2023-06-15T14:30:00"
    },
    {
      "postId": 36,
      "userId": 10001,
      "content": "另一条动态内容",
      "visibility": 0,
      "createdAt": "2023-06-10T09:15:00",
      "updatedAt": "2023-06-10T09:15:00"
    }
  ]
}
```

**错误响应**:

```json
{
  "code": 401,
  "message": "用户未登录",
  "data": null
}
```

### 7.5 获取指定用户动态

获取指定用户发布的所有动态，按发布时间降序排序。

**请求URL**: `/post/userPosts`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（可选，未登录用户也可访问）

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| userId | Integer | 是 | 要查询的用户ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "postId": 42,
      "userId": 10002,
      "content": "这是用户的动态",
      "visibility": 0,
      "createdAt": "2023-06-15T14:30:00",
      "updatedAt": "2023-06-15T14:30:00"
    },
    {
      "postId": 36,
      "userId": 10002,
      "content": "另一条动态",
      "visibility": 0,
      "createdAt": "2023-06-10T09:15:00",
      "updatedAt": "2023-06-10T09:15:00"
    }
  ]
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "用户ID不能为空",
  "data": null
}
```

### 7.6 发布动态

发布新动态。

**请求URL**: `/post/create`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| content | String | 是 | 动态内容 |
| visibility | Integer | 否 | 可见性(0:公开,1:好友可见,2:仅自己可见)，默认为0 |

**请求示例**:

```json
{
  "content": "这是我的第一条动态！",
  "visibility": 0
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": 42  // 返回新创建的动态ID
}
```

### 7.5 上传动态媒体文件

为动态上传媒体文件（图片/视频）。

**请求URL**: `/post/media/upload`

**请求方式**: `POST`

**Content-Type**: `multipart/form-data`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| file | File | 是 | 要上传的媒体文件 |
| postId | Integer | 是 | 关联的动态ID |
| mediaType | Integer | 是 | 媒体类型(0:图片,1:视频) |
| sortOrder | Integer | 否 | 排序顺序，默认为0 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": "https://example-cos.com/path/to/media.jpg"
}
```

**注意**：上传成功后返回的是媒体文件URL字符串。如需获取完整媒体信息（包括mediaId、backgroundUrl等），请使用 `/post/media/getPostMedia` 接口。

### 7.6 获取动态媒体文件

获取特定动态的媒体文件列表。

**请求URL**: `/post/media/getPostMedia`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌（可选，未登录用户也可访问）

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| postId | Integer | 是 | 动态ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "mediaId": 1,
      "postId": 101,
      "mediaUrl": "https://example-cos.com/path/to/image1.jpg",
      "mediaType": 0,
      "sortOrder": 0,
      "backgroundUrl": null,
      "createdAt": "2025-05-24T10:30:00"
    },
    {
      "mediaId": 2,
      "postId": 101,
      "mediaUrl": "https://example-cos.com/path/to/video1.mp4",
      "mediaType": 1,
      "sortOrder": 1,
      "backgroundUrl": "https://example-cos.com/path/to/video1_thumbnail.jpg",
      "createdAt": "2025-05-24T10:30:15"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| mediaId | Integer | 媒体ID |
| postId | Integer | 关联的动态ID |
| mediaUrl | String | 媒体文件URL |
| mediaType | Integer | 媒体类型(0:图片,1:视频) |
| sortOrder | Integer | 排序顺序 |
| backgroundUrl | String | 背景图URL，当mediaType=1(视频)时，此字段为视频缩略图URL |
| createdAt | String | 创建时间 |

## 8. 标签模块

### 8.1 获取所有标签

获取系统中的所有标签。

**请求URL**: `/tag/all`

**请求方式**: `GET`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "tagId": 1,
      "name": "校园活动",
      "createdAt": "2025-05-01T10:00:00"
    },
    {
      "tagId": 2,
      "name": "学习资料",
      "createdAt": "2025-05-01T10:05:00"
    },
    // 更多标签...
  ]
}
```

### 8.2 创建标签

创建新标签。

**请求URL**: `/tag/create`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| name | String | 是 | 标签名称 |

**请求示例**:

```json
{
  "name": "期末考试"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tagId": 10,
    "name": "期末考试",
    "createdAt": "2025-05-24T14:42:00"
  }
}
```

### 8.3 添加标签到动态

将标签关联到指定的动态。

**请求URL**: `/tag/addTagToPost`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| tagIds | List<Integer> | 是 | 要关联的标签ID列表 |
| postId | Integer | 是 | 动态ID |

**请求示例**:

```
/tag/addTagToPost?tagIds=1,2,3&postId=42
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": 42  // 返回动态ID
}
```

## 9. 评论模块

### 9.1 发表评论

发表评论或回复。当回复评论时，系统会自动计算根评论ID并更新相应根评论的回复数。

**请求URL**: `/comment/add`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| postId | Integer | 是 | 动态ID |
| content | String | 是 | 评论内容 |
| parentCommentId | BigInteger | 否 | 父评论ID，默认为-1（表示对动态的直接评论） |

**请求示例**:

```
/comment/add?postId=123&content=这是一条评论&parentCommentId=-1
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "commentId": "1234567890"
  }
}
```

### 9.2 获取动态评论列表

获取指定动态的一级评论列表。

**请求URL**: `/comment/list`

**请求方式**: `GET`

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| postId | Integer | 是 | 动态ID |

**请求示例**:

```
/comment/list?postId=123
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "commentId": "1234567890",
      "postId": 123,
      "userId": 456,
      "content": "这是一条评论",
      "parentCommentId": "-1",
      "rootCommentId": "-1",
      "likeNum": 5,
      "commentNum": 2,
      "createdAt": "2025-05-25T14:30:00",
      "updatedAt": "2025-05-25T14:30:00"
    },
    // 更多评论...
  ]
}
```

### 9.3 获取评论直接回复列表

获取指定评论的直接回复列表（只包含父评论是指定评论ID的回复）。

**请求URL**: `/comment/replies`

**请求方式**: `GET`

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| commentId | BigInteger | 是 | 评论ID |

**请求示例**:

```
/comment/replies?commentId=1234567890
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "commentId": "9876543210",
      "postId": 123,
      "userId": 789,
      "content": "这是一条回复",
      "parentCommentId": "1234567890",
      "rootCommentId": "1234567890",
      "likeNum": 1,
      "commentNum": 0,
      "createdAt": "2025-05-25T15:00:00",
      "updatedAt": "2025-05-25T15:00:00"
    },
    // 更多回复...
  ]
}
```

### 9.4 删除评论

删除自己发表的评论。

**请求URL**: `/comment/delete`

**请求方式**: `DELETE`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| commentId | BigInteger | 是 | 评论ID |

**请求示例**:

```
/comment/delete?commentId=1234567890
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 9.5 获取评论数量

获取指定实体（动态或评论）的评论数量。

**请求URL**: `/comment/count`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | Object | 是 | 目标实体ID |
| targetType | Integer | 是 | 目标类型：1-动态，2-评论 |

**请求示例**:

```
/comment/count?targetId=123&targetType=1
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 42
  }
}
```

### 9.6 批量获取评论数量

批量获取多个实体（动态或评论）的评论数量。

**请求URL**: `/comment/batchCount`

**请求方式**: `POST`

**请求头**:
- `Content-Type`: `application/json`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetIds | List<?> | 是 | 目标实体ID列表 (请求体) |
| targetType | Integer | 是 | 目标类型：1-动态，2-评论 (URL参数) |

**请求示例**:

```
/comment/batchCount?targetType=1
```

请求体:
```json
[1, 2, 3, 4, 5]
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "1": 5,
    "2": 10,
    "3": 0,
    "4": 3,
    "5": 8
  }
}
```

### 9.7 获取根评论下所有回复

获取指定根评论（一级评论）下的所有回复，包括直接回复和间接回复。所有以该评论为根评论的回复都会被返回，并且都计入该根评论的回复数。

**请求URL**: `/comment/allReplies`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| rootCommentId | BigInteger | 是 | 根评论ID（一级评论ID） |

**请求示例**:

```
/comment/allReplies?rootCommentId=1234567890
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "commentId": "9876543210",
      "postId": 123,
      "userId": 789,
      "content": "这是一条直接回复",
      "parentCommentId": "1234567890",
      "rootCommentId": "1234567890",
      "likeNum": 1,
      "commentNum": 2,
      "createdAt": "2025-05-25T15:00:00",
      "updatedAt": "2025-05-25T15:00:00"
    },
    {
      "commentId": "8765432109",
      "postId": 123,
      "userId": 456,
      "content": "这是一条间接回复",
      "parentCommentId": "9876543210",
      "rootCommentId": "1234567890",
      "likeNum": 0,
      "commentNum": 0,
      "createdAt": "2025-05-25T15:30:00",
      "updatedAt": "2025-05-25T15:30:00"
    }
  ]
}
```

## 10. 点赞模块

### 10.1 添加点赞

对动态或评论进行点赞。

**请求URL**: `/like/add`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | BigInteger | 是 | 目标ID |
| targetType | Integer | 是 | 目标类型(0:动态,1:评论) |

**请求示例**:

```
/like/add?targetId=123&targetType=0
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liked": true,
    "likeCount": 42
  }
}
```

### 10.2 取消点赞

取消对动态或评论的点赞。

**请求URL**: `/like/remove`

**请求方式**: `DELETE`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | BigInteger | 是 | 目标ID |
| targetType | Integer | 是 | 目标类型(0:动态,1:评论) |

**请求示例**:

```
/like/remove?targetId=123&targetType=0
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liked": false,
    "likeCount": 41
  }
}
```

### 10.3 切换点赞状态

切换点赞状态（点赞/取消点赞）。

**请求URL**: `/like/toggle`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | BigInteger | 是 | 目标ID |
| targetType | Integer | 是 | 目标类型(0:动态,1:评论) |

**请求示例**:

```
/like/toggle?targetId=123&targetType=0
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liked": true,
    "likeCount": 42
  }
}
```

### 10.4 获取点赞状态

获取当前用户对指定目标的点赞状态和总点赞数。

**请求URL**: `/like/status`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | BigInteger | 是 | 目标ID |
| targetType | Integer | 是 | 目标类型(0:动态,1:评论) |

**请求示例**:

```
/like/status?targetId=123&targetType=0
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liked": true,
    "likeCount": 42
  }
}
```

### 10.5 获取点赞数

获取指定目标的点赞数。

**请求URL**: `/like/count`

**请求方式**: `GET`

**请求参数** (@RequestParam):

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| targetId | BigInteger | 是 | 目标ID |
| targetType | Integer | 是 | 目标类型(0:动态,1:评论) |

**请求示例**:

```
/like/count?targetId=123&targetType=0
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "likeCount": 42
  }
}
```

### 10.6 获取用户点赞列表

获取当前用户的所有点赞记录。

**请求URL**: `/like/user`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求示例**:

```
/like/user
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "likeId": "1234567890",
      "userId": 123,
      "targetId": "456",
      "targetType": 0,
      "createdAt": "2025-05-25T14:30:00"
    },
    // 更多点赞记录...
  ]
}
```

## 11. 好友模块

### 11.1 发送好友请求

向指定用户发送好友请求。

**请求URL**: `/friend/request/send`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| recipientId | BigInteger | 是 | 接收者用户ID |
| message | String | 否 | 请求消息 |

**请求示例**:

```
/friend/request/send?recipientId=10002&message=你好，加个好友吧！
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": 12345  // 返回新创建的好友请求ID
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "已经是好友关系，无需再次发送请求",
  "data": null
}
```

### 11.2 接受好友请求

接受指定的好友请求，并建立好友关系。

**请求URL**: `/friend/request/accept`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| requestId | BigInteger | 是 | 好友请求ID |

**请求示例**:

```
/friend/request/accept?requestId=12345
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": "已成功添加好友"
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "好友请求已处理",
  "data": null
}
```

### 11.3 拒绝好友请求

拒绝指定的好友请求。

**请求URL**: `/friend/request/reject`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| requestId | BigInteger | 是 | 好友请求ID |

**请求示例**:

```
/friend/request/reject?requestId=12345
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": "已拒绝好友请求"
}
```

**错误响应**:

```json
{
  "code": 400,
  "message": "无权处理该好友请求",
  "data": null
}
```

### 11.4 获取收到的好友请求

获取当前登录用户收到的所有好友请求。

**请求URL**: `/friend/request/received`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "requestId": 12345,
      "requesterId": 10001,
      "recipientId": 10002,
      "message": "你好，加个好友吧！",
      "status": 0,
      "createdAt": "2025-05-25T14:30:00",
      "updatedAt": "2025-05-25T14:30:00",
      "requesterNickname": "张三",
      "requesterAvatarUrl": "http://example.com/avatar/user1.jpg"
    },
    // 更多好友请求...
  ]
}
```

### 11.5 获取发送的好友请求

获取当前登录用户发送的所有好友请求。

**请求URL**: `/friend/request/sent`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "requestId": 12346,
      "requesterId": 10002,
      "recipientId": 10003,
      "message": "我们一起学习吧！",
      "status": 0,
      "createdAt": "2025-05-24T10:15:00",
      "updatedAt": "2025-05-24T10:15:00"
    },
    // 更多好友请求...
  ]
}
```

### 11.6 获取待处理的好友请求数量

获取当前登录用户收到的待处理好友请求数量。

**请求URL**: `/friend/request/pending/count`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": 5  // 待处理的好友请求数量
}
```

### 11.7 获取好友列表

获取当前登录用户的好友列表。

**请求URL**: `/friend/list`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "friendshipId": 123,
      "userId1": 10001,
      "userId2": 10002,
      "status": 0,
      "createdAt": "2025-05-20T14:30:00",
      "nickname": "李四",
      "avatarUrl": "http://example.com/avatar/user2.jpg",
      "otherUserId": 10001
    },
    // 更多好友...
  ]
}
```

### 11.8 删除好友

删除当前登录用户与指定用户的好友关系。

**请求URL**: `/friend/delete`

**请求方式**: `POST`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| friendId | BigInteger | 是 | 要删除的好友ID |

**请求示例**:

```
/friend/delete?friendId=10001
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": "已删除好友"
}
```

### 11.9 检查好友关系

检查当前登录用户与指定用户是否是好友关系。

**请求URL**: `/friend/check`

**请求方式**: `GET`

**请求头**:
- `token`:  JWT令牌

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| userId | BigInteger | 是 | 要检查的用户ID |

**请求示例**:

```
/friend/check?userId=10003
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": true  // true表示是好友关系，false表示不是好友关系
}
```

## 12. 数据模型

### 12.1 用户模型

用户表(`user`)存储用户基本信息。

| 字段名 | 类型 | 必填 | 默认值 | 描述 |
| ------ | ---- | ---- | ------ | ---- |
| user_id | BIGINT | 自动生成 | 自增 | 用户ID，主键 |
| email | VARCHAR(25) | 是 | 无 | 用户邮箱，唯一 |
| password_hash | VARCHAR(128) | 是 | 无 | 密码哈希值 |
| nickname | VARCHAR(50) | 是 | 无 | 用户昵称，唯一 |
| avatar_url | VARCHAR(255) | 否 | NULL | 用户头像URL |
| auth_status | TINYINT | 否 | 0 | 认证状态(0:未认证,1:已认证,2:认证中) |
| account_status | TINYINT | 否 | 0 | 账号状态(0:正常,1:禁用) |
| department | VARCHAR(50) | 否 | NULL | 所属院系 |
| school | VARCHAR(20) | 否 | NULL | 所属学校 |
| before_card_url | VARCHAR(255) | 否 | NULL | 校园卡正面图片URL |
| after_card_url | VARCHAR(255) | 否 | NULL | 校园卡反面图片URL |
| created_at | DATETIME | 自动生成 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 自动生成 | CURRENT_TIMESTAMP | 更新时间 |

**注意事项**:

1. **必填字段**:
   - `email`: 用户邮箱，必须唯一
   - `password_hash`: 密码哈希，前端需要进行加密处理
   - `nickname`: 用户昵称，必须唯一

2. **可选字段**:
   - `avatar_url`: 用户头像URL，可通过文件上传接口获取
   - `department`: 用户所属院系
   - `school`: 用户所属学校
   - `before_card_url`和`after_card_url`: 校园卡照片，用于实名认证

3. **自动生成字段**:
   - `user_id`: 系统自动生成的用户ID
   - `auth_status`: 默认为0(未认证)
   - `account_status`: 默认为0(正常)
   - `created_at`和`updated_at`: 系统自动维护的时间戳

## 12. 即时通信模块

即时通信模块支持好友之间的实时消息交流，包括文本消息和图片消息。模块支持HTTP REST API和WebSocket两种通信方式。

### 12.1 发送消息

**请求方式**：POST

**请求URL**：`/chat/send`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| receiverId | BigInteger | 是 | 接收者ID |
| content | String | 是 | 消息内容 |
| messageType | Integer | 否 | 消息类型（0:文本,1:图片），默认0 |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": "123456789" // 新消息ID
}
```

### 12.2 获取聊天历史

**请求方式**：GET

**请求URL**：`/chat/history`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| userId | Integer | 是 | 对方用户ID |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "messageId": 123456789,
      "senderId": 111111,
      "receiverId": 222222,
      "content": "你好啊！",
      "messageType": 0,
      "readStatus": 1,
      "createdAt": "2025-05-26T10:10:10",
      "senderNickname": "张三",
      "senderAvatarUrl": "http://example.com/avatar/1.jpg",
      "isFromCurrentUser": true
    },
    {
      "messageId": 123456790,
      "senderId": 222222,
      "receiverId": 111111,
      "content": "你好，最近怎么样？",
      "messageType": 0,
      "readStatus": 1,
      "createdAt": "2025-05-26T10:11:10",
      "senderNickname": "李四",
      "senderAvatarUrl": "http://example.com/avatar/2.jpg",
      "isFromCurrentUser": false
    }
  ]
}
```

### 12.3 分页获取聊天历史

**请求方式**：GET

**请求URL**：`/chat/history/page`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| userId | Integer | 是 | 对方用户ID |
| page | Integer | 否 | 页码，从0开始，默认0 |
| size | Integer | 否 | 每页大小，默认20 |

**响应参数**：同聊天历史接口

### 12.4 获取会话列表

**请求方式**：GET

**请求URL**：`/chat/conversations`

**请求参数**：无

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "messageId": 123456795,
      "senderId": 222222,
      "receiverId": 111111,
      "content": "最新消息内容",
      "messageType": 0,
      "readStatus": 0,
      "createdAt": "2025-05-26T10:30:10",
      "senderNickname": "李四",
      "senderAvatarUrl": "http://example.com/avatar/2.jpg",
      "isFromCurrentUser": false
    },
    {
      "messageId": 123456798,
      "senderId": 111111,
      "receiverId": 333333,
      "content": "下午去图书馆吗？",
      "messageType": 0,
      "readStatus": 1,
      "createdAt": "2025-05-26T09:30:10",
      "senderNickname": "张三",
      "senderAvatarUrl": "http://example.com/avatar/1.jpg",
      "isFromCurrentUser": true
    }
  ]
}
```

### 12.5 标记消息为已读

**请求方式**：POST

**请求URL**：`/chat/read`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| messageId | BigInteger | 是 | 消息ID |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 12.6 标记所有消息为已读

**请求方式**：POST

**请求URL**：`/chat/read/all`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| senderId | Integer | 是 | 发送者ID |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": 5 // 标记为已读的消息数量
}
```

### 12.7 获取未读消息数量

**请求方式**：GET

**请求URL**：`/chat/unread/count`

**请求参数**：无

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": 10 // 未读消息总数
}
```

### 12.8 获取未读消息详情

**请求方式**：GET

**请求URL**：`/chat/unread/details`

**请求参数**：无

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    222222: 5,
    333333: 3,
    444444: 2
  }
}
```

### 12.9 删除消息

**请求方式**：DELETE

**请求URL**：`/chat/message`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| messageId | BigInteger | 是 | 消息ID |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 12.10 检查用户在线状态

**请求方式**：GET

**请求URL**：`/chat/online`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| userId | Integer | 是 | 用户ID |

**响应参数**：

```json
{
  "code": 200,
  "message": "success",
  "data": true // true表示在线，false表示离线
}
```

### 12.11 WebSocket连接

**连接URL**：`ws://localhost:8080/ws/chat/{token}`

其中`{token}`是用户登录后获取的JWT令牌。

**消息格式**：

1. 客户端发送到服务端的消息格式：

```json
// 发送消息
{
  "type": "chat",
  "receiverId": "222222",
  "content": "你好！",
  "messageType": 0
}

// 心跳消息
{
  "type": "heartbeat"
}

// 已读消息状态更新
{
  "type": "read",
  "senderId": "222222"
}
```

2. 服务端发送到客户端的消息格式：

```json
// 连接成功消息
{
  "type": "connect",
  "status": "success",
  "userId": "111111"
}

// 收到新消息
{
  "messageId": "123456789",
  "senderId": "222222",
  "receiverId": "111111",
  "content": "你好！",
  "messageType": 0,
  "readStatus": 0,
  "createdAt": "2025-05-26T10:10:10",
  "senderNickname": "李四",
  "senderAvatarUrl": "http://example.com/avatar/2.jpg",
  "isFromCurrentUser": false
}

// 未读消息数量
{
  "type": "unread",
  "total": 10,
  "details": {
    "222222": 5,
    "333333": 3,
    "444444": 2
  }
}

// 错误消息
{
  "type": "error",
  "message": "消息处理失败: 接收者不存在"
}
```

## 13. 数据模型

### 13.1 用户模型

```json
{
  "userId": "111111",
  "username": "zhangsan",
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "avatarUrl": "http://example.com/avatar/1.jpg",
  "gender": 1,
  "bio": "我是张三",
  "birthday": "2000-01-01",
  "createdAt": "2023-01-01T12:00:00"
}
```

### 13.2 消息模型

```json
{
  "messageId": "123456789",
  "senderId": "111111",
  "receiverId": "222222",
  "content": "你好！",
  "messageType": 0,
  "readStatus": 0,
  "createdAt": "2025-05-26T10:10:10",
  "senderNickname": "张三",
  "senderAvatarUrl": "http://example.com/avatar/1.jpg",
  "isFromCurrentUser": true
}
```

其中：
- messageType: 0表示文本消息，1表示图片消息
- readStatus: 0表示未读，1表示已读
- isFromCurrentUser: 帮助前端渲染，标记消息是否由当前用户发送
