export const CTABanner = (props: {
  title: string;
  description: string;
  buttons: React.ReactNode;
}) => (
  <div
    className="
      relative overflow-hidden rounded-2xl border border-primary/15
      bg-linear-to-br from-primary via-[oklch(0.45_0.12_175)]
      to-[oklch(0.4_0.1_220)] px-6 py-12 text-center shadow-lg
      sm:px-10
    "
  >
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, oklch(0.85 0.1 200 / 0.4) 0%, transparent 45%)',
      }}
      aria-hidden="true"
    />

    <div className="relative">
      <h2 className="
        text-3xl font-bold tracking-tight text-balance text-primary-foreground
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
