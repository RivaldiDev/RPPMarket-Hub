import { useTranslations } from 'next-intl';
import { AppConfig } from '@/utils/AppConfig';

export const CenteredFooter = (props: {
  logo: React.ReactNode;
  name: string;
  iconList: React.ReactNode;
  legalLinks: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('Footer');

  return (
    <div className="flex flex-col items-center text-center">
      {props.logo}

      <ul
        className="
          mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2
          text-sm font-medium
          max-sm:flex-col
        "
      >
        {props.children}
      </ul>

      <ul
        className="
          [&_a]:rpp-press
          mt-5 flex flex-row gap-x-4 text-muted-foreground
          [&_a]:transition-opacity
          hover:[&_a]:opacity-70
          [&_svg]:size-5 [&_svg]:fill-current
        "
      >
        {props.iconList}
      </ul>

      <div
        className="
          mt-8 flex w-full items-center justify-between gap-y-3 border-t
          border-border/80 pt-4 text-sm text-muted-foreground
          max-md:flex-col
        "
      >
        <div>
          {t('footer_text', {
            year: new Date().getFullYear(),
            name: props.name || AppConfig.name,
          })}
        </div>

        <ul className="
          [&_a]:rpp-link
          flex gap-x-4 font-medium
        "
        >
          {props.legalLinks}
        </ul>
      </div>
    </div>
  );
};
