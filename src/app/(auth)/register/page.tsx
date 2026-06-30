'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthLogo from '@/components/auth/AuthLogo';
import AuthCard from '@/components/auth/AuthCard';
import AuthTabs from '@/components/auth/AuthTabs';
import AuthInput from '@/components/auth/AuthInput';
import PasswordInput from '@/components/auth/PasswordInput';
import AuthButton from '@/components/auth/AuthButton';
import AuthDivider from '@/components/auth/AuthDivider';
import SocialLogin from '@/components/auth/SocialLogin';
import RoleSelector from '@/components/auth/RoleSelector';
import { register, login, handoffCode } from '@/lib/api/auth';

const AVAILABLE_INTERESTS = ['AI & ML', 'Design', 'Business', 'Web Dev', 'Data Science'];

export default function RegisterPage() {
  const router = useRouter();
  
  // Step State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form State
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Touched state for field-level errors
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  // Profile Setup State (Step 4)
  const [level, setLevel] = useState('');
  const [openLevel, setOpenLevel] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);

  // Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  // Validation helpers
  const firstNamePattern = /^[\p{L}\s'-]+$/u;
  const lastNamePattern = /^[\p{L}\s'-]+$/u;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    // Match Angular's thresholds
    if (password.length < 8) return Math.min(score, 2);
    if (password.length < 10) return Math.min(score, 3);
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength();
  
  const getFirstNameError = () => {
    if (!touched.firstName) return "";
    if (!firstName) return "Please Enter your first name";
    if (firstName.length < 2) return "First Name must be at least 2 characters";
    if (!firstNamePattern.test(firstName)) return "First Name must contain only letters";
    return "";
  };
  
  const getLastNameError = () => {
    if (!touched.lastName) return "";
    if (!lastName) return "Please Enter your las name";
    if (lastName.length < 2) return "Last name must be at least 2 characters";
    if (!lastNamePattern.test(lastName)) return "Last name can only contain letters";
    return "";
  };
  
  const getEmailError = () => {
    if (!touched.email) return "";
    if (!email) return "Please enter your email";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };
  
  const getPasswordError = () => {
    if (!touched.password) return "";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Minimum length is 8 characters.";
    // Only show weak password error when password has a value but is weak
    if (password.length >= 8 && strength < 3) return "Add upper/lowercase letters, a number, or a symbol.";
    return "";
  };
  
  const getConfirmPasswordError = () => {
    if (!touched.confirmPassword) return "";
    if (!confirmPassword) return "Password is required.";
    return "";
  };
  
  const getConfirmPasswordMismatchError = () => {
    if (!touched.confirmPassword) return "";
    if (!confirmPassword) return "";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const isStepInvalid = () => {
    if (currentStep === 1) return !role;
    if (currentStep === 2) {
      return !firstName || !lastName || !email || 
             firstName.length < 2 || lastName.length < 2 || !emailRegex.test(email) ||
             !firstNamePattern.test(firstName) || !lastNamePattern.test(lastName);
    }
    if (currentStep === 3) {
      return !password || !confirmPassword || password.length < 8 || password !== confirmPassword;
    }
    return false;
  };

  const totalSteps = role === 'instructor' ? 3 : 4;
  const progressPercent = (currentStep / totalSteps) * 100;

  const handleTabChange = (tab: 'signin' | 'signup') => {
    if (tab === 'signin') {
      router.push('/login');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Choose Your Role';
      case 2: return 'Account Information';
      case 3: return 'Security Information';
      case 4: return 'Profile Setup';
      default: return '';
    }
  };

  const nextStep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setSuccessMessage('');
    
    if (currentStep === 2) {
      setTouched(t => ({ ...t, firstName: true, lastName: true, email: true }));
      if (getFirstNameError() || getLastNameError() || getEmailError()) {
        return;
      }
    }
    if (currentStep === 3) {
      setTouched(t => ({ ...t, password: true, confirmPassword: true }));
      if (getPasswordError() || getConfirmPasswordError() || getConfirmPasswordMismatchError()) {
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final Submit
      setIsSubmitting(true);
      
      const payload = {
        firstName,
        lastName,
        email,
        password,
        role,
        ...(role === 'student' && {
          level: level ? level.toLowerCase() : undefined,
          interests: interests.length > 0 ? interests : [],
        })
      };

      try {
        const response = await register(payload);
        
        // Always redirect to login after successful registration
        router.push('/login?registered=true');
      } catch (err: any) {
        console.error('Register error:', err);
        const status = err?.status;
        const errorData = err?.error;
        
        if (status === 409) {
          setEmailError('This email is already registered');
          setCurrentStep(2);
        } else {
          const messages: string[] = Array.isArray(errorData?.message)
            ? errorData.message
            : errorData?.message
            ? [errorData.message]
            : [];
            
          const isPasswordError = messages.some((m: string) => /password/i.test(m));
          
          if (status === 400 && isPasswordError) {
            setPasswordError('Password does not meet the server\'s requirements.');
            setCurrentStep(3);
          } else {
            setGeneralError('Registration failed. Please try again.');
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthLayout>
      <AuthLogo />
      
      <AuthCard>
        <div className="auth-card-header">
          <AuthTabs activeTab="signup" onTabChange={handleTabChange} />
          
          <div className="mb-3 max-[360px]:mb-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider max-[360px]:text-2xs">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-xs font-semibold text-primary max-[360px]:text-2xs">
                {getStepTitle()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {generalError && (
          <div className="auth-error flex items-start gap-2 rounded-lg border border-error bg-error/10 px-3 py-2 text-sm text-error shadow-sm mb-1 animate-in slide-in-from-top-2 fade-in duration-300">
             <svg className="w-4 h-4 mt-[2px] shrink-0 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span className="leading-relaxed">{generalError}</span>
          </div>
        )}

        <form onSubmit={nextStep} className="auth-card-form">
          <div className="auth-step-region">
            {/* Step 1: Role */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <RoleSelector value={role} onChange={setRole} />
              </div>
            )}

            {/* Step 2: Account Info */}
            {currentStep === 2 && (
              <div className="animate-fade-in space-y-1 max-[360px]:space-y-1 mb-11">
                <div className="grid grid-cols-2 gap-5 mb-4">
                  <AuthInput
                    id="firstName"
                    label="First Name"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, firstName: true }))}
                    required
                    error={getFirstNameError()}
                    showSuccess={touched.firstName && firstName.length > 0 && !getFirstNameError()}
                    icon={
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    }
                  />
                  <AuthInput
                    id="lastName"
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, lastName: true }))}
                    required
                    error={getLastNameError()}
                    showSuccess={touched.lastName && lastName.length > 0 && !getLastNameError()}
                    icon={
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    }
                  />
                </div>  
                <AuthInput
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  required
                  error={getEmailError() || emailError}
                  showSuccess={touched.email && email.length > 0 && !getEmailError() && !emailError}
                  icon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  }
                />
              </div>
            )}

            {/* Step 3: Security Info */}
            {currentStep === 3 && (
              <div className="animate-fade-in space-y-1.5 max-[360px]:space-y-1">
                <PasswordInput
                  id="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  required
                  error={getPasswordError() || passwordError}
                />
                
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-secondary">Password strength</span>
                      <span className={`text-xs font-medium ${
                        !password ? 'text-gray-400' :
                        strength <= 1 ? 'text-red-500' : 
                        strength === 2 ? 'text-[#ff8800]' : 
                        strength === 3 ? 'text-[#ffc300]' : 'text-green-500'
                      }`}>
                        {!password ? '' : strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5 mt-1 mb-3">
                      <div className={`flex-1 rounded-full transition-colors duration-300 ${password && strength >= 1 ? (strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-[#ff8800]' : strength === 3 ? 'bg-[#ffc300]' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors duration-300 ${password && strength >= 2 ? (strength === 2 ? 'bg-[#ff8800]' : strength === 3 ? 'bg-[#ffc300]' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors duration-300 ${password && strength >= 3 ? (strength === 3 ? 'bg-[#ffc300]' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors duration-300 ${password && strength >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>

                <PasswordInput
                  id="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
                  required
                  error={getConfirmPasswordError() || getConfirmPasswordMismatchError()}
                />
              </div>
            )}

            {/* Step 4: Profile Setup (Student Only) */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in max-[360px]:space-y-1.5">
                <div className="relative w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Current Level
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpenLevel(!openLevel)}
                    className={`w-full bg-white border py-2 pl-4 pr-10 text-sm transition-all duration-200 text-left relative shadow-none focus:outline-none focus:ring-0 ${
                      openLevel || level ? 'border-primary' : 'border-gray-200 hover:border-primary/50'
                    } ${
                      openLevel ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
                    } ${
                      level ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}
                  >
                    {level || 'Select level'}
                    <div className="absolute inset-y-0 right-3 flex items-center text-primary">
                      <svg className={`w-4 h-4 transition-transform duration-200 ${openLevel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {openLevel && (
                    <div className="absolute top-full left-0 z-10 w-full bg-white border border-primary border-t-0 rounded-b-xl shadow-lg overflow-hidden">
                      {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => { setLevel(lvl); setOpenLevel(false); }}
                          className="w-full px-4 py-2 text-sm text-primary bg-white border-b border-primary/10 transition-all duration-150 text-left hover:bg-primary hover:text-white"
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className='mb-8'>
                  <label className="block text-sm font-medium text-text-primary mb-4">Areas of Interest</label>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-3 max-[360px]:gap-x-1.5 justify-items-center">
                  {AVAILABLE_INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border w-full text-center whitespace-nowrap overflow-hidden text-ellipsis max-[360px]:px-2 max-[360px]:py-2 max-[360px]:text-xs ${
                        interests.includes(interest)
                          ? 'bg-primary/10 border-primary text-primary shadow-sm transform -translate-y-[1px]'
                          : 'bg-surface border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
              </div>
                </div>
              </div>
            )}
          </div>

          <div className="auth-card-actions mt-3 flex gap-2.5 items-stretch max-[360px]:mt-2 max-[360px]:gap-2">
  {currentStep > 1 && (
    <button
      type="button"
      onClick={previousStep}
      className="flex items-center justify-center px-4 rounded-xl border border-primary text-primary bg-transparent hover:bg-primary/5 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transform hover:-translate-y-[1px] active:translate-y-[0px]"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )}

  <div className="flex-1 w-full">
    <AuthButton type="submit" disabled={isStepInvalid()} loading={isSubmitting}>
      {currentStep >= totalSteps ? 'Register' : 'Continue'}
    </AuthButton>
  </div>
</div>
        </form>

        {currentStep === 1     && (
          <div className="auth-card-social mt-3">
            <AuthDivider>or continue with</AuthDivider>
            <div className="mt-5 max-[360px]:mt-0.5">
              <SocialLogin />
            </div>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
