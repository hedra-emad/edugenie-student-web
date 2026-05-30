import { ReactNode } from "react";

interface Props {
  label: string;
  placeholder: string;
  type?: string;
  icon: ReactNode; 
  error?: string; 
  register: any;   
}

export const CustomInput = ({ label, placeholder, type = "text", icon, error, register }: Props) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[13px] font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input
          {...register}
          type={type}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 bg-brand-inputBg border rounded-xl outline-none transition-all text-sm
            ${error ? 'border-red-500' : 'border-gray-100 focus:border-brand-light'}
          `}
        />
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
};