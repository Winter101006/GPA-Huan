import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  BarChart3,
  Compass,
  Bot,
  GraduationCap,
  Sun,
  Moon,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  CalendarRange,
  NotebookPen,
} from 'lucide-react';
import {
  AcademicDatabase,
  UserProgress,
  CourseUserState,
  TimetableSession,
  SemesterTaskItem,
  NLPResearchWorkspaceData,
} from './types/academic';
import { getMergedCourses, computeOverallMetrics, score10ToGrade } from './utils/academicMath';
import { SkillTreeGraph } from './components/SkillTreeGraph';
import { DegreeAuditDashboard } from './components/DegreeAuditDashboard';
import { CareerCompass } from './components/CareerCompass';
import { CPASimulatorPlanner } from './components/CPASimulatorPlanner';
import { AIAdvisorPanel } from './components/AIAdvisorPanel';
import { CurrentSemesterHub } from './components/CurrentSemesterHub';
import {
  DEFAULT_DATABASE,
  DEFAULT_PROGRESS,
  loadStoredProgress,
  saveStoredProgress,
  LOCAL_STORAGE_KEY,
} from './data/defaultData';

type ActiveModule =
  | 'skill_tree'
  | 'current_semester'
  | 'simulator'
  | 'dashboard'
  | 'career'
  | 'ai_advisor';

