/**
 * @author Zyr
 * @date 2026-03-06 10:15:00
 * @description 引入获取绩效计分策略或规则库列表相关的接口定义
 * @lines 9
 */
import request from '@/utils/request';

// 获取绩效计分策略/规则库列表
export function getScoreRuleList() {
  return request({
    url: '/human/performance-indicator-rule/list',
    method: 'get'
  });
}
