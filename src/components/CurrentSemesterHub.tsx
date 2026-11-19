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

const COURSE_TIMETABLE_STYLES: Record<
  string,
  { bg: string; border: string; text: string; pill: string }
> = {
  MAT1206E: {
    bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
    border: 'border-sky-700',
    text: 'text-white',
    pill: 'bg-white/20 text-white',
  },
  MAT3519: {
    bg: 'bg-gradient-to-br from-cyan-100 to-sky-200 dark:from-cyan-950 dark:to-cyan-900',
    border: 'border-cyan-400 dark:border-cyan-700',
    text: 'text-cyan-950 dark:text-cyan-100',
    pill: 'bg-cyan-600/15 text-cyan-900 dark:text-cyan-200',
  },
  MAT3533: {
    bg: 'bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-950 dark:to-rose-900',
    border: 'border-pink-400 dark:border-pink-700',
    text: 'text-pink-950 dark:text-pink-100',
    pill: 'bg-pink-600/15 text-pink-900 dark:text-pink-200',
  },
  THL1057: {
    bg: 'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-950 dark:to-amber-900',
    border: 'border-orange-400 dark:border-orange-700',
    text: 'text-orange-950 dark:text-orange-100',
    pill: 'bg-orange-600/15 text-orange-900 dark:text-orange-200',
  },
  MAT3506: {
    bg: 'bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-950 dark:to-teal-900',
    border: 'border-emerald-400 dark:border-emerald-700',
    text: 'text-emerald-950 dark:text-emerald-100',
    pill: 'bg-emerald-600/15 text-emerald-900 dark:text-emerald-200',
  },
  MAT3505: {
    bg: 'bg-gradient-to-br from-lime-500 to-emerald-600',
    border: 'border-lime-700',
    text: 'text-white',
    pill: 'bg-white/25 text-white',
  },
};

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

