import request from '@/utils/request';

/**
 * PageResultPerformanceCycleRespVO，分页结果
 */
export interface PageResultPerformanceCycleRespVO {
    /**
     * 扩展数据
     */
    extra?: { [key: string]: { [key: string]: any } };
    /**
     * 数据
     */
    list: PerformanceCycleRespVO[];
    /**
     * 总量
     */
    total: number;
    [property: string]: any;
}

/**
 * PerformanceCycleRespVO，管理后台 - 考核周期主表 Response VO
 */
export interface PerformanceCycleRespVO {
    /**
     * 已确认完成人数
     */
    completedCount: number;
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 周期维度 (MONTHLY/QUARTERLY/YEARLY)
     */
    cycleType: string;
    /**
     * 考核结束日期
     */
    endDate: Date;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 周期名称 (如: 2026年3月份月度绩效考核)
     */
    name: string;
    /**
     * 部门主管已设定目标人数
     */
    notConfirmCount?: number;
    /**
     * 员工确认签署人数
     */
    signedCount?: number;
    /**
     * 所处阶段 (to_be_opened: 待开启,GOAL_SETTING:目标设定/系统配置, PUBLISHED:下达签报, RATING:打分阶段, ARCHIVED:已归档)
     */
    stage: string;
    /**
     * 考核开始日期
     */
    startDate: Date;
    /**
     * 团队成员总数
     */
    teamMemberCount: number;
    /**
     * 模版数量
     */
    templateCount?: number;
    /**
     * 模版名称
     */
    templateName?: string;
    templateRespVOS?: PerformanceCycleTemplateRespVO[];
    /**
     * 待确认完成人数
     */
    toConfirmCount: number;
    /**
     * 待设定人数
     */
    toSetCount: number;
    /**
     * 周期总人数
     */
    totalCount?: number;
    [property: string]: any;
}

/**
 * PerformanceCycleTemplateRespVO
 */
export interface PerformanceCycleTemplateRespVO {
    /**
     * 考核周期id
     */
    cycleId: number;
    /**
     * 指标数量
     */
    indicatorCount?: number;
    /**
     * 模版id
     */
    templateId: number;
    /**
     * 模版指标明细
     */
    templateItemRespVOS?: PerformanceTemplateItemRespVO[];
    /**
     * 模版名称
     */
    templateName: string;
    /**
     * 用户数量
     */
    userCount?: number;
    [property: string]: any;
}

/**
 * PerformanceCycleItemRespVO，管理后台 - 绩效考核周期关联模版明细 Response VO
 */
export interface PerformanceCycleItemRespVO {
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 考核周期id
     */
    cycleId?: number;
    /**
     * 部门id
     */
    deptId?: number;
    /**
     * 主键id
     */
    id: number;
    /**
     * 考核月份
     */
    month?: string;
    /**
     * 绩效模版id
     */
    templateId: number;
    /**
     * 模版明细
     */
    templateItems?: PerformanceTemplateItemRespVO[];
    /**
     * 绩效名称
     */
    templateName?: string;
    [property: string]: any;
}

/**
 * PerformanceTemplateItemRespVO，管理后台 - 模板-指标关联明细 Response VO
 */
export interface PerformanceTemplateItemRespVO {
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 数据汇聚(system:系统抓取,complete:手动填写)
     */
    dataAggregation?: string;
    /**
     * 数据汇聚值(sum:月度累加,月度平均:avg.....)
     */
    dataAggregationValue?: string;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 关联的指标ID
     */
    indicatorId: number;
    /**
     * 指标名称
     */
    indicatorName?: string;
    /**
     * 关联的计分规则描述
     */
    indicatorRuleDescription?: string;
    /**
     * 关联的计分规则名称
     */
    indicatorRuleName?: string;
    /**
     * 该项指标满分 (通常定量100，当前定性主管评价要求为20)
     */
    maxScore: number;
    /**
     * 应用的计分规则ID (覆写指标库中的默认规则)
     */
    ruleId: number;
    /**
     * 排序序号
     */
    sortOrder?: number;
    /**
     * 目标考核基准值
     */
    targetValue?: string;
    /**
     * 所属模板ID
     */
    templateId: number;
    /**
     * 权重(百分比，定性综合评价不填本项则为空)
     */
    weight?: number;
    [property: string]: any;
}

