<template>
    <el-dialog v-model="dialogVisible" title="添加条件表达式" width="720px" :close-on-click-modal="false">
        <div class="condition-form">
            <div class="form-row">
                <div class="form-item">
                    <label>条件表达式：</label>
                    <div class="condition-input-group">
                        <div class="condition-part">
                            <div class="input-label">左值</div>
                            <el-select v-model="leftValueType" class="value-type-select">
                                <el-option label="变量" value="variable" />
                                <el-option label="常量" value="constant" />
                            </el-select>
                            <template v-if="leftValueType === 'variable'">
                                <el-select v-model="leftValue" placeholder="选择变量" class="condition-input">
                                    <el-option v-for="variable in variables" :key="variable.code" :label="variable.name"
                                        :value="variable.code" />
                                </el-select>
                            </template>
                            <template v-else>
                                <el-input v-model="customLeftValue" placeholder="输入数值" class="condition-input"
                                    @input="updateLeftValue" />
                            </template>
                        </div>
                        <div class="condition-part operator-part">
                            <div class="input-label">运算符</div>
                            <el-select v-model="operator" class="operator-select">
                                <el-option v-for="op in operators" :key="op.value" :label="op.symbol"
                                    :value="op.value" />
                            </el-select>
                        </div>
                        <div class="condition-part">
                            <div class="input-label">右值</div>
                            <el-select v-model="rightValueType" class="value-type-select">
                                <el-option label="变量" value="variable" />
                                <el-option label="常量" value="constant" />
                            </el-select>
                            <template v-if="rightValueType === 'variable'">
                                <el-select v-model="rightValue" placeholder="选择变量" class="condition-input">
                                    <el-option v-for="variable in variables" :key="variable.code" :label="variable.name"
                                        :value="variable.code" />
                                </el-select>
                            </template>
                            <template v-else>
                                <el-input v-model="customRightValue" placeholder="输入数值" class="condition-input"
                                    @input="updateRightValue" />
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-item">
                    <label>条件成立时：</label>
                    <div class="value-input-group">
                        <el-select v-model="trueValueType" class="value-type-select">
                            <el-option label="变量" value="variable" />
                            <el-option label="常量" value="constant" />
                        </el-select>
                        <template v-if="trueValueType === 'variable'">
                            <el-select v-model="trueValue" placeholder="选择变量" class="value-input">
                                <el-option v-for="variable in variables" :key="variable.code" :label="variable.name"
                                    :value="variable.code" />
                            </el-select>
                        </template>
                        <template v-else>
                            <el-input v-model="customTrueValue" placeholder="输入数值" class="value-input"
                                @input="updateTrueValue" />
                        </template>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-item">
                    <label>条件不成立时：</label>
                    <div class="value-input-group">
                        <el-select v-model="falseValueType" class="value-type-select">
                            <el-option label="变量" value="variable" />
                            <el-option label="常量" value="constant" />
                        </el-select>
                        <template v-if="falseValueType === 'variable'">
                            <el-select v-model="falseValue" placeholder="选择变量" class="value-input">
                                <el-option v-for="variable in variables" :key="variable.code" :label="variable.name"
                                    :value="variable.code" />
                            </el-select>
                        </template>
                        <template v-else>
                            <el-input v-model="customFalseValue" placeholder="输入数值" class="value-input"
                                @input="updateFalseValue" />
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import type { Variable } from '../types';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps<{
    modelValue: boolean;
    variables: Variable[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', expression: string): void;
    (e: 'cancel'): void;
}>();

// 对话框可见性
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 条件相关的数据
const leftValueType = ref('variable');
const rightValueType = ref('variable');
const trueValueType = ref('variable');
const falseValueType = ref('variable');
const leftValue = ref('');
const rightValue = ref('');
const operator = ref('gt');
const trueValue = ref('');
const falseValue = ref('');

// 自定义输入值
const customLeftValue = ref('');
const customRightValue = ref('');
const customTrueValue = ref('');
const customFalseValue = ref('');

// 运算符选项 - 使用符号替代文字
const operators = [
    { label: '大于', symbol: '>', value: 'gt' },
    { label: '大于等于', symbol: '>=', value: 'gte' },
    { label: '小于', symbol: '<', value: 'lt' },
    { label: '小于等于', symbol: '<=', value: 'lte' },
    { label: '等于', symbol: '=', value: 'eq' },
    { label: '不等于', symbol: '≠', value: 'neq' }
];

// 更新输入值的方法
const updateLeftValue = (value: string) => {
    leftValue.value = value;
};

const updateRightValue = (value: string) => {
    rightValue.value = value;
};

const updateTrueValue = (value: string) => {
    trueValue.value = value;
};

const updateFalseValue = (value: string) => {
    falseValue.value = value;
};

// 获取操作符的实际符号
const getOperatorSymbol = (op: string): string => {
    const symbolMap: Record<string, string> = {
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        eq: '==',
        neq: '!='
    };
    return symbolMap[op] || '>';
};

// 生成条件表达式
const generateExpression = () => {
    let left = leftValueType.value === 'variable' ? leftValue.value : customLeftValue.value;
    let right = rightValueType.value === 'variable' ? rightValue.value : customRightValue.value;
    let true_value = trueValueType.value === 'variable' ? trueValue.value : customTrueValue.value;
    let false_value = falseValueType.value === 'variable' ? falseValue.value : customFalseValue.value;

    // 检查输入值
    if (!left || !right || !true_value || !false_value) {
        throw new Error('请填写完整的条件表达式');
    }

    // 选择变量时使用变量显示名称
    if (leftValueType.value === 'variable') {
        const variable = props.variables.find(v => v.code === left);
        if (variable) left = variable.name;
    }
    if (rightValueType.value === 'variable') {
        const variable = props.variables.find(v => v.code === right);
        if (variable) right = variable.name;
    }
    if (trueValueType.value === 'variable') {
        const variable = props.variables.find(v => v.code === true_value);
        if (variable) true_value = variable.name;
    }
    if (falseValueType.value === 'variable') {
        const variable = props.variables.find(v => v.code === false_value);
        if (variable) false_value = variable.name;
    }

    // 处理数字常量
    if (leftValueType.value === 'constant') {
        if (isNaN(Number(left))) {
            throw new Error('左值必须是有效的数字');
        }
    }
    if (rightValueType.value === 'constant') {
        if (isNaN(Number(right))) {
            throw new Error('右值必须是有效的数字');
        }
    }
    if (trueValueType.value === 'constant') {
        if (isNaN(Number(true_value))) {
            throw new Error('条件成立时的值必须是有效的数字');
        }
    }
    if (falseValueType.value === 'constant') {
        if (isNaN(Number(false_value))) {
            throw new Error('条件不成立时的值必须是有效的数字');
        }
    }

    // 生成三目运算符表达式
    return `${left} ${getOperatorSymbol(operator.value)} ${right} ? ${true_value} : ${false_value}`;
};

// 处理确认
const handleConfirm = () => {
    try {
        const expression = generateExpression();
        emit('confirm', expression);
        resetForm();
    } catch (error) {
        ElMessage.error((error as Error).message);
    }
};

// 处理取消
const handleCancel = () => {
    resetForm();
    emit('cancel');
};

// 重置表单
const resetForm = () => {
    leftValueType.value = 'variable';
    rightValueType.value = 'variable';
    trueValueType.value = 'variable';
    falseValueType.value = 'variable';
    leftValue.value = '';
    rightValue.value = '';
    operator.value = 'gt';
    trueValue.value = '';
    falseValue.value = '';
    customLeftValue.value = '';
    customRightValue.value = '';
    customTrueValue.value = '';
    customFalseValue.value = '';
};
</script>

<style lang="scss" scoped>
.condition-form {
    padding: 20px;

    .form-row {
        margin-bottom: 24px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .form-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
            font-weight: 500;
            color: var(--el-text-color-regular);
        }
    }

    .condition-input-group {
        display: flex;
        gap: 16px;
        align-items: flex-start;

        .condition-part {
            flex: 1;
            min-width: 0; // 防止子元素溢出
            display: flex;
            flex-direction: column;
            gap: 8px;

            .input-label {
                margin-bottom: 4px;
                color: var(--el-text-color-secondary);
                font-size: 13px;
            }

            &.operator-part {
                flex: 0 0 120px;
            }
        }
    }

    .value-type-select {
        margin-bottom: 8px;
        width: 100%;
    }

    .condition-input,
    .operator-select,
    .value-input {
        width: 100%;
    }

    .value-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .value-type-select,
        .value-input {
            width: 100%;
        }
    }
}

.dialog-footer {
    margin-top: 20px;
    padding: 20px;
    text-align: right;
    border-top: 1px solid var(--el-border-color-light);
}

:deep(.el-select-dropdown__item) {
    padding: 0 8px;
}

:deep(.el-radio-group) {
    .el-radio {
        margin-right: 16px;

        &:last-child {
            margin-right: 0;
        }
    }
}

:deep(.el-dialog__body) {
    padding: 0;
}
</style>