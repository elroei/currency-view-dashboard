import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'pending' | 'success' | 'already' | 'error'>('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing or invalid verification token.');
      return;
    }
    fetch(`/api/verify_email.php?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.already_verified) {
          setStatus('already');
        } else if (data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setError(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Server error.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <svg className="mx-auto mb-4 h-10 w-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <rect width="16" height="10" x="4" y="11" rx="2"/>
          <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
        </svg>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Email Verification</h2>
        {status === 'pending' && <div className="text-gray-500">Verifying your email...</div>}
        {status === 'success' && (
          <div className="text-green-600">
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Your email has been verified!<br />
            <Link to="/login" className="inline-block mt-4 text-blue-600 hover:underline">Go to Login</Link>
          </div>
        )}
        {status === 'already' && (
          <div className="text-blue-600">
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Your email is already verified.<br />
            <Link to="/login" className="inline-block mt-4 text-blue-600 hover:underline">Go to Login</Link>
          </div>
        )}
        {status === 'error' && (
          <div className="text-red-600">
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            {error}<br />
            <Link to="/login" className="inline-block mt-4 text-blue-600 hover:underline">Go to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 