"use client";

import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  delay?: number;
  animate?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unit = "",
  showValue = true,
  size = "md",
  disabled = false,
  className,
  delay = 0,
  animate = true,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderId = useRef(`slider-${Math.random().toString(36).substr(2, 9)}`);
  const labelId = label ? `${sliderId.current}-label` : undefined;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = localValue;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = Math.min(max, localValue + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = Math.max(min, localValue - step);
        break;
      case "Home":
        e.preventDefault();
        newValue = min;
        break;
      case "End":
        e.preventDefault();
        newValue = max;
        break;
      case "PageUp":
        e.preventDefault();
        newValue = Math.min(max, localValue + step * 5);
        break;
      case "PageDown":
        e.preventDefault();
        newValue = Math.max(min, localValue - step * 5);
        break;
      default:
        return;
    }

    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  const sizeClasses = {
    sm: {
      track: "h-2",
      thumb: "h-6 w-6",
      value: "text-2xl",
    },
    md: {
      track: "h-3",
      thumb: "h-8 w-8",
      value: "text-4xl",
    },
    lg: {
      track: "h-4",
      thumb: "h-10 w-10",
      value: "text-5xl",
    },
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    if (disabled) return;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
  };

  const updateValue = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
  ) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX : "clientX" in e ? e.clientX : 0;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round((min + percentage * (max - min)) / step) * step;
    const clampedValue = Math.max(min, Math.min(max, newValue));

    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging]);

  const Wrapper = animate ? motion.div : "div";
  return (
    <Wrapper
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { delay } : undefined}
      className={cn("space-y-4", className)}
    >
      {label && (
        <label
          id={labelId}
          className="block text-sm font-bold text-gray-900"
          htmlFor={sliderId.current}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Track Background */}
        <div
          ref={sliderRef}
          id={sliderId.current}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue}
          aria-orientation="horizontal"
          aria-label={ariaLabel || label || "Slider"}
          aria-labelledby={ariaLabelledBy || labelId}
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative w-full rounded-full bg-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-green focus-visible:ring-offset-2",
            sizeClasses[size].track,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Filled Track */}
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-duo-green via-duo-green to-duo-green-dark"
            initial={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: isDragging ? 0 : 0.3, ease: "easeOut" }}
          />

          {/* Thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full bg-white border-4 border-duo-green shadow-lg cursor-grab active:cursor-grabbing",
              sizeClasses[size].thumb,
              disabled && "cursor-not-allowed"
            )}
            style={{
              left: `calc(${percentage}% - ${
                sizeClasses[size].thumb.split(" ")[1] === "h-6"
                  ? "12px"
                  : sizeClasses[size].thumb.split(" ")[1] === "h-8"
                  ? "16px"
                  : "20px"
              })`,
            }}
            animate={{
              scale: isDragging ? 1.2 : 1,
              y: isDragging ? -2 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          />

          {/* Tick marks */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {Array.from({ length: Math.floor((max - min) / step) + 1 }).map(
              (_, i) => {
                const tickValue = min + i * step;
                const tickPercentage = ((tickValue - min) / (max - min)) * 100;
                return (
                  <div
                    key={i}
                    className="h-full w-0.5 bg-white/30 rounded-full"
                    style={{
                      marginLeft: `${
                        tickPercentage === 0
                          ? 0
                          : tickPercentage === 100
                          ? -2
                          : -1
                      }px`,
                    }}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Value Display */}
      {showValue && (
        <motion.div
          className="text-center"
          key={localValue}
          initial={{ scale: 1.2, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span
            className={cn(
              "font-black text-duo-green drop-shadow-lg",
              sizeClasses[size].value
            )}
          >
            {localValue}
          </span>
          {unit && (
            <span className="ml-2 text-lg font-semibold text-gray-600">
              {unit}
            </span>
          )}
        </motion.div>
      )}

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </Wrapper>
  );
}
