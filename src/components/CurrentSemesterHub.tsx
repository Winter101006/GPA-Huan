import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Link2,
  NotebookPen,
  Plus,
  Save,
  StickyNote,
  Trash2,
} from 'lucide-react';
import {
  Course,
  CourseLinkItem,
  CourseUserState,
  NLPResearchMilestone,
  NLPResearchWorkspaceData,
  SemesterTaskItem,
  TimetableSession,
} from '../types/academic';

interface CurrentSemesterHubProps {
  courses: Course[];
  coursesState: Record<string, CourseUserState>;
  onUpdateCourseFullState: (
    code: string,
    partialState: Partial<CourseUserState>,
    silent?: boolean
  ) => void;
  timetable: TimetableSession[];
  onUpdateTimetable: (nextTimetable: TimetableSession[]) => void;
  tasks: SemesterTaskItem[];
  onUpdateTasks: (nextTasks: SemesterTaskItem[]) => void;
  nlpResearch: NLPResearchWorkspaceData;
  onUpdateNlpResearch: (nextResearch: NLPResearchWorkspaceData) => void;
}

const PERIOD_TIMES: Record<number, string> = {
  1: '7h00 - 7h50',
  2: '7h55 - 8h45',
  3: '8h50 - 9h40',
  4: '9h50 - 10h40',
  5: '10h45 - 11h35',
  6: '11h40 - 12h30',
  7: '13h00 - 13h50',
  8: '13h55 - 14h45',
  9: '14h50 - 15h40',
  10: '15h50 - 16h40',
  11: '16h45 - 17h35',
  12: '17h40 - 18h30',
};

const DAYS_OF_WEEK = [
  { day: 2, label: 'Thứ Hai' },
  { day: 3, label: 'Thứ Ba' },
  { day: 4, label: 'Thứ Tư' },
  { day: 5, label: 'Thứ Năm' },
  { day: 6, label: 'Thứ Sáu' },
  { day: 7, label: 'Thứ Bảy' },
];

type CourseTheme = {
  short: string;
  icon: string;
  grad: string;
  glow: string;
  soft: string;
  text: string;
  border: string;
};

