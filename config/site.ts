export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "GHS Label Generator | MyChemLabel 100% FREE",
  description:
    "A free tool to create GHS-compliant labels quickly and easily. Integrates PubChem CID lookup for auto-filling chemical data, saving time and ensuring accuracy. Simplify hazard labeling with this open and accessible solution!",
  navItems: [
    {
      label: "PubChem to GHS",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "PubChem to GHS",
      href: "/",
    },
    {
      label: "About",
      href: "/About",
    },
  ],
  links: {
    github: "#",
    sponsor: "#",
  },
};
