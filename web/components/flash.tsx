// Shows the ?error= / ?notice= message that server actions redirect with.
export function Flash({ params }: { params: Record<string, string | string[] | undefined> }) {
  const error = typeof params.error === "string" ? params.error : null;
  const notice = typeof params.notice === "string" ? params.notice : null;
  if (!error && !notice) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        error ? "border-red-200 bg-red-50 text-red-800" : "border-teal-200 bg-teal-50 text-teal-900"
      }`}
    >
      {error ?? notice}
    </div>
  );
}

export type PageParams = Promise<Record<string, string | string[] | undefined>>;
