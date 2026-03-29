import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import ProfileSetup     from './pages/ProfileSetup'
import ProfileEdit      from './pages/ProfileEdit'
import StudentDashboard from './pages/StudentDashboard'
import CompaniesPage    from './pages/CompaniesPage'
import SkillsPage       from './pages/SkillsPage'
import AiChat           from './pages/AiChat'
import FacultyDashboard from './pages/FacultyDashboard'
import FacultyCompanies from './pages/FacultyCompanies'
import FacultyStudents  from './pages/FacultyStudents'
import FacultyNewsManager from './pages/FacultyNewsManager'

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role)
    return <Navigate to={user.role === 'faculty' ? '/faculty' : '/dashboard'} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student routes */}
          <Route path="/setup"        element={<ProtectedRoute role="student"><ProfileSetup /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute role="student"><ProfileEdit /></ProtectedRoute>} />
          <Route path="/dashboard"    element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/companies"    element={<ProtectedRoute role="student"><CompaniesPage /></ProtectedRoute>} />
          <Route path="/skills"       element={<ProtectedRoute role="student"><SkillsPage /></ProtectedRoute>} />
          <Route path="/chat"         element={<ProtectedRoute role="student"><AiChat /></ProtectedRoute>} />

          {/* Faculty routes */}
          <Route path="/faculty"           element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/companies" element={<ProtectedRoute role="faculty"><FacultyCompanies /></ProtectedRoute>} />
          <Route path="/faculty/students"  element={<ProtectedRoute role="faculty"><FacultyStudents /></ProtectedRoute>} />
          <Route path="/faculty/news"      element={<ProtectedRoute role="faculty"><FacultyNewsManager /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}