
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Settings, 
  History, 
  BookOpen, 
  Activity, 
  Cpu, 
  Save, 
  Trash2, 
  Copy, 
  Printer, 
  FileText, 
  Search,
  Zap,
  CheckCircle2,
  Menu,
  X,
  Lightbulb,
  GitBranch,
  Rocket,
  Paperclip,
  Wrench,
  ArrowRight,
  ArrowDown,
  Image as ImageIcon,
  FileSpreadsheet,
  FileType2,
  Eye,
  EyeOff,
  MessageSquare,
  Video,
  TrendingUp,
  Microscope,
  PlayCircle,
  HelpCircle,
  ShieldAlert,
  Cloud,
  Terminal,
  Code2,
  Globe,
  Download,
  Share2
} from 'lucide-react';

// --- TYPES ---

type LogType = 'info' | 'error' | 'success';

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  title: string;
  input: string;
  output: string;
  model: string;
  category: string;
}

interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 string without prefix
  size: number;
}

type Tab = 'generator' | 'ideas' | 'channel_ideas' | 'trending' | 'research' | 'history' | 'settings' | 'docs' | 'deploy' | 'logs' | 'versions';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// --- CONSTANTS ---

const APP_VERSION = "1.7.0";
const APP_NAME = "The Inverter";

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.7.0",
    date: "2024-05-29",
    changes: [
      "Auto-save to History: All generated ideas and analyses are saved automatically.",
      "Export PDF & Print: Standardized A4 formatting with proper margins.",
      "Added Document Action Bar: Quick access to Copy, Print, and PDF Export.",
      "Improved History Detail: Clicking history items restores the full analysis context."
    ]
  },
  {
    version: "1.6.1",
    date: "2024-05-28",
    changes: [
      "Added 'Auto Connect Google AI' feature in Settings.",
      "Hybrid API Key support: Uses either manual key or auto-connected project key."
    ]
  }
];

const NAVAL_MUNGER_CONTEXT = `
BẠN LÀ MỘT CHUYÊN GIA TƯ DUY ĐẢO NGƯỢC (INVERSION THINKER).
Bạn được huấn luyện dựa trên tư tưởng của Naval Ravikant, Charlie Munger và Warren Buffett.
Mục tiêu của bạn KHÔNG PHẢI là giúp người dùng "thành công" theo cách truyền thống.
Mục tiêu của bạn là giúp họ TRÁNH SỰ NGU NGỐC (AVOID STUPIDITY) và TRÁNH THẤT BẠI (AVOID FAILURE).

TRIẾT LÝ CỐT LÕI:
1. "Invert, always invert" (Carl Jacobi): Để giải quyết bài toán khó, hãy giải ngược lại.
2. "Success is mostly about not doing dumb things" (Naval).
3. "Tell me where I'm going to die, so I'll never go there" (Munger).
4. Mimetic Desire: Cảnh báo người dùng nếu họ đang mù quáng bắt chước đám đông.

NHIỆM VỤ CỦA BẠN:
Khi người dùng đưa ra một ý tưởng, dự án, tài liệu hoặc mong muốn:
1. Đừng khen ngợi. Hãy hoài nghi.
2. Sử dụng Google Search (nếu có công cụ) để tìm dữ liệu thực tế chứng minh tại sao ý tưởng này KHÓ KHĂN.
3. Phân tích theo cấu trúc sau:
   - **Tư Duy Đảo Ngược (The Inversion):** Thay vì hỏi làm sao để thắng, hãy liệt kê 5 cách CHẮC CHẮN sẽ khiến dự án này chết yểu.
   - **Phân tích Tài liệu (Nếu có):** Nếu người dùng upload file, hãy chỉ ra các lỗ hổng logic, số liệu ảo hoặc giả định sai lầm trong tài liệu đó.
   - **Cạm Bẫy Bắt Chước (Mimetic Trap):** Người dùng có đang làm vì thấy người khác làm không?
   - **Câu Hỏi Sát Thương (Kill Shot Questions):** 3 câu hỏi cực gắt buộc người dùng phải đối mặt với thực tế phũ phàng.
   - **Checklist "Tránh Ngu Ngốc":** Những việc cần DỪNG làm ngay lập tức.
`;

