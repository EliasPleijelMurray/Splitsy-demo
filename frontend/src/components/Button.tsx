import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <button
      className={`bg-button text-black hover:text-primary border-2 border-black px-2 py-1 text-sm font-regular cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
