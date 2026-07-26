export const CTABanner = (props: {
  title: string;
  description: string;
  buttons: React.ReactNode;
}) => (
  <div
    className="
      relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center
      sm:px-10
    "
  >
    <div className="relative">
      <h2 className="
        font-display text-3xl font-semibold tracking-tight text-balance
        text-primary-foreground
        sm:text-4xl
      "
      >
        {props.title}
      </h2>

      <p className="
        mx-auto mt-3 max-w-2xl text-base text-pretty text-primary-foreground/85
        sm:text-lg
      "
      >
        {props.description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {props.buttons}
      </div>
    </div>
  </div>
);
