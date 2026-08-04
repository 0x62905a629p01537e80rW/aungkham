import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Kept for API compatibility — the plain slider has no in-thumb read-out. */
  showValue?: boolean;
  formatValue?: (v: number) => string;
}

/**
 * Minimal slider: a hairline track and a round knob, no card behind it.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue: _showValue, formatValue: _formatValue, ...props }, ref) => {
  const values: number[] =
    (props.value as number[] | undefined) ??
    (props.defaultValue as number[] | undefined) ??
    [props.min ?? 0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow rounded-full bg-foreground/15">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block size-[18px] rounded-full bg-foreground",
            "shadow-[0_1px_4px_rgba(0,0,0,0.35)]",
            "transition-transform duration-150 ease-out will-change-transform",
            "focus-visible:outline-none active:scale-110 data-[state=active]:scale-110",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
