import request from '@/utils/request';

export type DictDataVO = {
  id: number | undefined;
  sort: number | undefined;
  label: string;
  value: string;
  dictType: string;
  status: number;
  colorType: string;
  cssClass: string;
  remark: string;
  createTime: Date;
}

// 查询字典数据（精简)列表
export const getSimpleDictDataList = () => {
  return request({ url: '/system/dict-data/simple-list', method: 'get' });
};
