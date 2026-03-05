import { defineStore } from 'pinia';
import { store } from '../index';
import type { DictDataVO } from '@/api/system/dict/dict.data';
import { CACHE_KEY, useCache } from '@/hooks/web/useCache';
import { getSimpleDictDataList } from '@/api/system/dict/dict.data';

const { wsCache } = useCache('sessionStorage');

export interface DictState {
  dictMap: Map<string, any>;
  isSetDict: boolean;
}

export const useDictStore = defineStore('dict', {
  state: (): DictState => ({
    dictMap: new Map<string, any>(),
    isSetDict: false
  }),
  getters: {
    getDictMap(): Record<string, any> {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE);
      if (dictMap) {
        this.dictMap = dictMap;
      }
      return this.dictMap as Record<string, any>;
    },
    getIsSetDict(): boolean {
      return this.isSetDict;
    }
  },
  actions: {
    async setDictMap() {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE);
      if (dictMap) {
        this.dictMap = dictMap;
        this.isSetDict = true;
      } else {
        const res = await getSimpleDictDataList();
        const dictData = res.data || res;
        
        // 设置数据
        const dictDataMap: Record<string, any> = {};
        dictData?.forEach((dictData: DictDataVO) => {
          // 获得 dictType 层级
          const enumValueObj = dictDataMap[dictData.dictType];
          if (!enumValueObj) {
            dictDataMap[dictData.dictType] = [];
          }
          // 处理 dictValue 层级
          dictDataMap[dictData.dictType].push({
            value: dictData.value,
            label: dictData.label,
            colorType: dictData.colorType,
            cssClass: dictData.cssClass
          });
        });
        this.dictMap = dictDataMap as unknown as Map<string, any>;
        this.isSetDict = true;
        wsCache.set(CACHE_KEY.DICT_CACHE, dictDataMap, { exp: 60 }); // 60 秒 过期
      }
    },
    getDictByType(type: string) {
      if (!this.isSetDict) {
        this.setDictMap();
      }
      return (this.dictMap as unknown as Record<string, any>)[type];
    }
  }
});

export const useDictStoreWithOut = () => {
  return useDictStore(store);
};
