import "./globals.css";

export const metadata = {
  title: "Deduction repeal analysis | PolicyEngine",
  description:
    "10-year federal revenue scores for repealing US tax deductions, with behavioral responses and UBI recycling",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
