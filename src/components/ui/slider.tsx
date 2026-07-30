import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Show the current value inside the balloon thumb (default: true) */
  showValue?: boolean;
  /** Format the value rendered inside the thumb */
  formatValue?: (v: number) => string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue = true, formatValue, ...props }, ref) => {
  const values: number[] =
    (props.value as number[] | undefined) ??
    (props.defaultValue as number[] | undefined) ??
    [props.min ?? 0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "glass-tile relative flex w-full touch-none select-none items-center rounded-full px-2.5 py-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[5px] w-full grow rounded-full bg-foreground/10">
        {/* tick dots */}
        <span className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="size-[3px] rounded-full bg-foreground/20" />
          ))}
        </span>
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((v, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "group grid h-6 w-9 place-items-center rounded-[10px]",
            "bg-[color-mix(in_oklab,var(--background)_92%,white)] backdrop-blur-md",
            "shadow-[0_1px_1px_rgba(0,0,0,0.10),0_6px_14px_-4px_rgba(0,0,0,0.28),inset_0_1px_0_var(--glass-rim)]",
            "ring-1 ring-foreground/10",
            "transition-transform duration-150 ease-out will-change-transform",
            "focus-visible:outline-none active:scale-115 data-[state=active]:scale-115",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {showValue && (
            <span className="pointer-events-none select-none font-mono text-[9px] font-semibold leading-none tabular-nums text-foreground/70">
              {formatValue ? formatValue(v) : Math.round(v)}
            </span>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
