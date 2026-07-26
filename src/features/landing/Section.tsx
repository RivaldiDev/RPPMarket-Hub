import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  id?: string;
  bare?: boolean;
}) => (
  <section
    id={props.id}
    className={cn(`
      @container px-4 py-20
      sm:px-6
      lg:px-8
    `, props.className)}
  >
    {(props.title || props.subtitle || props.description) && (
      <div className="mx-auto mb-14 max-w-3xl text-center">
        {props.subtitle && (
          <div className="
            text-sm font-semibold tracking-wide text-primary uppercase
          "
          >
            {props.subtitle}
          </div>
        )}

        {props.title && (
          <h2 className="
            mt-2 text-3xl font-bold tracking-tight text-balance
            sm:text-4xl
          "
          >
            {props.title}
          </h2>
        )}

        {props.description && (
          <p className="
            mt-3 text-base text-pretty text-muted-foreground
            sm:text-lg
          "
          >
            {props.description}
          </p>
        )}
      </div>
    )}

    <div className={cn(!props.bare && 'mx-auto max-w-6xl')}>{props.children}</div>
  </section>
);
