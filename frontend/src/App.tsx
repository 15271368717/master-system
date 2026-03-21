import { useState, useEffect, useRef } from 'react'
import { Send, Bot, History, Cpu, Zap, ChevronDown, BarChart3, Workflow } from 'lucide-react'

// Types
interface Agent {
  agent_id: string
  name: string
  provider: string
  strengths: string[]
  radar: Record<string, number>
  enabled: boolean
  task_count: number
}

interface Message {
  id: string
  role: 'user' | 'system'
  content: string
  agents?: string[]
}

interface HistoryItem {
  id: string
  title: string
  time: string
}

// Colors for resource chart
const PROVIDER_COLORS: Record<string, string> = {
  deepseek: '#5E5CF5',
  doubao: '#FF6B35',
  chatgpt: '#10A37F',
  claude: '#D4A574',
  default: '#6366F1'
}

// Mock data for demo
const MOCK_AGENTS: Agent[] = [
  { agent_id: 'deepseek', name: 'DeepSeek', provider: '深度求索', strengths: ['推理', '编程', '数学'], radar: {}, enabled: true, task_count: 3 },
  { agent_id: 'doubao', name: '豆包', provider: '字节跳动', strengths: ['写作', '对话', '创意'], radar: {}, enabled: true, task_count: 2 },
  { agent_id: 'chatgpt', name: 'ChatGPT', provider: 'OpenAI', strengths: ['通用', '编程', '翻译'], radar: {}, enabled: false, task_count: 0 },
  { agent_id: 'claude', name: 'Claude', provider: 'Anthropic', strengths: ['分析', '写作', '代码'], radar: {}, enabled: false, task_count: 0 },
]

// API
const API_BASE = '/api'

