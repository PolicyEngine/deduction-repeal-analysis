export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://deduction-repeal-analysis.policyengine.org/sitemap.xml",
  };
}
