export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type RoutineClassType = 'LECTURE' | 'TUTORIAL' | 'WORKSHOP';

export interface RoutineSubject {
  id: string;
  name: string;
  code: string;
  semester: number;
  department?: string | null;
}

export interface RoutineInstructor {
  id: string;
  user?: {
    name: string;
  } | null;
}

export interface Routine {
  id: string;
  subjectId: string;
  instructorId: string;
  department?: string | null;
  semester: number;
  section?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classType?: RoutineClassType;
  note?: string | null;
  room?: string | null;
  createdAt: string;
  subject?: RoutineSubject | null;
  instructor?: RoutineInstructor | null;
}

export interface RoutinesResponse {
  total: number;
  routines: Routine[];
}
