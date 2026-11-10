# Changelog

## v2026.11.10 — Math model selection accessibility

### Added

- 试商、小数加减和小数除法模型的分段选择按钮现在向辅助技术提供 `aria-pressed` 选中状态。

### Changed

- 保留原有视觉选中样式、数学计算和交互回调，仅同步暴露当前选项语义。

### Fixed

- 修复键盘或读屏用户无法确认数学模型当前示例、运算模式或缩放步骤的问题。

### Known Issues

- 真实账号跨设备同步与移动端语音仍需受控验收。

## v2026.11.09 — Geometry model selection accessibility

### Added

- 几何“动手试”模型的步骤与三角形分类按钮现在向辅助技术提供 `aria-pressed` 选中状态。

### Changed

- 保留原有视觉选中样式、几何计算和交互回调，仅同步暴露当前选项语义。

### Fixed

- 修复读屏用户无法判断几何模型当前选中步骤或三角形分类的问题。

### Known Issues

- 真实账号跨设备同步与移动端语音仍需受控验收。

## v2026.11.08 — Language practice result accessibility

### Added

- 语文和英语练习结果现在以命名状态呈现，辅助技术可稳定识别“本课完成”“再练一次”或作品自检待完成状态。

### Changed

- 保留原有结果文案、评分与操作，仅补充 `role="status"` 和结果标题关联。

### Fixed

- 修复语言课程练习结束后结果区域只有 `aria-live`、缺少可定位状态语义的问题。

### Known Issues

- 真实账号跨设备同步与移动端语音仍需受控验收。

## v2026.11.07 — Language practice progress accessibility

### Added

- 语言课程练习进度条现在向辅助技术播报当前题号，例如“练习进度：第 2 / 3 题”。

### Changed

- 无。

### Fixed

- 修复语言练习进度条只有通用名称、读屏用户无法判断当前题目的问题。

### Known Issues

- 真实账号跨设备同步与移动端语音仍需受控验收。

## v2026.11.05.1 — Production security release

### Added

- 新增 `login-with-identifier` Supabase Edge Function，在服务端完成用户名/手机号到 Auth 账号的安全解析与密码授予。

### Changed

- 注册、重置密码与 Supabase Auth 均统一要求至少 8 位密码。

### Fixed

- 撤销匿名和已登录用户对邮箱解析 RPC 的执行权限，浏览器不再能从用户名或手机号读取内部 Auth 邮箱。

### Known Issues

- Supabase Free 方案不支持泄露密码库检查；未升级付费方案。最低 8 位策略已启用作为无成本加固。

## v2026.11.05 — Result score accessibility

### Added

- 练习结束页的得分摘要现在会向辅助技术明确播报“本次得分 X 分，满分 Y 分”。

### Changed

- 无。

### Fixed

- 修复结果标题获得焦点后，读屏用户仍无法从得分徽章获知实际分数和满分的问题。

### Known Issues

- 随 v2026.11.05.1 一并生产发布。

## v2026.11.03 — Practice progress accessibility (unreleased)

### Added

- 练习进度条现在提供当前题号的读屏名称，例如“练习进度：第 2 / 2 题”。

### Changed

- 无。

### Fixed

- 修复练习核心路径的进度条只有百分比、没有可访问名称的问题。

### Known Issues

- 当前远端基线包含尚未完成数据库、PWA 更新及真实账号验收的大型整合；本小版本未部署，避免将其一并发布。

## v2026.10.24 — Match retry focus

### Added

- 无。

### Changed

- 无。

### Fixed

- 配对题放错目标后，焦点现在会回到仍待匹配的项目，学生可立即重新选择继续作答。

### Known Issues

- 已登录课程、云端进度同步与重登回读仍需要受控账号验收。

## v2026.10.22 — Ordering retry focus

### Fixed

- 排列题与时间线题首次答错后，焦点现在会回到可用的排序按钮；学生可以立即调整顺序，不会停在“确认”按钮上。

### Known Issues

- 已登录课程、云端进度同步与重登回读仍需要受控账号验收。

## v2026.10.21 — Fill-blank retry focus

### Fixed

- 填空题首次答错并清空输入后，焦点现在会回到输入框；学生可以立即键入修正答案，不会停在已禁用的“确认”按钮上。

### Known Issues

- 已登录课程、云端进度同步与重登回读仍需要受控账号验收。

## v2026.10.20 — Retry focus continuity

### Fixed

- 选择题和判断题首次答错后，焦点现在会自动移到仍可作答的选项，不再停留在已禁用的错误答案上。

### Known Issues

- 已登录课程、云端进度同步与重登回读仍需要受控账号验收。

## v2026.10.19 — Timed practice admission

### Changed

- 未经教学审查的限时题现在默认以不限时练习呈现，不再自动倒计时。
- 已审查的限时题先由学生选择开始限时或不限时练习，题目会在选择后显示。

### Fixed

- 修复未经审查的限时配置会默认套用 30 秒倒计时的问题。

### Known Issues

- 当前唯一限时题仍待教学时长校准；本版本不把 15 秒视为已验证标准。

## v2026.10.18 — Course result focus

### Fixed

- 完成最后一题后，课程通过或未通过结果的标题会自动获得焦点；键盘与屏幕阅读器用户可立即知道结论并继续下一步。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.17 — 游戏结果状态播报

