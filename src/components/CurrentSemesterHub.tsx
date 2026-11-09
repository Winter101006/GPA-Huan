import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  BrainCircuit,
  BookOpen,
  Sparkles,
  FileText,
  Target,
  AlertCircle,
  Edit3,
  Layers,
  Award,
  ExternalLink,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';
import {
  Course,
  CourseUserState,
  TimetableSession,
  SemesterTaskItem,
  NLPResearchWorkspaceData,
  NLPResearchMilestone,
} from '../types/academic';
import { getCourseDifficulty, getCourseCategoryMeta } from '../utils/courseReviews';

interface CurrentSemesterHubProps {
  courses: Course[];
  coursesState: Record<string, CourseUserState>;
  onUpdateCourseFullState: (code: string, partialState: Partial<CourseUserState>) => void;
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

const CATEGORY_META: Record<
  SemesterTaskItem['category'],
  { label: string; badgeClass: string }
> = {
  exam: {
    label: '🔥 Lịch thi / Kiểm tra',
    badgeClass: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300',
  },
  assignment: {
    label: '📝 Bài tập tuần / Lab',
    badgeClass: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300',
  },
  project: {
    label: '💻 Đồ án / Bài tập lớn',
    badgeClass:
      'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300',
  },
  nlp_research: {
    label: '🧠 Nghiên cứu KH NLP',
    badgeClass:
      'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300',
  },
  note: {
    label: '📌 Ghi chú môn học',
    badgeClass:
      'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300',
  },
};

export const CurrentSemesterHub: React.FC<CurrentSemesterHubProps> = ({
  courses,
  onUpdateCourseFullState,
  timetable,
  onUpdateTimetable,
  tasks,
  onUpdateTasks,
  nlpResearch,
  onUpdateNlpResearch,
}) => {
  const [activeView, setActiveView] = useState<
    'overview_all' | 'tasks_exams' | 'nlp_research' | 'timetable_courses'
  >('overview_all');

  // Task Filter & New Task State
  const [taskFilter, setTaskFilter] = useState<'all' | SemesterTaskItem['category']>('all');
  const [taskCourseFilter, setTaskCourseFilter] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourse, setNewTaskCourse] = useState('NCKH_NLP');
  const [newTaskCategory, setNewTaskCategory] = useState<SemesterTaskItem['category']>('exam');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-11-25');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newTaskDetails, setNewTaskDetails] = useState('');

  // New Paper Link input for NLP Research
  const [newPaperInput, setNewPaperInput] = useState('');

