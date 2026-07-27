import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b0f1a" }}>
      <div className="max-w-sm w-full mx-auto px-6 text-center">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2.5 mb-12">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fe2c55, #25f4ee)",
              color: "#0b0f1a",
            }}
          >
            LL
          </div>
          <span className="text-lg font-bold text-white/80 tracking-tight">
            Live Leads
          </span>
        </a>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full mx-auto",
              card: "bg-[#1a1d2e] shadow-lg border border-white/10",
              headerTitle: "text-white/90 text-xl",
              headerSubtitle: "text-white/40 text-sm",
              socialButtonsBlockButton:
                "bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl text-sm",
              formButtonPrimary:
                "bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white rounded-xl",
              footerActionLink: "text-[#fe2c55] hover:text-[#fe2c55]/80",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30",
              formFieldLabel: "text-white/50",
              formFieldInput:
                "bg-white/5 border-white/10 text-white rounded-xl",
            },
          }}
          signUpUrl="/"
        />

        <p className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            ← Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}
