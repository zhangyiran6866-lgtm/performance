import request from '@/utils/request';


/**
 * AuthPermissionInfoRespVO，管理后台 - 登录用户的权限信息 Response VO，额外包括用户信息和角色列表
 */
export interface AuthPermissionInfoRespVO {
    /**
     * 菜单树
     */
    menus: MenuVO[];
    /**
     * 操作权限数组
     */
    permissions: string[];
    /**
     * 角色标识数组
     */
    roles: string[];
    user: UserVO;
    [property: string]: any;
}

/**
 * MenuVO，管理后台 - 登录用户的菜单信息 Response VO
 */
export interface MenuVO {
    /**
     * 是否总是显示
     */
    alwaysShow?: boolean;
    children?: MenuVO[];
    /**
     * 组件路径,仅菜单类型为菜单时，才需要传
     */
    component?: string;
    /**
     * 组件名
     */
    componentName?: string;
    /**
     * 菜单图标,仅菜单类型为菜单或者目录时，才需要传
     */
    icon?: string;
    /**
     * 菜单名称
     */
    id: number;
    /**
     * 是否全屏
     */
    isFull?: string;
    /**
     * 是否缓存
     */
    keepAlive: boolean;
    /**
     * 微应用名称，英文
     */
    microName?: string;
    /**
     * 菜单名称
     */
    name: string;
    /**
     * 父菜单 ID
     */
    parentId: number;
    /**
     * 路由地址,仅菜单类型为菜单或者目录时，才需要传
     */
    path?: string;
    /**
     * 是否可见
     */
    visible: boolean;
    [property: string]: any;
}

/**
 * UserVO，用户信息 VO
 */
export interface UserVO {
    /**
     * 用户头像
     */
    avatar: string;
    /**
     * 部门编号
     */
    deptId: number;
    /**
     * 部门名称
     */
    deptName: string;
    /**
     * 用户编号
     */
    id: number;
    /**
     * 用户昵称
     */
    nickname: string;
    /**
     * 企业微信openid
     */
    openidQw?: string;
    /**
     * 用户名称称
     */
    username: string;
    [property: string]: any;
}


// 获取菜单树
export function getMenuTree(microName: string) {
  return request({
    url: `/system/auth/get-permission-info?microName=${microName}`  ,
    method: 'get',
  });
}
