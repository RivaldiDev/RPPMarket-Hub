import { cn } from '@/utils/Helpers';

export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <article className={cn('rpp-card rpp-reveal p-6', props.className)}>
    <div
      className="
        flex size-12 items-center justify-center rounded-xl bg-linear-to-br
        from-primary to-[oklch(0.5_0.12_200)] text-primary-foreground shadow-sm
        [&_svg]:size-6
      "
      aria-hidden="true"
    >
      {props.icon}
    </div>

    <h3 className="mt-4 text-lg font-semibold tracking-tight">{props.title}</h3>

    <div className="mt-2 text-sm/relaxed text-muted-foreground">
      {props.children}
    </div>
  </article>
);
