---
title: 核心 API （我们不鼓励查阅此文档，因为此文档问题很大）
---

# Session

## 发送消息 send

| 字段        | 类型                 | 说明                   |
| ----------- | -------------------- | ---------------------- |
| message     | Message              | 消息内容               |

# Bot

## 发送消息 send_message

| 字段        | 类型                 | 说明                   |
| ----------- | -------------------- | ---------------------- |
| detail_type | String               | `private` 或者 `group` |
| group_id    | Option&lt;String&gt; | 群 ID                  |
| user_id     | Option&lt;String&gt; | 用户 ID                |
| message     | Message              | 消息内容               |

## 删除消息 delete_message

| 字段       | 类型   | 说明    |
| ---------- | ------ | ------- |
| message_id | String | 消息 ID |

## 设置群名称 set_group_name

| 字段       | 类型   | 说明   |
| ---------- | ------ | ------ |
| group_id   | string | 群 ID  |
| group_name | string | 群名称 |

## 踢出群成员 kick_group_member

| 字段     | 类型   | 说明    |
| -------- | ------ | ------- |
| group_id | string | 群 ID   |
| user_id  | string | 用户 ID |

## 禁言群成员 ban_group_member

| 字段     | 类型   | 说明           |
| -------- | ------ | -------------- |
| group_id | string | 群 ID          |
| user_id  | string | 用户 ID        |
| duration | number    | 时长，单位：秒 |

## 解禁群成员 unban_group_member

| 字段     | 类型   | 说明    |
| -------- | ------ | ------- |
| group_id | string | 群 ID   |
| user_id  | string | 用户 ID |

## 设置群管理员 set_group_admin

| 字段     | 类型   | 说明    |
| -------- | ------ | ------- |
| group_id | string | 群 ID   |
| user_id  | string | 用户 ID |

## 取消群管理员 unset_group_admin

| 字段     | 类型   | 说明    |
| -------- | ------ | ------- |
| group_id | string | 群 ID   |
| user_id  | string | 用户 ID |