  // New Timetable Session Modal
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSessCourseCode, setNewSessCourseCode] = useState('MAT1206E');
  const [newSessClassCode, setNewSessClassCode] = useState('MAT1206E 3');
  const [newSessName, setNewSessName] = useState('Trí tuệ nhân tạo (TH)');
  const [newSessDay, setNewSessDay] = useState(2);
  const [newSessStart, setNewSessStart] = useState(3);
  const [newSessEnd, setNewSessEnd] = useState(4);
  const [newSessRoom, setNewSessRoom] = useState('102T5');

  const inProgressCourses = courses.filter((c) => c.in_progress && !c.completed);
  const inProgressCredits = inProgressCourses.reduce((s, c) => s + c.credits, 0);

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const examTasksCount = tasks.filter((t) => t.category === 'exam' && !t.completed).length;
  const nlpMilestoneDoneCount = (nlpResearch.milestones || []).filter(
    (m) => m.status === 'completed'
  ).length;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter !== 'all' && t.category !== taskFilter) return false;
    if (taskCourseFilter !== 'all' && t.course_code !== taskCourseFilter) return false;
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: SemesterTaskItem = {
      id: `task-${Date.now()}`,
      course_code: newTaskCourse,
      category: newTaskCategory,
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate,
      priority: newTaskPriority,
      completed: false,
      details: newTaskDetails.trim(),
    };
    onUpdateTasks([item, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDetails('');
  };

  const handleToggleTask = (id: string) => {
    onUpdateTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== id));
  };

  const handleCycleMilestoneStatus = (milestoneId: string) => {
    const order: NLPResearchMilestone['status'][] = ['upcoming', 'in_progress', 'completed'];
    const nextMilestones = nlpResearch.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const nextIdx = (order.indexOf(m.status) + 1) % order.length;
      return { ...m, status: order[nextIdx] };
    });
    onUpdateNlpResearch({ ...nlpResearch, milestones: nextMilestones });
  };

  const handleAddPaperLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaperInput.trim()) return;
    onUpdateNlpResearch({
      ...nlpResearch,
      paper_links: [...(nlpResearch.paper_links || []), newPaperInput.trim()],
    });
    setNewPaperInput('');
  };

  const handleRemovePaperLink = (idx: number) => {
    onUpdateNlpResearch({
      ...nlpResearch,
      paper_links: nlpResearch.paper_links.filter((_, i) => i !== idx),
    });
  };

  const handleAddTimetableSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: TimetableSession = {
      id: `tt-${Date.now()}`,
      course_code: newSessCourseCode,
      class_code: newSessClassCode,
      course_name: newSessName,
      session_type: 'LT',
      day_of_week: newSessDay,
      start_period: Math.min(newSessStart, newSessEnd),
      end_period: Math.max(newSessStart, newSessEnd),
      room: newSessRoom,
      note: 'Chăm là được',
      color: 'bg-sky-500 text-white border-sky-600',
    };
    onUpdateTimetable([...timetable, newSession]);
    setShowAddSessionModal(false);
  };

  const handleRemoveTimetableSession = (id: string) => {
    onUpdateTimetable(timetable.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Row 1: 4 Summary KPI Cards for Current Semester 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-sky-600 to-sky-500 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-100">
              Học Phần Đang Học Kỳ 5
            </span>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{inProgressCourses.length} môn</span>
            <span className="text-xs font-bold text-sky-100">({inProgressCredits} tín chỉ)</span>
          </div>
          <div className="mt-1 text-[11px] text-sky-50 font-semibold">
            5 môn Bắt buộc (14 TC) + 1 Tự chọn V.2.1 (2 TC)
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-100">
              Nghiên Cứu Khoa Học (NCKH)
            </span>
            <BrainCircuit className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-extrabold truncate">Chuyên sâu NLP & LLM</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-100 font-semibold">
            Tiến độ: {nlpMilestoneDoneCount}/{nlpResearch.milestones?.length || 4} giai đoạn • Hướng tới KLTN A+
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Lịch Thi & Bài Tập Cần Làm
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {pendingTasksCount} việc
            </span>
            <span className="text-xs font-semibold text-slate-500">
              (Đã xong: {completedTasksCount})
            </span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            {examTasksCount} lịch kiểm tra / thi sắp tới
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Mục Tiêu Sau Kỳ 5
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {71 + inProgressCredits}/129 TC
            </span>
            <span className="text-xs font-bold text-emerald-600">(67.4%)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold">
            Mở khóa trực tiếp NLP (MAT3561E) & Khai phá DL Kỳ 6
          </div>
        </div>
      </div>

      {/* Sub-navigation bar to switch cleanly or view everything at once */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-2 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveView('overview_all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'overview_all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tất cả trong 1 trang (Tổng quan Kỳ 5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tasks_exams')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'tasks_exams'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Sổ Tay Lịch Thi, Bài Tập & Deadline ({pendingTasksCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('nlp_research')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'nlp_research'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Không Gian Nghiên Cứu Khoa Học (NCKH NLP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('timetable_courses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'timetable_courses'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời Khóa Biểu & Sổ Ghi Chú 6 Môn Kỳ 5</span>
          </button>
        </div>
      </div>

      {/* SECTION A: TASKS, EXAMS & ASSIGNMENTS TRACKER */}
      {(activeView === 'overview_all' || activeView === 'tasks_exams') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 cols: Quick Add Exam / Assignment / Note Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Thêm nhanh Lịch thi / Bài tập / Công việc NCKH NLP
              </h3>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Thuộc học phần / Đề tài:
                  </label>
                  <select
                    value={newTaskCourse}
                    onChange={(e) => setNewTaskCourse(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 font-bold"
                  >
                    <option value="NCKH_NLP">🧠 Đề tài NCKH NLP</option>
                    {inProgressCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name_vi}
                      </option>
                    ))}
                    <option value="CHUNG">📌 Công việc chung Kỳ 5</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Phân loại:
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) =>
                      setNewTaskCategory(e.target.value as SemesterTaskItem['category'])
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 font-bold"
                  >
                    <option value="exam">🔥 Lịch thi / Kiểm tra</option>
                    <option value="assignment">📝 Bài tập tuần / Thực hành</option>
                    <option value="project">💻 Đồ án / Bài tập lớn</option>
                    <option value="nlp_research">🧠 Nhiệm vụ NCKH NLP</option>
                    <option value="note">📌 Ghi chú quan trọng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Tiêu đề công việc / Lịch thi / Bài tập:
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="VD: Kiểm tra giữa kỳ Học máy / Nộp báo cáo tiến độ NCKH NLP..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Hạn chót / Ngày thi:
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Mức độ ưu tiên:
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 font-bold"
                  >
                    <option value="high">🔴 Quan trọng cao</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="low">🟢 Bình thường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Chi tiết / Nội dung ôn tập / Phòng thi:
                </label>
                <textarea
                  rows={2}
                  value={newTaskDetails}
                  onChange={(e) => setNewTaskDetails(e.target.value)}
                  placeholder="Ghi chú chương cần ôn, link nộp bài, yêu cầu của thầy cô..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vào Danh sách Kỳ 5</span>
              </button>
            </form>
          </div>

          {/* Right 7 cols: Interactive Checklist of Exams, Assignments & NLP Tasks */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-sky-600" />
                  Danh Sách Lịch Thi, Bài Tập & Việc Cần Làm Kỳ 5 ({filteredTasks.length})
                </h3>
              </div>

              {/* Filter by Course */}
              <select
                value={taskCourseFilter}
                onChange={(e) => setTaskCourseFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700"
              >
                <option value="all">Tất cả môn & NCKH</option>
                <option value="NCKH_NLP">🧠 NCKH NLP</option>
                {inProgressCourses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name_vi}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'exam', label: '🔥 Lịch thi' },
                  { id: 'assignment', label: '📝 Bài tập' },
                  { id: 'project', label: '💻 Đồ án' },
                  { id: 'nlp_research', label: '🧠 NCKH NLP' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    taskFilter === tab.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredTasks.map((task) => {
                const catInfo = CATEGORY_META[task.category] || CATEGORY_META.note;
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      task.completed
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-65'
                        : task.priority === 'high'
                        ? 'bg-sky-50/40 dark:bg-slate-800/80 border-sky-200 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-sky-600 hover:text-emerald-600 shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-900 dark:bg-sky-600 text-white">
                            {task.course_code === 'NCKH_NLP' ? 'NCKH NLP' : task.course_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${catInfo.badgeClass}`}
                          >
                            {catInfo.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            📅 Hạn: {task.due_date}
                          </span>
                          {task.priority === 'high' && !task.completed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                              Ưu tiên cao
                            </span>
                          )}
                        </div>

                        <div
                          className={`text-xs sm:text-sm font-extrabold ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </div>

                        {task.details && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                            {task.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: SCIENTIFIC RESEARCH IN NLP (NCKH NLP) WORKSPACE */}
      {(activeView === 'overview_all' || activeView === 'nlp_research') && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/90 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-2xl p-5 border-2 border-indigo-200 dark:border-indigo-900/70 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Không Gian Nghiên Cứu Khoa Học (NCKH): Xử Lý Ngôn Ngữ Tự Nhiên (NLP)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white">
                    Kỳ 5 Đang Thực Hiện
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Kết hợp trực tiếp với môn Học máy (MAT3533) & Trí tuệ nhân tạo (MAT1206E) đang học và mở đường cho môn NLP (MAT3561E) + Khóa luận tốt nghiệp (MAT4080)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 cols: Topic Info, Models, Papers & Quick Research Notes */}
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-indigo-900 dark:text-indigo-300 block mb-1">
                  🎯 Tên Đề tài / Hướng nghiên cứu NLP của Huân:
                </label>
                <input
                  type="text"
                  value={nlpResearch.topic_title}
                  onChange={(e) =>
                    onUpdateNlpResearch({ ...nlpResearch, topic_title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    👨‍🏫 Giảng viên hướng dẫn / Nhóm Lab:
                  </label>
                  <input
                    type="text"
                    value={nlpResearch.advisor_name}
                    onChange={(e) =>
                      onUpdateNlpResearch({ ...nlpResearch, advisor_name: e.target.value })
                    }
                    placeholder="Nhập tên thầy/cô hướng dẫn NCKH..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🛠️ Bộ dữ liệu (Dataset) & Mô hình (Models):
                  </label>
                  <input
                    type="text"
                    value={nlpResearch.datasets_and_models}
                    onChange={(e) =>
                      onUpdateNlpResearch({
                        ...nlpResearch,
                        datasets_and_models: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  📝 Sổ tay Ghi chú Thực nghiệm, Ý tưởng & Kết quả chạy mô hình NLP:
                </label>
                <textarea
                  rows={4}
                  value={nlpResearch.quick_notes}
                  onChange={(e) =>
                    onUpdateNlpResearch({ ...nlpResearch, quick_notes: e.target.value })
                  }
                  placeholder="Ghi lại ý tưởng kiến trúc, tham số huấn luyện, F1/BLEU score, nhận xét của thầy cô hướng dẫn..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 leading-relaxed"
                />
              </div>

              {/* Paper Reading List */}
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-slate-700 space-y-2">
                <div className="font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Danh sách Bài báo Khoa học (Papers) & Tài liệu NLP đang đọc:</span>
                </div>

                <div className="space-y-1.5">
                  {(nlpResearch.paper_links || []).map((paper, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50/60 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        📄 {paper}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePaperLink(idx)}
                        className="text-slate-400 hover:text-rose-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddPaperLink} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPaperInput}
                    onChange={(e) => setNewPaperInput(e.target.value)}
                    placeholder="Thêm tên bài báo hoặc link ArXiv / ACL Anthology..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
                  >
                    + Thêm Paper
                  </button>
                </form>
              </div>
            </div>

            {/* Right 6 cols: 4-Stage NLP Research Roadmap Milestones */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <span>🚀 Lộ trình 4 Giai đoạn Nghiên cứu Khoa học NLP (Bấm vào trạng thái để đổi):</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Liên kết trực tiếp MAT3533 ➔ MAT3561E ➔ MAT4080
                </span>
              </div>

              <div className="space-y-2.5">
                {(nlpResearch.milestones || []).map((ms) => {
                  const statusStyle =
                    ms.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : ms.status === 'in_progress'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
                  const statusLabel =
                    ms.status === 'completed'
                      ? '✓ Đã hoàn thành'
                      : ms.status === 'in_progress'
                      ? '🔥 Đang thực hiện'
                      : '⏳ Sắp tới';

                  return (
                    <div
                      key={ms.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-200/80 dark:border-slate-700 shadow-sm space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                          {ms.phase} • {ms.target_date}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCycleMilestoneStatus(ms.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-all ${statusStyle}`}
                        >
                          {statusLabel}
                        </button>
                      </div>

                      <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {ms.title}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-snug">{ms.notes}</p>

                      {ms.deliverable && (
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 pt-0.5">
                          🎁 Sản phẩm đầu ra: {ms.deliverable}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: 6 CURRENT SEMESTER COURSES NOTEBOOK & FULL-WIDTH TIMETABLE */}
      {(activeView === 'overview_all' || activeView === 'timetable_courses') && (
        <div className="space-y-4">
          {/* 6 Course Notebook Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-sky-600" />
                  Sổ Tay Ghi Chú Trực Tiếp 6 Môn Đang Học Kỳ 5 (16 Tín Chỉ)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ghi chú giảng viên, lịch kiểm tra, nhóm bài tập lớn hoặc bấm "Nhập điểm" ngay khi môn học có điểm tổng kết
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {inProgressCourses.map((c) => {
                const diff = getCourseDifficulty(c.code);
                const cat = getCourseCategoryMeta(c);
                return (
                  <div
                    key={c.code}
                    className="p-4 rounded-2xl bg-sky-50/50 dark:bg-slate-800/70 border border-sky-200/90 dark:border-slate-700 flex flex-col justify-between space-y-3 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono font-extrabold px-2 py-0.5 rounded-md bg-sky-600 text-white">
                          {c.code} ({c.credits} TC)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cat.badgeBg}`}
                        >
                          {cat.shortBadge}
                        </span>
                      </div>

                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {c.name_vi}
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          Độ khó: {'★'.repeat(Math.round(diff.stars))} ({diff.stars}/5 sao)
                        </span>
                        <span className="text-slate-500 font-semibold truncate max-w-[150px]">
                          {c.schedule_info}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-slate-700">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                          📌 Ghi chú học tập / Lịch thi / Bài tập lớn:
                        </label>
                        <input
                          type="text"
                          value={c.note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { note: e.target.value })
                          }
                          placeholder="Ghi chú lịch thi, bài tập..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                          👨‍🏫 Giảng viên giảng dạy & Lưu ý trên lớp:
                        </label>
                        <input
                          type="text"
                          value={c.teacher_note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { teacher_note: e.target.value })
                          }
                          placeholder="VD: Thầy/Cô..., cách tính điểm chuyên cần/giữa kỳ..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-medium"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCourseFullState(c.code, {
                              completed: true,
                              in_progress: false,
                              semester: 5,
                              score10: 8.7,
                              letter: 'A',
                              score4: 3.7,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px]"
                        >
                          ✓ Đã có điểm (Chuyển sang Đã học)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full-Width Weekly Timetable */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  Thời Khóa Biểu Tuần Kỳ 5 Của Phạm Ngọc Huân (Tiết 1 ➔ Tiết 12)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hiển thị rõ ràng từng phòng học (202T5, 101T5, 302T5, 506T4, 513T4, 102T5), giờ học và ca Thực hành / Online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSessionModal((v) => !v)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ca học mới</span>
              </button>
            </div>

            {showAddSessionModal && (
              <form
                onSubmit={handleAddTimetableSession}
                className="mb-4 p-4 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-xs"
              >
                <input
                  type="text"
                  value={newSessCourseCode}
                  onChange={(e) => setNewSessCourseCode(e.target.value)}
                  placeholder="Mã môn (MAT3533)"
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-bold"
                />
                <input
                  type="text"
                  value={newSessClassCode}
                  onChange={(e) => setNewSessClassCode(e.target.value)}
                  placeholder="Mã lớp (MAT3533 2)"
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={newSessName}
                  onChange={(e) => setNewSessName(e.target.value)}
                  placeholder="Tên hiển thị (Học máy)"
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-bold"
                />
                <select
                  value={newSessDay}
                  onChange={(e) => setNewSessDay(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-bold"
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
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 text-center font-bold"
                    title="Tiết bắt đầu"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newSessEnd}
                    onChange={(e) => setNewSessEnd(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 text-center font-bold"
                    title="Tiết kết thúc"
                  />
                </div>
                <input
                  type="text"
                  value={newSessRoom}
                  onChange={(e) => setNewSessRoom(e.target.value)}
                  placeholder="Phòng (102T5)"
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                >
                  Lưu ca học
                </button>
              </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-emerald-300 dark:border-slate-700">
              <table className="w-full min-w-[920px] table-fixed border-collapse text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <th className="w-[56px] py-2.5 px-2 border border-emerald-500/40 text-center font-extrabold">
                      Tiết
                    </th>
                    <th className="w-[112px] py-2.5 px-2 border border-emerald-500/40 text-center font-extrabold">
                      Thời gian
                    </th>
                    {DAYS_OF_WEEK.map((d) => (
                      <th
                        key={d.day}
                        className="py-2.5 px-2 border border-emerald-500/40 text-center font-extrabold"
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
                      timetable.find(
                        (s) => s.day_of_week === day && s.start_period === period
                      );

                    return (
                      <React.Fragment key={period}>
                        {period === 7 && (
                          <tr className="bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-extrabold">
                            <td className="py-1.5 px-2 border border-emerald-200 dark:border-slate-700 text-center">
                              Trưa
                            </td>
                            <td className="py-1.5 px-2 border border-emerald-200 dark:border-slate-700 text-center">
                              12h30 - 13h00
                            </td>
                            <td
                              colSpan={6}
                              className="py-1.5 px-3 border border-emerald-200 dark:border-slate-700 text-center tracking-wider uppercase text-[11px]"
                            >
                              🍱 Nghỉ ăn trưa & Chuyển ca chiều
                            </td>
                          </tr>
                        )}

                        <tr className="h-[46px]">
                          <td className="border border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-slate-800/80 text-center font-extrabold text-slate-700 dark:text-slate-200">
                            {period}
                          </td>
                          <td className="border border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-slate-800/50 text-center font-semibold text-[11px] text-slate-600 dark:text-slate-300">
                            {PERIOD_TIMES[period]}
                          </td>

                          {DAYS_OF_WEEK.map((d) => {
                            if (isSkippedByRowSpan(d.day)) return null;
                            const sess = findStartingSession(d.day);
                            if (!sess) {
                              return (
                                <td
                                  key={d.day}
                                  className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                                />
                              );
                            }

                            const span = Math.max(1, sess.end_period - sess.start_period + 1);
                            const palette = COURSE_TIMETABLE_STYLES[sess.course_code] || {
                              bg: 'bg-sky-500',
                              border: 'border-sky-600',
                              text: 'text-white',
                              pill: 'bg-white/20 text-white',
                            };

                            return (
                              <td
                                key={d.day}
                                rowSpan={span}
                                className="p-1 border border-slate-200 dark:border-slate-800 align-stretch"
                              >
                                <div
                                  className={`h-full w-full rounded-xl p-2 border ${palette.bg} ${palette.border} ${palette.text} shadow-sm flex flex-col justify-between relative group`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTimetableSession(sess.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 w-5 h-5 rounded-full bg-black/25 hover:bg-rose-600 text-white flex items-center justify-center text-[10px]"
                                    title="Xóa ca học này"
                                  >
                                    ×
                                  </button>

                                  <div>
                                    <div className="font-extrabold text-xs leading-snug break-words pr-4">
                                      {sess.course_name}
                                    </div>
                                    <div className="text-[10px] font-mono font-bold opacity-90 mt-0.5">
                                      {sess.class_code}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-1 mt-1.5 pt-1 border-t border-current/15 text-[10px] font-bold">
                                    <span className={`px-1.5 py-0.5 rounded ${palette.pill}`}>
                                      📍 {sess.room}
                                    </span>
                                    <span>
                                      Tiết {sess.start_period}-{sess.end_period}
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
        </div>
      )}
    </div>
  );
};
