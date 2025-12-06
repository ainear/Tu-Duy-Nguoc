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
  AlertTriangle,
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
  Lock,
  MessageSquare,
  Video,
  TrendingUp,
  Microscope,
  PlayCircle,
  HelpCircle,
  ShieldAlert,
  Target,
  Cloud,
  Terminal,
  Code2
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
  input: string;
  output: string;
  model: string;
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

const APP_VERSION = "1.6.0";
const APP_NAME = "The Inverter";

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.6.0",
    date: "2024-05-27",
    changes: [
      "Added 'Deployment Guide' tab: Step-by-step instructions to deploy to Cloudflare Pages.",
      "Provided code migration guide from AI Studio to Vite (React+TS)."
    ]
  },
  {
    version: "1.5.1",
    date: "2024-05-26",
    changes: [
      "Fixed API Key persistence issue: Key is now reliably saved locally.",
      "Added manual 'Save' button in Settings for explicit confirmation.",
      "Improved Local Storage handling logic."
    ]
  },
  {
    version: "1.5.0",
    date: "2024-05-26",
    changes: [
      "Added 'Documentation & Guide' page: A visual mindmap guide for newbies.",
      "Visual Workflow: Step-by-step block diagram explaining how to use the Inversion Engine.",
      "Tool Breakdown: Detailed explanation of all Money-Making tabs."
    ]
  },
  {
    version: "1.4.0",
    date: "2024-05-25",
    changes: [
      "Added 'YouTube/TikTok Ideas' tab: Faceless & Automation strategies for US Market.",
      "Added 'US Trend Hunter' tab: Find viral US trends with Crowd vs. Inversion analysis.",
      "Added 'Deep Research' tab: Analyze specific niches/keywords with metrics and scoring.",
      "Integrated Google Search Grounding for Trending and Research tabs."
    ]
  },
  {
    version: "1.3.3",
    date: "2024-05-24",
    changes: [
      "Updated Model Settings: Explicitly labeled Gemini 3.0 Pro.",
      "Optimized model selection for high-tier API keys."
    ]
  },
  {
    version: "1.3.2",
    date: "2024-05-24",
    changes: [
      "Enhanced Settings UI: API Key now shows explicit 'Connected' status.",
      "Persistence Confirmation: Visual feedback that Key is auto-saved.",
      "Restored missing UI components."
    ]
  },
  {
    version: "1.3.1",
    date: "2024-05-24",
    changes: [
      "Improved API Key persistence: Key is now robustly saved and auto-loaded.",
      "Added 'Show/Hide' toggle for API Key in Settings."
    ]
  },
  {
    version: "1.3.0",
    date: "2024-05-24",
    changes: [
      "Added support for Multiple File Uploads.",
      "Added support for Images (PNG, JPG), Word, Excel, and PowerPoint files.",
      "Increased file size limits and added usage notes."
    ]
  },
  {
    version: "1.2.1",
    date: "2024-05-23",
    changes: [
      "Fixed API error when sending attached files (ContentUnion required fix).",
      "Improved stability of Chat Stream."
    ]
  },
  {
    version: "1.2.0",
    date: "2024-05-23",
    changes: [
      "Added File Upload (PDF, Text) for deep analysis of documents.",
      "Added 'Find Solutions' feature to generate fixes after Inversion analysis.",
      "Improved UI for attached files."
    ]
  },
  {
    version: "1.1.1",
    date: "2024-05-22",
    changes: [
      "Added manual 'Save' button for Daily Ideas.",
      "Removed auto-save for ideas to allow better curation.",
      "Improved history item naming for saved ideas."
    ]
  },
  {
    version: "1.1.0",
    date: "2023-10-27",
    changes: [
      "Added 'Daily Idea' (Ý tưởng mỗi ngày) tab targeting US Market/MMO.",
      "Added 'Version Control' tab to track updates.",
      "Integrated Inversion Analysis directly into Idea Generation.",
      "Auto-save generated ideas to History."
    ]
  },
  {
    version: "1.0.3",
    date: "2023-10-25",
    changes: [
      "Initial Release.",
      "Core Inversion Engine.",
      "PDF Export.",
      "History Management."
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

TONE & VOICE:
- Thẳng thắn, hơi "phũ" (sarcastic) nhưng cực kỳ logic và sắc bén.
- Dùng từ ngữ mạnh: "Ảo tưởng", "Tự sát", "Đốt tiền", "Vực thẳm".
- Luôn trình bày dạng Markdown đẹp, dùng bảng (Table) nếu so sánh.
`;

const SOLUTION_PROMPT_PREFIX = `
ROLE: Pragmatic Problem Solver & Strategy Consultant.

CONTEXT:
You previously analyzed the user's idea using "Inversion Thinking" and pointed out all the ways it could fail (The "Death Valley").

TASK:
Now, act as the BRIDGE. Provide concrete, actionable SOLUTIONS to the specific risks identified above.
Don't just give generic advice. Give "How-To" pivots or strategies to survive the identified traps.

STRUCTURE:
1. **Pivot Strategy:** How to change the angle to avoid the competition/failure points?
2. **Risk Mitigation:** Specific actions to counter the "Kill Shot Questions".
3. **The "Unfair Advantage" Build:** What creates a moat?
4. **Step-by-Step Fixes:** Immediate actions to take this week.

Tone: Constructive, tactical, encouraging but realistic.
`;

const IDEA_GENERATION_PROMPT = `
ROLE: You are a Pragmatic Startup Advisor & Inversion Thinker. You specialize in Micro-SaaS, Mobile Games, and Niche Web Tools for the US Market.

TASK: Generate ONE unique, high-potential money-making idea (MMO) suitable for a small team (1-3 people).

STRICT CRITERIA:
1. Target Market: USA (High paying users).
2. Type: Mobile Game (Hyper-casual/Hybrid-casual), Web Tool, or Micro-SaaS.
3. Must be feasible for a small team with limited budget.

OUTPUT FORMAT (Markdown):

# [Emoji] [Cool Name of Idea]

### 1. The Pitch (Elevator Pitch)
What is it? Who is it for? Why will they pay?

### 2. The "Money" (Business Model)
Specifically how to monetize (Ads, IAP, Subscription, One-time). Estimate potential MRR for a small team.

### 3. Tech Stack & Implementation
- Frontend/Backend suggestions.
- Key Libraries/APIs.
- MVP Roadmap (Step 1, 2, 3).

### 4. Feasibility Score
- **Tech Difficulty:** ?/10 (10 is hardest)
- **Market Potential:** ?/10
- **Time to MVP:** [Days/Weeks]

---
### 💀 THE INVERSION (CRITICAL ANALYSIS)
*Analyze this idea with "Inversion Thinking". Why will it likely FAIL?*
- **The Trap:** What looks easy but is actually a nightmare? (e.g., CAC is too high, churn rate).
- **The "Kill" Factor:** Why haven't others done it? Or if they have, why did they die?
- **Avoid Stupidity:** What should the founder NOT do if they pursue this?

`;

const CHANNEL_GENERATION_PROMPT = `
ROLE: YouTube/TikTok Automation & Strategy Expert. Target Market: USA.
GOAL: Suggest a high-potential "Faceless" or "Creator" channel concept that makes money via Adsense, Affiliate, or Digital Products.

OUTPUT STRUCTURE:

# [Emoji] [Channel Name Concept]

### 1. The Concept (The Hook)
- Niche: (e.g., True Crime, History, Tech, Quiz, ASMR)
- Target Audience: US Demographics.
- Content Style: (Animation, Stock Footage, AI Voiceover, Whiteboard).

### 2. The Money (Monetization)
- Primary: (Adsense CPM estimation).
- Secondary: (Affiliate links, Sponsorships, Merch).

### 3. The Crowd View (Why it works)
- Why do people watch this? (Dopamine, Fear, Curiosity).
- Why is it trending now?

---
### 💀 THE INVERSION (WHY YOU WILL FAIL)
*Apply Inversion Thinking:*
- **The Copyright Trap:** Will AI voice/music get demonetized?
- **The Grind:** How long until first $1? (Be realistic).
- **Saturation:** Is this niche already dead?
- **Action Plan:** How to NOT be like the other 99% who fail.
`;

const TRENDING_PROMPT = `
ROLE: Cultural Trend Hunter (US Market).
TASK: Use Google Search to identify CURRENT trending topics on YouTube/TikTok in the USA (Last 7 days).

OUTPUT:
List 5 Trending Topics/Keywords. For EACH topic:

## [Keyword/Topic Name]
- **The Crowd View (Why it's Hot):** High views, viral challenge, controversy, etc.
- **💀 The Inversion (The Trap):** Is it a fad? Is it too late to enter? Is it low CPM?
- **Content Angle:** How to pivot this for a Faceless/Automation channel?

Note: Be specific with keywords.
`;

const RESEARCH_PROMPT_PREFIX = `
ROLE: Niche Market Analyst (YouTube/TikTok US).
TASK: Deep dive research into the specific keyword/niche provided below. Use Google Search.

Analyze:
1. **Top Competitors:** Who are the top 3-5 channels dominating this?
2. **Metrics:** Estimate Views per video, Engagement rate, CPM (High/Low).
3. **Sentiment:** What are comments saying? (Love, Hate, Bored).
4. **Feasibility Score:** ?/10.

---
### 💀 THE INVERSION (HIDDEN RISKS)
- What are the invisible barriers? (Production cost, specific skill needed).
- Is the trend declining?
- Verdict: GO or NO GO?
`;

// --- HOOKS ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      if (!item) return initialValue;
      
      // Attempt to parse. If it fails (raw string), return it as is.
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
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? (value as (val: T) => T)(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof valueToStore === 'string') {
        // For strings, we can just store them directly to avoid double quoting issues if desired, 
        // but JSON.stringify is safer for special chars.
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- MAIN COMPONENT ---

const App = () => {
  // State
  const [apiKey, setApiKey] = useLocalStorage<string>('inverter_api_key', '');
  const [modelName, setModelName] = useLocalStorage<string>('inverter_model', 'gemini-3-pro-preview');
  const [language, setLanguage] = useLocalStorage<'vi' | 'en'>('inverter_lang', 'vi');
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  
  const [input, setInput] = useState('');
  const [researchQuery, setResearchQuery] = useState(''); // Specific for Research Tab

  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSolutionButton, setShowSolutionButton] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showKey, setShowKey] = useState(false);
  
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('inverter_history', []);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('inverter_logs', []);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Refs
  const resultEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Logging
  const addLog = (type: LogType, message: string) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs((prev) => [newLog, ...prev].slice(100, 200)); // Keep reasonable log size
  };

  // Helper: Auto-scroll
  useEffect(() => {
    if (resultEndRef.current && isGenerating) {
      resultEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result, isGenerating]);

  // Logic: File Handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const MAX_FILES = 5;
      const MAX_SIZE_MB = 10;
      
      if (attachments.length + files.length > MAX_FILES) {
        alert(language === 'vi' ? `Chỉ được upload tối đa ${MAX_FILES} file.` : `Max ${MAX_FILES} files allowed.`);
        return;
      }

      const newAttachments: Attachment[] = [];

      for (const file of files) {
          if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            addLog('error', `File ${file.name} skipped (Too large > ${MAX_SIZE_MB}MB)`);
            alert(`File ${file.name} is too large (Max ${MAX_SIZE_MB}MB)`);
            continue;
          }

          addLog('info', `Reading file: ${file.name}`);
          
          try {
              const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                      const result = reader.result as string;
                      const base64Data = result.split(',')[1];
                      resolve(base64Data);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
              });

              newAttachments.push({
                  id: crypto.randomUUID(),
                  name: file.name,
                  mimeType: file.type || 'application/octet-stream',
                  data: base64,
                  size: file.size
              });
          } catch (err) {
              addLog('error', `Failed to read file ${file.name}`);
          }
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
      addLog('success', `${newAttachments.length} file(s) attached.`);
      
      // Reset input so same file can be selected again if needed (after removal)
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const getFileIcon = (mimeType: string) => {
      if (mimeType.includes('image')) return <ImageIcon size={16} className="text-purple-400" />;
      if (mimeType.includes('pdf')) return <FileText size={16} className="text-red-400" />;
      if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={16} className="text-green-400" />;
      if (mimeType.includes('word') || mimeType.includes('document')) return <FileType2 size={16} className="text-blue-400" />;
      return <Paperclip size={16} className="text-gray-400" />;
  };

  // --- GENERATION FUNCTIONS ---

  const generateWithPrompt = async (prompt: string, useSearch: boolean = false, contextName: string) => {
    if (!apiKey) {
      alert(language === 'vi' ? 'Vui lòng nhập API Key trong phần Cài đặt!' : 'Please enter API Key in Settings!');
      setActiveTab('settings');
      return;
    }

    setIsGenerating(true);
    setResult('');
    setShowSolutionButton(false);
    addLog('info', `Starting ${contextName}...`);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const fullPrompt = `${prompt}\n\nLanguage Output: ${language === 'vi' ? 'Vietnamese' : 'English'}\nRandom Seed: ${Date.now()}`;

      const chatSession = ai.chats.create({
        model: modelName,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : [],
        },
      });

      // Handle attachments if in generator mode, otherwise just text
      const parts: any[] = [{ text: fullPrompt }];
      if (activeTab === 'generator' && attachments.length > 0) {
           attachments.forEach(att => {
              parts.push({
                  inlineData: {
                      mimeType: att.mimeType,
                      data: att.data
                  }
              });
          });
      }

      const streamResult = await chatSession.sendMessageStream({ message: parts });
      
      let fullText = '';
      for await (const chunk of streamResult) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            setResult(fullText);
        }
      }

      addLog('success', `${contextName} completed.`);
      setShowSolutionButton(true);

    } catch (error: any) {
      console.error(error);
      setResult(`**ERROR:** ${error.message}`);
      addLog('error', `${contextName} failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. General Inversion (Existing)
  const handleAnalyze = () => {
    if (!input.trim() && attachments.length === 0) return;
    const prompt = `
      User Input: "${input}"
      Task: Apply Inversion Thinking analysis based on system instructions.
      ${attachments.length > 0 ? `NOTE: Analyzed attached ${attachments.length} files critically.` : ''}
      SYSTEM CONTEXT: ${NAVAL_MUNGER_CONTEXT}
    `;
    generateWithPrompt(prompt, true, "Inversion Analysis");
  };

  // Re-implementing handleAnalyze to match previous specific behavior (history, etc)
  const handleAnalyzeSpecific = async () => {
     if (!apiKey) {
      alert(language === 'vi' ? 'Vui lòng nhập API Key trong phần Cài đặt!' : 'Please enter API Key in Settings!');
      setActiveTab('settings');
      return;
    }
    if (!input.trim() && attachments.length === 0) return;

    setIsGenerating(true);
    setShowSolutionButton(false);
    setResult('');
    addLog('info', `Starting analysis...`);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `
      User Input: "${input}"
      Language Requirement: ${language === 'vi' ? 'Vietnamese' : 'English'}
      Task: Apply Inversion Thinking analysis. Use Google Search.
      SYSTEM CONTEXT: ${NAVAL_MUNGER_CONTEXT}
      `;

      const chatSession = ai.chats.create({
        model: modelName,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parts: any[] = [{ text: promptText }];
      attachments.forEach(att => {
          parts.push({
              inlineData: {
                  mimeType: att.mimeType,
                  data: att.data
              }
          });
      });

      const streamResult = await chatSession.sendMessageStream({ message: parts });
      
      let fullText = '';
      for await (const chunk of streamResult) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            setResult(fullText);
        }
      }

      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleString(),
        input: attachments.length > 0 ? `[${attachments.length} Files] ${input}` : input,
        output: fullText,
        model: modelName
      };
      setHistory((prev) => [historyItem, ...prev]);
      addLog('success', 'Analysis completed.');
      setShowSolutionButton(true);

    } catch (error: any) {
       setResult(`**SYSTEM ERROR:** ${error.message}`);
       addLog('error', error.message);
    } finally {
      setIsGenerating(false);
    }
  }


  // 2. Daily Idea (Existing)
  const handleGenerateIdea = () => generateWithPrompt(IDEA_GENERATION_PROMPT, true, "Startup Idea");

  // 3. YouTube/TikTok Ideas (New)
  const handleGenerateChannel = () => generateWithPrompt(CHANNEL_GENERATION_PROMPT, false, "Channel Idea");

  // 4. Trending (New)
  const handleScanTrends = () => generateWithPrompt(TRENDING_PROMPT, true, "Trend Scan");

  // 5. Deep Research (New)
  const handleResearchNiche = () => {
      if (!researchQuery) return;
      const prompt = `
      KEYWORD/NICHE: "${researchQuery}"
      ${RESEARCH_PROMPT_PREFIX}
      `;
      generateWithPrompt(prompt, true, "Niche Research");
  };

  // 6. Solutions (Existing)
  const handleGenerateSolutions = async () => {
    if (!result) return;
    setIsGenerating(true);
    setShowSolutionButton(false);
    const previousContent = result;
    const divider = `\n\n---\n\n### 🛠️ ${language === 'vi' ? 'GIẢI PHÁP & HƯỚNG XỬ LÝ' : 'SOLUTIONS & STRATEGY'}\n\n`;
    setResult(prev => prev + divider + "_Thinking of solutions..._");

    try {
        const ai = new GoogleGenAI({ apiKey });
        const fullPrompt = `
        CONTEXT: ${activeTab === 'research' ? 'Niche Analysis' : 'Idea Inversion'}
        PREVIOUS OUPUT: ${previousContent}
        TASK: ${SOLUTION_PROMPT_PREFIX}
        Language Output: ${language === 'vi' ? 'Vietnamese' : 'English'}
        `;

        const response = await ai.models.generateContentStream({
            model: modelName,
            contents: fullPrompt, 
        });

        let solutionText = "";
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                solutionText += text;
                setResult(previousContent + divider + solutionText);
            }
        }
    } catch (error: any) {
        setResult(previousContent + divider + `Error: ${error.message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  // Logic: Manual Save
  const handleSaveToHistory = (prefix: string = "💡 Idea") => {
    if (!result) return;
    // Try to extract a title from headers
    const titleMatch = result.match(/^#\s+(.+)$/m) || result.match(/^##\s+(.+)$/m);
    let rawTitle = titleMatch ? titleMatch[1] : result.split('\n')[0].replace(/#/g, '').trim();
    if (activeTab === 'research') rawTitle = `Research: ${researchQuery}`;
    if (activeTab === 'trending') rawTitle = `Trend Scan: ${new Date().toLocaleDateString()}`;

    const cleanTitle = rawTitle.substring(0, 50);

    const historyItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString(),
      input: `${prefix} ${cleanTitle}`,
      output: result,
      model: modelName
    };

    setHistory((prev) => [historyItem, ...prev]);
    addLog('success', 'Saved to history.');
    alert(language === 'vi' ? 'Đã lưu vào Lịch sử!' : 'Saved to History!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    alert('Copied!');
  };

  const handlePrint = () => {
      window.print();
  }

  // --- UI RENDERERS ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); if (window.innerWidth < 768) setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
        activeTab === id 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'text-gray-400 hover:bg-surface hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-primary mb-4 border-b border-gray-700 pb-2 mt-6" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-blue-400 mb-3 mt-5" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
        p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-300" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent pl-4 italic text-gray-400 my-4 bg-surface/50 py-2 pr-2 rounded-r" {...props} />,
        table: ({node, ...props}) => <div className="overflow-x-auto my-4 border border-gray-700 rounded-lg"><table className="w-full text-left border-collapse" {...props} /></div>,
        th: ({node, ...props}) => <th className="bg-surface p-3 border-b border-gray-700 font-bold text-white" {...props} />,
        td: ({node, ...props}) => <td className="p-3 border-b border-gray-800 text-gray-300" {...props} />,
        code: ({node, ...props}) => <code className="bg-black/50 px-1 py-0.5 rounded font-mono text-sm text-yellow-500" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );

  const renderResultArea = (savePrefix: string, onSave: () => void) => (
      <div className="flex-1 bg-surface rounded-xl border border-gray-700 shadow-lg flex flex-col min-h-0 printable-content">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-surface/50 backdrop-blur rounded-t-xl no-print">
                 <span className="font-mono text-xs text-gray-400">ANALYSIS RESULT</span>
                 <div className="flex gap-2">
                    {result && !isGenerating && (
                        <button 
                            onClick={onSave}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300 border border-green-600/50 rounded transition-all"
                        >
                            <Save size={16} />
                            <span className="text-xs font-bold">{language === 'vi' ? 'Lưu' : 'Save'}</span>
                        </button>
                    )}
                    <button onClick={handleCopy} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Copy size={16} /></button>
                 </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
                {!result && !isGenerating && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Activity size={48} className="mb-4" />
                        <p>{language === 'vi' ? 'Sẵn sàng phân tích...' : 'Ready to analyze...'}</p>
                    </div>
                )}
                {result && <MarkdownRenderer content={result} />}
                
                {showSolutionButton && !isGenerating && result && (
                     <div className="mt-8 pt-4 border-t border-gray-700 flex justify-center pb-4">
                         <button
                            onClick={handleGenerateSolutions}
                            className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                         >
                            <Wrench />
                            {language === 'vi' ? 'ĐỀ XUẤT GIẢI PHÁP' : 'FIND SOLUTIONS'}
                         </button>
                     </div>
                )}
                
                <div ref={resultEndRef} />
            </div>
        </div>
  );

  // --- SPECIFIC TABS ---

  const renderGenerator = () => (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-surface p-4 rounded-xl border border-gray-700 shadow-lg no-print">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {language === 'vi' ? 'Nhập ý tưởng/vấn đề (Tư duy ngược):' : 'Input idea/problem (Inversion Thinking):'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'vi' ? "Tôi muốn làm X..." : "I want to do X..."}
          className="w-full h-24 bg-background text-white p-3 rounded-lg border border-gray-700 focus:border-primary outline-none transition font-mono resize-none mb-3"
        />
        
        {/* Attachment UI */}
        {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg">
                        {getFileIcon(att.mimeType)}
                        <span className="text-sm text-blue-200 truncate max-w-[150px]">{att.name}</span>
                        <button onClick={() => removeAttachment(att.id)} className="text-gray-400 hover:text-red-400"><X size={12} /></button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.txt,.md,.png,.jpg,.doc,.docx" />
                 <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><Paperclip size={16} /> Attach</button>
             </div>
             <button
                onClick={handleAnalyzeSpecific}
                disabled={isGenerating || (!input && attachments.length === 0)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                    isGenerating ? 'bg-gray-700' : 'bg-primary hover:bg-blue-600 text-white'
                }`}
             >
                {isGenerating ? <Activity className="animate-spin" /> : <Zap fill="currentColor" />}
                {language === 'vi' ? 'PHÂN TÍCH' : 'ANALYZE'}
             </button>
        </div>
      </div>
      {renderResultArea("🛠️ Inversion", () => handleSaveToHistory("🛠️ Inversion"))}
    </div>
  );

  const renderIdeas = () => (
    <div className="flex flex-col h-full gap-4">
        <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 rounded-xl border border-purple-500/30 shadow-lg shrink-0 flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Micro-SaaS & Apps</h2>
                <p className="text-gray-400 text-sm">Target US Market. Web Tools, Mobile Games.</p>
             </div>
             <button
                onClick={handleGenerateIdea}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
                {isGenerating ? <Activity className="animate-spin" /> : <Zap fill="currentColor" />} Brainstorm
            </button>
        </div>
        {renderResultArea("💡 Idea", () => handleSaveToHistory("💡 Idea"))}
    </div>
  );

  const renderChannelIdeas = () => (
    <div className="flex flex-col h-full gap-4">
        <div className="bg-gradient-to-r from-red-900 to-slate-900 p-6 rounded-xl border border-red-500/30 shadow-lg shrink-0 flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Video className="text-red-500" /> YouTube & TikTok Faceless</h2>
                <p className="text-gray-400 text-sm">Automation ideas. US Audience. Adsense & Affiliates.</p>
             </div>
             <button
                onClick={handleGenerateChannel}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
                {isGenerating ? <Activity className="animate-spin" /> : <PlayCircle fill="currentColor" />} Brainstorm Channel
            </button>
        </div>
        {renderResultArea("📺 Channel", () => handleSaveToHistory("📺 Channel"))}
    </div>
  );

  const renderTrending = () => (
    <div className="flex flex-col h-full gap-4">
        <div className="bg-gradient-to-r from-pink-900 to-slate-900 p-6 rounded-xl border border-pink-500/30 shadow-lg shrink-0 flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><TrendingUp className="text-pink-400" /> US Trend Hunter</h2>
                <p className="text-gray-400 text-sm">Real-time Google Search for viral US topics.</p>
             </div>
             <button
                onClick={handleScanTrends}
                disabled={isGenerating}
                className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-pink-500/20 flex items-center gap-2"
            >
                {isGenerating ? <Activity className="animate-spin" /> : <Search />} Scan Trends
            </button>
        </div>
        
        {/* Helper text for linking */}
        {result && (
            <div className="bg-surface p-2 rounded border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <Microscope size={12} />
                <span>Found a good keyword? Copy it and go to the <b>Deep Research</b> tab.</span>
            </div>
        )}

        {renderResultArea("🔥 Trend", () => handleSaveToHistory("🔥 Trend"))}
    </div>
  );

  const renderResearch = () => (
    <div className="flex flex-col h-full gap-4">
        <div className="bg-surface p-4 rounded-xl border border-gray-700 shadow-lg no-print">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Microscope className="text-blue-400" /> Deep Niche Research</h2>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder={language === 'vi' ? "Nhập ngách/từ khóa (VD: AI True Crime)..." : "Enter niche/keyword (e.g., AI True Crime)..."}
                    className="flex-1 bg-background text-white p-3 rounded-lg border border-gray-700 focus:border-primary outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleResearchNiche()}
                />
                <button
                    onClick={handleResearchNiche}
                    disabled={isGenerating || !researchQuery}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap"
                >
                    {isGenerating ? <Activity className="animate-spin" /> : <Search />} Research
                </button>
            </div>
        </div>
        {renderResultArea("🔎 Research", () => handleSaveToHistory("🔎 Research"))}
    </div>
  );

  const renderHistory = () => (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-primary" />
            {language === 'vi' ? 'Lịch Sử' : 'History'}
        </h2>
        {history.length > 0 && (
            <button onClick={() => { if(confirm('Clear all?')) setHistory([]); }} className="text-red-400 text-sm">Clear</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {history.length === 0 ? <p className="text-center text-gray-500 mt-20">No history.</p> : (
            history.map((item) => (
                <div key={item.id} className="bg-surface p-4 rounded-lg border border-gray-700 hover:border-primary transition group relative">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-500">{item.timestamp}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => { setResult(item.output); setActiveTab('generator'); setShowSolutionButton(true); }} className="hover:text-primary"><BookOpen size={16} /></button>
                            <button onClick={() => setHistory(h => h.filter(i => i.id !== item.id))} className="hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <div className="font-bold text-white mb-1 line-clamp-1">{item.input}</div>
                    <div className="text-xs text-gray-400 line-clamp-2 border-l-2 border-gray-600 pl-2">{item.output.replace(/[#*]/g, '')}</div>
                </div>
            ))
        )}
      </div>
    </div>
  );

  const renderDocs = () => (
    <div className="h-full overflow-y-auto px-4 pb-20 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <HelpCircle className="text-primary" size={32} />
                {language === 'vi' ? 'Hướng Dẫn Sử Dụng (Newbie Guide)' : 'User Guide & Documentation'}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
                {language === 'vi' 
                 ? 'Chào mừng! App này không giúp bạn "thành công nhanh". Nó giúp bạn KHÔNG THẤT BẠI. Đây là sự khác biệt.' 
                 : 'Welcome! This app does not promise "quick success". It helps you AVOID FAILURE. That is the difference.'}
            </p>
        </div>

        {/* SECTION 1: VISUAL WORKFLOW */}
        <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-primary pl-4">
                {language === 'vi' ? 'Quy Trình Hoạt Động (The Workflow)' : 'The Core Workflow'}
            </h2>
            
            <div className="relative flex flex-col md:flex-row gap-4 items-center justify-center bg-surface/30 p-8 rounded-2xl border border-gray-700/50">
                {/* Step 1 */}
                <div className="w-full md:w-64 bg-blue-900/20 border border-blue-500/50 p-5 rounded-xl text-center relative hover:scale-105 transition">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">STEP 1</div>
                    <Lightbulb className="mx-auto text-blue-400 mb-2" size={32} />
                    <h3 className="font-bold text-white mb-1">{language === 'vi' ? 'Ý Tưởng (Input)' : 'Your Idea'}</h3>
                    <p className="text-xs text-blue-200">Nhập ý tưởng, file tài liệu hoặc keyword vào hệ thống.</p>
                </div>

                <div className="hidden md:block"><ArrowRight className="text-gray-500" /></div>
                <div className="md:hidden"><ArrowDown className="text-gray-500" /></div>

                {/* Step 2 */}
                <div className="w-full md:w-64 bg-red-900/20 border border-red-500/50 p-5 rounded-xl text-center relative hover:scale-105 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">STEP 2</div>
                    <ShieldAlert className="mx-auto text-red-400 mb-2" size={32} />
                    <h3 className="font-bold text-white mb-1">{language === 'vi' ? 'Tư Duy Ngược' : 'The Inversion'}</h3>
                    <p className="text-xs text-red-200">AI sẽ "tấn công" ý tưởng. Tìm ra điểm chết, rủi ro, sự ảo tưởng.</p>
                </div>

                <div className="hidden md:block"><ArrowRight className="text-gray-500" /></div>
                <div className="md:hidden"><ArrowDown className="text-gray-500" /></div>

                {/* Step 3 */}
                <div className="w-full md:w-64 bg-emerald-900/20 border border-emerald-500/50 p-5 rounded-xl text-center relative hover:scale-105 transition">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">STEP 3</div>
                    <Wrench className="mx-auto text-emerald-400 mb-2" size={32} />
                    <h3 className="font-bold text-white mb-1">{language === 'vi' ? 'Giải Pháp' : 'The Solution'}</h3>
                    <p className="text-xs text-emerald-200">Bấm nút "Find Solutions" để tìm cách khắc phục các điểm chết đó.</p>
                </div>
            </div>
        </div>

        {/* SECTION 2: TOOLS BREAKDOWN */}
        <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-pink-500 pl-4">
                {language === 'vi' ? 'Các Công Cụ (Tools Explanation)' : 'Tools Breakdown'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface p-5 rounded-lg border border-gray-700 hover:border-primary transition">
                    <div className="flex items-center gap-3 mb-3">
                        <Cpu className="text-primary" />
                        <h3 className="font-bold text-white">Generator (Phân Tích)</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        {language === 'vi' 
                        ? 'Dùng cho mọi vấn đề chung. Có thể upload file (PDF, Word) để AI đọc và phản biện tài liệu đó.' 
                        : 'General purpose. Upload files (PDF, Word) for AI to critique your documents.'}
                    </p>
                </div>

                <div className="bg-surface p-5 rounded-lg border border-gray-700 hover:border-yellow-400 transition">
                    <div className="flex items-center gap-3 mb-3">
                        <Lightbulb className="text-yellow-400" />
                        <h3 className="font-bold text-white">App Ideas (Ý Tưởng App)</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        {language === 'vi' 
                        ? 'Chuyên cho Micro-SaaS, Mobile Game nhắm thị trường Mỹ. Tính sẵn roadmap và khả năng kiếm tiền.' 
                        : 'Specialized for Micro-SaaS & Games targeting US Market. Includes roadmap & monetization.'}
                    </p>
                </div>

                <div className="bg-surface p-5 rounded-lg border border-gray-700 hover:border-red-500 transition">
                    <div className="flex items-center gap-3 mb-3">
                        <Video className="text-red-500" />
                        <h3 className="font-bold text-white">YouTube/TikTok</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        {language === 'vi' 
                        ? 'Tạo concept kênh Faceless, Automation. Tránh bẫy bản quyền và ảo tưởng view.' 
                        : 'Create Faceless/Automation channel concepts. Avoid copyright traps and view delusions.'}
                    </p>
                </div>

                <div className="bg-surface p-5 rounded-lg border border-gray-700 hover:border-pink-400 transition">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-2"><TrendingUp className="text-pink-400" /><Microscope className="text-blue-400" /></div>
                        <h3 className="font-bold text-white">Trend & Research</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        {language === 'vi' 
                        ? 'Săn trend thực tế từ Google Search. Nghiên cứu sâu số liệu của một ngách cụ thể.' 
                        : 'Hunt real trends via Google Search. Deep dive into metrics of a specific niche.'}
                    </p>
                </div>
            </div>
        </div>

        {/* SECTION 3: PHILOSOPHY */}
        <div className="bg-black/30 p-6 rounded-xl border border-gray-800 text-center">
            <h3 className="text-lg font-bold text-gray-300 mb-2">"Invert, always invert"</h3>
            <p className="text-gray-500 italic mb-4">- Carl Jacobi</p>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
                {language === 'vi' 
                ? 'Hầu hết mọi người cố gắng để thông minh. Chúng ta chỉ cần cố gắng để "không ngu ngốc". Đó là con đường bền vững nhất để đến thành công.' 
                : 'Most people try to be smart. We just try to "not be stupid". That is the most sustainable path to success.'}
            </p>
        </div>
    </div>
  );

  const renderDeploy = () => (
    <div className="h-full overflow-y-auto px-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Cloud className="text-primary" size={32} />
            Deploy lên Cloudflare Pages
        </h1>
        <p className="text-gray-400">
            Vì đây là một React App hiện đại (sử dụng .tsx và modules), để đưa lên web thực tế, bạn cần một công cụ đóng gói (Build Tool) như Vite. 
            Dưới đây là hướng dẫn từng bước để bạn tự deploy.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex items-center gap-2">
                <Terminal size={20} className="text-green-400" />
                <h3 className="font-bold text-white">Bước 1: Khởi tạo Project (Local)</h3>
            </div>
            <div className="p-6">
                <p className="text-gray-300 mb-4">Mở Terminal trên máy tính của bạn và chạy lệnh sau để tạo khung project React + TypeScript:</p>
                <div className="bg-black p-4 rounded-lg font-mono text-sm text-gray-300 border border-gray-700 relative group">
                    <code className="block text-green-400">npm create vite@latest the-inverter -- --template react-ts</code>
                    <code className="block mt-2">cd the-inverter</code>
                    <code className="block">npm install</code>
                    <button onClick={() => navigator.clipboard.writeText("npm create vite@latest the-inverter -- --template react-ts\ncd the-inverter\nnpm install")} className="absolute top-2 right-2 p-2 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition"><Copy size={14}/></button>
                </div>
            </div>
        </div>

        {/* Step 2 */}
        <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex items-center gap-2">
                <Terminal size={20} className="text-yellow-400" />
                <h3 className="font-bold text-white">Bước 2: Cài đặt thư viện</h3>
            </div>
            <div className="p-6">
                <p className="text-gray-300 mb-4">Cài đặt đúng các thư viện mà App này đang sử dụng:</p>
                <div className="bg-black p-4 rounded-lg font-mono text-sm text-gray-300 border border-gray-700 relative group">
                    <code className="block text-yellow-400">npm install @google/genai react-markdown remark-gfm lucide-react</code>
                    <button onClick={() => navigator.clipboard.writeText("npm install @google/genai react-markdown remark-gfm lucide-react")} className="absolute top-2 right-2 p-2 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition"><Copy size={14}/></button>
                </div>
            </div>
        </div>

        {/* Step 3 */}
        <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex items-center gap-2">
                <Code2 size={20} className="text-blue-400" />
                <h3 className="font-bold text-white">Bước 3: Copy Code</h3>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-gray-300">
                    Mở file <code className="bg-gray-700 px-1 rounded">src/App.tsx</code> trong project vừa tạo, xóa hết nội dung cũ và copy toàn bộ code từ file <code className="bg-gray-700 px-1 rounded">index.tsx</code> của app này vào.
                </p>
                
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                    <h4 className="font-bold text-red-400 text-sm mb-2">⚠️ LƯU Ý QUAN TRỌNG:</h4>
                    <p className="text-xs text-gray-300">
                        Vì code này đang chạy trên trình duyệt (không có build step), ở cuối file có đoạn: <br/>
                        <code className="text-yellow-400">const root = createRoot(...)</code>. <br/>
                        Khi chuyển sang Vite, bạn hãy <b>XÓA</b> đoạn đó đi và chỉ giữ lại component <code className="text-blue-300">App</code> và các function/biến bên trên. File <code className="bg-gray-800 px-1 rounded">main.tsx</code> của Vite sẽ tự lo phần render.
                    </p>
                </div>

                <div className="bg-black p-4 rounded-lg font-mono text-xs text-gray-400 border border-gray-700 max-h-40 overflow-y-auto">
                    {`// src/App.tsx (Example structure)
import React, { ... } from 'react';
// ... imports ...

// ... constants & components ...

const App = () => {
   // ... toàn bộ logic của App ...
   return ( ... );
}

export default App; // <--- Nhớ export default App`}
                </div>
            </div>
        </div>

        {/* Step 4 */}
        <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex items-center gap-2">
                <Cloud size={20} className="text-orange-400" />
                <h3 className="font-bold text-white">Bước 4: Deploy lên Cloudflare Pages</h3>
            </div>
            <div className="p-6">
                <ol className="list-decimal pl-5 space-y-3 text-gray-300">
                    <li>Chạy lệnh build: <code className="bg-black px-2 py-1 rounded text-green-400">npm run build</code>. Một thư mục <code className="bg-gray-700 px-1 rounded">dist</code> sẽ được tạo ra.</li>
                    <li>Đăng nhập <a href="https://dash.cloudflare.com" target="_blank" className="text-primary hover:underline">Cloudflare Dashboard</a>.</li>
                    <li>Vào mục <b>Workers & Pages</b> -> <b>Create Application</b> -> Tab <b>Pages</b>.</li>
                    <li>Chọn <b>Upload Assets</b> (hoặc Connect to Git nếu bạn đã push code lên GitHub).</li>
                    <li>Kéo thả thư mục <code className="bg-gray-700 px-1 rounded">dist</code> vừa tạo vào đó.</li>
                    <li>Xong! App của bạn đã chạy online.</li>
                </ol>
            </div>
        </div>

      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-primary" /> Settings</h2>
            
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className={`w-full bg-background text-white p-3 rounded-lg border ${apiKey ? 'border-green-500/50' : 'border-gray-700'} outline-none`}
                        />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-gray-400">{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <button 
                        onClick={() => { setApiKey(apiKey); alert(language === 'vi' ? 'Đã lưu Key thành công!' : 'Key Saved Successfully!'); }}
                        className="bg-primary hover:bg-blue-600 text-white px-4 rounded-lg font-bold"
                    >
                        {language === 'vi' ? 'Lưu' : 'Save'}
                    </button>
                </div>
                {apiKey && <div className="text-green-400 text-sm mt-2 flex items-center gap-2"><CheckCircle2 size={14}/> {language === 'vi' ? 'Đã kết nối & lưu trữ trên thiết bị' : 'Connected & Saved on device'}</div>}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Language</label>
                    <div className="flex gap-2 bg-background p-1 rounded-lg border border-gray-700">
                        <button onClick={() => setLanguage('vi')} className={`flex-1 py-2 rounded ${language === 'vi' ? 'bg-primary' : ''}`}>VN</button>
                        <button onClick={() => setLanguage('en')} className={`flex-1 py-2 rounded ${language === 'en' ? 'bg-primary' : ''}`}>EN</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Model</label>
                    <select value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full bg-background p-3 rounded-lg border border-gray-700">
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
  );

  const renderVersions = () => (
    <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><GitBranch className="text-primary" /> Version Control</h2>
        <div className="space-y-6 ml-4 border-l-2 border-gray-700 pl-8 pb-10">
            {CHANGELOG.map((log, index) => (
                <div key={index} className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-surface border-4 border-gray-600"></div>
                    <div className="bg-surface p-5 rounded-xl border border-gray-700">
                        <div className="flex justify-between mb-3"><h3 className="text-lg font-bold">v{log.version}</h3><span className="text-sm text-gray-500">{log.date}</span></div>
                        <ul className="space-y-2">{log.changes.map((c, i) => <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-primary">•</span>{c}</li>)}</ul>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // --- RENDER APP ---

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text selection:bg-primary/30">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-20'} bg-surface/50 border-r border-gray-800 flex-shrink-0 transition-all duration-300 flex flex-col no-print backdrop-blur-sm z-20`}>
        <div className="p-4 flex items-center justify-between">
          <div className={`font-bold text-xl tracking-tighter flex items-center gap-2 ${!sidebarOpen && 'md:justify-center'}`}>
            <Activity className="text-primary" />
            {sidebarOpen && <span>INVERTER</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <SidebarItem id="generator" icon={Cpu} label={sidebarOpen ? (language === 'vi' ? 'Phân Tích' : 'Generator') : ''} />
          <div className="my-2 border-t border-gray-700/50 mx-4"></div>
          <SidebarItem id="ideas" icon={Lightbulb} label={sidebarOpen ? (language === 'vi' ? 'Ý Tưởng App/SaaS' : 'App/SaaS Ideas') : ''} />
          <SidebarItem id="channel_ideas" icon={Video} label={sidebarOpen ? (language === 'vi' ? 'Ý Tưởng Kênh' : 'Channel Ideas') : ''} />
          <SidebarItem id="trending" icon={TrendingUp} label={sidebarOpen ? (language === 'vi' ? 'Bắt Trend Mỹ' : 'Trend Hunter') : ''} />
          <SidebarItem id="research" icon={Microscope} label={sidebarOpen ? (language === 'vi' ? 'Nghiên Cứu Sâu' : 'Deep Research') : ''} />
          <div className="my-2 border-t border-gray-700/50 mx-4"></div>
          <SidebarItem id="docs" icon={HelpCircle} label={sidebarOpen ? (language === 'vi' ? 'Hướng Dẫn / Guide' : 'Documentation') : ''} />
          <SidebarItem id="deploy" icon={Rocket} label={sidebarOpen ? (language === 'vi' ? 'Deploy Guide' : 'Deploy Guide') : ''} />
          <SidebarItem id="history" icon={History} label={sidebarOpen ? (language === 'vi' ? 'Lịch Sử' : 'History') : ''} />
          <SidebarItem id="versions" icon={GitBranch} label={sidebarOpen ? (language === 'vi' ? 'Phiên Bản' : 'Versions') : ''} />
          <SidebarItem id="settings" icon={Settings} label={sidebarOpen ? (language === 'vi' ? 'Cài Đặt' : 'Settings') : ''} />
        </div>
        
        <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-500">{sidebarOpen && `v${APP_VERSION}`}</div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        <div className="md:hidden p-4 bg-surface border-b border-gray-800 flex justify-between items-center">
            <span className="font-bold">The Inverter</span>
            <button onClick={() => setSidebarOpen(true)}><Menu /></button>
        </div>

        <div className="flex-1 overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
            {activeTab === 'generator' && renderGenerator()}
            {activeTab === 'ideas' && renderIdeas()}
            {activeTab === 'channel_ideas' && renderChannelIdeas()}
            {activeTab === 'trending' && renderTrending()}
            {activeTab === 'research' && renderResearch()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'versions' && renderVersions()}
            {activeTab === 'docs' && renderDocs()}
            {activeTab === 'deploy' && renderDeploy()}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);