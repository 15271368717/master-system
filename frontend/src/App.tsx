import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Send, Bot, History, Cpu, Zap, ChevronDown, ChevronRight, 
  BarChart3, Settings, Play, Activity, MessageSquare, Folder,
  GitBranch, Sparkles, LayoutGrid
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

interface Message {
  id: string
  role: 'user' | 'system' | 'protocol'
  content: string
  timestamp: Date
  agents?: string[]
  mode?: 'standard' | 'consensus' | 'jury'
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
    taskCount: 3, 
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
    taskCount: 2, 
    status: 'busy' 
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
    taskCount: 1, 
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
    taskCount: 2, 
    status: 'idle' 
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    provider: 'Google', 
    model: 'Gemini-3-Pro',
    strengths: ['决策中枢', '任务规划', '成果整合', '质量评估'],
    radar: [
      { category: '逻辑推理', value: 98 },
      { category: '创意写作', value: 90 },
      { category: '长文本', value: 95 },
      { category: '综合问答', value: 98 }
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
  'tongyi': '#FF69B4',
  'gemini': '#10A37F'
}

type CollaborationMode = 'standard' | 'consensus' | 'jury'

// ==================== 辅助组件 ====================

// 环形图组件
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
        {segments.map((seg, i) => {
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

// 雷达图组件
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
      {/* 背景网格 */}
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
      
      {/* 数据区域 */}
      <path
        d={pathD}
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
        />
      ))}
    </svg>
  )
}

// ==================== 主应用 ====================

