import request from '@/utils/request'

/**
 * CommonResultListEmployeeEvaluationRespVO
 */
export interface CommonResultListEmployeeEvaluationRespVO {
    code?: number;
    data?: EmployeeEvaluationRespVO[];
    msg?: string;
    [property: string]: any;
}


/**
 * EmployeeEvaluationRespVO，管理后台 - 员工绩效考评信息 Response VO
 */
export interface EmployeeEvaluationRespVO {
    /**
     * 主管评语/考评理由
     */
    comment?: string;
    /**
     * 完成量
     */
    completedValue?: string;
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 部门id
     */
    deptId?: number;
    /**
     * 部门名称
     */
    deptName?: string;
    /**
     * 最终判定得分（由系统生成）
     */
    finalScore?: number;
    /**
     * 主键ID，自增长
     */
    id: number;
    /**
     * 考核指标名称
     */
    indicatorName: string;
    /**
     * 指标类型（如：定量计算）
     */
    indicatorType?: string;
    /**
     * 系统公式初算分数
     */
    initialScore?: number;
    /**
     * 岗位名称
     */
    position?: string;
    /**
     * 计分规则（如：90/70标准型、100/70严格型）
     */
    scoringRule?: string;
    /**
     * 目标量
     */
    targetValue?: string;
    /**
     * 模板ID（template.id）
     */
    templateId: number;
    /**
     * 考核模板名称
     */
    templateName?: string;
    /**
     * 当前合计预估分
     */
    totalScore?: number;
    /**
     * 用户ID（user.id）
     */
    userId: number;
    /**
     * 员工姓名
     */
    userName: string;
    /**
     * 权重占比（%）
     */
    weight?: number;
    [property: string]: any;
}

/**
 * EmployeeEvaluationSaveReqVO，管理后台 - 员工绩效考评信息新增/修改 Request VO
 */
export interface EmployeeEvaluationSaveReqVO {
    /**
     * 主管评语/考评理由
     */
    comment?: string;
    /**
     * 完成量
     */
    completedValue?: string;
    /**
     * 部门id
     */
    deptId?: number;
    /**
     * 最终判定得分（由系统生成）
     */
    finalScore?: number;
    /**
     * 主键ID，自增长
     */
    id: number;
    /**
     * 考核指标名称
     */
    indicatorName: string;
    /**
     * 指标类型（如：定量计算）
     */
    indicatorType?: string;
    /**
     * 系统公式初算分数
     */
    initialScore?: number;
    /**
     * 岗位名称
     */
    position?: string;
    /**
     * 计分规则（如：90/70标准型、100/70严格型）
     */
    scoringRule?: string;
    /**
     * 暂存
     */
    status?: string;
    /**
     * 目标量
     */
    targetValue?: string;
    /**
     * 模板ID（template.id）
     */
    templateId: number;
    /**
     * 考核模板名称
     */
    templateName?: string;
    /**
     * 当前合计预估分
     */
    totalScore?: number;
    /**
     * 用户ID（user.id）
     */
    userId: number;
    /**
     * 员工姓名
     */
    userName: string;
    /**
     * 权重占比（%）
     */
    weight?: number;
    [property: string]: any;
}

// 获取员工单个周期考评信息
export function getEmployeeEvaluation(params: { cycleId: number,userId: number }) {
    return request({
        url: '/human/employee-evaluation/getEmployeeEvaluationList',
        method: 'get',
        params,
    });
}

// 员工绩效考评信息暂存打分
export function saveEmployeeEvaluation(data: EmployeeEvaluationSaveReqVO[]) {
    return request({
        url: '/human/employee-evaluation/userRatingList',
        method: 'post',
        data,
    });
}

// 员工绩效考评信息提交打分
export function submitEmployeeEvaluation(data: EmployeeEvaluationSaveReqVO[]) {
    return request({
        url: '/human/employee-evaluation/submitUserRating',
        method: 'post',
        data,
    });
}

// 员工绩效考评信息提交企微审批
export function submitEmployeeEvaluationApproval(data: EmployeeEvaluationSaveReqVO[]) {
    return request({
        url: '/human/employee-evaluation/submitPerformanceQW',
        method: 'post',
        data,
    });
}

// 获取部门团队打分进度概览信息
export function getDeptTeamRatingProgress(params: { cycleId: number, deptId: number }) {
    return request({
        url: '/human/employee-evaluation/selectEvaluationSummarize',
        method: 'get',
        params,
    });
}
