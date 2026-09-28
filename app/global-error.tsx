"use client";

/**
 * Root layout'ning o'zida xato bo'lganda ko'rsatiladi. U o'z <html>/<body>'ini chizadi va global CSS'ni
 * olmaydi, shuning uchun uslublar shu yerda yozilgan.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 16,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f0f2f2",
          color: "#212529",
        }}
      >
        <title>Xatolik · onetizim</title>
        <h1 style={{ fontSize: 20, margin: 0 }}>Nimadir xato ketdi</h1>
        <p style={{ maxWidth: 420, margin: 0, fontSize: 14, color: "#64748b" }}>
          Tizimni yuklashda xatolik yuz berdi. Qayta urinib ko&apos;ring; takrorlansa, administratorga murojaat qiling.
        </p>
        {error.digest && <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Xato kodi: {error.digest}</p>}
        <button
          type="button"
          onClick={() => retry()}
          style={{
            border: 0,
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            background: "#3d68ff",
            cursor: "pointer",
          }}
        >
          Qayta urinish
        </button>
      </body>
    </html>
  );
}
