import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  BookOpen,
  Plus,
  CheckSquare,
  Star,
  Layers,
  Filter,
  Info,
  MapPin,
  GraduationCap,
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

// Clean, high-contrast color themes per course for the timetable
const COURSE_TIMETABLE_STYLES: Record<
  string,
  { bg: string; border: string; titleText: string; subText: string; badgeBg: string }
> = {
  MAT1206E: {
    bg: 'bg-sky-500 dark:bg-sky-600',
    border: 'border-sky-600 dark:border-sky-400',
    titleText: 'text-white',
    subText: 'text-sky-100',
    badgeBg: 'bg-white/20 text-white',
  },
  MAT3519: {
    bg: 'bg-cyan-100 dark:bg-cyan-950/90',
    border: 'border-cyan-400 dark:border-cyan-600',
    titleText: 'text-cyan-950 dark:text-cyan-100',
    subText: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-600 text-white',
  },
  MAT3533: {
    bg: 'bg-rose-100 dark:bg-rose-950/90',
    border: 'border-rose-400 dark:border-rose-600',
    titleText: 'text-rose-950 dark:text-rose-100',
    subText: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-600 text-white',
  },
  THL1057: {
    bg: 'bg-amber-100 dark:bg-amber-950/90',
    border: 'border-amber-400 dark:border-amber-600',
    titleText: 'text-amber-950 dark:text-amber-100',
    subText: 'text-amber-800 dark:text-amber-300',
    badgeBg: 'bg-amber-600 text-white',
  },
  MAT3506: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/90',
    border: 'border-emerald-400 dark:border-emerald-600',
    titleText: 'text-emerald-950 dark:text-emerald-100',
    subText: 'text-emerald-800 dark:text-emerald-300',
    badgeBg: 'bg-emerald-600 text-white',
  },
  MAT3505: {
    bg: 'bg-lime-500 dark:bg-lime-600',
    border: 'border-lime-600 dark:border-lime-400',
    titleText: 'text-white',
    subText: 'text-lime-50',
    badgeBg: 'bg-black/20 text-white',
  },
};

