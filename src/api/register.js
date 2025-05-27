/**
 * 注册相关API
 */

import axios from 'axios';

// 基础请求地址
const baseURL = 'http://localhost:8080/user';

/**
 * 发送注册邮箱验证码
 * @param {Object} data 包含email
 * @returns {Promise} 返回发送结果
 */
export const sendEmailCode = (data) => {
  // data: { email }
  // 直接发送JSON数据
  return axios.post(`${baseURL}/sendCode`, data)
    .then(res => res.data)
};

// 注意: 根据API文档，验证码验证是直接在注册接口中完成的
// 不需要单独的验证接口
