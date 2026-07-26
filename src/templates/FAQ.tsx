import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/Reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Section } from '@/features/landing/Section';

export const FAQ = () => {
  const t = useTranslations('FAQ');
  const items = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

  return (
    <Section
      id="faq"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <Reveal className="mx-auto max-w-3xl">
        <Accordion type="multiple" className="w-full">
          {items.map(item => (
            <AccordionItem key={item} value={item} className="border-border/80">
              <AccordionTrigger className="
                text-left text-base font-medium
                hover:no-underline
              "
              >
                {t(`${item}_question`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`${item}_answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
};