const COURSE_SHORT: Record<string, { short: string; chip: string; bar: string }> = {
  MAT1206E: { short: 'Trí tuệ NT', chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40', bar: 'bg-sky-500' },
  MAT3519: { short: 'NNLT 2', chip: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40', bar: 'bg-cyan-500' },
  MAT3533: { short: 'Học máy', chip: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/40', bar: 'bg-pink-500' },
  THL1057: { short: 'Pháp luật', chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40', bar: 'bg-orange-500' },
  MAT3506: { short: 'Mạng MT', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40', bar: 'bg-emerald-500' },
  MAT3505: { short: 'Kiến trúc MT', chip: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/40', bar: 'bg-lime-500' },
};
// Classes are shown up to the day before the first exam
const CLASS_END_DATE = '2026-12-25';

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function ExamCalendar({ timetable }: { timetable: TimetableSession[] }) {
  const now = new Date();
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayStr);

  const examsOn = (date: string) => EXAM_SCHEDULE.filter((x) => x.date === date);
  const classesOn = (date: string) => {
    if (date > CLASS_END_DATE) return [];
    const dt = new Date(date + 'T00:00:00');
    const dow = dt.getDay() === 0 ? 8 : dt.getDay() + 1;
    return timetable
      .filter((s) => s.day_of_week === dow)
      .sort((a, b) => a.start_period - b.start_period);
  };

  const first = new Date(cursor.y, cursor.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysIn }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const selExams = examsOn(selected);
  const selClasses = classesOn(selected);
  const selDate = new Date(selected + 'T00:00:00');
  const weekdayVi = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const nextExams = EXAM_SCHEDULE.filter((x) => x.date && x.date >= todayStr).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* MONTH GRID */}
      <div className="xl:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15">
              <Calendar className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">Tháng {cursor.m + 1}, {cursor.y}</div>
              <div className="text-[11px] text-slate-300 font-semibold">Bấm vào một ngày để xem chi tiết</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => shift(-1)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-extrabold">‹</button>
            <button
              type="button"
              onClick={() => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSelected(todayStr); }}
              className="px-3 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-extrabold"
            >
              Hôm nay
            </button>
            <button type="button" onClick={() => shift(1)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-extrabold">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((h, i) => (
            <div key={h} className={`py-2 text-center text-[11px] font-extrabold uppercase ${i === 6 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {h}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null)
              return <div key={`e${i}`} className="min-h-[96px] border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40" />;
            const date = ymd(cursor.y, cursor.m, d);
            const exams = examsOn(date);
            const classes = classesOn(date);
            const isToday = date === todayStr;
            const isSel = date === selected;
            const isPast = date < todayStr;
            return (
              <button
                type="button"
                key={date}
                onClick={() => setSelected(date)}
                className={`min-h-[96px] p-1.5 text-left border-b border-r border-slate-100 dark:border-slate-800 flex flex-col gap-1 transition-colors ${
                  exams.length
                    ? 'bg-rose-50 dark:bg-rose-950/30'
                    : 'hover:bg-sky-50/60 dark:hover:bg-slate-800/60'
                } ${isSel ? 'ring-2 ring-inset ring-sky-500' : ''} ${isPast ? 'opacity-60' : ''}`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-extrabold ${
                    isToday ? 'bg-sky-600 text-white shadow' : i % 7 === 6 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {d}
                </span>
                {exams.map((ex) => (
                  <span key={ex.code} className="w-full px-1.5 py-1 rounded-md bg-gradient-to-r from-rose-600 to-orange-500 text-white text-[10px] font-extrabold leading-tight shadow-sm">
                    🎯 THI {COURSE_SHORT[ex.code]?.short || ex.name}
                  </span>
                ))}
                {classes.slice(0, exams.length ? 1 : 3).map((s) => (
                  <span
                    key={s.id}
                    className={`w-full px-1.5 py-0.5 rounded-md border text-[10px] font-bold leading-tight truncate ${COURSE_SHORT[s.course_code]?.chip || 'bg-slate-100 text-slate-700 border-slate-300'}`}
                  >
                    {COURSE_SHORT[s.course_code]?.short || s.course_name}
                  </span>
                ))}
                {classes.length > (exams.length ? 1 : 3) && (
                  <span className="text-[10px] font-bold text-slate-400">+{classes.length - (exams.length ? 1 : 3)} môn</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL */}
      <div className="xl:col-span-4 space-y-4">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="text-xs font-extrabold text-sky-600 uppercase">{weekdayVi[selDate.getDay()]}</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {selDate.getDate()}/{selDate.getMonth() + 1}/{selDate.getFullYear()}
          </div>
          <div className="mt-4 space-y-2">
            {selExams.length === 0 && selClasses.length === 0 && (
              <div className="text-sm text-slate-400 font-semibold py-6 text-center">Ngày trống – không có lịch 🎉</div>
            )}
            {selExams.map((ex) => (
              <div key={ex.code} className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-md">
                <div className="text-[11px] font-extrabold opacity-90">LỊCH THI · {ex.slot}</div>
                <div className="text-sm font-extrabold">{ex.name}</div>
                <div className="text-[11px] font-bold opacity-90">{ex.code} · {ex.format}</div>
              </div>
            ))}
            {selClasses.map((s) => (
              <div key={s.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className={`w-1.5 rounded-full ${COURSE_SHORT[s.course_code]?.bar || 'bg-slate-400'}`} />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">{s.course_name}</div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tiết {s.start_period}-{s.end_period} · {PERIOD_TIMES[s.start_period]?.split(' - ')[0]} – {PERIOD_TIMES[s.end_period]?.split(' - ')[1]}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">📍 {s.room}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-sky-950 text-white shadow-sm p-5">
          <div className="text-sm font-extrabold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400" /> Đếm ngược kỳ thi
          </div>
          <div className="space-y-2">
            {nextExams.map((ex) => {
              const left = examDaysLeft(ex.date);
              return (
                <button
                  type="button"
                  key={ex.code}
                  onClick={() => {
                    const [y, m] = ex.date.split('-').map(Number);
                    setCursor({ y, m: m - 1 });
                    setSelected(ex.date);
                  }}
                  className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">{ex.name}</div>
                    <div className="text-[11px] text-slate-300 font-semibold">
                      {ex.date.split('-').reverse().join('/')} · {ex.slot}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-rose-400 leading-none">{left}</div>
                    <div className="text-[10px] text-slate-400 font-bold">ngày</div>
                  </div>
                </button>
              );
            })}
          </div>
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
          <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-sm">
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
                ? 'bg-sky-600 text-white shadow-sm'
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
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ Ghi Chú Từng Môn</span>
          </button>
        </div>
      </div>

      {/* MODE 1: CLEAN 2-COLUMN NOTEBOOK */}
      {viewMode === 'notebook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT SIDEBAR: Easy-to-click Subject List */}
          <aside className="lg:col-span-4 space-y-2.5">
            {/* Pinned: NCKH NLP */}
            {(() => {
              const { pendingTodos, linksCount } = getPageCounts('NCKH_NLP');
              const isSelected = selectedKey === 'NCKH_NLP';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectPage('NCKH_NLP')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-extrabold text-sm">
                      <BrainCircuit className="w-4 h-4 shrink-0" />
                      <span className="truncate">NCKH NLP</span>
                    </div>
                    <p
                      className={`text-xs mt-1 truncate ${
                        isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {nlpResearch.topic_title || 'Nghiên cứu Xử lý ngôn ngữ tự nhiên'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] font-bold">
                    {linksCount > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        🔗 {linksCount}
                      </span>
                    )}
                    {pendingTodos > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-300 text-slate-900'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pendingTodos} việc
                      </span>
                    )}
                  </div>
                </button>
              );
            })()}

            <div className="px-2 pt-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Các môn đang học Kỳ 5 ({inProgressCourses.length})
            </div>

            {/* 6 Semester 5 Course Items */}
            <div className="space-y-2">
              {inProgressCourses.map((c) => {
                const st = coursesState[c.code];
                const { pendingTodos, linksCount } = getPageCounts(c.code);
                const isSelected = selectedKey === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectPage(c.code)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-sky-100 dark:border-slate-800 hover:border-sky-300 hover:bg-sky-50/40 dark:hover:bg-slate-800/70 text-slate-900 dark:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm leading-snug">{c.name_vi}</div>
                      <div
                        className={`text-[11px] font-semibold mt-0.5 flex flex-wrap items-center gap-1.5 ${
                          isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span className="font-mono">{c.code}</span>
                        <span>•</span>
                        <span>{c.credits} TC</span>
                        {st?.note && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-sky-100/80 dark:bg-slate-800 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            {st.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] font-bold">
                      {linksCount > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          🔗 {linksCount}
                        </span>
                      )}
                      {pendingTodos > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-amber-300 text-slate-900'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {pendingTodos} việc
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* General Notes Item */}
            {(() => {
              const { pendingTodos, linksCount } = getPageCounts('CHUNG');
              const isSelected = selectedKey === 'CHUNG';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectPage('CHUNG')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 shadow-md'
                      : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StickyNote className="w-4 h-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm">Ghi chú chung Kỳ 5</div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Link nhóm lớp, cổng đào tạo, việc chung
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold">
                    {linksCount > 0 && <span className="px-2 py-0.5 rounded-full bg-white/15">🔗 {linksCount}</span>}
                    {pendingTodos > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-900">
                        {pendingTodos} việc
                      </span>
                    )}
                  </div>
                </button>
              );
            })()}
          </aside>

          {/* RIGHT MAIN PAGE: Focused, Clean Notebook Sheet */}
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-6">
            {/* A. NOTEBOOK PAGE HEADER */}
            {selectedKey === 'NCKH_NLP' ? (
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Sổ Tay Nghiên Cứu Khoa Học (NCKH NLP)
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Tên đề tài đang làm:
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
                    className="w-full text-lg font-extrabold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập tên đề tài NCKH..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Giảng viên hướng dẫn:
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Mô hình / Dataset dùng:
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                </div>
              </div>
            ) : selectedKey === 'CHUNG' ? (
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📌 Ghi chú chung Học kỳ 5</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nơi lưu link Cổng đào tạo, link nhóm lớp, quy định điểm danh hoặc những nhắc nhở chung cho cả kỳ.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-xs font-extrabold">
                        {currentCourseMeta?.code || selectedKey}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                        {currentCourseMeta?.credits || 3} Tín chỉ • {currentCourseMeta?.type || 'Bắt buộc'}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                      {currentCourseMeta?.name_vi || selectedKey}
                    </h3>
                  </div>
                </div>

                {/* Schedule & Quick Attention */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Lịch học & Phòng học:
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSchedule((v) => !v)}
                        className="underline text-[10px] hover:text-sky-900"
                      >
                        {editingSchedule ? 'Xong' : 'Sửa'}
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
                        placeholder="VD: Thứ 2 (Tiết 9-10, 101T5)"
                        className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-300 text-xs font-semibold"
                      />
                    ) : (
                      <div className="text-slate-700 dark:text-slate-200 font-semibold">
                        {scheduleDraft || 'Chưa ghi lịch học (bấm Sửa để thêm)'}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
                    <label className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      ⚡ Chú ý ngắn (hiển thị ngoài danh sách):
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
                      placeholder="VD: Hơi khó, cố gắng học / Làm web thôi..."
                      className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B. SECTION 1: MAIN NOTEBOOK EDITOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📝 Ghi chú & Điều cần lưu ý</span>
                </label>
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' ? (
                    <span className="text-[11px] font-bold text-amber-600">Đang lưu...</span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Đã tự động lưu
                    </span>
                  )}
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
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1 border border-sky-200 dark:border-slate-700"
                  >
                    <Save className="w-3 h-3" />
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
                    ? 'Ghi lại kết quả thực nghiệm, điểm số mô hình (VD: 0.87 task 1a), lời khuyên của cô Linh & anh An, hướng cải tiến tiếp theo...'
                    : 'Ghi mọi điều quan trọng của môn này tại đây: thầy cô dặn gì, phần nào trọng tâm thi giữa kỳ/cuối kỳ, cách tính điểm thành phần...'
                }
                className="w-full p-4 rounded-2xl bg-sky-50/40 dark:bg-slate-800/70 border border-sky-200 dark:border-slate-700 text-sm leading-relaxed text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
              />
            </div>

            {/* C. SECTION 2: RELATED LINKS */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-sky-600" />
                  <span>Link tài liệu & Liên kết quan trọng</span>
                </h4>
              </div>

              {/* Saved Links List */}
              <div className="space-y-2">
                {selectedKey === 'NCKH_NLP' ? (
                  (nlpResearch.paper_links || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      Chưa có link nào. Hãy dán link Paper, GitHub, Overleaf, Drive ở ô bên dưới để lưu nhanh.
                    </p>
                  ) : (
                    (nlpResearch.paper_links || []).map((rawItem, idx) => {
                      const parsed = parseNlpLinkString(rawItem);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-sky-300 transition-colors"
                        >
                          {parsed.url ? (
                            <a
                              href={parsed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-sky-700 dark:text-sky-300 hover:underline font-bold text-xs sm:text-sm"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0 text-sky-500" />
                              <span className="truncate">{parsed.title}</span>
                              {parsed.title !== parsed.url && (
                                <span className="text-[11px] font-normal text-slate-400 truncate hidden sm:inline">
                                  ({parsed.url})
                                </span>
                              )}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                              <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
                              <span className="truncate">{parsed.title}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteNlpLink(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                            title="Xóa link này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )
                ) : (currentCourseState?.links || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Chưa có link nào cho môn này (Slide bài giảng, Google Drive, Classroom, GitHub...). Thêm ngay bên dưới!
                  </p>
                ) : (
                  (currentCourseState?.links || []).map((lk) => {
                    const hasHref = /^https?:\/\//i.test(lk.url);
                    return (
                      <div
                        key={lk.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-sky-300 transition-colors"
                      >
                        {hasHref ? (
                          <a
                            href={lk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-sky-700 dark:text-sky-300 hover:underline font-bold text-xs sm:text-sm"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0 text-sky-500" />
                            <span className="truncate">{lk.title}</span>
                            {lk.title !== lk.url && (
                              <span className="text-[11px] font-normal text-slate-400 truncate hidden sm:inline">
                                ({lk.url})
                              </span>
                            )}
                          </a>
                        ) : (
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                            <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
                            <span className="truncate">{lk.title}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteCourseLink(lk.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                          title="Xóa link này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Super Simple 1-Row Add Link Bar */}
              <form onSubmit={handleAddLink} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={linkTitleInput}
                  onChange={(e) => setLinkTitleInput(e.target.value)}
                  placeholder="Tên link (VD: Slide, Drive, GitHub...)"
                  className="sm:col-span-5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  placeholder="Dán đường dẫn URL (https://...)"
                  className="sm:col-span-5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu Link</span>
                </button>
              </form>
            </div>

            {/* D. SECTION 3: SIMPLE TODO / DEADLINE CHECKLIST FOR THIS SUBJECT */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Việc cần làm / Lịch kiểm tra</span>
                {pageTasks.length > 0 && (
                  <span className="text-xs font-bold text-slate-400">
                    ({pageTasks.filter((t) => !t.completed).length} chưa xong)
                  </span>
                )}
              </h4>

              <div className="space-y-2">
                {pageTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Chưa có việc cần làm nào cho mục này.
                  </p>
                ) : (
                  pageTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        t.completed
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 opacity-65'
                          : 'bg-white dark:bg-slate-800 border-sky-100 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTodo(t.id)}
                        className="flex items-start gap-3 flex-1 text-left min-w-0"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs sm:text-sm font-bold ${
                              t.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {t.title}
                          </div>
                          {t.details && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {t.details}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.due_date && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-slate-700 text-sky-700 dark:text-sky-300 text-[11px] font-bold">
                            {t.due_date}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTodo(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Xóa việc này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Super Simple 1-Row Add Todo Bar */}
              <form onSubmit={handleAddTodo} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={todoTitleInput}
                  onChange={(e) => setTodoTitleInput(e.target.value)}
                  placeholder="Gõ việc cần làm / hạn nộp bài / lịch thi..."
                  className="sm:col-span-7 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={todoDueInput}
                  onChange={(e) => setTodoDueInput(e.target.value)}
                  placeholder="Ngày / Hạn (VD: 25/11)"
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </form>
            </div>

            {/* E. CLEAN COMPACT MILESTONES STRIP (Only on NCKH NLP page) */}
            {selectedKey === 'NCKH_NLP' && (nlpResearch.milestones || []).length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    🗺️ Tiến độ 4 Giai đoạn NCKH (Bấm để đổi trạng thái)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(nlpResearch.milestones || []).map((m) => {
                    const isDone = m.status === 'completed';
                    const isProg = m.status === 'in_progress';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleCycleMilestone(m.id)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                          isDone
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                            : isProg
                            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                            {m.phase}
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-2">
                            {m.title}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isProg
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isDone ? 'Xong' : isProg ? 'Đang làm' : 'Chưa tới'}
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
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 shadow-sm overflow-hidden"
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
