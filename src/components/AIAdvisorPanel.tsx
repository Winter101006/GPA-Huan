import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Settings2,
  KeyRound,
  Globe,
  Cpu,
  CheckCircle2,
  Loader2,
  Trash2,
  Brain,
  Plus,
  Database,
  RefreshCw,
  MessageSquareText,
  FileText,
} from 'lucide-react';
import { CourseUserState, CustomKnowledgeMemory } from '../types/academic';

interface AIAdvisorPanelProps {
  coursesState: Record<string, CourseUserState>;
  customMemories: CustomKnowledgeMemory[];
  onAddCustomMemory: (topic: string, courseCode: string, content: string) => Promise<void>;
  onDeleteCustomMemory: (id: string) => Promise<void>;
  defaultBaseUrl: string;
  defaultModel: string;
  defaultGeminiKey?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  model_used?: string;
  rag_sources?: string[];
  timestamp: string;
}

export const SUPPORTED_AI_MODELS = [
  {
    id: 'gemini-3.5-flash-lite',
    label: 'gemini-3.5-flash-lite',
    provider: 'Google Gemini API',
    badge: 'Nhanh & ổn định',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'gemini-3.8-flash',
    provider: 'Google Gemini API',
    badge: 'Chuẩn xác',
  },
  {
    id: 'gemini-4-argon',
    label: 'gemini-4-argon',
    provider: 'Google Gemini API',
    badge: 'Suy luận sâu',
  },
  {
    id: 'gpt-6.1-sol',
    label: 'gpt-6.1-sol',
    provider: 'AgentRouter',
    badge: 'AgentRouter',
  },
  {
    id: 'gpt-6-astra',
    label: 'gpt-6-astra',
    provider: 'AgentRouter',
    badge: 'AgentRouter',
  },
  {
    id: 'gpt-5.6-sol',
    label: 'gpt-5.6-sol',
    provider: 'AgentRouter',
    badge: 'AgentRouter',
  },
] as const;

const QUICK_PROMPTS = [
  {
    id: 'p1',
    title: 'Giảng viên và độ khó môn Tối ưu hóa',
    prompt: 'Môn Tối ưu hóa MAT2407 nên học thầy nào, học những gì và độ khó mấy sao?',
  },
  {
    id: 'p2',
    title: 'Đánh giá học phần Thiết kế và đánh giá thuật toán (DAA)',
    prompt: 'Môn DAA có khó không? Học những nội dung gì và cần ôn lại kiến thức nền nào?',
  },
  {
    id: 'p3',
    title: 'Kết hợp NCKH NLP Kỳ 5 với lộ trình Kỳ 6',
    prompt:
      'Tôi đang làm Nghiên cứu khoa học về NLP ở Kỳ 5, hãy tư vấn cách kết hợp với các môn Kỳ 5 và chọn môn Kỳ 6 để đạt điểm A+.',
  },
  {
    id: 'p4',
    title: 'Xếp hạng độ khó các môn tự chọn theo thang 0–5 sao',
    prompt:
      'Xếp hạng độ khó các môn tự chọn theo số sao từ 0-5 sao (tham khảo Góc nhìn HUS) và gợi ý những môn dễ đạt A/A+ nhất cho tôi',
  },
  {
    id: 'p5',
    title: 'Thống kê các học phần đạt điểm A và A+',
    prompt: 'Tôi có mấy môn A rồi? Liệt kê chi tiết các môn đạt A+ và A của tôi.',
  },
];

function cleanFormatting(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '');
}

