import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Award,
  TrendingUp,
  BookCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  GraduationCap,
  ShieldCheck,
  Table,
  BarChart3,
  PlusCircle,
  Search,
  Target,
  X,
} from 'lucide-react';
import { Course, SemesterStat, CourseUserState } from '../types/academic';
import { score10ToGrade } from '../utils/academicMath';

interface DegreeAuditDashboardProps {
  courses: Course[];
  metrics: {
    totalCompletedCredits: number;
    inProgressCredits?: number;
    inProgressCount?: number;
    remainingCredits: number;
    completionPct: number;
    completedCount: number;
    readyCount: number;
    lockedCount: number;
    cpa4: number;
    cpa4Exact: number;
    cpa10: number;
    cpa10Exact: number;
    academicRank: string;
    gradeCounts: Record<string, number>;
    semesterHistory: SemesterStat[];
    blockProgress: Array<{
      id: string;
      name: string;
      completed: number;
      rawCompleted: number;
      required: number;
      missingNote: string;
    }>;
  };
  conditionalChecklist: Record<string, boolean>;
  onToggleConditional: (code: string) => void;
  onUpdateCourseScore: (code: string, score10: number) => void;
  onUpdateCourseFullState: (code: string, partialState: Partial<CourseUserState>) => void;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#059669',
  'A': '#10b981',
  'B+': '#0284c7',
  'B': '#38bdf8',
  'C+': '#f59e0b',
  'C': '#d97706',
  'D+': '#f43f5e',
  'D': '#e11d48',
};

