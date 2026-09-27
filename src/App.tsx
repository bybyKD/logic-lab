import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ClassroomScreen } from './components/teacher/ClassroomScreen'
import { CoursesScreen } from './components/teacher/CoursesScreen'
import { CourseBuilderScreen } from './components/teacher/CourseBuilderScreen'
import { StudioIndexScreen } from './components/teacher/StudioIndexScreen'
import { StudioEditorScreen } from './components/teacher/StudioEditorScreen'
import { AssignmentsScreen } from './components/teacher/AssignmentsScreen'
import { ReviewScreen } from './components/teacher/ReviewScreen'
import { GradebookScreen } from './components/teacher/GradebookScreen'
import { StudentsScreen } from './components/teacher/StudentsScreen'
import { AdminRedirect } from './components/teacher/AdminRedirect'
import { ActivityRunnerScreen } from './features/student/activity-runner/ActivityRunnerScreen'
import { LearnDashboardScreen } from './features/student/dashboard/LearnDashboardScreen'
import { AnimatedCursor } from './components/ui/AnimatedCursor'
import { SessionProvider } from './services/session/SessionProvider'
import {
  LegacyChallengeRedirect,
  LegacyModuleRedirect,
} from './components/legacy/LegacyRouteRedirect'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AnimatedCursor />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/*
            The derived learner dashboard. `/learn` is the canonical home now; the
            old `/dashboard` screen is gone because its numbers were invented, so
            rather than leave twelve links pointing at a deleted page it redirects.
            `/module`, `/challenge` and `/challenges` stay live until Phase 7.
          */}
          <Route path="/learn" element={<LearnDashboardScreen />} />
          <Route path="/dashboard" element={<Navigate to="/learn" replace />} />
          {/*
            Legacy student URLs, now redirects rather than screens. Each of these
            rendered its own copy of progress and challenge data before Phases 3-6,
            so serving them live meant two dashboards a learner could reach. The
            resolver derives the target from the seed; anything it cannot map lands
            on `/learn`, which is the same place an unknown path already goes.
          */}
          <Route path="/module/:id" element={<LegacyModuleRedirect />} />
          <Route path="/challenge/:id" element={<LegacyChallengeRedirect />} />
          <Route path="/challenges" element={<Navigate to="/learn" replace />} />
          {/*
            The student runner. One route for every activity kind — the screen
            switches on `activity.kind`, so a new kind is a new branch rather than
            a new URL. It is the destination for every legacy student route above.
          */}
          <Route
            path="/learn/c/:courseId/s/:sectionId/a/:activityId"
            element={<ActivityRunnerScreen />}
          />
          <Route path="/teacher" element={<ClassroomScreen />} />
          <Route path="/teacher/courses" element={<CoursesScreen />} />
          <Route path="/teacher/courses/:courseId" element={<CourseBuilderScreen />} />
          <Route path="/teacher/studio" element={<StudioIndexScreen />} />
          <Route path="/teacher/studio/:activityId" element={<StudioEditorScreen />} />
          <Route path="/teacher/assignments" element={<AssignmentsScreen />} />
          <Route path="/teacher/assignments/:activityId/review" element={<ReviewScreen />} />
          <Route path="/teacher/gradebook" element={<GradebookScreen />} />
          <Route path="/teacher/classes/:classId/students" element={<StudentsScreen />} />
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}