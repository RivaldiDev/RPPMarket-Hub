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
        flex justify-center
        lg:justify-start
      "
      >
        {props.banner}
      </div>

      <h1
        className="
          mt-5 font-display text-4xl font-semibold tracking-tight text-balance
          sm:text-5xl
          lg:text-[3.4rem] lg:leading-[1.1]
        "
      >
        {props.title}
      </h1>

      <p
        className="
          mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground
          lg:mx-0
        "
      >
        {props.description}
      </p>

      <div
        className="
          mt-8 flex flex-wrap items-center justify-center gap-3
          lg:justify-start
        "
      >
        {props.buttons}
      </div>
    </div>

    {props.preview && (
      <div className="relative">
        {props.preview}
      </div>
    )}
  </div>
);
