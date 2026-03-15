import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { AppShell } from "~~/components/AppShell";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const viewport = {
  width: "device-width",
  initialScale: 0.8,
};

export const metadata = getMetadata({
  title: "ZK LLM API — Private AI via ZK Proofs",
  description: "Private LLM API access via ZK proofs. No account. No API key. Just a proof.",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