export default function App() {
  // 状态
  const [agents, setAgents] = useState<Agent[]>(AGENTS)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTasks, setActiveTasks] = useState<TaskItem[]>([])
  
  // 右侧面板状态
  const [collabModeExpanded, setCollabModeExpanded] = useState(false)
  const [collaborationMode, setCollaborationMode] = useState<CollaborationMode>('jury')
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 计算统计数据
  const totalTasks = agents.reduce((sum, a) => sum + a.taskCount, 0)
  const enabledAgents = agents.filter(a => a.enabled)
  const onlineCount = enabledAgents.filter(a => a.status !== 'offline').length
  
  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    
    const userInput = input.trim()
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    
    const protocolMsg: Message = {
      id: `msg-${Date.now()}-protocol`,
      role: 'protocol',
      content: `[SYS_ROUTING]: "${userInput.slice(0, 50)}${userInput.length > 50 ? '...' : ''}" -> [${enabledAgents.map(a => a.name).join(', ')}]`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, protocolMsg])
    setInput('')
    setLoading(true)
    
    // 添加任务到活动列表
    const taskId = `task-${Date.now()}`
    setActiveTasks(prev => [...prev, { id: taskId, name: userInput.slice(0, 30), status: 'running' }])
    
    // 更新 AI 任务计数
    setAgents(prev => prev.map(a => 
      a.enabled ? { ...a, taskCount: a.taskCount + 1, status: 'busy' as const } : a
    ))
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成响应
    const systemMsg: Message = {
      id: `msg-${Date.now()}-system`,
      role: 'system',
      content: `【评审团机制】已完成多维评分与交叉验证\n\n---\n\n## 处理结果\n\n${userInput}\n\n---\n\n**处理摘要：**\n- 逻辑分析（DeepSeek-V3）: 已完成\n- 创意生成（豆包）: 已完成  \n- 长文本理解（Kimi）: 已完成\n- 综合评估（通义千问）: 已完成\n- 决策整合（Gemini）: 已采纳\n\n**质量评分：** 92/100 (通过)`,
      timestamp: new Date(),
      agents: enabledAgents.map(a => a.name),
      mode: collaborationMode
    }
    
    setMessages(prev => [...prev, systemMsg])
    setLoading(false)
    
    // 更新任务状态
    setActiveTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'completed' } : t
    ))
    
    // 更新 AI 状态
    setAgents(prev => prev.map(a => 
      a.enabled ? { ...a, status: 'idle' as const } : a
    ))
    
    // 添加到历史
    setHistory(prev => [{
      id: userMsg.id,
      title: userInput.slice(0, 25) + (userInput.length > 25 ? '...' : ''),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      preview: userInput.slice(0, 40)
    }, ...prev])
    
  }, [input, loading, enabledAgents, collaborationMode])
  
  // 按键发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // 切换 AI 开关
  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, enabled: !a.enabled } : a
    ))
  }
  
  // 切换 AI 详情展开
  const toggleAgentDetails = (agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }

  return (
    <div className="app-container">
      {/* ==================== 头部 ==================== */}
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

      {/* ==================== 左侧栏 ==================== */}
      <aside className="panel">
        <div className="panel-header">
          <LayoutGrid size={14} />
          控制面板
        </div>
        
        {/* 历史记录 */}
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
        
        {/* 任务分区 */}
        <div className="task-section">
          <div className="section-title">
            <Play size={12} />
            任务分区
          </div>
          {activeTasks.filter(t => t.status === 'running').length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              暂无运行中的任务
            </div>
          ) : (
            activeTasks.filter(t => t.status === 'running').map(task => (
              <div key={task.id} className="task-item">
                <div className="task-spinner"></div>
                <div className="task-info">
                  <div className="task-name">{task.name}</div>
                  <div className="task-status">运行中...</div>
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

      {/* ==================== 中间栏 ==================== */}
      <main className="panel chat-container">
        <div className="panel-header">
          <MessageSquare size={14} />
          核心交互区
          {collaborationMode === 'jury' && (
            <span className="badge badge-jury">
              <Sparkles size={10} />
              评审团模式
            </span>
          )}
        </div>
        
        {/* 消息列表 */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>欢迎使用 M.A.S.T.E.R.</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                决策中枢 Gemini-3-Pro 已就绪<br/>
                后台评审团机制默认启用
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
                className={`message ${msg.role === 'user' ? 'message-user' : msg.role === 'protocol' ? '' : 'message-system'}`}
              >
                {msg.role === 'system' && (
                  <div className="message-meta">
                    🤖 {msg.agents?.join(' + ')} · 
                    <span className={`badge ${msg.mode === 'jury' ? 'badge-jury' : 'badge-standard'}`}>
                      {msg.mode === 'jury' ? '评审团' : msg.mode === 'consensus' ? '讨论共识' : '标准分工'}
                    </span>
                  </div>
                )}
                {msg.role === 'protocol' && (
                  <div className="message-protocol">
                    <span className="protocol-tag">SYS_ROUTING</span>
                    <span className="protocol-arrow">→</span>
                    {msg.content.replace('[SYS_ROUTING]: ', '')}
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
                <span>评审团协同处理中...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              className="chat-input"
              placeholder="输入复杂指令，支持多行..."
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

      {/* ==================== 右侧栏 ==================== */}
      <aside className="panel">
        <div className="panel-header">
          <div className="right-panel-header" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={14} />
              智能功能面板
            </div>
          </div>
        </div>
        
        {/* 资源概览 - 环形图 */}
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
                <div 
                  className="legend-dot" 
                  style={{ backgroundColor: AGENT_COLORS[agent.id] }}
                />
                <span>{agent.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>({agent.taskCount})</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 协作模式 */}
        <div className="collab-mode-section">
          <div 
            className="mode-header"
            onClick={() => setCollabModeExpanded(!collabModeExpanded)}
          >
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
            <ChevronDown 
              size={16} 
              style={{ 
                transform: collabModeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                color: 'var(--color-text-muted)'
              }} 
            />
          </div>
          
          <AnimatePresence>
            {collabModeExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mode-content"
              >
                <div className="mode-buttons">
                  <button 
                    className={`mode-btn ${collaborationMode === 'standard' ? 'active' : ''}`}
                    onClick={() => setCollaborationMode('standard')}
                  >
                    标准分工
                  </button>
                  <button 
                    className={`mode-btn ${collaborationMode === 'consensus' ? 'active' : ''}`}
                    onClick={() => setCollaborationMode('consensus')}
                  >
                    讨论共识
                  </button>
                  <button 
                    className={`mode-btn ${collaborationMode === 'jury' ? 'active' : ''}`}
                    onClick={() => setCollaborationMode('jury')}
                  >
                    评审团
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* AI 节点列表 */}
        <div className="agents-section">
          <div className="agents-header">
            <div className="agents-title">
              <Zap size={12} />
              智能节点
            </div>
            <span className="agents-count">
              {onlineCount} 在线
            </span>
          </div>
          
          <div className="agents-list">
            {agents.map(agent => (
              <motion.div 
                key={agent.id}
                layout
                className={`agent-card ${agent.enabled ? 'enabled' : ''}`}
              >
                <div className="agent-card-header">
                  <div className="agent-toggle-area">
                    <div 
                      className={`toggle-switch ${agent.enabled ? 'active' : ''}`}
                      onClick={() => toggleAgent(agent.id)}
                    />
                    <button 
                      className={`fold-btn ${expandedAgents.has(agent.id) ? 'expanded' : ''}`}
                      onClick={() => toggleAgentDetails(agent.id)}
                    >
                      <ChevronDown size={14} />
                    </button>
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
                
                {/* 详情折叠区 */}
                <AnimatePresence>
                  {expandedAgents.has(agent.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="agent-details expanded"
                    >
                      <div className="detail-row">
                        <span className="detail-label">状态</span>
                        <span className={`detail-value ${agent.enabled ? 'online' : 'offline'}`}>
                          {agent.enabled ? '在线' : '离线'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">今日任务</span>
                        <span className="detail-value">{agent.taskCount}</span>
                      </div>
                      
                      {/* 雷达图 */}
                      <RadarChart 
                        data={agent.radar} 
                        color={AGENT_COLORS[agent.id]} 
                      />
                      
                      {/* 能力标签 */}
                      <div className="agent-strengths">
                        {agent.strengths.map((s, i) => (
                          <span key={i} className="strength-tag">{s}</span>
                        ))}
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