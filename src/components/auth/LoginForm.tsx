"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailOutlined, LockOutlined, VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { CustomInput } from '../ui/CustomInput';

export const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = (data: LoginFormData) => console.log("Login Data:", data);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="space-y-4 md:space-y-5">
                <CustomInput
                    label="Email Address"
                    placeholder="name@example.com"
                    icon={<MailOutlined sx={{ fontSize: 20 }} />}
                    register={register("email")}
                    error={errors.email?.message}
                />

                <div className="relative">
                    <CustomInput
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        icon={<LockOutlined sx={{ fontSize: 20 }} />}
                        register={register("password")}
                        error={errors.password?.message}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        {showPassword ? <VisibilityOutlined sx={{ fontSize: 18 }} /> : <VisibilityOffOutlined sx={{ fontSize: 18 }} />}
                    </button>
                </div>
            </div>

            <div className="flex flex-row justify-between items-center my-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#2e2a91] focus:ring-[#2e2a91]" />
                    <span>Remember me</span>
                </label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot Password?</a>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2e2a91] hover:bg-[#1e1b4b] text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:bg-gray-400"
            >
                {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );
};