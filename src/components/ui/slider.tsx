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
        "relative flex w-full touch-none select-none items-center py-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-primary/25">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((v, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "group grid size-7 place-items-center rounded-full bg-background",
            "shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-primary/25",
            "transition-transform duration-150 ease-out will-change-transform",
            "focus-visible:outline-none active:scale-125 data-[state=active]:scale-125",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {showValue && (
            <span className="pointer-events-none select-none font-mono text-[10px] font-semibold leading-none tabular-nums text-primary">
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
