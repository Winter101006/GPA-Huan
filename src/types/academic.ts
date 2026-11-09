export interface CourseHours {
  theory: number;
  practice: number;
  self_study: number;
}

export interface Course {
  code: string;
  name_vi: string;
  name_en: string;
  credits: number;
  block: 'I' | 'II' | 'III' | 'IV' | 'V';
  sub_block: string;
  block_name: string;
  type: 'Bắt buộc' | 'Tự chọn' | 'Điều kiện' | 'Tốt nghiệp' | 'Thay thế KLTN';
  counts_gpa: boolean;
  prerequisites: string[];
  hours: CourseHours;
  language: string;
  recommended_semester: number;
  plo: string[];
  completed: boolean;
  in_progress?: boolean;
  semester: number;
  planned_semester?: number;
  excel_name: string | null;
  score10: number | null;
  letter: string | null;
  score4: number | null;
  status?: 'completed' | 'in_progress' | 'ready' | 'locked';
  note?: string;
  teacher_note?: string;
  schedule_info?: string;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  category: string;
  label: string;
  description: string;
}

export interface StudentProfile {
  full_name: string;
  major_name: string;
  major_code: string;
  university: string;
  decision: string;
  cohort: string;
  current_semester: number;
  next_semester: number;
}

export interface SemesterStat {
  semester: number;
  label: string;
  credits: number;
  gpa4: number;
  gpa4_exact: number;
  gpa10: number;
  cpa4: number;
  cpa10: number;
  courses_count: number;
}

export interface BlockMetadata {
  id: string;
  name: string;
  required_credits: number;
  note: string;
}

export interface PLODefinition {
  code: string;
  title: string;
  group: string;
}

export interface TimetableSession {
  id: string;
  course_code: string;
  class_code: string;
  course_name: string;
  session_type: 'LT' | 'TH' | 'Online';
  day_of_week: number; // 2 = Thứ Hai ... 7 = Thứ Bảy
  start_period: number; // 1..12
  end_period: number; // 1..12
  room: string;
  note: string;
  color: string;
}

export interface CustomKnowledgeMemory {
  id: string;
  topic: string;
  course_code?: string | null;
  content: string;
  created_at: string;
}

export interface SemesterTaskItem {
  id: string;
  course_code: string; // e.g. 'MAT3533', 'NCKH_NLP', 'CHUNG'
  category: 'exam' | 'assignment' | 'project' | 'nlp_research' | 'note';
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  details?: string;
}

export interface NLPResearchMilestone {
  id: string;
  phase: string;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  target_date: string;
  notes: string;
  deliverable?: string;
}

export interface NLPResearchWorkspaceData {
  topic_title: string;
  advisor_name: string;
  research_goal: string;
  datasets_and_models: string;
  paper_links: string[];
  quick_notes: string;
  milestones: NLPResearchMilestone[];
}

export interface AcademicDatabase {
  student_profile: StudentProfile;
  summary_metrics: {
    total_required_gpa_credits: number;
    completed_gpa_credits: number;
    remaining_gpa_credits: number;
    completion_percentage: number;
    completed_courses_count: number;
    total_curriculum_courses_count: number;
    cpa4: number;
    cpa4_exact: number;
    cpa10: number;
    cpa10_exact: number;
    academic_rank: string;
  };
  semester_history: SemesterStat[];
  blocks_metadata: BlockMetadata[];
  plo_definitions: PLODefinition[];
  courses: Course[];
  knowledge_links: KnowledgeLink[];
}

export interface CourseUserState {
  completed: boolean;
  in_progress?: boolean;
  score10: number | null;
  letter: string | null;
  score4: number | null;
  semester: number;
  planned_semester: number;
  note?: string;
  teacher_note?: string;
  schedule_info?: string;
}

export interface UserProgress {
  courses_state: Record<string, CourseUserState>;
  conditional_checklist: Record<string, boolean>;
  selected_interests: string[];
  graduation_option: 'thesis' | 'replacement';
  target_cpa: number;
  retake_plan: Record<string, string>;
  semester5_timetable?: TimetableSession[];
  custom_memories?: CustomKnowledgeMemory[];
  semester5_tasks?: SemesterTaskItem[];
  nlp_research?: NLPResearchWorkspaceData;
}
