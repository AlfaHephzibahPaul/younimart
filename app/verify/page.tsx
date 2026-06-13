'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();

  // Step Flow States: 1 = Details Input, 2 = 6-Digit OTP Box, 3 = Success Redirect
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Input States
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');

  // OTP Verification States
  const [generatedCode, setGeneratedCode] = useState('');
  const [otpInputs, setOtpInputs] = useState<string[]>(new Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  // STEP 1: Connect to server API to email out a real code
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName || !university || !email || !matricNumber) {
      setError('Please fill in all fields before requesting a verification code.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to dispatch registration code.');
      }

      // Save code safely in state for validation step
      setGeneratedCode(resData.code);
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch registration code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otpInputs];
    newOtp[index] = element.value;
    setOtpInputs(newOtp);

    if (element.value !== '' && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpInputs[index] && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus();
    }
  };

  // STEP 2: Validate code and update profile attributes securely
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const enteredCode = otpInputs.join('');
    if (enteredCode.length !== 6) {
      setError('Please fill out all 6 digits of the token.');
      setLoading(false);
      return;
    }

    if (enteredCode !== generatedCode) {
      setError('The verification code you entered is incorrect.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No active user session found. Please log in again.');
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const updatePayload: Record<string, any> = {};

      if (profileRow) {
        if ('is_verified' in profileRow) updatePayload.is_verified = true;
        if ('full_name' in profileRow) updatePayload.full_name = fullName;
        if ('matric_number' in profileRow) updatePayload.matric_number = matricNumber;
        if ('updated_at' in profileRow) updatePayload.updated_at = new Date().toISOString();

        if ('university' in profileRow) updatePayload.university = university;
        if ('university_name' in profileRow) updatePayload.university_name = university;
        if ('campus' in profileRow) updatePayload.campus = university;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setStep(3);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Verification succeeded, but profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tight text-orange-600 hover:opacity-90 transition-opacity"
          >
            YOUnimart
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            One last step — verify your status
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Enter your official details to immediately unlock trading on campus.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          {error && (
            <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-3 rounded text-orange-700 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black text-sm outline-none"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Your Campus</label>
                <select
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black text-sm outline-none"
                >
                  <option value="">Select your institution</option>
                  <option value="Federal University Dutse">Federal University Dutse</option>
                  <option value="Bayero University Kano">Bayero University Kano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Personal Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black text-sm outline-none"
                  placeholder="name@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Matriculation Number</label>
                <input
                  type="text"
                  required
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black text-sm outline-none"
                  placeholder="UG/XXX/XX/XXXX"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-gray-300 text-sm shadow-sm"
              >
                {loading ? 'Sending Code...' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
              <p className="text-sm text-gray-600">
                A 6-digit code was sent to <span className="font-semibold text-gray-900">{email}</span>.
              </p>

              <div className="flex justify-center gap-2">
                {otpInputs.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-11 h-11 text-center text-lg font-bold border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-black outline-none"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-gray-300 text-sm shadow-sm"
              >
                {loading ? 'Confirming Code...' : 'Complete Registration'}
              </button>

              <div className="text-xs text-gray-500">
                {countdown > 0 ? (
                  <span>Resend available in <span className="font-semibold">{countdown}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    className="text-orange-600 hover:text-orange-700 font-bold underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 font-bold text-xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-900">Verification Complete!</h3>
              <p className="text-sm text-gray-600">
                Your profile has been saved. Loading the marketplace feed...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}