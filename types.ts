
export type UserRole = 'Siswa' | 'Guru/Admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  pending_email?: string; // To store email during registration before auth user is created
}

export interface Course {
  id: string;
  course_name: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  module: string | null;
  course_id: string;
  courses: Course; // For joined data
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  courses: Course;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_file_url: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  assignments: Assignment; // For joined data
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: AttendanceStatus;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id:string;
  user_id: string;
  reason: string;
  attachment_url: string | null;
  status: LeaveRequestStatus;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}