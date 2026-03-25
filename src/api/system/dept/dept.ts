import request from '@/utils/request';

export interface DeptVO {
  id?: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUserId: number
  phone: string
  email: string
  createTime: Date
}

// 查询部门（精简)列表
export const getSimpleDeptList = (): Promise<DeptVO[]> => {
  return  request({ url: '/system/dept/simple-list', method: 'get' });
};

// 根据所选部门查询人员数据
export const getUserByDept = (data:any) => {
  return request({ url: '/system/user/selectUsersByDeptId',method: 'post' , data})
};
// 获取信息 system/user/getManageAllUser
 export const getManageAllUser = () => {
  return request({ url: '/system/user/getManageAllUser',method: 'post' })
}