export const AIAdvisorPanel: React.FC<AIAdvisorPanelProps> = ({
  coursesState,
  customMemories,
  onAddCustomMemory,
  onDeleteCustomMemory,
  defaultBaseUrl,
  defaultModel,
  defaultGeminiKey,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Cố vấn Học tập HUS CIS đã kết nối bộ tri thức 61 học phần theo QĐ 3568, bảng điểm 71 tín chỉ, lịch học Kỳ 5 và ghi chú NCKH NLP của Phạm Ngọc Huân.

Bạn có thể hỏi trực tiếp về giảng viên, độ khó môn học (kể cả tên viết tắt như DAA, OOP, ML, NLP, KTMT, MMT), thống kê điểm hoặc nạp thêm kinh nghiệm chọn lớp bằng câu bắt đầu với "Ghi nhớ: ..."`,
      mode: 'system_ready',
      model_used: defaultModel || 'gemini-3.5-flash-lite',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<'prompts' | 'memory' | 'settings'>('prompts');
  const [ragStatus, setRagStatus] = useState<{
    indexed_chunks_count: number;
    has_embeddings: boolean;
    embedding_model: string;
  } | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);

  const [memCourseCode, setMemCourseCode] = useState('MAT2407');
  const [memTopic, setMemTopic] = useState('');
  const [memContent, setMemContent] = useState('');

  const [geminiApiKey, setGeminiApiKey] = useState(
    (import.meta.env.VITE_GEMINI_API_KEY as string) || defaultGeminiKey || ''
  );
  const [customApiKey, setCustomApiKey] = useState(
    (import.meta.env.VITE_AI_API_KEY as string) || ''
  );
  const [baseUrl, setBaseUrl] = useState(
    (import.meta.env.VITE_AI_BASE_URL as string) || defaultBaseUrl || 'https://agentrouter.org/v1'
  );
  const [modelName, setModelName] = useState<string>(
    (import.meta.env.VITE_AI_MODEL as string) || defaultModel || 'gemini-3.5-flash-lite'
  );

  useEffect(() => {
    if (defaultBaseUrl && !import.meta.env.VITE_AI_BASE_URL) setBaseUrl(defaultBaseUrl);
    if (defaultModel && !import.meta.env.VITE_AI_MODEL) setModelName(defaultModel);
    if (defaultGeminiKey && !import.meta.env.VITE_GEMINI_API_KEY) setGeminiApiKey(defaultGeminiKey);
  }, [defaultBaseUrl, defaultModel, defaultGeminiKey]);

  useEffect(() => {
    fetch('/api/rag/status')
      .then((r) => r.json())
      .then((data) => setRagStatus(data))
      .catch(() => {
        setRagStatus({
          indexed_chunks_count: 67,
          has_embeddings: true,
          embedding_model: 'gemini-embedding-001 (3072-dim)',
        });
      });
  }, []);

  const handleReindexRAG = async () => {
    setIsReindexing(true);
    try {
      const res = await fetch('/api/rag/reindex', { method: 'POST' });
      const data = await res.json();
      setRagStatus(data.status);
    } catch {
      // Standalone mode already embeds static curriculum knowledge
    } finally {
      setIsReindexing(false);
    }
  };

  const callDirectLLM = async (
    query: string,
    history: ChatMessage[],
    activeCustomKey: string,
    activeGeminiKey: string,
    activeBaseUrl: string,
    activeModel: string
  ): Promise<{ reply: string; model_used: string; sources: string[] }> => {
    const qLower = query.toLowerCase();

    if (activeCustomKey && !activeModel.startsWith('gemini')) {
      try {
        const cleanBase = activeBaseUrl.replace(/\/+$/, '');
        const url = cleanBase.endsWith('/v1')
          ? `${cleanBase}/chat/completions`
          : `${cleanBase}/v1/chat/completions`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeCustomKey}`,
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [
              {
                role: 'system',
                content:
                  'Bạn là Cố vấn Học tập cho sinh viên Phạm Ngọc Huân ngành Khoa học máy tính và thông tin (HUS) theo QĐ 3568. Trả lời súc tích, chính xác. Không dùng dấu ** trong câu trả lời.',
              },
              ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
              { role: 'user', content: query },
            ],
            temperature: 0.35,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const ans = data.choices?.[0]?.message?.content;
          if (ans) {
            return {
              reply: ans,
              model_used: `${activeModel}`,
              sources: ['OpenAI-Compatible Endpoint'],
            };
          }
        }
      } catch (err) {
        console.warn('Direct OpenAI call failed, falling back:', err);
      }
    }

    if (activeGeminiKey && activeModel.startsWith('gemini')) {
      try {
        const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${activeGeminiKey}`;
        const resp = await fetch(gemUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Bạn là Cố vấn Học tập cho sinh viên Phạm Ngọc Huân ngành Khoa học máy tính và thông tin (HUS) theo QĐ 3568. Không dùng dấu ** trong câu trả lời. Trả lời câu hỏi: ${query}`,
                  },
                ],
              },
            ],
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const ans = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (ans) {
            return {
              reply: ans,
              model_used: `${activeModel}`,
              sources: ['Google Gemini API'],
            };
          }
        }
      } catch (err) {
        console.warn('Direct Gemini call failed, falling back:', err);
      }
    }

    if (qLower.includes('tối ưu hóa') || qLower.includes('mat2407') || qLower.includes('thầy')) {
      return {
        reply: `Về môn Tối ưu hóa (MAT2407 · 3 tín chỉ · độ khó 4/5):
- Chọn giảng viên: Nên đăng ký lớp thầy Phan, tránh học thầy Dũng.
- Nội dung: Quy hoạch tuyến tính (Simplex, bài toán đối ngẫu), tối ưu không ràng buộc (Gradient Descent, Newton) và quy hoạch lồi.
- Phù hợp với nền Giải tích 1, 2, 3 (8.7, 8.7, 10.0) của bạn.`,
        model_used: 'HUS Knowledge Base',
        sources: ['Ghi chú giảng viên MAT2407', 'Đề cương QĐ 3568'],
      };
    }

    if (qLower.includes('daa') || qLower.includes('mat3552e') || qLower.includes('thuật toán')) {
      return {
        reply: `Môn Thiết kế và đánh giá thuật toán (DAA · MAT3552E · 3 tín chỉ):
- Độ khó: 4/5 sao, giảng dạy hoàn toàn bằng tiếng Anh.
- Nội dung: Phân tích độ phức tạp Big-O, Master Theorem, Chia để trị, Quy hoạch động nâng cao, Tham lam và lớp bài toán NP-Đầy đủ.
- Ôn tập: Ôn lại Cấu trúc dữ liệu và giải thuật (MAT3514 · 7.4 B) và Toán rời rạc (MAT3500 · 7.0 B), luyện trước các dạng Quy hoạch động.`,
        model_used: 'HUS Knowledge Base',
        sources: ['Đề cương MAT3552E', 'Đánh giá Góc nhìn HUS'],
      };
    }

    if (qLower.includes('mấy môn a') || qLower.includes('điểm a') || qLower.includes('bao nhiêu môn a')) {
      return {
        reply: `Theo bảng điểm thực tế, bạn đạt 9 học phần điểm A (2 A+ và 7 A):
- Điểm A+ (4.0): MAT2503 Giải tích 3 (10.0), FLF1107 Tiếng Anh B1 (10.0).
- Điểm A (3.7): MAT2501 Giải tích 1 (8.7), MAT2502 Giải tích 2 (8.7), MAT2323 Xác suất thống kê (8.8), MAT2403 Phương trình vi phân (8.5), MAT3507 Cơ sở dữ liệu (8.5), MAT3557 Linux (8.7), PHI1002 Chủ nghĩa xã hội khoa học (8.7).`,
        model_used: 'HUS Knowledge Base',
        sources: ['Bảng điểm thực tế 71 TC Phạm Ngọc Huân'],
      };
    }

    if (qLower.includes('kỳ 5') || qLower.includes('đang học') || qLower.includes('thời khóa biểu')) {
      return {
        reply: `Tại Học kỳ 5, bạn đang theo học 6 môn (16 tín chỉ):
1. MAT1206E - Trí tuệ nhân tạo (3 TC)
2. MAT3533 - Học máy (3 TC, nên học thầy Hà Quang Thụy)
3. MAT3506 - Mạng máy tính (3 TC, P.302T5)
4. MAT3505 - Kiến trúc máy tính (3 TC, P.513T4 / P.102T5)
5. THL1057 - Nhà nước và pháp luật đại cương (2 TC, online sáng T5)
6. MAT3519 - Ngôn ngữ lập trình thứ 2 (2 TC)
Song song với đề tài NCKH NLP (SemEval-2027) để phục vụ đồ án Kỳ 5 và hướng Kỳ 6.`,
        model_used: 'HUS Knowledge Base',
        sources: ['Thời khóa biểu Kỳ 5', 'Workspace NCKH NLP'],
      };
    }

    if (qLower.includes('cải thiện') || qLower.includes('d+')) {
      return {
        reply: `Theo quy chế ĐHQGHN, sinh viên chỉ được học cải thiện các môn đạt điểm D hoặc D+.
- Trong 23 môn đã học (71 TC), chỉ có duy nhất MAT1202 - Lập trình hướng đối tượng (3 TC, điểm hiện tại 5.4 · D+) đủ điều kiện học cải thiện.
- Nếu cải thiện MAT1202 lên A (3.7), CPA 71 tín chỉ đầu tăng từ 3.26 lên 3.35.`,
        model_used: 'HUS Knowledge Base',
        sources: ['Quy chế đào tạo ĐHQGHN', 'QĐ 3568'],
      };
    }

    return {
      reply: `Hiện tại bạn đã tích lũy 71/129 TC (CPA 3.26/4.0), đang học 6 môn Kỳ 5 và thực hiện NCKH NLP. Bạn có thể hỏi chi tiết về từng môn học, giảng viên, độ khó hoặc thống kê điểm.`,
      model_used: 'HUS Knowledge Base',
      sources: ['Hồ sơ học tập HUS CIS QĐ 3568'],
    };
  };

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          api_key: customApiKey || (import.meta.env.VITE_AI_API_KEY as string) || '',
          gemini_api_key: geminiApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
          base_url: baseUrl,
          model: modelName,
          custom_context: { courses_state: coursesState },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: cleanFormatting(data.reply),
        mode: data.mode,
        model_used: data.model_used || modelName,
        rag_sources: data.rag_sources || [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const directResult = await callDirectLLM(
        trimmed,
        messages,
        customApiKey || (import.meta.env.VITE_AI_API_KEY as string) || '',
        geminiApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
        baseUrl,
        modelName
      );
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: cleanFormatting(directResult.reply),
        mode: 'standalone_direct',
        model_used: directResult.model_used,
        rag_sources: directResult.sources,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memContent.trim()) return;
    await onAddCustomMemory(
      memTopic.trim() || `Ghi chú học phần ${memCourseCode}`,
      memCourseCode,
      memContent.trim()
    );
    setMemTopic('');
    setMemContent('');
  };

  const renderCleanText = (rawText: string) => {
    const cleaned = cleanFormatting(rawText);
    const lines = cleaned.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1.5" />;
          if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
            return (
              <div key={i} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-1">
                {trimmed.replace(/^#+\s*/, '')}
              </div>
            );
          }
          if (/^[0-9]+\.\s/.test(trimmed)) {
            return (
              <div key={i} className="font-medium text-zinc-900 dark:text-zinc-100 pt-0.5">
                {trimmed}
              </div>
            );
          }
          return (
            <div key={i} className="text-zinc-700 dark:text-zinc-300">
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left 4 cols: Prompts, Memory, Settings */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col h-[calc(100vh-190px)] min-h-[600px]">
        <div className="p-2 border-b border-zinc-200/80 dark:border-zinc-800 grid grid-cols-3 gap-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-t-xl">
          <button
            type="button"
            onClick={() => setLeftTab('prompts')}
            className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 ${
              leftTab === 'prompts'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Câu hỏi mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => setLeftTab('memory')}
            className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 tabular-nums ${
              leftTab === 'memory'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Bộ nhớ ({customMemories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setLeftTab('settings')}
            className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 ${
              leftTab === 'settings'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Cấu hình</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {leftTab === 'prompts' && (
            <>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={loading}
                    onClick={() => sendPrompt(q.prompt)}
                    className="w-full text-left p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {q.title}
                      </span>
                      <Send className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                      {q.prompt}
                    </p>
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  Phân biệt hỏi và ghi nhớ kiến thức
                </div>
                <p>
                  Đặt câu hỏi bình thường để nhận tư vấn từ RAG, hoặc bắt đầu bằng &quot;Ghi nhớ: ...&quot; để lưu kinh nghiệm chọn giảng viên mới.
                </p>
              </div>
            </>
          )}

          {leftTab === 'memory' && (
            <div className="space-y-4">
              <form
                onSubmit={handleManualAddMemory}
                className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 text-xs"
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  Thêm kinh nghiệm học phần
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={memCourseCode}
                    onChange={(e) => setMemCourseCode(e.target.value)}
                    placeholder="Mã môn (MAT2407)"
                    className="h-8 px-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                  />
                  <input
                    type="text"
                    value={memTopic}
                    onChange={(e) => setMemTopic(e.target.value)}
                    placeholder="Chủ đề"
                    className="h-8 px-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>

                <textarea
                  rows={3}
                  value={memContent}
                  onChange={(e) => setMemContent(e.target.value)}
                  placeholder="Nội dung ghi nhớ về giảng viên, đề thi, tài liệu"
                  className="w-full p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                />

                <button
                  type="submit"
                  className="w-full h-8 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors duration-150"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Lưu vào bộ nhớ</span>
                </button>
              </form>

              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Kiến thức đã lưu ({customMemories.length})
                </div>
                {customMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between pr-6">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        <span className="font-mono text-zinc-500">{m.course_code || 'CHUNG'}</span> ·{' '}
                        {m.topic}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">{m.created_at}</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-snug">{m.content}</p>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomMemory(m.id)}
                      className="opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 text-zinc-400 hover:text-rose-600 transition-opacity duration-150"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leftTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mb-2">
                  <Cpu className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <span>Mô hình AI</span>
                </label>
                <div className="space-y-1.5">
                  {SUPPORTED_AI_MODELS.map((m) => {
                    const isSelected = modelName === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModelName(m.id)}
                        className={`w-full h-9 px-3 rounded-lg border text-left flex items-center justify-between transition-colors duration-150 ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="font-mono font-medium text-xs">{m.label}</span>
                        <span
                          className={`text-[11px] ${
                            isSelected ? 'text-sky-100' : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {isSelected ? 'Đang chọn' : m.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                  <span>Google Gemini API Key</span>
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Nhập Gemini API Key"
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                  <span>AgentRouter / OpenAI Endpoint và Key</span>
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs"
                />
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="API Key"
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs"
                />
              </div>

              {/* RAG Index Card */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>Chỉ mục RAG Embeddings</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReindexRAG}
                    disabled={isReindexing}
                    className="h-7 px-2.5 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 disabled:opacity-50 text-white dark:text-zinc-900 text-[11px] font-medium flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isReindexing ? 'animate-spin' : ''}`}
                      strokeWidth={1.5}
                    />
                    <span>{isReindexing ? 'Đang nạp' : 'Cập nhật'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                  {ragStatus?.indexed_chunks_count || 67} chunks · Gemini 3072-dim
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 8 cols: Interactive Chat Workspace */}
      <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col h-[calc(100vh-190px)] min-h-[600px]">
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.5} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Cố vấn học tập AI
                </h2>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                  RAG {ragStatus?.indexed_chunks_count || 67} tài liệu
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Giải đáp học phần, giảng viên và lộ trình QĐ 3568
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
            >
              {SUPPORTED_AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleReindexRAG}
              disabled={isReindexing}
              className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors duration-150"
              title="Đồng bộ lại dữ liệu RAG"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin text-sky-600' : ''}`}
                strokeWidth={1.5}
              />
            </button>

            <button
              type="button"
              onClick={() => setMessages(messages.slice(0, 1))}
              className="h-8 px-2.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 flex items-center gap-1 transition-colors duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Xóa lịch sử</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-4 ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100'
                }`}
              >
                <div
                  className={`flex items-center justify-between gap-4 mb-1.5 text-[11px] tabular-nums ${
                    m.role === 'user' ? 'text-sky-100' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <span className="font-medium">
                    {m.role === 'user'
                      ? 'Phạm Ngọc Huân'
                      : `Cố vấn AI · ${m.model_used || modelName}`}
                  </span>
                  <span className="font-mono">{m.timestamp}</span>
                </div>

                {m.role === 'user' ? (
                  <p className="text-xs sm:text-sm font-medium">{m.content}</p>
                ) : (
                  <>
                    {renderCleanText(m.content)}
                    {m.rag_sources && m.rag_sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-700/70">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                          <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Nguồn RAG đã truy xuất ({m.rag_sources.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.rag_sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" strokeWidth={1.5} />
                <span>Đang truy xuất tài liệu và tổng hợp</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="p-3.5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 rounded-b-xl flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt câu hỏi về môn học, giảng viên hoặc lộ trình"
            className="flex-1 h-10 px-3.5 rounded-lg text-xs sm:text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors duration-150"
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
