export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">DriftLock</h1>
        <p className="text-lg text-gray-600 mb-8">
          Selectors break when websites redesign. We fix that.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          Enter Dashboard
        </a>
      </div>
    </main>
  );
}
