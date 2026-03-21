import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Send, Bot, History, Cpu, Zap, ChevronDown, ChevronRight, 
  BarChart3, Settings, Play, Activity, MessageSquare, Folder,
  GitBranch, Sparkles, LayoutGrid, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ==================== 类型定义 ====================

interface Agent {
  id: string
  name: string
  provider: string
  model: string
  strengths: string[]
  radar: { category: string; value: number }[]
  enabled: boolean
  taskCount: number
  status: 'idle' | 'busy' | 'offline'
}

interface SubTask {
  id: string
  targetAgent: string
  instruction: string
  result?: string
  score?: number
}

interface Message {
  id: string
  role: 'user' | 'system' | 'protocol' | 'jury'
  content: string
  timestamp: Date
  subTasks?: SubTask[]
  finalScore?: number
}

interface HistoryItem {
  id: string
  title: string
  time: string
  preview: string
}

interface TaskItem {
  id: string
  name: string
  status: 'running' | 'completed' | 'pending'
}

// ==================== 常量 ====================

const AGENTS: Agent[] = [
  { 
    id: 'deepseek-v3', 
    name: 'DeepSeek-V3', 
    provider: '深度求索', 
    model: 'DeepSeek-V3',
    strengths: ['逻辑推理', '数学计算', '代码生成', '结构化分析'],
    radar: [
      { category: '逻辑推理', value: 95 },
      { category: '创意写作', value: 60 },
      { category: '长文本', value: 70 },
      { category: '综合问答', value: 80 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'doubao', 
    name: '豆包', 
    provider: '字节跳动', 
    model: 'Doubao-Pro',
    strengths: ['创意写作', '文案优化', '内容润色', '灵感激发'],
    radar: [
      { category: '逻辑推理', value: 55 },
      { category: '创意写作', value: 95 },
      { category: '长文本', value: 75 },
      { category: '综合问答', value: 70 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'kimi', 
    name: 'Kimi', 
    provider: '月之暗面', 
    model: 'Kimi-S1',
    strengths: ['长文本分析', '文档理解', '深度阅读', '信息提取'],
    radar: [
      { category: '逻辑推理', value: 75 },
      { category: '创意写作', value: 65 },
      { category: '长文本', value: 98 },
      { category: '综合问答', value: 85 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'tongyi', 
    name: '通义千问', 
    provider: '阿里云', 
    model: 'Qwen-Max',
    strengths: ['综合问答', '知识广博', '多语言', '技术解释'],
    radar: [
      { category: '逻辑推理', value: 80 },
      { category: '创意写作', value: 75 },
      { category: '长文本', value: 85 },
      { category: '综合问答', value: 92 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  }
]

const AGENT_COLORS: Record<string, string> = {
  'deepseek-v3': '#5E5CF5',
  'doubao': '#FF6B35',
  'kimi': '#00BFFF',
  'tongyi': '#FF69B4'
}

type CollaborationMode = 'standard' | 'consensus' | 'jury'

// ==================== 辅助组件 ====================

function DonutChart({ agents }: { agents: Agent[] }) {
  const enabledAgents = agents.filter(a => a.enabled)
  const total = enabledAgents.reduce((sum, a) => sum + a.taskCount, 0) || 1
  
  let currentAngle = 0
  const segments = enabledAgents.map(agent => {
    const percentage = (agent.taskCount / total) * 100
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    currentAngle += angle
    return { ...agent, percentage, startAngle, endAngle: currentAngle }
  })

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg) => {
          const radius = 40
          const circumference = 2 * Math.PI * radius
          const strokeDasharray = circumference
          const strokeDashoffset = circumference - (seg.percentage / 100) * circumference
          
          return (
            <circle
              key={seg.id}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={AGENT_COLORS[seg.id] || '#6366f1'}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'all 0.5s ease-out',
                strokeLinecap: 'round'
              }}
            />
          )
        })}
      </svg>
      <div className="donut-center">
        <div className="donut-center-value">{total}</div>
        <div className="donut-center-label">Tasks</div>
      </div>
    </div>
  )
}

function RadarChart({ data, color = '#6366f1' }: { data: { category: string; value: number }[], color?: string }) {
  const size = 100
  const center = size / 2
  const maxRadius = 35
  
  const angleStep = (2 * Math.PI) / data.length
  
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const radius = (d.value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    }
  })
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart">
      {[25, 50, 75, 100].map(level => (
        <circle
          key={level}
          cx={center}
          cy={center}
          r={(level / 100) * maxRadius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      <path
        d={pathD}
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  )
}

// ==================== 主应用 ====================

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTasks, setActiveTasks] = useState<TaskItem[]>([])
  
  const [collabModeExpanded, setCollabModeExpanded] = useState(false)
  const [collaborationMode, setCollaborationMode] = useState<CollaborationMode>('standard')
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const totalTasks = agents.reduce((sum, a) => sum + a.taskCount, 0)
  const enabledAgents = agents.filter(a => a.enabled)
  const onlineCount = enabledAgents.filter(a => a.status !== 'offline').length
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 决策AI拆分指令为子任务
  const splitTask = useCallback((userInput: string): SubTask[] => {
    // 根据输入内容智能拆分
    const subTasks: SubTask[] = []
    const inputLower = userInput.toLowerCase()
    
    // 逻辑分析任务
    if (inputLower.includes('分析') || inputLower.includes('逻辑') || inputLower.includes('计算') || inputLower.includes('代码')) {
      subTasks.push({
        id: `task-${Date.now()}-1`,
        targetAgent: 'deepseek-v3',
        instruction: `逻辑分析: ${userInput}`
      })
    }
    
    // 创意写作任务
    if (inputLower.includes('写') || inputLower.includes('创作') || inputLower.includes('文案') || inputLower.includes('诗')) {
      subTasks.push({
        id: `task-${Date.now()}-2`,
        targetAgent: 'doubao',
        instruction: `创意写作: ${userInput}`
      })
    }
    
    // 长文本任务
    if (inputLower.includes('长') || inputLower.includes('文档') || inputLower.includes('阅读') || userInput.length > 200) {
      subTasks.push({
        id: `task-${Date.now()}-3`,
        targetAgent: 'kimi',
        instruction: `长文本处理: ${userInput}`
      })
    }
    
    // 综合问答（默认添加）
    subTasks.push({
      id: `task-${Date.now()}-4`,
      targetAgent: 'tongyi',
      instruction: `综合回答: ${userInput}`
    })
    
    // 去重
    return subTasks.filter((task, index, self) => 
      index === self.findIndex(t => t.targetAgent === task.targetAgent)
    )
  }, [])

  // 模拟AI执行子任务
  const executeSubTask = async (subTask: SubTask): Promise<SubTask> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
    
    const agent = agents.find(a => a.id === subTask.targetAgent)
    const results: Record<string, string> = {
      'deepseek-v3': `【逻辑分析结果】\n\n针对"${subTask.instruction.replace('逻辑分析: ', '')}"的分析：\n\n1. 问题核心识别\n2. 逻辑结构拆解\n3. 关键要素提取\n4. 结论推导\n\n分析完成。`,
      'doubao': `【创意内容】\n\n${subTask.instruction.includes('诗') ? '春风拂面，万物苏醒\n绿意盎然，花开满地\n阳光温暖，鸟语花香\n人间四月，诗意盎然' : '【创意写作完成】\n\n根据您的要求，已完成创意内容生成。'}`,
      'kimi': `【长文本理解】\n\n已理解您的输入内容：\n"${subTask.instruction.replace('长文本处理: ', '').slice(0, 50)}..."\n\n提取关键信息点，进行深度理解与分析。`,
      'tongyi': `【综合回答】\n\n综合各维度信息，为您提供完整回答：\n\n${subTask.instruction.replace('综合回答: ', '')}\n\n以上是综合处理结果。`
    }
    
    return {
      ...subTask,
      result: results[subTask.targetAgent] || '处理完成',
      score: 70 + Math.floor(Math.random() * 25) // 70-95分
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    
    const userInput = input.trim()
    
    // 用户消息
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    
    // 决策AI拆分指令的协议日志
    const subTasks = splitTask(userInput)
    const routingAgents = subTasks.map(t => agents.find(a => a.id === t.targetAgent)?.name).filter(Boolean)
    
    const protocolMsg: Message = {
      id: `msg-${Date.now()}-protocol`,
      role: 'protocol',
      content: `[DECISION_AI]: 指令拆分完成\n[SYS_ROUTING]: "${userInput.slice(0, 40)}${userInput.length > 40 ? '...' : ''}" -> [${routingAgents.join(', ')}]`,
      timestamp: new Date(),
      subTasks: subTasks
    }
    
    setMessages(prev => [...prev, userMsg, protocolMsg])
    setInput('')
    setLoading(true)
    
    // 更新AI状态为忙碌
    setAgents(prev => prev.map(a => 
      subTasks.some(t => t.targetAgent === a.id) ? { ...a, taskCount: a.taskCount + 1, status: 'busy' as const } : a
    ))
    
    // 执行所有子任务
    const executedTasks: SubTask[] = []
    for (const subTask of subTasks) {
      const result = await executeSubTask(subTask)
      executedTasks.push(result)
      
      // 实时更新该任务的执行状态
      setMessages(prev => prev.map(m => 
        m.id === protocolMsg.id 
          ? { ...m, subTasks: executedTasks }
          : m
      ))
    }
    
    // 模拟评审团评价结果
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const avgScore = executedTasks.reduce((sum, t) => sum + (t.score || 0), 0) / executedTasks.length
    const passThreshold = 75
    const passed = avgScore >= passThreshold
    
    // 评审团消息
    const juryMsg: Message = {
      id: `msg-${Date.now()}-jury`,
      role: 'jury',
      content: `【评审团评价结果】\n\n${executedTasks.map(t => {
        const agentName = agents.find(a => a.id === t.targetAgent)?.name
        const status = (t.score || 0) >= passThreshold ? '✓ 通过' : '✗ 需优化'
        return `${agentName}: ${t.score}分 ${status}`
      }).join('\n')}\n\n平均分: ${avgScore.toFixed(1)}/100\n最终判定: ${passed ? '✓ 采用' : '✗ 重新处理'}`,
      timestamp: new Date(),
      subTasks: executedTasks,
      finalScore: avgScore
    }
    
    // 最终输出结果
    const systemMsg: Message = {
      id: `msg-${Date.now()}-system`,
      role: 'system',
      content: `【最终输出】\n\n${executedTasks.map(t => {
        const agentName = agents.find(a => a.id === t.targetAgent)?.name
        return `## ${agentName} 的输出\n\n${t.result}`
      }).join('\n\n---\n\n')}`,
      timestamp: new Date(),
      subTasks: executedTasks,
      finalScore: avgScore
    }
    
    setMessages(prev => [...prev, juryMsg, systemMsg])
    setLoading(false)
    
    // 重置AI状态
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const })))
    
    // 添加到历史
    setHistory(prev => [{
      id: userMsg.id,
      title: userInput.slice(0, 25) + (userInput.length > 25 ? '...' : ''),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      preview: userInput.slice(0, 40)
    }, ...prev])
    
  }, [input, loading, agents, splitTask])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, enabled: !a.enabled } : a
    ))
  }
  
  const toggleAgentDetails = (agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev)
      if (next.has(agentId)) next.delete(agentId)
      else next.add(agentId)
      return next
    })
  }

  return (
    <div className="app-container">
      {/* 头部 */}
      <header className="header">
        <div className="header-title">
          <Sparkles size={24} />
          <span>M.A.S.T.E.R. System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-status">
            <span className="status-dot"></span>
            <span>决策中枢: Gemini-3-Pro</span>
          </div>
          <button className="settings-btn" disabled>
            <Settings size={14} style={{ marginRight: 6 }} />
            系统设置
          </button>
        </div>
      </header>

      {/* 左侧栏 */}
      <aside className="panel">
        <div className="panel-header">
          <LayoutGrid size={14} />
          控制面板
        </div>
        
        <div className="history-section">
          <div className="section-title">
            <History size={12} />
            历史记录
          </div>
          {history.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              暂无历史记录
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-item-title">{item.title}</div>
                <div className="history-item-time">{item.time}</div>
              </div>
            ))
          )}
        </div>
        
        <div className="task-section">
          <div className="section-title">
            <Play size={12} />
            任务分区
          </div>
          {messages.filter(m => m.role === 'protocol' && m.subTasks?.some(t => !t.result)).length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              暂无运行中的任务
            </div>
          ) : (
            messages.filter(m => m.role === 'protocol').slice(-1)[0]?.subTasks?.map(task => (
              <div key={task.id} className="task-item">
                <div className={task.result ? 'task-spinner' : ''} style={task.result ? {} : { background: '#10b981', borderRadius: '50%', width: 16, height: 16 }}></div>
                <div className="task-info">
                  <div className="task-name">{agents.find(a => a.id === task.targetAgent)?.name}</div>
                  <div className="task-status">{task.result ? '已完成' : '处理中...'}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="panel-content">
          <div className="section-title" style={{ marginTop: 'auto', paddingTop: '20px', opacity: 0.5 }}>
            <Folder size={12} />
            数据管理
          </div>
        </div>
      </aside>

      {/* 中间栏 */}
      <main className="panel chat-container">
        <div className="panel-header">
          <MessageSquare size={14} />
          核心交互区
          <span className="badge badge-jury">
            <Sparkles size={10} />
            {collaborationMode === 'jury' ? '评审团' : collaborationMode === 'consensus' ? '讨论共识' : '标准分工'}
          </span>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>欢迎使用 M.A.S.T.E.R.</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                决策中枢将指令拆分给各AI节点执行<br/>
                评审团在后台评价AI的输出结果
              </p>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`message ${msg.role === 'user' ? 'message-user' : msg.role === 'system' ? 'message-system' : ''}`}
              >
                {msg.role === 'system' && (
                  <div className="message-meta">
                    🤖 最终输出
                    {msg.finalScore && (
                      <span style={{ marginLeft: 8, color: msg.finalScore >= 75 ? '#10b981' : '#f59e0b' }}>
                        评分: {msg.finalScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
                {msg.role === 'protocol' && (
                  <div className="message-protocol">
                    <span className="protocol-tag">DECISION_AI</span>
                    <div style={{ marginTop: 4 }}>{msg.content.split('\n')[1]}</div>
                  </div>
                )}
                {msg.role === 'jury' && (
                  <div className="message-meta" style={{ color: '#10b981' }}>
                    ⚖️ 评审团评价结果
                    {msg.finalScore && (
                      <span style={{ marginLeft: 8 }}>平均分: {msg.finalScore.toFixed(1)}</span>
                    )}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="message message-system"
            >
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>决策AI拆分指令 -> 分发执行 -> 评审团评分中...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              className="chat-input"
              placeholder="输入指令，决策AI将自动拆分并分发..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              className="send-button" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
              发送
            </button>
          </div>
        </div>
      </main>

      {/* 右侧栏 */}
      <aside className="panel">
        <div className="panel-header">
          <div className="right-panel-header" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={14} />
              智能功能面板
            </div>
          </div>
        </div>
        
        <div className="resource-section">
          <div className="resource-header">
            <div className="resource-title">
              <Activity size={12} />
              资源概览
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {onlineCount} / {enabledAgents.length} 在线
            </span>
          </div>
          
          <DonutChart agents={agents} />
          
          <div className="resource-legend">
            {enabledAgents.map(agent => (
              <div key={agent.id} className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: AGENT_COLORS[agent.id] }}/>
                <span>{agent.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>({agent.taskCount})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="collab-mode-section">
          <div className="mode-header" onClick={() => setCollabModeExpanded(!collabModeExpanded)}>
            <div className="mode-title">
              <GitBranch size={12} />
              协作模式
              <span style={{ 
                marginLeft: 8, 
                padding: '2px 8px', 
                borderRadius: 4, 
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--color-accent-primary)',
                fontSize: 10
              }}>
                {collaborationMode === 'jury' ? '评审团' : collaborationMode === 'consensus' ? '讨论共识' : '标准分工'}
              </span>
            </div>
            <ChevronDown size={16} style={{ transform: collabModeExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--color-text-muted)' }} />
          </div>
          
          <AnimatePresence>
            {collabModeExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mode-content">
                <div className="mode-buttons">
                  <button className={`mode-btn ${collaborationMode === 'standard' ? 'active' : ''}`} onClick={() => setCollaborationMode('standard')}>标准分工</button>
                  <button className={`mode-btn ${collaborationMode === 'consensus' ? 'active' : ''}`} onClick={() => setCollaborationMode('consensus')}>讨论共识</button>
                  <button className={`mode-btn ${collaborationMode === 'jury' ? 'active' : ''}`} onClick={() => setCollaborationMode('jury')}>评审团</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="agents-section">
          <div className="agents-header">
            <div className="agents-title"><Zap size={12} />智能节点</div>
            <span className="agents-count">{onlineCount} 在线</span>
          </div>
          
          <div className="agents-list">
            {agents.map(agent => (
              <motion.div key={agent.id} layout className={`agent-card ${agent.enabled ? 'enabled' : ''}`}>
                <div className="agent-card-header">
                  <div className="agent-toggle-area">
                    <div className={`toggle-switch ${agent.enabled ? 'active' : ''}`} onClick={() => toggleAgent(agent.id)}/>
                    <button className={`fold-btn ${expandedAgents.has(agent.id) ? 'expanded' : ''}`} onClick={() => toggleAgentDetails(agent.id)}><ChevronDown size={14}/></button>
                  </div>
                  
                  <div className="agent-info">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="agent-name">{agent.name}</span>
                      <span className={`agent-task-badge ${agent.taskCount === 0 ? 'idle' : 'busy'}`}>
                        {agent.taskCount > 0 ? `${agent.taskCount} 任务` : '空闲'}
                      </span>
                    </div>
                    <div className="agent-provider">{agent.provider} · {agent.model}</div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedAgents.has(agent.id) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="agent-details expanded">
                      <div className="detail-row">
                        <span className="detail-label">状态</span>
                        <span className={`detail-value ${agent.enabled ? 'online' : 'offline'}`}>{agent.enabled ? '在线' : '离线'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">今日任务</span>
                        <span className="detail-value">{agent.taskCount}</span>
                      </div>
                      <RadarChart data={agent.radar} color={AGENT_COLORS[agent.id]} />
                      <div className="agent-strengths">
                        {agent.strengths.map((s, i) => <span key={i} className="strength-tag">{s}</span>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}