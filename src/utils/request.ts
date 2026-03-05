import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 配置环境的基础URL
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL, // 请求的基础统一路径前缀
  timeout: 10000, // 请求超时时间：10秒
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 每次发送请求之前，可以在此进行相关配置
    // 例如：携带 token
    // const token = localStorage.getItem('token');
    // if (token && config.headers) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    
    // 如果不考虑登录问题，这里的逻辑先留空作为占位即可
    return config;
  },
  (error: any) => {
    // 处理请求错误
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 成功收到响应
    const res = response.data;
    
    // 假设后端规范返回格式为 { code: Number, data: any, message: string }
    // 这里可以根据实际情况进行解构或者校验，如果直接返回 response，业务代码就需要自己去解一层 .data
    // TODO: 根据实际后端的接口规范调整这里的逻辑判断
    // 比如：
    // if (res.code !== 200 && res.code !== 0) {
    //   ElMessage.error(res.message || 'Error Request');
    //   return Promise.reject(new Error(res.message || 'Error'));
    // }
    
    // 这里暂时直接将 axios 拆包后的数据抛给业务层调用方
    return res;
  },
  (error: any) => {
    // 统一处理报错信息
    let message = '';
    
    if (error && error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求错误(400)';
          break;
        case 401:
          message = '未授权，请重新登录(401)';
          // 此处可以加入跳转到登录页的逻辑
          break;
        case 403:
          message = '拒绝访问(403)';
          break;
        case 404:
          message = `请求地址出错: ${error.response.config.url}`;
          break;
        case 408:
          message = '请求超时(408)';
          break;
        case 500:
          message = '服务器内部错误(500)';
          break;
        case 501:
          message = '服务未实现(501)';
          break;
        case 502:
          message = '网关错误(502)';
          break;
        case 503:
          message = '服务不可用(503)';
          break;
        case 504:
          message = '网关超时(504)';
          break;
        case 505:
          message = 'HTTP版本不受支持(505)';
          break;
        default:
          message = `连接出错(${error.response.status})!`;
      }
    } else {
      // 网络超时或无网络状态
      if (error.message.includes('timeout')) {
        message = '网络请求超时！请稍后重试';
      } else {
        message = '网络连接失败！请检查您的网络';
      }
    }
    
    // 使用 Element Plus 弹出统一提示信息
    ElMessage({
      message,
      type: 'error',
      duration: 3000
    });
    
    return Promise.reject(error);
  }
);

// 封装通用的核心请求方法
const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service.request<any, T>(config);
};

export default request;
