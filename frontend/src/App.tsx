import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Send, Bot, History, Cpu, Zap, ChevronDown, ChevronRight, 
  BarChart3, Settings, Play, Activity, MessageSquare, Folder,
  GitBranch, Sparkles, LayoutGrid, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ==================== Types ====================

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

// ==================== Constants ====================

const AGENTS: Agent[] = [
  { 
    id: 'deepseek-v3', 
    name: 'DeepSeek-V3', 
    provider: 'DeepSeek', 
    model: 'DeepSeek-V3',
    strengths: ['Logic', 'Math', 'Code', 'Analysis'],
    radar: [
      { category: 'Logic', value: 95 },
      { category: 'Writing', value: 60 },
      { category: 'Long Text', value: 70 },
      { category: 'QA', value: 80 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'doubao', 
    name: 'Doubao', 
    provider: 'ByteDance', 
    model: 'Doubao-Pro',
    strengths: ['Creative Writing', 'Copywriting', 'Content', 'Inspiration'],
    radar: [
      { category: 'Logic', value: 55 },
      { category: 'Writing', value: 95 },
      { category: 'Long Text', value: 65 },
      { category: 'QA', value: 75 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'kimi', 
    name: 'Kimi', 
    provider: 'Moonshot', 
    model: 'moonshot-v1',
    strengths: ['Long Text', 'Document', 'Research', 'Analysis'],
    radar: [
      { category: 'Logic', value: 70 },
      { category: 'Writing', value: 75 },
      { category: 'Long Text', value: 98 },
      { category: 'QA', value: 85 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
  { 
    id: 'tongyi', 
    name: 'Tongyi Qwen', 
    provider: 'Alibaba', 
    model: 'qwen-turbo',
    strengths: ['General QA', 'Multi-modal', 'Instructions'],
    radar: [
      { category: 'Logic', value: 80 },
      { category: 'Writing', value: 70 },
      { category: 'Long Text', value: 65 },
      { category: 'QA', value: 90 }
    ],
    enabled: true, 
    taskCount: 0, 
    status: 'idle' 
  },
]

const AGENT_COLORS: Record<string, string> = {
  'deepseek-v3': '#5E5CF5',
  'doubao': '#FF6B35',
  'kimi': '#00BFFF',
  'tongyi': '#FF69B4'
}

type CollaborationMode = 'standard' | 'consensus' | 'jury'

// ==================== Components ====================

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

function RadarChart({ data, color }: { data: { category: string; value: number }[], color: string }) {
  const size = 80
  const center = size / 2
  const radius = 30
  const levels = 4
  
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
    const r = (d.value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    }
  })
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')
  
  return (
    <div className="radar-chart">
      <svg viewBox={`0 0 ${size} ${size}`}>
        {[1, 2, 3, 4].map(level => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(radius / levels) * level}
            fill="none"
            stroke="#27272a"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={polygonPoints}
          fill={`${color}20`}
          stroke={color}
          strokeWidth="2"
        />
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#27272a"
            strokeWidth="1"
          />
        ))}
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
    </div>
  )
}

// ==================== Main App ====================

export default function App() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>(AGENTS)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [collaborationMode, setCollaborationMode] = useState<CollaborationMode>('standard')
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const [collabModeExpanded, setCollabModeExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const onlineCount = agents.filter(a => a.enabled).length
  const enabledAgents = agents.filter(a => a.enabled)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Decision AI splits task into subtasks
  const splitTask = useCallback((userInput: string): SubTask[] => {
    const subTasks: SubTask[] = []
    const inputLower = userInput.toLowerCase()
    
    // Logic analysis task
    if (inputLower.includes('analyze') || inputLower.includes('logic') || inputLower.includes('calculate') || inputLower.includes('code')) {
      subTasks.push({
        id: `task-${Date.now()}-1`,
        targetAgent: 'deepseek-v3',
        instruction: `Logic Analysis: ${userInput}`
      })
    }
    
    // Creative writing task
    if (inputLower.includes('write') || inputLower.includes('create') || inputLower.includes('poem') || inputLower.includes('story')) {
      subTasks.push({
        id: `task-${Date.now()}-2`,
        targetAgent: 'doubao',
        instruction: `Creative Writing: ${userInput}`
      })
    }
    
    // Long text task
    if (inputLower.includes('long') || inputLower.includes('document') || inputLower.includes('read') || userInput.length > 200) {
      subTasks.push({
        id: `task-${Date.now()}-3`,
        targetAgent: 'kimi',
        instruction: `Long Text Processing: ${userInput}`
      })
    }
    
    // General QA (default)
    subTasks.push({
      id: `task-${Date.now()}-4`,
      targetAgent: 'tongyi',
      instruction: `General Answer: ${userInput}`
    })
    
    // Deduplicate
    return subTasks.filter((task, index, self) => 
      index === self.findIndex(t => t.targetAgent === task.targetAgent)
    )
  }, [])

  // Simulate AI executing subtasks
  const executeSubTask = async (subTask: SubTask): Promise<SubTask> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
    
    const agent = agents.find(a => a.id === subTask.targetAgent)
    const results: Record<string, string> = {
      'deepseek-v3': `【Logic Analysis Result】\n\nAnalysis for "${subTask.instruction.replace('Logic Analysis: ', '')}":\n\n1. Core Problem Identification\n2. Logic Structure Breakdown\n3. Key Elements Extraction\n4. Conclusion Derivation\n\nAnalysis Complete.`,
      'doubao': `【Creative Content】\n\n${subTask.instruction.includes('poem') ? 'Spring breeze sweeps, all things awaken\nGreen everywhere, flowers bloom full\nWarm sunshine, birds singing\nApril in the world, poetic and flourish' : '【Creative Writing Complete】\n\nBased on your requirements, creative content has been generated.'}`,
      'kimi': `【Long Text Understanding】\n\nInput content understood: "${subTask.instruction.replace('Long Text Processing: ', '').slice(0, 50)}..."\n\nExtracting key information points for deep understanding and analysis.`,
      'tongyi': `【General Answer】\n\nSynthesizing information from all dimensions to provide you with a complete answer:\n\n${subTask.instruction.replace('General Answer: ', '')}\n\nAbove is the comprehensive processing result.`
    }
    
    return {
      ...subTask,
      result: results[subTask.targetAgent] || 'Processing complete',
      score: 70 + Math.floor(Math.random() * 25)
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    
    const userInput = input.trim()
    setInput('')
    setLoading(true)
    
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    
    // Decision AI splits task
    const subTasks = splitTask(userInput)
    const routingAgents = subTasks.map(t => agents.find(a => a.id === t.targetAgent)?.name || t.targetAgent)
    
    const protocolMsg: Message = {
      id: `msg-${Date.now()}-protocol`,
      role: 'protocol',
      content: `[DECISION_AI]: Task split complete\n[SYS_ROUTING]: "${userInput.slice(0, 40)}${userInput.length > 40 ? '...' : ''}" -> [${routingAgents.join(', ')}]`,
      timestamp: new Date(),
      subTasks
    }
    setMessages(prev => [...prev, protocolMsg])
    
    // Update agent status
    setAgents(prev => prev.map(a => {
      const isAssigned = subTasks.some(t => t.targetAgent === a.id)
      return isAssigned ? { ...a, status: 'busy' as const } : a
    }))
    
    // Execute all subtasks in parallel
    const completedTasks = await Promise.all(subTasks.map(executeSubTask))
    
    // Update task counts
    setAgents(prev => prev.map(a => {
      const taskCount = completedTasks.filter(t => t.targetAgent === a.id).length
      return taskCount > 0 ? { ...a, taskCount: a.taskCount + taskCount, status: 'idle' as const } : a
    }))
    
    // Update protocol message with results
    const updatedProtocolMsg: Message = {
      ...protocolMsg,
      subTasks: completedTasks
    }
    setMessages(prev => prev.map(m => m.id === protocolMsg.id ? updatedProtocolMsg : m))
    
    // Jury evaluation
    if (collaborationMode === 'jury') {
      const scores = completedTasks.map(t => t.score || 80)
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      
      const juryMsg: Message = {
        id: `msg-${Date.now()}-jury`,
        role: 'jury',
        content: `【JURY EVALUATION】\n\nAverage Score: ${avgScore.toFixed(1)}\n\n${completedTasks.map(t => `${agents.find(a => a.id === t.targetAgent)?.name}: ${t.score}`).join('\n')}`,
        timestamp: new Date(),
        finalScore: avgScore
      }
      setMessages(prev => [...prev, juryMsg])
    }
    
    // Final output
    const finalMsg: Message = {
      id: `msg-${Date.now()}-final`,
      role: 'system',
      content: completedTasks.map(t => {
        const agentName = agents.find(a => a.id === t.targetAgent)?.name || t.targetAgent
        return `【${agentName}】\n${t.result}`
      }).join('\n\n---\n\n'),
      timestamp: new Date(),
      finalScore: completedTasks.reduce((sum, t) => sum + (t.score || 0), 0) / completedTasks.length
    }
    setMessages(prev => [...prev, finalMsg])
    
    setLoading(false)
    
    // Reset agent status
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const })))
    
    // Add to history
    setHistory(prev => [{
      id: userMsg.id,
      title: userInput.slice(0, 25) + (userInput.length > 25 ? '...' : ''),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      preview: userInput.slice(0, 40)
    }, ...prev])
    
  }, [input, loading, agents, splitTask, collaborationMode])
  
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
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <Sparkles size={24} />
          <span>M.A.S.T.E.R. System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-status">
            <span className="status-dot"></span>
            <span>Decision AI: Gemini-3-Pro</span>
          </div>
          <button className="settings-btn" disabled>
            <Settings size={14} style={{ marginRight: 6 }} />
            Settings
          </button>
        </div>
      </header>

      {/* Left Panel */}
      <aside className="panel">
        <div className="panel-header">
          <LayoutGrid size={14} />
          Control Panel
        </div>
        
        <div className="history-section">
          <div className="section-title">
            <History size={12} />
            History
          </div>
          {history.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              No history yet
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
            Task Partition
          </div>
          {messages.filter(m => m.role === 'protocol' && m.subTasks?.some(t => !t.result)).length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              No running tasks
            </div>
          ) : (
            messages.filter(m => m.role === 'protocol').slice(-1)[0]?.subTasks?.map(task => (
              <div key={task.id} className="task-item">
                <div className={task.result ? 'task-spinner' : ''} style={task.result ? {} : { background: '#10b981', borderRadius: '50%', width: 16, height: 16 }}></div>
                <div className="task-info">
                  <div className="task-name">{agents.find(a => a.id === task.targetAgent)?.name}</div>
                  <div className="task-status">{task.result ? 'Completed' : 'Processing...'}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="panel-content">
          <div className="section-title" style={{ marginTop: 'auto', paddingTop: '20px', opacity: 0.5 }}>
            <Folder size={12} />
            Data Management
          </div>
        </div>
      </aside>

      {/* Center Panel */}
      <main className="panel chat-container">
        <div className="panel-header">
          <MessageSquare size={14} />
          Core Interaction
          <span className="badge badge-jury">
            <Sparkles size={10} />
            {collaborationMode === 'jury' ? 'Jury' : collaborationMode === 'consensus' ? 'Consensus' : 'Standard'}
          </span>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>Welcome to M.A.S.T.E.R.</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Decision AI splits tasks to AI nodes<br/>
                Jury evaluates outputs in background
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
                    🤖 Final Output
                    {msg.finalScore && (
                      <span style={{ marginLeft: 8, color: msg.finalScore >= 75 ? '#10b981' : '#f59e0b' }}>
                        Score: {msg.finalScore.toFixed(1)}
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
                    ⚖️ Jury Evaluation
                    {msg.finalScore && (
                      <span style={{ marginLeft: 8 }}>Avg Score: {msg.finalScore.toFixed(1)}</span>
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
                <span>Decision AI splitting -&gt; Distributing -&gt; Jury evaluating...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Enter task, Decision AI will auto-split and distribute..."
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
              Send
            </button>
          </div>
        </div>
      </main>

      {/* Right Panel */}
      <aside className="panel">
        <div className="panel-header">
          <div className="right-panel-header" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={14} />
              Smart Panel
            </div>
          </div>
        </div>
        
        <div className="resource-section">
          <div className="resource-header">
            <div className="resource-title">
              <Activity size={12} />
              Task Distribution
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {onlineCount} / {enabledAgents.length} Online
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
              Collaboration Mode
              <span style={{ 
                marginLeft: 8, 
                padding: '2px 8px', 
                borderRadius: 4, 
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--color-accent-primary)',
                fontSize: 10
              }}>
                {collaborationMode === 'jury' ? 'Jury' : collaborationMode === 'consensus' ? 'Consensus' : 'Standard'}
              </span>
            </div>
            <ChevronDown size={16} style={{ transform: collabModeExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--color-text-muted)' }} />
          </div>
          
          <AnimatePresence>
            {collabModeExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mode-content">
                <div className="mode-buttons">
                  <button className={`mode-btn ${collaborationMode === 'standard' ? 'active' : ''}`} onClick={() => setCollaborationMode('standard')}>Standard</button>
                  <button className={`mode-btn ${collaborationMode === 'consensus' ? 'active' : ''}`} onClick={() => setCollaborationMode('consensus')}>Consensus</button>
                  <button className={`mode-btn ${collaborationMode === 'jury' ? 'active' : ''}`} onClick={() => setCollaborationMode('jury')}>Jury</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="agents-section">
          <div className="agents-header">
            <div className="agents-title"><Zap size={12} />AI Nodes</div>
            <span className="agents-count">{onlineCount} Online</span>
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
                        {agent.taskCount > 0 ? `${agent.taskCount} Tasks` : 'Idle'}
                      </span>
                    </div>
                    <div className="agent-provider">{agent.provider} · {agent.model}</div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedAgents.has(agent.id) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="agent-details expanded">
                      <div className="detail-row">
                        <span className="detail-label">Status</span>
                        <span className={`detail-value ${agent.enabled ? 'online' : 'offline'}`}>{agent.enabled ? 'Online' : 'Offline'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Today Tasks</span>
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