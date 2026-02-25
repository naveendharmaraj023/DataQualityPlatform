import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, CheckCircle2, XCircle, Database, LogOut, Activity, AlertTriangle, Download } from 'lucide-react';

export default function Dashboard() {
    const [attempts, setAttempts] = useState([]);
    const [metrics, setMetrics] = useState({ total_attempts: 0, total_passed: 0, total_failed: 0, success_rate: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [severityFilter, setSeverityFilter] = useState('All');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setRefreshing(true);

            // Fetch both endpoints concurrently
            const [attemptsRes, metricsRes] = await Promise.all([
                axios.get(`${API_URL}/attempts`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/metrics`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Sort to show newest first
            setAttempts([...attemptsRes.data].reverse());
            setMetrics(metricsRes.data);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('admin_token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleExport = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            setExporting(true);
            const response = await axios.get(`${API_URL}/api/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'data_quality_report.csv');

            // Append to html link element page
            document.body.appendChild(link);
            link.click();

            // Clean up and remove the link
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('admin_token');
                navigate('/login');
            }
        } finally {
            setExporting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    const filteredAttempts = attempts.filter(attempt => {
        if (severityFilter === 'All') return true;
        return attempt.severity === severityFilter;
    });

    const getRowClass = (severity) => {
        if (severity === 'High') return 'bg-red-50/80 hover:bg-red-100/80 transition-colors';
        if (severity === 'Medium') return 'bg-yellow-50/80 hover:bg-yellow-100/80 transition-colors';
        return 'hover:bg-slate-50/50 transition-colors';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-4 sm:pt-8 w-full">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Database className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Validation Logs</h1>
                            <p className="text-sm text-slate-500">Internal dashboard for monitoring API requests</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap gap-y-3">
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="All">All Severities</option>
                            <option value="High">High Severity</option>
                            <option value="Medium">Medium Severity</option>
                            <option value="Normal">Normal Severity</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={exporting || loading || filteredAttempts.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 border border-emerald-600 rounded-lg text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
                            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
                        </button>
                        <button
                            onClick={fetchDashboardData}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-900 rounded-lg text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>

                {/* --- KPI METRICS BAR --- */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* KPI Card 1: Total Processed */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Validations</p>
                                <p className="text-2xl font-bold text-slate-900">{metrics.total_attempts}</p>
                            </div>
                        </div>

                        {/* KPI Card 2: Success Rate */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${metrics.success_rate >= 90 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Success Rate</p>
                                <div className="flex items-baseline space-x-2">
                                    <p className="text-2xl font-bold text-slate-900">{metrics.success_rate}%</p>
                                    <span className="text-xs text-slate-400">({metrics.total_passed} passed)</span>
                                </div>
                            </div>
                        </div>

                        {/* KPI Card 3: Error Count */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Failed Attempts</p>
                                <p className="text-2xl font-bold text-red-600">{metrics.total_failed}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading secure data...</div>
                    ) : attempts.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                            <Database className="h-8 w-8 text-slate-300" />
                            <p>No validation attempts logged yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Status</th>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Severity</th>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Email</th>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Age</th>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Timestamp</th>
                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAttempts.map((attempt, idx) => (
                                        <tr key={idx} className={getRowClass(attempt.severity)}>
                                            <td className="px-6 py-4">
                                                {attempt.status === 'Success' ? (
                                                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        <span className="font-medium text-xs">Valid</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        <span className="font-medium text-xs">Failed</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attempt.severity === 'High' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">High</span>
                                                )}
                                                {attempt.severity === 'Medium' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>
                                                )}
                                                {attempt.severity === 'Normal' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Normal</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-900 font-medium">{attempt.email}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{attempt.age}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(attempt.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attempt.errors && attempt.errors.length > 0 ? (
                                                    <span className="text-red-600 text-xs max-w-sm truncate block" title={attempt.errors[0]?.msg}>
                                                        {attempt.errors[0]?.msg}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
