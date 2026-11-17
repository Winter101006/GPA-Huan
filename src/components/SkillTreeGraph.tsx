import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  NodeChange,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  BookOpen,
  Clock,
  Globe2,
  GitBranch,
  Layers,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Focus,
  RotateCcw,
  LayoutGrid,
  Compass,
  SlidersHorizontal,
  PlayCircle,
  Edit3,
  Star,
} from 'lucide-react';
import { Course, KnowledgeLink, CourseUserState } from '../types/academic';
import { score10ToGrade } from '../utils/academicMath';
import { getCourseDifficulty, getCourseCategoryMeta } from '../utils/courseReviews';

interface SkillTreeGraphProps {
  courses: Course[];
  knowledgeLinks: KnowledgeLink[];
  onToggleCourseCompleted: (code: string, completed: boolean, defaultScore10?: number) => void;
  onUpdateCourseScore: (code: string, score10: number) => void;
  onUpdateCourseFullState: (code: string, partialState: Partial<CourseUserState>) => void;
}

interface CustomCourseNodeData {
  course: Course;
  selected: boolean;
  isConnectedToSelected: boolean;
  dimmed: boolean;
  isPositionLocked: boolean;
  onToggle: (code: string, completed: boolean) => void;
  onSelect: (course: Course) => void;
  incomingKnowledgeCount: number;
  outgoingKnowledgeCount: number;
  [key: string]: unknown;
}

interface SemesterHeaderNodeData {
  semester: number;
  title: string;
  count: number;
  completedCount: number;
  inProgressCount: number;
  totalCredits: number;
  [key: string]: unknown;
}