### Fixed

- 选择、填空、判断、配对、排序、时间线和限时题在判定答案或限时结束后，结果提示现在会作为状态更新被辅助技术播报。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.16 — 首错重试提示播报

### Fixed

- 选择、填空和判断题第一次答错后的“再想想”提示现在会作为状态更新被辅助技术即时播报，同时不泄露答案。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.15 — Choice keyboard continuation

### Fixed

- 从上一题进入选择题时，第一个答案选项会自动获得焦点，可立即用键盘继续作答。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.14 — True-false keyboard continuation

### Fixed

- 从上一题进入判断题时，第一个答案选项会自动获得焦点，可立即用键盘继续作答。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.13 — Timed-challenge keyboard continuation

### Fixed

- 从上一题进入限时选择题时，第一个答案选项会自动获得焦点，可立即用键盘作答。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.12 — Ordering-game keyboard continuation

### Fixed

- 从上一题进入步骤排序或时间线题时，第一个可用的“下移”操作会自动获得焦点；只有一项时则聚焦“确认”。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.11 — Match-game keyboard continuation

### Fixed

- 从上一题进入配对题时，第一个待匹配项目会自动获得焦点，可立即用键盘继续操作。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.10 — Password recovery completion

### Added

- 恢复链接打开后的“设置新密码”页面，含确认输入、长度校验和无效/过期链接提示。

### Fixed

- 密码找回邮件现在会进入可完成改密的页面，不再错误地回到登录页。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.08 — Fill-blank keyboard continuation

### Fixed

- 从已完成题目进入填空题时，答案输入框会自动接收焦点，可直接继续键入答案。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.06 — Keyboard answer flow focus

### Fixed

- 键盘或鼠标作答后，“下一题”或“查看结果”会自动接收焦点，可直接按 Enter 连续推进。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.05 — Modified shortcut guard

### Fixed

- 选择题、限时选择题和判断题现在会忽略 `Ctrl/⌘/Alt` 与选项键的组合，避免全选等系统快捷键误提交答案。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.04 — Judgment keyboard answers

### Added

- 判断题支持键盘 `1/A` 选择“对”、`2/B` 选择“错”，并在题面提示快捷键。

### Fixed

- 让判断题与既有单选、限时单选一样可连续用键盘完成，保留首错后改选的学习反馈。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.03 — Transfer-evidence result clarity

### Changed

- 答题回顾会标明迁移题是否仅在重试后答对，并说明这次不计入首次迁移证据。

### Fixed

- 修正学生答对迁移题却因非首次作答未过关时，结果页未说明真实原因的问题。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.02 — Timed-choice result clarity

### Changed

- 答题回顾按与过关规则一致的分类显示限时单选为选择题。

### Fixed

- 修正限时单选虽不再阻断迁移证据、但仍被回顾界面错误标为“迁移验证”的矛盾提示。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.10.01 — Timed-choice mastery fairness

### Added

- 限时单选不会被当作必须首答正确的迁移验证题的回归测试。

### Changed

- 过关的迁移证据只要求非选择式作答；限时单选继续计入分数，但不额外成为迁移门槛。

### Fixed

- 修正限时选择题答错时，即使学生已独立完成填空迁移题也会被错误阻止过关的问题。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.09.30 — Timed challenge keyboard answers

### Added

- 限时选择题支持 `1–4` 与 `A–D` 键盘快捷作答，并在题面提示可用按键。

### Changed

- 限时题沿用已有选择题的快捷作答方式，不改变计分、超时或证据规则。

### Fixed

- 无。

### Known Issues

- 已登录课程与云端进度回读仍需受控的真实账号验收。

## v2026.09.29 — Judgment retry feedback

### Changed

- 判断题第一次判断错误后会保留题目、给出不泄露答案的提示，并允许改选后再次确认。

### Fixed

- 修正后的判断题答案会计入分数，但不会被记录为首次独立完成证据。

### Known Issues

- 真实登录、远端进度同步及生产环境课程流程仍待授权账号验收。

## v2026.09.28 — Ordering retry feedback

### Changed

- 排列题和时间线题首次排错后保留当前顺序，可调整并再次确认。

### Fixed

- 修正后的排序答案会计入正确分数，但不会被当作首次迁移证据。

### Known Issues

- 真实登录、远端进度同步及生产环境课程流程仍待授权账号验收。

## v2026.09.27 — Corrected drag-match evidence

### Changed

- 配对题完成时分别记录最终答案正确性与是否首次无提示完成。
- 有错误尝试后仍完成配对的反馈改为“已完成但有错误尝试”。

### Fixed

- 已修正的配对题不再被错误记为零分，同时不会被当作首次迁移证据。

### Known Issues

- 真实登录、远端进度同步及生产环境课程流程仍待授权账号验收。

## v2026.09.24 — Retry reset release

### Added

- 判断题失败后重试的组件级回归测试。

### Changed

- 所有游戏题型在“再试一次”时统一重置本题交互状态。

### Fixed

- 判断、拖拽、排序和计时题不再在重试后保留已锁定的上次作答状态。

### Known Issues

- 真实登录、远端进度同步及生产环境课程流程仍待验收。
