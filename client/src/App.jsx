import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function LoginPage() { return <h1>Login</h1> }
function RegisterPage() { return <h1>Registro</h1> }
function DashboardPage() { return <h1>Dashboard</h1> }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}