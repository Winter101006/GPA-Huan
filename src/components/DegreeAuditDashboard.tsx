import React, { useState } from 'react';
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
  Sparkles,
  Table,
  BarChart3,
  PlusCircle,
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

  // Quick add/complete course form
  const [quickCourseCode, setQuickCourseCode] = useState<string>('MAT1206E');
  const [quickCourseSem, setQuickCourseSem] = useState<number>(5);
  const [quickCourseScore, setQuickCourseScore] = useState<string>('8.8');

  const gradeChartData = Object.entries(metrics.gradeCounts).map(([letter, count]) => ({
    letter,
    count,
    color: GRADE_COLORS[letter] || '#0284c7',
  }));

  const filteredTranscriptCourses = courses
    .filter((c) => c.counts_gpa)
    .filter((c) => {
      if (selectedSemTab === 'all') return c.completed || c.in_progress;
      if (selectedSemTab === 'in_progress') return c.in_progress && !c.completed;
      return c.completed && c.semester === selectedSemTab;
    })
    .sort((a, b) => a.semester - b.semester || b.credits - a.credits);

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
      {/* Row 1: 4 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              CPA Tích Lũy (Hệ 4)
            </span>
            <Award className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.cpa4.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / 4.00 ({metrics.cpa4Exact.toFixed(4)})
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Xếp loại: {metrics.academicRank} (Kỳ 4: 3.48)
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              CPA Tích Lũy (Hệ 10)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.cpa10.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / 10.0 ({metrics.cpa10Exact.toFixed(4)})
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            2 môn A+, 7 môn A, 6 môn B+
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Tiến Độ Tín Chỉ GPA
            </span>
            <BookCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.totalCompletedCredits}
              </span>
              <span className="text-xs font-bold text-slate-500"> / 129 TC ({metrics.completionPct}%)</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
              style={{ width: `${metrics.completionPct}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
              Đang Học Tại Kỳ 5
            </span>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{metrics.inProgressCredits || 16} TC</span>
            <span className="text-xs font-semibold text-amber-100">
              ({metrics.inProgressCount || 6} môn đang học)
            </span>
          </div>
          <div className="mt-1 text-xs text-amber-50 font-semibold">
            Xong Kỳ 5 đạt: {metrics.totalCompletedCredits + (metrics.inProgressCredits || 16)}/129 TC
          </div>
        </div>
      </div>

      {/* Sub-navigation bar so user never has to scroll up and down */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-2 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('overview_charts')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'overview_charts'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Biểu Đồ Xu Hướng GPA & Phân Phối Điểm Chữ</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('blocks_audit')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'blocks_audit'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Tiến Độ 5 Khối Kiến Thức & Học Phần Điều Kiện</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('transcript_editor')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              subTab === 'transcript_editor'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>3. Bảng Điểm Trực Tiếp & Cập Nhật Điểm Môn Mới</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CHARTS */}
      {subTab === 'overview_charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
                  Biểu đồ Xu hướng GPA & CPA qua các Học kỳ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kỳ 1 (3.31) ➔ Kỳ 2 (2.96) ➔ Kỳ 3 (3.30) ➔ Kỳ 4 (3.48 — Đà bứt phá mạnh mẽ!)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
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
                      border: '1px solid #bae6fd',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="gpa4"
                    name="GPA Từng Kỳ (Hệ 4)"
                    stroke="#0284c7"
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

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-600" />
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
                    contentStyle={{ borderRadius: '12px', border: '1px solid #bae6fd' }}
                  />
                  <Bar dataKey="count" name="Số môn học" radius={[8, 8, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              {gradeChartData.map((g) => (
                <div
                  key={g.letter}
                  className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs"
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
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                Kiểm toán Tiến độ 5 Khối Kiến Thức (Chuẩn QĐ 3568/QĐ-ĐHKHTN)
              </h3>
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
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
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-sky-50/40 dark:bg-slate-800/50 border-sky-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {blk.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                        }`}
                      >
                        {blk.completed} / {blk.required} TC ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full ${
                          isDone ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      📌 {blk.missingNote}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
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
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
            className="bg-sky-50/90 dark:bg-slate-900 rounded-2xl p-4 border border-sky-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-sky-800 dark:text-sky-300">
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Nhập nhanh điểm môn mới hoặc môn vừa có điểm (Lưu lâu dài):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={quickCourseCode}
                onChange={(e) => setQuickCourseCode(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-300 dark:border-slate-700 font-bold"
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
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-300 dark:border-slate-700 font-bold"
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
                className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-300 dark:border-slate-700 font-extrabold text-center"
              />

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm"
              >
                Lưu điểm vào Bảng điểm
              </button>
            </div>
          </form>

          {/* Transcript Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-sky-600" />
                Bảng Điểm & Trạng Thái Học Phần ({filteredTranscriptCourses.length} môn)
              </h3>

              <div className="flex flex-wrap items-center gap-1 bg-sky-50 dark:bg-slate-800 p-1 rounded-xl border border-sky-200 dark:border-slate-700">
                {(
                  [
                    { id: 'all', label: 'Tất cả (Đã học + Kỳ 5)' },
                    { id: 1, label: 'Kỳ 1' },
                    { id: 2, label: 'Kỳ 2' },
                    { id: 3, label: 'Kỳ 3' },
                    { id: 4, label: 'Kỳ 4' },
                    { id: 'in_progress', label: '🔥 Đang học Kỳ 5 (6)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={String(tab.id)}
                    onClick={() => setSelectedSemTab(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedSemTab === tab.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-sky-100/60'
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
                  <tr className="border-b border-sky-200 dark:border-slate-700 bg-sky-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
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
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-sky-700 dark:text-sky-400">
                        Kỳ {c.semester}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {c.code}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        {c.name_vi}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { note: e.target.value })
                          }
                          placeholder="Thêm ghi chú..."
                          className="w-full px-2 py-0.5 rounded border border-transparent hover:border-slate-200 focus:border-sky-400 bg-transparent text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-bold">{c.credits}</td>
                      <td className="py-2 px-3 text-center">
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
                            className="w-16 text-center py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                            Đang học K5
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
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
                      <td className="py-2 px-3 text-center font-extrabold">
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