export const StarRatingBadge: React.FC<{ stars: number; showNumber?: boolean }> = ({
  stars,
  showNumber = true,
}) => {
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;
  const colorClass =
    stars >= 4.0
      ? 'text-rose-500'
      : stars >= 3.0
      ? 'text-amber-500'
      : 'text-emerald-500';

  return (
    <span className="inline-flex items-center gap-0.5" title={`Độ khó: ${stars}/5 sao (Theo Góc nhìn HUS)`}>
      {[1, 2, 3, 4, 5].map((idx) => {
        const filled = idx <= fullStars || (idx === fullStars + 1 && hasHalf);
        return (
          <Star
            key={idx}
            className={`w-3 h-3 ${
              filled ? `${colorClass} fill-current` : 'text-slate-300 dark:text-slate-700'
            }`}
          />
        );
      })}
      {showNumber && (
        <span className={`ml-1 text-[10px] font-extrabold ${colorClass}`}>{stars.toFixed(1)}★</span>
      )}
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
    'timetable_sem5'
  );

  // Filter for Elective Pool in Roadmap
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
    note: 'Chăm là được',
    color: 'bg-sky-500 text-white border-sky-600',
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
      color: newSession.color || 'bg-sky-500 text-white border-sky-600',
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

  // Detailed Audit of Planned Semesters 5, 6, 7, 8 by Category Quota
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
          missing.push(`${preCode} (${preSem ? `đang xếp Kỳ ${preSem}` : 'chưa xếp kỳ'})`);
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
      mandatoryI_IV_V1_Tc, // Need 35 TC (2 TC Block I + 6 TC Block IV + 27 TC Block V.1)
      electiveV21_Tc, // Need 4 TC out of 8 TC
      electiveV22_Tc, // Need 12 TC out of 39 TC
      gradV3_Tc, // Need 7 TC
    };
  }, [courses, uncompletedCourses]);

  const getCourseBadgeType = (c: Course) => {
    if (c.block === 'I') {
      return {
        text: 'Bắt buộc Khối I (Còn thiếu đúng 2 TC)',
        short: 'Bắt buộc Khối I',
        style: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-300',
      };
    }
    if (c.block === 'IV') {
      return {
        text: 'Bắt buộc Khối IV (Nhóm ngành)',
        short: 'Bắt buộc Khối IV',
        style: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300',
      };
    }
    if (c.sub_block === 'V.1') {
      return {
        text: 'Bắt buộc Ngành V.1',
        short: 'Bắt buộc V.1',
        style: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border-sky-300',
      };
    }
    if (c.sub_block === 'V.2.1') {
      return {
        text: 'Tự chọn V.2.1 - Kỹ năng PM (Chọn 4/8 TC)',
        short: 'Tự chọn V.2.1 (Kỹ năng PM)',
        style: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-300',
      };
    }
    if (c.sub_block === 'V.2.2') {
      return {
        text: 'Tự chọn V.2.2 - AI & PTPM (Chọn 12/39 TC)',
        short: 'Tự chọn V.2.2 (AI & PTPM)',
        style: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300',
      };
    }
    if (c.sub_block === 'V.3') {
      return {
        text: 'Tốt nghiệp V.3 (Chọn 7 TC: KLTN hoặc 2 môn thay thế)',
        short: 'Tốt nghiệp V.3 (7 TC)',
        style: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300',
      };
    }
    return {
      text: c.sub_block,
      short: c.sub_block,
      style: 'bg-slate-100 text-slate-700',
    };
  };

  // Filtered & Sorted Unassigned / Elective Explorer Pool
  const explorerCourses = useMemo(() => {
    return uncompletedCourses
      .filter((c) => c.block !== 'II') // Khối II đã học xong 5/5 TC
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
    <div className="space-y-4">
      {/* Sub-Navigation Pills (Clean, No Unnecessary Storage Text) */}
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-2 border border-sky-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('timetable_sem5')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'timetable_sem5'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            1. Thời Khóa Biểu Kỳ 5 Đang Học ({sem5InProgressCourses.reduce((s, c) => s + c.credits, 0)}{' '}
            TC)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('roadmap_5_8')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'roadmap_5_8'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>
            2. Sắp Xếp Lộ Trình Kỳ 5, 6, 7, 8 & Đánh Giá Độ Khó ({roadmapQuotaAudit.totalPlannedCredits}/58 TC)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cpa_retake')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            subTab === 'cpa_retake'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>3. Giả Lập CPA Mục Tiêu & Cải Thiện Môn D+ (OOP)</span>
        </button>
      </div>

      {/* SUB-TAB 1: REDESIGNED BEAUTIFUL TIMETABLE & SEMESTER 5 IN-PROGRESS COURSES */}
      {subTab === 'timetable_sem5' && (
        <div className="space-y-5">
          {/* Full-Width High-Clarity Weekly Timetable Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Thời Khóa Biểu Học Kỳ 5 — Phạm Ngọc Huân
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                    6 Học phần • 16 Tín chỉ
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lịch học chuẩn theo từng Tiết (Tiết 1: 07h00 ➔ Tiết 12: 18h30) kèm Mã lớp, Phòng học và Độ khó thực tế
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSession((s) => !s)}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddSession ? 'Đóng khung thêm' : 'Thêm ca học mới'}</span>
              </button>
            </div>

            {showAddSession && (
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <input
                  type="text"
                  placeholder="Mã HP (VD: MAT3533)"
                  value={newSession.course_code || ''}
                  onChange={(e) => setNewSession({ ...newSession, course_code: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                />
                <input
                  type="text"
                  placeholder="Tên môn (VD: Học máy)"
                  value={newSession.course_name || ''}
                  onChange={(e) => setNewSession({ ...newSession, course_name: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                />
                <input
                  type="text"
                  placeholder="Phòng học (VD: 101T5)"
                  value={newSession.room || ''}
                  onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                />
                <select
                  value={newSession.day_of_week || 2}
                  onChange={(e) =>
                    setNewSession({ ...newSession, day_of_week: Number(e.target.value) })
                  }
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
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
                    className="w-14 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border text-center font-bold"
                    title="Tiết bắt đầu"
                  />
                  <span>➔</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newSession.end_period || 2}
                    onChange={(e) =>
                      setNewSession({ ...newSession, end_period: Number(e.target.value) })
                    }
                    className="w-14 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border text-center font-bold"
                    title="Tiết kết thúc"
                  />
                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold shrink-0"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}

            {/* Fixed-Layout Beautiful Timetable Table */}
            <div className="overflow-x-auto rounded-2xl border-2 border-emerald-500/40 dark:border-slate-700 shadow-sm">
              <table className="w-full table-fixed min-w-[920px] border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white text-xs font-extrabold">
                    <th className="w-[54px] py-3 px-2 border-r border-white/20 text-center">
                      Tiết
                    </th>
                    <th className="w-[106px] py-3 px-2 border-r border-white/20 text-center">
                      Thời gian
                    </th>
                    {DAYS_OF_WEEK.map((d) => (
                      <th
                        key={d.day}
                        className="py-3 px-2 border-r last:border-r-0 border-white/20 text-center"
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
                        <tr className="bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-extrabold text-center">
                          <td className="py-2 border-y border-r border-emerald-300 dark:border-slate-700 text-[11px]">
                            Trưa
                          </td>
                          <td className="py-2 border-y border-r border-emerald-300 dark:border-slate-700 text-[11px]">
                            12:30 - 13:00
                          </td>
                          <td
                            colSpan={6}
                            className="py-2 border-y border-emerald-300 dark:border-slate-700 tracking-widest uppercase text-[11px]"
                          >
                            ☀️ Nghỉ ăn trưa & Chuyển sang ca học buổi chiều
                          </td>
                        </tr>
                      )}
                      <tr className="h-[46px] hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="border-b border-r border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-slate-800/90 text-center font-extrabold text-slate-700 dark:text-slate-200">
                          {period}
                        </td>
                        <td className="border-b border-r border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-slate-800/50 text-center font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
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
                              bg: 'bg-sky-500',
                              border: 'border-sky-600',
                              titleText: 'text-white',
                              subText: 'text-sky-100',
                              badgeBg: 'bg-white/20 text-white',
                            };

                            return (
                              <td
                                key={d.day}
                                rowSpan={span}
                                className="border-b border-r border-slate-200 dark:border-slate-800 p-1 align-stretch"
                              >
                                <div
                                  className={`w-full h-full min-h-[78px] rounded-xl border-2 p-2.5 flex flex-col justify-between relative group shadow-sm transition-transform hover:scale-[1.01] ${palette.bg} ${palette.border}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(startingSession.id)}
                                    title="Xóa ca học này"
                                    className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-black/25 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center transition-all"
                                  >
                                    ✕
                                  </button>

                                  <div>
                                    <div
                                      className={`font-extrabold text-xs leading-snug pr-4 break-words ${palette.titleText}`}
                                    >
                                      {startingSession.course_name}
                                    </div>
                                    {startingSession.room && (
                                      <div
                                        className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${palette.subText}`}
                                      >
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{startingSession.room}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-current/10">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${palette.badgeBg}`}
                                    >
                                      {startingSession.class_code || startingSession.course_code}
                                    </span>
                                    <span className={`text-[10px] font-bold ${palette.subText}`}>
                                      Tiết {startingSession.start_period}-{startingSession.end_period}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={d.day}
                              className="border-b border-r border-slate-100 dark:border-slate-800/70"
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

          {/* 6 Semester 5 Course Cards Grid Below with Star Difficulty, Category Badge & Quick Grade Completion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  Chi Tiết 6 Học Phần Đang Học Kỳ 5 (Đánh giá độ khó & Chốt điểm nhanh)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sem5InProgressCourses.map((c) => {
                const diff = getCourseDifficulty(c.code);
                const badge = getCourseBadgeType(c);
                return (
                  <div
                    key={c.code}
                    className="p-4 rounded-2xl bg-sky-50/40 dark:bg-slate-800/60 border border-sky-200/80 dark:border-slate-700 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.style}`}>
                          {badge.short}
                        </span>
                        <StarRatingBadge stars={diff.stars} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-xs text-sky-700 dark:text-sky-400">
                            {c.code} • {c.credits} Tín chỉ
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {diff.levelLabel}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                          {c.name_vi}
                        </h5>
                      </div>

                      {c.schedule_info && (
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-sky-100 dark:border-slate-700">
                          🕒 {c.schedule_info}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">
                          Ghi chú:
                        </span>
                        <input
                          type="text"
                          value={c.note || ''}
                          onChange={(e) =>
                            onUpdateCourseFullState(c.code, { note: e.target.value })
                          }
                          placeholder="Ghi chú môn học..."
                          className="flex-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-sky-200/60 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="4.0"
                          max="10.0"
                          placeholder="Điểm 10"
                          value={quickScoreMap[c.code] ?? ''}
                          onChange={(e) =>
                            setQuickScoreMap((prev) => ({ ...prev, [c.code]: e.target.value }))
                          }
                          className="w-20 px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleCompleteSem5Course(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Chốt điểm</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDropSem5Course(c, 6)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200"
                        title="Rút môn này khỏi Kỳ 5 và chuyển sang Kỳ 6"
                      >
                        Rút sang K6
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DETAILED ROADMAP PLANNER (SEMESTERS 5, 6, 7, 8) + STAR DIFFICULTY & HUS COMMUNITY REVIEWS */}
      {subTab === 'roadmap_5_8' && (
        <div className="space-y-5">
          {/* Top Quota Progress Tracker for the 58 Remaining Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-extrabold text-sky-700 dark:text-sky-400">
                <span>1. Môn Bắt Buộc Còn Lại (Khối I, IV, V.1)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    roadmapQuotaAudit.mandatoryI_IV_V1_Tc === 35
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {roadmapQuotaAudit.mandatoryI_IV_V1_Tc} / 35 TC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Gồm: THL1057 (2 TC Khối I) + Tối ưu hóa & PPNCKH (6 TC Khối IV) + 9 môn Bắt buộc ngành V.1 (27 TC).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-extrabold text-teal-700 dark:text-teal-400">
                <span>2. Tự Chọn V.2.1 (Kỹ Năng PM)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    roadmapQuotaAudit.electiveV21_Tc >= 4
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {roadmapQuotaAudit.electiveV21_Tc} / 4 TC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Chọn đúng 2 môn (4/8 TC) trong 4 môn: NNLT thứ 2 (2 TC), Mobile (2 TC), Game (2 TC), Nhúng (2 TC).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                <span>3. Tự Chọn V.2.2 (AI & PTPM)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    roadmapQuotaAudit.electiveV22_Tc >= 12
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {roadmapQuotaAudit.electiveV22_Tc} / 12 TC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Chọn đúng 4 môn (12/39 TC) trong 13 môn chuyên sâu (Khuyên chọn: Khai phá DL, Thống kê nhiều chiều, Giải tích số, NLP).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-700 dark:text-amber-400">
                <span>4. Khối V.3 Tốt Nghiệp</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    roadmapQuotaAudit.gradV3_Tc >= 7
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {roadmapQuotaAudit.gradV3_Tc} / 7 TC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Phương án 1: Khóa luận tốt nghiệp MAT4080 (7 TC) • Phương án 2: MAT1203 (4 TC) + MAT3377 (3 TC).
              </p>
            </div>
          </div>

          {/* Prerequisite Validation Banner */}
          {roadmapQuotaAudit.warnings.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cảnh báo Điều kiện Tiên quyết trong lịch dự kiến:
              </div>
              {roadmapQuotaAudit.warnings.map((w) => (
                <div key={w.code}>
                  • Học phần <strong>{w.code} - {w.name}</strong> (đang xếp ở Kỳ {w.semester}) cần hoàn thành trước:{' '}
                  <strong>{w.missingPrereqs.join(', ')}</strong>.
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 text-xs text-emerald-800 dark:text-emerald-200 font-semibold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Hợp lệ 100% Tiên quyết QĐ 3568! Toàn bộ chuỗi môn Kỳ 5 (16 TC) ➔ Kỳ 6 (18 TC) ➔ Kỳ 7 (17 TC) ➔ Kỳ 8 (7 TC) đều thỏa mãn điều kiện mở khóa.
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-extrabold shrink-0">
                Tổng đã xếp: {roadmapQuotaAudit.totalPlannedCredits}/58 TC
              </span>
            </div>
          )}

          {/* 4 Columns for Semesters 5, 6, 7, 8 with Explicit Category Badges & Star Difficulty */}
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
                  className={`rounded-2xl border p-3.5 flex flex-col justify-between ${
                    sem === 5
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                      : 'bg-sky-50/50 dark:bg-slate-800/50 border-sky-200/80 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-sky-200/70 dark:border-slate-700">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {sem === 5 ? '🔥 Học kỳ 5 (Đang học)' : `Học kỳ ${sem} (Dự kiến)`}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {semCourses.length} môn • Độ khó TB: <strong>{avgDiff}★</strong>
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold text-white ${
                          sem === 5 ? 'bg-amber-500' : 'bg-sky-600'
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
                            className={`p-3 rounded-xl bg-white dark:bg-slate-900 border shadow-sm space-y-1.5 cursor-pointer transition-all hover:border-sky-400 ${
                              selectedReviewCourseCode === c.code
                                ? 'ring-2 ring-sky-500 border-sky-500'
                                : 'border-sky-100 dark:border-slate-700'
                            }`}
                          >
                            {/* Top Badge: Mandatory vs Elective V.2.1 / V.2.2 + Star Rating */}
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${badge.style}`}
                              >
                                {badge.short}
                              </span>
                              <StarRatingBadge stars={diff.stars} />
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <span className="font-mono font-extrabold text-xs text-sky-700 dark:text-sky-400">
                                {c.code}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {c.credits} TC
                              </span>
                            </div>

                            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                              {c.name_vi}
                            </div>

                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              💡 {diff.levelLabel}
                            </div>

                            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400">Đổi kỳ:</span>
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
                                    className={`w-5 h-5 rounded text-[10px] font-bold ${
                                      sem === targetSem
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100'
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
                                  title="Bỏ khỏi lịch dự kiến"
                                  className="px-1.5 h-5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100"
                                >
                                  ✕
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

          {/* Course Review & Elective Selector Catalog (Ranked 0-5 Stars from Góc nhìn HUS) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Bảng Xếp Hạng Độ Khó (0 - 5 Sao) & Review Chọn Môn Tự Chọn (Tham khảo Góc nhìn HUS)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phân loại rõ môn Bắt buộc, Tự chọn Kỹ năng PM (V.2.1 - chọn 4/8 TC), Tự chọn AI & PTPM (V.2.2 - chọn 12/39 TC) kèm đánh giá độ khó để bạn chọn môn dễ kéo CPA nhất
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 bg-sky-50 dark:bg-slate-800 p-1 rounded-xl border border-sky-200 dark:border-slate-700">
                  {(
                    [
                      { id: 'all', label: 'Tất cả môn chưa học' },
                      { id: 'mandatory', label: 'Bắt buộc (Khối I, IV, V.1)' },
                      { id: 'v21', label: 'Tự chọn V.2.1 (Chọn 4/8 TC)' },
                      { id: 'v22', label: 'Tự chọn V.2.2 (Chọn 12/39 TC)' },
                      { id: 'v3', label: 'Tốt nghiệp V.3 (7 TC)' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPoolCategoryFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        poolCategoryFilter === tab.id
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={poolSortBy}
                  onChange={(e) => setPoolSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl font-bold bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700"
                >
                  <option value="easiest">⭐ Xếp từ Dễ thở nhất ➔ Khó nhất</option>
                  <option value="hardest">🔥 Xếp từ Khó nhất ➔ Dễ nhất</option>
                  <option value="code">🔤 Xếp theo Mã học phần</option>
                </select>
              </div>
            </div>

            {/* Selected Course Detailed HUS Community Review Box */}
            {selectedReviewCourse && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/40 to-amber-50/40 dark:from-slate-800 dark:to-slate-800/70 border-2 border-sky-300 dark:border-sky-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-600 text-white font-mono font-extrabold text-xs">
                      {selectedReviewCourse.code} ({selectedReviewCourse.credits} TC)
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedReviewCourse.name_vi}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                        getCourseBadgeType(selectedReviewCourse).style
                      }`}
                    >
                      {getCourseBadgeType(selectedReviewCourse).text}
                    </span>
                    <StarRatingBadge
                      stars={getCourseDifficulty(selectedReviewCourse.code).stars}
                    />
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    💬 <strong>Review Góc nhìn HUS & Kinh nghiệm thực tế:</strong>{' '}
                    {getCourseDifficulty(selectedReviewCourse.code).husCommunityReview}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    🎯 <strong>Độ hợp với Phạm Ngọc Huân:</strong>{' '}
                    {getCourseDifficulty(selectedReviewCourse.code).fitWithHuan}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
                    Xếp ngay vào:
                  </span>
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          currentSem === sem
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-slate-600 hover:bg-sky-100'
                        }`}
                      >
                        Kỳ {sem}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid of All Courses in Pool with Star Ratings & 1-Click Semester Assignment */}
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
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isPlanned
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badge.style}`}
                        >
                          {badge.short}
                        </span>
                        <StarRatingBadge stars={diff.stars} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-sky-700 dark:text-sky-400">
                          {c.code} ({c.credits} TC)
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {diff.levelLabel}
                        </span>
                      </div>

                      <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {c.name_vi}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                        {diff.husCommunityReview}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs">
                      {isPlanned ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold">
                          ✓ Đã xếp Kỳ {assignedSem}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Chưa xếp vào lộ trình
                        </span>
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
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              assignedSem === sem
                                ? 'bg-sky-600 text-white'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-100'
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

      {/* SUB-TAB 3: CPA TARGET CALCULATOR & D/D+ RETAKE SIMULATOR */}
      {subTab === 'cpa_retake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-sky-600" />
                1. Bộ Tính Điểm Mục Tiêu Toàn Khóa (129 TC)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tính điểm trung bình hệ 4 cần đạt cho {simResult.remainingCredits} tín chỉ còn lại
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Chọn hoặc kéo thanh CPA toàn khóa mong muốn:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '3.20 (Giỏi)', val: 3.2 },
                  { label: '3.40 (Mục tiêu Excel)', val: 3.4 },
                  { label: '3.50 (Giỏi cao)', val: 3.5 },
                  { label: '3.60 (Xuất sắc)', val: 3.6 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => onChangeTargetCpa(preset.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      Math.abs(targetCpa - preset.val) < 0.005
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-sky-200 dark:border-slate-700 hover:bg-sky-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input
                  type="range"
                  min="3.00"
                  max="3.80"
                  step="0.01"
                  value={targetCpa}
                  onChange={(e) => onChangeTargetCpa(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <span className="px-3 py-1 rounded-xl bg-sky-600 text-white font-extrabold text-sm shrink-0">
                  {targetCpa.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Nếu KHÔNG Học Cải Thiện
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  CPA hiện tại: <strong>{simResult.baseCpa4.toFixed(2)}</strong>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500">
                    Mức GPA cần đạt cho {simResult.remainingCredits} TC còn lại:
                  </div>
                  <div
                    className={`text-2xl font-extrabold mt-0.5 ${
                      simResult.baseRequiredForRemaining > 4.0
                        ? 'text-rose-600'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {simResult.baseRequiredForRemaining.toFixed(2)} / 4.00
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/90 dark:bg-sky-950/40 border-2 border-sky-400 dark:border-sky-500">
                <div className="text-[11px] font-bold uppercase text-sky-700 dark:text-sky-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sau Khi Cải Thiện ({simResult.retakeCredits} TC)
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  CPA mới nhảy lên:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {simResult.newCpa4.toFixed(2)}
                  </strong>{' '}
                  (+{(simResult.newCpa4 - simResult.baseCpa4).toFixed(2)})
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Mức GPA cần đạt cho {simResult.remainingCredits} TC còn lại giảm còn:
                  </div>
                  <div className="text-2xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {simResult.newRequiredForRemaining.toFixed(2)} / 4.00
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-sky-600" />
                  2. Mô Phỏng Học Cải Thiện (Quy Chế ĐHQGHN: Chỉ Môn Điểm D / D+)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Duy nhất môn <strong>MAT1202 - Lập trình hướng đối tượng (3 TC - D+)</strong> đủ điều kiện đăng ký học cải thiện.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateRetakePlan({ MAT1202: 'A' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-sm"
                >
                  ⚡ Cải thiện OOP lên A (3.7)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateRetakePlan({ MAT1202: 'A+' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                >
                  🔥 Cải thiện OOP lên A+ (4.0)
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
                    className={`p-4 rounded-xl border-2 transition-all flex flex-wrap items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-500 dark:border-sky-400 shadow-sm'
                        : 'bg-rose-50/50 dark:bg-slate-800/50 border-rose-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRetake(course.code, 'A')}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold uppercase">
                            Được phép cải thiện (Điểm {course.letter})
                          </span>
                          <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400">
                            {course.code}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {course.name_vi} ({course.credits} TC)
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Điểm hiện tại (Kỳ {course.semester}):{' '}
                          <strong className="text-rose-600 dark:text-rose-400">
                            {course.letter} ({course.score4?.toFixed(1)} hệ 4 • {course.score10} hệ 10)
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={targetLetter}
                        disabled={!isSelected}
                        onChange={(e) => handleChangeRetakeGrade(course.code, e.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-white dark:bg-slate-900 border border-sky-300 dark:border-slate-600 text-sky-700 dark:text-sky-300"
                      >
                        <option value="A+">A+ (4.0)</option>
                        <option value="A">A (3.7)</option>
                        <option value="B+">B+ (3.5)</option>
                      </select>

                      <div className="text-right min-w-[110px]">
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          +{gainPoints} điểm tích lũy
                        </div>
                        <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                          CPA +{singleCpaJump}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {nonRetakeableLowCourses.length > 0 && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  🔒 Các môn điểm C / C+ (Đã khóa — Không được học cải thiện theo quy chế ĐHQGHN):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nonRetakeableLowCourses.map((c) => (
                    <div
                      key={c.code}
                      className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-75 text-xs"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {c.code} - {c.name_vi} ({c.credits} TC)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
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
