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
  Lock,
  Unlock,
  GitBranch,
  Layers,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Focus,
  LayoutGrid,
  SlidersHorizontal,
  PlayCircle,
  Edit3,
  Star,
} from 'lucide-react';
import { Course, KnowledgeLink, CourseUserState } from '../types/academic';
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
      className={`w-[260px] rounded-xl p-3 border pointer-events-none select-none ${
        isCurrentSem5
          ? 'bg-sky-600 text-white border-sky-700'
          : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span
          className={`font-mono font-medium ${
            isCurrentSem5 ? 'text-sky-100' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {isCurrentSem5 ? 'Kỳ 5 · Đang học' : `Học kỳ ${data.semester}`}
        </span>
        <span
          className={`font-mono font-medium ${
            isCurrentSem5 ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {data.totalCredits} TC
        </span>
      </div>
      <div className="text-sm font-semibold mt-1 leading-snug">{data.title}</div>
      <div
        className={`text-[11px] mt-1 flex items-center justify-between tabular-nums ${
          isCurrentSem5 ? 'text-sky-100' : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <span>{data.count} học phần</span>
        {data.inProgressCount > 0 ? (
          <span>Đang học: {data.inProgressCount}</span>
        ) : (
          <span>
            Hoàn thành: {data.completedCount}/{data.count}
          </span>
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

  const statusBarClass = isCompleted
    ? 'bg-emerald-600'
    : isInProgress
    ? 'bg-sky-600'
    : isReady
    ? 'bg-zinc-400 dark:bg-zinc-500'
    : 'bg-zinc-200 dark:bg-zinc-700';

  const borderStyle = selected
    ? 'border-sky-600 ring-2 ring-sky-600/20 z-30 shadow-md'
    : isConnectedToSelected
    ? 'border-amber-500/80 ring-2 ring-amber-500/15 z-20'
    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700';

  const dimStyle = dimmed ? 'opacity-30 hover:opacity-85' : 'opacity-100';

  const cat = getCourseCategoryMeta(course);
  const diff = getCourseDifficulty(course.code);

  return (
    <div
      onClick={() => onSelect(course)}
      className={`w-[260px] rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 relative overflow-hidden transition-[border-color,opacity,box-shadow] duration-150 ${
        isPositionLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      } select-none shadow-sm ${borderStyle} ${dimStyle}`}
    >
      {/* Left accent stripe indicates academic status cleanly */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusBarClass}`} />

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-400 dark:!bg-zinc-500 !border-2 !border-white dark:!border-zinc-900"
      />

      {/* Top Row: Toggle + Monospace Code & Credits */}
      <div className="pl-1.5 flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(course.code, !isCompleted);
          }}
          title={isCompleted ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}
          className={`nodrag h-6 px-2 rounded-md text-[11px] font-medium transition-colors duration-150 border flex items-center gap-1 cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
              : isInProgress
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25'
              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckSquare className="w-3 h-3" strokeWidth={1.75} />
              <span>Đã học</span>
            </>
          ) : isInProgress ? (
            <>
              <PlayCircle className="w-3 h-3" strokeWidth={1.75} />
              <span>Đang học</span>
            </>
          ) : (
            <>
              <Square className="w-3 h-3" strokeWidth={1.75} />
              <span>Đã học</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{course.code}</span>
          <span>·</span>
          <span>{course.credits} TC</span>
        </div>
      </div>

      {/* Course Title */}
      <div className="pl-1.5 font-medium text-[13px] leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2 min-h-[36px] mb-2">
        {course.name_vi}
      </div>

      {/* Category & Difficulty */}
      <div className="pl-1.5 flex items-center justify-between gap-2 mb-2 text-[11px]">
        <span className="text-zinc-500 dark:text-zinc-400 truncate">{cat.shortBadge}</span>
        <span
          className="inline-flex items-center gap-1 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0"
          title={`Độ khó: ${diff.stars}/5 (${diff.levelLabel})`}
        >
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" strokeWidth={1.5} />
          <span>{diff.stars.toFixed(1)}</span>
        </span>
      </div>

      {/* Bottom Row: Grade or Status */}
      <div className="pl-1.5 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] tabular-nums">
        {isCompleted ? (
          <>
            <span className="text-zinc-500 dark:text-zinc-400">Kỳ {course.semester}</span>
            <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
              {course.letter || 'A'} ({course.score4?.toFixed(1) ?? '3.7'}) ·{' '}
              {course.score10?.toFixed(1) ?? '8.7'}
            </span>
          </>
        ) : isInProgress ? (
          <span className="font-medium text-sky-700 dark:text-sky-400 truncate">
            Kỳ 5 · {course.note || 'Đang học'}
          </span>
        ) : isReady ? (
          <>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              Đủ tiên quyết · K{course.planned_semester || course.recommended_semester}
            </span>
            {incomingKnowledgeCount > 0 && (
              <span className="font-mono text-zinc-500">+{incomingKnowledgeCount} nền</span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-zinc-400 truncate">
            <Lock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
            <span className="font-mono truncate">{course.prerequisites.join(', ')}</span>
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-zinc-400 dark:!bg-zinc-500 !border-2 !border-white dark:!border-zinc-900"
      />
    </div>
  );
};

const nodeTypes = {
  courseNode: CourseGraphNode,
  semesterHeader: SemesterHeaderNode,
};

const SEMESTER_TITLES: Record<number, string> = {
  1: 'Nền tảng đại cương và lập trình',
  2: 'Toán cơ sở, ĐSTT và OOP',
  3: 'Cấu trúc DL, Toán rời rạc và GT3',
  4: 'Xác suất, CSDL, PTVP và HĐH',
  5: '6 học phần Kỳ 5',
  6: 'Chuyên ngành và tự chọn AI',
  7: 'Chuyên sâu NLP, CV và ATTT',
  8: 'Khóa luận tốt nghiệp',
};

const SkillTreeInner: React.FC<SkillTreeGraphProps> = ({
  courses,
  knowledgeLinks,
  onToggleCourseCompleted,
  onUpdateCourseScore,
  onUpdateCourseFullState,
}) => {
  const reactFlowInstance = useReactFlow();

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
            duration: 450,
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
          duration: 450,
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
    const colWidth = 340;
    const rowHeight = 164;

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
            animated: isHighlighted,
            label: isHighlighted ? 'Tiên quyết' : undefined,
            labelStyle: { fill: '#0284c7', fontWeight: 500, fontSize: 11, fontFamily: 'IBM Plex Sans' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.96, stroke: '#e4e4e7' },
            style: {
              stroke: isHighlighted ? '#0284c7' : prereqDone ? '#16a34a' : '#a1a1aa',
              strokeWidth: isHighlighted ? 2.5 : 1.5,
              opacity: isHighlighted ? 1 : onlyFocusSelectedLinks ? 0.15 : 0.65,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isHighlighted ? '#0284c7' : prereqDone ? '#16a34a' : '#a1a1aa',
              width: 14,
              height: 14,
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
          animated: false,
          label: isHighlighted ? kLink.label : undefined,
          labelStyle: { fill: '#b45309', fontWeight: 500, fontSize: 11, fontFamily: 'IBM Plex Sans' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.96, stroke: '#e4e4e7' },
          style: {
            stroke: isHighlighted ? '#d97706' : '#d4d4d8',
            strokeWidth: isHighlighted ? 2.2 : 1.25,
            strokeDasharray: '5 4',
            opacity: isHighlighted ? 1 : 0.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? '#d97706' : '#d4d4d8',
            width: 12,
            height: 12,
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
      reactFlowInstance.fitView({ padding: 0.12, duration: 400 });
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
          ? 'fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 p-4 overflow-hidden flex flex-col gap-3'
          : 'space-y-3'
      }
    >
      {/* Calm Control Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors duration-150 ${
                  viewMode === 'canvas'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Sơ đồ đồ thị
              </button>
              <button
                type="button"
                onClick={() => setViewMode('columns')}
                className={`h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 ${
                  viewMode === 'columns'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Bảng 8 học kỳ</span>
              </button>
            </div>

            {/* Lock Position Button */}
            {viewMode === 'canvas' && (
              <button
                type="button"
                onClick={() => setIsPositionLocked((v) => !v)}
                className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors duration-150 flex items-center gap-1.5 ${
                  isPositionLocked
                    ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {isPositionLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>Đã khóa vị trí</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Cho phép kéo thẻ</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Jump Semester Bar */}
            {viewMode === 'canvas' && (
              <div className="hidden xl:flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/70 px-2 py-1 rounded-lg border border-zinc-200/70 dark:border-zinc-700">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-1">Kỳ:</span>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => focusOnSemesterColumn(sem)}
                    className={`h-6 px-2 rounded text-[11px] font-mono tabular-nums font-medium transition-colors duration-150 ${
                      sem === 5
                        ? 'bg-sky-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700'
                    }`}
                  >
                    K{sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên môn"
                className="h-8 pl-8 pr-3 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 w-48"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((s) => !s)}
              className={`h-8 px-3 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors duration-150 ${
                showAdvancedFilters
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Bộ lọc</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="h-8 px-3 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors duration-150"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Row */}
        {showAdvancedFilters && (
          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'completed', label: 'Đã học' },
                  { id: 'in_progress', label: 'Đang học K5' },
                  { id: 'ready', label: 'Đủ tiên quyết' },
                  { id: 'locked', label: 'Chưa mở khóa' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`h-7 px-2.5 rounded-md font-medium transition-colors duration-150 ${
                    statusFilter === st.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="h-7 px-2.5 rounded-md font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
              >
                <option value="all">Tất cả 5 khối kiến thức</option>
                <option value="I">Khối I · Kiến thức chung</option>
                <option value="II">Khối II · Theo lĩnh vực</option>
                <option value="III">Khối III · Theo khối ngành</option>
                <option value="IV">Khối IV · Theo nhóm ngành</option>
                <option value="V.1">Khối V.1 · Bắt buộc ngành</option>
                <option value="V.2.1">Khối V.2.1 · Tự chọn Kỹ năng PM</option>
                <option value="V.2.2">Khối V.2.2 · Tự chọn AI và PTPM</option>
                <option value="V.3">Khối V.3 · Tốt nghiệp</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHardPrereqs((v) => !v)}
                className={`h-7 px-2.5 rounded-md font-medium border transition-colors duration-150 ${
                  showHardPrereqs
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Tiên quyết QĐ 3568
              </button>
              <button
                type="button"
                onClick={() => setShowKnowledgeLinks((v) => !v)}
                className={`h-7 px-2.5 rounded-md font-medium border transition-colors duration-150 ${
                  showKnowledgeLinks
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Liên kết kiến thức
              </button>
              <button
                type="button"
                onClick={() => setOnlyFocusSelectedLinks((v) => !v)}
                className={`h-7 px-2.5 rounded-md font-medium border transition-colors duration-150 ${
                  onlyFocusSelectedLinks
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Chỉ hiện nhánh đang chọn
              </button>
              {Object.keys(customPositions).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="h-7 px-2.5 rounded-md bg-rose-600 text-white font-medium"
                >
                  Đặt lại vị trí
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {viewMode === 'canvas' ? (
          <div
            className={`lg:col-span-8 ${
              isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)] min-h-[600px]'
            } bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden relative`}
          >
            {/* Camera Quick Controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm text-xs">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 200 })}
                className="w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 200 })}
                className="w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => focusOnNode(selectedCourseCode, 1.05)}
                className="h-7 px-2.5 rounded-md bg-sky-600 text-white font-medium hover:bg-sky-700 flex items-center gap-1 font-mono"
              >
                <Focus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{selectedCourseCode}</span>
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.12, duration: 400 })}
                className="h-7 px-2.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-zinc-600 dark:text-zinc-300"
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
              <Background color="#d4d4d8" gap={24} size={1} />
              <Controls
                showInteractive={false}
                className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !rounded-lg !shadow-sm"
              />
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => {
                  if (n.type === 'semesterHeader') return '#52525b';
                  const c = (n.data as CustomCourseNodeData)?.course;
                  if (!c) return '#a1a1aa';
                  if (c.completed) return '#16a34a';
                  if (c.in_progress) return '#0284c7';
                  if (c.status === 'ready') return '#71717a';
                  return '#e4e4e7';
                }}
                maskColor="rgba(244, 244, 245, 0.65)"
                className="!bg-white/95 dark:!bg-zinc-900/95 !border !border-zinc-200 dark:!border-zinc-800 !rounded-lg !shadow-sm cursor-pointer"
              />
            </ReactFlow>
          </div>
        ) : (
          /* Mode 2: 8-Column Semester Board */
          <div
            className={`lg:col-span-8 ${
              isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)] min-h-[600px]'
            } bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 overflow-x-auto overflow-y-auto`}
          >
            <div className="flex gap-4 min-w-max pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const list = colGroups[sem] || [];
                const semTc = list.reduce((s, c) => s + c.credits, 0);
                return (
                  <div
                    key={sem}
                    className="w-[268px] shrink-0 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5"
                  >
                    <div
                      className={`p-3 rounded-lg border ${
                        sem === 5
                          ? 'bg-sky-600 text-white border-sky-700'
                          : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                        <span>{sem === 5 ? 'Kỳ 5 · Đang học' : `Học kỳ ${sem}`}</span>
                        <span>{semTc} TC</span>
                      </div>
                      <div className="text-xs font-medium mt-1 opacity-85">
                        {SEMESTER_TITLES[sem]}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {list.map((course) => {
                        const isSelected = course.code === selectedCourseCode;
                        const isConnected = connectedCodesSet.has(course.code);
                        return (
                          <div
                            key={course.code}
                            onClick={() => setSelectedCourseCode(course.code)}
                            className={`p-3 rounded-lg border bg-white dark:bg-zinc-900 transition-colors duration-150 cursor-pointer ${
                              isSelected
                                ? 'border-sky-600 ring-2 ring-sky-600/15'
                                : isConnected
                                ? 'border-amber-500/70'
                                : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleCourseCompleted(course.code, !course.completed);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  course.completed
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                    : course.in_progress
                                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
                                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                }`}
                              >
                                {course.completed ? (
                                  <CheckSquare className="w-3 h-3" strokeWidth={1.75} />
                                ) : (
                                  <Square className="w-3 h-3" strokeWidth={1.75} />
                                )}
                                <span>
                                  {course.in_progress && !course.completed ? 'Đang học' : 'Đã học'}
                                </span>
                              </button>
                              <span className="font-mono text-xs text-zinc-500 tabular-nums">
                                {course.code} · {course.credits} TC
                              </span>
                            </div>

                            <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 leading-snug mb-2">
                              {course.name_vi}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-100 dark:border-zinc-800 tabular-nums">
                              {course.completed ? (
                                <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                  {course.letter} ({course.score4?.toFixed(1)}) · {course.score10}
                                </span>
                              ) : course.in_progress ? (
                                <span className="font-medium text-sky-700 dark:text-sky-400">
                                  Kỳ 5 · {course.note || 'Đang học'}
                                </span>
                              ) : course.status === 'ready' ? (
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  Đủ tiên quyết
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-mono truncate">
                                  Cần: {course.prerequisites.join(', ')}
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

        {/* Right Side: Inspector Panel + Editor */}
        <div
          className={`lg:col-span-4 ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)] min-h-[600px]'
          } overflow-y-auto bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-5`}
        >
          {selectedCourse && inspectorDetails && (
            <>
              <div className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  <span className="text-sky-700 dark:text-sky-400 font-medium">
                    {selectedCourse.code} · {selectedCourse.credits} TC
                  </span>
                  <span>
                    {selectedCourse.sub_block} · {selectedCourse.type}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {selectedCourse.name_vi}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {selectedCourse.name_en}
                  </p>
                </div>

                {/* Review & Difficulty Summary */}
                {(() => {
                  const cat = getCourseCategoryMeta(selectedCourse);
                  const diff = getCourseDifficulty(selectedCourse.code);
                  return (
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                          {cat.badgeText}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                          <span>{diff.stars.toFixed(1)}/5</span>
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {diff.husCommunityReview}
                      </p>
                      <p className="text-sky-700 dark:text-sky-400 font-medium">
                        {diff.fitWithHuan} ({diff.workload})
                      </p>
                    </div>
                  );
                })()}

                {/* Direct Persistent Editor */}
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>Trạng thái, điểm và học kỳ</span>
                  </div>

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
                      className={`h-8 px-2 rounded-md text-xs font-medium border transition-colors duration-150 ${
                        selectedCourse.completed
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Hoàn thành
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
                      className={`h-8 px-2 rounded-md text-xs font-medium border transition-colors duration-150 ${
                        selectedCourse.in_progress && !selectedCourse.completed
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Đang học
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCourseFullState(selectedCourse.code, {
                          completed: false,
                          in_progress: false,
                        })
                      }
                      className={`h-8 px-2 rounded-md text-xs font-medium border transition-colors duration-150 ${
                        !selectedCourse.completed && !selectedCourse.in_progress
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Dự kiến
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                        {selectedCourse.completed ? 'Học ở kỳ' : 'Xếp vào kỳ'}
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
                        className="w-full h-8 px-2.5 rounded-md text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
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
                        <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 tabular-nums">
                          Điểm hệ 10 ({selectedCourse.letter} · {selectedCourse.score4})
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
                          className="w-full h-8 px-2.5 rounded-md text-xs font-mono tabular-nums font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                      Ghi chú môn học
                    </label>
                    <input
                      type="text"
                      value={selectedCourse.note || ''}
                      onChange={(e) =>
                        onUpdateCourseFullState(selectedCourse.code, { note: e.target.value })
                      }
                      placeholder="Giảng viên hoặc lưu ý"
                      className="w-full h-8 px-2.5 rounded-md text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: Hard Prerequisites */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <span>Môn tiên quyết bắt buộc ({inspectorDetails.hardPrereqs.length})</span>
                </h3>
                {inspectorDetails.hardPrereqs.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Không yêu cầu học phần tiên quyết
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {inspectorDetails.hardPrereqs.map((pre) => (
                      <div
                        key={pre.code}
                        onClick={() => handleSelectAndFlyTo(pre.code)}
                        className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 flex items-center justify-between cursor-pointer transition-colors duration-150 bg-zinc-50/60 dark:bg-zinc-800/40"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-mono text-xs text-zinc-500">{pre.code}</span>{' '}
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                            {pre.name_vi}
                          </span>
                        </div>
                        {pre.completed ? (
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                            {pre.letter} ({pre.score10})
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 shrink-0">Chưa học</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Knowledge Links */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <span>Nền tảng kiến thức ({inspectorDetails.incomingKnowledge.length})</span>
                </h3>
                {inspectorDetails.incomingKnowledge.length === 0 ? (
                  <p className="text-xs text-zinc-400">Học phần cơ sở nền tảng</p>
                ) : (
                  <div className="space-y-2">
                    {inspectorDetails.incomingKnowledge.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          item.sourceCourse && handleSelectAndFlyTo(item.sourceCourse.code)
                        }
                        className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                            <span className="font-mono text-zinc-500">{item.source}</span> ·{' '}
                            {item.sourceCourse?.name_vi}
                          </span>
                          {item.sourceCourse?.completed && (
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                              {item.sourceCourse.letter} ({item.sourceCourse.score10})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Unlocked Next Courses */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <span>
                    Môn mở khóa tiếp theo ({inspectorDetails.unlockedNext.length})
                  </span>
                </h3>

                <div className="space-y-1.5">
                  {inspectorDetails.unlockedNext.map((nextC) => (
                    <div
                      key={`unlock-${nextC.code}`}
                      onClick={() => handleSelectAndFlyTo(nextC.code)}
                      className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 cursor-pointer flex items-center justify-between gap-2 transition-colors duration-150"
                    >
                      <div className="min-w-0 truncate">
                        <span className="font-mono text-xs text-zinc-500">{nextC.code}</span>{' '}
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {nextC.name_vi}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500 tabular-nums shrink-0">
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
