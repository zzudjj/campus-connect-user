/**
 * 认证相关API：密码重置和验证码
 */

import axios from 'axios';

// 基础请求地址
const basePasswordURL = 'http://localhost:8080/password';
const baseCaptchaURL = 'http://localhost:8080/captcha';

/**
 * 请求密码重置验证码
 * @param {Object} data 包含email
 * @returns {Promise} 
 */
export const requestPasswordResetCode = (data) => {
  return axios.post(`${basePasswordURL}/forgot`, data)
    .then(res => res.data);
};

/**
 * 验证邮箱验证码
 * @param {Object} data 包含email和code
 * @returns {Promise}
 */
export const verifyResetCode = (data) => {
  return axios.post(`${basePasswordURL}/verify`, data)
    .then(res => res.data);
};

/**
 * 重置密码
 * @param {Object} data 包含email、code和newPassword
 * @returns {Promise}
 */
export const resetPassword = (data) => {
  return axios.post(`${basePasswordURL}/reset`, data)
    .then(res => res.data);
};

/**
 * 生成图片验证码
 * @returns {Promise} 返回包含captchaId和captchaImage的对象
 */
export const generateCaptcha = () => {
  return axios.get(`${baseCaptchaURL}/generate`)
    .then(res => res.data);
};

/**
 * 验证图片验证码
 * @param {Object} data 包含captchaId和code
 * @returns {Promise}
 */
export const verifyCaptcha = (data) => {
  return axios.post(`${baseCaptchaURL}/verify`, data)
    .then(res => res.data);
};
