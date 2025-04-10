"use client";

import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";

interface FlapProps {
  value: string;
  animated?: boolean;
  final?: boolean;
  hinge?: boolean;
  children?: string;
  bottom?: boolean;
  half?: boolean;
  isHovered?: boolean;
  color?: string; // New color prop
  hoverDuration?: number; // Duration of hover animation in ms
}

export const Flap = React.memo<FlapProps>(
  ({
    value,
    animated,
    final,
    hinge,
    children,
    bottom,
    half,
    isHovered,
    color,
    hoverDuration = 300, // Default animation duration
  }) => {
    const displayValue = children || value;
    const [animating, setAnimating] = useState(false);
    const animationTimer = useRef<NodeJS.Timeout | null>(null);

    // Handle hover animation completion
    useEffect(() => {
      // Start animation when hovered
      if (isHovered && !animating && bottom && half) {
        setAnimating(true);
      }

      // If animation is in progress and mouse leaves, let it complete
      if (animating && !isHovered) {
        if (animationTimer.current) {
          clearTimeout(animationTimer.current);
        }

        // Set a timer to complete the animation cycle
        animationTimer.current = setTimeout(() => {
          setAnimating(false);
        }, hoverDuration);
      }

      // If mouse is still hovering after animation completes, keep animating
      if (animating && isHovered) {
        if (animationTimer.current) {
          clearTimeout(animationTimer.current);
          animationTimer.current = null;
        }
      }

      // Cleanup
      return () => {
        if (animationTimer.current) {
          clearTimeout(animationTimer.current);
        }
      };
    }, [isHovered, animating, bottom, half, hoverDuration]);

    // Base flap classes
    const flapBaseClasses = `absolute h-full w-full origin-center z-20 rounded-sm leading-[0.9]`;

    // Top flap classes
    const topClasses = classNames(
      flapBaseClasses,
      "clip-path-[polygon(0_50%,100%_50%,100%_0,0_0)]", // clip-path for top
      "shadow-inner-top bg-gradient-to-b from-[rgba(255,255,255,0.03)] from-0% to-transparent to-60%", // 3D effect for top
      {
        "animate-flapDownTop z-20": animated && final,
        "rotate-x-50 opacity-40 z-20": animated && !final,
      }
    );

    // Bottom flap classes
    const bottomClasses = classNames(
      flapBaseClasses,
      "clip-path-[polygon(0_100%,100%_100%,100%_50%,0_50%)]", // clip-path for bottom
      "shadow-inner-bottom bg-gradient-to-t from-[rgba(0,0,0,0.07)] from-0% to-transparent to-30%", // 3D effect for bottom
      "transition-transform duration-200", // Add smooth transition for all states
      {
        "animate-flapDownBottom z-20": animated && final,
      }
    );

    const bottomHalfClasses = classNames(
      flapBaseClasses,
      "clip-path-[polygon(0_120%,100%_120%,100%_50%,0_50%)]", // clip-path for bottom
      "bg-gradient-to-t from-[rgba(0,0,0,0.07)] from-0% to-transparent to-30%", // 3D effect for bottom
      "shadow-outer-bottom"
    );

    // Hinge classes
    const hingeClasses = classNames(
      "w-full absolute left-0 top-1/2 -translate-y-1/2 z-30 h-[0.02em] bg-black",
      "before:content-[''] before:absolute before:left-[20%] before:bg-black",
      "after:content-[''] after:absolute after:left-[80%] after:bg-black",
      {
        "sm:before:w-[2px] sm:before:h-[16px] sm:after:w-[2px] sm:after:h-[16px] sm:before:top-[-6px] sm:after:top-[-6px]":
          true, // Default size for larger screens
        "before:w-[0.5px] before:h-[4px] after:w-[0.5px] after:h-[4px] after:top-[-1.5px] before:top-[-1.5px] before:shadow-none after:shadow-none":
          true, // Smaller size for mobile view
      }
    );

    // Base style including color
    const baseStyle = {
      backgroundColor: color || "#1a1a1a", // Use provided color or default
      color: color ? "#ffffff" : "#e1e1e1", // Use white text for colored backgrounds
    };

    return (
      <>
        {!bottom && (
          <div style={{ ...baseStyle, zIndex: 30 }} className={topClasses}>
            {displayValue}
          </div>
        )}
        {hinge && <div className={hingeClasses} />}
        {bottom && !half ? (
          <div
            style={{ perspective: "300px" }}
            className={
              flapBaseClasses +
              " z-10 clip-path-[polygon(0_100%,100%_100%,100%_50%,0_50%)]"
            }
          >
            <div style={baseStyle} className={bottomClasses}>
              {displayValue}
            </div>
          </div>
        ) : null}
        {bottom && half ? (
          <div
            style={{ perspective: "300px" }}
            className={
              flapBaseClasses +
              " z-10 clip-path-[polygon(-20%_120%,120%_120%,100%_50%,0_50%)]"
            }
          >
            <div
              style={{
                ...baseStyle,
                animationDirection: "alternate",
                transform:
                  bottom && half && (isHovered || animating)
                    ? "rotateX(65deg)"
                    : "initial",
                transition: `transform ${hoverDuration / 1000}s ease-in-out`,
              }}
              className={bottomHalfClasses}
            >
              {displayValue}
            </div>
          </div>
        ) : null}
      </>
    );
  }
);
