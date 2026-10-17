# GitHub Actions 代码质量检查

本方案为 AI Agent 日常研发提供独立于本地工作目录的验证记录。它只检查代码，不发布生产版本，不运行 Vercel CLI、Supabase CLI 或数据库迁移，也不配置生产 environment 或 secrets。

## 1. 接入前核查

核查基线：2026-10-17 的 `main`，提交 `a49cdfb06f648a97354708da7d2d2d8959dc3a94`。

| 项目 | 已核实情况 | 本次处理 |
| --- | --- | --- |
| 依赖 | npm，lockfile v3；627 个 `resolved` 地址使用 npm 镜像 | 保留版本、integrity、依赖图，只把地址统一为 npm 官方源 |
| Node / npm | 原仓库未固定；Vite、Vitest、jsdom、lint-staged 对 Node 有要求 | `.node-version` 固定 Node 24.19.0，`packageManager` 固定 npm 11.9.0 |
| Lint | `npm run lint` 调用 oxlint | 直接作为独立 CI 检查；保持既有 warning/error 规则 |
| 类型 | `npm run typecheck` 调用 `tsc -b` | 独立检查，便于识别类型错误 |
| 测试 | Vitest + jsdom，29 个文件；原 `test` 已禁用 Node 实验性 Web Storage | 保留原脚本，CI 全量运行，增加逐例输出、GitHub 注解与 JUnit |
| 构建 | `tsc -b && vite build`，包含 PWA 构建 | 无生产变量构建；构建成功不代表认证或云端功能已验收 |
| 提交 | 近期使用 `fix:` / `docs:` 前缀；未发现 commitlint | 本次使用 `ci:`；不新增提交信息强制规则 |
| 本地 hook | Husky pre-commit 执行 lint-staged、类型检查、全量测试 | CI 直接调用 npm 脚本，并设置 `HUSKY=0`，不依赖 hook 安装 |
| 发布 | 10-17 报告包含本地验证、main 推送、显式 Vercel 发布，也记录了现有 Git 集成生产部署 | 保留既有发布流程；本次不合并 main，不调用部署或修改 Vercel 项目 |
| GitHub CI | 基线树没有 `.github/workflows/`；Actions runs API 返回 0 条 | 新增 `.github/workflows/ci.yml` |
| main 保护 | branches API 返回 `protected=false`，`required_status_checks` 为 off，contexts/checks 为空；rulesets 列表为空 | 提供下方配置步骤；未修改管理设置 |
| 权限边界 | 仓库响应包含用户 `push/admin=true`，但当前集成读取保护详情返回 403 `Resource not accessible by integration` | 用户权限与连接可调用能力分开记录，不将用户 admin 字段当作集成有管理权限 |

