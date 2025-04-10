"use client";

import React, { useMemo, useState } from "react";
import { Flap } from "./Flap";

interface FlapDigitProps {
  className?: string;
  css?: React.CSSProperties;
  value?: string;
  prevValue?: string;
  final?: boolean;
  mode?: string | null;
  [key: string]: any; // For rest props
}

export const FlapDigit = React.memo<FlapDigitProps>(
  ({
    className,
    css,
    value = "",
    prevValue = "",
    final = false,
    mode = null,
    ...restProps
  }) => {
    // Add state to track mouse hover
    const [isHovered, setIsHovered] = useState(false);

    // Memoize the container style
    const containerStyle = useMemo(
      () => ({
        ...css,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
      }),
      [css]
    );

    return (
      <div
        className={`text-[#e1e1e1] bg-[#1a1a1a] relative inline-block h-[1em] font-mono text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl border border-black text-center w-[1.3ch] min-w-[1ch] rounded-sm ${
          className || ""
        }`}
        style={containerStyle}
        data-kind="digit"
        data-mode={mode}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Flap value={value} {...restProps}>
          {value}
        </Flap>
        <Flap bottom value={prevValue} {...restProps}>
          {prevValue}
        </Flap>
        <Flap
          key={`top-${prevValue}`}
          animated
          final={final}
          value={prevValue}
          {...restProps}
        >
          {prevValue}
        </Flap>
        {final && (
          <>
            {/* <Flap
              key={`bottom-${value}`}
              bottom
              animated
              final
              value={value}
              isHovered={isHovered}
              {...restProps}
            >
              {value}
            </Flap> */}
            <Flap
              key={`bottom-${value}`}
              bottom
              half
              animated
              final
              value={value}
              isHovered={isHovered}
              {...restProps}
            >
              {value}
            </Flap>
          </>
        )}
      </div>
    );
  }
);
