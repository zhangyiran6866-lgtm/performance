import request from '@/utils/request';

// 获取租户 ID
export const getTenantIdByName = (name: string) => {
  return request({
    url: '/system/tenant/get-id-by-name',
    method: 'get',
    params: { name }
  });
};

// 社交授权的跳转 (获取企业微信扫码登录 iframe 地址)
export const socialAuthRedirect = (type: number, redirectUri: string) => {
  return request({
    url: '/system/auth/social-auth-redirect?type=' + type + '&redirectUri=' + redirectUri,
    method: 'get'
  });
};

// 账号密码登录
export const loginByPassword = (data: any) => {
  return request({
    url: '/system/oauth2/token',
    method: 'post',
    params: data 
  });
};

// 获取用户权限及个人信息
export const getInfo = () => {
  return request({
    url: '/system/auth/get-permission-info',
    method: 'get'
  });
};
