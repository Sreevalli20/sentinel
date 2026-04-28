import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, className, ...props }) => {
  const baseStyles = "relative px-6 py-2 font-mono font-bold uppercase tracking-wider transition-all duration-200 clip-path-polygon focus:outline-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-hud-cyan text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]",
    secondary: "border border-hud-cyan text-hud-cyan hover:bg-hud-cyan/10",
    danger: "bg-hud-red text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(255,0,60,0.6)]",
    success: "bg-hud-green text-black hover:bg-green-400 hover:shadow-[0_0_20px_rgba(0,255,65,0.6)]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
};
