import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ModulePage } from './pages/ModulePage'
import { ChallengePage } from './pages/ChallengePage'
import { ChallengesIndexPage } from './pages/ChallengesIndexPage'
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
import { AnimatedCursor } from './components/ui/AnimatedCursor'
import { SessionProvider } from './services/session/SessionProvider'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AnimatedCursor />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/challenge/:id" element={<ChallengePage />} />
          <Route path="/challenges" element={<ChallengesIndexPage />} />
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