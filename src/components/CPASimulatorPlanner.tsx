import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  CheckSquare,
  Star,
  MapPin,
  Lock,
  X,
} from 'lucide-react';
import { Course, CourseUserState, TimetableSession } from '../types/academic';
import { letterToGrade, score10ToGrade } from '../utils/academicMath';
import { getCourseDifficulty } from '../utils/courseReviews';

interface CPASimulatorPlannerProps {
  courses: Course[];
  coursesState: Record<string, CourseUserState>;
  targetCpa: number;
  onChangeTargetCpa: (val: number) => void;
  retakePlan: Record<string, string>;
  onUpdateRetakePlan: (plan: Record<string, string>) => void;
  onUpdatePlannedSemester: (code: string, semester: number) => void;
  onUpdateCourseFullState: (code: string, partialState: Partial<CourseUserState>) => void;
  timetable: TimetableSession[];
  onUpdateTimetable: (nextTimetable: TimetableSession[]) => void;
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
  { day: 2, label: 'Thứ Hai', short: 'T2' },
  { day: 3, label: 'Thứ Ba', short: 'T3' },
  { day: 4, label: 'Thứ Tư', short: 'T4' },
  { day: 5, label: 'Thứ Năm', short: 'T5' },
  { day: 6, label: 'Thứ Sáu', short: 'T6' },
  { day: 7, label: 'Thứ Bảy', short: 'T7' },
];

const COURSE_TIMETABLE_STYLES: Record<
  string,
  { surface: string; border: string; accentBar: string; titleText: string; metaText: string }
> = {
  MAT1206E: {
    surface: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60',
    accentBar: 'bg-sky-600',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-sky-700 dark:text-sky-300',
  },
  MAT3519: {
    surface: 'bg-zinc-100 dark:bg-zinc-800/70',
    border: 'border-zinc-200 dark:border-zinc-700',
    accentBar: 'bg-zinc-500',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-zinc-600 dark:text-zinc-400',
  },
  MAT3533: {
    surface: 'bg-indigo-50/80 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    accentBar: 'bg-indigo-600',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-indigo-700 dark:text-indigo-300',
  },
  THL1057: {
    surface: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    accentBar: 'bg-amber-600',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-amber-800 dark:text-amber-300',
  },
  MAT3506: {
    surface: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    accentBar: 'bg-emerald-600',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-emerald-700 dark:text-emerald-300',
  },
  MAT3505: {
    surface: 'bg-teal-50/80 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/60',
    accentBar: 'bg-teal-600',
    titleText: 'text-zinc-900 dark:text-zinc-100',
    metaText: 'text-teal-700 dark:text-teal-300',
  },
};

export const StarRatingBadge: React.FC<{ stars: number }> = ({ stars }) => {
  const colorClass =
    stars >= 4.0
      ? 'text-rose-600 dark:text-rose-400'
      : stars >= 3.0
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <span
      className="inline-flex items-center gap-1 font-mono tabular-nums text-[11px] font-medium"
      title={`Độ khó: ${stars}/5 (Tham khảo Góc nhìn HUS)`}
    >
      <Star className={`w-3.5 h-3.5 ${colorClass} fill-current`} strokeWidth={1.5} />
      <span className="text-zinc-700 dark:text-zinc-300">{stars.toFixed(1)}/5</span>
    </span>
  );
};

