// TODO: 4-bosqich — sidebar (Guruhlar, O'quvchilar, Davomat, To'lovlar,
// Jadval, Sozlamalar) + header, dark theme (#0f1420 fon).
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
