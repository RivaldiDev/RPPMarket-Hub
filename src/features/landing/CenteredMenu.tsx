'use client';

import { MenuToggle } from '@/components/MenuToggle';
import { useMenu } from '@/hooks/UseMenu';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export const CenteredMenu = (props: {
  logo: React.ReactNode;
  children: React.ReactNode;
  rightMenu: React.ReactNode;
}) => {
  const { isMenuOpen, toggleMenu } = useMenu();

  const panelClass = cn(
    `
      max-lg:w-full max-lg:rounded-xl max-lg:border max-lg:border-border/80
      max-lg:bg-card/95 max-lg:p-4 max-lg:shadow-sm
    `,
    {
      'max-lg:hidden': !isMenuOpen,
    },
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-3">
      <Link href="/" className="rpp-press relative z-10">
        {props.logo}
      </Link>

      <div className="lg:hidden">
        <MenuToggle onClick={toggleMenu} />
      </div>

      <nav
        className={cn('max-lg:order-3 max-lg:mt-3', panelClass)}
        aria-label="Primary"
      >
        <ul
          className="
            [&_a]:rpp-link
            flex items-center gap-x-1 text-sm font-medium
            max-lg:flex-col max-lg:items-stretch max-lg:gap-y-1
            lg:gap-x-1
            [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2 [&_a]:text-muted-foreground
            [&_a]:transition-[color,background-color,transform]
            [&_a]:duration-150 [&_a]:ease-out-strong
            hover:[&_a]:bg-accent/70 hover:[&_a]:text-foreground
            max-lg:[&_a]:inline-block max-lg:[&_a]:w-full
            max-lg:[&_a]:rounded-lg max-lg:[&_a]:px-3 max-lg:[&_a]:py-2.5
          "
        >
          {props.children}
        </ul>
      </nav>

      <div className={cn('max-lg:order-4 max-lg:mt-2', panelClass)}>
        <ul className="
          flex flex-row items-center gap-x-2 text-sm font-medium
          max-lg:flex-col max-lg:items-stretch max-lg:gap-y-2
        "
        >
          {props.rightMenu}
        </ul>
      </div>
    </div>
  );
};
