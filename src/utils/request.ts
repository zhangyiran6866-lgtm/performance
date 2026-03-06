import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { removeToken } from './auth';

export const isRelogin = { show: false };

let isRefreshToken = false;
let requestList: any[] = [];

// 仿照 c-center: base_url = target url + api preffix
const baseURL = (import.meta.env.VITE_API_TARGET_URL || '') + (import.meta.env.VITE_API_BASE_URL || '/api');


// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL, // 请求的基础统一路径前缀
  timeout: 10000, // 请求超时时间：10秒
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

import { getToken, getTenantId } from './auth';

// 请求白名单，无须 token 的接口
const whiteList: string[] = ['/login', '/system/auth/refresh-token'];

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 白名单内不注入 token
    let isToken = true;
    if (config.url) {
      isToken = !whiteList.some((v) => config.url!.includes(v));
    }
    
    // 每次发送请求之前，在此进行相关配置
    const token = getToken();
    const tenantId = getTenantId();

    if (token && isToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 参照 c-center 行为：可能由于临时限制或者业务写死，这里强制传递临时租户ID '1'
    config.headers['tenant-id'] = tenantId || '1';
    
    // 如果有环境 tag 也带上
    const serviceTag = import.meta.env.VITE_APP_SERVICE_TAG;
    if (serviceTag && config.headers) {
      config.headers['tag'] = serviceTag;
    }
    
    // get 参数或 post query 参数确保传递
    return config;
  },
  (error: any) => {
    // 处理请求错误
    console.error('Request Error:', error);
    return Promise.reject(error);
  },
);

const handleAuthorized = (msg: string = '登录状态已过期，您可以继续留在该页面，或者重新登录') => {
  if (!isRelogin.show) {
    if (window.location.href.includes('login?redirect=')) return Promise.reject(msg);
    isRelogin.show = true;
    ElMessageBox.confirm(msg, '系统提示', {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      isRelogin.show = false;
      removeToken();
      location.href = '/login';
    }).catch(() => {
      isRelogin.show = false;
    });
  }
  return Promise.reject(msg);
};

const executeRefreshToken = async () => {
  const { getRefreshToken } = await import('./auth');
  const tenantId = getTenantId();
  // 注意，我们要跳过拦截器，使用新的原生 axios 发送，否则会死锁
  return await axios.post(baseURL + '/system/auth/refresh-token?refreshToken=' + getRefreshToken() + '&clientId=taojin-sso-demo-by-password', {}, {
    headers: {
      'tenant-id': tenantId || '1',
    },
  });
};

// 响应拦截器
service.interceptors.response.use(
  async (response: AxiosResponse) => {
    // 成功收到响应
    const res = response.data;
    const config = response.config;
    
    // 假设后端规范返回格式为 { code: Number, data: any, message: string }
    const code = res.code || 0;
    const msg = res.msg || 'Error Request';

    if (code === 401) {
      if (!isRefreshToken) {
        isRefreshToken = true;
        const { getRefreshToken, setToken } = await import('./auth');
        if (!getRefreshToken()) {
          return handleAuthorized();
        }
        try {
          const refreshTokenRes = await executeRefreshToken();
          if (refreshTokenRes.data.code === 400 || refreshTokenRes.data.code === 401) {
            return handleAuthorized('刷新令牌已过期，请重新登录');
          }
          setToken(refreshTokenRes.data.data || refreshTokenRes.data);
           config.headers!['Authorization'] = `Bearer ${getToken()}`;
           requestList.forEach((cb: any) => cb());
           requestList = [];
           return service(config);
        } catch (e) {
          requestList.forEach((cb: any) => cb());
          return handleAuthorized();
        } finally {
          requestList = [];
          isRefreshToken = false;
        }
      } else {
        // 如果正在刷新 token，将所有发来的请求排入队列挂起
        return new Promise((resolve) => {
          requestList.push(() => {
             config.headers!['Authorization'] = `Bearer ${getToken()}`;
             resolve(service(config));
          });
        });
      }
    } else if (code === 500) {
      ElMessage.error(msg);
      return Promise.reject(new Error(msg));
    }
    
    // 这里暂时直接将 axios 拆包后的数据抛给业务层调用方
    return res;
  },
  async (error: any) => {
    // 统一处理报错信息
    let message = '';
    
    if (error && error.response) {
      switch (error.response.status) {
      case 400:
        message = '请求错误(400)';
        break;
      case 401:
        if (!isRefreshToken) {
          isRefreshToken = true;
          const { getRefreshToken, setToken } = await import('./auth');
          if (!getRefreshToken()) {
            return handleAuthorized();
          }
          try {
            const refreshTokenRes = await executeRefreshToken();
            if (refreshTokenRes.data.code === 400 || refreshTokenRes.data.code === 401) {
              return handleAuthorized('刷新令牌已过期，请重新登录');
            }
            setToken(refreshTokenRes.data.data || refreshTokenRes.data);
            error.response.config.headers['Authorization'] = `Bearer ${getToken()}`;
            requestList.forEach((cb: any) => cb());
            requestList = [];
            return service(error.response.config);
          } catch (e) {
            requestList.forEach((cb: any) => cb());
            return handleAuthorized();
          } finally {
            requestList = [];
            isRefreshToken = false;
          }
        } else {
          return new Promise((resolve) => {
            requestList.push(() => {
              error.response.config.headers['Authorization'] = `Bearer ${getToken()}`;
              resolve(service(error.response.config));
            });
          });
        }
         
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
      duration: 3000,
    });
    
    return Promise.reject(error);
  },
);

// 封装通用的核心请求方法
const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service.request<any, T>(config);
};

export default request;
