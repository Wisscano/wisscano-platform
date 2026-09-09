/**
 * Seeds the database with exactly the content from the approved prototype
 * (§22 of the master spec) so the live site initially looks identical to
 * what was signed off, plus the operational scaffolding (document types,
 * default country/market, one super_admin login) needed to actually use
 * the Admin Centre on day one.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { db } from "./index";
import {
  siteSettings, countries, markets, adminUsers, brands, procurementCategories,
  services, showcaseItems, carouselConfigs, documentTypes, companyProfile, highlights,
} from "./schema";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function main() {
  console.log("Seeding Wisscano database...");

  // --- Site settings (singleton) ---
  const existingSettings = await db.select().from(siteSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(siteSettings).values({
      companyName: "Wisscano Technologies",
      tagline: "One hub. Infinite Tech Solutions.",
      acronymExpansion: "Wildcard ICT & IoT Systems, Software, Cloud, AI & Network Operations",
      heroHeadline: "SOURCE. PROCURE. DEPLOY.",
      heroSubheadline: "Technology procurement and digital solutions without borders.",
      contactEmail: "info@wisscano.co.ke",
      whatsappNumber: "254119834490",
      defaultCountryCode: "KE",
      defaultCurrency: "KES",
      seoDefaultTitle: "Wisscano Technologies — ICT & IoT Procurement Across Kenya, East Africa & Beyond",
      seoDefaultDescription: "Wisscano Technologies (Wildcard ICT & IoT Systems, Software, Cloud, AI & Network Operations) sources computing, networking, cybersecurity, cloud, AI and infrastructure technology for individuals, businesses and institutions across Kenya, East Africa and beyond. Tell us what you need — we handle the sourcing.",
    });
    console.log("  ✓ Site settings");
  }

  // --- Company profile (document engine) ---
  const existingCompany = await db.select().from(companyProfile).limit(1);
  if (existingCompany.length === 0) {
    await db.insert(companyProfile).values({
      legalName: "Wisscano Technologies",
      email: "info@wisscano.co.ke",
      phone: "+254119834490",
      website: "https://wisscano.co.ke",
    });
    console.log("  ✓ Company profile");
  }

  // --- Countries (international-first, Kenya as default) ---
  const existingCountries = await db.select().from(countries);
  let kenyaId = existingCountries.find((c) => c.isoCode === "KE")?.id;
  if (!kenyaId) {
    const [kenya] = await db.insert(countries).values({ name: "Kenya", isoCode: "KE", currency: "KES", locale: "en", callingCode: "+254" }).returning();
    kenyaId = kenya!.id;
    console.log("  ✓ Kenya (default country)");
  }

  const existingMarkets = await db.select().from(markets);
  if (existingMarkets.length === 0 && kenyaId) {
    await db.insert(markets).values({ countryId: kenyaId, regionName: "Nairobi", cityName: "Nairobi", procurementAvailable: true, deliveryAvailable: true });
    console.log("  ✓ Nairobi market");
  }

  // --- Admin user ---
  const existingAdmins = await db.select().from(adminUsers);
  if (existingAdmins.length === 0) {
    const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
    await db.insert(adminUsers).values({
      name: "Wisscano Admin", email: "admin@wisscano.co.ke",
      passwordHash: await hashPassword(password), role: "super_admin",
    });
    console.log(`  ✓ Admin user created — email: admin@wisscano.co.ke / password: ${password} (CHANGE THIS IMMEDIATELY)`);
  }

  // --- Brands ---
  const BRANDS = ["Dell", "HP", "Lenovo", "Cisco", "Aruba", "Ubiquiti", "MikroTik", "TP-Link", "Fortinet", "Sophos", "Logitech", "Poly", "Samsung", "Microsoft", "APC", "Eaton", "Vertiv", "Hikvision", "Synology", "Yealink"];
  const existingBrands = await db.select().from(brands);
  if (existingBrands.length === 0) {
    await db.insert(brands).values(BRANDS.map((name, i) => ({
      name, slug: slugify(name), displayOrder: i, state: "published" as const,
      description: `Wisscano can source ${name} technology and equipment on request, subject to supplier availability.`,
    })));
    console.log(`  ✓ ${BRANDS.length} brands`);
  }

  // --- What We Source: individual showcase records grouped by technology domain (final spec §7) ---
  // Not a flat category menu — each record is its own procurement-discovery entry, grouped for
  // navigation/internal-linking purposes via the `group` field.
  const CATEGORIES: { name: string; icon: string; blurb: string; group: string }[] = [
    // Computing
    { name: "Business Laptops", icon: "Laptop2", blurb: "Corporate and education fleets", group: "Computing" },
    { name: "Workstations", icon: "MonitorSmartphone", blurb: "High-performance desktop computing", group: "Computing" },
    { name: "Desktop Computers", icon: "MonitorSmartphone", blurb: "Standard office desktops", group: "Computing" },
    { name: "Monitors", icon: "MonitorSmartphone", blurb: "Displays for office and design work", group: "Computing" },
    // Networking
    { name: "Network Switches", icon: "Wifi", blurb: "Managed and unmanaged switching", group: "Networking" },
    { name: "Routers", icon: "Router", blurb: "Enterprise and branch routing", group: "Networking" },
    { name: "Wireless Access Points", icon: "Radio", blurb: "Access points, controllers", group: "Networking" },
    { name: "Firewalls", icon: "ShieldCheck", blurb: "Perimeter and next-gen firewalls", group: "Networking" },
    { name: "Fiber Optic Equipment", icon: "Cable", blurb: "Backbone and last-mile fiber, SFPs", group: "Networking" },
    { name: "Structured Cabling", icon: "Cable", blurb: "Cabling, patch panels, containment", group: "Networking" },
    // Servers & Infrastructure
    { name: "Servers", icon: "ServerCog", blurb: "Rack and tower servers", group: "Servers & Infrastructure" },
    { name: "Server Storage", icon: "HardDrive", blurb: "NAS, SAN, enterprise storage", group: "Servers & Infrastructure" },
    { name: "UPS Systems", icon: "BatteryCharging", blurb: "Backup power, inverters", group: "Servers & Infrastructure" },
    { name: "Server Racks", icon: "Database", blurb: "Rack enclosures and containment", group: "Servers & Infrastructure" },
    // Security & Surveillance
    { name: "CCTV Cameras", icon: "Camera", blurb: "IP and analog surveillance", group: "Security & Surveillance" },
    { name: "NVR / DVR Systems", icon: "Video", blurb: "Video recording infrastructure", group: "Security & Surveillance" },
    { name: "Access Control", icon: "Fingerprint", blurb: "Door and site access systems", group: "Security & Surveillance" },
    { name: "Biometric Systems", icon: "Fingerprint", blurb: "Fingerprint, facial recognition", group: "Security & Surveillance" },
    // Communication & Collaboration
    { name: "Business Headsets", icon: "Smartphone", blurb: "Calls and conferencing audio", group: "Communication & Collaboration" },
    { name: "Video Conferencing", icon: "MonitorSmartphone", blurb: "Meeting-room conferencing systems", group: "Communication & Collaboration" },
    { name: "IP Phones", icon: "Smartphone", blurb: "VoIP handsets and PBX equipment", group: "Communication & Collaboration" },
    // Printing & Imaging
    { name: "Printers", icon: "Printer", blurb: "Office and industrial printing", group: "Printing & Imaging" },
    { name: "Multifunction Printers", icon: "Printer", blurb: "Print, scan, copy, fax", group: "Printing & Imaging" },
    { name: "Projectors", icon: "Projector", blurb: "Meeting and classroom displays", group: "Printing & Imaging" },
    // IoT & Smart Technology
    { name: "IoT Devices", icon: "Radio", blurb: "Sensors, connected devices", group: "IoT & Smart Technology" },
    { name: "Smart Devices", icon: "Radio", blurb: "Automation and monitoring hardware", group: "IoT & Smart Technology" },
    { name: "Thermal Imaging", icon: "Thermometer", blurb: "Industrial and security imaging", group: "IoT & Smart Technology" },
    // Software & Digital Technology
    { name: "Business Software", icon: "CloudCog", blurb: "Productivity and line-of-business software", group: "Software & Digital Technology" },
    { name: "Security Software", icon: "ShieldCheck", blurb: "Endpoint and network security software", group: "Software & Digital Technology" },
    { name: "Digital Licensing", icon: "CloudCog", blurb: "OS and application licensing", group: "Software & Digital Technology" },
    // Cloud & Infrastructure Services
    { name: "Cloud Solutions", icon: "CloudCog", blurb: "Migration, hosting, hybrid cloud", group: "Cloud & Infrastructure Services" },
    { name: "Backup Solutions", icon: "HardDrive", blurb: "Data backup and recovery", group: "Cloud & Infrastructure Services" },
    // AI & Emerging Technology
    { name: "AI Infrastructure", icon: "Brain", blurb: "Compute for applied AI workloads", group: "AI & Emerging Technology" },
    { name: "AI-Enabled Technology", icon: "Brain", blurb: "AI-integrated business technology", group: "AI & Emerging Technology" },
    // Power & Connectivity
    { name: "Power Backup", icon: "BatteryCharging", blurb: "UPS and power protection", group: "Power & Connectivity" },
    { name: "Surge Protection", icon: "BatteryCharging", blurb: "Equipment and line protection", group: "Power & Connectivity" },
    { name: "Connectivity Accessories", icon: "Cable", blurb: "Adapters, cabling accessories", group: "Power & Connectivity" },
    // Device Repair Equipment (kept from original showcase)
    { name: "Device Repair Equipment", icon: "Wrench", blurb: "Diagnostic and servicing tools", group: "Servers & Infrastructure" },
  ];
  const existingCategories = await db.select().from(procurementCategories);
  if (existingCategories.length === 0) {
    await db.insert(procurementCategories).values(CATEGORIES.map((c, i) => ({
      name: c.name, slug: slugify(c.name), icon: c.icon, shortBlurb: c.blurb, group: c.group, displayOrder: i, state: "published" as const,
      description: `Wisscano can source ${c.name.toLowerCase()} from a broad ecosystem of manufacturers and suppliers.`,
      procurementInformation: "Available for single purchase, bulk procurement, project rollouts and recurring supply. Submit a specification, BOM or plain-language requirement and our team will source it.",
    })));
    console.log(`  ✓ ${CATEGORIES.length} sourcing categories across ${new Set(CATEGORIES.map((c) => c.group)).size} domain groups`);
  }

  // --- Services ---
  const SERVICES: { name: string; icon: string }[] = [
    { name: "IT Support", icon: "Wrench" }, { name: "Network Deployment", icon: "Wifi" },
    { name: "Fiber Installation", icon: "Cable" }, { name: "Server Solutions", icon: "ServerCog" },
    { name: "Cloud Services", icon: "CloudCog" }, { name: "CCTV Installation", icon: "Camera" },
    { name: "Device Servicing", icon: "Smartphone" }, { name: "Cybersecurity Services", icon: "ShieldCheck" },
    { name: "Managed IT Services", icon: "Settings2" }, { name: "Technology Consulting", icon: "Lightbulb" },
    { name: "ICT Procurement", icon: "PackageSearch" },
  ];
  const existingServices = await db.select().from(services);
  if (existingServices.length === 0) {
    await db.insert(services).values(SERVICES.map((s, i) => ({
      name: s.name, slug: slugify(s.name), icon: s.icon, displayOrder: i, state: "published" as const,
      description: `${s.name}, delivered by Wisscano's technology solutions team.`,
    })));
    console.log(`  ✓ ${SERVICES.length} services`);
  }

  // --- ICT Showcase ---
  const SHOWCASE = [
    { title: "Enterprise networking", subtitle: "Structured, resilient, built to scale with the organisation.", category: "Networking" },
    { title: "Data centre infrastructure", subtitle: "Racks, cooling and power sourced and specified correctly.", category: "Data Centre" },
    { title: "Surveillance & access control", subtitle: "Site-wide coverage, sourced to the actual risk profile.", category: "CCTV" },
    { title: "Cybersecurity operations", subtitle: "Perimeter to endpoint, matched to real exposure.", category: "Cybersecurity" },
  ];
  const existingShowcase = await db.select().from(showcaseItems);
  if (existingShowcase.length === 0) {
    await db.insert(showcaseItems).values(SHOWCASE.map((s, i) => ({
      title: s.title, subtitle: s.subtitle, category: s.category, displayOrder: i, state: "published" as const,
      description: `${s.title} — one of the technology environments Wisscano sources and supports.`,
      altText: `Illustration representing ${s.title.toLowerCase()}`,
    })));
    console.log(`  ✓ ${SHOWCASE.length} showcase items (no images attached — upload via /admin/showcase)`);
  }

  // --- Carousel configs (px/sec speed model — supports bidirectional drag) ---
  const existingCarousels = await db.select().from(carouselConfigs);
  if (existingCarousels.length === 0) {
    await db.insert(carouselConfigs).values([
      { type: "brands", direction: "left", speedPxPerSec: 34, active: true, pauseOnHover: true },
      { type: "what_we_source", direction: "right", speedPxPerSec: 26, active: true, pauseOnHover: true },
      { type: "services", direction: "left", speedPxPerSec: 30, active: true, pauseOnHover: true },
    ]);
    console.log("  ✓ 3 carousel configs (brands: left, what_we_source: right, services: left)");
  }

  // --- Homepage Highlights / Announcements (approved enhancement §11-14) ---
  const existingHighlights = await db.select().from(highlights);
  if (existingHighlights.length === 0) {
    await db.insert(highlights).values([
      {
        type: "wisscano_launch", title: "WISSCANO FORGE",
        shortDescription: "A hybrid AI + human digital technology creation platform.",
        ctaLabel: "Explore Forge", ctaUrl: "https://forge.wisscano.co.ke",
        isExternal: true, openInNewTab: true, active: true, priority: 10, displayOrder: 0,
      },
      {
        type: "new_service", title: "Managed Cybersecurity",
        shortDescription: "Continuous monitoring and response, now available as a managed service.",
        ctaLabel: "Learn more", ctaUrl: "#services",
        isExternal: false, openInNewTab: false, active: true, priority: 5, displayOrder: 1,
      },
      {
        type: "procurement_update", title: "Bulk Fiber Sourcing",
        shortDescription: "Expanded supplier network for large-scale fiber infrastructure rollouts.",
        ctaLabel: "Request procurement", ctaUrl: "#request",
        isExternal: false, openInNewTab: false, active: true, priority: 1, displayOrder: 2,
      },
    ]);
    console.log("  ✓ 3 homepage highlights (Forge launch, Managed Cybersecurity, Bulk Fiber Sourcing)");
  }

  // --- Document types (Phase 6) ---
  const DOC_TYPES = [
    { name: "Quotation", code: "QT" }, { name: "Proforma Invoice", code: "PFI" }, { name: "Invoice", code: "INV" },
    { name: "Local Purchase Order", code: "LPO" }, { name: "Purchase Order", code: "PO" },
    { name: "Delivery Note", code: "DN" }, { name: "Receipt", code: "RCT" },
  ];
  const existingDocTypes = await db.select().from(documentTypes);
  if (existingDocTypes.length === 0) {
    await db.insert(documentTypes).values(DOC_TYPES);
    console.log(`  ✓ ${DOC_TYPES.length} document types`);
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .finally(() => process.exit(0));