const SOLUTION_PROMPT_PREFIX = `
ROLE: Pragmatic Problem Solver & Strategy Consultant.
TASK: Provide concrete, actionable SOLUTIONS to the risks identified previously.
STRUCTURE: 1. Pivot Strategy, 2. Risk Mitigation, 3. The "Unfair Advantage", 4. Step-by-Step Fixes.
`;

const IDEA_GENERATION_PROMPT = `ROLE: Pragmatic Startup Advisor. Generate ONE Micro-SaaS/Game idea for US Market. Structure: Pitch, Monetization, Tech Stack, Feasibility, and CRITICAL INVERSION analysis.`;
const CHANNEL_GENERATION_PROMPT = `ROLE: YouTube Automation Expert. Suggest a high-potential Faceless channel concept. Include Concept, Monetization, and the CRITICAL INVERSION.`;
const TRENDING_PROMPT = `ROLE: Cultural Trend Hunter. Use Google Search to find 5 current US trends. Analyze with Inversion Thinking.`;
const RESEARCH_PROMPT_PREFIX = `ROLE: Niche Market Analyst. Deep dive research into the specific keyword using Google Search. Analyze Competitors, Metrics, Sentiment, and HIDDEN RISKS.`;

// --- HOOKS ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      try {
        return JSON.parse(item);
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? (value as (val: T) => T)(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- MAIN COMPONENT ---

const App = () => {
  const [apiKey, setApiKey] = useLocalStorage<string>('inverter_api_key', '');
  const [modelName, setModelName] = useLocalStorage<string>('inverter_model', 'gemini-3-pro-preview');
  const [language, setLanguage] = useLocalStorage<'vi' | 'en'>('inverter_lang', 'vi');
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  
  const [input, setInput] = useState('');
  const [researchQuery, setResearchQuery] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSolutionButton, setShowSolutionButton] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('inverter_history', []);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('inverter_logs', []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAutoConnected, setIsAutoConnected] = useState(false);
  const [historyViewingId, setHistoryViewingId] = useState<string | null>(null);

  const resultEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAutoKey = async () => {
      try {
        if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
          setIsAutoConnected(true);
        }
      } catch (e) { console.error(e); }
    };
    checkAutoKey();
  }, []);

  const addLog = (type: LogType, message: string) => {
    const newLog: LogEntry = { id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type, message };
    setLogs((prev) => [newLog, ...prev].slice(0, 100));
  };

  useEffect(() => {
    if (resultEndRef.current && isGenerating) {
      resultEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result, isGenerating]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];
      for (const file of files) {
          try {
              const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve((reader.result as string).split(',')[1]);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
              });
              newAttachments.push({ id: crypto.randomUUID(), name: file.name, mimeType: file.type || 'application/octet-stream', data: base64, size: file.size });
          } catch (err) { addLog('error', `Failed to read ${file.name}`); }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  const getEffectiveApiKey = () => apiKey || process.env.API_KEY;

  const handleSelectGoogleKey = async () => {
      try {
          if ((window as any).aistudio) {
              await (window as any).aistudio.openSelectKey();
              if (await (window as any).aistudio.hasSelectedApiKey()) setIsAutoConnected(true);
          }
      } catch (e: any) { alert("Error: " + e.message); }
  };

  // --- SAVE LOGIC ---

  const saveToHistory = (content: string, category: string, userQuery: string) => {
    if (!content) return;
    const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : (userQuery.substring(0, 50) || "Untitled Analysis");
    
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString(),
      title: title.replace(/[#*]/g, '').trim(),
      input: userQuery || `Generated ${category}`,
      output: content,
      model: modelName,
      category: category
    };
    setHistory(prev => [item, ...prev]);
    addLog('success', `Auto-saved to history: ${item.title}`);
  };

  // --- GENERATION ---

  const generateWithPrompt = async (prompt: string, useSearch: boolean = false, contextName: string, queryForHistory: string) => {
    const effectiveKey = getEffectiveApiKey();
    if (!effectiveKey) {
      alert(language === 'vi' ? 'Vui lòng cấu hình API Key!' : 'Please configure API Key!');
      setActiveTab('settings');
      return;
    }

    setIsGenerating(true);
    setResult('');
    setHistoryViewingId(null);
    setShowSolutionButton(false);
    addLog('info', `Generating ${contextName}...`);

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const fullPrompt = `${prompt}\n\nLanguage Output: ${language === 'vi' ? 'Vietnamese' : 'English'}`;
      const chatSession = ai.chats.create({
        model: modelName,
        config: { tools: useSearch ? [{ googleSearch: {} }] : [] },
      });

      const parts: any[] = [{ text: fullPrompt }];
      if (activeTab === 'generator') {
           attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } }));
      }

      const streamResult = await chatSession.sendMessageStream({ message: parts });
      let fullText = '';
      for await (const chunk of streamResult) {
        if (chunk.text) {
            fullText += chunk.text;
            setResult(fullText);
        }
      }

      saveToHistory(fullText, contextName, queryForHistory);
      setShowSolutionButton(true);
      addLog('success', 'Completed.');
    } catch (error: any) {
      setResult(`**ERROR:** ${error.message}`);
      addLog('error', error.message);
    } finally { setIsGenerating(false); }
  };

  const handleAnalyze = () => generateWithPrompt(`${NAVAL_MUNGER_CONTEXT}\nAnalyze: ${input}`, true, "Inversion Analysis", input);
  const handleGenerateIdea = () => generateWithPrompt(IDEA_GENERATION_PROMPT, true, "SaaS Idea", "Random Idea");
  const handleGenerateChannel = () => generateWithPrompt(CHANNEL_GENERATION_PROMPT, false, "YouTube Idea", "Random Channel");
  const handleScanTrends = () => generateWithPrompt(TRENDING_PROMPT, true, "Trends", "US Trend Hunter");
  const handleResearchNiche = () => generateWithPrompt(`${RESEARCH_PROMPT_PREFIX}\nNiche: ${researchQuery}`, true, "Niche Research", researchQuery);

  const handleGenerateSolutions = async () => {
    const effectiveKey = getEffectiveApiKey();
    if (!result || !effectiveKey) return;
    setIsGenerating(true);
    const previousContent = result;
    const divider = `\n\n---\n\n### 🛠️ ${language === 'vi' ? 'GIẢI PHÁP CHIẾN LƯỢC' : 'STRATEGIC SOLUTIONS'}\n\n`;
    setResult(prev => prev + divider);

    try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const response = await ai.models.generateContentStream({
            model: modelName,
            contents: `CONTEXT: ${previousContent}\nTASK: ${SOLUTION_PROMPT_PREFIX}\nLanguage: ${language === 'vi' ? 'Vietnamese' : 'English'}`, 
        });
        let solText = "";
        for await (const chunk of response) {
            if (chunk.text) {
                solText += chunk.text;
                setResult(previousContent + divider + solText);
            }
        }
        // Update history item if we were viewing one
        if (historyViewingId) {
             setHistory(prev => prev.map(h => h.id === historyViewingId ? { ...h, output: previousContent + divider + solText } : h));
        }
    } catch (e: any) { setResult(prev => prev + `\nError: ${e.message}`); }
    finally { setIsGenerating(false); }
  };

  const handlePrint = () => window.print();

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    alert('Copied to clipboard!');
  };

  // --- UI COMPONENTS ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); if (window.innerWidth < 768) setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
        activeTab === id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-surface hover:text-white'
      }`}
    >
      <Icon size={20} />
      {sidebarOpen && <span className="font-medium">{label}</span>}
    </button>
  );

  const renderResultArea = () => (
    <div className="flex-1 bg-surface rounded-xl border border-gray-700 shadow-lg flex flex-col min-h-0 printable-content">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-surface/50 backdrop-blur rounded-t-xl no-print">
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400">
                    {historyViewingId ? "VIEWING HISTORY" : "LIVE ANALYSIS"}
                </span>
                {historyViewingId && <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">SAVED</span>}
            </div>
            <div className="flex gap-1">
                {result && (
                    <>
                        <button onClick={handleCopy} title="Copy" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Copy size={16} /></button>
                        <button onClick={handlePrint} title="Print A4 / PDF" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Printer size={16} /></button>
                        <button onClick={handlePrint} title="Export PDF" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><FileText size={16} /></button>
                    </>
                )}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 font-sans printable-area">
            {!result && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-30">
                    <Activity size={64} className="mb-4" />
                    <p className="font-mono">{language === 'vi' ? 'Sẵn sàng phản biện...' : 'Ready for inversion...'}</p>
                </div>
            )}
            {result && (
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: (props) => <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2 mt-8 print:text-black print:border-black" {...props} />,
                        h2: (props) => <h2 className="text-2xl font-bold text-blue-400 mb-4 mt-8 print:text-black" {...props} />,
                        h3: (props) => <h3 className="text-xl font-bold text-white mb-3 mt-6 print:text-black" {...props} />,
                        p: (props) => <p className="mb-4 leading-relaxed text-gray-300 print:text-gray-800" {...props} />,
                        table: (props) => <div className="overflow-x-auto my-6"><table className="w-full text-left border-collapse border border-gray-700 print:border-black" {...props} /></div>,
                        th: (props) => <th className="bg-surface p-3 border border-gray-700 font-bold print:bg-gray-100 print:border-black" {...props} />,
                        td: (props) => <td className="p-3 border border-gray-700 text-gray-300 print:text-black print:border-black" {...props} />,
                        blockquote: (props) => <blockquote className="border-l-4 border-accent pl-4 italic text-gray-400 my-6 bg-surface/30 py-4 rounded print:bg-gray-50 print:border-gray-400 print:text-gray-600" {...props} />,
                        ul: (props) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                    }}
                >
                    {result}
                </ReactMarkdown>
            )}
            
            {showSolutionButton && !isGenerating && result && (
                <div className="mt-12 pt-8 border-t border-gray-700 flex justify-center no-print">
                    <button onClick={handleGenerateSolutions} className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full font-bold shadow-xl transition-all hover:scale-105">
                        <Wrench size={20} />
                        {language === 'vi' ? 'ĐỀ XUẤT GIẢI PHÁP KHẮC PHỤC' : 'FIND STRATEGIC SOLUTIONS'}
                    </button>
                </div>
            )}
            <div ref={resultEndRef} />
        </div>
    </div>
  );

  const renderHistory = () => (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><History className="text-primary" /> {language === 'vi' ? 'Lịch Sử' : 'History'}</h2>
        {history.length > 0 && <button onClick={() => confirm('Clear all?') && setHistory([])} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"><Trash2 size={14}/> Clear</button>}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {history.length === 0 ? (
            <div className="text-center mt-20 text-gray-600 italic">No history yet. Start analyzing!</div>
        ) : (
            history.map((item) => (
                <div key={item.id} className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary transition-all cursor-pointer group" onClick={() => { setResult(item.output); setHistoryViewingId(item.id); setActiveTab('generator'); setShowSolutionButton(true); }}>
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-mono text-gray-500">{item.timestamp}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); setHistory(h => h.filter(i => i.id !== item.id)); }} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <div className="font-bold text-white mb-1 line-clamp-1">{item.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-2">{item.input}</div>
                    <div className="mt-3 flex gap-2">
                        <span className="text-[9px] bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">{item.category}</span>
                        <span className="text-[9px] bg-gray-900 text-primary/60 px-1.5 py-0.5 rounded uppercase font-bold">{item.model}</span>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-surface border-r border-gray-800 flex-shrink-0 transition-all duration-300 flex flex-col no-print z-20`}>
        <div className="p-6 flex items-center justify-between">
          <div className="font-black text-xl tracking-tighter flex items-center gap-2">
            <Activity className="text-primary" />
            {sidebarOpen && <span>INVERTER</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <SidebarItem id="generator" icon={Cpu} label={language === 'vi' ? 'Phân Tích' : 'Generator'} />
          <div className="my-2 border-t border-gray-800 mx-2"></div>
          <SidebarItem id="ideas" icon={Lightbulb} label={language === 'vi' ? 'Ý Tưởng SaaS' : 'SaaS Ideas'} />
          <SidebarItem id="channel_ideas" icon={Video} label={language === 'vi' ? 'Ý Tưởng Kênh' : 'Channel Ideas'} />
          <SidebarItem id="trending" icon={TrendingUp} label={language === 'vi' ? 'Bắt Trend' : 'Trends'} />
          <SidebarItem id="research" icon={Microscope} label={language === 'vi' ? 'Nghiên Cứu' : 'Research'} />
          <div className="my-2 border-t border-gray-800 mx-2"></div>
          <SidebarItem id="history" icon={History} label={language === 'vi' ? 'Lịch Sử' : 'History'} />
          <SidebarItem id="docs" icon={HelpCircle} label={language === 'vi' ? 'Hướng Dẫn' : 'Guide'} />
          <SidebarItem id="settings" icon={Settings} label={language === 'vi' ? 'Cài Đặt' : 'Settings'} />
        </div>
        <div className="p-4 border-t border-gray-800 text-[10px] text-center text-gray-600">v{APP_VERSION}</div>
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header Mobile */}
        <div className="md:hidden p-4 bg-surface border-b border-gray-800 flex justify-between items-center no-print">
            <span className="font-bold">The Inverter</span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu /></button>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
            {activeTab === 'generator' && (
                <div className="flex flex-col h-full gap-6">
                    <div className="bg-surface p-6 rounded-2xl border border-gray-700 shadow-xl no-print">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={language === 'vi' ? "Mô tả ý tưởng hoặc dự án cần phản biện..." : "Describe the idea or project to critique..."}
                            className="w-full h-24 bg-background text-white p-4 rounded-xl border border-gray-700 focus:border-primary outline-none transition resize-none mb-4"
                        />
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><Paperclip size={18} /> Attach File</button>
                                {attachments.length > 0 && <span className="text-xs text-primary font-bold">{attachments.length} files</span>}
                            </div>
                            <button onClick={handleAnalyze} disabled={isGenerating || !input} className="bg-primary hover:bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50">
                                {isGenerating ? <Activity className="animate-spin" /> : <Zap size={20} />}
                                {language === 'vi' ? 'PHÂN TÍCH NGAY' : 'ANALYZE NOW'}
                            </button>
                        </div>
                    </div>
                    {renderResultArea()}
                </div>
            )}

            {activeTab === 'ideas' && (
                <div className="flex flex-col h-full gap-6">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8 rounded-2xl border border-indigo-500/30 flex justify-between items-center no-print">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3"><Lightbulb className="text-yellow-400" /> Startup Idea Lab</h2>
                            <p className="text-gray-400">Targeting US Market. Micro-SaaS & Automation.</p>
                        </div>
                        <button onClick={handleGenerateIdea} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-bold shadow-xl flex items-center gap-3">
                            {isGenerating ? <Activity className="animate-spin" /> : <PlayCircle />} Brainstorm Idea
                        </button>
                    </div>
                    {renderResultArea()}
                </div>
            )}

            {activeTab === 'channel_ideas' && (
                <div className="flex flex-col h-full gap-6">
                    <div className="bg-gradient-to-br from-red-900/40 to-slate-900 p-8 rounded-2xl border border-red-500/30 flex justify-between items-center no-print">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3"><Video className="text-red-500" /> YouTube/TikTok Factory</h2>
                            <p className="text-gray-400">US Faceless Channels & Automation concepts.</p>
                        </div>
                        <button onClick={handleGenerateChannel} disabled={isGenerating} className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-bold shadow-xl flex items-center gap-3">
                            {isGenerating ? <Activity className="animate-spin" /> : <Zap />} Generate Channel
                        </button>
                    </div>
                    {renderResultArea()}
                </div>
            )}

            {activeTab === 'trending' && (
                <div className="flex flex-col h-full gap-6">
                    <div className="bg-gradient-to-br from-pink-900/40 to-slate-900 p-8 rounded-2xl border border-pink-500/30 flex justify-between items-center no-print">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3"><TrendingUp className="text-pink-400" /> US Trend Hunter</h2>
                            <p className="text-gray-400">Live scanning for viral topics in the USA.</p>
                        </div>
                        <button onClick={handleScanTrends} disabled={isGenerating} className="bg-pink-600 hover:bg-pink-500 text-white px-10 py-4 rounded-xl font-bold shadow-xl flex items-center gap-3">
                            {isGenerating ? <Activity className="animate-spin" /> : <Search />} Scan Now
                        </button>
                    </div>
                    {renderResultArea()}
                </div>
            )}

            {activeTab === 'research' && (
                <div className="flex flex-col h-full gap-6">
                    <div className="bg-surface p-8 rounded-2xl border border-gray-700 shadow-xl no-print">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Microscope className="text-blue-400" /> Deep Niche Research</h2>
                        <div className="flex gap-4">
                            <input 
                                type="text" value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)}
                                placeholder="Enter keyword (e.g., AI Horror Stories)..."
                                className="flex-1 bg-background text-white p-4 rounded-xl border border-gray-700 outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && handleResearchNiche()}
                            />
                            <button onClick={handleResearchNiche} disabled={isGenerating || !researchQuery} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3">
                                {isGenerating ? <Activity className="animate-spin" /> : <Search />} Analyze Niche
                            </button>
                        </div>
                    </div>
                    {renderResultArea()}
                </div>
            )}

            {activeTab === 'history' && renderHistory()}
            {activeTab === 'settings' && (
                 <div className="max-w-2xl mx-auto w-full space-y-8 no-print">
                    <div className="bg-surface p-8 rounded-2xl border border-gray-700 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3"><Settings className="text-primary" /> Settings</h2>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-blue-400 mb-4">Auto Connect (Recommended)</h3>
                                <button onClick={handleSelectGoogleKey} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all">
                                    <Globe size={20} /> Connect Google Cloud Project
                                </button>
                                {isAutoConnected && <p className="text-green-400 text-xs mt-3 flex items-center gap-2"><CheckCircle2 size={14}/> Connected via Google AI Cloud</p>}
                            </div>

                            <div className="pt-6 border-t border-gray-800">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Manual API Key</label>
                                <div className="flex gap-2">
                                    <input 
                                        type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Paste key manually..."
                                        className="flex-1 bg-background p-4 rounded-xl border border-gray-700 outline-none"
                                    />
                                    <button onClick={() => setShowKey(!showKey)} className="bg-gray-800 px-4 rounded-xl text-gray-400">{showKey ? <EyeOff /> : <Eye />}</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Language</label>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full bg-background p-4 rounded-xl border border-gray-700">
                                        <option value="vi">Tiếng Việt</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Model</label>
                                    <select value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full bg-background p-4 rounded-xl border border-gray-700">
                                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
            {activeTab === 'versions' && (
                <div className="max-w-3xl mx-auto w-full no-print">
                    <h2 className="text-3xl font-black mb-10 flex items-center gap-4"><GitBranch className="text-primary" /> Evolution Log</h2>
                    <div className="space-y-8 border-l-4 border-gray-800 pl-8 ml-4">
                        {CHANGELOG.map((log, i) => (
                            <div key={i} className="relative bg-surface p-8 rounded-2xl border border-gray-700 shadow-lg">
                                <div className="absolute -left-[45px] top-10 w-6 h-6 rounded-full bg-background border-4 border-primary"></div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-black text-white">v{log.version}</h3>
                                    <span className="text-sm text-gray-500 font-mono">{log.date}</span>
                                </div>
                                <ul className="space-y-3">
                                    {log.changes.map((c, ci) => <li key={ci} className="text-gray-300 flex gap-3 text-sm"><span className="text-primary font-bold">»</span> {c}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
