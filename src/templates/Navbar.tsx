import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';
import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="
        mx-auto max-w-6xl px-4 py-3
        sm:px-6
      "
      >
        <CenteredMenu
          logo={<Logo />}
          rightMenu={(
            <>
              <li className="max-lg:w-full max-lg:px-1">
                <LocaleSwitcher />
              </li>
              <li className="max-lg:w-full">
                <Link
                  className="
                    rpp-link block rounded-lg px-3 py-2 text-muted-foreground
                    max-lg:w-full
                  "
                  href="/sign-in"
                >
                  {t('sign_in')}
                </Link>
              </li>
              <li className="max-lg:w-full">
                <Link
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    `
                      rpp-press
                      max-lg:w-full
                    `,
                  )}
                  href="/sign-up"
                >
                  {t('sign_up')}
                </Link>
              </li>
            </>
          )}
        >
          <li>
            <a href="#features">{t('product')}</a>
          </li>
          <li>
            <a href="#how-it-works">{t('how_it_works')}</a>
          </li>
          <li>
            <a href="#pricing">{t('pricing')}</a>
          </li>
          <li>
            <a href="#faq">{t('faq')}</a>
          </li>
        </CenteredMenu>
      </div>
    </header>
  );
};
