export default function EmailVerificationStepPage() {
  return (
    <main className="mx-auto max-w-xl p-8 text-dark-50">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-dark-400">We sent a confirmation link. Resend if needed.</p>
      <button className="mt-6 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500">Resend email</button>
    </main>
  );
}
