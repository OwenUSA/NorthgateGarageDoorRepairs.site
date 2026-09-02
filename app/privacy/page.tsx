import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { PolicyBody } from '@/components/privacy/PolicyBody';

export const metadata: Metadata = {
  title: copy.routes['/privacy'].meta.title,
  description: copy.routes['/privacy'].meta.description,
};

export default function PrivacyPage() {
  return <PolicyBody />;
}
