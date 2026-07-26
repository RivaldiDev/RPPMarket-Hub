import { AppConfig } from '@/utils/AppConfig';
import { cn } from '@/utils/Helpers';

export const Logo = (props: {
  isTextHidden?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      'flex items-center gap-2 text-base font-semibold tracking-tight',
      props.className,
    )}
  >
    <span
      className="
        relative flex size-8 items-center justify-center rounded-xl
        bg-linear-to-br from-primary to-[oklch(0.5_0.12_200)]
        text-primary-foreground shadow-sm
      "
      aria-hidden="true"
    >
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h16" />
        <path d="M4 12h10" />
        <path d="M4 17h7" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </span>
    {!props.isTextHidden && <span>{AppConfig.name}</span>}
  </div>
);
