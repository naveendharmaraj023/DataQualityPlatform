import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileSignup from './components/MobileSignup';
import Dashboard from './components/Dashboard';
import AdminLogin from './components/AdminLogin';
import Navbar from './components/Navbar';

// A strict component that requires a valid token present, else it kicks user out
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<MobileSignup />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