原始依据：[package.json](../package.json)、[Vite 配置](../vite.config.ts)、[Agent 规范](../AGENTS.md)、[10-17 发布报告](daily-release-report-2026-10-17.md)、[分支接口](https://api.github.com/repos/sail083/math-k6/branches/main)、[rulesets](https://api.github.com/repos/sail083/math-k6/rulesets?includes_parents=true)、[Actions runs](https://api.github.com/repos/sail083/math-k6/actions/runs?per_page=10)。这些接口反映查询时状态；以后应重新核验。

## 2. 工作流与失败反馈

工作流名为 `Code quality`，触发条件为：所有 PR 的打开、更新、重新打开；main 的 push；merge queue 的 `checks_requested`；手动 `workflow_dispatch`。不加路径过滤，文档修改也生成完整检查，避免必需检查一直 Pending。

| GitHub job 名称 | 命令 | 报告目录 |
| --- | --- | --- |
| `Quality / Lint` | `npm run lint` | `reports/lint/` |
| `Quality / TypeScript` | `npm run typecheck` | `reports/typecheck/` |
| `Quality / Unit tests` | `npm run test:ci` | `reports/unit/` |
| `Quality / Production build` | `npm run build` | `reports/build/` |
| `Quality / Course content` | `npm run test:content:ci` | `reports/content/` |
| `CI required` | 检查五个矩阵任务的整体结果必须为 `success` | GitHub 检查结果 |

- 每个矩阵任务使用独立的 Ubuntu 24.04 runner，默认 checkout 仓库根目录。PR 使用 GitHub 生成的测试合并提交，main push 使用该次提交；不把 PR checkout 强制改为 head。
- checkout / setup-node / upload-artifact 固定完整 SHA，避免 action 标签变化影响结果。Node 使用精确版本，npm 按 `packageManager` 安装，再运行 `npm ci --include=dev`；不会静默回退到 `npm install`。
- npm cache 按 `package-lock.json` 缓存包下载，**不缓存 `node_modules` 或构建增量状态**。锁文件不匹配时安装应失败。缓存命中与否不改变锁定版本和 integrity 检查。
- 每个任务固定 `CI=true`、`TZ=UTC`、`LANG=C.UTF-8`，显式清空 Supabase 公共变量；测试保留仓库已有的 mock/占位客户端机制。全量测试与课程测试都最多使用 2 个 worker。
- `fail-fast: false` 让一项失败后其余任务继续给出结果。命令通过 `tee` 保存 stdout/stderr，Bash 的 `pipefail` 保留非零退出状态；没有 `continue-on-error`。
- `CI required` 使用 `needs` 与 `always()`，任何检查失败、取消或跳过都不能被汇总为成功。PR 新提交会取消该 PR 的旧运行；main 运行不主动取消。
- 每项检查生成独立 artifact：`quality-<id>-<run_attempt>`，保留 14 天。包含环境版本/提交/lock 哈希、依赖安装日志、命令日志；测试任务另有 `junit.xml`，失败断言会产生 GitHub 文件行注解。
- artifact 上传和结果摘要使用 `always()`。测试启动前失败时可能没有 JUnit，可从环境/安装日志定位；runner 完全丢失或被强制终止时，无法保证最后一步成功上传。
- `permissions: contents: read`，checkout 不保留 Git 凭据；使用 `pull_request`，不使用 `pull_request_target`。不请求写评论、写检查、部署、OIDC 或生产 secrets 权限。

定位顺序：打开 PR 的失败检查 → 找到失败步骤 → 阅读输出末尾的错误及断言 → 下载该 job 的 `quality-*` artifact → 使用相同提交与下方命令复现。修复后推送新提交；确认为临时网络故障时才重跑失败 job。

## 3. 课程内容能否独立检查

可以，`test:content` 单独选取已有四个回归文件，`test:content:ci` 增加相同的 CI 报告参数，不复制测试实现：

| 测试文件 | 已有检查范围 |
| --- | --- |
| `src/test/content.test.ts` | 57 门数学课程索引、内容加载、题量、非选择掌握题、前置关系/顺序、进阶课程、D1/D7 复习和题目 ID 等 |
| `src/test/knowledgeGraph.test.ts` | 知识图谱校验、节点/边引用、无环依赖、分数题技能映射及相关路径/进度回归 |
| `src/test/courseApplicationModel.test.tsx` | 已上线进阶课程模型的交互及数学结果回归 |
| `src/test/languageLearning.test.tsx` | 3 门语文、6 门英语的内容与答案基线，以及同文件中的朗读、练习、同步 mock 回归 |

这是基于现有套件的课程质量子集，仍使用 jsdom；语言文件并非纯静态数据校验，因此也执行其已有 UI 回归。所有这些测试仍由全量 `test:ci` 执行一次；课程 job 是便于独立识别问题的重复检查，不能代替全量测试。

本次不修改课程数量断言、不抽样、不新增课程、不判定限时设置是否适合儿童。通过上述测试只证明已编码的课程规则成立，不证明所有题目在数学、难度、教研和学习效果上均已审定；新增课程仍需按实际交付同步更新既有数量及内容断言。

## 4. Agent 从任意目录复现

先用自己的 Node 管理器切到 `.node-version` 指定的版本。以下示例假设使用 nvm，`repo` 改为当前 checkout 的绝对路径：

```bash
repo=/absolute/path/to/math-k6
cd "$repo"
nvm install "$(cat .node-version)"
nvm use "$(cat .node-version)"
npm install --global "$(node -p "require('./package.json').packageManager")" --registry=https://registry.npmjs.org/ --no-audit --no-fund
export CI=true TZ=UTC LANG=C.UTF-8 HUSKY=0
export VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY=''
unset NODE_ENV
npm ci --include=dev --no-audit --no-fund
npm run lint
npm run typecheck
npm run test:ci
npm run test:content:ci
npm run build
git diff --check
```

安装后，也可以在其他目录用 `npm --prefix /absolute/path/to/math-k6 run test:ci` 等命令。npm 在该 package 根目录运行脚本，Vite glob、alias 和报告路径不会落入 Agent 的其他工作目录。不要直接在任意目录调用另一个 checkout 的 `node_modules/.bin/vitest`。

原 `npm run test` 与 `test:watch` 保持不变；不需要 CI 报告时可运行 `npm run test:content`。`reports/` 已加入 gitignore，不应把机器绝对路径、日志或测试报告提交进仓库。

## 5. 必需状态检查的配置

工作流成功不等于已经强制阻止绕过。配置由仓库管理员完成，当前工具连接没有对应的管理写入能力，本次未修改这些设置。

1. 将本次文件提交到独立分支，打开指向 main 的 PR，确认真实 `pull_request` 运行生成并且五项检查和 `CI required` 均成功。先运行再选检查名称；GitHub 要求被选检查在最近 7 天成功过。第一次创建工作流时，`workflow_dispatch` 入口可能要等文件进入默认分支才出现，不能把手动运行当作 PR 必需检查的替代证据。
2. 打开仓库 **Settings → Rules → Rulesets → New branch ruleset**，目标设置为默认分支或 `main`，Enforcement status 设为 **Active**。也可使用 **Settings → Branches → Add branch protection rule**，但不要同时叠加互相冲突的规则。
3. 启用 **Require a pull request before merging** 和 **Require status checks to pass**；添加精确名称 **`CI required`**，有来源选择时指定 **GitHub Actions**。五个 `Quality / …` job 保持可见，单独设为必需是可选的；必须保留汇总检查。
4. 建议启用 **Require branches to be up to date before merging**。不要给日常 Agent 配置 bypass，经典保护规则下启用对管理员也生效的相应选项；否则直接 main 推送仍可能绕过 PR 门禁。若启用 merge queue，本工作流已经包含 `merge_group`。
5. 用一个真实 PR 验收：有意制造 Lint/类型/测试/构建中的一个失败，确认 `CI required` 失败且合并按钮被阻止；恢复后推送新提交，确认最新测试提交通过才能合并。该分支保护端到端验收需要规则生效，不能用本地命令冒充。

Agent 日常流程：从最新 main 建分支 → 实现及本地检查 → 用 `ci:`/`fix:`/`feat:`/`docs:` 等合适前缀提交 → 打开 PR → 检查本次提交对应的 GitHub run → 修复失败 → 按现有权限评审/合并 → main 再验证 → 独立按既有授权发布。交付记录必须分别列出本地验证、GitHub run 和生产发布；本工作流通过时不写“已上线”。

自动 Agent 如果在另一个 Actions 工作流内使用 `GITHUB_TOKEN` 推送/开 PR，须额外确认 run 确实生成：由该 token 产生的事件存在递归触发限制，PR 创建/更新也可能进入等待批准状态。需要跨工作流触发时使用已获授权的 GitHub App 或适当的用户令牌；不能靠加 `[skip ci]`、放宽门禁或手动 dispatch 掩盖缺失的 PR 检查。

## 6. 验证记录与权限边界

本地验证日期：2026-10-17（Asia/Shanghai）。环境：Linux、Node 24.19.0、npm 11.9.0；未配置生产公共变量或密钥。

| 验证项 | 结果 |
| --- | --- |
| 干净依赖安装 | `npm ci --include=dev --prefer-offline --no-audit --no-fund` 退出 0，安装 539 个适用当前平台的包；完整 lock 包含其他平台的可选依赖 |
| Lint | 退出 0，32 条仓库原有 Fast Refresh/hooks warning；未放宽规则 |
| TypeScript | `npm run typecheck` 退出 0 |
| 全量单测 | `npm run test:ci` 退出 0；29 个文件、612 项通过，JUnit failures/errors 均为 0 |
| 课程子集/跨目录 | 从 checkout 外用 `npm --prefix <repo> run test:content:ci` 执行；4 个文件、159 项通过，JUnit 写回正确仓库 |
| 生产构建 | `npm run build` 退出 0；Vite 与 PWA 产物均生成；未部署 |
| 依赖差异 | 程序逐项比对：只更换 627 个下载地址，版本、integrity、依赖结构均不变 |
| YAML / Actions 语法 | YAML 解析与 `actionlint 1.7.12 -shellcheck= .github/workflows/ci.yml` 通过；另外对 5 段 run 脚本执行 Bash 语法检查 |
| 失败报告链路 | 临时失败用例经过同一 `test:ci` + `tee` 管道：退出 1，JUnit failures=1，包含文件/行号的 `::error` 注解；验证后删除临时用例，再跑上述全量测试 |
| 汇总判定 | 本地执行 gate 脚本：仅 success 返回 0；failure/cancelled/skipped 均返回 1 |
| 差异空白检查 | `git diff --check` 通过 |
| 真实 GitHub Actions | 等待把工作流写入 GitHub 并生成真实 run；本地通过不能替代 runner、缓存、artifact 上传及 PR 事件验收 |
| main push / merge queue / 必需检查阻止合并 | 尚未执行；本次不合并 main 或变更保护设置 |

当前连接已完成仓库/文件读取、分支状态与 rulesets 查询；保护详情读取返回 403。具备普通代码分支/PR 操作工具，但 `.github/workflows/*` 写入还受 GitHub App 的 **Workflows: write**（或适用令牌的 workflow 权限）限制。是否能实际写入以 API 返回为准，不能仅根据仓库 `push=true` 推断。

分支保护设置、Actions 启用/策略和工作流文件写入是三个不同权限点。若集成不能写 workflow，使用交付补丁由有相应权限的账号提交；不需要提供任何 Vercel 或 Supabase 密钥。只在 PR 分支提交，避免现有 main Git 集成产生生产部署；本次不合并 main。

### 官方参考

- [GitHub：Node.js 构建与测试](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [GitHub：工作流语法、permissions、matrix、concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub：必需检查与跳过/失败处理](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub：工作流触发与 GITHUB_TOKEN 限制](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Vitest v4：reporters 与 JUnit](https://v4.vitest.dev/guide/reporters)
- [actions/setup-node](https://github.com/actions/setup-node)、[actions/upload-artifact](https://github.com/actions/upload-artifact)
