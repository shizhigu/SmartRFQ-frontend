import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient';

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return <DashboardLayoutClient {...props} />;
}

export const dynamic = 'force-dynamic';
