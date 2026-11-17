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
  MapPin,
  NotebookPen,
  Plus,
  Save,
  StickyNote,
  Trash2,
  X,
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
  1: '07:00 - 07:50',
  2: '07:55 - 08:45',
  3: '08:50 - 09:40',
  4: '09:50 - 10:40',
  5: '10:45 - 11:35',
  6: '11:40 - 12:30',
  7: '13:00 - 13:50',
  8: '13:55 - 14:45',
  9: '14:50 - 15:40',
  10: '15:50 - 16:40',
  11: '16:45 - 17:35',
  12: '17:40 - 18:30',
};

const DAYS_OF_WEEK = [
  { day: 2, label: 'Thứ Hai' },
  { day: 3, label: 'Thứ Ba' },
  { day: 4, label: 'Thứ Tư' },
  { day: 5, label: 'Thứ Năm' },
  { day: 6, label: 'Thứ Sáu' },
  { day: 7, label: 'Thứ Bảy' },
];

// Restrained timetable block accents (clean surface tones, readable 4.5:1+ contrast)
const COURSE_TIMETABLE_STYLES: Record<
  string,
  { surface: string; border: string; accentBar: string; text: string; meta: string }
> = {
  MAT1206E: {
    surface: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60',
    accentBar: 'bg-sky-600',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-sky-700 dark:text-sky-300',
  },
  MAT3519: {
    surface: 'bg-zinc-100 dark:bg-zinc-800/70',
    border: 'border-zinc-200 dark:border-zinc-700',
    accentBar: 'bg-zinc-500',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-zinc-600 dark:text-zinc-400',
  },
  MAT3533: {
    surface: 'bg-indigo-50/80 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    accentBar: 'bg-indigo-600',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-indigo-700 dark:text-indigo-300',
  },
  THL1057: {
    surface: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    accentBar: 'bg-amber-600',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-amber-800 dark:text-amber-300',
  },
  MAT3506: {
    surface: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    accentBar: 'bg-emerald-600',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-emerald-700 dark:text-emerald-300',
  },
  MAT3505: {
    surface: 'bg-teal-50/80 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/60',
    accentBar: 'bg-teal-600',
    text: 'text-zinc-900 dark:text-zinc-100',
    meta: 'text-teal-700 dark:text-teal-300',
  },
};

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
  const [viewMode, setViewMode] = useState<'notebook' | 'timetable'>('notebook');

  const inProgressCourses = courses.filter((c) => c.in_progress && !c.completed);
  const inProgressCredits = inProgressCourses.reduce((s, c) => s + c.credits, 0);

  const [selectedKey, setSelectedKey] = useState<string>(
    inProgressCourses[0]?.code || 'NCKH_NLP'
  );

  const [noteDraft, setNoteDraft] = useState('');
  const [quickAttentionDraft, setQuickAttentionDraft] = useState('');
  const [scheduleDraft, setScheduleDraft] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(false);

  const [nlpTopicDraft, setNlpTopicDraft] = useState(nlpResearch.topic_title || '');
  const [nlpAdvisorDraft, setNlpAdvisorDraft] = useState(nlpResearch.advisor_name || '');
  const [nlpModelsDraft, setNlpModelsDraft] = useState(nlpResearch.datasets_and_models || '');

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const saveTimerRef = useRef<number | null>(null);

  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');

  const [todoTitleInput, setTodoTitleInput] = useState('');
  const [todoDueInput, setTodoDueInput] = useState('');

  const [showAddSession, setShowAddSession] = useState(false);
  const [newSessCourseCode, setNewSessCourseCode] = useState('MAT1206E');
  const [newSessClassCode, setNewSessClassCode] = useState('MAT1206E 3');
  const [newSessName, setNewSessName] = useState('Trí tuệ nhân tạo');
  const [newSessDay, setNewSessDay] = useState(2);
  const [newSessStart, setNewSessStart] = useState(3);
  const [newSessEnd, setNewSessEnd] = useState(4);
  const [newSessRoom, setNewSessRoom] = useState('102T5');

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
      color: '',
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
      {/* Page Header Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl px-5 py-3.5 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NotebookPen className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.5} />
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Sổ tay Học kỳ 5 và NCKH NLP
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {inProgressCourses.length} học phần đang học · {inProgressCredits} tín chỉ · Tự động lưu theo môn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setViewMode('notebook')}
            className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
              viewMode === 'notebook'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span>Sổ ghi chú</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timetable')}
            className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
              viewMode === 'timetable'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span>Thời khóa biểu</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Clean 2-Column Academic Notebook */}
      {viewMode === 'notebook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Sidebar: Fixed-Rhythm Page List */}
          <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-4">
            {/* Pinned: NCKH NLP */}
            {(() => {
              const { pendingTodos, linksCount } = getPageCounts('NCKH_NLP');
              const isSelected = selectedKey === 'NCKH_NLP';
              return (
                <div>
                  <div className="px-2 pb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Nghiên cứu khoa học
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPage('NCKH_NLP')}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                        : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <BrainCircuit
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400'
                        }`}
                        strokeWidth={1.5}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">NCKH NLP</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                          {nlpResearch.topic_title || 'SemEval-2027'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                      {linksCount > 0 && <span>{linksCount} link</span>}
                      {pendingTodos > 0 && (
                        <span className="text-sky-700 dark:text-sky-400 font-medium">
                          {pendingTodos} việc
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })()}

            {/* Semester 5 Courses List */}
            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Học phần Kỳ 5</span>
                <span className="font-mono tabular-nums">{inProgressCourses.length} môn</span>
              </div>
              <div className="space-y-1">
                {inProgressCourses.map((c) => {
                  const st = coursesState[c.code];
                  const { pendingTodos, linksCount } = getPageCounts(c.code);
                  const isSelected = selectedKey === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectPage(c.code)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                          : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isSelected ? 'bg-sky-600' : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug">{c.name_vi}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                            <span className="font-mono">{c.code}</span>
                            <span>·</span>
                            <span>{c.credits} TC</span>
                            {st?.note && (
                              <>
                                <span>·</span>
                                <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">
                                  {st.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 shrink-0 text-[11px] font-mono tabular-nums text-zinc-500">
                        {linksCount > 0 && <span>{linksCount} link</span>}
                        {pendingTodos > 0 && (
                          <span className="text-sky-700 dark:text-sky-400 font-medium">
                            {pendingTodos} việc
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General Semester Notes */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {(() => {
                const { pendingTodos, linksCount } = getPageCounts('CHUNG');
                const isSelected = selectedKey === 'CHUNG';
                return (
                  <button
                    type="button"
                    onClick={() => handleSelectPage('CHUNG')}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                        : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <StickyNote
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400'
                        }`}
                        strokeWidth={1.5}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">Ghi chú chung Kỳ 5</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                          Link cổng đào tạo, nhóm lớp, lịch chung
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0 text-[11px] font-mono tabular-nums text-zinc-500">
                      {linksCount > 0 && <span>{linksCount} link</span>}
                      {pendingTodos > 0 && (
                        <span className="text-sky-700 dark:text-sky-400 font-medium">
                          {pendingTodos} việc
                        </span>
                      )}
                    </div>
                  </button>
                );
              })()}
            </div>
          </aside>

          {/* Right Main Notebook Sheet */}
          <section className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-6 space-y-6">
            {/* Sheet Header */}
            {selectedKey === 'NCKH_NLP' ? (
              <div className="space-y-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span>NCKH</span>
                  <span>·</span>
                  <span>Ngôn ngữ tự nhiên</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    Tên đề tài
                  </label>
                  <input
                    type="text"
                    value={nlpTopicDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNlpTopicDraft(val);
                      scheduleAutoSave(
                        noteDraft,
                        quickAttentionDraft,
                        scheduleDraft,
                        val,
                        nlpAdvisorDraft,
                        nlpModelsDraft
                      );
                    }}
                    onBlur={() =>
                      flushSave(
                        selectedKey,
                        noteDraft,
                        quickAttentionDraft,
                        scheduleDraft,
                        nlpTopicDraft,
                        nlpAdvisorDraft,
                        nlpModelsDraft
                      )
                    }
                    className="w-full text-lg font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                    placeholder="Tên đề tài nghiên cứu"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                      Giảng viên hướng dẫn
                    </label>
                    <input
                      type="text"
                      value={nlpAdvisorDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNlpAdvisorDraft(val);
                        scheduleAutoSave(
                          noteDraft,
                          quickAttentionDraft,
                          scheduleDraft,
                          nlpTopicDraft,
                          val,
                          nlpModelsDraft
                        );
                      }}
                      onBlur={() =>
                        flushSave(
                          selectedKey,
                          noteDraft,
                          quickAttentionDraft,
                          scheduleDraft,
                          nlpTopicDraft,
                          nlpAdvisorDraft,
                          nlpModelsDraft
                        )
                      }
                      className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                      Mô hình và tập dữ liệu
                    </label>
                    <input
                      type="text"
                      value={nlpModelsDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNlpModelsDraft(val);
                        scheduleAutoSave(
                          noteDraft,
                          quickAttentionDraft,
                          scheduleDraft,
                          nlpTopicDraft,
                          nlpAdvisorDraft,
                          val
                        );
                      }}
                      onBlur={() =>
                        flushSave(
                          selectedKey,
                          noteDraft,
                          quickAttentionDraft,
                          scheduleDraft,
                          nlpTopicDraft,
                          nlpAdvisorDraft,
                          nlpModelsDraft
                        )
                      }
                      className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                    />
                  </div>
                </div>
              </div>
            ) : selectedKey === 'CHUNG' ? (
              <div className="pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  K5 · Chung
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Ghi chú chung Học kỳ 5
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Lưu liên kết cổng đào tạo, nhóm lớp học phần và nhắc nhở chung trong kỳ
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                    <span className="text-sky-700 dark:text-sky-400 font-medium">
                      {currentCourseMeta?.code || selectedKey}
                    </span>
                    <span>·</span>
                    <span>{currentCourseMeta?.credits || 3} tín chỉ</span>
                    <span>·</span>
                    <span>{currentCourseMeta?.type || 'Bắt buộc'}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {currentCourseMeta?.name_vi || selectedKey}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Lịch học và phòng
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSchedule((v) => !v)}
                        className="text-sky-700 dark:text-sky-400 hover:underline font-medium"
                      >
                        {editingSchedule ? 'Xong' : 'Chỉnh sửa'}
                      </button>
                    </div>
                    {editingSchedule ? (
                      <input
                        type="text"
                        value={scheduleDraft}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScheduleDraft(val);
                          scheduleAutoSave(noteDraft, quickAttentionDraft, val);
                        }}
                        onBlur={() => flushSave(selectedKey, noteDraft, quickAttentionDraft, scheduleDraft)}
                        placeholder="Thứ 2 (Tiết 9-10, 101T5)"
                        className="w-full h-8 px-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                      />
                    ) : (
                      <div className="text-zinc-800 dark:text-zinc-200 font-medium tabular-nums">
                        {scheduleDraft || 'Chưa cập nhật lịch học'}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                    <label className="text-zinc-500 dark:text-zinc-400 font-medium block mb-1.5">
                      Chú ý ngắn
                    </label>
                    <input
                      type="text"
                      value={quickAttentionDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickAttentionDraft(val);
                        scheduleAutoSave(noteDraft, val, scheduleDraft);
                      }}
                      onBlur={() => flushSave(selectedKey, noteDraft, quickAttentionDraft, scheduleDraft)}
                      placeholder="Ghi chú ngắn gọn"
                      className="w-full h-8 px-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Notebook Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Ghi chú và điều cần lưu ý
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    {saveStatus === 'saving' ? (
                      <span>Đang lưu</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                        <span>Đã lưu</span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      flushSave(
                        selectedKey,
                        noteDraft,
                        quickAttentionDraft,
                        scheduleDraft,
                        nlpTopicDraft,
                        nlpAdvisorDraft,
                        nlpModelsDraft
                      )
                    }
                    className="h-7 px-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition-colors duration-150"
                  >
                    <Save className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={noteDraft}
                onChange={(e) => {
                  const val = e.target.value;
                  setNoteDraft(val);
                  scheduleAutoSave(
                    val,
                    quickAttentionDraft,
                    scheduleDraft,
                    nlpTopicDraft,
                    nlpAdvisorDraft,
                    nlpModelsDraft
                  );
                }}
                onBlur={() =>
                  flushSave(
                    selectedKey,
                    noteDraft,
                    quickAttentionDraft,
                    scheduleDraft,
                    nlpTopicDraft,
                    nlpAdvisorDraft,
                    nlpModelsDraft
                  )
                }
                placeholder={
                  selectedKey === 'NCKH_NLP'
                    ? 'Kết quả thực nghiệm, điểm số mô hình, trao đổi với giảng viên hướng dẫn và hướng phát triển'
                    : 'Lưu ý từ giảng viên, nội dung trọng tâm thi giữa kỳ, cuối kỳ và tỷ lệ điểm thành phần'
                }
                className="w-full p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 resize-y"
              />
            </div>

            {/* Section 2: Related Links */}
            <div className="space-y-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Liên kết tài liệu
                </h3>
              </div>

              <div className="space-y-1.5">
                {selectedKey === 'NCKH_NLP' ? (
                  (nlpResearch.paper_links || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-1">
                      Chưa có liên kết tài liệu nào
                    </p>
                  ) : (
                    (nlpResearch.paper_links || []).map((rawItem, idx) => {
                      const parsed = parseNlpLinkString(rawItem);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
                        >
                          {parsed.url ? (
                            <a
                              href={parsed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-sky-700 dark:text-sky-400 hover:underline font-medium text-xs sm:text-sm"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
                              <span className="truncate">{parsed.title}</span>
                              {parsed.title !== parsed.url && (
                                <span className="text-xs font-mono text-zinc-400 truncate hidden sm:inline">
                                  {parsed.url}
                                </span>
                              )}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 text-zinc-700 dark:text-zinc-200 font-medium text-xs sm:text-sm">
                              <Link2 className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
                              <span className="truncate">{parsed.title}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteNlpLink(idx)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors duration-150 shrink-0"
                            title="Xóa liên kết"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      );
                    })
                  )
                ) : (currentCourseState?.links || []).length === 0 ? (
                  <p className="text-xs text-zinc-400 py-1">
                    Chưa có liên kết tài liệu nào cho học phần này
                  </p>
                ) : (
                  (currentCourseState?.links || []).map((lk) => {
                    const hasHref = /^https?:\/\//i.test(lk.url);
                    return (
                      <div
                        key={lk.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150"
                      >
                        {hasHref ? (
                          <a
                            href={lk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-sky-700 dark:text-sky-400 hover:underline font-medium text-xs sm:text-sm"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
                            <span className="truncate">{lk.title}</span>
                            {lk.title !== lk.url && (
                              <span className="text-xs font-mono text-zinc-400 truncate hidden sm:inline">
                                {lk.url}
                              </span>
                            )}
                          </a>
                        ) : (
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 text-zinc-700 dark:text-zinc-200 font-medium text-xs sm:text-sm">
                            <Link2 className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
                            <span className="truncate">{lk.title}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteCourseLink(lk.id)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors duration-150 shrink-0"
                          title="Xóa liên kết"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddLink} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={linkTitleInput}
                  onChange={(e) => setLinkTitleInput(e.target.value)}
                  placeholder="Tên tài liệu (Slide, Drive, Paper)"
                  className="sm:col-span-5 h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                />
                <input
                  type="text"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  placeholder="Đường dẫn URL (https://...)"
                  className="sm:col-span-5 h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 h-9 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span>Lưu link</span>
                </button>
              </form>
            </div>

            {/* Section 3: Todo / Exam Checklist */}
            <div className="space-y-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Việc cần làm và lịch kiểm tra
                  </h3>
                </div>
                {pageTasks.length > 0 && (
                  <span className="text-xs font-mono tabular-nums text-zinc-500">
                    {pageTasks.filter((t) => !t.completed).length} chưa xong
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {pageTasks.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-1">
                    Chưa có công việc nào
                  </p>
                ) : (
                  pageTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-150 ${
                        t.completed
                          ? 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTodo(t.id)}
                        className="flex items-start gap-2.5 flex-1 text-left min-w-0"
                      >
                        {t.completed ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5"
                            strokeWidth={1.5}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs sm:text-sm font-medium ${
                              t.completed
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-800 dark:text-zinc-100'
                            }`}
                          >
                            {t.title}
                          </div>
                          {t.details && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {t.details}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.due_date && (
                          <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                            {t.due_date}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTodo(t.id)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors duration-150"
                          title="Xóa công việc"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddTodo} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={todoTitleInput}
                  onChange={(e) => setTodoTitleInput(e.target.value)}
                  placeholder="Thêm việc cần làm hoặc lịch thi"
                  className="sm:col-span-7 h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                />
                <input
                  type="text"
                  value={todoDueInput}
                  onChange={(e) => setTodoDueInput(e.target.value)}
                  placeholder="Hạn (25/11)"
                  className="sm:col-span-3 h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 h-9 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span>Thêm</span>
                </button>
              </form>
            </div>

            {/* Section 4: NCKH Milestones (only on NCKH_NLP) */}
            {selectedKey === 'NCKH_NLP' && (nlpResearch.milestones || []).length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tiến độ 4 giai đoạn NCKH
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(nlpResearch.milestones || []).map((m) => {
                    const isDone = m.status === 'completed';
                    const isProg = m.status === 'in_progress';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleCycleMilestone(m.id)}
                        className="text-left p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            {m.phase}
                          </div>
                          <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1 line-clamp-2">
                            {m.title}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : isProg
                              ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
                              : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {isDone ? 'Xong' : isProg ? 'Đang làm' : 'Sắp tới'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Mode 2: Clean Timetable Matrix */}
      {viewMode === 'timetable' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Thời khóa biểu Học kỳ 5
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Nhấp vào ô môn học để mở trang sổ ghi chú tương ứng
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSession((v) => !v)}
              className="h-9 px-3 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors duration-150"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span>Thêm ca học</span>
            </button>
          </div>

          {showAddSession && (
            <form
              onSubmit={handleAddTimetableSession}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-xs"
            >
              <input
                type="text"
                value={newSessCourseCode}
                onChange={(e) => setNewSessCourseCode(e.target.value)}
                placeholder="Mã môn (MAT3533)"
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
              />
              <input
                type="text"
                value={newSessClassCode}
                onChange={(e) => setNewSessClassCode(e.target.value)}
                placeholder="Mã lớp"
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
              />
              <input
                type="text"
                value={newSessName}
                onChange={(e) => setNewSessName(e.target.value)}
                placeholder="Tên môn"
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
              />
              <select
                value={newSessDay}
                onChange={(e) => setNewSessDay(Number(e.target.value))}
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.day} value={d.day}>
                    {d.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newSessStart}
                  onChange={(e) => setNewSessStart(Number(e.target.value))}
                  className="w-full h-9 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center font-mono tabular-nums"
                />
                <span>-</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newSessEnd}
                  onChange={(e) => setNewSessEnd(Number(e.target.value))}
                  className="w-full h-9 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center font-mono tabular-nums"
                />
              </div>
              <input
                type="text"
                value={newSessRoom}
                onChange={(e) => setNewSessRoom(e.target.value)}
                placeholder="Phòng (102T5)"
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
              >
                Lưu ca
              </button>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <table className="w-full min-w-[920px] table-fixed border-collapse text-xs tabular-nums">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-[56px] py-2.5 px-2 border-r border-zinc-200/70 dark:border-zinc-800 text-center font-medium">
                    Tiết
                  </th>
                  <th className="w-[116px] py-2.5 px-2 border-r border-zinc-200/70 dark:border-zinc-800 text-center font-medium">
                    Thời gian
                  </th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th
                      key={d.day}
                      className="py-2.5 px-2 border-r last:border-r-0 border-zinc-200/70 dark:border-zinc-800 text-center font-medium"
                    >
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((period) => {
                  const isSkippedByRowSpan = (day: number) =>
                    timetable.some(
                      (s) =>
                        s.day_of_week === day &&
                        s.start_period < period &&
                        s.end_period >= period
                    );

                  const findStartingSession = (day: number) =>
                    timetable.find((s) => s.day_of_week === day && s.start_period === period);

                  return (
                    <React.Fragment key={period}>
                      {period === 7 && (
                        <tr className="bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                          <td className="py-2 px-2 border-y border-r border-zinc-200/70 dark:border-zinc-800 text-center font-medium">
                            Trưa
                          </td>
                          <td className="py-2 px-2 border-y border-r border-zinc-200/70 dark:border-zinc-800 text-center font-mono">
                            12:30 - 13:00
                          </td>
                          <td
                            colSpan={6}
                            className="py-2 px-3 border-y border-zinc-200/70 dark:border-zinc-800 text-center text-xs"
                          >
                            Nghỉ trưa
                          </td>
                        </tr>
                      )}

                      <tr className="h-[52px]">
                        <td className="border-b border-r border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-center font-mono font-medium text-zinc-600 dark:text-zinc-400">
                          {period}
                        </td>
                        <td className="border-b border-r border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/60 text-center font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                          {PERIOD_TIMES[period]}
                        </td>

                        {DAYS_OF_WEEK.map((d) => {
                          if (isSkippedByRowSpan(d.day)) return null;
                          const sess = findStartingSession(d.day);
                          if (!sess) {
                            return (
                              <td
                                key={d.day}
                                className="border-b border-r last:border-r-0 border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/30"
                              />
                            );
                          }

                          const span = Math.max(1, sess.end_period - sess.start_period + 1);
                          const palette = COURSE_TIMETABLE_STYLES[sess.course_code] || {
                            surface: 'bg-sky-50 dark:bg-sky-950/40',
                            border: 'border-sky-200 dark:border-sky-800/60',
                            accentBar: 'bg-sky-600',
                            text: 'text-zinc-900 dark:text-zinc-100',
                            meta: 'text-sky-700 dark:text-sky-300',
                          };

                          return (
                            <td
                              key={d.day}
                              rowSpan={span}
                              className="p-1 border-b border-r last:border-r-0 border-zinc-200/70 dark:border-zinc-800 align-stretch"
                            >
                              <div
                                onClick={() => {
                                  setSelectedKey(sess.course_code);
                                  setViewMode('notebook');
                                }}
                                title="Mở sổ ghi chú môn học này"
                                className={`h-full w-full rounded-lg p-2.5 border ${palette.surface} ${palette.border} ${palette.text} flex flex-col justify-between relative group cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-150 overflow-hidden`}
                              >
                                <div
                                  className={`absolute left-0 top-0 bottom-0 w-1 ${palette.accentBar}`}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTimetableSession(sess.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-zinc-900/10 hover:bg-rose-600 hover:text-white text-zinc-600 dark:text-zinc-300 flex items-center justify-center"
                                  title="Xóa ca học"
                                >
                                  <X className="w-3 h-3" strokeWidth={1.75} />
                                </button>

                                <div className="pl-1.5">
                                  <div className="font-medium text-xs leading-snug break-words pr-4">
                                    {sess.course_name}
                                  </div>
                                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {sess.class_code}
                                  </div>
                                </div>

                                <div className="pl-1.5 flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-zinc-900/10 dark:border-white/10 text-[11px] font-mono">
                                  <span className={`inline-flex items-center gap-1 font-medium ${palette.meta}`}>
                                    <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                                    <span>{sess.room}</span>
                                  </span>
                                  <span className="text-zinc-500 dark:text-zinc-400">
                                    T{sess.start_period}-{sess.end_period}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
