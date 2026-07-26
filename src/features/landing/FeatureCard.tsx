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
        flex size-11 items-center justify-center rounded-lg border
        border-primary/15 bg-primary/10 text-primary
        [&_svg]:size-5
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