export interface AssessmentPageReqVO {
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 周期维度 (MONTHLY/QUARTERLY/YEARLY)
     */
    cycleType?: string;
    /**
     * 考核结束日期
     */
    endDate?: string;
    /**
     * 周期名称 (如: 2026年3月份月度绩效考核)
     */
    name?: string;
    /**
     * 页码，从 1 开始
     */
    pageNo: string;
    /**
     * 每页条数，最大值为 100
     */
    pageSize: string;
    /**
     * 所处阶段 (GOAL_SETTING:目标设定/系统配置, PUBLISHED:下达签报, RATING:打分阶段, ARCHIVED:已归档)
     */
    stage?: string;
    /**
     * 考核开始日期
     */
    startDate?: string;
    [property: string]: any;
}

// 获取绩效考核周期实例分页列表
export function getAssessmentPage(params: AssessmentPageReqVO) {
  return request({
    url: '/human/performance-cycle/page',
    method: 'get',
    params,
  });
}

// 调整绩效考核周期实例状态
export function updateAssessmentStatus(data: { cycleId: number, stage: string }) {
  return request({
    url: `/human/performance-cycle/startPerformance`,
    method: 'post',
    data
  });
}

// 查询考核周期中的考核模板
export function getPerformanceCycle(id: number) {
  return request({
    url: `/human/performance-cycle/getCycleDetails?id=${id}`,
    method: 'get',
  });
}


/**
 * PerformanceComprehensiveRespVO
 */
export interface PerformanceComprehensiveRespVO {
    /**
     * 已确认完成人数
     */
    completedScoringUser: number;
    /**
     * 全周期平均分
     */
    fullCycleAverageScore: number;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 周期名称 (如: 2026年3月份月度绩效考核)
     */
    name: string;
    templateRespVOS?: PerformanceComprehensiveTemplateRespVO[];
    /**
     * 考核总人数
     */
    totalAssessmentUser: number;
    /**
     * 参评部门总数
     */
    totalParticipatingDepartments: number;
    [property: string]: any;
}

/**
 * PerformanceComprehensiveTemplateRespVO
 */
export interface PerformanceComprehensiveTemplateRespVO {
    /**
     * 部门平均分
     */
    averageScore?: number;
    /**
     * 完成评分人数
     */
    completeScoreCount?: number;
    /**
     * 考核周期id
     */
    cycleId: number;
    /**
     * 模版id
     */
    templateId: number;
    /**
     * 模版名称
     */
    templateName: string;
    /**
     * 用户数量
     */
    userCount?: number;
    /**
     * 模版用户得分明细
     */
    userRespVOS?: PerformanceComprehensiveUserRespVO[];
    [property: string]: any;
}

/**
 * PerformanceComprehensiveUserRespVO，模版用户得分明细
 */
export interface PerformanceComprehensiveUserRespVO {
    /**
     * 等级
     */
    grade: string;
    /**
     * 得分
     */
    overallScore: number;
    /**
     * 岗位
     */
    position: string;
    /**
     * 用户ID
     */
    userId: number;
    /**
     * 用户名称
     */
    userName: string;
    [property: string]: any;
}

// 查看绩效大盘
export function getPerformanceDashboard(cycleId: number) {
  return request({
    url: `/human/performance-cycle/getPerformanceComprehensiveList?id=${cycleId}`,
    method: 'get',
  });
}

// 导出员工考核指标
export function exportEmployeeEvaluation(cycleId: number) {
  return request({
    url: `/human/performance-user-target/exportUserTarget?cycleId=${cycleId}`,
    method: 'get',
    responseType: 'blob',
  });
}