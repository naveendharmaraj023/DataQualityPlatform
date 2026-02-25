import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Database, LogOut, Code2, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check token existence whenever the route changes
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        setIsLoggedIn(!!token);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setIsLoggedIn(false);
        navigate('/login');
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand / Logo Area */}
                    <div className="flex items-center space-x-3">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
                                <Database className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-white font-bold text-lg tracking-tight">Data<span className="text-indigo-400">Sphere</span></span>
                        </Link>
                    </div>

                    {/* Navigation Links Area */}
                    <div className="flex items-center space-x-4">
                        {!isLoggedIn ? (
                            <>
                                <Link
                                    to="/"
                                    className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Signup
                                </Link>
                                <Link
                                    to="/login"
                                    className="bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300 px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center space-x-2 border border-slate-700"
                                >
                                    <Code2 className="w-4 h-4" />
                                    <span>Admin Panel</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="hidden sm:flex items-center space-x-2 mr-4 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">Welcome, Admin</span>
                                </div>
                                <Link
                                    to="/dashboard"
                                    className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