export const DegreeAuditDashboard: React.FC<DegreeAuditDashboardProps> = ({
  courses,
  metrics,
  conditionalChecklist,
  onToggleConditional,
  onUpdateCourseScore,
  onUpdateCourseFullState,
}) => {
  const [subTab, setSubTab] = useState<'overview_charts' | 'blocks_audit' | 'transcript_editor'>(
    'overview_charts'
  );
  const [selectedSemTab, setSelectedSemTab] = useState<number | 'all' | 'in_progress'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick add/complete course form
  const [quickCourseCode, setQuickCourseCode] = useState<string>('MAT1206E');
  const [quickCourseSem, setQuickCourseSem] = useState<number>(5);
  const [quickCourseScore, setQuickCourseScore] = useState<string>('8.8');

  const gradeChartData = Object.entries(metrics.gradeCounts).map(([letter, count]) => ({
    letter,
    count,
    color: GRADE_COLORS[letter] || '#0284c7',
  }));

  // Real-time Target Graduation Solver (129 total GPA credits)
  const targetForecast = useMemo(() => {
    const totalReq = 129;
    const doneCr = metrics.totalCompletedCredits;
    const remCr = Math.max(totalReq - doneCr, 0);
    const currentPoints = metrics.cpa4Exact * doneCr;

    const calcRequiredAvg = (targetCpa: number) => {
      if (remCr <= 0) return 0;
      const neededPoints = targetCpa * totalReq - currentPoints;
      return neededPoints / remCr;
    };

    return {
      remainingCredits: remCr,
      reqForDistinction: calcRequiredAvg(3.6),
      reqForHonors: calcRequiredAvg(3.2),
    };
  }, [metrics.totalCompletedCredits, metrics.cpa4Exact]);

  const filteredTranscriptCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses
      .filter((c) => c.counts_gpa)
      .filter((c) => {
        if (selectedSemTab === 'all') return c.completed || c.in_progress;
        if (selectedSemTab === 'in_progress') return c.in_progress && !c.completed;
        return c.completed && c.semester === selectedSemTab;
      })
      .filter((c) => {
        if (!q) return true;
        return (
          c.code.toLowerCase().includes(q) ||
          c.name_vi.toLowerCase().includes(q) ||
          (c.letter && c.letter.toLowerCase() === q) ||
          (c.note && c.note.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.semester - b.semester || b.credits - a.credits);
  }, [courses, selectedSemTab, searchQuery]);

  const conditionalCourses = courses.filter((c) => !c.counts_gpa);

  const handleQuickSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    const s10 = Math.min(Math.max(parseFloat(quickCourseScore) || 8.5, 0), 10);
    const { letter, score4 } = score10ToGrade(s10);
    onUpdateCourseFullState(quickCourseCode, {
      completed: true,
      in_progress: false,
      semester: quickCourseSem,
      planned_semester: quickCourseSem,
      score10: s10,
      letter,
      score4,
    });
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Symmetrical 4-Column Gemini KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CPA Hệ 4 (Blue/Indigo) */}
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/60 dark:from-slate-900 dark:to-indigo-950/30 rounded-2xl p-5 border border-blue-200/80 dark:border-indigo-500/25 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              CPA Tích Lũy (Hệ 4)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {metrics.cpa4.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-500">
              / 4.00 ({metrics.cpa4Exact.toFixed(4)})
            </span>
          </div>
          <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Xếp loại: {metrics.academicRank} · Kỳ 4 đạt 3.48
          </div>
        </div>

        {/* Card 2: CPA Hệ 10 (Purple/Violet) */}
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-purple-50/90 via-white to-pink-50/50 dark:from-slate-900 dark:to-purple-950/30 rounded-2xl p-5 border border-purple-200/80 dark:border-purple-500/25 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              CPA Tích Lũy (Hệ 10)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {metrics.cpa10.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-500">
              / 10.0 ({metrics.cpa10Exact.toFixed(4)})
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            2 môn A+, 7 môn A, 6 môn B+ ({metrics.completedCount} môn)
          </div>
        </div>

        {/* Card 3: Tiến Độ Tín Chỉ (Emerald/Cyan) */}
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/30 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-500/25 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Tiến Độ Tín Chỉ GPA
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <BookCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {metrics.totalCompletedCredits}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-500">
              / 129 TC ({metrics.completionPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full"
              style={{ width: `${metrics.completionPct}%` }}
            />
          </div>
        </div>

        {/* Card 4: Học kỳ 5 Hiện tại (Warm Amber/Rose Gradient) */}
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-5 shadow-md shadow-orange-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-50">
              Đang Học Tại Kỳ 5
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight">
              {metrics.inProgressCredits || 16} TC
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-amber-100">
              ({metrics.inProgressCount || 6} môn)
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-50">
            Xong Kỳ 5 đạt: {metrics.totalCompletedCredits + (metrics.inProgressCredits || 16)} / 129 TC
          </div>
        </div>
      </div>

      {/* Row 2: Real-Time Target CPA Solver Strip (Gemini Aurora Banner) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40 rounded-2xl px-5 py-3.5 border border-indigo-200/80 dark:border-indigo-500/25 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Mục tiêu điểm trung bình cho{' '}
            <strong className="font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
              {targetForecast.remainingCredits} TC
            </strong>{' '}
            còn lại (Kỳ 5 – Kỳ 8):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Bằng Xuất sắc (3.60):</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 font-mono font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              {targetForecast.reqForDistinction <= 4.0
                ? `${targetForecast.reqForDistinction.toFixed(2)} / 4.0`
                : '> 4.00 (Cần học cải thiện)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Bằng Giỏi (3.20):</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 font-mono font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30">
              {Math.max(targetForecast.reqForHonors, 2.0).toFixed(2)} / 4.0
            </span>
          </div>
        </div>
      </div>

      {/* Sub-navigation bar (Gemini Gradient Active Pill!) */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-2 border border-indigo-100/90 dark:border-indigo-500/20 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('overview_charts')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'overview_charts'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Biểu Đồ Xu Hướng GPA &amp; Phân Phối Điểm Chữ</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('blocks_audit')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'blocks_audit'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Tiến Độ 5 Khối Kiến Thức &amp; Học Phần Điều Kiện</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('transcript_editor')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'transcript_editor'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>3. Bảng Điểm Trực Tiếp &amp; Cập Nhật Điểm</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CHARTS */}
      {subTab === 'overview_charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Biểu đồ Xu hướng GPA &amp; CPA qua các Học kỳ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kỳ 1 (3.31) → Kỳ 2 (2.96) → Kỳ 3 (3.30) → Kỳ 4 (3.48)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl font-mono text-xs font-bold tabular-nums bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                +0.52 GPA từ Kỳ 2 lên Kỳ 4
              </span>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.semesterHistory}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorGpa4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorCpa4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[2.4, 4.0]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #c7d2fe',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="gpa4"
                    name="GPA Từng Kỳ (Hệ 4)"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGpa4)"
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpa4"
                    name="CPA Tích Lũy (Hệ 4)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    fillOpacity={1}
                    fill="url(#colorCpa4)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Phân phối Điểm chữ ({metrics.completedCount} môn đã có điểm)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A+ (2), A (7), B+ (6), B (3), C+ (3), C (1), D+ (1)
                </p>
              </div>

              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeChartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="letter" tick={{ fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} môn học`, 'Số lượng']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #c7d2fe' }}
                    />
                    <Bar dataKey="count" name="Số môn học" radius={[8, 8, 0, 0]}>
                      {gradeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              {gradeChartData.map((g) => (
                <div
                  key={g.letter}
                  className="px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 font-mono text-xs tabular-nums"
                >
                  <span className="font-extrabold" style={{ color: g.color }}>
                    {g.letter}:
                  </span>{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 5 BLOCKS AUDIT & CONDITIONAL CHECKLIST */}
      {subTab === 'blocks_audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Kiểm toán Tiến độ 5 Khối Kiến Thức (Chuẩn QĐ 3568/QĐ-ĐHKHTN)
              </h3>
              <span className="px-3 py-1 rounded-xl font-mono text-xs font-extrabold tabular-nums bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Đã xong: {metrics.totalCompletedCredits} / 129 TC
              </span>
            </div>

            <div className="space-y-3">
              {metrics.blockProgress.map((blk) => {
                const pct = Math.min(Math.round((blk.completed / blk.required) * 100), 100);
                const isDone = blk.completed >= blk.required;
                return (
                  <div
                    key={blk.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-indigo-50/30 dark:bg-slate-800/50 border-indigo-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {blk.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs font-extrabold tabular-nums px-2.5 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        }`}
                      >
                        {blk.completed} / {blk.required} TC ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full ${
                          isDone
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {blk.missingNote}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Checklist Học phần Điều kiện (15 TC ngoài GPA)
              </h3>
              <div className="space-y-2.5">
                {conditionalCourses.map((cc) => {
                  const checked = !!conditionalChecklist[cc.code];
                  return (
                    <label
                      key={cc.code}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleConditional(cc.code)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {cc.code} - {cc.name_vi}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cc.credits} tín chỉ điều kiện
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          checked
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {checked ? 'Đạt' : 'Chưa tích'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TRANSCRIPT TABLE & QUICK GRADE ENTRY */}
      {subTab === 'transcript_editor' && (
        <div className="space-y-4">
          {/* Quick Add/Update Course Score Bar */}
          <form
            onSubmit={handleQuickSaveScore}
            className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-sky-50/90 dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-800 dark:text-indigo-300">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Nhập nhanh điểm môn mới hoặc môn vừa có điểm:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={quickCourseCode}
                onChange={(e) => setQuickCourseCode(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-bold"
              >
                {courses
                  .filter((c) => c.counts_gpa)
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name_vi} ({c.credits} TC){' '}
                      {c.completed ? `[Đã có: ${c.score10}]` : c.in_progress ? '[Đang học K5]' : ''}
                    </option>
                  ))}
              </select>

              <select
                value={quickCourseSem}
                onChange={(e) => setQuickCourseSem(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Kỳ {s}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={quickCourseScore}
                onChange={(e) => setQuickCourseScore(e.target.value)}
                placeholder="Điểm 10"
                className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 font-mono font-extrabold tabular-nums text-center"
              />

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:brightness-105 text-white font-extrabold shadow-sm"
              >
                Lưu vào Bảng điểm
              </button>
            </div>
          </form>

          {/* Transcript Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-indigo-600" />
                  Bảng Điểm &amp; Trạng Thái Học Phần ({filteredTranscriptCourses.length} môn)
                </h3>

                <div className="relative w-56 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã môn, tên, điểm chữ..."
                    className="h-8 w-full pl-8 pr-7 rounded-xl border border-indigo-100 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-800 text-xs outline-none focus:border-indigo-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 bg-indigo-50/70 dark:bg-slate-800 p-1 rounded-xl border border-indigo-100 dark:border-slate-700">
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 1, label: 'Kỳ 1' },
                    { id: 2, label: 'Kỳ 2' },
                    { id: 3, label: 'Kỳ 3' },
                    { id: 4, label: 'Kỳ 4' },
                    { id: 'in_progress', label: 'Đang học Kỳ 5 (6)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={String(tab.id)}
                    onClick={() => setSelectedSemTab(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedSemTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-100/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-indigo-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-slate-800 text-indigo-800 dark:text-slate-300 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Học kỳ</th>
                    <th className="py-2.5 px-3">Mã HP</th>
                    <th className="py-2.5 px-3">Tên học phần</th>
                    <th className="py-2.5 px-3">Ghi chú cá nhân</th>
                    <th className="py-2.5 px-3 text-center">TC</th>
                    <th className="py-2.5 px-3 text-center">Điểm hệ 10</th>
                    <th className="py-2.5 px-3 text-center">Điểm chữ</th>
                    <th className="py-2.5 px-3 text-center">Hệ 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTranscriptCourses.map((c, idx) => (
                    <tr
                      key={c.code}
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        Kỳ {c.semester}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {c.code}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {c.name_vi}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={c.note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { note: e.target.value })
                          }
                          placeholder="Thêm ghi chú..."
                          className="w-full px-2 py-0.5 rounded border border-transparent hover:border-indigo-200 focus:border-indigo-400 bg-transparent text-xs outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold">{c.credits}</td>
                      <td className="py-2.5 px-3 text-center">
                        {c.completed ? (
                          <input
                            type="number"
                            step="0.1"
                            min="4.0"
                            max="10.0"
                            value={c.score10 ?? 8.5}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0 && val <= 10) {
                                onUpdateCourseScore(c.code, val);
                              }
                            }}
                            className="w-16 text-center py-0.5 px-1.5 rounded-lg border border-indigo-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-800 font-mono tabular-nums font-bold"
                          />
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                            Đang học K5
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {c.completed ? (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white"
                            style={{ backgroundColor: GRADE_COLORS[c.letter || 'A'] || '#0284c7' }}
                          >
                            {c.letter}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-extrabold">
                        {c.completed ? c.score4?.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