export const CPASimulatorPlanner: React.FC<CPASimulatorPlannerProps> = ({
  courses,
  targetCpa,
  onChangeTargetCpa,
  retakePlan,
  onUpdateRetakePlan,
  onUpdateCourseFullState,
  timetable,
  onUpdateTimetable,
}) => {
  const [subTab, setSubTab] = useState<'timetable_sem5' | 'roadmap_5_8' | 'cpa_retake'>(
    'roadmap_5_8'
  );

  const [poolCategoryFilter, setPoolCategoryFilter] = useState<
    'all' | 'mandatory' | 'v21' | 'v22' | 'v3'
  >('all');
  const [poolSortBy, setPoolSortBy] = useState<'easiest' | 'hardest' | 'code'>('easiest');
  const [selectedReviewCourseCode, setSelectedReviewCourseCode] = useState<string>('MAT3534');

  const [quickScoreMap, setQuickScoreMap] = useState<Record<string, string>>({});
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState<Partial<TimetableSession>>({
    course_code: 'MAT3533',
    class_code: 'MAT3533 2',
    course_name: 'Học máy',
    session_type: 'LT',
    day_of_week: 2,
    start_period: 7,
    end_period: 8,
    room: '101T5',
    note: 'Cố gắng học',
    color: '',
  });

  const sem5InProgressCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        (c.in_progress && !c.completed) ||
        (!c.completed && c.planned_semester === 5 && c.in_progress)
    );
  }, [courses]);

  const retakeCandidates = useMemo(() => {
    return courses
      .filter((c) => c.completed && c.counts_gpa && c.score4 !== null && c.score4 <= 1.5)
      .sort((a, b) => (a.score4 ?? 0) - (b.score4 ?? 0));
  }, [courses]);

  const nonRetakeableLowCourses = useMemo(() => {
    return courses
      .filter(
        (c) =>
          c.completed &&
          c.counts_gpa &&
          c.score4 !== null &&
          c.score4 >= 2.0 &&
          c.score4 <= 2.5
      )
      .sort((a, b) => (a.score4 ?? 0) - (b.score4 ?? 0));
  }, [courses]);

  const simResult = useMemo(() => {
    const completedGpa = courses.filter((c) => c.completed && c.counts_gpa);
    const totalCompletedCredits = completedGpa.reduce((s, c) => s + c.credits, 0);
    const remainingCredits = Math.max(129 - totalCompletedCredits, 0);

    const baseWeighted4 = completedGpa.reduce((s, c) => s + c.credits * (c.score4 ?? 3.7), 0);
    const baseCpa4Exact = totalCompletedCredits > 0 ? baseWeighted4 / totalCompletedCredits : 0;
    const baseCpa4 = Math.round(baseCpa4Exact * 100) / 100;

    let retakeCredits = 0;
    let retakeDeltaPoints = 0;
    completedGpa.forEach((c) => {
      const targetLetter = retakePlan[c.code];
      const oldS4 = c.score4 ?? 2.0;
      if (targetLetter && oldS4 <= 1.5) {
        const { score4: newS4 } = letterToGrade(targetLetter);
        if (newS4 > oldS4) {
          retakeCredits += c.credits;
          retakeDeltaPoints += c.credits * (newS4 - oldS4);
        }
      }
    });

    const newWeighted4 = baseWeighted4 + retakeDeltaPoints;
    const newCpa4Exact = totalCompletedCredits > 0 ? newWeighted4 / totalCompletedCredits : 0;
    const newCpa4 = Math.round(newCpa4Exact * 100) / 100;

    const targetTotalPoints = 129 * targetCpa;
    const baseRequiredForRemaining =
      remainingCredits > 0
        ? (targetTotalPoints - totalCompletedCredits * baseCpa4) / remainingCredits
        : 0;
    const newRequiredForRemaining =
      remainingCredits > 0
        ? (targetTotalPoints - (totalCompletedCredits * baseCpa4 + retakeDeltaPoints)) /
          remainingCredits
        : 0;

    const retakePct = Math.round((retakeCredits / 129) * 10000) / 100;
    const isOver5PercentLimit = retakeCredits > 6;

    return {
      totalCompletedCredits,
      remainingCredits,
      baseCpa4,
      baseCpa4Exact,
      newCpa4,
      newCpa4Exact,
      retakeCredits,
      retakePct,
      isOver5PercentLimit,
      retakeDeltaPoints,
      baseRequiredForRemaining: Math.round(baseRequiredForRemaining * 100) / 100,
      newRequiredForRemaining: Math.round(newRequiredForRemaining * 100) / 100,
    };
  }, [courses, targetCpa, retakePlan]);

  const handleToggleRetake = (code: string, defaultLetter = 'A') => {
    const next = { ...retakePlan };
    if (next[code]) {
      delete next[code];
    } else {
      next[code] = defaultLetter;
    }
    onUpdateRetakePlan(next);
  };

  const handleChangeRetakeGrade = (code: string, letter: string) => {
    onUpdateRetakePlan({
      ...retakePlan,
      [code]: letter,
    });
  };

  const handleCompleteSem5Course = (course: Course) => {
    const rawVal = quickScoreMap[course.code] ?? '8.5';
    const s10 = Math.min(Math.max(parseFloat(rawVal) || 8.5, 0), 10);
    const { letter, score4 } = score10ToGrade(s10);
    onUpdateCourseFullState(course.code, {
      completed: true,
      in_progress: false,
      semester: 5,
      planned_semester: 5,
      score10: s10,
      letter,
      score4,
    });
  };

  const handleDropSem5Course = (course: Course, moveToSem = 6) => {
    onUpdateCourseFullState(course.code, {
      completed: false,
      in_progress: false,
      planned_semester: moveToSem,
    });
    onUpdateTimetable(timetable.filter((t) => t.course_code !== course.code));
  };

  const handleAddSession = () => {
    if (!newSession.course_name || !newSession.day_of_week) return;
    const created: TimetableSession = {
      id: `tt-${Date.now()}`,
      course_code: newSession.course_code || 'MAT3533',
      class_code: newSession.class_code || '',
      course_name: newSession.course_name,
      session_type: (newSession.session_type as 'LT' | 'TH' | 'Online') || 'LT',
      day_of_week: Number(newSession.day_of_week),
      start_period: Number(newSession.start_period) || 1,
      end_period: Number(newSession.end_period) || 2,
      room: newSession.room || '',
      note: newSession.note || '',
      color: '',
    };
    onUpdateTimetable([...timetable, created]);
    setShowAddSession(false);
  };

  const handleDeleteSession = (id: string) => {
    onUpdateTimetable(timetable.filter((t) => t.id !== id));
  };

  const uncompletedCourses = useMemo(
    () => courses.filter((c) => !c.completed && c.counts_gpa),
    [courses]
  );

  const roadmapQuotaAudit = useMemo(() => {
    const completedCodes = new Set(courses.filter((c) => c.completed).map((c) => c.code));
    const warnings: Array<{ code: string; name: string; semester: number; missingPrereqs: string[] }> = [];

    const plannedCourses = uncompletedCourses.filter((c) => {
      const s = c.in_progress ? 5 : c.planned_semester || 0;
      return s >= 5 && s <= 8;
    });

    plannedCourses.forEach((c) => {
      const assignedSem = c.in_progress ? 5 : c.planned_semester || 0;
      const missing: string[] = [];
      c.prerequisites.forEach((preCode) => {
        if (completedCodes.has(preCode)) return;
        const preCourse = courses.find((x) => x.code === preCode);
        const preSem = preCourse?.in_progress ? 5 : preCourse?.planned_semester || 0;
        if (!preSem || preSem >= assignedSem) {
          missing.push(`${preCode} (${preSem ? `đang xếp K${preSem}` : 'chưa xếp'})`);
        }
      });

      if (missing.length > 0) {
        warnings.push({
          code: c.code,
          name: c.name_vi,
          semester: assignedSem,
          missingPrereqs: missing,
        });
      }
    });

    const sumTc = (filterFn: (c: Course) => boolean) =>
      plannedCourses.filter(filterFn).reduce((s, c) => s + c.credits, 0);

    const mandatoryI_IV_V1_Tc = sumTc(
      (c) => c.block === 'I' || c.block === 'IV' || c.sub_block === 'V.1'
    );
    const electiveV21_Tc = sumTc((c) => c.sub_block === 'V.2.1');
    const electiveV22_Tc = sumTc((c) => c.sub_block === 'V.2.2');
    const gradV3_Tc = sumTc((c) => c.sub_block === 'V.3');
    const totalPlannedCredits = plannedCourses.reduce((s, c) => s + c.credits, 0);

    return {
      warnings,
      totalPlannedCredits,
      mandatoryI_IV_V1_Tc,
      electiveV21_Tc,
      electiveV22_Tc,
      gradV3_Tc,
    };
  }, [courses, uncompletedCourses]);

  const getCourseBadgeType = (c: Course) => {
    if (c.block === 'I') {
      return {
        text: 'Bắt buộc Khối I (Thiếu 2 TC)',
        short: 'Bắt buộc Khối I',
        dot: 'bg-zinc-600',
      };
    }
    if (c.block === 'IV') {
      return {
        text: 'Bắt buộc Khối IV',
        short: 'Bắt buộc Khối IV',
        dot: 'bg-zinc-600',
      };
    }
    if (c.sub_block === 'V.1') {
      return {
        text: 'Bắt buộc Ngành V.1',
        short: 'Bắt buộc V.1',
        dot: 'bg-zinc-600',
      };
    }
    if (c.sub_block === 'V.2.1') {
      return {
        text: 'Tự chọn V.2.1 · Kỹ năng PM (4/8 TC)',
        short: 'Tự chọn V.2.1',
        dot: 'bg-sky-600',
      };
    }
    if (c.sub_block === 'V.2.2') {
      return {
        text: 'Tự chọn V.2.2 · AI và PTPM (12/39 TC)',
        short: 'Tự chọn V.2.2',
        dot: 'bg-sky-600',
      };
    }
    if (c.sub_block === 'V.3') {
      return {
        text: 'Tốt nghiệp V.3 (7 TC)',
        short: 'Tốt nghiệp V.3',
        dot: 'bg-emerald-600',
      };
    }
    return {
      text: c.sub_block,
      short: c.sub_block,
      dot: 'bg-zinc-400',
    };
  };

  const explorerCourses = useMemo(() => {
    return uncompletedCourses
      .filter((c) => c.block !== 'II')
      .filter((c) => {
        if (poolCategoryFilter === 'all') return true;
        if (poolCategoryFilter === 'mandatory')
          return c.block === 'I' || c.block === 'IV' || c.sub_block === 'V.1';
        if (poolCategoryFilter === 'v21') return c.sub_block === 'V.2.1';
        if (poolCategoryFilter === 'v22') return c.sub_block === 'V.2.2';
        if (poolCategoryFilter === 'v3') return c.sub_block === 'V.3';
        return true;
      })
      .sort((a, b) => {
        const diffA = getCourseDifficulty(a.code).stars;
        const diffB = getCourseDifficulty(b.code).stars;
        if (poolSortBy === 'easiest') return diffA - diffB;
        if (poolSortBy === 'hardest') return diffB - diffA;
        return a.code.localeCompare(b.code);
      });
  }, [uncompletedCourses, poolCategoryFilter, poolSortBy]);

  const selectedReviewCourse = useMemo(
    () => courses.find((c) => c.code === selectedReviewCourseCode) || explorerCourses[0],
    [courses, selectedReviewCourseCode, explorerCourses]
  );

  return (
    <div className="space-y-5">
      {/* Segmented Sub-Tab Control */}
      <div className="inline-flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setSubTab('roadmap_5_8')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'roadmap_5_8'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Lộ trình Kỳ 5–8 và độ khó</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cpa_retake')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'cpa_retake'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Calculator className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Mô phỏng CPA và học cải thiện</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('timetable_sem5')}
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
            subTab === 'timetable_sem5'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <span>Chốt điểm Kỳ 5 ({sem5InProgressCourses.length} môn)</span>
        </button>
      </div>

      {/* Sub-tab 1: Timetable & Sem 5 Grade Finalization */}
      {subTab === 'timetable_sem5' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Thời khóa biểu Học kỳ 5
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                  {sem5InProgressCourses.length} học phần · {sem5InProgressCourses.reduce((s, c) => s + c.credits, 0)} tín chỉ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSession((s) => !s)}
                className="h-9 px-3 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-1.5 transition-colors duration-150"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                <span>{showAddSession ? 'Đóng' : 'Thêm ca học'}</span>
              </button>
            </div>

            {showAddSession && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <input
                  type="text"
                  placeholder="Mã HP (MAT3533)"
                  value={newSession.course_code || ''}
                  onChange={(e) => setNewSession({ ...newSession, course_code: e.target.value })}
                  className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                />
                <input
                  type="text"
                  placeholder="Tên môn (Học máy)"
                  value={newSession.course_name || ''}
                  onChange={(e) => setNewSession({ ...newSession, course_name: e.target.value })}
                  className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                />
                <input
                  type="text"
                  placeholder="Phòng (101T5)"
                  value={newSession.room || ''}
                  onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                  className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                />
                <select
                  value={newSession.day_of_week || 2}
                  onChange={(e) =>
                    setNewSession({ ...newSession, day_of_week: Number(e.target.value) })
                  }
                  className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.day} value={d.day}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newSession.start_period || 1}
                    onChange={(e) =>
                      setNewSession({ ...newSession, start_period: Number(e.target.value) })
                    }
                    className="w-14 h-9 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center font-mono tabular-nums"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newSession.end_period || 2}
                    onChange={(e) =>
                      setNewSession({ ...newSession, end_period: Number(e.target.value) })
                    }
                    className="w-14 h-9 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center font-mono tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="h-9 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shrink-0"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <table className="w-full table-fixed min-w-[920px] border-collapse tabular-nums">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 text-xs border-b border-zinc-200 dark:border-zinc-800">
                    <th className="w-[54px] py-2.5 px-2 border-r border-zinc-200/70 dark:border-zinc-800 text-center font-medium">
                      Tiết
                    </th>
                    <th className="w-[112px] py-2.5 px-2 border-r border-zinc-200/70 dark:border-zinc-800 text-center font-medium">
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
                <tbody className="text-xs">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((period) => (
                    <React.Fragment key={period}>
                      {period === 7 && (
                        <tr className="bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-center">
                          <td className="py-2 border-y border-r border-zinc-200/70 dark:border-zinc-800 text-xs font-medium">
                            Trưa
                          </td>
                          <td className="py-2 border-y border-r border-zinc-200/70 dark:border-zinc-800 font-mono text-[11px]">
                            12:30 - 13:00
                          </td>
                          <td
                            colSpan={6}
                            className="py-2 border-y border-zinc-200/70 dark:border-zinc-800 text-xs"
                          >
                            Nghỉ trưa
                          </td>
                        </tr>
                      )}
                      <tr className="h-[50px]">
                        <td className="border-b border-r border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-center font-mono text-zinc-600 dark:text-zinc-400">
                          {period}
                        </td>
                        <td className="border-b border-r border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/60 text-center font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                          {PERIOD_TIMES[period]}
                        </td>
                        {DAYS_OF_WEEK.map((d) => {
                          const startingSession = timetable.find(
                            (s) => s.day_of_week === d.day && s.start_period === period
                          );
                          const coveredByEarlier = timetable.some(
                            (s) =>
                              s.day_of_week === d.day &&
                              s.start_period < period &&
                              s.end_period >= period
                          );

                          if (coveredByEarlier) return null;

                          if (startingSession) {
                            const span = Math.max(
                              startingSession.end_period - startingSession.start_period + 1,
                              1
                            );
                            const palette = COURSE_TIMETABLE_STYLES[
                              startingSession.course_code
                            ] || {
                              surface: 'bg-sky-50 dark:bg-sky-950/40',
                              border: 'border-sky-200 dark:border-sky-800/60',
                              accentBar: 'bg-sky-600',
                              titleText: 'text-zinc-900 dark:text-zinc-100',
                              metaText: 'text-sky-700 dark:text-sky-300',
                            };

                            return (
                              <td
                                key={d.day}
                                rowSpan={span}
                                className="border-b border-r last:border-r-0 border-zinc-200/70 dark:border-zinc-800 p-1 align-stretch"
                              >
                                <div
                                  className={`w-full h-full min-h-[78px] rounded-lg border p-2.5 flex flex-col justify-between relative group overflow-hidden ${palette.surface} ${palette.border}`}
                                >
                                  <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 ${palette.accentBar}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(startingSession.id)}
                                    title="Xóa ca học"
                                    className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 w-5 h-5 rounded bg-zinc-900/10 hover:bg-rose-600 hover:text-white text-zinc-600 flex items-center justify-center transition-opacity duration-150"
                                  >
                                    <X className="w-3 h-3" strokeWidth={1.75} />
                                  </button>

                                  <div className="pl-1.5">
                                    <div
                                      className={`font-medium text-xs leading-snug pr-4 break-words ${palette.titleText}`}
                                    >
                                      {startingSession.course_name}
                                    </div>
                                    {startingSession.room && (
                                      <div
                                        className={`text-[11px] font-mono mt-0.5 flex items-center gap-1 ${palette.metaText}`}
                                      >
                                        <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                                        <span className="truncate">{startingSession.room}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pl-1.5 flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-zinc-900/10 dark:border-white/10 text-[11px] font-mono">
                                    <span className="text-zinc-600 dark:text-zinc-300">
                                      {startingSession.class_code || startingSession.course_code}
                                    </span>
                                    <span className="text-zinc-500">
                                      T{startingSession.start_period}-{startingSession.end_period}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={d.day}
                              className="border-b border-r last:border-r-0 border-zinc-100 dark:border-zinc-800/60"
                            />
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Chốt điểm nhanh các học phần Kỳ 5
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sem5InProgressCourses.map((c) => {
                const diff = getCourseDifficulty(c.code);
                const badge = getCourseBadgeType(c);
                return (
                  <div
                    key={c.code}
                    className="p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span>{badge.short}</span>
                        </span>
                        <StarRatingBadge stars={diff.stars} />
                      </div>

                      <div>
                        <div className="font-mono text-xs text-zinc-500 tabular-nums">
                          {c.code} · {c.credits} TC
                        </div>
                        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {c.name_vi}
                        </div>
                      </div>

                      {c.schedule_info && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {c.schedule_info}
                        </div>
                      )}

                      <input
                        type="text"
                        value={c.note || ''}
                        onChange={(e) => onUpdateCourseFullState(c.code, { note: e.target.value })}
                        placeholder="Ghi chú"
                        className="w-full h-8 px-2.5 rounded-md text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                      />
                    </div>

                    <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="4.0"
                          max="10.0"
                          placeholder="8.5"
                          value={quickScoreMap[c.code] ?? ''}
                          onChange={(e) =>
                            setQuickScoreMap((prev) => ({ ...prev, [c.code]: e.target.value }))
                          }
                          className="w-16 h-8 px-2 rounded-md text-xs font-mono tabular-nums bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleCompleteSem5Course(c)}
                          className="h-8 px-2.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Chốt điểm</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDropSem5Course(c, 6)}
                        className="h-8 px-2.5 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Chuyển K6
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Roadmap 5-8 & Difficulty Explorer */}
      {subTab === 'roadmap_5_8' && (
        <div className="space-y-5">
          {/* Quota Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Bắt buộc còn lại</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {roadmapQuotaAudit.mandatoryI_IV_V1_Tc} / 35 TC
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                THL1057 (I), Tối ưu hóa & PPNCKH (IV), 9 môn ngành (V.1)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Tự chọn V.2.1 (Kỹ năng PM)</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {roadmapQuotaAudit.electiveV21_Tc} / 4 TC
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Chọn 2 môn trong NNLT thứ 2, Mobile, Game, Mạng không dây
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Tự chọn V.2.2 (AI và PTPM)</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {roadmapQuotaAudit.electiveV22_Tc} / 12 TC
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Chọn 4 môn trong 13 học phần chuyên sâu tự chọn
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Tốt nghiệp V.3</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {roadmapQuotaAudit.gradV3_Tc} / 7 TC
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Khóa luận tốt nghiệp MAT4080 hoặc 2 học phần thay thế
              </p>
            </div>
          </div>

          {/* Validation Notice */}
          {roadmapQuotaAudit.warnings.length > 0 ? (
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>Cảnh báo điều kiện tiên quyết trong lịch dự kiến</span>
              </div>
              {roadmapQuotaAudit.warnings.map((w) => (
                <div key={w.code} className="pl-5">
                  {w.code} · {w.name} (Kỳ {w.semester}) cần hoàn thành trước:{' '}
                  <span className="font-mono">{w.missingPrereqs.join(', ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
                <span>Thỏa mãn điều kiện tiên quyết theo QĐ 3568 từ Kỳ 5 đến Kỳ 8</span>
              </span>
              <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                {roadmapQuotaAudit.totalPlannedCredits} / 58 TC còn lại
              </span>
            </div>
          )}

          {/* 4 Columns for Semesters 5, 6, 7, 8 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[5, 6, 7, 8].map((sem) => {
              const semCourses = uncompletedCourses.filter((c) => {
                const targetSem = c.in_progress ? 5 : c.planned_semester || 0;
                return targetSem === sem;
              });
              const semCredits = semCourses.reduce((s, c) => s + c.credits, 0);
              const avgDiff =
                semCourses.length > 0
                  ? (
                      semCourses.reduce((s, c) => s + getCourseDifficulty(c.code).stars, 0) /
                      semCourses.length
                    ).toFixed(1)
                  : '0.0';

              return (
                <div
                  key={sem}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {sem === 5 ? 'Học kỳ 5 · Đang học' : `Học kỳ ${sem}`}
                        </h3>
                        <span className="text-xs text-zinc-500 font-mono tabular-nums">
                          {semCourses.length} môn · TB {avgDiff}/5
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums font-medium ${
                          sem === 5
                            ? 'bg-sky-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {semCredits} TC
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {semCourses.map((c) => {
                        const diff = getCourseDifficulty(c.code);
                        const badge = getCourseBadgeType(c);
                        return (
                          <div
                            key={c.code}
                            onClick={() => setSelectedReviewCourseCode(c.code)}
                            className={`p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border space-y-1.5 cursor-pointer transition-colors duration-150 ${
                              selectedReviewCourseCode === c.code
                                ? 'border-sky-600 ring-1 ring-sky-600/20'
                                : 'border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.short}</span>
                              </span>
                              <StarRatingBadge stars={diff.stars} />
                            </div>

                            <div className="flex items-center justify-between gap-1 font-mono text-xs tabular-nums text-zinc-500">
                              <span className="text-sky-700 dark:text-sky-400 font-medium">
                                {c.code}
                              </span>
                              <span>{c.credits} TC</span>
                            </div>

                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                              {c.name_vi}
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800">
                              <span className="text-[11px] text-zinc-400">Chuyển kỳ</span>
                              <div className="flex items-center gap-1">
                                {[5, 6, 7, 8].map((targetSem) => (
                                  <button
                                    key={targetSem}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateCourseFullState(c.code, {
                                        in_progress: targetSem === 5,
                                        planned_semester: targetSem,
                                      });
                                    }}
                                    className={`w-6 h-6 rounded text-[11px] font-mono tabular-nums ${
                                      sem === targetSem
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                                    }`}
                                  >
                                    {targetSem}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateCourseFullState(c.code, {
                                      in_progress: false,
                                      planned_semester: 0,
                                    });
                                  }}
                                  title="Bỏ khỏi lộ trình"
                                  className="w-6 h-6 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" strokeWidth={1.75} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course Review & Elective Selector Catalog */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Phân loại môn học và xếp hạng độ khó (0–5 sao)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tổng hợp từ chương trình QĐ 3568 và đánh giá sinh viên HUS
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200/70 dark:border-zinc-700">
                  {(
                    [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'mandatory', label: 'Bắt buộc' },
                      { id: 'v21', label: 'Tự chọn V.2.1' },
                      { id: 'v22', label: 'Tự chọn V.2.2' },
                      { id: 'v3', label: 'Tốt nghiệp V.3' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPoolCategoryFilter(tab.id)}
                      className={`h-7 px-2.5 rounded-md font-medium transition-colors duration-150 ${
                        poolCategoryFilter === tab.id
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={poolSortBy}
                  onChange={(e) => setPoolSortBy(e.target.value as 'easiest' | 'hardest' | 'code')}
                  className="h-9 px-3 rounded-lg font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                >
                  <option value="easiest">Từ dễ đến khó</option>
                  <option value="hardest">Từ khó đến dễ</option>
                  <option value="code">Theo mã học phần</option>
                </select>
              </div>
            </div>

            {selectedReviewCourse && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-medium text-sky-700 dark:text-sky-400 tabular-nums">
                      {selectedReviewCourse.code} · {selectedReviewCourse.credits} TC
                    </span>
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {selectedReviewCourse.name_vi}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {getCourseBadgeType(selectedReviewCourse).text}
                    </span>
                    <StarRatingBadge stars={getCourseDifficulty(selectedReviewCourse.code).stars} />
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {getCourseDifficulty(selectedReviewCourse.code).husCommunityReview}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {getCourseDifficulty(selectedReviewCourse.code).fitWithHuan}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-zinc-500 mr-1">Xếp vào</span>
                  {[5, 6, 7, 8].map((sem) => {
                    const currentSem = selectedReviewCourse.in_progress
                      ? 5
                      : selectedReviewCourse.planned_semester || 0;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() =>
                          onUpdateCourseFullState(selectedReviewCourse.code, {
                            in_progress: sem === 5,
                            planned_semester: sem,
                          })
                        }
                        className={`h-8 px-3 rounded-lg text-xs font-mono font-medium transition-colors duration-150 ${
                          currentSem === sem
                            ? 'bg-sky-600 text-white'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        K{sem}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {explorerCourses.map((c) => {
                const diff = getCourseDifficulty(c.code);
                const badge = getCourseBadgeType(c);
                const assignedSem = c.in_progress ? 5 : c.planned_semester || 0;
                const isPlanned = assignedSem >= 5 && assignedSem <= 8;

                return (
                  <div
                    key={c.code}
                    onClick={() => setSelectedReviewCourseCode(c.code)}
                    className={`p-4 rounded-xl border transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-3 ${
                      selectedReviewCourseCode === c.code
                        ? 'border-sky-600 bg-white dark:bg-zinc-900'
                        : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.short}</span>
                        </span>
                        <StarRatingBadge stars={diff.stars} />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-500">
                        <span className="text-sky-700 dark:text-sky-400 font-medium">
                          {c.code} · {c.credits} TC
                        </span>
                        <span>{diff.levelLabel}</span>
                      </div>

                      <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                        {c.name_vi}
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">
                        {diff.husCommunityReview}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                      {isPlanned ? (
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                          Đã xếp K{assignedSem}
                        </span>
                      ) : (
                        <span className="text-zinc-400">Chưa xếp</span>
                      )}

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {[5, 6, 7, 8].map((sem) => (
                          <button
                            key={sem}
                            type="button"
                            onClick={() =>
                              onUpdateCourseFullState(c.code, {
                                in_progress: sem === 5,
                                planned_semester: sem,
                              })
                            }
                            className={`w-6 h-6 rounded text-[11px] font-mono tabular-nums ${
                              assignedSem === sem
                                ? 'bg-sky-600 text-white'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                            }`}
                          >
                            K{sem}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: CPA Simulator & Retake Rule */}
      {subTab === 'cpa_retake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Tính điểm mục tiêu toàn khóa (129 TC)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                GPA cần đạt trung bình cho {simResult.remainingCredits} tín chỉ còn lại
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                Mục tiêu CPA hệ 4.00
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '3.20 Giỏi', val: 3.2 },
                  { label: '3.40 Mục tiêu', val: 3.4 },
                  { label: '3.50 Giỏi cao', val: 3.5 },
                  { label: '3.60 Xuất sắc', val: 3.6 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => onChangeTargetCpa(preset.val)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors duration-150 tabular-nums ${
                      Math.abs(targetCpa - preset.val) < 0.005
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="pt-1 flex items-center gap-3">
                <input
                  type="range"
                  min="3.00"
                  max="3.80"
                  step="0.01"
                  value={targetCpa}
                  onChange={(e) => onChangeTargetCpa(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <span className="px-3 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono tabular-nums font-medium text-sm shrink-0">
                  {targetCpa.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">Không học cải thiện</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  CPA hiện tại: <span className="font-mono font-medium">{simResult.baseCpa4.toFixed(2)}</span>
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-zinc-500">
                    GPA cần đạt ({simResult.remainingCredits} TC)
                  </div>
                  <div
                    className={`text-2xl font-mono font-medium mt-0.5 ${
                      simResult.baseRequiredForRemaining > 4.0
                        ? 'text-rose-600'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {simResult.baseRequiredForRemaining.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-sky-600/40 dark:border-sky-500/40">
                <div className="text-xs text-sky-700 dark:text-sky-400 font-medium">
                  Sau cải thiện ({simResult.retakeCredits} TC)
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  CPA mới:{' '}
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {simResult.newCpa4.toFixed(2)}
                  </span>{' '}
                  (+{(simResult.newCpa4 - simResult.baseCpa4).toFixed(2)})
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-zinc-500">
                    GPA cần đạt còn lại
                  </div>
                  <div className="text-2xl font-mono font-medium mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {simResult.newRequiredForRemaining.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <span>Mô phỏng học cải thiện theo quy chế ĐHQGHN</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Chỉ các học phần đạt điểm D hoặc D+ được phép đăng ký cải thiện
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateRetakePlan({ MAT1202: 'A' })}
                  className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 transition-colors duration-150"
                >
                  Thử OOP lên A
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateRetakePlan({ MAT1202: 'A+' })}
                  className="h-8 px-3 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors duration-150"
                >
                  Thử OOP lên A+
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {retakeCandidates.map((course) => {
                const isSelected = Boolean(retakePlan[course.code]);
                const targetLetter = retakePlan[course.code] || 'A';
                const { score4: newS4 } = letterToGrade(targetLetter);
                const oldS4 = course.score4 ?? 1.5;
                const gainPoints = (course.credits * (newS4 - oldS4)).toFixed(1);
                const singleCpaJump = ((course.credits * (newS4 - oldS4)) / 71).toFixed(2);

                return (
                  <div
                    key={course.code}
                    className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors duration-150 ${
                      isSelected
                        ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-600/40'
                        : 'bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRetake(course.code, 'A')}
                        className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                            {course.letter} · Đủ điều kiện
                          </span>
                          <span className="text-zinc-300">·</span>
                          <span className="font-mono text-zinc-500">{course.code}</span>
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                            {course.name_vi} ({course.credits} TC)
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                          Điểm hiện tại (Kỳ {course.semester}): {course.score10} ({course.score4?.toFixed(1)} hệ 4)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={targetLetter}
                        disabled={!isSelected}
                        onChange={(e) => handleChangeRetakeGrade(course.code, e.target.value)}
                        className="h-8 px-2.5 rounded-lg text-xs font-mono font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                      >
                        <option value="A+">A+ (4.0)</option>
                        <option value="A">A (3.7)</option>
                        <option value="B+">B+ (3.5)</option>
                      </select>

                      <div className="text-right min-w-[100px] tabular-nums font-mono">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          +{gainPoints} điểm
                        </div>
                        <div className="text-[11px] text-zinc-500">CPA +{singleCpaJump}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {nonRetakeableLowCourses.length > 0 && (
              <div className="pt-3 border-t border-zinc-200/70 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Các môn điểm C / C+ (không thuộc diện học cải thiện)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nonRetakeableLowCourses.map((c) => (
                    <div
                      key={c.code}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-600 dark:text-zinc-300 truncate">
                        <span className="font-mono text-zinc-400">{c.code}</span> · {c.name_vi}
                      </span>
                      <span className="font-mono text-zinc-500 tabular-nums shrink-0 ml-2">
                        {c.letter} ({c.score4?.toFixed(1)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
