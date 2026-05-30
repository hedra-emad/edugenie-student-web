// src/app/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthToggle } from '@/components/ui/AuthToggle';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { AuthFooter } from '@/components/layout/Footer';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(circle_at_top_right,_#e0e7ff,_transparent_40%),radial-gradient(circle_at_bottom_left,_#f1f5f9,_transparent_40%)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-[#1e1b4b] mb-2 tracking-tight">
          EduGenie
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium">
          Intelligent learning for the modern mind.
        </p>
      </div>
      <div className="bg-white/70 backdrop-blur-xl p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-[480px] border border-white">
        <AuthToggle />
        <LoginForm />
        <SocialLogin />
      </div>
      <div className="w-full max-w-6xl mt-12">
        <AuthFooter />
      </div>
    </div>
  );
}