function App() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [collabExpanded, setCollabExpanded] = useState(true)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Calculate task distribution
  const totalTasks = agents.reduce((sum, a) => sum + a.task_count, 0) || 1
  const getTaskPercentage = (count: number) => Math.round((count / totalTasks) * 100)

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Update task counts (simulate)
    setAgents(prev => prev.map(a => 
      a.enabled ? { ...a, task_count: a.task_count + 1 } : a
    ))

    // Simulate AI response
    setTimeout(() => {
      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `【评审团模式已启用】\n\n我已调度多个 AI 协同处理你的任务：\n\n🤖 深度求索：分析问题结构，进行逻辑推理\n🤖 豆包：生成创意内容，优化表达\n\n经过多维度评分评估（质量、相关性、创意），最终整合结果如下：\n\n---\n\n${input}\n\n这是一个基于浏览器自动化接入第三方 AI 的演示。评审团机制在后台自动运行，确保输出质量。`,
        agents: agents.filter(a => a.enabled).map(a => a.name)
      }
      setMessages(prev => [...prev, systemMsg])
      
      // Add to history
      setHistory(prev => [{
        id: systemMsg.id,
        title: input.slice(0, 25) + (input.length > 25 ? '...' : ''),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }, ...prev])
      
      setLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Toggle agent expansion
  const toggleAgent = (agentId: string) => {
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

  // Toggle agent enabled
  const toggleEnabled = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.agent_id === agentId ? { ...a, enabled: !a.enabled } : a
    ))
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <Workflow size={24} />
          <span>M.A.S.T.E.R. System</span>
        </div>
        <div className="header-status">
          <span className="status-dot"></span>
          <span>浏览器自动化 · 评审团模式运行中</span>
        </div>
      </header>

      {/* Left Panel - History */}
      <aside className="panel">
        <div className="panel-header">
          <History size={14} />
          历史记录
        </div>
        <div className="panel-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <p>暂无历史记录</p>
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
      </aside>

      {/* Center Panel - Chat */}
      <main className="panel">
        <div className="panel-header">
          <Bot size={14} />
          核心对话
          <span className="current-mode">
            <Zap size={12} />
            评审团模式
          </span>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <Bot size={48} className="empty-state-icon" />
              <p>你好！我是 M.A.S.T.E.R. 🦋</p>
              <p style={{ marginTop: 8, fontSize: 13 }}>
                评审团机制默认启用，多 AI 协同为你服务
              </p>
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-system'}`}>
              {msg.role === 'system' && msg.agents && (
                <div className="message-meta">
                  🤖 {msg.agents.join(' + ')} · 评审团
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          
          {loading && (
            <div className="message message-system">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>评审团协同处理中...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="输入任务描述..."
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

      {/* Right Panel - Collab */}
      <aside className="panel">
        <div className="panel-header">
          <div className="collab-header" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={14} />
              智能协作面板
            </div>
            <button 
              className={`collapse-btn ${!collabExpanded ? 'collapsed' : ''}`}
              onClick={() => setCollabExpanded(!collabExpanded)}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
        
        {collabExpanded && (
          <div className="panel-content">
            {/* Resource Overview - Task Distribution */}
            <div className="resource-section">
              <div className="resource-title">
                <BarChart3 size={12} />
                AI 任务分工占比
              </div>
              <div className="resource-chart">
                <div className="resource-bar">
                  {agents.filter(a => a.enabled).map(agent => (
                    <div 
                      key={agent.agent_id}
                      className="resource-segment"
                      style={{ 
                        width: `${getTaskPercentage(agent.task_count)}%`,
                        backgroundColor: PROVIDER_COLORS[agent.agent_id] || PROVIDER_COLORS.default
                      }}
                    >
                      {getTaskPercentage(agent.task_count) > 15 ? `${getTaskPercentage(agent.task_count)}%` : ''}
                    </div>
                  ))}
                </div>
                <div className="resource-legend">
                  {agents.filter(a => a.enabled).map(agent => (
                    <div key={agent.agent_id} className="legend-item">
                      <div 
                        className="legend-dot" 
                        style={{ backgroundColor: PROVIDER_COLORS[agent.agent_id] || PROVIDER_COLORS.default }}
                      />
                      <span>{agent.name} ({agent.task_count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Agents */}
            <div className="agents-section">
              <div className="agents-title">
                <Zap size={12} />
                AI 节点 ({agents.filter(a => a.enabled).length} 个在线)
              </div>
              <div className="agents-list">
                {agents.map(agent => (
                  <div key={agent.agent_id} className="agent-card">
                    <div className="agent-toggle">
                      <div 
                        className={`toggle-switch ${agent.enabled ? 'active' : ''}`}
                        onClick={() => toggleEnabled(agent.agent_id)}
                        title={agent.enabled ? '点击禁用' : '点击启用'}
                      />
                      <button 
                        className={`fold-arrow ${expandedAgents.has(agent.agent_id) ? 'expanded' : ''}`}
                        onClick={() => toggleAgent(agent.agent_id)}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    
                    <div className="agent-info">
                      <div className="agent-name">
                        {agent.name}
                        {agent.task_count > 0 && (
                          <span className={`task-badge ${agent.task_count > 2 ? 'busy' : ''}`}>
                            {agent.task_count} 任务
                          </span>
                        )}
                      </div>
                      <div className="agent-provider">{agent.provider}</div>
                      
                      <div className={`agent-details ${expandedAgents.has(agent.agent_id) ? 'expanded' : ''}`}>
                        <div className="agent-detail-row">
                          <span className="detail-label">状态</span>
                          <span className="detail-value" style={{ color: agent.enabled ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                            {agent.enabled ? '在线' : '离线'}
                          </span>
                        </div>
                        <div className="agent-detail-row">
                          <span className="detail-label">今日任务</span>
                          <span className="detail-value">{agent.task_count}</span>
                        </div>
                        <div className="agent-strengths">
                          {agent.strengths.map((s, i) => (
                            <span key={i} className="strength-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default App