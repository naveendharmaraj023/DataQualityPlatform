import { useState } from 'react';
import axios from 'axios';
import { User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function MobileSignup() {
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [status, setStatus] = useState(null); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await axios.post(`${API_URL}/validate`, {
                email,
                age: parseInt(age, 10),
            });
            setStatus('success');
            setEmail('');
            setAge('');
        } catch (error) {
            setStatus('error');
            if (error.response?.data?.detail) {
                // Extract the first error message from Pydantic
                const detail = error.response.data.detail[0];
                setErrorMessage(detail.msg || 'Validation failed');
            } else {
                setErrorMessage('Failed to connect to the server');
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Join Platform
                    </h1>
                    <p className="text-slate-500 mt-2">Sign up for early access today.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Age</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors"
                                placeholder="Must be 18-100"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Validating...' : 'Create Account'}
                    </button>
                </form>

                {status === 'success' && (
                    <div className="rounded-md bg-green-50 p-4 border border-green-200 mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Success! Account created.</p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200 mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
