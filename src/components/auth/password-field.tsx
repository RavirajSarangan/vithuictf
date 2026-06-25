"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-11 rounded-xl border-icvf-border bg-white pr-11 text-icvf-navy placeholder:text-icvf-text-light/50";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  inputClassName?: string;
  placeholder?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
  minLength,
  inputClassName,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-icvf-navy">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClassName)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-icvf-text-light hover:text-icvf-navy"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export const authInputClassName = inputClassName;