const COURSE_THEME: Record<string, CourseTheme> = {
  MAT1206E: {
    short: 'Trí tuệ NT',
    icon: '🤖',
    grad: 'from-violet-500 to-purple-700',
    glow: 'shadow-violet-500/40',
    soft: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-600 dark:text-violet-300',
    border: 'border-violet-300 dark:border-violet-800',
  },
  MAT3519: {
    short: 'NNLT 2',
    icon: '💻',
    grad: 'from-cyan-400 to-sky-600',
    glow: 'shadow-cyan-500/40',
    soft: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-600 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-800',
  },
  MAT3533: {
    short: 'Học máy',
    icon: '🧠',
    grad: 'from-pink-500 to-fuchsia-600',
    glow: 'shadow-pink-500/40',
    soft: 'bg-pink-50 dark:bg-pink-950/30',
    text: 'text-pink-600 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-800',
  },
  THL1057: {
    short: 'Pháp luật',
    icon: '⚖️',
    grad: 'from-amber-400 to-orange-600',
    glow: 'shadow-orange-500/40',
    soft: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-800',
  },
  MAT3506: {
    short: 'Mạng MT',
    icon: '🌐',
    grad: 'from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/40',
    soft: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  MAT3505: {
    short: 'Kiến trúc',
    icon: '🖥️',
    grad: 'from-blue-500 to-indigo-700',
    glow: 'shadow-blue-500/40',
    soft: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
};

const NCKH_THEME: CourseTheme = {
  short: 'NCKH',
  icon: '🔬',
  grad: 'from-indigo-500 to-slate-800',
  glow: 'shadow-indigo-500/40',
  soft: 'bg-indigo-50 dark:bg-indigo-950/30',
  text: 'text-indigo-600 dark:text-indigo-300',
  border: 'border-indigo-300 dark:border-indigo-800',
};

const CHUNG_THEME: CourseTheme = {
  short: 'Chung',
  icon: '📌',
  grad: 'from-slate-600 to-slate-900',
  glow: 'shadow-slate-500/40',
  soft: 'bg-slate-50 dark:bg-slate-800/40',
  text: 'text-slate-600 dark:text-slate-300',
  border: 'border-slate-300 dark:border-slate-700',
};

function themeOf(key: string): CourseTheme {
  if (COURSE_THEME[key]) return COURSE_THEME[key];
  return key === 'NCKH_NLP' ? NCKH_THEME : CHUNG_THEME;
}

const COURSE_TIMETABLE_STYLES: Record<
  string,
  { bg: string; border: string; text: string; pill: string }
> = Object.fromEntries(
  Object.entries(COURSE_THEME).map(([k, t]) => [
    k,
    { bg: `bg-gradient-to-br ${t.grad}`, border: t.border, text: 'text-white', pill: 'bg-white/20 text-white' },
  ])
);

const EXAM_SCHEDULE: { code: string; name: string; date: string; slot: string; format: string }[] = [
  { code: 'MAT3505', name: 'Kiến trúc máy tính', date: '2026-12-26', slot: 'Ca 2 (08:30)', format: 'Vấn đáp' },
  { code: 'MAT3519', name: 'Ngôn ngữ lập trình thứ hai', date: '2026-12-31', slot: 'Ca 4 (13:00)', format: 'Thuyết trình' },
  { code: 'MAT3506', name: 'Mạng máy tính', date: '2027-01-03', slot: 'Ca 4 (13:00)', format: 'Thuyết trình' },
  { code: 'MAT3533', name: 'Học máy', date: '2027-01-08', slot: 'Ca 4 (13:00)', format: 'Thuyết trình' },
  { code: 'THL1057', name: 'Nhà nước và pháp luật đại cương', date: '', slot: 'Chưa có ca', format: 'Trên máy' },
  { code: 'MAT1206E', name: 'Nhập môn Trí tuệ nhân tạo', date: '', slot: 'Chưa có ca', format: 'Tiểu luận' },
];

function examDaysLeft(date: string): number {
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function parseNlpLinkString(raw: string): { title: string; url: string | null } {
  const pipeIdx = raw.indexOf(' | ');
  if (pipeIdx !== -1) {
    const title = raw.slice(0, pipeIdx).trim();
    const urlPart = raw.slice(pipeIdx + 3).trim();
    return {
      title: title || urlPart,
      url: /^https?:\/\//i.test(urlPart)
        ? urlPart
        : urlPart.includes('.') && !urlPart.includes(' ')
        ? `https://${urlPart}`
        : null,
    };
  }
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return { title: trimmed, url: trimmed };
  }
  const urlMatch = trimmed.match(/(https?:\/\/\S+)/i);
  if (urlMatch) {
    const cleanedTitle = trimmed
      .replace(urlMatch[0], '')
      .replace(/[\s|:-]+$/, '')
      .trim();
    return { title: cleanedTitle || urlMatch[0], url: urlMatch[0] };
  }
  return { title: trimmed, url: null };
}

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function ExamCalendar(_props: { timetable?: TimetableSession[] }) {
  const now = new Date();
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());
  const months = [
    { y: 2026, m: 11 },
    { y: 2027, m: 0 },
  ];
  const examsOn = (date: string) => EXAM_SCHEDULE.filter((x) => x.date === date);
  const dated = EXAM_SCHEDULE.filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = EXAM_SCHEDULE.filter((x) => !x.date);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {months.map(({ y, m }) => {
          const offset = (new Date(y, m, 1).getDay() + 6) % 7;
          const daysIn = new Date(y, m + 1, 0).getDate();
          const cells: (number | null)[] = [
            ...Array(offset).fill(null),
            ...Array.from({ length: daysIn }, (_, i) => i + 1),
          ];
          while (cells.length % 7) cells.push(null);
          return (
            <div key={`${y}-${m}`} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-300" />
                <span className="text-base font-extrabold">Tháng {m + 1}/{y}</span>
              </div>
              <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((h, i) => (
                  <div key={h} className={`py-2 text-center text-[11px] font-extrabold ${i === 6 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{h}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 p-2 gap-1.5">
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} className="aspect-square" />;
                  const date = ymd(y, m, d);
                  const exams = examsOn(date);
                  const isToday = date === todayStr;
                  const th = exams.length ? themeOf(exams[0].code) : null;
                  return (
                    <div
                      key={date}
                      title={exams.map((e) => `${e.name} – ${e.slot} – ${e.format}`).join('\n') || undefined}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-extrabold transition-all ${
                        exams.length
                          ? `bg-gradient-to-br ${th!.grad} text-white shadow-lg ${th!.glow} scale-105`
                          : i % 7 === 6
                          ? 'text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      } ${isToday ? 'ring-2 ring-sky-500' : ''}`}
                    >
                      <span>{d}</span>
                      {exams.length > 0 && (
                        <span className="text-[8px] font-extrabold leading-none mt-0.5 px-0.5 max-w-full truncate">{th!.short}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="xl:col-span-4 rounded-3xl bg-gradient-to-br from-slate-900 to-sky-950 text-white shadow-sm p-5">
        <div className="text-sm font-extrabold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-400" /> Lịch thi & đếm ngược
        </div>
        <div className="space-y-2">
          {dated.map((ex) => {
            const left = examDaysLeft(ex.date);
            const [yy, mm, dd] = ex.date.split('-');
            return (
              <div key={ex.code} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${themeOf(ex.code).grad} shadow-lg ${themeOf(ex.code).glow} flex flex-col items-center justify-center leading-none`}>
                  <span className="text-lg font-extrabold">{dd}</span>
                  <span className="text-[9px] font-bold opacity-90">T{Number(mm)}/{yy.slice(2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold truncate">{ex.name}</div>
                  <div className="text-[11px] text-slate-300 font-semibold">{ex.slot} · {ex.format}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-extrabold text-rose-400 leading-none">{left > 0 ? left : left === 0 ? '!' : '✓'}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{left > 0 ? 'ngày' : left === 0 ? 'hôm nay' : 'đã thi'}</div>
                </div>
              </div>
            );
          })}
          {undated.map((ex) => (
            <div key={ex.code} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-dashed border-white/20">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-lg">?</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold truncate">{ex.name}</div>
                <div className="text-[11px] text-slate-300 font-semibold">Chưa có lịch · {ex.format}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export const CurrentSemesterHub: React.FC<CurrentSemesterHubProps> = ({
  courses,
  coursesState,
  onUpdateCourseFullState,
  timetable,
  onUpdateTimetable,
  tasks,
  onUpdateTasks,
  nlpResearch,
  onUpdateNlpResearch,
}) => {
  // Two clean top-level modes: Notebook (default) & Weekly Timetable
  const [viewMode, setViewMode] = useState<'overview' | 'notebook'>('overview');

  const inProgressCourses = courses.filter((c) => c.in_progress && !c.completed);
  const inProgressCredits = inProgressCourses.reduce((s, c) => s + c.credits, 0);

  // Active selected page in the Notebook ('NCKH_NLP', course.code, or 'CHUNG')
  const [selectedKey, setSelectedKey] = useState<string>(
    inProgressCourses[0]?.code || 'NCKH_NLP'
  );

  // Draft note states for smooth typing without lag
  const [noteDraft, setNoteDraft] = useState('');
  const [quickAttentionDraft, setQuickAttentionDraft] = useState('');
  const [scheduleDraft, setScheduleDraft] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(false);

  // NLP specific header drafts
  const [nlpTopicDraft, setNlpTopicDraft] = useState(nlpResearch.topic_title || '');
  const [nlpAdvisorDraft, setNlpAdvisorDraft] = useState(nlpResearch.advisor_name || '');
  const [nlpModelsDraft, setNlpModelsDraft] = useState(nlpResearch.datasets_and_models || '');

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const saveTimerRef = useRef<number | null>(null);

  // Simple Add Link inputs
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');

  // Simple Add Todo inputs
  const [todoTitleInput, setTodoTitleInput] = useState('');
  const [todoDueInput, setTodoDueInput] = useState('');

  // Simple Add Timetable session toggle
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSessCourseCode, setNewSessCourseCode] = useState('MAT1206E');
  const [newSessClassCode, setNewSessClassCode] = useState('MAT1206E 3');
  const [newSessName, setNewSessName] = useState('Trí tuệ nhân tạo');
  const [newSessDay, setNewSessDay] = useState(2);
  const [newSessStart, setNewSessStart] = useState(3);
  const [newSessEnd, setNewSessEnd] = useState(4);
  const [newSessRoom, setNewSessRoom] = useState('102T5');

  // Sync drafts whenever selectedKey changes
  useEffect(() => {
    setEditingSchedule(false);
    setLinkTitleInput('');
    setLinkUrlInput('');
    setTodoTitleInput('');
    setTodoDueInput('');
    setSaveStatus('saved');

    if (selectedKey === 'NCKH_NLP') {
      setNoteDraft(nlpResearch.quick_notes || '');
      setNlpTopicDraft(nlpResearch.topic_title || '');
      setNlpAdvisorDraft(nlpResearch.advisor_name || '');
      setNlpModelsDraft(nlpResearch.datasets_and_models || '');
      setQuickAttentionDraft('');
      setScheduleDraft('');
    } else {
      const st = coursesState[selectedKey];
      const existingDetailed = st?.detailed_notes;
      const fallbackTeacher = st?.teacher_note ? `Giảng viên: ${st.teacher_note}` : '';
      setNoteDraft(existingDetailed ?? fallbackTeacher ?? '');
      setQuickAttentionDraft(st?.note || '');
      setScheduleDraft(st?.schedule_info || '');
    }
  }, [selectedKey]);

  const flushSave = (
    targetKey: string,
    nextNote: string,
    nextQuickAttention: string,
    nextSchedule: string,
    nextNlpTopic?: string,
    nextNlpAdvisor?: string,
    nextNlpModels?: string
  ) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (targetKey === 'NCKH_NLP') {
      onUpdateNlpResearch({
        ...nlpResearch,
        quick_notes: nextNote,
        topic_title: nextNlpTopic ?? nlpTopicDraft,
        advisor_name: nextNlpAdvisor ?? nlpAdvisorDraft,
        datasets_and_models: nextNlpModels ?? nlpModelsDraft,
      });
    } else {
      onUpdateCourseFullState(
        targetKey,
        {
          detailed_notes: nextNote,
          note: nextQuickAttention,
          schedule_info: nextSchedule,
        },
        true
      );
    }
    setSaveStatus('saved');
  };

  const handleSelectPage = (nextKey: string) => {
    if (nextKey === selectedKey) return;
    if (saveStatus !== 'saved') {
      flushSave(
        selectedKey,
        noteDraft,
        quickAttentionDraft,
        scheduleDraft,
        nlpTopicDraft,
        nlpAdvisorDraft,
        nlpModelsDraft
      );
    }
    setSelectedKey(nextKey);
  };

  const scheduleAutoSave = (
    nextNote: string,
    nextQuickAttention: string,
    nextSchedule: string,
    nextNlpTopic?: string,
    nextNlpAdvisor?: string,
    nextNlpModels?: string
  ) => {
    setSaveStatus('saving');
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    const keySnapshot = selectedKey;
    saveTimerRef.current = window.setTimeout(() => {
      flushSave(
        keySnapshot,
        nextNote,
        nextQuickAttention,
        nextSchedule,
        nextNlpTopic,
        nextNlpAdvisor,
        nextNlpModels
      );
    }, 550);
  };

  // --- LINKS HANDLERS ---
  const currentCourseState = selectedKey !== 'NCKH_NLP' ? coursesState[selectedKey] : undefined;
  const currentCourseMeta =
    selectedKey !== 'NCKH_NLP' && selectedKey !== 'CHUNG'
      ? inProgressCourses.find((c) => c.code === selectedKey) ||
        courses.find((c) => c.code === selectedKey)
      : undefined;

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTitle = linkTitleInput.trim();
    const rawUrl = linkUrlInput.trim();
    if (!rawTitle && !rawUrl) return;

    if (selectedKey === 'NCKH_NLP') {
      const normalized = normalizeUrl(rawUrl);
      const entry =
        rawTitle && normalized
          ? `${rawTitle} | ${normalized}`
          : normalized || rawTitle;
      onUpdateNlpResearch({
        ...nlpResearch,
        paper_links: [...(nlpResearch.paper_links || []), entry],
      });
    } else {
      const normalized = normalizeUrl(rawUrl);
      const newLink: CourseLinkItem = {
        id: `link-${Date.now()}`,
        title: rawTitle || normalized,
        url: normalized || rawTitle,
      };
      const existingLinks = currentCourseState?.links || [];
      onUpdateCourseFullState(
        selectedKey,
        { links: [...existingLinks, newLink] },
        true
      );
    }
    setLinkTitleInput('');
    setLinkUrlInput('');
  };

  const handleDeleteNlpLink = (idx: number) => {
    onUpdateNlpResearch({
      ...nlpResearch,
      paper_links: (nlpResearch.paper_links || []).filter((_, i) => i !== idx),
    });
  };

  const handleDeleteCourseLink = (linkId: string) => {
    const existingLinks = currentCourseState?.links || [];
    onUpdateCourseFullState(
      selectedKey,
      { links: existingLinks.filter((l) => l.id !== linkId) },
      true
    );
  };

  // --- TODO CHECKLIST HANDLERS ---
  const pageTasks = tasks.filter((t) => t.course_code === selectedKey);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitleInput.trim()) return;
    const item: SemesterTaskItem = {
      id: `task-${Date.now()}`,
      course_code: selectedKey,
      category: selectedKey === 'NCKH_NLP' ? 'nlp_research' : 'note',
      title: todoTitleInput.trim(),
      due_date: todoDueInput.trim(),
      priority: 'medium',
      completed: false,
      details: '',
    };
    onUpdateTasks([item, ...tasks]);
    setTodoTitleInput('');
    setTodoDueInput('');
  };

  const handleToggleTodo = (id: string) => {
    onUpdateTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTodo = (id: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== id));
  };

  const handleCycleMilestone = (milestoneId: string) => {
    const order: NLPResearchMilestone['status'][] = ['upcoming', 'in_progress', 'completed'];
    const nextMilestones = (nlpResearch.milestones || []).map((m) => {
      if (m.id !== milestoneId) return m;
      const nextIdx = (order.indexOf(m.status) + 1) % order.length;
      return { ...m, status: order[nextIdx] };
    });
    onUpdateNlpResearch({ ...nlpResearch, milestones: nextMilestones });
  };

  // --- TIMETABLE HANDLERS ---
  const handleAddTimetableSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: TimetableSession = {
      id: `tt-${Date.now()}`,
      course_code: newSessCourseCode.trim() || 'MAT1206E',
      class_code: newSessClassCode.trim() || newSessCourseCode.trim(),
      course_name: newSessName.trim() || 'Môn học mới',
      session_type: 'LT',
      day_of_week: newSessDay,
      start_period: Math.min(newSessStart, newSessEnd),
      end_period: Math.max(newSessStart, newSessEnd),
      room: newSessRoom.trim() || 'T5',
      note: '',
      color: 'bg-sky-500 text-white border-sky-600',
    };
    onUpdateTimetable([...timetable, newSession]);
    setShowAddSession(false);
  };

  const handleRemoveTimetableSession = (id: string) => {
    onUpdateTimetable(timetable.filter((s) => s.id !== id));
  };

  const getPageCounts = (key: string) => {
    const pendingTodos = tasks.filter((t) => t.course_code === key && !t.completed).length;
    const linksCount =
      key === 'NCKH_NLP'
        ? (nlpResearch.paper_links || []).length
        : (coursesState[key]?.links || []).length;
    return { pendingTodos, linksCount };
  };

  return (
    <div className="space-y-4">
      {/* Compact Clean Top Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl px-4 py-3 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/40">
            <NotebookPen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Sổ Tay Học Kỳ 5 & NCKH NLP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {inProgressCourses.length} môn đang học ({inProgressCredits} tín chỉ) • Tự động lưu mọi ghi chú & link tài liệu
            </p>
          </div>
        </div>

        {/* Two Large, Clear Mode Switchers */}
        <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-slate-800 p-1 rounded-xl border border-sky-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all ${
              viewMode === 'overview'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tổng Quan & Lịch Thi</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('notebook')}            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all ${
              viewMode === 'notebook'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ Ghi Chú Từng Môn</span>
          </button>
        </div>
      </div>

      {/* MODE 1: NOTEBOOK */}
      {viewMode === 'notebook' &&
        (() => {
          const th = themeOf(selectedKey);
          const exam = EXAM_SCHEDULE.find((x) => x.code === selectedKey);
          const examLeft = exam?.date ? examDaysLeft(exam.date) : null;
          const isCourse = selectedKey !== 'NCKH_NLP' && selectedKey !== 'CHUNG';
          const pageTitle =
            selectedKey === 'NCKH_NLP'
              ? 'NCKH NLP'
              : selectedKey === 'CHUNG'
              ? 'Ghi chú chung Học kỳ 5'
              : currentCourseMeta?.name_vi || selectedKey;
          const pages = [
            ...inProgressCourses.map((c) => ({ key: c.code, title: c.name_vi, sub: `${c.code} · ${c.credits} TC` })),
            { key: 'NCKH_NLP', title: 'NCKH NLP', sub: nlpResearch.topic_title || 'Nghiên cứu NLP' },
            { key: 'CHUNG', title: 'Ghi chú chung', sub: 'Link lớp, việc chung' },
          ];
          const linkList: { id: string; title: string; url: string | null; onDelete: () => void }[] =
            selectedKey === 'NCKH_NLP'
              ? (nlpResearch.paper_links || []).map((raw, idx) => {
                  const p = parseNlpLinkString(raw);
                  return { id: `n${idx}`, title: p.title, url: p.url, onDelete: () => handleDeleteNlpLink(idx) };
                })
              : (currentCourseState?.links || []).map((lk) => ({
                  id: lk.id,
                  title: lk.title,
                  url: /^https?:\/\//i.test(lk.url) ? lk.url : null,
                  onDelete: () => handleDeleteCourseLink(lk.id),
                }));
          const save = () =>
            flushSave(selectedKey, noteDraft, quickAttentionDraft, scheduleDraft, nlpTopicDraft, nlpAdvisorDraft, nlpModelsDraft);
          const glassInput =
            'w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/25 placeholder-white/70 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/60';
          const pending = pageTasks.filter((t) => !t.completed).length;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT: subject list */}
              <aside className="lg:col-span-3 space-y-2 lg:sticky lg:top-4">
                {pages.map((p) => {
                  const t = themeOf(p.key);
                  const sel = selectedKey === p.key;
                  const { pendingTodos } = getPageCounts(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPage(p.key)}
                      className={`relative w-full text-left p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                        sel
                          ? `bg-gradient-to-r ${t.grad} text-white border-transparent shadow-lg ${t.glow} scale-[1.02]`
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 text-slate-900 dark:text-white'
                      }`}
                    >
                      {sel && <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/25 blur-2xl" />}
                      <span
                        className={`relative w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${
                          sel ? 'bg-white/20' : `bg-gradient-to-br ${t.grad} shadow-md ${t.glow}`
                        }`}
                      >
                        {t.icon}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block text-sm font-extrabold truncate">{p.title}</span>
                        <span className={`block text-[11px] font-semibold truncate ${sel ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          {p.sub}
                        </span>
                      </span>
                      {pendingTodos > 0 && (
                        <span
                          className={`relative px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            sel ? 'bg-white text-slate-900' : 'bg-rose-500 text-white shadow shadow-rose-500/40'
                          }`}
                        >
                          {pendingTodos}
                        </span>
                      )}
                    </button>
                  );
                })}
              </aside>

              {/* RIGHT: page */}
              <section className="lg:col-span-9 space-y-4">
                {/* Hero header */}
                <div className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${th.grad} text-white shadow-xl ${th.glow}`}>
                  <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-white/20 blur-3xl animate-pulse" />
                  <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-black/15 blur-3xl" />
                  <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                      backgroundSize: '22px 22px',
                    }}
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white/85">
                        {th.icon}{' '}
                        {isCourse
                          ? `${currentCourseMeta?.code || selectedKey} · ${currentCourseMeta?.credits ?? ''} tín chỉ · ${currentCourseMeta?.type || ''}`
                          : selectedKey === 'NCKH_NLP'
                          ? 'Sổ tay nghiên cứu khoa học'
                          : 'Link cổng đào tạo, nhóm lớp, nhắc nhở chung'}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 drop-shadow">{pageTitle}</h3>
                    </div>
                    {exam && (
                      <div className="px-4 py-3 rounded-2xl bg-white/15 backdrop-blur border border-white/25 shadow-lg">
                        <div className="text-[10px] font-extrabold text-white/80">LỊCH THI · {exam.format.toUpperCase()}</div>
                        <div className="text-sm font-extrabold">
                          {exam.date ? `${exam.date.split('-').reverse().join('/')} · ${exam.slot}` : 'Chưa có lịch'}
                        </div>
                        {examLeft !== null && (
                          <div className="text-lg font-extrabold leading-tight">
                            {examLeft > 0 ? `⏳ Còn ${examLeft} ngày` : examLeft === 0 ? '🔥 Hôm nay' : '✓ Đã thi'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isCourse && (
                    <input
                      type="text"
                      value={quickAttentionDraft}
                      onChange={(e) => {
                        setQuickAttentionDraft(e.target.value);
                        scheduleAutoSave(noteDraft, e.target.value, scheduleDraft);
                      }}
                      onBlur={save}
                      placeholder="⚡ Chú ý nhanh (VD: hơi khó, cố gắng học / thầy điểm danh...)"
                      className={`relative mt-5 ${glassInput}`}
                    />
                  )}

                  {selectedKey === 'NCKH_NLP' && (
                    <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={nlpTopicDraft}
                        onChange={(e) => {
                          setNlpTopicDraft(e.target.value);
                          scheduleAutoSave(noteDraft, quickAttentionDraft, scheduleDraft, e.target.value, nlpAdvisorDraft, nlpModelsDraft);
                        }}
                        onBlur={save}
                        placeholder="Tên đề tài"
                        className={glassInput}
                      />
                      <input
                        type="text"
                        value={nlpAdvisorDraft}
                        onChange={(e) => {
                          setNlpAdvisorDraft(e.target.value);
                          scheduleAutoSave(noteDraft, quickAttentionDraft, scheduleDraft, nlpTopicDraft, e.target.value, nlpModelsDraft);
                        }}
                        onBlur={save}
                        placeholder="Giảng viên hướng dẫn"
                        className={glassInput}
                      />
                      <input
                        type="text"
                        value={nlpModelsDraft}
                        onChange={(e) => {
                          setNlpModelsDraft(e.target.value);
                          scheduleAutoSave(noteDraft, quickAttentionDraft, scheduleDraft, nlpTopicDraft, nlpAdvisorDraft, e.target.value);
                        }}
                        onBlur={save}
                        placeholder="Mô hình / Dataset"
                        className={glassInput}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                  {/* Notes */}
                  <div className="xl:col-span-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${th.grad}`} />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <NotebookPen className={`w-5 h-5 ${th.text}`} /> Ghi chú
                        </h4>
                        {saveStatus === 'saving' ? (
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Đang lưu...
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã lưu
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={16}
                        value={noteDraft}
                        onChange={(e) => {
                          setNoteDraft(e.target.value);
                          scheduleAutoSave(e.target.value, quickAttentionDraft, scheduleDraft, nlpTopicDraft, nlpAdvisorDraft, nlpModelsDraft);
                        }}
                        onBlur={save}
                        placeholder={
                          selectedKey === 'NCKH_NLP'
                            ? 'Kết quả thực nghiệm, lời khuyên của người hướng dẫn, hướng cải tiến tiếp theo...'
                            : 'Thầy cô dặn gì, phần trọng tâm thi, cách tính điểm thành phần, kinh nghiệm làm bài...'
                        }
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(transparent, transparent 27px, rgba(148,163,184,0.22) 27px, rgba(148,163,184,0.22) 28px)',
                          lineHeight: '28px',
                          backgroundAttachment: 'local',
                        }}
                        className="w-full px-4 py-1 rounded-2xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y"
                      />
                    </div>
                  </div>

                  <div className="xl:col-span-2 space-y-4">
                    {/* Links */}
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Link2 className={`w-5 h-5 ${th.text}`} /> Link tài liệu
                        <span className="text-xs font-bold text-slate-400">({linkList.length})</span>
                      </h4>
                      <div className="space-y-1.5">
                        {linkList.length === 0 && (
                          <p className="text-xs text-slate-400 py-2">Chưa có link. Dán slide, Drive, Classroom... bên dưới.</p>
                        )}
                        {linkList.map((lk) => (
                          <div
                            key={lk.id}
                            className={`group flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all`}
                          >
                            <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br ${th.grad} text-white shadow ${th.glow}`}>
                              <ExternalLink className="w-4 h-4" />
                            </span>
                            {lk.url ? (
                              <a
                                href={lk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 hover:underline truncate"
                                title={lk.url}
                              >
                                {lk.title}
                              </a>
                            ) : (
                              <span className="min-w-0 flex-1 text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{lk.title}</span>
                            )}
                            <button
                              type="button"
                              onClick={lk.onDelete}
                              className="p-1.5 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddLink} className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={linkTitleInput}
                          onChange={(e) => setLinkTitleInput(e.target.value)}
                          placeholder="Tên link (Slide, Drive...)"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={linkUrlInput}
                            onChange={(e) => setLinkUrlInput(e.target.value)}
                            placeholder="https://..."
                            className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          <button
                            type="submit"
                            className={`px-3 rounded-xl bg-gradient-to-r ${th.grad} text-white shadow-md ${th.glow} hover:brightness-110 transition-all`}
                            title="Thêm link"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Todos */}
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${th.text}`} /> Việc cần làm
                        {pending > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow shadow-rose-500/40">
                            {pending}
                          </span>
                        )}
                      </h4>
                      <div className="space-y-1.5">
                        {pageTasks.length === 0 && <p className="text-xs text-slate-400 py-2">Chưa có việc nào.</p>}
                        {pageTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`group flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${
                              t.completed ? 'opacity-50' : ''
                            }`}
                          >
                            <button type="button" onClick={() => handleToggleTodo(t.id)} className="shrink-0">
                              {t.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className={`w-5 h-5 ${th.text}`} />
                              )}
                            </button>
                            <span
                              className={`min-w-0 flex-1 text-sm font-semibold ${
                                t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {t.title}
                            </span>
                            {t.due_date && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${th.soft} ${th.text}`}>{t.due_date}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(t.id)}
                              className="p-1 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddTodo} className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={todoTitleInput}
                          onChange={(e) => setTodoTitleInput(e.target.value)}
                          placeholder="Việc cần làm..."
                          className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <input
                          type="text"
                          value={todoDueInput}
                          onChange={(e) => setTodoDueInput(e.target.value)}
                          placeholder="Hạn"
                          className="w-16 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <button
                          type="submit"
                          className={`px-3 rounded-xl bg-gradient-to-r ${th.grad} text-white shadow-md ${th.glow} hover:brightness-110 transition-all`}
                          title="Thêm việc"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {selectedKey === 'NCKH_NLP' && (nlpResearch.milestones || []).length > 0 && (
                  <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">🗺️ Tiến độ NCKH (bấm để đổi trạng thái)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {(nlpResearch.milestones || []).map((m) => {
                        const isDone = m.status === 'completed';
                        const isProg = m.status === 'in_progress';
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleCycleMilestone(m.id)}
                            className={`text-left p-3 rounded-2xl border transition-all ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : isProg
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-md shadow-amber-500/20'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="text-[10px] font-extrabold text-slate-500">{m.phase}</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-2">{m.title}</div>
                            <div
                              className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isDone ? 'bg-emerald-500 text-white' : isProg ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isDone ? 'Xong' : isProg ? 'Đang làm' : 'Chưa tới'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            </div>
          );
        })()}

      {/* MODE 0: OVERVIEW DASHBOARD (default) */}
      {viewMode === 'overview' && (
        <div className="space-y-4">
          <ExamCalendar timetable={timetable} />
          {(() => {
            const upcoming = EXAM_SCHEDULE.filter((x) => x.date && examDaysLeft(x.date) >= 0)
              .sort((a, b) => a.date.localeCompare(b.date))[0];
            const pendingAll = tasks.filter((t) => !t.completed);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
                  <div className="text-xs font-bold opacity-90">Kỳ thi gần nhất</div>
                  <div className="text-lg font-extrabold mt-1">{upcoming ? upcoming.name : 'Chưa có'}</div>
                  <div className="text-xs font-bold mt-1">
                    {upcoming ? `${upcoming.date.split('-').reverse().join('/')} · ${upcoming.slot} · còn ${examDaysLeft(upcoming.date)} ngày` : ''}
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-sm">
                  <div className="text-xs font-bold opacity-90">Đang học</div>
                  <div className="text-lg font-extrabold mt-1">{inProgressCourses.length} môn · {inProgressCredits} tín chỉ</div>
                  <div className="text-xs font-bold mt-1">Học kỳ I 2026-2027</div>
                </div>
                <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                  <div className="text-xs font-bold opacity-90">Việc cần làm</div>
                  <div className="text-lg font-extrabold mt-1">{pendingAll.length} việc chưa xong</div>
                  <div className="text-xs font-bold mt-1">Thêm việc trong sổ từng môn</div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...EXAM_SCHEDULE]
              .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
              .map((ex) => {
                const style = COURSE_TIMETABLE_STYLES[ex.code];
                const course = courses.find((c) => c.code === ex.code);
                const st = coursesState[ex.code];
                const days = ex.date ? examDaysLeft(ex.date) : null;
                const sessions = timetable.filter((s) => s.course_code === ex.code);
                const counts = getPageCounts(ex.code);
                return (
                  <div
                    key={ex.code}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className={`px-4 py-3 ${style ? `${style.bg} ${style.text}` : 'bg-sky-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-extrabold">{course?.name_vi || ex.name}</div>
                          <div className="text-[11px] font-bold opacity-80">
                            {ex.code}{course ? ` · ${course.credits} tín chỉ` : ''}
                          </div>
                        </div>
                        {days !== null && (
                          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[11px] font-extrabold shrink-0">
                            {days > 0 ? `Còn ${days} ngày` : days === 0 ? 'Hôm nay!' : 'Đã thi'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-2 text-xs text-slate-700 dark:text-slate-200">
                      <div>
                        <span className="font-extrabold">📝 Thi: </span>
                        {ex.date ? `${ex.date.split('-').reverse().join('/')} · ${ex.slot}` : 'Chưa có lịch'} · {ex.format}
                      </div>
                      <div>
                        <span className="font-extrabold">🏫 Lịch học: </span>
                        {sessions.length > 0
                          ? sessions
                              .map((s) => `Thứ ${s.day_of_week} (tiết ${s.start_period}-${s.end_period}, ${s.room})`)
                              .join(' · ')
                          : st?.schedule_info || 'Chưa có'}
                      </div>
                      {st?.note && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 font-bold">
                          ⚠️ {st.note}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          {counts.pendingTodos} việc chưa xong · {counts.linksCount} link
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPage(ex.code);
                            setViewMode('notebook');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          Mở sổ ghi chú
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
