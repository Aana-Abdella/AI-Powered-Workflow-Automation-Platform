export default function SelectPlanStepPage() {
  return (
    <main className="mx-auto max-w-3xl p-8 text-dark-50">
      <h1 className="text-2xl font-semibold">Select a plan</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PlanCard name="Free" price="$0" />
        <PlanCard name="Pro" price="$99" featured />
        <PlanCard name="Enterprise" price="Custom" />
      </div>
    </main>
  );
}

function PlanCard({ name, price, featured = false }: { name: string; price: string; featured?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${featured ? 'border-primary-500 bg-primary-950/20' : 'border-dark-800 bg-dark-900'}`}>
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-2 text-dark-300">{price}</p>
      <button className="mt-4 rounded-md border border-dark-700 px-3 py-2 text-sm text-dark-200 hover:bg-dark-800">Choose</button>
    </div>
  );
}
