import defaultDatabaseJson from './academic_database.json';
import defaultProgressJson from './user_progress.json';
import { AcademicDatabase, UserProgress } from '../types/academic';

export const DEFAULT_DATABASE = defaultDatabaseJson as unknown as AcademicDatabase;
export const DEFAULT_PROGRESS = defaultProgressJson as unknown as UserProgress;

export const LOCAL_STORAGE_KEY = 'hus_cis_user_progress_v1';

export function loadStoredProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.courses_state) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse progress from localStorage:', e);
  }
  return DEFAULT_PROGRESS;
}

export function saveStoredProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save progress to localStorage:', e);
  }
}