const SemesterHeaderNode: React.FC<NodeProps<Node<SemesterHeaderNodeData>>> = ({ data }) => {
  const isCurrentSem5 = data.semester === 5;
  return (
    <div
      className={`w-[260px] rounded-2xl text-white p-3 shadow-md border-2 pointer-events-none select-none ${
        isCurrentSem5
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300'
          : 'bg-gradient-to-r from-sky-600 to-sky-500 border-sky-300 dark:border-sky-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-lg">
          {isCurrentSem5 ? '🔥 KỲ 5 (ĐANG HỌC)' : `CỘT HỌC KỲ ${data.semester}`}
        </span>
        <span className="text-xs font-bold text-white/90">{data.totalCredits} TC</span>
      </div>
      <div className="text-sm font-extrabold mt-1">{data.title}</div>
      <div className="text-[11px] text-white/90 mt-0.5 flex items-center justify-between">
        <span>Tổng: {data.count} môn</span>
        {data.inProgressCount > 0 ? (
          <span>Đang học: {data.inProgressCount} môn</span>
        ) : (
          <span>Đã xong: {data.completedCount}/{data.count}</span>
        )}
      </div>
    </div>
  );
};

const CourseGraphNode: React.FC<NodeProps<Node<CustomCourseNodeData>>> = ({ data }) => {
  const {
    course,
    selected,
    isConnectedToSelected,
    dimmed,
    isPositionLocked,
    onToggle,
    onSelect,
    incomingKnowledgeCount,
  } = data;
  const isCompleted = course.completed;
  const isInProgress = course.in_progress && !isCompleted;
  const isReady = course.status === 'ready';

  const statusStyles = isCompleted
    ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-500/10'
    : isInProgress
    ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-500 dark:border-amber-400 text-amber-950 dark:text-amber-100 shadow-md shadow-amber-500/15 ring-2 ring-amber-300/60'
    : isReady
    ? 'bg-white/95 dark:bg-slate-900/95 border-sky-400 dark:border-sky-400 text-slate-800 dark:text-slate-100 ready-node-glow'
    : 'bg-slate-100/95 dark:bg-slate-900/75 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400';

  const highlightStyles = selected
    ? 'ring-4 ring-sky-500 dark:ring-sky-400 scale-[1.03] z-30 shadow-xl'
    : isConnectedToSelected
    ? 'ring-2 ring-amber-400 dark:ring-amber-400 z-20 shadow-lg'
    : dimmed
    ? 'opacity-35 hover:opacity-90'
    : 'opacity-100';

  return (
    <div
      onClick={() => onSelect(course)}
      className={`w-[260px] rounded-2xl border-2 p-3 transition-all duration-200 ${
        isPositionLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      } select-none backdrop-blur-md ${statusStyles} ${highlightStyles}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white"
      />

      {/* Top row: Checkbox "Đã học" + Code + Credits */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(course.code, !isCompleted);
          }}
          title={isCompleted ? 'Bỏ tích Đã học' : 'Tích chọn Đã học môn này'}
          className={`nodrag flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-colors border shadow-sm cursor-pointer ${
            isCompleted
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : isInProgress
              ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
              : 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-slate-600 hover:bg-sky-100'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Đã học</span>
            </>
          ) : isInProgress ? (
            <>
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Đang học K5</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>Đã học</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          <span className="text-xs font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {course.code}
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
            {course.credits} TC
          </span>
        </div>
      </div>

      {/* Course Vietnamese Title */}
      <div className="font-extrabold text-[13px] leading-snug line-clamp-2 min-h-[34px] mb-1">
        {course.name_vi}
      </div>

      {/* Category & 0-5 Star Difficulty Sub-Row */}
      {(() => {
        const cat = getCourseCategoryMeta(course);
        const diff = getCourseDifficulty(course.code);
        return (
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border truncate ${cat.badgeBg}`}
            >
              {cat.shortBadge}
            </span>
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0"
              title={`Độ khó: ${diff.stars}/5 sao (${diff.levelLabel})`}
            >
              {'★'.repeat(Math.round(diff.stars))}
              <span className="text-slate-300 dark:text-slate-600">
                {'★'.repeat(Math.max(0, 5 - Math.round(diff.stars)))}
              </span>
            </span>
          </div>
        );
      })()}

      {/* Bottom row: Grade Badge OR Status Badge */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-700/70">
        {isCompleted ? (
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kỳ {course.semester}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-sm">
              {course.letter || 'A'} ({course.score4?.toFixed(1) ?? '3.7'}) •{' '}
              {course.score10?.toFixed(1) ?? '8.7'}
            </span>
          </div>
        ) : isInProgress ? (
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 truncate">
              🔥 Kỳ 5: {course.note || 'Đang học'}
            </span>
          </div>
        ) : isReady ? (
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-600 dark:text-sky-400">
              <Sparkles className="w-3.5 h-3.5" />
              Đủ TQ (Dự kiến K{course.planned_semester || course.recommended_semester})
            </span>
            {incomingKnowledgeCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                +{incomingKnowledgeCount} nền
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              <Lock className="w-3 h-3 shrink-0" />
              Cần: {course.prerequisites.join(', ')}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white"
      />
    </div>
  );
};

const nodeTypes = {
  courseNode: CourseGraphNode,
  semesterHeader: SemesterHeaderNode,
};

const SEMESTER_TITLES: Record<number, string> = {
  1: 'Nền tảng Đại cương & Lập trình',
  2: 'Toán Cơ sở, ĐSTT & OOP',
  3: 'Cấu trúc DL, Toán rời rạc & GT3',
  4: 'Xác suất, CSDL, PTVP & HĐH',
  5: '6 Môn Đang Học (16 Tín chỉ)',
  6: 'Chuyên ngành & Tự chọn AI/Data',
  7: 'Chuyên sâu NLP, CV & ATTT',
  8: 'Khóa luận Tốt nghiệp (7 TC)',
};

const SkillTreeInner: React.FC<SkillTreeGraphProps> = ({
  courses,
  knowledgeLinks,
  onToggleCourseCompleted,
  onUpdateCourseScore,
  onUpdateCourseFullState,
}) => {
  const reactFlowInstance = useReactFlow();

  // Default to LOCKED position so clicking a node NEVER accidentally shifts its position!
  const [isPositionLocked, setIsPositionLocked] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'columns'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'completed' | 'in_progress' | 'ready' | 'locked'
  >('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showKnowledgeLinks, setShowKnowledgeLinks] = useState<boolean>(true);
  const [showHardPrereqs, setShowHardPrereqs] = useState<boolean>(true);
  const [onlyFocusSelectedLinks, setOnlyFocusSelectedLinks] = useState<boolean>(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('MAT3533');

  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(
    {}
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.code === selectedCourseCode) || courses[0],
    [courses, selectedCourseCode]
  );

  const courseMap = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      map[c.code] = c;
    });
    return map;
  }, [courses]);

  const focusOnNode = useCallback(
    (nodeId: string, zoomLevel = 1.05) => {
      setTimeout(() => {
        const node = reactFlowInstance.getNode(nodeId);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 130, node.position.y + 80, {
            zoom: zoomLevel,
            duration: 600,
          });
        }
      }, 40);
    },
    [reactFlowInstance]
  );

  const focusOnSemesterColumn = useCallback(
    (sem: number) => {
      const headerNode = reactFlowInstance.getNode(`sem-header-${sem}`);
      if (headerNode) {
        reactFlowInstance.setCenter(headerNode.position.x + 130, headerNode.position.y + 360, {
          zoom: 0.8,
          duration: 600,
        });
      }
    },
    [reactFlowInstance]
  );

  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourseCode(course.code);
  }, []);

  const handleSelectAndFlyTo = useCallback(
    (code: string) => {
      setSelectedCourseCode(code);
      if (viewMode === 'canvas') {
        focusOnNode(code, 1.05);
      }
    },
    [viewMode, focusOnNode]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (!c.counts_gpa && blockFilter !== 'conditional') return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (blockFilter !== 'all') {
        if (blockFilter === 'conditional' && c.counts_gpa) return false;
        if (blockFilter !== 'conditional' && c.block !== blockFilter && c.sub_block !== blockFilter)
          return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          c.name_vi.toLowerCase().includes(q) ||
          c.name_en.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [courses, statusFilter, blockFilter, searchQuery]);

  const connectedCodesSet = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.code === selectedCourseCode) {
        c.prerequisites.forEach((p) => set.add(p));
      }
      if (c.prerequisites.includes(selectedCourseCode)) {
        set.add(c.code);
      }
    });
    if (showKnowledgeLinks) {
      knowledgeLinks.forEach((l) => {
        if (l.source === selectedCourseCode) set.add(l.target);
        if (l.target === selectedCourseCode) set.add(l.source);
      });
    }
    return set;
  }, [courses, knowledgeLinks, selectedCourseCode, showKnowledgeLinks]);

  const { baseNodes, edges, colGroups } = useMemo(() => {
    const groups: Record<number, Course[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
    };

    filteredCourses.forEach((c) => {
      const targetCol = c.completed
        ? c.semester
        : c.in_progress
        ? 5
        : c.planned_semester || c.recommended_semester;
      const col = Math.min(Math.max(targetCol, 1), 8);
      if (!groups[col]) groups[col] = [];
      groups[col].push(c);
    });

    const visibleCodes = new Set(filteredCourses.map((c) => c.code));
    const computedNodes: Node[] = [];
    const colWidth = 345;
    const rowHeight = 168;

    Object.entries(groups).forEach(([colStr, list]) => {
      const col = Number(colStr);
      if (list.length === 0) return;

      computedNodes.push({
        id: `sem-header-${col}`,
        type: 'semesterHeader',
        draggable: false,
        selectable: false,
        position: {
          x: (col - 1) * colWidth + 40,
          y: 20,
        },
        data: {
          semester: col,
          title: SEMESTER_TITLES[col] || `Học kỳ ${col}`,
          count: list.length,
          completedCount: list.filter((c) => c.completed).length,
          inProgressCount: list.filter((c) => c.in_progress && !c.completed).length,
          totalCredits: list.reduce((s, c) => s + c.credits, 0),
        },
      });

      list.forEach((course, idx) => {
        const inK = knowledgeLinks.filter((l) => l.target === course.code).length;
        const outK = knowledgeLinks.filter((l) => l.source === course.code).length;
        const savedPos = customPositions[course.code];

        const isSelected = course.code === selectedCourseCode;
        const isConnected = connectedCodesSet.has(course.code);

        computedNodes.push({
          id: course.code,
          type: 'courseNode',
          draggable: !isPositionLocked,
          position: savedPos || {
            x: (col - 1) * colWidth + 40,
            y: idx * rowHeight + 132,
          },
          data: {
            course,
            selected: isSelected,
            isConnectedToSelected: isConnected,
            dimmed: onlyFocusSelectedLinks && !isSelected && !isConnected,
            isPositionLocked,
            onToggle: onToggleCourseCompleted,
            onSelect: handleSelectCourse,
            incomingKnowledgeCount: inK,
            outgoingKnowledgeCount: outK,
          },
        });
      });
    });

    const computedEdges: Edge[] = [];

    if (showHardPrereqs) {
      filteredCourses.forEach((targetCourse) => {
        targetCourse.prerequisites.forEach((prereqCode) => {
          if (!visibleCodes.has(prereqCode)) return;
          const isHighlighted =
            targetCourse.code === selectedCourseCode || prereqCode === selectedCourseCode;
          if (onlyFocusSelectedLinks && !isHighlighted) return;

          const prereqDone = courseMap[prereqCode]?.completed;

          computedEdges.push({
            id: `hard-${prereqCode}-${targetCourse.code}`,
            source: prereqCode,
            target: targetCourse.code,
            type: 'smoothstep',
            animated: !prereqDone || isHighlighted,
            label: isHighlighted ? 'Tiên quyết bắt buộc' : undefined,
            labelStyle: { fill: '#0284c7', fontWeight: 800, fontSize: 11 },
            labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.95 },
            style: {
              stroke: isHighlighted ? '#0284c7' : prereqDone ? '#10b981' : '#64748b',
              strokeWidth: isHighlighted ? 3.5 : 2.2,
              opacity: isHighlighted ? 1 : onlyFocusSelectedLinks ? 0.15 : 0.78,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isHighlighted ? '#0284c7' : prereqDone ? '#10b981' : '#64748b',
              width: 18,
              height: 18,
            },
          });
        });
      });
    }

    if (showKnowledgeLinks) {
      knowledgeLinks.forEach((kLink, idx) => {
        if (!visibleCodes.has(kLink.source) || !visibleCodes.has(kLink.target)) return;
        const isHighlighted =
          kLink.source === selectedCourseCode || kLink.target === selectedCourseCode;

        if (onlyFocusSelectedLinks && !isHighlighted) return;

        computedEdges.push({
          id: `know-${kLink.source}-${kLink.target}-${idx}`,
          source: kLink.source,
          target: kLink.target,
          type: 'default',
          animated: isHighlighted,
          label: isHighlighted ? `💡 ${kLink.label}` : undefined,
          labelStyle: { fill: '#b45309', fontWeight: 800, fontSize: 11 },
          labelBgStyle: { fill: '#fffbeb', fillOpacity: 0.96, stroke: '#f59e0b' },
          style: {
            stroke: isHighlighted ? '#f59e0b' : '#a855f7',
            strokeWidth: isHighlighted ? 3.2 : 1.8,
            strokeDasharray: '6 4',
            opacity: isHighlighted ? 1 : 0.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? '#f59e0b' : '#a855f7',
            width: 16,
            height: 16,
          },
        });
      });
    }

    return { baseNodes: computedNodes, edges: computedEdges, colGroups: groups };
  }, [
    filteredCourses,
    knowledgeLinks,
    selectedCourseCode,
    connectedCodesSet,
    showHardPrereqs,
    showKnowledgeLinks,
    onlyFocusSelectedLinks,
    isPositionLocked,
    onToggleCourseCompleted,
    handleSelectCourse,
    courseMap,
    customPositions,
  ]);

  const [nodes, setNodes] = useState<Node[]>(baseNodes);

  useEffect(() => {
    setNodes(baseNodes);
  }, [baseNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isPositionLocked) return;
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        changes.forEach((ch) => {
          if (ch.type === 'position' && ch.position && !ch.id.startsWith('sem-header-')) {
            setCustomPositions((prev) => ({
              ...prev,
              [ch.id]: ch.position!,
            }));
          }
        });
        return updated;
      });
    },
    [isPositionLocked]
  );

  const handleResetLayout = useCallback(() => {
    setCustomPositions({});
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.12, duration: 500 });
    }, 60);
  }, [reactFlowInstance]);

  const inspectorDetails = useMemo(() => {
    if (!selectedCourse) return null;

    const hardPrereqs = selectedCourse.prerequisites.map((code) => courseMap[code]).filter(Boolean);
    const unlockedNext = courses.filter((c) => c.prerequisites.includes(selectedCourse.code));

    const incomingKnowledge = knowledgeLinks
      .filter((l) => l.target === selectedCourse.code)
      .map((l) => ({
        ...l,
        sourceCourse: courseMap[l.source],
      }));

    const outgoingKnowledge = knowledgeLinks
      .filter((l) => l.source === selectedCourse.code)
      .map((l) => ({
        ...l,
        targetCourse: courseMap[l.target],
      }));

    return {
      hardPrereqs,
      unlockedNext,
      incomingKnowledge,
      outgoingKnowledge,
    };
  }, [selectedCourse, courseMap, courses, knowledgeLinks]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-sky-50 dark:bg-slate-950 p-4 overflow-hidden flex flex-col gap-3'
          : 'space-y-3'
      }
    >
      {/* STREAMLINED SINGLE-ROW CONTROL BAR (Clean, Modern, Uncluttered) */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 border border-sky-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: View Mode + Lock Position Toggle + Semester Quick Jump */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Switch Graph vs 8-Column Board */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Sơ đồ Cây
              </button>
              <button
                type="button"
                onClick={() => setViewMode('columns')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                  viewMode === 'columns'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Bảng 8 Cột Kỳ
              </button>
            </div>

            {/* LOCK / UNLOCK NODE POSITIONS BUTTON */}
            {viewMode === 'canvas' && (
              <button
                type="button"
                onClick={() => setIsPositionLocked((v) => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 shadow-sm ${
                  isPositionLocked
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                }`}
                title={
                  isPositionLocked
                    ? 'Vị trí các môn đang được KHÓA cố định để tránh bấm nhầm bị lệch. Click để mở khóa kéo thả.'
                    : 'Đang mở khóa kéo thả vị trí môn học. Click để khóa cố định lại.'
                }
              >
                {isPositionLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đã khóa vị trí môn (Chống bấm nhầm)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Đang mở kéo vị trí (Bấm để khóa)</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Jump Semester Pills */}
            {viewMode === 'canvas' && (
              <div className="hidden xl:flex items-center gap-1 bg-sky-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-sky-200/70 dark:border-slate-700">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 mr-1">
                  Tới nhanh:
                </span>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => focusOnSemesterColumn(sem)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold transition-all ${
                      sem === 5
                        ? 'bg-amber-500 text-white shadow-sm'
                        : sem <= 4
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-100'
                    }`}
                  >
                    K{sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Search + Filter Drawer Button + Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh mã / tên môn..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-sky-50/70 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((s) => !s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                showAdvancedFilters
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-sky-200 dark:border-slate-700 hover:bg-sky-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc & Đường nối</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 dark:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Secondary Filter Bar (Only shown when user clicks "Bộ lọc & Đường nối") */}
        {showAdvancedFilters && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tất cả môn' },
                  { id: 'completed', label: 'Đã học (23)' },
                  { id: 'in_progress', label: 'Đang học Kỳ 5 (6)' },
                  { id: 'ready', label: 'Sẵn sàng kỳ sau' },
                  { id: 'locked', label: 'Chưa đủ TQ' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    statusFilter === st.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg font-bold bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700"
              >
                <option value="all">Tất cả 5 Khối kiến thức</option>
                <option value="I">Khối I - Kiến thức chung</option>
                <option value="II">Khối II - Theo lĩnh vực</option>
                <option value="III">Khối III - Theo khối ngành</option>
                <option value="IV">Khối IV - Theo nhóm ngành</option>
                <option value="V.1">Khối V.1 - Bắt buộc ngành</option>
                <option value="V.2.1">Khối V.2.1 - Tự chọn Kỹ năng PM</option>
                <option value="V.2.2">Khối V.2.2 - Tự chọn AI & PTPM</option>
                <option value="V.3">Khối V.3 - Tốt nghiệp</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHardPrereqs((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-bold border ${
                  showHardPrereqs
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Tiên quyết QĐ 3568
              </button>
              <button
                type="button"
                onClick={() => setShowKnowledgeLinks((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-bold border ${
                  showKnowledgeLinks
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                Liên kết Kiến thức (33)
              </button>
              <button
                type="button"
                onClick={() => setOnlyFocusSelectedLinks((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-bold border ${
                  onlyFocusSelectedLinks
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Chỉ sáng nhánh đang chọn
              </button>
              {Object.keys(customPositions).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold"
                >
                  Khôi phục vị trí gốc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Split View: Graph/Columns (Left 8 cols) + Inspector & Direct Editor (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {viewMode === 'canvas' ? (
          <div
            className={`lg:col-span-8 ${
              isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-210px)] min-h-[600px]'
            } bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-sky-200 dark:border-slate-800 shadow-sm overflow-hidden relative`}
          >
            {/* Floating Camera Quick Controls inside Canvas */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-sky-200 dark:border-slate-700 shadow-sm text-xs">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 250 })}
                className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4 text-sky-600" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 250 })}
                className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4 text-sky-600" />
              </button>
              <button
                type="button"
                onClick={() => focusOnNode(selectedCourseCode, 1.1)}
                className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 flex items-center gap-1"
              >
                <Focus className="w-3.5 h-3.5" />
                <span>Giữa màn hình ({selectedCourseCode})</span>
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.12, duration: 450 })}
                className="px-2 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
              >
                Toàn cảnh
              </button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 20, y: 20, zoom: 0.75 }}
              minZoom={0.18}
              maxZoom={2.2}
              panOnScroll={false}
              zoomOnScroll={true}
              panOnDrag={true}
              nodesDraggable={!isPositionLocked}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#94a3b8" gap={24} size={1.2} />
              <Controls
                showInteractive={false}
                className="!bg-white dark:!bg-slate-800 !border-sky-200 dark:!border-slate-700 !rounded-xl !shadow-lg"
              />
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => {
                  if (n.type === 'semesterHeader') return '#0284c7';
                  const c = (n.data as CustomCourseNodeData)?.course;
                  if (!c) return '#94a3b8';
                  if (c.completed) return '#10b981';
                  if (c.in_progress) return '#f59e0b';
                  if (c.status === 'ready') return '#38bdf8';
                  return '#cbd5e1';
                }}
                maskColor="rgba(224, 242, 254, 0.55)"
                className="!bg-white/95 dark:!bg-slate-900/95 !border-2 !border-sky-300 dark:!border-slate-700 !rounded-xl !shadow-md cursor-pointer"
              />
            </ReactFlow>
          </div>
        ) : (
          /* MODE 2: 8-Column Board */
          <div
            className={`lg:col-span-8 ${
              isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-210px)] min-h-[600px]'
            } bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-sky-200 dark:border-slate-800 shadow-sm p-4 overflow-x-auto overflow-y-auto`}
          >
            <div className="flex gap-4 min-w-max pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const list = colGroups[sem] || [];
                const semTc = list.reduce((s, c) => s + c.credits, 0);
                return (
                  <div
                    key={sem}
                    className="w-[270px] shrink-0 rounded-2xl bg-sky-50/50 dark:bg-slate-800/50 border border-sky-200/80 dark:border-slate-700 p-3 space-y-3"
                  >
                    <div
                      className={`p-3 rounded-xl text-white shadow-sm ${
                        sem === 5
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-sky-600 to-sky-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span>{sem === 5 ? '🔥 KỲ 5 (ĐANG HỌC)' : `HỌC KỲ ${sem}`}</span>
                        <span>{semTc} TC</span>
                      </div>
                      <div className="text-xs font-bold text-white/90 mt-0.5">
                        {SEMESTER_TITLES[sem]}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {list.map((course) => {
                        const isSelected = course.code === selectedCourseCode;
                        const isConnected = connectedCodesSet.has(course.code);
                        return (
                          <div
                            key={course.code}
                            onClick={() => setSelectedCourseCode(course.code)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              course.completed
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500'
                                : course.in_progress
                                ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-500'
                                : course.status === 'ready'
                                ? 'bg-white dark:bg-slate-900 border-sky-400 shadow-sm'
                                : 'bg-slate-100/80 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-85'
                            } ${
                              isSelected
                                ? 'ring-4 ring-sky-500 scale-[1.02]'
                                : isConnected
                                ? 'ring-2 ring-amber-400'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleCourseCompleted(course.code, !course.completed);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                                  course.completed
                                    ? 'bg-emerald-600 text-white'
                                    : course.in_progress
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300'
                                }`}
                              >
                                {course.completed ? (
                                  <CheckSquare className="w-3 h-3" />
                                ) : (
                                  <Square className="w-3 h-3" />
                                )}
                                <span>{course.in_progress && !course.completed ? 'Đang học' : 'Đã học'}</span>
                              </button>
                              <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                {course.code} • {course.credits}TC
                              </span>
                            </div>

                            <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug mb-2">
                              {course.name_vi}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/70 dark:border-slate-700">
                              {course.completed ? (
                                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                                  Điểm: {course.letter} ({course.score4?.toFixed(1)}) •{' '}
                                  {course.score10}
                                </span>
                              ) : course.in_progress ? (
                                <span className="font-extrabold text-amber-700 dark:text-amber-300">
                                  🔥 Kỳ 5: {course.note || 'Đang học'}
                                </span>
                              ) : course.status === 'ready' ? (
                                <span className="font-extrabold text-sky-600 dark:text-sky-400">
                                  ✨ Đủ tiên quyết học ngay
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  🔒 Cần: {course.prerequisites.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Side: Inspector Panel + Direct Persistent Course Editor */}
        <div
          className={`lg:col-span-4 ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-210px)] min-h-[600px]'
          } overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-slate-800 shadow-sm p-5 space-y-4`}
        >
          {selectedCourse && inspectorDetails && (
            <>
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    {selectedCourse.code} ({selectedCourse.credits} TC)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedCourse.sub_block} • {selectedCourse.type}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedCourse.name_vi}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                  {selectedCourse.name_en}
                </p>

                {/* Category & 0-5 Star Difficulty Review Card */}
                {(() => {
                  const cat = getCourseCategoryMeta(selectedCourse);
                  const diff = getCourseDifficulty(selectedCourse.code);
                  return (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cat.badgeBg}`}
                        >
                          {cat.badgeText}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 font-extrabold text-amber-600 dark:text-amber-400">
                          <span>{'★'.repeat(Math.round(diff.stars))}</span>
                          <span className="text-slate-300 dark:text-slate-600">
                            {'★'.repeat(Math.max(0, 5 - Math.round(diff.stars)))}
                          </span>
                          <span className="text-[10px] ml-0.5">
                            ({diff.stars}/5 sao • {diff.levelLabel})
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-snug">
                        💬 <strong>Review Góc nhìn HUS:</strong> {diff.husCommunityReview}
                      </p>
                      <p className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                        🎯 {diff.fitWithHuan} ({diff.workload})
                      </p>
                    </div>
                  );
                })()}

                {/* DIRECT PERSISTENT EDITOR FOR THIS COURSE */}
                <div className="mt-3 p-3.5 rounded-xl bg-sky-50/90 dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-extrabold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    Cập nhật Trạng thái, Điểm & Học kỳ:
                  </div>

                  {/* 3-State Selector: Đã có điểm / Đang học Kỳ 5 / Chưa học */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCourseFullState(selectedCourse.code, {
                          completed: true,
                          in_progress: false,
                          score10: selectedCourse.score10 ?? 8.7,
                          letter: selectedCourse.letter ?? 'A',
                          score4: selectedCourse.score4 ?? 3.7,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition-all ${
                        selectedCourse.completed
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ✓ Đã hoàn thành
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCourseFullState(selectedCourse.code, {
                          completed: false,
                          in_progress: true,
                          semester: 5,
                          planned_semester: 5,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition-all ${
                        selectedCourse.in_progress && !selectedCourse.completed
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🔥 Đang học
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCourseFullState(selectedCourse.code, {
                          completed: false,
                          in_progress: false,
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition-all ${
                        !selectedCourse.completed && !selectedCourse.in_progress
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ⏳ Dự kiến học
                    </button>
                  </div>

                  {/* Semester & Score Editor */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        {selectedCourse.completed ? 'Học ở Kỳ:' : 'Xếp vào Học kỳ:'}
                      </label>
                      <select
                        value={
                          selectedCourse.completed
                            ? selectedCourse.semester
                            : selectedCourse.planned_semester || selectedCourse.recommended_semester
                        }
                        onChange={(e) => {
                          const sem = Number(e.target.value);
                          onUpdateCourseFullState(selectedCourse.code, {
                            semester: sem,
                            planned_semester: sem,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-sky-300 dark:border-slate-600"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Học kỳ {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCourse.completed && selectedCourse.counts_gpa && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Điểm hệ 10 ({selectedCourse.letter} - {selectedCourse.score4}):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={selectedCourse.score10 ?? 8.7}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val <= 10) {
                              onUpdateCourseScore(selectedCourse.code, val);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-white dark:bg-slate-900 border border-sky-300 dark:border-slate-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Personal Note / Teacher Note Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Ghi chú môn học / Giảng viên / Lịch học:
                    </label>
                    <input
                      type="text"
                      value={selectedCourse.note || ''}
                      onChange={(e) =>
                        onUpdateCourseFullState(selectedCourse.code, { note: e.target.value })
                      }
                      placeholder="VD: Chăm là được / Học thầy... / Khó..."
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: Hard Administrative Prerequisites */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  1. Môn tiên quyết bắt buộc ({inspectorDetails.hardPrereqs.length})
                </h4>
                {inspectorDetails.hardPrereqs.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 italic">
                    Không yêu cầu học phần tiên quyết hành chính bắt buộc.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {inspectorDetails.hardPrereqs.map((pre) => (
                      <div
                        key={pre.code}
                        onClick={() => handleSelectAndFlyTo(pre.code)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 flex items-center justify-between cursor-pointer transition-all bg-slate-50/70 dark:bg-slate-800/50"
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400">
                            {pre.code}
                          </span>{' '}
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            - {pre.name_vi}
                          </span>
                        </div>
                        {pre.completed ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Đã học: {pre.letter} ({pre.score10})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">
                            Chưa học
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Incoming Conceptual / Knowledge Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  2. Môn nền tảng kiến thức bổ trợ ({inspectorDetails.incomingKnowledge.length})
                </h4>
                {inspectorDetails.incomingKnowledge.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 italic">
                    Học phần gốc nền tảng cho các môn chuyên ngành phía sau.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectorDetails.incomingKnowledge.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          item.sourceCourse && handleSelectAndFlyTo(item.sourceCourse.code)
                        }
                        className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 cursor-pointer hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                            {item.source} — {item.sourceCourse?.name_vi}
                          </span>
                          {item.sourceCourse?.completed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shrink-0">
                              Điểm: {item.sourceCourse.letter} ({item.sourceCourse.score10})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                              Chưa học
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Unlocked Next Courses */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  3. Các môn mở khóa tiếp theo (
                  {inspectorDetails.unlockedNext.length + inspectorDetails.outgoingKnowledge.length})
                </h4>

                <div className="space-y-1.5">
                  {inspectorDetails.unlockedNext.map((nextC) => (
                    <div
                      key={`unlock-${nextC.code}`}
                      onClick={() => handleSelectAndFlyTo(nextC.code)}
                      className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:border-sky-400 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-600 text-white mr-1.5">
                          Mở khóa TQ
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                          {nextC.code}
                        </span>{' '}
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          - {nextC.name_vi}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                        {nextC.credits} TC
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const SkillTreeGraph: React.FC<SkillTreeGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SkillTreeInner {...props} />
    </ReactFlowProvider>
  );
};
