import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const LockIcon = () => (
  <svg className="mx-auto mb-4 h-10 w-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="16" height="10" x="4" y="11" rx="2"/>
    <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
  </svg>
);

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Reset failed.');
      }
    } catch (err) {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
          <LockIcon />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Reset Your Password</h2>
          <div className="text-red-600 mt-4">Invalid or missing token.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <LockIcon />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Reset Your Password</h2>
        <p className="mb-6 text-gray-500">Enter your new password below.</p>
        {success ? (
          <div className="flex flex-col items-center text-green-600">
            <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Password reset! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-left">
              <label className="block mb-1 font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.7 6.7A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.112M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="text-left">
              <label className="block mb-1 font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.7 6.7A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.112M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 