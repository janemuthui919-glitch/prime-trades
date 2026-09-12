import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { buildFaviconUri } from '@/lib/build-favicon-uri';
import { getLogoSrc } from '@/lib/get-logo-src';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import { LogoSrcProvider } from '@/components/custom/logo-src-provider';
import { TemplateI18nProvider } from '../lib/i18n/provider';
import '@/app/globals.css';
import './globals.css';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';
import './custom.css';

// SmartCharts declares `font-family: IBM Plex Sans, sans-serif` internally.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export function generateMetadata(): Metadata {
  const faviconUri = buildFaviconUri();
  return {
    title: process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim() || 'Deriv Accumulators Trading App',
    description: 'A white-label accumulator trading application powered by Deriv',
    ...(faviconUri ? { icons: { icon: faviconUri } } : {}),
  };
}

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = getLogoSrc();
  return (
    <html lang="en" className="h-full lg:h-auto" suppressHydrationWarning>
      <body
        className={`${fontClass} ${ibmPlexSans.variable} bg-background flex min-h-dvh flex-col overflow-hidden max-lg:h-dvh max-lg:overflow-hidden lg:block lg:h-auto lg:min-h-screen lg:overflow-x-hidden lg:overflow-y-auto`}
      >
        <TemplateI18nProvider>
          <TemplateLayout>
            <LogoSrcProvider logoSrc={logoSrc}>{children}</LogoSrcProvider>
          </TemplateLayout>
        </TemplateI18nProvider>
      </body>
    </html>
  );
}
