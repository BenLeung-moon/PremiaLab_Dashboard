# PremiaLab Dashboard

基于React构建的投资组合分析仪表板，支持中英文双语界面。

## 项目架构

```
frontend
├── src
│   ├── features
│   │   ├── dashboard        # 仪表板功能模块
│   │   │   ├── components   # 仪表板相关组件
│   │   │   │   ├── AssetAllocation.tsx      # 资产配置组件
│   │   │   │   ├── Comparison.tsx           # 基准比较组件
│   │   │   │   ├── FactorExposure.tsx       # 因子暴露组件
│   │   │   │   ├── HistoricalTrends.tsx     # 历史趋势组件
│   │   │   │   ├── PerformanceMetrics.tsx   # 绩效指标组件
│   │   │   │   ├── PortfolioComposition.tsx # 投资组合构成组件
│   │   │   │   └── RiskMetrics.tsx          # 风险指标组件
│   │   │   └── Dashboard.tsx  # 主仪表板组件
│   │   └── common            # 通用功能模块
│   │       └── components    # 通用组件
│   ├── shared                # 共享资源
│   │   ├── components        # 共享组件
│   │   │   └── TimePeriodSelector.tsx  # 时间周期选择器组件
│   │   ├── i18n              # 国际化资源
│   │   │   ├── LanguageContext.tsx  # 语言上下文
│   │   │   └── translations   # 翻译文件
│   │   │       ├── en.ts      # 英文翻译
│   │   │       └── zh.ts      # 中文翻译
│   │   ├── services          # 共享服务
│   │   │   └── portfolioService.ts  # 投资组合服务API
│   │   ├── utils             # 工具函数
│   │   │   └── formatting.ts  # 格式化工具
│   │   └── config            # 配置文件
│   │       └── constants.ts   # 常量定义
│   └── app                   # 应用核心
└── public                    # 静态资源
```

## 组件说明

### Dashboard.tsx
主仪表板组件，负责整合所有子组件并管理全局状态。提供了以下功能：

- 切换不同指标视图（绩效、持仓、资产配置等）
- 接收并分发投资组合数据
- 管理语言切换
- 处理错误和加载状态

### 主要子组件

- **PerformanceMetrics**: 显示关键绩效指标，如总回报、年化回报率、夏普比率等
- **FactorExposure**: 展示投资组合的因子暴露和分析
- **RiskMetrics**: 展示风险指标，如波动率、下行风险、最大回撤等
- **HistoricalTrends**: 显示历史表现趋势和月度回报
- **AssetAllocation**: 显示资产配置分布（行业、地区、市值）
- **Comparison**: 与基准比较的绩效分析
- **PortfolioComposition**: 投资组合持仓明细

## 共享组件

### TimePeriodSelector

新添加的时间周期选择器组件，用于统一Dashboard中各个子组件的时间段选择UI和逻辑。

#### 特点
- 支持多种时间范围：YTD、1年、3年、5年等
- 可选择是否显示"全部时间"选项
- 支持左、中、右三种对齐方式
- 内置API参数映射功能，简化与后端交互
- 完全支持中英文双语界面

#### 使用方法

```tsx
import TimePeriodSelector, { TimeFrame } from '../../../shared/components/TimePeriodSelector';

const MyComponent = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('oneYear');
  
  return (
    <div>
      <TimePeriodSelector 
        selectedTimeFrame={selectedTimeFrame}
        onChange={setSelectedTimeFrame}
        showAll={true}
        position="right"
        className="mb-4"
      />
    </div>
  );
}
```

#### 属性说明
- `selectedTimeFrame`: 当前选中的时间周期
- `onChange`: 时间周期变更回调函数
- `showAll`: 是否显示"全部"选项（默认为false）
- `className`: 自定义CSS类名
- `position`: 选择器对齐位置（'left'|'right'|'center'，默认为'right'）

#### API参数映射
组件提供`getApiTimeFrame`函数，可将UI使用的TimeFrame类型映射为API调用所需参数。具体实现时，不同组件可能需要做进一步适配，如HistoricalTrends组件中的`getApiPeriodParam`函数。

## 国际化支持

仪表板支持中英文双语界面，通过LanguageContext实现语言切换功能。所有文本内容都通过翻译函数`t()`访问，确保跨语言的一致性和可维护性。

## 数据服务

portfolioService.ts提供了与后端API交互的方法，主要功能包括：

- 获取投资组合数据
- 获取投资组合分析
- 获取历史趋势数据
- 提交新的投资组合

API支持不同的时间周期参数，便于获取指定时间段的数据。 