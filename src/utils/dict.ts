/**
 * 数据字典工具类
 */
import { useDictStoreWithOut } from '@/store/modules/dict';
import { ref } from 'vue';

const dictStore = useDictStoreWithOut();

export interface DictDataType {
  dictType: string;
  label: string;
  value: string | number | boolean;
  colorType: string | '';
  cssClass: string;
}

export interface NumberDictDataType extends DictDataType {
  value: number;
}

export interface StringDictDataType extends DictDataType {
  value: string;
}

/**
 * 获取 dictType 对应的数据字典数组
 *
 * @param dictType 数据类型
 * @returns {*|Array} 数据字典数组
 */
export const getDictOptions = (dictType: string): DictDataType[] => {
  return dictStore.getDictByType(dictType) || [];
};

export const getIntDictOptions = (dictType: string): NumberDictDataType[] => {
  const dictOptions: DictDataType[] = getDictOptions(dictType);
  const dictOption: NumberDictDataType[] = [];
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: parseInt(dict.value + '', 10)
    });
  });
  return dictOption;
};

export const getStrDictOptions = (dictType: string): StringDictDataType[] => {
  const dictOptions: DictDataType[] = getDictOptions(dictType);
  const dictOption: StringDictDataType[] = [];
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: dict.value + ''
    });
  });
  return dictOption;
};

export const getBoolDictOptions = (dictType: string): DictDataType[] => {
  const dictOption: DictDataType[] = [];
  const dictOptions: DictDataType[] = getDictOptions(dictType);
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: dict.value + '' === 'true'
    });
  });
  return dictOption;
};

/**
 * 获得字典数据的文本展示
 *
 * @param dictType 字典类型
 * @param value 字典数据的值
 * @return 字典名称
 */
export const getDictLabel = (dictType: string, value: any): string => {
  const dictOptions: DictDataType[] = getDictOptions(dictType);
  const dictLabel = ref('');
  dictOptions.forEach((dict: DictDataType) => {
    if (dict.value === value + '') {
      dictLabel.value = dict.label;
    }
  });
  return dictLabel.value;
};
