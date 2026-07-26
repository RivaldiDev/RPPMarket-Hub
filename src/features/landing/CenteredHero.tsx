export const CenteredHero = (props: {
  banner: React.ReactNode;
  title: React.ReactNode;
  description: string;
  buttons: React.ReactNode;
  preview?: React.ReactNode;
}) => (
  <div className="
    grid items-center gap-12
    lg:grid-cols-[1.05fr_0.95fr] lg:gap-16
  "
  >
    <div className="
      text-center
      lg:text-left
    "
    >
      <div className="
        rpp-hero-enter flex justify-center
        lg:justify-start
      "
      >
        {props.banner}
      </div>

      <h1
        className="
          rpp-hero-enter rpp-hero-enter-delay-1 mt-5 text-4xl font-bold
          tracking-tight text-balance
          sm:text-5xl
          lg:text-[3.25rem] lg:leading-[1.08]
        "
      >
        {props.title}
      </h1>

      <p
        className="
          rpp-hero-enter rpp-hero-enter-delay-2 mx-auto mt-5 max-w-xl text-lg
          text-pretty text-muted-foreground
          lg:mx-0
        "
      >
        {props.description}
      </p>

      <div
        className="
          rpp-hero-enter rpp-hero-enter-delay-3 mt-8 flex flex-wrap items-center
          justify-center gap-3
          lg:justify-start
        "
      >
        {props.buttons}
      </div>
    </div>

    {props.preview && (
      <div className="rpp-hero-enter rpp-hero-enter-delay-4 relative">
        {props.preview}
      </div>
    )}
  </div>
);
