import Link from 'next/link';

const steps = [
  { href: '/onboarding/email-verification', label: 'Email verification' },
  { href: '/onboarding/create-organization', label: 'Create organization' },
  { href: '/onboarding/select-plan', label: 'Select plan' },
  { href: '/onboarding/quick-start', label: 'Quick-start tutorial' },
  { href: '/onboarding/create-first-workflow', label: 'Create first workflow' },
];

export default function OnboardingIndexPage() {
  return (
    <main className="mx-auto max-w-2xl p-8 text-dark-50">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <p className="mt-2 text-dark-400">Complete setup to start automating workflows.</p>
      <ul className="mt-6 space-y-3">
        {steps.map((step) => (
          <li key={step.href}>
            <Link href={step.href} className="block rounded-lg border border-dark-800 bg-dark-900 px-4 py-3 hover:bg-dark-800">
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
