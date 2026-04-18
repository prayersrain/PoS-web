export const siteConfig = {
  name: "Hal PoS",
  companyName: "Hal PoS Management",
  description: "Modern & Real-time Point of Sale System",
  slogan: "Simple, Fast, & Reliable",
  colors: {
    primary: "indigo-600",
    primaryHover: "indigo-700",
    primaryLight: "indigo-50",
    secondary: "slate-600",
    accent: "emerald-500",
  },
  receipt: {
    footer: "Thank you for visiting!",
    width: "58mm", // Standard thermal printer width
  },
  contact: {
    address: "Street Name, City",
    phone: "+62 8xx-xxxx-xxxx",
  }
};

export type SiteConfig = typeof siteConfig;
