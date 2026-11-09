import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  BarChart3,
  Compass,
  Calculator,
  Bot,
  GraduationCap,
  Sun,
  Moon,
  Upload,
  Download,
  RotateCcw,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
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

type ActiveModule =
  | 'skill_tree'
  | 'current_semester'
  | 'simulator'
  | 'dashboard'
  | 'career'
  | 'ai_advisor';

export function App() {
  const [db, setDb] = useState<AcademicDatabase | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [aiConfig, setAiConfig] = useState<{
    default_base_url: string;
    default_model: string;
    default_gemini_key?: string;
  }>({
    default_base_url: 'https://agentrouter.org/v1',
    default_model: 'gemini-3.5-flash-lite',
    default_gemini_key: '',
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
      const data = await res.json();
      setDb(data.database);
      setProgress(data.user_progress);
      if (data.ai_config) {
        setAiConfig(data.ai_config);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const syncProgressToServer = async (nextProgress: UserProgress) => {
    setProgress(nextProgress);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProgress),
      });
    } catch (e) {
      console.error('Sync progress error:', e);
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
        ? `✅ Đã lưu điểm hoàn thành môn ${code} (${baseCourse?.name_vi})!`
        : `↩️ Đã chuyển trạng thái môn ${code}`
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
    partialState: Partial<CourseUserState>
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
    showToast(`💾 Đã lưu cập nhật học phần ${code} lâu dài!`);
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
    showToast('📅 Đã lưu Thời khóa biểu Kỳ 5 thành công!');
  };

  const handleUpdateSemester5Tasks = (nextTasks: SemesterTaskItem[]) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      semester5_tasks: nextTasks,
    });
    showToast('✅ Đã cập nhật danh sách Lịch thi & Bài tập Kỳ 5!');
  };

  const handleUpdateNlpResearch = (nextResearch: NLPResearchWorkspaceData) => {
    if (!progress) return;
    syncProgressToServer({
      ...progress,
      nlp_research: nextResearch,
    });
  };

  const handleAddCustomMemory = async (topic: string, courseCode: string, content: string) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, course_code: courseCode, content }),
      });
      const data = await res.json();
      if (data.user_progress) {
        setProgress(data.user_progress);
      }
      showToast('🧠 Đã nạp kiến thức mới vào Bộ nhớ Cố vấn AI!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (progress && data.custom_memories) {
        setProgress({
          ...progress,
          custom_memories: data.custom_memories,
        });
      }
      showToast('🗑️ Đã xóa ghi chú khỏi bộ nhớ!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetGroundTruth = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      setDb(data.database);
      setProgress(data.user_progress);
      showToast('🔄 Đã khôi phục dữ liệu gốc 23 môn + Lịch Kỳ 5 chuẩn!');
    } catch (e) {
      console.error(e);
    }
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
      showToast(`📥 Đã đồng bộ thành công ${data.imported_courses_count} môn học từ file Excel!`);
    } catch (err) {
      showToast('⚠️ Lỗi khi đọc file Excel.');
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
    showToast('📄 Đã xuất file Báo cáo lộ trình học tập thành công!');
  };

  if (!db || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="text-base font-extrabold text-slate-800 dark:text-white">
            Đang khởi tạo HUS CIS Academic Navigator & AI Advisor...
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }> = [
    {
      id: 'skill_tree',
      label: 'Cây Môn Học',
      icon: Network,
    },
    {
      id: 'current_semester',
      label: 'Kỳ 5 Đang Học & NCKH NLP',
      icon: Flame,
      badge: '16 TC + NLP',
    },
    {
      id: 'simulator',
      label: 'Lộ Trình Kỳ 6-8 & CPA',
      icon: Clock,
      badge: '0-5 Sao',
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Bảng Điểm',
      icon: BarChart3,
      badge: `${overallMetrics.totalCompletedCredits}/129 TC`,
    },
    {
      id: 'career',
      label: 'Định Hướng Nghề Nghiệp',
      icon: Compass,
    },
    {
      id: 'ai_advisor',
      label: 'Cố Vấn Học Tập AI',
      icon: Bot,
      badge: 'Gemini AI',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      {toast && (
        <div className="fixed bottom-14 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-sky-600 text-white text-xs font-bold shadow-xl border border-sky-400/40 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ULTRA-CLEAN COMPACT HEADER (Single Unified App Bar like Notion / Duolingo / Linear) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-sky-200/80 dark:border-slate-800 shadow-sm">
        <div className="max-w-[1460px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Compact Brand + Student Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  HUS CIS NAVIGATOR
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Phạm Ngọc Huân
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                KHMT & Thông tin (7480113QTD) • CPA: <strong className="text-sky-600">{overallMetrics.cpa4.toFixed(2)}</strong> ({overallMetrics.cpa10.toFixed(2)}) • Đã học: <strong className="text-emerald-600">{overallMetrics.totalCompletedCredits} TC</strong> • Kỳ 5: <strong className="text-amber-600">{overallMetrics.inProgressCredits} TC</strong>
              </div>
            </div>
          </div>

          {/* Center: Clean Segmented Module Switcher */}
          <nav className="flex items-center gap-1 bg-sky-50/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-sky-200/70 dark:border-slate-700 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-white text-sky-700'
                          : 'bg-sky-100 dark:bg-slate-700 text-sky-700 dark:text-sky-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Compact Action Icons */}
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
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700 flex items-center gap-1"
              title="Nhập file Excel bảng điểm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportAcademicReport}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1 shadow-sm"
              title="Xuất báo cáo tiến độ học tập"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Báo cáo</span>
            </button>

            <button
              type="button"
              onClick={handleResetGroundTruth}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title="Khôi phục dữ liệu gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-1.5 rounded-xl bg-sky-100/80 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700"
              title="Chuyển giao diện Sáng / Tối"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1460px] w-full mx-auto px-4 py-3.5">
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

      {/* Compact Footer */}
      <footer className="mt-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-sky-200/80 dark:border-slate-800 py-2.5 px-4">
        <div className="max-w-[1460px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="font-extrabold text-sky-700 dark:text-sky-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Nhà sáng tạo: Phạm Ngọc Huân - HUS Computer & Information Science</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Ngành Khoa học máy tính và thông tin (7480113QTD) • Quyết định 3568/QĐ-ĐHKHTN
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
