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
  BarChart3,
  CheckCircle2,
  Circle,
  Layers,
  Plus,
  Table,
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

// Restrained chart hierarchy: Sky Blue accent on A/A+, neutral steps on B+/B/C, muted rose on D/D+
const GRADE_CHART_COLORS: Record<string, string> = {
  'A+': '#0284c7',
  A: '#0ea5e9',
  'B+': '#71717a',
  B: '#a1a1aa',
  'C+': '#d4d4d8',
  C: '#d4d4d8',
  'D+': '#dc2626',
  D: '#dc2626',
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

  const [quickCourseCode, setQuickCourseCode] = useState<string>('MAT1206E');
  const [quickCourseSem, setQuickCourseSem] = useState<number>(5);
  const [quickCourseScore, setQuickCourseScore] = useState<string>('8.8');

  const gradeChartData = Object.entries(metrics.gradeCounts).map(([letter, count]) => ({
    letter,
    count,
    color: GRADE_CHART_COLORS[letter] || '#71717a',
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
    <div className="space-y-5">
      {/* Row 1: 4 Quiet Stat Cards (numbers, labels, and deltas only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">CPA tích lũy (Hệ 4)</div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-[28px] leading-none font-medium text-zinc-900 dark:text-zinc-100">
              {metrics.cpa4.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 4.00</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
            Hạng {metrics.academicRank} · +0.52 vs Kỳ 2
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">CPA tích lũy (Hệ 10)</div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-[28px] leading-none font-medium text-zinc-900 dark:text-zinc-100">
              {metrics.cpa10.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {metrics.cpa10Exact.toFixed(4)} chính xác
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Tín chỉ đã tích lũy</div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-[28px] leading-none font-medium text-zinc-900 dark:text-zinc-100">
              {metrics.totalCompletedCredits}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 129 TC</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {metrics.completionPct}% chương trình · {metrics.completedCount} học phần
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Đang học tại Kỳ 5</div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-[28px] leading-none font-medium text-sky-600 dark:text-sky-400">
              {metrics.inProgressCredits || 16}
            </span>
            <span className="text-xs font-mono text-zinc-400">TC</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {metrics.inProgressCount || 6} môn · Sau K5 đạt{' '}
            {metrics.totalCompletedCredits + (metrics.inProgressCredits || 16)}/129 TC
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSubTab('overview_charts')}
            className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
              subTab === 'overview_charts'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span>Xu hướng GPA và phân phối điểm</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('blocks_audit')}
            className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
              subTab === 'blocks_audit'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span>Tiến độ 5 khối kiến thức</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('transcript_editor')}
            className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
              subTab === 'transcript_editor'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Table className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span>Bảng điểm chi tiết</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Charts (Varied Grid: 8/12 Wide Trend + 4/12 Grade Breakdown) */}
      {subTab === 'overview_charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Xu hướng GPA và CPA qua các học kỳ
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                  Kỳ 1 (3.31) đến Kỳ 4 (3.48)
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                Hệ 4.00
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.semesterHistory}
                  margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="gpaAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[2.4, 4.0]}
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="gpa4"
                    name="GPA từng kỳ"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#gpaAreaFill)"
                    activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpa4"
                    name="CPA tích lũy"
                    stroke="#71717a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Phân phối điểm chữ
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                {metrics.completedCount} học phần đã có điểm
              </p>
            </div>

            <div className="h-[220px] w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis
                    dataKey="letter"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} môn`, 'Số lượng']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Số học phần" radius={[4, 4, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs tabular-nums">
              {gradeChartData.map((g) => (
                <div key={g.letter} className="flex items-center justify-between px-1.5 py-1">
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">{g.letter}</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {g.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: 5 Blocks Audit & Conditional Checklist */}
      {subTab === 'blocks_audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Kiểm toán 5 khối kiến thức theo QĐ 3568
              </h2>
              <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                {metrics.totalCompletedCredits} / 129 TC
              </span>
            </div>

            <div className="space-y-3">
              {metrics.blockProgress.map((blk) => {
                const pct = Math.min(Math.round((blk.completed / blk.required) * 100), 100);
                const isDone = blk.completed >= blk.required;
                return (
                  <div
                    key={blk.id}
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isDone ? 'bg-emerald-600' : 'bg-sky-600'
                          }`}
                        />
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          {blk.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                        {blk.completed} / {blk.required} TC ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isDone ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{blk.missingNote}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4 h-fit">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Học phần điều kiện
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                15 tín chỉ không tính GPA tích lũy
              </p>
            </div>
            <div className="space-y-2">
              {conditionalCourses.map((cc) => {
                const checked = !!conditionalChecklist[cc.code];
                return (
                  <button
                    key={cc.code}
                    type="button"
                    onClick={() => onToggleConditional(cc.code)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checked ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                          strokeWidth={1.5}
                        />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {cc.name_vi}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                          {cc.code} · {cc.credits} TC
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium shrink-0 ${
                        checked
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {checked ? 'Đạt' : 'Chưa'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Transcript Table & Direct Grade Entry */}
      {subTab === 'transcript_editor' && (
        <div className="space-y-4">
          <form
            onSubmit={handleQuickSaveScore}
            className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Cập nhật nhanh điểm học phần
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={quickCourseCode}
                onChange={(e) => setQuickCourseCode(e.target.value)}
                className="h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
              >
                {courses
                  .filter((c) => c.counts_gpa)
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.name_vi} ({c.credits} TC)
                      {c.completed ? ` [${c.score10}]` : c.in_progress ? ' [Đang học K5]' : ''}
                    </option>
                  ))}
              </select>

              <select
                value={quickCourseSem}
                onChange={(e) => setQuickCourseSem(Number(e.target.value))}
                className="h-9 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
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
                placeholder="Điểm"
                className="w-20 h-9 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono tabular-nums text-center font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
              />

              <button
                type="submit"
                className="h-9 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center gap-1.5 transition-colors duration-150"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                <span>Lưu điểm</span>
              </button>
            </div>
          </form>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                Bảng điểm chi tiết ({filteredTranscriptCourses.length} học phần)
              </h2>

              <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-700">
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 1, label: 'Kỳ 1' },
                    { id: 2, label: 'Kỳ 2' },
                    { id: 3, label: 'Kỳ 3' },
                    { id: 4, label: 'Kỳ 4' },
                    { id: 'in_progress', label: 'Kỳ 5 (6)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={String(tab.id)}
                    onClick={() => setSelectedSemTab(tab.id)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                      selectedSemTab === tab.id
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/90 text-zinc-500 dark:text-zinc-400">
                    <th className="py-2.5 px-3 font-medium w-10">#</th>
                    <th className="py-2.5 px-3 font-medium">Kỳ</th>
                    <th className="py-2.5 px-3 font-medium">Mã HP</th>
                    <th className="py-2.5 px-3 font-medium">Tên học phần</th>
                    <th className="py-2.5 px-3 font-medium">Ghi chú</th>
                    <th className="py-2.5 px-3 font-medium text-right">TC</th>
                    <th className="py-2.5 px-3 font-medium text-right">Hệ 10</th>
                    <th className="py-2.5 px-3 font-medium text-center">Điểm chữ</th>
                    <th className="py-2.5 px-3 font-medium text-right">Hệ 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTranscriptCourses.map((c, idx) => (
                    <tr
                      key={c.code}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors duration-150"
                    >
                      <td className="py-2 px-3 font-mono text-zinc-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                        K{c.semester}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {c.code}
                      </td>
                      <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {c.name_vi}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { note: e.target.value })
                          }
                          placeholder="Ghi chú"
                          className="w-full h-7 px-2 rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus-visible:border-sky-500 bg-transparent text-xs text-zinc-600 dark:text-zinc-300 focus-visible:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        {c.credits}
                      </td>
                      <td className="py-2 px-3 text-right">
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
                            className="w-16 h-7 text-right px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
                          />
                        ) : (
                          <span className="text-xs font-mono text-sky-600 dark:text-sky-400">
                            Đang học
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {c.completed ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              c.letter === 'A+' || c.letter === 'A'
                                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400'
                                : c.letter === 'D+' || c.letter === 'D'
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {c.letter}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-zinc-900 dark:text-zinc-100">
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
