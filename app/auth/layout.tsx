import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Resume<span className="text-blue-600">AI</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Resume ATS score checker</p>
        </div>

        {children}
      </div>
    </div>
  );
}