export function App() {
  const [db, setDb] = useState<AcademicDatabase>(DEFAULT_DATABASE);
  const [progress, setProgress] = useState<UserProgress>(loadStoredProgress);
  const [aiConfig, setAiConfig] = useState<{
    default_base_url: string;
    default_model: string;
    default_gemini_key?: string;
  }>({
    default_base_url: import.meta.env.VITE_AI_BASE_URL || 'https://agentrouter.org/v1',
    default_model: import.meta.env.VITE_AI_MODEL || 'gemini-3.5-flash-lite',
    default_gemini_key: import.meta.env.VITE_GEMINI_API_KEY || '',
  });
  const [activeTab, setActiveTab] = useState<ActiveModule>('skill_tree');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.database) setDb(data.database);
        const hasLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!hasLocal && data.user_progress) {
          setProgress(data.user_progress);
          saveStoredProgress(data.user_progress);
        }
        if (data.ai_config) {
          setAiConfig((prev) => ({
            ...prev,
            ...data.ai_config,
          }));
        }
      }
    } catch {
      // Standalone mode / offline: defaults and localStorage already active
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const syncProgressToServer = async (nextProgress: UserProgress) => {
    setProgress(nextProgress);
    saveStoredProgress(nextProgress);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProgress),
      });
    } catch {
      // Standalone mode: localStorage is already saved
    }
  };

  const mergedCourses = useMemo(() => {
    if (!db || !progress) return [];
    return getMergedCourses(db.courses, progress.courses_state);
  }, [db, progress]);

  const overallMetrics = useMemo(() => {
    return computeOverallMetrics(mergedCourses);
  }, [mergedCourses]);

  const handleToggleCourseCompleted = (
    code: string,
    completed: boolean,
    defaultScore10 = 8.7
  ) => {
    if (!progress || !db) return;
    const baseCourse = db.courses.find((c) => c.code === code);
    const prev = progress.courses_state[code] || {
      completed: false,
      in_progress: false,
      score10: null,
      letter: null,
      score4: null,
      semester: baseCourse?.recommended_semester || 5,
      planned_semester: baseCourse?.recommended_semester || 5,
    };

    const s10 = completed ? (prev.score10 ?? baseCourse?.score10 ?? defaultScore10) : prev.score10;
    const gradeInfo = s10 !== null ? score10ToGrade(s10) : { letter: 'A', score4: 3.7 };

    const nextCoursesState: Record<string, CourseUserState> = {
      ...progress.courses_state,
      [code]: {
        ...prev,
        completed,
        in_progress: completed ? false : prev.in_progress,
        score10: completed ? s10 : prev.score10,
        letter: completed ? gradeInfo.letter : prev.letter,
        score4: completed ? gradeInfo.score4 : prev.score4,
      },
    };

    syncProgressToServer({
      ...progress,
      courses_state: nextCoursesState,
    });
    showToast(
      completed
        ? `Đã lưu điểm hoàn thành môn ${code} (${baseCourse?.name_vi})`
        : `Đã cập nhật trạng thái môn ${code}`
    );
  };

  const handleUpdateCourseScore = (code: string, score10: number) => {
    if (!progress) return;
    const prev = progress.courses_state[code];
    if (!prev) return;
    const { letter, score4 } = score10ToGrade(score10);
    syncProgressToServer({
      ...progress,
      courses_state: {
        ...progress.courses_state,
        [code]: {
          ...prev,
          score10,
          letter,
          score4,
        },
      },
    });
  };

  const handleUpdateCourseFullState = (
    code: string,
    partialState: Partial<CourseUserState>,
    silent = false
  ) => {
    if (!progress || !db) return;
    const baseCourse = db.courses.find((c) => c.code === code);
    const prev = progress.courses_state[code] || {
      completed: false,
      in_progress: false,
      score10: null,
      letter: null,
      score4: null,
      semester: baseCourse?.recommended_semester || 5,
      planned_semester: baseCourse?.recommended_semester || 5,
    };

    const merged: CourseUserState = {
      ...prev,
      ...partialState,
    };

    if (merged.completed && merged.score10 !== null) {
      const g = score10ToGrade(merged.score10);
      merged.letter = g.letter;
      merged.score4 = g.score4;
    }

    syncProgressToServer({
      ...progress,
      courses_state: {
        ...progress.courses_state,
        [code]: merged,
      },
    });
    if (!silent) {
      showToast(`Đã lưu cập nhật học phần ${code}`);
    }
  };

  const handleToggleConditional = (code: string) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      conditional_checklist: {
        ...progress.conditional_checklist,
        [code]: !progress.conditional_checklist[code],
      },
    });
  };

  const handleToggleInterest = (interestId: string) => {
    if (!progress) return;
    const exists = progress.selected_interests.includes(interestId);
    const nextInterests = exists
      ? progress.selected_interests.filter((id) => id !== interestId)
      : [...progress.selected_interests, interestId];
    syncProgressToServer({
      ...progress,
      selected_interests: nextInterests,
    });
  };

  const handleChangeTargetCpa = (val: number) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      target_cpa: val,
    });
  };

  const handleUpdateRetakePlan = (plan: Record<string, string>) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      retake_plan: plan,
    });
  };

  const handleUpdatePlannedSemester = (code: string, sem: number) => {
    handleUpdateCourseFullState(code, { planned_semester: sem });
  };

  const handleUpdateTimetable = (nextTimetable: TimetableSession[]) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      semester5_timetable: nextTimetable,
    });
    showToast('Đã lưu thời khóa biểu Kỳ 5');
  };

  const handleUpdateSemester5Tasks = (nextTasks: SemesterTaskItem[]) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      semester5_tasks: nextTasks,
    });
  };

  const handleUpdateNlpResearch = (nextResearch: NLPResearchWorkspaceData) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      nlp_research: nextResearch,
    });
  };

  const handleAddCustomMemory = async (topic: string, courseCode: string, content: string) => {
    const newMem = {
      id: `mem-${Date.now()}`,
      topic: topic.trim() || `Ghi chú học phần ${courseCode || 'CHUNG'}`,
      course_code: courseCode || 'CHUNG',
      content: content.trim(),
      created_at: new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const nextMemories = [newMem, ...(progress.custom_memories || [])];
    const nextProgress: UserProgress = {
      ...progress,
      custom_memories: nextMemories,
    };
    syncProgressToServer(nextProgress);
    showToast('Đã nạp ghi chú vào bộ nhớ cố vấn');
  };

  const handleDeleteCustomMemory = async (id: string) => {
    const nextMemories = (progress.custom_memories || []).filter((m) => m.id !== id);
    const nextProgress: UserProgress = {
      ...progress,
      custom_memories: nextMemories,
    };
    syncProgressToServer(nextProgress);
    showToast('Đã xóa ghi chú khỏi bộ nhớ');
  };

  const handleResetGroundTruth = async () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDb(DEFAULT_DATABASE);
      setProgress(DEFAULT_PROGRESS);
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // offline / standalone
    }
    showToast('Đã khôi phục dữ liệu gốc chuẩn QĐ 3568');
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      setProgress(data.user_progress);
      showToast(`Đã đồng bộ ${data.imported_courses_count} học phần từ Excel`);
    } catch (err) {
      showToast('Không đọc được tệp Excel');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportAcademicReport = () => {
    if (!db || !progress) return;
    const completedList = mergedCourses.filter((c) => c.completed && c.counts_gpa);
    const inProgressList = mergedCourses.filter((c) => c.in_progress && !c.completed);

    const lines = [
      'BÁO CÁO TIẾN ĐỘ ĐÀO TẠO & LỘ TRÌNH HỌC TẬP CÁ NHÂN',
      `Sinh viên: ${db.student_profile.full_name}`,
      `Ngành đào tạo: ${db.student_profile.major_name} (${db.student_profile.major_code})`,
      `Đơn vị: ${db.student_profile.university}`,
      `Chương trình chuẩn: ${db.student_profile.decision}`,
      `Tín chỉ đã tích lũy: ${overallMetrics.totalCompletedCredits} / 129 TC (${overallMetrics.completionPct}%)`,
      `Đang học tại Kỳ 5: ${overallMetrics.inProgressCredits} TC (${overallMetrics.inProgressCount} môn)`,
      `CPA Hệ 4: ${overallMetrics.cpa4.toFixed(2)} (Chính xác: ${overallMetrics.cpa4Exact.toFixed(4)}) - Xếp loại: ${overallMetrics.academicRank}`,
      `CPA Hệ 10: ${overallMetrics.cpa10.toFixed(2)} (Chính xác: ${overallMetrics.cpa10Exact.toFixed(4)})`,
      '',
      '1. DANH SÁCH HỌC PHẦN ĐÃ HOÀN THÀNH (KỲ 1 -> KỲ 4)',
      ...completedList.map(
        (c, idx) =>
          `${idx + 1}. ${c.code} - ${c.name_vi} (${c.credits} TC, Kỳ ${c.semester}): Điểm 10: ${c.score10} | Điểm chữ: ${c.letter} | Hệ 4: ${c.score4}`
      ),
      '',
      '2. DANH SÁCH HỌC PHẦN ĐANG HỌC TẠI KỲ 5 (16 TÍN CHỈ)',
      ...inProgressList.map(
        (c, idx) =>
          `${idx + 1}. ${c.code} - ${c.name_vi} (${c.credits} TC) | Lịch: ${c.schedule_info || ''} | Ghi chú: ${c.note || ''}`
      ),
      '',
      'Nhà sáng tạo: Phạm Ngọc Huân - HUS Computer & Information Science',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Hoc_Tap_Pham_Ngoc_Huan_HUS_CIS.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp báo cáo học tập');
  };

  if (!db || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center mx-auto">
            <GraduationCap className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Đang tải dữ liệu học phần HUS CIS
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
  }> = [
    {
      id: 'skill_tree',
      label: 'Cây môn học',
      icon: Network,
    },
    {
      id: 'current_semester',
      label: 'Sổ tay Kỳ 5',
      icon: NotebookPen,
    },
    {
      id: 'simulator',
      label: 'Lộ trình & CPA',
      icon: CalendarRange,
    },
    {
      id: 'dashboard',
      label: 'Bảng điểm',
      icon: BarChart3,
    },
    {
      id: 'career',
      label: 'Định hướng',
      icon: Compass,
    },
    {
      id: 'ai_advisor',
      label: 'Cố vấn AI',
      icon: Bot,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {toast && (
        <div className="fixed bottom-14 right-6 z-50 px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-medium shadow-md border border-zinc-800/10 dark:border-zinc-200/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" strokeWidth={1.5} />
          <span>{toast}</span>
        </div>
      )}

      {/* Quiet Academic Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-auto min-h-[60px] py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Wordmark + Monospace Student Meta */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  HUS CIS Navigator
                </span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  7480113QTD
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:flex items-center gap-2 tabular-nums">
                <span>Phạm Ngọc Huân</span>
                <span aria-hidden="true">·</span>
                <span>
                  CPA <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{overallMetrics.cpa4.toFixed(2)}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  {overallMetrics.totalCompletedCredits}/129 TC
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Navigation */}
          <nav className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact Utility Actions */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              onChange={handleExcelFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-2.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors duration-150"
              title="Nhập bảng điểm Excel"
            >
              <Upload className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              <span className="hidden md:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportAcademicReport}
              className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center gap-1.5 transition-colors duration-150"
              title="Xuất báo cáo tiến độ"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden md:inline">Xuất báo cáo</span>
            </button>

            <button
              type="button"
              onClick={handleResetGroundTruth}
              className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors duration-150"
              title="Khôi phục dữ liệu gốc"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors duration-150"
              title="Chuyển giao diện Sáng / Tối"
            >
              {darkMode ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'skill_tree' && (
          <SkillTreeGraph
            courses={mergedCourses}
            knowledgeLinks={db.knowledge_links}
            onToggleCourseCompleted={handleToggleCourseCompleted}
            onUpdateCourseScore={handleUpdateCourseScore}
            onUpdateCourseFullState={handleUpdateCourseFullState}
          />
        )}

        {activeTab === 'current_semester' && (
          <CurrentSemesterHub
            courses={mergedCourses}
            coursesState={progress.courses_state}
            onUpdateCourseFullState={handleUpdateCourseFullState}
            timetable={progress.semester5_timetable || []}
            onUpdateTimetable={handleUpdateTimetable}
            tasks={progress.semester5_tasks || []}
            onUpdateTasks={handleUpdateSemester5Tasks}
            nlpResearch={
              progress.nlp_research || {
                topic_title:
                  'Nghiên cứu Mô hình Ngôn ngữ Lớn (LLM) / RAG & Xử lý Ngôn ngữ Tự nhiên Tiếng Việt',
                advisor_name: 'Giảng viên hướng dẫn Khoa Toán - Cơ - Tin học (HUS)',
                research_goal:
                  'Xây dựng mô hình NLP thực nghiệm kết hợp Học máy (MAT3533) và Trí tuệ nhân tạo (MAT1206E), hướng tới công bố bài báo Hội nghị SV NCKH và Khóa luận tốt nghiệp MAT4080 đạt A+.',
                datasets_and_models:
                  'PhoBERT / ViT5 / Llama-3-Vi, PyTorch, HuggingFace, LangChain, VectorDB',
                paper_links: [
                  'Attention Is All You Need (Vaswani et al.)',
                  'PhoBERT: Pre-trained language models for Vietnamese',
                ],
                quick_notes:
                  '• Tận dụng lợi thế Xác suất thống kê (8.8 A), CSDL (8.5 A) và Tiếng Anh chuyên ngành (8.0 B+).',
                milestones: [],
              }
            }
            onUpdateNlpResearch={handleUpdateNlpResearch}
          />
        )}

        {activeTab === 'dashboard' && (
          <DegreeAuditDashboard
            courses={mergedCourses}
            metrics={overallMetrics}
            conditionalChecklist={progress.conditional_checklist}
            onToggleConditional={handleToggleConditional}
            onUpdateCourseScore={handleUpdateCourseScore}
            onUpdateCourseFullState={handleUpdateCourseFullState}
          />
        )}

        {activeTab === 'career' && (
          <CareerCompass
            courses={mergedCourses}
            radarCompetencies={overallMetrics.radarCompetencies}
            selectedInterests={progress.selected_interests}
            onToggleInterest={handleToggleInterest}
            ploDefinitions={db.plo_definitions}
            onToggleCourseCompleted={handleToggleCourseCompleted}
          />
        )}

        {activeTab === 'simulator' && (
          <CPASimulatorPlanner
            courses={mergedCourses}
            coursesState={progress.courses_state}
            targetCpa={progress.target_cpa}
            onChangeTargetCpa={handleChangeTargetCpa}
            retakePlan={progress.retake_plan}
            onUpdateRetakePlan={handleUpdateRetakePlan}
            onUpdatePlannedSemester={handleUpdatePlannedSemester}
            onUpdateCourseFullState={handleUpdateCourseFullState}
            timetable={progress.semester5_timetable || []}
            onUpdateTimetable={handleUpdateTimetable}
          />
        )}

        {activeTab === 'ai_advisor' && (
          <AIAdvisorPanel
            coursesState={progress.courses_state}
            customMemories={progress.custom_memories || []}
            onAddCustomMemory={handleAddCustomMemory}
            onDeleteCustomMemory={handleDeleteCustomMemory}
            defaultBaseUrl={aiConfig.default_base_url}
            defaultModel={aiConfig.default_model}
            defaultGeminiKey={aiConfig.default_gemini_key}
          />
        )}
      </main>

      {/* Quiet Hairline Footer */}
      <footer className="mt-auto bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 py-3 px-4 sm:px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.5} />
            <span>Nhà sáng tạo: Phạm Ngọc Huân - HUS Computer & Information Science</span>
          </div>
          <div>
            Ngành Khoa học máy tính và thông tin (7480113QTD) · Quyết định 3568/QĐ-ĐHKHTN
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
