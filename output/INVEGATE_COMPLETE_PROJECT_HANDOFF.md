# INVEGATE Complete Project Handoff
> Last updated: August 6, 2026. A single source of truth for understanding, maintaining, and extending this web app.

> This documentation is generated from the current workspace at C:/Users/Ahmed/OneDrive/bis/land-platform-optimized-before-admin. The source appendix includes every app page, component, library module, and key config file. The hard-coded Supabase anon key found in ReserveButton.js is intentionally redacted in the documentation copy.

## 1. What Is Invegate?

Invegate is a luxury Egyptian land real estate platform for browsing curated land projects, viewing location and project details, contacting Invegate on WhatsApp, and submitting reservation requests. The business team manages locations, developers, land projects, gallery images, installment options, and buyer reservations through a custom admin panel.

- Public users browse from the home page to a location page, then to a project detail page.
- Project details include gallery photos, status, price per square meter, total project area, selectable area options, installment plans, exact map link, developer information, WhatsApp contact, and reservation flow.
- Reservations collect buyer name, phone, national ID front/back uploads, selected land area, selected installment plan, and a pending status before manual payment verification.
- Admins can create, edit, and delete locations, developers, projects, images, area options, installment plans, price-grid values, and reservations.

## 2. Tech Stack

| Layer | Technology / Detail |
| --- | --- |
| Framework | Next.js 16.2.9 with App Router in src/app |
| React | React 19.2.4 and react-dom 19.2.4 |
| Language | JavaScript, no TypeScript source files |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth email/password for admin login |
| Storage | Supabase Storage buckets for locations, developers, land photos, and reservation ID files |
| Styling | Mostly inline React styles plus src/app/globals.css and Tailwind v4 import |
| Fonts | Cormorant Garamond for headings and Manrope for body via next/font/google |
| Payments | Manual InstaPay/payment confirmation flow; no payment gateway API in code |
| Maps | External location_url links; no embedded map component |

## 3. Architecture

### High Level Flow

- Server components fetch public Supabase data for home, location, project detail, and admin dashboard routes.
- Client components handle search, hover states, splash animation, gallery interaction, CRUD forms, uploads, reservation submission, and admin logout.
- The public Supabase client in src/lib/supabase.js uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
- The admin dashboard uses createSupabaseServerClient in src/lib/supabaseServer.js to read authenticated server-side data using cookies.
- Most admin CRUD screens instantiate Supabase directly in client components and depend on Supabase Auth plus RLS policies for protection.

### Route Map

| Route | File | Purpose | Main Data |
| --- | --- | --- | --- |
| / | src/app/page.js | Home page with hero, counts, search, and location cards | locations, lands, developers |
| /location/[id] | src/app/location/[id]/page.js | Shows one location and its projects | locations, lands, developers |
| /land/[id] | src/app/land/[id]/page.js | Shows project gallery, details, options, contact, and reserve flow | lands, locations, developers, land_images, land_areas, installment plans, price rows |
| /admin/login | src/app/admin/login/page.js | Admin email/password sign-in | Supabase Auth |
| /admin | src/app/admin/page.js | Admin dashboard stats and recent activity | locations, lands, developers, reservations |
| /admin/locations | src/app/admin/locations/page.js | Location CRUD and cover upload | locations, location-images bucket |
| /admin/lands | src/app/admin/lands/page.js | Project CRUD, gallery upload, thumbnail, area options, installment plans, price grid | lands, land_images, land_areas, land_installment_plans, land_area_plan_prices |
| /admin/developers | src/app/admin/developers/page.js | Developer CRUD and logo upload | developers, developer-logos bucket |
| /admin/reservations | src/app/admin/reservations/page.js | Reservation review, signed ID URLs, status updates, deletion | reservations, lands, locations, land_areas, installment plans, reservations bucket |

## 4. User Workflows

### Buyer Discovery Flow

- The root layout wraps every page in SplashScreen, so first load shows a brief Invegate logo splash.
- Home fetches location cards and counts available projects per location.
- LocationSearch filters locations by name on the client.
- A location page fetches location details, all lands in that location, and developer names for cards.
- Project cards link to /land/[id], where the project page fetches gallery images, developer, location, area options, installment plans, and total prices.
- ProjectDetails requires the buyer to choose an available area and an installment plan before ReserveButton is enabled.
- The WhatsApp button opens wa.me with a pre-filled interest message.

### Reservation Flow

- ReserveButton starts disabled until selectedArea and selectedPlan are both present.
- The form collects buyer name, phone, optional national ID front image, and optional national ID back image.
- ID files upload to the private reservations storage bucket under {landId}/{timestamp}_front/back_{filename}.
- A row is inserted into reservations with land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, and status pending.
- After the database insert succeeds, the UI switches to a payment instruction step. Payment verification is manual and handled later by admin status updates.

### Admin Flow

- AdminLoginPage signs in with Supabase Auth and redirects to /admin.
- AdminLayout provides desktop sidebar navigation, mobile bottom navigation, and sign-out.
- AdminDashboard shows counts, recent pending reservations, and recent projects.
- Locations and developers are simple CRUD pages with public storage uploads for images/logos.
- Projects include basic fields, multiple gallery images, a thumbnail, area options, installment plans, and an exact price grid for every area-plan pair.
- Reservations can be filtered by all, pending, confirmed, or rejected; selecting one shows buyer/project/details plus signed private ID photo URLs for one hour.

## 5. Design System

| Token | Value | Usage |
| --- | --- | --- |
| Gold | #C9973A | Primary brand accent, borders, buttons, links |
| Gold Light | #E8C97A | Highlighted price/status text |
| Charcoal Background | #2C2C2E | Main app background |
| Charcoal Card | #343437 | Cards, panels, form surfaces |
| Charcoal Inset | #3A3A3D | Inputs and nested controls |
| Text Primary | #F0EDE6 | Main copy and headings |
| Text Secondary | #9A9489 | Descriptions and helper text |
| Text Muted | #6B6762 | Labels, placeholders, metadata |
| Available | #4DC98A | Available status |
| Reserved | #E8C97A | Reserved status |
| Sold / Rejected | #E07070 | Sold or rejected status |

- Headings use the Cormorant Garamond font variable where available; many admin pages still hard-code Georgia, serif.
- Body text uses Manrope globally, while several older page snippets still specify Inter, Arial, sans-serif inline.
- Cards use dark surfaces, thin gold borders, subtle hover lifts, and restrained rounded corners.
- Admin layouts are responsive through inline media-query style tags in AdminLayout.
- Most visual behavior lives directly inside component files rather than a shared component library.

## 6. Data Model

> The schema below is inferred from the current application code and previous documentation. Confirm exact constraints in Supabase before migrations or production deployment.

| Table | Columns Used By App | Purpose |
| --- | --- | --- |
| locations | id, name, description, image_url, created_at | Public browsing locations and admin-managed location covers |
| developers | id, name, bio, logo_url | Developer profile shown on projects and managed by admin |
| lands | id, location_id, developer_id, title, price, area_sqm, price_per_meter, status, description, location_url, contact_whatsapp, contact_phone, image_url, created_at | Core project/listing record |
| land_images | id, land_id, image_url | Gallery images for a project |
| land_areas | id, land_id, area_sqm, status, created_at | Selectable buyer plot sizes with availability per size |
| land_installment_plans | id, land_id, label, down_payment_percent, years, created_at | Selectable payment plans per project |
| land_area_plan_prices | land_area_id, installment_plan_id, total_price | Exact price for one area-plan combination; upsert expects unique land_area_id + installment_plan_id |
| reservations | id, land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, status, created_at | Buyer reservation records and private ID file paths |

### Storage Buckets

| Bucket | Access | Used In | Purpose / Path Pattern |
| --- | --- | --- | --- |
| location-images | Public | Admin locations | {timestamp}_{random}.{ext}; public URL saved to locations.image_url |
| developer-logos | Public | Admin developers | {timestamp}_{random}.{ext}; public URL saved to developers.logo_url |
| land-images | Public | Admin lands | lands/{landId}/{timestamp}_{random}.{ext}; public URL saved to land_images and lands.image_url thumbnail |
| reservations | Private | ReserveButton and Admin reservations | {landId}/{timestamp}_front/back_{filename}; path saved in reservations and viewed through signed URLs |

## 7. Configuration And Environment

- Required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
- jsconfig.json maps @/* to ./src/*.
- next.config.mjs allows remote images from any HTTPS hostname using images.remotePatterns hostname **.
- next.config.mjs enables reactStrictMode and disables the powered-by header.
- The current code references /logo.png in SplashScreen and Home, but public/logo.png is not present in this workspace. The visible public asset is public/envegate_logo-removebg-preview.png.
- The admin middleware code is located at src/app/admin/middleware.js. Next.js middleware is normally discovered from middleware.js at the project root or src/middleware.js, so this file may not protect admin routes until moved or confirmed in the deployed runtime.

## 8. Supabase And RLS Expectations

- Public read access is needed for locations, lands, developers, land_images, land_areas, land_installment_plans, and land_area_plan_prices.
- Public reservation insert access is needed if unauthenticated buyers can reserve, but it should be limited to expected columns and should force status to pending.
- Reservation ID files should remain private; buyers upload, admins generate signed read URLs.
- Admin writes for locations, developers, lands, images, areas, plans, prices, and reservations should require authenticated Supabase users.
- Because most admin screens use a browser-side Supabase anon client, RLS is the true security boundary. The app must not rely on hidden routes alone.

## 9. Page And Component Responsibilities

| File | Responsibility |
| --- | --- |
| src/app/layout.js | Loads global CSS, Google fonts, metadata, and wraps app with SplashScreen. |
| src/app/page.js | Home page: fetches locations, lands, developers; computes counts; renders hero and LocationSearch. |
| src/app/location/[id]/page.js | Location details page: fetches one location, projects, developers; renders ProjectCard list. |
| src/app/land/[id]/page.js | Project detail page: fetches land, developer, images, location, area options, installment plans, prices; renders PhotoGallery and ProjectDetails. |
| src/app/admin/layout.js | Client admin shell: desktop sidebar, mobile top/bottom navigation, logout, active-route states. |
| src/app/admin/page.js | Server admin dashboard: counts, pending reservations, recent projects. |
| src/app/admin/login/page.js | Client login screen with Supabase Auth signInWithPassword. |
| src/app/admin/locations/page.js | Client CRUD for locations and location cover uploads. |
| src/app/admin/lands/page.js | Client CRUD for projects, images, thumbnails, area options, installment plans, and price grid. |
| src/app/admin/developers/page.js | Client CRUD for developers and logo uploads. |
| src/app/admin/reservations/page.js | Client reservation inbox, status controls, signed ID previews, and deletion. |
| SplashScreen.js | Timed startup overlay with logo and fade-out phases. |
| LocationSearch.js | Client search over locations and filtered card grid. |
| LocationCard.js | Clickable location card with image fallback and project count. |
| ProjectCard.js | Clickable project card with thumbnail, status, developer, and price-per-meter display. |
| PhotoGallery.js | Responsive project gallery: mobile scroll-snap carousel and desktop main image with side peeks and thumbnails. |
| ProjectDetails.js | Project summary, area/plan selection modals, map link, developer block, WhatsApp, and ReserveButton integration. |
| ReserveButton.js | Buyer reservation form, ID upload, reservation insert, and payment instruction step. |

## 10. Local Development

- Install dependencies with npm install if node_modules is missing.
- Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Run npm run dev and open http://localhost:3000.
- Use /admin/login for the admin panel after creating a Supabase Auth user.
- Run npm run build before deployment.
- Run npm run lint and fix lint errors before treating the project as clean.

## 11. Verification Snapshot

| Check | Result | Details |
| --- | --- | --- |
| Production build | Passed | npm.cmd run build completed successfully on August 6, 2026. |
| Generated routes | 10 app routes | /, /admin, /admin/developers, /admin/lands, /admin/locations, /admin/login, /admin/reservations, /land/[id], /location/[id], /_not-found |
| Lint | Failed | npm.cmd run lint reported 6 errors and 12 warnings. |
| Main lint errors | React hook/lint rules | set-state-in-effect in admin developers/lands/locations, immutability warning for fetchReservations declaration order, unescaped quotes in admin lands. |
| Main lint warnings | Image optimization | Several admin/gallery files use raw img tags instead of next/image. |

## 12. Important Implementation Notes

- Security: ReserveButton.js currently hard-codes the Supabase project URL and anon key. Move this to environment variables for consistency and reduce accidental sharing.
- Security: Admin protection depends on middleware placement and Supabase RLS. Verify middleware is actually discovered in the deployed app.
- Assets: Home and SplashScreen reference /logo.png, but that file is missing from public in this workspace.
- Storage cleanup: deleting land images/projects removes database rows but does not remove public storage objects from land-images. Reservation deletion does remove ID files.
- Data integrity: land_area_plan_prices relies on an onConflict unique key across land_area_id and installment_plan_id.
- Payment: the app records reservation details before payment verification. Admin confirmation is manual.
- Performance: next.config.mjs permits images from any HTTPS host, which is flexible but broad.
- Maintainability: inline styles dominate the codebase; extracting repeated admin styles/components would reduce future churn, but this document records the current implementation as-is.

## 13. Full Source Code Appendix

> This appendix includes the application code required to understand the current app. Long lines wrap visually in the PDF; the Markdown file preserves the source line breaks. The package-lock file is intentionally excluded because it is generated dependency metadata, not page/app code.

#### `package.json`

Lines: 24.

```
{
  "name": "land-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.12.0",
    "@supabase/supabase-js": "^2.108.2",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4"
  }
}
```

#### `next.config.mjs`

Lines: 16.

```
﻿/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.100.4"],
};

export default nextConfig;
```

#### `jsconfig.json`

Lines: 7.

```
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### `eslint.config.mjs`

Lines: 16.

```
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

#### `postcss.config.mjs`

Lines: 7.

```
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

#### `src/lib/supabase.js`

Lines: 10.

```
﻿import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### `src/lib/supabaseServer.js`

Lines: 27.

```
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — cookie setting is handled by middleware
          }
        },
      },
    }
  );
}
```

#### `src/app/layout.js`

Lines: 35.

```
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import SplashScreen from "./components/SplashScreen";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata = {
  title: "Invegate",
  description: "Browse curated land listings across Egypt.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen>
          {children}
        </SplashScreen>
      </body>
    </html>
  );
}
```

#### `src/app/globals.css`

Lines: 89.

```
@import "tailwindcss";

:root {
  --background: #2C2C2E;
  --foreground: #F0EDE6;

  --gold: #C9973A;
  --gold-soft: rgba(201, 151, 58, 0.18);

  --font-heading: "Cormorant Garamond", serif;
  --font-body: "Manrope", sans-serif;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-body);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body);
}

img {
  max-width: 100%;
  display: block;
}

/*
  IMPORTANT:
  Do NOT apply transform transitions
  to every div on the site.
  This causes animation conflicts and
  hurts splash screen performance.
*/
a,
button,
input {
  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

/* Optional utility animation */

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Luxury Scrollbar */

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #2C2C2E;
}

::-webkit-scrollbar-thumb {
  background: rgba(201, 151, 58, 0.25);
  border-radius: 20px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 151, 58, 0.45);
}
```

#### `src/app/page.js`

Lines: 186.

```
﻿import { supabase } from "@/lib/supabase";
import Image from "next/image";
import LocationSearch from "./components/LocationSearch";

export default async function Home() {
  const [{ data: locations }, { data: lands }, { data: developers }] =
    await Promise.all([
      supabase.from("locations").select("id, name, description, image_url"),
      supabase.from("lands").select("id, location_id, status"),
      supabase.from("developers").select("id"),
    ]);

  const locationList = locations ?? [];
  const landList = lands ?? [];
  const developerList = developers ?? [];
  const countByLocation = {};
  let availableCount = 0;

  landList.forEach((land) => {
    if (land.status === "available") {
      availableCount += 1;
      countByLocation[land.location_id] =
        (countByLocation[land.location_id] || 0) + 1;
    }
  });

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        background: "#2C2C2E",
        minHeight: "100vh",
        color: "#F0EDE6",
      }}
    >
      <section
        style={{
          padding: "4rem 2rem 3rem",
          textAlign: "center",
          borderBottom: "0.5px solid rgba(201,151,58,0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(201,151,58,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ marginBottom: "1.5rem", position: "relative" }}>
          <Image
            src="/logo.png"
            alt="Invegate"
            width={240}
            height={120}
            priority
            style={{
              width: "240px",
              height: "auto",
              margin: "0 auto 10px",
              display: "block",
            }}
          />

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6B6762",
            }}
          >
            Luxury Real Estate Redefined · Where Safety Meets Sophistication
          </div>
        </div>

        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(201,151,58,0.35)",
            margin: "0 auto 1.5rem",
          }}
        />

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 42,
            fontWeight: 400,
            color: "#F0EDE6",
            lineHeight: 1.15,
            marginBottom: 14,
            position: "relative",
          }}
        >
          Find your{" "}
          <em style={{ color: "#C9973A", fontStyle: "italic" }}>
            perfect project
          </em>
          <br />
          across Egypt
        </h1>

        <p
          style={{
            color: "#9A9489",
            maxWidth: 460,
            margin: "0 auto",
            lineHeight: 1.8,
            fontSize: 14,
            position: "relative",
          }}
        >
          Curated land projects across Egypt&apos;s most prestigious
          addresses — verified, trusted, and direct.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {[
          { num: locationList.length, label: "Locations" },
          { num: availableCount, label: "Projects" },
          { num: developerList.length, label: "Developers" },
        ].map(({ num, label }, i) => (
          <div
            key={label}
            style={{
              padding: "22px 8px",
              textAlign: "center",
              borderRight:
                i < 2
                  ? "0.5px solid rgba(201,151,58,0.18)"
                  : "none",
              borderBottom: "0.5px solid rgba(201,151,58,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 40,
                color: "#C9973A",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {num}
            </div>

            <div
              style={{
                fontSize: 10,
                color: "#6B6762",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <section style={{ padding: "2rem 1.5rem 4rem" }}>
        <LocationSearch
          locations={locationList}
          countByLocation={countByLocation}
        />
      </section>
    </main>
  );
}
```

#### `src/app/location/[id]/page.js`

Lines: 68.

```
﻿import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProjectCard from "@/app/components/ProjectCard";

export default async function LocationPage({ params }) {
  const { id } = await params;

  const [{ data: location }, { data: lands }, { data: developers }] = await Promise.all([
    supabase.from("locations").select("*").eq("id", id).maybeSingle(),
    supabase.from("lands").select("*").eq("location_id", id),
    supabase.from("developers").select("id, name"),
  ]);

  const locationLands = lands ?? [];

  const devMap = {};
  developers?.forEach((d) => { devMap[d.id] = d.name; });

  if (!location) {
    return (
      <main style={{ padding: 40, fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>
        <Link href="/" style={{ color: "#C9973A", textDecoration: "none", fontSize: 13 }}>← All locations</Link>
        <h2 style={{ marginTop: 20, fontFamily: "Georgia, serif", fontWeight: 400 }}>Location not found</h2>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>

      {/* BACK */}
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <Link href="/" style={{ fontSize: 13, color: "#C9973A", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← All locations
        </Link>
      </div>

      {/* HERO */}
      <div style={{ padding: "1.25rem 1.5rem", background: "#343437", margin: "1rem 1.5rem 0", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Location</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, color: "#F0EDE6", marginBottom: 6 }}>{location.name}</h1>
        <p style={{ fontSize: 13, color: "#9A9489", lineHeight: 1.6 }}>{location.description}</p>
      </div>{/* PROJECTS */}
      <div style={{ padding: "1.5rem" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6762", marginBottom: 14 }}>
          {locationLands.length} projects in this area
        </p>

        {!locationLands.length ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6B6762", background: "#343437", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)" }}>
            No projects listed here yet
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))", gap: 14 }}>
            {locationLands.map((land) => (
              <ProjectCard
                key={land.id}
                land={land}
                developerName={devMap[land.developer_id] ?? "—"}
              />
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
```

#### `src/app/land/[id]/page.js`

Lines: 94.

```
﻿import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProjectDetails from "@/app/components/ProjectDetails";
import PhotoGallery from "@/app/components/PhotoGallery";

const STATUS_STYLES = {
  available: { bg: "rgba(30,120,70,0.18)", border: "rgba(77,201,138,0.35)", text: "#4DC98A" },
  reserved:  { bg: "rgba(200,150,40,0.12)", border: "rgba(200,150,40,0.3)",  text: "#E8C97A" },
  sold:      { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.3)",   text: "#E07070" },
};

export default async function LandPage({ params }) {
  const { id } = await params;

  const { data: land } = await supabase
    .from("lands")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!land) {
    return (
      <main style={{ padding: 40, fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>
        <Link href="/" style={{ color: "#C9973A", textDecoration: "none", fontSize: 13 }}>← Back</Link>
        <h2 style={{ marginTop: 20, fontFamily: "Georgia, serif", fontWeight: 400 }}>Project not found</h2>
      </main>
    );
  }

  const [{ data: developer }, { data: images }, { data: location }, { data: landAreas }, { data: installmentPlans }] =
    await Promise.all([
      land.developer_id
        ? supabase.from("developers").select("*").eq("id", land.developer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("land_images").select("*").eq("land_id", id),
      land.location_id
        ? supabase.from("locations").select("*").eq("id", land.location_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("land_areas").select("*").eq("land_id", id).order("area_sqm"),
      supabase.from("land_installment_plans").select("*").eq("land_id", id).order("created_at"),
    ]);

  const areaList = landAreas ?? [];
  const planList = installmentPlans ?? [];
  const areaIds = areaList.map((a) => a.id);

  const { data: priceRows } =
    areaIds.length > 0
      ? await supabase.from("land_area_plan_prices").select("*").in("land_area_id", areaIds)
      : { data: [] };

  const imageList = images ?? [];
  const status = land.status ?? "available";
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.available;

  const whatsappNumber = land.contact_whatsapp ?? "201000000000";
  const whatsappMessage = encodeURIComponent(
    `I am interested in ${land.title} in ${location?.name ?? "your area"}, price EGP ${Number(land.price).toLocaleString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const mapsUrl = land.location_url || null;

  return (
    <main style={{ fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6", paddingBottom: "4rem" }}>

      {/* BACK */}
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <Link
          href={location ? `/location/${land.location_id}` : "/"}
          style={{ fontSize: 13, color: "#C9973A", textDecoration: "none" }}
        >
          ← {location ? location.name : "All locations"}
        </Link>
      </div>

      {/* PHOTO GALLERY — mobile: scroll carousel · desktop: main + grayscale peeks + thumbnail rail */}
      <PhotoGallery images={imageList} alt={land.title} status={status} statusStyle={s} />

      {/* KEY INFO, AREA/PLAN PICKERS, LOCATION, DEVELOPER, CONTACT */}
      <ProjectDetails
        land={land}
        developer={developer}
        location={location}
        mapsUrl={mapsUrl}
        whatsappUrl={whatsappUrl}
        landAreas={areaList}
        installmentPlans={planList}
        priceRows={priceRows ?? []}
      />

    </main>
  );
}
```

#### `src/app/admin/layout.js`

Lines: 271.

```
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const navItems = [
  { label: "Dashboard",    href: "/admin",              icon: "⊞" },
  { label: "Locations",    href: "/admin/locations",    icon: "📍" },
  { label: "Projects",     href: "/admin/lands",        icon: "🏗" },
  { label: "Developers",   href: "/admin/developers",   icon: "🏢" },
  { label: "Reservations", href: "/admin/reservations", icon: "📋" },
];

export default function AdminLayout({ children }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [loggingOut, setLoggingOut]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [hovered,   setHovered]       = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const expanded  = !collapsed || hovered;
  const sidebarW  = expanded ? 220 : 60;

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP LAYOUT  (hidden on mobile)
      ───────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        background: "#2C2C2E",
        display: "flex",
        fontFamily: "Inter, Arial, sans-serif",
      }}
        className="admin-desktop-layout"
      >
        {/* Sidebar */}
        <aside
          onMouseEnter={() => collapsed && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: sidebarW,
            minWidth: sidebarW,
            minHeight: "100vh",
            background: "#222224",
            borderRight: "0.5px solid rgba(201,151,58,0.15)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            transition: "width 0.25s ease, min-width 0.25s ease",
            zIndex: 50,
          }}
        >
          {/* Brand + toggle */}
          <div style={{
            padding: expanded ? "28px 20px 20px" : "20px 0 20px",
            borderBottom: "0.5px solid rgba(201,151,58,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "space-between" : "center",
            flexShrink: 0,
          }}>
            {expanded && (
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#C9973A", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  Invegate
                </div>
                <div style={{ fontSize: "10px", color: "#6B6762", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap" }}>
                  Admin Panel
                </div>
              </div>
            )}
            <button
              onClick={() => { setCollapsed(c => !c); setHovered(false); }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                background: "none",
                border: "0.5px solid rgba(201,151,58,0.22)",
                borderRadius: "7px",
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#6B6762", flexShrink: 0,
                transition: "all 0.2s ease", padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,151,58,0.55)"; e.currentTarget.style.color = "#C9973A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,151,58,0.22)"; e.currentTarget.style.color = "#6B6762"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s ease" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav style={{ padding: expanded ? "16px 12px" : "16px 8px", flex: 1 }}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }} title={!expanded ? item.label : undefined}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: expanded ? "flex-start" : "center",
                    gap: expanded ? "10px" : "0",
                    padding: expanded ? "10px 12px" : "10px 0",
                    borderRadius: "8px", marginBottom: "2px",
                    background: active ? "rgba(201,151,58,0.12)" : "transparent",
                    border: active ? "0.5px solid rgba(201,151,58,0.3)" : "0.5px solid transparent",
                    color: active ? "#E8C97A" : "#9A9489",
                    fontSize: "13px", fontWeight: active ? "500" : "400",
                    transition: "all 0.2s ease", cursor: "pointer",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    <span style={{ fontSize: "15px", flexShrink: 0 }}>{item.icon}</span>
                    {expanded && item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: expanded ? "16px 12px" : "16px 8px", borderTop: "0.5px solid rgba(201,151,58,0.12)", flexShrink: 0 }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title={!expanded ? "Sign out" : undefined}
              style={{
                width: "100%", background: "transparent",
                border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "8px",
                padding: expanded ? "10px 12px" : "10px 0",
                color: "#9A9489", fontSize: "13px", cursor: "pointer",
                textAlign: expanded ? "left" : "center",
                display: "flex", alignItems: "center",
                justifyContent: expanded ? "flex-start" : "center",
                gap: expanded ? "10px" : "0",
                transition: "all 0.2s ease", whiteSpace: "nowrap", overflow: "hidden",
              }}
            >
              <span style={{ flexShrink: 0 }}>⎋</span>
              {expanded && (loggingOut ? "Signing out..." : "Sign out")}
            </button>
          </div>
        </aside>

        {/* Main content — desktop */}
        <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto", minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────
          MOBILE LAYOUT  (hidden on desktop)
      ───────────────────────────────────────── */}
      <div className="admin-mobile-layout" style={{ display: "none", flexDirection: "column", minHeight: "100vh", background: "#2C2C2E", fontFamily: "Inter, Arial, sans-serif" }}>

        {/* Mobile top bar */}
        <div style={{
          background: "#222224",
          borderBottom: "0.5px solid rgba(201,151,58,0.15)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#C9973A", letterSpacing: "0.04em" }}>
            Invegate
          </div>
          <div style={{ fontSize: "10px", color: "#6B6762", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Admin Panel
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: "none", border: "0.5px solid rgba(201,151,58,0.2)",
              borderRadius: "7px", padding: "6px 10px",
              color: "#9A9489", fontSize: "11px", cursor: "pointer",
            }}
          >
            {loggingOut ? "..." : "⎋"}
          </button>
        </div>

        {/* Mobile main content */}
        <main style={{ flex: 1, padding: "20px 16px", overflowY: "auto", paddingBottom: "90px" }}>
          {children}
        </main>

        {/* Mobile bottom navigation bar */}
        <nav style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#222224",
          borderTop: "0.5px solid rgba(201,151,58,0.18)",
          display: "flex",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom)", /* handles iPhone notch */
        }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 4px",
                  textDecoration: "none",
                  color: active ? "#C9973A" : "#6B6762",
                  borderTop: active ? "2px solid #C9973A" : "2px solid transparent",
                  background: active ? "rgba(201,151,58,0.06)" : "transparent",
                  transition: "all 0.2s ease",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ─────────────────────────────────────────
          RESPONSIVE SWITCH  (pure CSS, no JS)
      ───────────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-desktop-layout { display: none !important; }
          .admin-mobile-layout  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-desktop-layout { display: flex !important; }
          .admin-mobile-layout  { display: none !important; }
        }
      `}</style>
    </>
  );
}
```

#### `src/app/admin/middleware.js`

Lines: 49.

```
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

#### `src/app/admin/page.js`

Lines: 217.

```
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: locationsCount },
    { count: landsCount },
    { count: developersCount },
    { count: reservationsCount },
    { data: pendingReservations },
    { data: recentLands },
  ] = await Promise.all([
    supabase.from("locations").select("*", { count: "exact", head: true }),
    supabase.from("lands").select("*", { count: "exact", head: true }),
    supabase.from("developers").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*").eq("status", "pending").limit(5).order("created_at", { ascending: false }),
    supabase.from("lands").select("id, title, status, created_at").limit(5).order("created_at", { ascending: false }),
  ]);

  const stats = [
    { label: "Locations", value: locationsCount ?? 0, href: "/admin/locations", color: "#C9973A" },
    { label: "Projects", value: landsCount ?? 0, href: "/admin/lands", color: "#C9973A" },
    { label: "Developers", value: developersCount ?? 0, href: "/admin/developers", color: "#C9973A" },
    { label: "Reservations", value: reservationsCount ?? 0, href: "/admin/reservations", color: "#C9973A" },
  ];

  const statusColor = {
    available: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)" },
    reserved: { color: "#E8C97A", bg: "rgba(200,150,40,0.12)" },
    sold: { color: "#E07070", bg: "rgba(200,60,60,0.12)" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "28px",
          color: "#F0EDE6",
          margin: 0,
          marginBottom: "6px",
        }}>
          Dashboard
        </h1>
        <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>
          Overview of your Invegate platform
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "36px",
      }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#343437",
              border: "0.5px solid rgba(201,151,58,0.18)",
              borderRadius: "12px",
              padding: "22px 20px",
              transition: "all 0.25s ease",
            }}>
              <div style={{
                fontSize: "32px",
                fontFamily: "Georgia, serif",
                color: "#E8C97A",
                marginBottom: "4px",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: "11px",
                color: "#9A9489",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Pending reservations */}
        <div style={{
          background: "#343437",
          border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}>
            <h2 style={{
              fontSize: "14px",
              color: "#F0EDE6",
              margin: 0,
              fontWeight: "500",
            }}>
              Pending Reservations
            </h2>
            <Link href="/admin/reservations" style={{
              fontSize: "12px",
              color: "#C9973A",
              textDecoration: "none",
            }}>
              View all →
            </Link>
          </div>
          {!pendingReservations?.length ? (
            <p style={{ color: "#6B6762", fontSize: "13px", margin: 0 }}>No pending reservations</p>
          ) : (
            pendingReservations.map(r => (
              <div key={r.id} style={{
                padding: "10px 0",
                borderBottom: "0.5px solid rgba(201,151,58,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#F0EDE6" }}>{r.full_name}</div>
                  <div style={{ fontSize: "11px", color: "#6B6762", marginTop: "2px" }}>{r.phone}</div>
                </div>
                <span style={{
                  fontSize: "10px",
                  background: "rgba(200,150,40,0.12)",
                  color: "#E8C97A",
                  border: "0.5px solid rgba(200,150,40,0.3)",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  letterSpacing: "0.08em",
                }}>
                  PENDING
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent projects */}
        <div style={{
          background: "#343437",
          border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}>
            <h2 style={{
              fontSize: "14px",
              color: "#F0EDE6",
              margin: 0,
              fontWeight: "500",
            }}>
              Recent Projects
            </h2>
            <Link href="/admin/lands" style={{
              fontSize: "12px",
              color: "#C9973A",
              textDecoration: "none",
            }}>
              View all →
            </Link>
          </div>
          {!recentLands?.length ? (
            <p style={{ color: "#6B6762", fontSize: "13px", margin: 0 }}>No projects yet</p>
          ) : (
            recentLands.map(land => {
              const s = statusColor[land.status] || statusColor.available;
              return (
                <div key={land.id} style={{
                  padding: "10px 0",
                  borderBottom: "0.5px solid rgba(201,151,58,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: "13px", color: "#F0EDE6" }}>{land.title}</div>
                  <span style={{
                    fontSize: "10px",
                    background: s.bg,
                    color: s.color,
                    border: `0.5px solid ${s.color}55`,
                    borderRadius: "999px",
                    padding: "3px 10px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    {land.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

#### `src/app/admin/login/page.js`

Lines: 173.

```
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#2C2C2E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, Arial, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#343437",
        border: "0.5px solid rgba(201,151,58,0.25)",
        borderRadius: "16px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "400px",
      }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            color: "#C9973A",
            letterSpacing: "0.04em",
            marginBottom: "6px",
          }}>
            Invegate
          </div>
          <div style={{
            fontSize: "11px",
            color: "#6B6762",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Admin Panel
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            display: "block",
            fontSize: "11px",
            color: "#9A9489",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="admin@invegate.com"
            style={{
              width: "100%",
              background: "#3A3A3D",
              border: "0.5px solid rgba(201,151,58,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#F0EDE6",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "11px",
            color: "#9A9489",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{
              width: "100%",
              background: "#3A3A3D",
              border: "0.5px solid rgba(201,151,58,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#F0EDE6",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(200,60,60,0.12)",
            border: "0.5px solid rgba(200,60,60,0.4)",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#E07070",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            background: loading || !email || !password ? "rgba(201,151,58,0.3)" : "#C9973A",
            color: loading || !email || !password ? "rgba(240,237,230,0.4)" : "#2C2C2E",
            border: "none",
            borderRadius: "10px",
            padding: "13px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            transition: "all 0.25s ease",
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
```

#### `src/app/admin/locations/page.js`

Lines: 292.

```
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = { name: "", description: "", image_url: "" };

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function fetchLocations() {
    const { data } = await supabase.from("locations").select("*").order("created_at", { ascending: false });
    setLocations(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchLocations(); }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setImageFile(null);
    setShowForm(true);
  }

  function openEdit(loc) {
    setForm({ name: loc.name || "", description: loc.description || "", image_url: loc.image_url || "" });
    setEditId(loc.id);
    setError("");
    setImageFile(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setImageFile(null);
  }

  async function uploadImage(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("location-images").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("location-images").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");

    let finalImageUrl = form.image_url.trim() || null;

    if (imageFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadImage(imageFile);
      } catch (err) {
        setError("Image upload failed: " + err.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editId) {
      const { error } = await supabase.from("locations").update({
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: finalImageUrl,
      }).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("locations").insert({
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: finalImageUrl,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    cancelForm();
    fetchLocations();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this location? This cannot be undone.")) return;
    setDeletingId(id);
    await supabase.from("locations").delete().eq("id", id);
    setDeletingId(null);
    fetchLocations();
  }

  const inputStyle = {
    width: "100%",
    background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "#F0EDE6",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, sans-serif",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#9A9489",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "7px",
  };

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : form.image_url;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>
            Locations
          </h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add location
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)",
          borderRadius: "14px", padding: "28px", marginBottom: "28px",
        }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 22px", fontWeight: "500" }}>
            {editId ? "Edit location" : "New location"}
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. El Tagamoa" />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description shown on the location card..." />
          </div>

          {/* Cover image upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Cover Image</label>

            {previewUrl && (
              <div style={{ marginBottom: "12px" }}>
                <img src={previewUrl} alt="" style={{
                  width: "160px", height: "100px", objectFit: "cover",
                  borderRadius: "8px", border: "0.5px solid rgba(201,151,58,0.2)",
                }} />
              </div>
            )}

            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${imageFile ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer", background: imageFile ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={e => setImageFile(e.target.files[0] || null)} />
              <span style={{ fontSize: "22px" }}>📸</span>
              <span style={{ fontSize: "13px", color: imageFile ? "#4DC98A" : "#9A9489" }}>
                {imageFile ? imageFile.name : "Click to upload cover image"}
              </span>
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(200,60,60,0.12)", border: "0.5px solid rgba(200,60,60,0.4)", borderRadius: "8px", padding: "10px 14px", color: "#E07070", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? "rgba(201,151,58,0.4)" : "#C9973A", color: "#2C2C2E",
              border: "none", borderRadius: "10px", padding: "11px 24px",
              fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer",
            }}>
              {uploading ? "Uploading..." : saving ? "Saving..." : editId ? "Save changes" : "Add location"}
            </button>
            <button onClick={cancelForm} style={{
              background: "transparent", color: "#9A9489",
              border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "10px",
              padding: "11px 20px", fontSize: "13px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : locations.length === 0 ? (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No locations yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", overflow: "hidden" }}>
          {locations.map((loc, i) => (
            <div key={loc.id} style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "16px 20px",
              borderBottom: i < locations.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
            }}>
              {/* Thumb */}
              <div style={{
                width: "48px", height: "48px", borderRadius: "8px", flexShrink: 0,
                background: "#3A3A3D", overflow: "hidden",
                border: "0.5px solid rgba(201,151,58,0.15)",
              }}>
                {loc.image_url ? (
                  <img src={loc.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6762", fontSize: "18px" }}>📍</div>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>{loc.name}</div>
                {loc.description && (
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {loc.description}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEdit(loc)} style={{
                  background: "transparent", border: "0.5px solid rgba(201,151,58,0.25)",
                  borderRadius: "8px", padding: "7px 14px", color: "#C9973A",
                  fontSize: "12px", cursor: "pointer",
                }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(loc.id)} disabled={deletingId === loc.id} style={{
                  background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                  borderRadius: "8px", padding: "7px 14px", color: "#E07070",
                  fontSize: "12px", cursor: "pointer",
                }}>
                  {deletingId === loc.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### `src/app/admin/lands/page.js`

Lines: 879.

```
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = {
  title: "", location_id: "", developer_id: "", price: "",
  area_sqm: "", price_per_meter: "", status: "available", description: "",
  location_url: "", contact_whatsapp: "", contact_phone: "",
};

const emptyNewArea = { area_sqm: "", status: "available" };
const emptyNewPlan = { label: "", down_payment_percent: "", years: "" };

const statusColors = {
  available: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)" },
  reserved: { color: "#E8C97A", bg: "rgba(200,150,40,0.12)" },
  sold: { color: "#E07070", bg: "rgba(200,60,60,0.12)" },
};

function priceKey(areaId, planId) {
  return `${areaId}_${planId}`;
}

export default function AdminLands() {
  const [lands, setLands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [settingThumbId, setSettingThumbId] = useState(null);

  // Area options / installment plans / price grid
  const [areaOptions, setAreaOptions] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [priceGrid, setPriceGrid] = useState({});
  const [newArea, setNewArea] = useState(emptyNewArea);
  const [newPlan, setNewPlan] = useState(emptyNewPlan);

  async function fetchAll() {
    const [{ data: landsData }, { data: locsData }, { data: devsData }] = await Promise.all([
      supabase.from("lands").select("*, locations(name), developers(name)").order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name").order("name"),
      supabase.from("developers").select("id, name").order("name"),
    ]);
    setLands(landsData || []);
    setLocations(locsData || []);
    setDevelopers(devsData || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAreasPlansPrices(landId) {
    const [{ data: areas }, { data: plans }] = await Promise.all([
      supabase.from("land_areas").select("*").eq("land_id", landId).order("created_at"),
      supabase.from("land_installment_plans").select("*").eq("land_id", landId).order("created_at"),
    ]);
    const areaList = areas || [];
    const planList = plans || [];

    setAreaOptions(areaList.map(a => ({ id: a.id, area_sqm: a.area_sqm, status: a.status, _new: false })));
    setInstallmentPlans(planList.map(p => ({
      id: p.id, label: p.label, down_payment_percent: p.down_payment_percent, years: p.years, _new: false,
    })));

    const areaIds = areaList.map(a => a.id);
    if (areaIds.length > 0) {
      const { data: prices } = await supabase
        .from("land_area_plan_prices")
        .select("*")
        .in("land_area_id", areaIds);
      const grid = {};
      (prices || []).forEach(p => {
        grid[priceKey(p.land_area_id, p.installment_plan_id)] = String(p.total_price);
      });
      setPriceGrid(grid);
    } else {
      setPriceGrid({});
    }
  }

  function openAdd() {
    setForm(emptyForm); setEditId(null); setError("");
    setImageFiles([]); setExistingImages([]); setThumbnailUrl(null);
    setAreaOptions([]); setInstallmentPlans([]); setPriceGrid({});
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
    setShowForm(true);
    setTimeout(() => document.getElementById("land-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function openEdit(land) {
    setForm({
      title: land.title || "", location_id: land.location_id || "",
      developer_id: land.developer_id || "", price: land.price || "",
      area_sqm: land.area_sqm || "", price_per_meter: land.price_per_meter || "",
      status: land.status || "available",
      description: land.description || "", location_url: land.location_url || "",
      contact_whatsapp: land.contact_whatsapp || "",
      contact_phone: land.contact_phone || "",
    });
    setEditId(land.id); setError(""); setImageFiles([]);
    setThumbnailUrl(land.image_url || null);
    const { data: imgs } = await supabase.from("land_images").select("*").eq("land_id", land.id);
    setExistingImages(imgs || []);
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
    await fetchAreasPlansPrices(land.id);
    setShowForm(true);
    setTimeout(() => document.getElementById("land-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() {
    setShowForm(false); setForm(emptyForm); setEditId(null);
    setError(""); setImageFiles([]); setExistingImages([]); setThumbnailUrl(null);
    setAreaOptions([]); setInstallmentPlans([]); setPriceGrid({});
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
  }

  async function uploadImages(landId, files) {
    const urls = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `lands/${landId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("land-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  }

  // ---- Area options ----
  async function addAreaOption() {
    if (!newArea.area_sqm) return;
    const areaPayload = { area_sqm: parseFloat(newArea.area_sqm), status: newArea.status };
    if (editId) {
      const { data, error } = await supabase
        .from("land_areas")
        .insert({ land_id: editId, ...areaPayload })
        .select()
        .single();
      if (error) { setError(error.message); return; }
      setAreaOptions(prev => [...prev, { id: data.id, area_sqm: data.area_sqm, status: data.status, _new: false }]);
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setAreaOptions(prev => [...prev, { id: tempId, ...areaPayload, _new: true }]);
    }
    setNewArea(emptyNewArea);
  }

  async function removeAreaOption(area) {
    if (!area._new && editId) {
      await supabase.from("land_areas").delete().eq("id", area.id);
    }
    setAreaOptions(prev => prev.filter(a => a.id !== area.id));
    setPriceGrid(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.startsWith(`${area.id}_`)) delete next[key]; });
      return next;
    });
  }

  async function updateAreaStatus(area, status) {
    if (!area._new && editId) {
      await supabase.from("land_areas").update({ status }).eq("id", area.id);
    }
    setAreaOptions(prev => prev.map(a => (a.id === area.id ? { ...a, status } : a)));
  }

  // ---- Installment plans ----
  async function addInstallmentPlan() {
    if (!newPlan.label.trim() || newPlan.down_payment_percent === "" || newPlan.years === "") return;
    const planPayload = {
      label: newPlan.label.trim(),
      down_payment_percent: parseFloat(newPlan.down_payment_percent),
      years: parseFloat(newPlan.years),
    };
    if (editId) {
      const { data, error } = await supabase
        .from("land_installment_plans")
        .insert({ land_id: editId, ...planPayload })
        .select()
        .single();
      if (error) { setError(error.message); return; }
      setInstallmentPlans(prev => [...prev, { id: data.id, ...planPayload, _new: false }]);
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setInstallmentPlans(prev => [...prev, { id: tempId, ...planPayload, _new: true }]);
    }
    setNewPlan(emptyNewPlan);
  }

  async function removeInstallmentPlan(plan) {
    if (!plan._new && editId) {
      await supabase.from("land_installment_plans").delete().eq("id", plan.id);
    }
    setInstallmentPlans(prev => prev.filter(p => p.id !== plan.id));
    setPriceGrid(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.endsWith(`_${plan.id}`)) delete next[key]; });
      return next;
    });
  }

  // ---- Price grid ----
  function handlePriceChange(areaId, planId, value) {
    setPriceGrid(prev => ({ ...prev, [priceKey(areaId, planId)]: value }));
  }

  async function handlePriceBlur(areaId, planId) {
    if (!editId) return; // brand-new project: committed later, inside handleSave
    const value = priceGrid[priceKey(areaId, planId)];
    if (value === undefined || value === "") return;
    const totalPrice = parseFloat(value);
    if (Number.isNaN(totalPrice)) return;
    await supabase.from("land_area_plan_prices").upsert(
      { land_area_id: areaId, installment_plan_id: planId, total_price: totalPrice },
      { onConflict: "land_area_id,installment_plan_id" }
    );
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.location_id) { setError("Location is required."); return; }
    if (!form.developer_id) { setError("Developer is required."); return; }
    setSaving(true); setError("");

    const payload = {
      title: form.title.trim(),
      location_id: form.location_id,
      developer_id: form.developer_id,
      price: form.price ? parseFloat(form.price) : null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      price_per_meter: form.price_per_meter ? parseFloat(form.price_per_meter) : null,
      status: form.status,
      description: form.description.trim() || null,
      location_url: form.location_url.trim() || null,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
    };

    let landId = editId;
    let finalThumbnail = thumbnailUrl; // preserve existing thumbnail

    if (editId) {
      const { error } = await supabase.from("lands").update(payload).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("lands").insert(payload).select().single();
      if (error) { setError(error.message); setSaving(false); return; }
      landId = data.id;
    }

    // Brand-new project: areas/plans/price-grid were staged locally — commit now that landId is known
    if (!editId) {
      const areaIdMap = {};
      const planIdMap = {};

      if (areaOptions.length > 0) {
        const { data: insertedAreas, error: areaErr } = await supabase
          .from("land_areas")
          .insert(areaOptions.map(a => ({ land_id: landId, area_sqm: a.area_sqm, status: a.status })))
          .select();
        if (areaErr) { setError("Project saved but area options failed: " + areaErr.message); setSaving(false); return; }
        insertedAreas.forEach((row, idx) => { areaIdMap[areaOptions[idx].id] = row.id; });
      }

      if (installmentPlans.length > 0) {
        const { data: insertedPlans, error: planErr } = await supabase
          .from("land_installment_plans")
          .insert(installmentPlans.map(p => ({
            land_id: landId, label: p.label, down_payment_percent: p.down_payment_percent, years: p.years,
          })))
          .select();
        if (planErr) { setError("Project saved but installment plans failed: " + planErr.message); setSaving(false); return; }
        insertedPlans.forEach((row, idx) => { planIdMap[installmentPlans[idx].id] = row.id; });
      }

      const priceRows = [];
      Object.entries(priceGrid).forEach(([key, value]) => {
        if (value === "" || value === undefined) return;
        const [tempAreaId, tempPlanId] = key.split("_");
        const realAreaId = areaIdMap[tempAreaId];
        const realPlanId = planIdMap[tempPlanId];
        if (realAreaId && realPlanId) {
          priceRows.push({ land_area_id: realAreaId, installment_plan_id: realPlanId, total_price: parseFloat(value) });
        }
      });
      if (priceRows.length > 0) {
        const { error: priceErr } = await supabase.from("land_area_plan_prices").insert(priceRows);
        if (priceErr) { setError("Project saved but price grid failed: " + priceErr.message); setSaving(false); return; }
      }
    }

    // Upload new images if selected
    if (imageFiles.length > 0) {
      setUploadingImages(true);
      const urls = await uploadImages(landId, imageFiles);

      if (urls.length > 0) {
        const imageRows = urls.map(url => ({ land_id: landId, image_url: url }));
        const { error: insertErr } = await supabase.from("land_images").insert(imageRows);
        if (insertErr) {
          setError("Images uploaded but failed to save: " + insertErr.message);
          setSaving(false); setUploadingImages(false); return;
        }
        // Only set thumbnail from new upload if no thumbnail exists yet
        if (!finalThumbnail) {
          finalThumbnail = urls[0];
        }
      }
      setUploadingImages(false);
    }

    // Always sync image_url on the lands row — unconditional
    const { error: thumbErr } = await supabase
      .from("lands")
      .update({ image_url: finalThumbnail })
      .eq("id", landId);

    if (thumbErr) {
      setError("Project saved but thumbnail failed to update: " + thumbErr.message);
      setSaving(false); return;
    }

    setSaving(false); cancelForm(); fetchAll();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    await supabase.from("land_images").delete().eq("land_id", id);
    await supabase.from("lands").delete().eq("id", id);
    setDeletingId(null); fetchAll();
  }

  async function handleDeleteImage(img) {
    setDeletingImageId(img.id);
    await supabase.from("land_images").delete().eq("id", img.id);
    setExistingImages(prev => prev.filter(i => i.id !== img.id));
    if (thumbnailUrl === img.image_url) setThumbnailUrl(null);
    setDeletingImageId(null);
  }

  async function handleSetThumbnail(url, key) {
    setSettingThumbId(key);
    setThumbnailUrl(url);
    if (editId) {
      await supabase.from("lands").update({ image_url: url }).eq("id", editId);
    }
    setSettingThumbId(null);
  }

  const inputStyle = {
    width: "100%", background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)", borderRadius: "10px",
    padding: "11px 14px", color: "#F0EDE6", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "Inter, Arial, sans-serif",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = {
    display: "block", fontSize: "11px", color: "#9A9489",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px",
  };
  const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>Projects</h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{lands.length} project{lands.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add project
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div id="land-form" style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)",
          borderRadius: "14px", padding: "28px", marginBottom: "28px",
        }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 24px", fontWeight: "500" }}>
            {editId ? "Edit project" : "New project"}
          </h2>

          {/* Title */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Project Title *</label>
            <input style={inputStyle} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Project name" />
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Location *</label>
              <select style={selectStyle} value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Developer *</label>
              <select style={selectStyle} value={form.developer_id}
                onChange={e => setForm(f => ({ ...f, developer_id: e.target.value }))}>
                <option value="">Select developer...</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Price (EGP)</label>
              <input style={inputStyle} type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 2500000" />
            </div>
            <div>
              <label style={labelStyle}>Area (m²)</label>
              <input style={inputStyle} type="number" value={form.area_sqm}
                onChange={e => setForm(f => ({ ...f, area_sqm: e.target.value }))}
                placeholder="e.g. 500" />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Price per m² (EGP)</label>
            <input style={inputStyle} type="number" value={form.price_per_meter}
              onChange={e => setForm(f => ({ ...f, price_per_meter: e.target.value }))}
              placeholder="e.g. 12000" />
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
              Constant for the whole project — shown on the project details page regardless of which
              size/plan the buyer picks.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional project description..." />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Location URL</label>
            <input style={inputStyle} type="url" value={form.location_url}
              onChange={e => setForm(f => ({ ...f, location_url: e.target.value }))}
              placeholder="e.g. https://maps.app.goo.gl/xxxxx or https://www.google.com/maps?q=30.0444,31.2357" />
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
              Paste a Google Maps link (share → copy link). Buyers tap "View on Google Maps" and are
              taken straight to this URL.
            </p>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input style={inputStyle} value={form.contact_whatsapp}
                onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))}
                placeholder="e.g. 201XXXXXXXXX" />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                placeholder="e.g. 01XXXXXXXXX" />
            </div>
          </div>

          {/* Image upload section */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Project Images</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              {thumbnailUrl
                ? "Current thumbnail is marked with a gold border. Click any image below to set it as thumbnail."
                : "No thumbnail set yet — the first uploaded image becomes the thumbnail automatically."}
            </p>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                {existingImages.map(img => {
                  const isThumb = thumbnailUrl === img.image_url;
                  return (
                    <div key={img.id} style={{ position: "relative", width: "100px" }}>
                      <img src={img.image_url} alt="" style={{
                        width: "100px", height: "70px", objectFit: "cover",
                        borderRadius: "8px",
                        border: isThumb ? "2px solid #C9973A" : "0.5px solid rgba(201,151,58,0.2)",
                      }} />
                      <button
                        onClick={() => handleDeleteImage(img)}
                        disabled={deletingImageId === img.id}
                        style={{
                          position: "absolute", top: "-6px", right: "-6px",
                          background: "#E07070", border: "none", borderRadius: "999px",
                          width: "18px", height: "18px", cursor: "pointer",
                          color: "#fff", fontSize: "11px", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        ×
                      </button>
                      <button
                        onClick={() => handleSetThumbnail(img.image_url, img.id)}
                        disabled={isThumb || settingThumbId === img.id}
                        style={{
                          width: "100%", marginTop: "5px",
                          background: isThumb ? "rgba(201,151,58,0.15)" : "transparent",
                          border: `0.5px solid ${isThumb ? "rgba(201,151,58,0.4)" : "rgba(201,151,58,0.2)"}`,
                          borderRadius: "6px", padding: "4px 2px",
                          color: isThumb ? "#E8C97A" : "#9A9489",
                          fontSize: "10px", cursor: isThumb ? "default" : "pointer",
                        }}>
                        {isThumb ? "★ Thumbnail" : settingThumbId === img.id ? "..." : "Set as thumbnail"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New upload */}
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${imageFiles.length > 0 ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer",
              background: imageFiles.length > 0 ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" multiple accept="image/*"
                style={{ display: "none" }}
                onChange={e => setImageFiles(Array.from(e.target.files))} />
              <span style={{ fontSize: "22px" }}>📸</span>
              <span style={{ fontSize: "13px", color: imageFiles.length > 0 ? "#4DC98A" : "#9A9489" }}>
                {imageFiles.length > 0
                  ? `${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} selected`
                  : "Click to upload images"}
              </span>
              <span style={{ fontSize: "11px", color: "#6B6762" }}>
                {existingImages.length === 0 && !thumbnailUrl
                  ? "First image becomes the thumbnail automatically"
                  : "New images are added to the gallery"}
              </span>
            </label>
          </div>

          {/* Area options manager */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Available Area Options</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Plot sizes buyers can choose from for this project. Price/m² above stays constant — only
              status varies per size.
            </p>

            {areaOptions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {areaOptions.map(area => {
                  const s = statusColors[area.status] || statusColors.available;
                  return (
                    <div key={area.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        flex: 1, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)",
                        borderRadius: "8px", padding: "9px 14px", fontSize: "13px", color: "#F0EDE6",
                      }}>
                        {Number(area.area_sqm).toLocaleString()} m²
                      </div>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <select style={{ ...selectStyle, width: "140px" }} value={area.status}
                        onChange={e => updateAreaStatus(area, e.target.value)}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                      </select>
                      <button onClick={() => removeAreaOption(area)} style={{
                        background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                        borderRadius: "8px", padding: "7px 12px", color: "#E07070", fontSize: "12px",
                        cursor: "pointer", flexShrink: 0,
                      }}>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <input style={{ ...inputStyle, flex: 1 }} type="number" value={newArea.area_sqm}
                onChange={e => setNewArea(a => ({ ...a, area_sqm: e.target.value }))}
                placeholder="e.g. 400 (m²)" />
              <select style={{ ...selectStyle, width: "140px" }} value={newArea.status}
                onChange={e => setNewArea(a => ({ ...a, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
              <button onClick={addAreaOption} style={{
                background: "rgba(201,151,58,0.12)", border: "0.5px solid rgba(201,151,58,0.4)",
                borderRadius: "8px", padding: "9px 16px", color: "#E8C97A", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>
                + Add size
              </button>
            </div>
          </div>

          {/* Installment plans manager */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Installment Plans</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Payment plans buyers can choose from for this project.
            </p>

            {installmentPlans.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {installmentPlans.map(plan => (
                  <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      flex: 1, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)",
                      borderRadius: "8px", padding: "9px 14px", fontSize: "13px", color: "#F0EDE6",
                    }}>
                      {plan.label} · {plan.down_payment_percent}% down · {plan.years} yrs
                    </div>
                    <button onClick={() => removeInstallmentPlan(plan)} style={{
                      background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                      borderRadius: "8px", padding: "7px 12px", color: "#E07070", fontSize: "12px",
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: "2 1 160px" }} value={newPlan.label}
                onChange={e => setNewPlan(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. 10% Down — 5 Years" />
              <input style={{ ...inputStyle, flex: "1 1 100px" }} type="number" value={newPlan.down_payment_percent}
                onChange={e => setNewPlan(p => ({ ...p, down_payment_percent: e.target.value }))}
                placeholder="Down %" />
              <input style={{ ...inputStyle, flex: "1 1 80px" }} type="number" value={newPlan.years}
                onChange={e => setNewPlan(p => ({ ...p, years: e.target.value }))}
                placeholder="Years" />
              <button onClick={addInstallmentPlan} style={{
                background: "rgba(201,151,58,0.12)", border: "0.5px solid rgba(201,151,58,0.4)",
                borderRadius: "8px", padding: "9px 16px", color: "#E8C97A", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>
                + Add plan
              </button>
            </div>
          </div>

          {/* Price grid */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Price Grid</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Exact reservation price for every size × plan combination. This is the price shown to the
              buyer — it is typed in directly, not calculated.
            </p>

            {areaOptions.length === 0 || installmentPlans.length === 0 ? (
              <div style={{
                background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.15)",
                borderRadius: "8px", padding: "16px", textAlign: "center",
                color: "#6B6762", fontSize: "12px",
              }}>
                Add at least one area and one plan to set prices.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: `${140 + installmentPlans.length * 120}px` }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#6B6762",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        borderBottom: "0.5px solid rgba(201,151,58,0.2)",
                      }}>
                        Size
                      </th>
                      {installmentPlans.map(plan => (
                        <th key={plan.id} style={{
                          textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#6B6762",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          borderBottom: "0.5px solid rgba(201,151,58,0.2)",
                        }}>
                          {plan.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {areaOptions.map(area => (
                      <tr key={area.id}>
                        <td style={{
                          padding: "8px 10px", fontSize: "13px", color: "#F0EDE6",
                          borderBottom: "0.5px solid rgba(201,151,58,0.08)",
                        }}>
                          {Number(area.area_sqm).toLocaleString()} m²
                        </td>
                        {installmentPlans.map(plan => (
                          <td key={plan.id} style={{ padding: "6px 8px", borderBottom: "0.5px solid rgba(201,151,58,0.08)" }}>
                            <input
                              type="number"
                              style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }}
                              value={priceGrid[priceKey(area.id, plan.id)] ?? ""}
                              onChange={e => handlePriceChange(area.id, plan.id, e.target.value)}
                              onBlur={() => handlePriceBlur(area.id, plan.id)}
                              placeholder="EGP"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: "rgba(200,60,60,0.12)", border: "0.5px solid rgba(200,60,60,0.4)",
              borderRadius: "8px", padding: "10px 14px", color: "#E07070",
              fontSize: "13px", marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} disabled={saving || uploadingImages} style={{
              background: saving || uploadingImages ? "rgba(201,151,58,0.4)" : "#C9973A",
              color: "#2C2C2E", border: "none", borderRadius: "10px", padding: "11px 24px",
              fontSize: "13px", fontWeight: "600",
              cursor: saving || uploadingImages ? "not-allowed" : "pointer",
            }}>
              {uploadingImages ? "Uploading images..." : saving ? "Saving..." : editId ? "Save changes" : "Add project"}
            </button>
            <button onClick={cancelForm} style={{
              background: "transparent", color: "#9A9489",
              border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "10px",
              padding: "11px 20px", fontSize: "13px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : lands.length === 0 ? (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px", padding: "48px", textAlign: "center",
        }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No projects yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {lands.map((land, i) => {
            const s = statusColors[land.status] || statusColors.available;
            return (
              <div key={land.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                borderBottom: i < lands.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: "56px", height: "42px", borderRadius: "8px", flexShrink: 0,
                  background: "#3A3A3D", overflow: "hidden",
                  border: "0.5px solid rgba(201,151,58,0.15)",
                }}>
                  {land.image_url ? (
                    <img src={land.image_url} alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#6B6762", fontSize: "16px",
                    }}>🏗</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>
                    {land.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px" }}>
                    {land.locations?.name || "—"} · {land.developers?.name || "—"}
                    {land.price ? ` · EGP ${Number(land.price).toLocaleString()}` : ""}
                  </div>
                </div>

                {/* Status */}
                <span style={{
                  fontSize: "10px", background: s.bg, color: s.color,
                  border: `0.5px solid ${s.color}55`, borderRadius: "999px",
                  padding: "3px 10px", letterSpacing: "0.08em",
                  textTransform: "uppercase", flexShrink: 0,
                }}>
                  {land.status}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => openEdit(land)} style={{
                    background: "transparent",
                    border: "0.5px solid rgba(201,151,58,0.25)",
                    borderRadius: "8px", padding: "7px 14px",
                    color: "#C9973A", fontSize: "12px", cursor: "pointer",
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(land.id)} disabled={deletingId === land.id} style={{
                    background: "transparent",
                    border: "0.5px solid rgba(200,60,60,0.3)",
                    borderRadius: "8px", padding: "7px 14px",
                    color: "#E07070", fontSize: "12px", cursor: "pointer",
                  }}>
                    {deletingId === land.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

#### `src/app/admin/developers/page.js`

Lines: 242.

```
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = { name: "", bio: "", logo_url: "" };

export default function AdminDevelopers() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function fetchDevelopers() {
    const { data } = await supabase.from("developers").select("*").order("name");
    setDevelopers(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchDevelopers(); }, []);

  function openAdd() { setForm(emptyForm); setEditId(null); setError(""); setLogoFile(null); setShowForm(true); }
  function openEdit(dev) {
    setForm({ name: dev.name || "", bio: dev.bio || "", logo_url: dev.logo_url || "" });
    setEditId(dev.id); setError(""); setLogoFile(null); setShowForm(true);
  }
  function cancelForm() { setShowForm(false); setForm(emptyForm); setEditId(null); setError(""); setLogoFile(null); }

  async function uploadLogo(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("developer-logos").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("developer-logos").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");

    let finalLogoUrl = form.logo_url.trim() || null;

    if (logoFile) {
      setUploading(true);
      try {
        finalLogoUrl = await uploadLogo(logoFile);
      } catch (err) {
        setError("Logo upload failed: " + err.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editId) {
      const { error } = await supabase.from("developers").update({
        name: form.name.trim(), bio: form.bio.trim(), logo_url: finalLogoUrl,
      }).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("developers").insert({
        name: form.name.trim(), bio: form.bio.trim(), logo_url: finalLogoUrl,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false); cancelForm(); fetchDevelopers();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this developer?")) return;
    setDeletingId(id);
    await supabase.from("developers").delete().eq("id", id);
    setDeletingId(null); fetchDevelopers();
  }

  const inputStyle = {
    width: "100%", background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)", borderRadius: "10px",
    padding: "11px 14px", color: "#F0EDE6", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "Inter, Arial, sans-serif",
  };
  const labelStyle = {
    display: "block", fontSize: "11px", color: "#9A9489",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px",
  };

  const previewUrl = logoFile ? URL.createObjectURL(logoFile) : form.logo_url;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>Developers</h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{developers.length} developer{developers.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add developer
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)", borderRadius: "14px", padding: "28px", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 22px", fontWeight: "500" }}>
            {editId ? "Edit developer" : "New developer"}
          </h2>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Developer company name" />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Bio</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short paragraph shown on project pages..." />
          </div>

          {/* Logo upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Logo</label>

            {previewUrl && (
              <div style={{ marginBottom: "12px" }}>
                <img src={previewUrl} alt="" style={{
                  width: "72px", height: "72px", objectFit: "cover",
                  borderRadius: "999px", border: "0.5px solid rgba(201,151,58,0.25)",
                }} />
              </div>
            )}

            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${logoFile ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer", background: logoFile ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={e => setLogoFile(e.target.files[0] || null)} />
              <span style={{ fontSize: "22px" }}>🏢</span>
              <span style={{ fontSize: "13px", color: logoFile ? "#4DC98A" : "#9A9489" }}>
                {logoFile ? logoFile.name : "Click to upload logo"}
              </span>
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(200,60,60,0.12)", border: "0.5px solid rgba(200,60,60,0.4)", borderRadius: "8px", padding: "10px 14px", color: "#E07070", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? "rgba(201,151,58,0.4)" : "#C9973A", color: "#2C2C2E",
              border: "none", borderRadius: "10px", padding: "11px 24px",
              fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer",
            }}>
              {uploading ? "Uploading..." : saving ? "Saving..." : editId ? "Save changes" : "Add developer"}
            </button>
            <button onClick={cancelForm} style={{
              background: "transparent", color: "#9A9489",
              border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "10px",
              padding: "11px 20px", fontSize: "13px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : developers.length === 0 ? (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No developers yet.</p>
        </div>
      ) : (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", overflow: "hidden" }}>
          {developers.map((dev, i) => (
            <div key={dev.id} style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "16px 20px",
              borderBottom: i < developers.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
            }}>
              {/* Avatar / logo */}
              <div style={{
                width: "44px", height: "44px", borderRadius: "999px", flexShrink: 0,
                background: "rgba(201,151,58,0.15)", border: "0.5px solid rgba(201,151,58,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", color: "#C9973A", fontFamily: "Georgia, serif", fontWeight: "bold",
                overflow: "hidden",
              }}>
                {dev.logo_url ? (
                  <img src={dev.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  dev.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>{dev.name}</div>
                {dev.bio && (
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dev.bio}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEdit(dev)} style={{
                  background: "transparent", border: "0.5px solid rgba(201,151,58,0.25)",
                  borderRadius: "8px", padding: "7px 14px", color: "#C9973A", fontSize: "12px", cursor: "pointer",
                }}>Edit</button>
                <button onClick={() => handleDelete(dev.id)} disabled={deletingId === dev.id} style={{
                  background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                  borderRadius: "8px", padding: "7px 14px", color: "#E07070", fontSize: "12px", cursor: "pointer",
                }}>
                  {deletingId === dev.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### `src/app/admin/reservations/page.js`

Lines: 532.

```
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_TABS = ["all", "pending", "confirmed", "rejected"];

const STATUS_STYLES = {
  pending:   { color: "#E8C97A", bg: "rgba(200,150,40,0.12)",  border: "rgba(200,150,40,0.3)"  },
  confirmed: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)",   border: "rgba(77,201,138,0.35)" },
  rejected:  { color: "#E07070", bg: "rgba(200,60,60,0.12)",   border: "rgba(200,60,60,0.3)"   },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
      textTransform: "capitalize", letterSpacing: "0.08em",
      color: s.color, background: s.bg, border: `0.5px solid ${s.border}`,
      display: "inline-block",
    }}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, gold }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: gold ? "#E8C97A" : "#F0EDE6", fontWeight: gold ? 500 : 400 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
      color: "#6B6762", marginBottom: 12, marginTop: 0,
    }}>
      {children}
    </p>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState("all");
  const [selected, setSelected]           = useState(null);
  const [idFrontUrl, setIdFrontUrl]       = useState(null);
  const [idBackUrl, setIdBackUrl]         = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  async function fetchReservations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        lands (
          id, title, area_sqm, price_per_meter,
          locations ( name )
        ),
        land_areas ( area_sqm, status ),
        land_installment_plans ( label, down_payment_percent, years )
      `)
      .order("created_at", { ascending: false });

    if (!error) setReservations(data ?? []);
    setLoading(false);
  }

  async function selectReservation(r) {
    setSelected(r);
    setIdFrontUrl(null);
    setIdBackUrl(null);
    setConfirmDelete(false);

    if (r.national_id_front) {
      const { data } = await supabase.storage.from("reservations").createSignedUrl(r.national_id_front, 3600);
      if (data?.signedUrl) setIdFrontUrl(data.signedUrl);
    }
    if (r.national_id_back) {
      const { data } = await supabase.storage.from("reservations").createSignedUrl(r.national_id_back, 3600);
      if (data?.signedUrl) setIdBackUrl(data.signedUrl);
    }
  }

  async function updateStatus(newStatus) {
    if (!selected) return;
    setUpdatingStatus(true);
    const { error } = await supabase.from("reservations").update({ status: newStatus }).eq("id", selected.id);
    if (!error) {
      const updated = { ...selected, status: newStatus };
      setSelected(updated);
      setReservations(prev => prev.map(r => r.id === selected.id ? { ...r, status: newStatus } : r));
    }
    setUpdatingStatus(false);
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);

    // Delete storage files if they exist
    const filesToDelete = [];
    if (selected.national_id_front) filesToDelete.push(selected.national_id_front);
    if (selected.national_id_back)  filesToDelete.push(selected.national_id_back);
    if (filesToDelete.length > 0) {
      await supabase.storage.from("reservations").remove(filesToDelete);
    }

    // Delete the reservation row
    const { error } = await supabase.from("reservations").delete().eq("id", selected.id);
    if (!error) {
      setReservations(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
    }
    setDeleting(false);
  }

  const filtered = activeTab === "all"
    ? reservations
    : reservations.filter(r => r.status === activeTab);

  function formatDate(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
  }

  function getProjectName(r)   { return r.lands?.title ?? "—"; }
  function getLocationName(r)  { return r.lands?.locations?.name ?? "—"; }
  function getReservedArea(r) {
    if (r.land_areas?.area_sqm)  return `${Number(r.land_areas.area_sqm).toLocaleString()} m²`;
    if (r.lands?.area_sqm)       return `${Number(r.lands.area_sqm).toLocaleString()} m² (project total)`;
    return "—";
  }
  function getPlanLabel(r) {
    const plan = r.land_installment_plans;
    if (!plan) return "—";
    return plan.label || `${plan.down_payment_percent}% down — ${plan.years} yrs`;
  }
  function getPlanDetails(r) {
    const plan = r.land_installment_plans;
    if (!plan) return null;
    const parts = [];
    if (plan.down_payment_percent != null) parts.push(`${plan.down_payment_percent}% down payment`);
    if (plan.years != null) parts.push(`${plan.years} year${plan.years !== 1 ? "s" : ""}`);
    return parts.join(" · ") || null;
  }
  function getPricePerMeter(r) {
    const ppm = r.lands?.price_per_meter;
    if (!ppm) return "—";
    return `EGP ${Number(ppm).toLocaleString()} / m²`;
  }

  return (
    <div style={{ padding: "32px 28px", minHeight: "100vh", color: "#F0EDE6" }}>
      <h1 style={{
        fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)",
        fontSize: 28, fontWeight: 400, color: "#F0EDE6", marginBottom: 6,
      }}>
        Reservations
      </h1>
      <p style={{ fontSize: 13, color: "#6B6762", marginBottom: 28 }}>
        {reservations.length} total reservation{reservations.length !== 1 ? "s" : ""}
      </p>

      {/* Tab filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12,
                fontWeight: isActive ? 500 : 400, letterSpacing: "0.04em",
                textTransform: "capitalize", cursor: "pointer",
                border: isActive ? "0.5px solid rgba(201,151,58,0.55)" : "0.5px solid rgba(201,151,58,0.18)",
                background: isActive ? "rgba(201,151,58,0.1)" : "transparent",
                color: isActive ? "#C9973A" : "#9A9489",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
              {tab !== "all" && (
                <span style={{ marginLeft: 6, color: isActive ? "#C9973A" : "#6B6762" }}>
                  ({reservations.filter(r => r.status === tab).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "#6B6762", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading reservations…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>

          {/* ── LEFT: list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "3rem", color: "#6B6762",
                background: "#343437", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)", fontSize: 14,
              }}>
                No {activeTab === "all" ? "" : activeTab} reservations yet
              </div>
            ) : (
              filtered.map(r => {
                const isSelected = selected?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectReservation(r)}
                    style={{
                      padding: "14px 16px",
                      background: isSelected ? "rgba(201,151,58,0.07)" : "#343437",
                      border: isSelected ? "0.5px solid rgba(201,151,58,0.45)" : "0.5px solid rgba(201,151,58,0.18)",
                      borderRadius: 12, cursor: "pointer", transition: "all 0.2s ease",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(201,151,58,0.35)";
                        e.currentTarget.style.background = "rgba(201,151,58,0.04)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(201,151,58,0.18)";
                        e.currentTarget.style.background = "#343437";
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-heading, Georgia, serif)",
                      fontSize: 16, color: "#C9973A", flexShrink: 0,
                    }}>
                      {r.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#F0EDE6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.full_name}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div style={{ fontSize: 12, color: "#C9973A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getProjectName(r)}
                        {getLocationName(r) !== "—" && <span style={{ color: "#6B6762" }}> · {getLocationName(r)}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B6762", flexWrap: "wrap" }}>
                        {r.land_areas && <span>{getReservedArea(r)}</span>}
                        {r.land_installment_plans && <span>{getPlanLabel(r)}</span>}
                        <span style={{ marginLeft: "auto" }}>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── RIGHT: detail panel ── */}
          {selected && (
            <div style={{
              background: "#343437",
              border: "0.5px solid rgba(201,151,58,0.22)",
              borderRadius: 14,
              padding: "20px",
              position: "sticky",
              top: 20,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{
                    fontFamily: "var(--font-heading, Georgia, serif)",
                    fontSize: 20, fontWeight: 400, color: "#F0EDE6", marginBottom: 4,
                  }}>
                    {selected.full_name}
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <button
                  onClick={() => { setSelected(null); setConfirmDelete(false); }}
                  style={{
                    background: "none", border: "none", color: "#6B6762",
                    cursor: "pointer", fontSize: 18, padding: "2px 6px",
                    lineHeight: 1, borderRadius: 6, transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#F0EDE6"}
                  onMouseLeave={e => e.currentTarget.style.color = "#6B6762"}
                  title="Close"
                >
                  ×
                </button>
              </div>

              {/* Section 1: Project */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Project</SectionLabel>
                <InfoRow label="Project name" value={getProjectName(selected)} gold />
                <InfoRow label="Location"     value={getLocationName(selected)} />
                <InfoRow label="Price / m²"   value={getPricePerMeter(selected)} gold />
              </div>

              {/* Section 2: Reservation details */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Reservation Details</SectionLabel>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Reserved Area</div>
                  {selected.land_areas ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#E8C97A", fontWeight: 500 }}>{getReservedArea(selected)}</span>
                      <StatusBadge status={selected.land_areas.status} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#6B6762", fontStyle: "italic" }}>No area selected (legacy reservation)</span>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Payment Plan</div>
                  {selected.land_installment_plans ? (
                    <div>
                      <div style={{ fontSize: 14, color: "#E8C97A", fontWeight: 500, marginBottom: 2 }}>{getPlanLabel(selected)}</div>
                      {getPlanDetails(selected) && <div style={{ fontSize: 11, color: "#9A9489" }}>{getPlanDetails(selected)}</div>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#6B6762", fontStyle: "italic" }}>No plan selected (legacy reservation)</span>
                  )}
                </div>
              </div>

              {/* Section 3: Buyer */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Buyer</SectionLabel>
                <InfoRow label="Full name" value={selected.full_name} />
                <InfoRow label="Phone"     value={selected.phone} />
                <InfoRow label="Submitted" value={formatDate(selected.created_at)} />
              </div>

              {/* Section 4: National ID photos */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
                <SectionLabel>National ID</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Front", url: idFrontUrl, path: selected.national_id_front },
                    { label: "Back",  url: idBackUrl,  path: selected.national_id_back  },
                  ].map(({ label, url, path }) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
                      {path ? (
                        url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                            <img src={url} alt={`National ID ${label}`} style={{
                              width: "100%", aspectRatio: "4/3", objectFit: "cover",
                              borderRadius: 8, border: "0.5px solid rgba(201,151,58,0.22)", display: "block",
                            }} />
                          </a>
                        ) : (
                          <div style={{
                            width: "100%", aspectRatio: "4/3", borderRadius: 8,
                            background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.14)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: "#6B6762",
                          }}>Loading…</div>
                        )
                      ) : (
                        <div style={{
                          width: "100%", aspectRatio: "4/3", borderRadius: 8,
                          background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: "#6B6762",
                        }}>Not uploaded</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Status controls */}
              <div style={{ marginBottom: 14 }}>
                <SectionLabel>Update Status</SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>
                  {["pending", "confirmed", "rejected"].map(s => {
                    const st = STATUS_STYLES[s];
                    const isActive = selected.status === s;
                    return (
                      <button
                        key={s}
                        disabled={updatingStatus || isActive}
                        onClick={() => updateStatus(s)}
                        style={{
                          flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 11,
                          fontWeight: isActive ? 500 : 400, letterSpacing: "0.06em",
                          textTransform: "capitalize", cursor: isActive ? "default" : "pointer",
                          border: `0.5px solid ${isActive ? st.border : "rgba(201,151,58,0.18)"}`,
                          background: isActive ? st.bg : "transparent",
                          color: isActive ? st.color : "#6B6762",
                          opacity: updatingStatus && !isActive ? 0.5 : 1,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => {
                          if (!isActive && !updatingStatus) {
                            e.currentTarget.style.color = st.color;
                            e.currentTarget.style.borderColor = st.border;
                            e.currentTarget.style.background = st.bg;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#6B6762";
                            e.currentTarget.style.borderColor = "rgba(201,151,58,0.18)";
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 6: Delete */}
              <div style={{ borderTop: "0.5px solid rgba(201,151,58,0.12)", paddingTop: 14 }}>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 9, fontSize: 12,
                      cursor: "pointer", letterSpacing: "0.04em",
                      border: "0.5px solid rgba(200,60,60,0.25)",
                      background: "transparent", color: "#6B6762",
                      transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = "#E07070";
                      e.currentTarget.style.borderColor = "rgba(200,60,60,0.5)";
                      e.currentTarget.style.background = "rgba(200,60,60,0.08)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = "#6B6762";
                      e.currentTarget.style.borderColor = "rgba(200,60,60,0.25)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete reservation
                  </button>
                ) : (
                  <div style={{
                    background: "rgba(200,60,60,0.08)", border: "0.5px solid rgba(200,60,60,0.3)",
                    borderRadius: 9, padding: "12px 14px",
                  }}>
                    <p style={{ fontSize: 12, color: "#E07070", marginBottom: 10, lineHeight: 1.5 }}>
                      This will permanently delete this reservation and its ID photos. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12,
                          cursor: "pointer", border: "0.5px solid rgba(201,151,58,0.18)",
                          background: "transparent", color: "#9A9489", transition: "all 0.2s ease",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12,
                          cursor: deleting ? "default" : "pointer",
                          border: "0.5px solid rgba(200,60,60,0.5)",
                          background: "rgba(200,60,60,0.15)", color: "#E07070",
                          fontWeight: 500, transition: "all 0.2s ease",
                          opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### `src/app/components/SplashScreen.js`

Lines: 127.

```
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({ children }) {
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setPhase("visible");
    }, 100);

    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 2200);

    const removeTimer = setTimeout(() => {
      setPhase("done");
    }, 3400);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}

      {phase !== "done" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#2C2C2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 9999,
            pointerEvents: "none",

            opacity: phase === "fadeout" ? 0 : 1,
            transition: "opacity 1.2s ease",
          }}
        >
          {/* Gold glow */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(201,151,58,0.10) 0%, transparent 70%)",

              opacity: phase === "fadeout" ? 0 : 1,

              transform:
                phase === "fadeout"
                  ? "scale(1.25)"
                  : "scale(1)",

              transition:
                "opacity 1.2s ease, transform 1.2s ease",
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",

              opacity:
                phase === "hidden"
                  ? 0
                  : phase === "fadeout"
                  ? 0
                  : 1,

              transform:
                phase === "hidden"
                  ? "translateY(12px) scale(0.96)"
                  : phase === "fadeout"
                  ? "translateY(-8px) scale(1.03)"
                  : "translateY(0) scale(1)",

              transition:
                "opacity 1s ease, transform 1s ease",
            }}
          >
            <Image
              src="/logo.png"
              alt="Invegate"
              width={240}
              height={120}
              priority
              style={{
                width: "240px",
                height: "auto",
                filter:
                  "drop-shadow(0 0 28px rgba(201,151,58,0.18))",
              }}
            />

            <div
              style={{
                marginTop: 14,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6B6762",
              }}
            >
              Luxury Real Estate Redefined
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

#### `src/app/components/LocationSearch.js`

Lines: 105.

```
"use client";
import { useState } from "react";
import LocationCard from "./LocationCard";

export default function LocationSearch({ locations, countByLocation }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = locations?.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  return (
    <>
      {/* Search bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: focused ? "2px solid #C9973A" : "2px solid rgba(201,151,58,0.25)",
        padding: "12px 4px",
        marginBottom: "2.5rem",
        transition: "border-color 0.2s ease",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={focused ? "#C9973A" : "#6B6762"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.2s" }}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search locations..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 16,
            color: "#F0EDE6",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              color: "#6B6762",
              cursor: "pointer",
              fontSize: 20,
              padding: "0 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results label */}
      {query && (
        <p style={{
          fontSize: 11,
          color: "#6B6762",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "#6B6762", fontSize: 14 }}>
          No locations match &quot;{query}&quot;
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))",
          gap: 14,
        }}>
          {filtered.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              count={countByLocation[loc.id] ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
```

#### `src/app/components/LocationCard.js`

Lines: 155.

```
"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LocationCard({ loc, count }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/location/${loc.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#343437",
          borderRadius: 12,
          overflow: "hidden",
          border: hovered
            ? "0.5px solid rgba(201,151,58,0.55)"
            : "0.5px solid rgba(201,151,58,0.18)",
          transform: hovered ? "translateY(-5px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 18px 40px rgba(0,0,0,0.28)"
            : "0 0 0 rgba(0,0,0,0)",
          transition: "all 0.35s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: "#3A3A3D",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {loc.image_url ? (
            <Image
              src={loc.image_url}
              alt={loc.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{
                objectFit: "cover",
                transform: hovered ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.6s ease",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(201,151,58,0.2)"
                strokeWidth="1.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(44,44,46,0.78) 0%, transparent 60%)",
            }}
          />
        </div>

        <div style={{ padding: "14px 16px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              fontWeight: 500,
              color: "#F0EDE6",
              marginBottom: 6,
            }}
          >
            {loc.name}
          </h2>

          <p
            style={{
              color: "#9A9489",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
              minHeight: 40,
            }}
          >
            {loc.description}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#6B6762",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {count ?? 0} Projects
            </span>

            <div
              style={{
                width: 28,
                height: 28,
                border: hovered
                  ? "0.5px solid rgba(201,151,58,0.55)"
                  : "0.5px solid rgba(201,151,58,0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C9973A",
                fontSize: 13,
                background: hovered
                  ? "rgba(201,151,58,0.1)"
                  : "transparent",
                transform: hovered
                  ? "translateX(2px)"
                  : "translateX(0)",
                transition: "all 0.35s ease",
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

#### `src/app/components/ProjectCard.js`

Lines: 200.

```
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const statusStyles = {
  available: {
    bg: "rgba(30,120,70,0.18)",
    border: "rgba(77,201,138,0.35)",
    text: "#4DC98A",
  },
  reserved: {
    bg: "rgba(200,150,40,0.12)",
    border: "rgba(200,150,40,0.3)",
    text: "#E8C97A",
  },
  sold: {
    bg: "rgba(200,60,60,0.12)",
    border: "rgba(200,60,60,0.3)",
    text: "#E07070",
  },
};

export default function ProjectCard({ land, developerName }) {
  const [hovered, setHovered] = useState(false);

  const status = land.status ?? "available";
  const s = statusStyles[status] ?? statusStyles.available;
  const firstImage = land.image_url ?? null;

  const pricePerMeter =
    land.price && land.area_sqm
      ? Math.round(land.price / land.area_sqm)
      : null;

  return (
    <Link
      href={`/land/${land.id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#343437",
          border: hovered
            ? "0.5px solid rgba(201,151,58,0.55)"
            : "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: 14,
          overflow: "hidden",
          transition:
            "border-color 0.25s ease, transform 0.25s ease",
          transform: hovered
            ? "translateY(-2px)"
            : "translateY(0)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: "#3A3A3D",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {firstImage ? (
            <Image
              src={firstImage}
              alt={land.title}
              fill
              sizes="(max-width: 600px) 100vw, 320px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(201,151,58,0.2)"
                strokeWidth="1.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)",
            }}
          />

          {/* Status Badge */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: s.bg,
              border: `0.5px solid ${s.border}`,
              color: s.text,
              fontSize: 9,
              padding: "4px 10px",
              borderRadius: 20,
              textTransform: "capitalize",
              letterSpacing: "0.08em",
              fontWeight: 500,
              backdropFilter: "blur(6px)",
            }}
          >
            {status}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "16px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 17,
              color: "#F0EDE6",
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {land.title}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6B6762",
              marginBottom: 18,
            }}
          >
            {developerName}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#E8C97A",
              }}
            >
              {pricePerMeter
                ? `EGP ${pricePerMeter.toLocaleString()}/m²`
                : "On request"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: hovered ? "#C9973A" : "#6B6762",
                transition: "color 0.2s ease",
              }}
            >
              Details →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

#### `src/app/components/PhotoGallery.js`

Lines: 367.

```
"use client";

import { useState, useRef, useEffect } from "react";

export default function PhotoGallery({ images, alt, status, statusStyle }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverZone, setHoverZone] = useState(null); // "left" | "right" | null — drives arrow visibility

  // ---- Edge-hover auto-scroll (desktop only) ----
  // Tracked via continuous mousemove rather than enter/leave on thin overlay
  // strips, which is more reliable and re-evaluates on every frame the mouse moves.
  const intervalRef = useRef(null);
  const directionRef = useRef(null);

  function clearAutoScroll() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    directionRef.current = null;
  }

  function startAutoScroll(direction, count) {
    if (directionRef.current === direction) return; // already running this way
    clearAutoScroll();
    directionRef.current = direction;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = direction === "left" ? prev - 1 : prev + 1;
        if (next < 0 || next > count - 1) {
          clearAutoScroll();
          return prev;
        }
        return next;
      });
    }, 700);
  }

  function handleMainMouseMove(e) {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const relX = (e.clientX - rect.left) / rect.width;

    if (relX < 0.28 && activeIndex > 0) {
      setHoverZone("left");
      startAutoScroll("left", images.length);
    } else if (relX > 0.72 && activeIndex < images.length - 1) {
      setHoverZone("right");
      startAutoScroll("right", images.length);
    } else {
      setHoverZone(null);
      clearAutoScroll();
    }
  }

  function handleMainMouseLeave() {
    setHoverZone(null);
    clearAutoScroll();
  }

  useEffect(() => () => clearAutoScroll(), []);

  if (!images || images.length === 0) {
    return (
      <div style={{ width: "92%", margin: "1rem auto 0", boxSizing: "border-box" }}>
        <div style={{ borderRadius: 14, position: "relative" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              background: "#3A3A3D",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.2)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute", top: 14, right: 14, background: statusStyle.bg,
              border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
              fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
              textTransform: "capitalize", letterSpacing: "0.08em",
            }}
          >
            {status}
          </div>
        </div>
      </div>
    );
  }

  const prevImage = activeIndex > 0 ? images[activeIndex - 1] : null;
  const nextImage = activeIndex < images.length - 1 ? images[activeIndex + 1] : null;

  return (
    <div style={{ width: "92%", margin: "1rem auto 0", boxSizing: "border-box" }}>

      {/* MOBILE — unchanged horizontal scroll-snap carousel */}
      <div
        className="pg-mobile"
        style={{ borderRadius: 14, position: "relative" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            overflowX: "scroll",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            borderRadius: 14,
            background: "#3A3A3D",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id ?? i}
              style={{
                flex: "0 0 100%",
                maxWidth: "100%",
                width: "100%",
                aspectRatio: "16 / 10",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                overflow: "hidden",
              }}
            >
              <img
                src={img.image_url}
                alt={alt}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute", top: 14, right: 14, background: statusStyle.bg,
            border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
            fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
            textTransform: "capitalize", letterSpacing: "0.08em",
          }}
        >
          {status}
        </div>

        {images.length > 1 && (
          <div
            style={{
              position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)",
              color: "#F0EDE6", fontSize: 11, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em",
            }}
          >
            {images.length} photos · swipe →
          </div>
        )}
      </div>

      {/* DESKTOP — main image + grayscale side peeks + thumbnail rail, centered */}
      <div
        className="pg-desktop"
        style={{ display: "none", gap: 10, alignItems: "stretch", justifyContent: "center" }}
      >
        {/* Left grayscale peek */}
        <div
          style={{
            flex: "0 0 130px",
            borderRadius: 12,
            overflow: "hidden",
            background: "#3A3A3D",
            position: "relative",
          }}
        >
          {prevImage && (
            <img
              src={prevImage.image_url}
              alt=""
              onClick={() => setActiveIndex(activeIndex - 1)}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: "grayscale(1) brightness(0.65)",
                cursor: "pointer", display: "block",
              }}
            />
          )}
        </div>

        {/* Main image — sliding strip with smooth transition, fills remaining width */}
        <div
          onMouseMove={handleMainMouseMove}
          onMouseLeave={handleMainMouseLeave}
          style={{
            flex: "1 1 auto",
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            background: "#3A3A3D",
            cursor: hoverZone === "left" ? "w-resize" : hoverZone === "right" ? "e-resize" : "default",
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${images.length * 100}%`,
              transform: `translateX(-${(activeIndex * 100) / images.length}%)`,
              transition: "transform 0.55s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            {images.map((img, i) => (
              <div
                key={img.id ?? i}
                style={{ width: `${100 / images.length}%`, flexShrink: 0, aspectRatio: "16 / 10" }}
              >
                <img
                  src={img.image_url}
                  alt={alt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>

          {/* Left edge affordance — gradient scrim + chevron, purely decorative */}
          {images.length > 1 && activeIndex > 0 && (
            <div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "32%",
                background: "linear-gradient(to right, rgba(0,0,0,0.32), transparent)",
                display: "flex", alignItems: "center", justifyContent: "flex-start",
                paddingLeft: 16, pointerEvents: "none",
                opacity: hoverZone === "left" ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          )}

          {/* Right edge affordance */}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <div
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "32%",
                background: "linear-gradient(to left, rgba(0,0,0,0.32), transparent)",
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 16, pointerEvents: "none",
                opacity: hoverZone === "right" ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}

          <div
            style={{
              position: "absolute", top: 14, right: 14, background: statusStyle.bg,
              border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
              fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
              textTransform: "capitalize", letterSpacing: "0.08em",
              pointerEvents: "none", zIndex: 3,
            }}
          >
            {status}
          </div>

          {images.length > 1 && (
            <div
              style={{
                position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)",
                color: "#F0EDE6", fontSize: 11, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em",
                pointerEvents: "none", zIndex: 3,
              }}
            >
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Right grayscale peek */}
        <div
          style={{
            flex: "0 0 130px",
            borderRadius: 12,
            overflow: "hidden",
            background: "#3A3A3D",
            position: "relative",
          }}
        >
          {nextImage && (
            <img
              src={nextImage.image_url}
              alt=""
              onClick={() => setActiveIndex(activeIndex + 1)}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: "grayscale(1) brightness(0.65)",
                cursor: "pointer", display: "block",
              }}
            />
          )}
        </div>

        {/* Thumbnail rail */}
        {images.length > 1 && (
          <div
            style={{
              flex: "0 0 72px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {images.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                style={{
                  border: i === activeIndex ? "2px solid #C9973A" : "0.5px solid rgba(201,151,58,0.18)",
                  borderRadius: 8,
                  padding: 0,
                  cursor: "pointer",
                  background: "none",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src={img.image_url}
                  alt=""
                  style={{
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                    filter: i === activeIndex ? "none" : "grayscale(1) brightness(0.75)",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 860px) {
          .pg-mobile { display: none; }
          .pg-desktop { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
```

#### `src/app/components/ProjectDetails.js`

Lines: 277.

```
"use client";
import { useState } from "react";
import Image from "next/image";
import ReserveButton from "./ReserveButton";

const AREA_STATUS_STYLES = {
  available: { bg: "rgba(30,120,70,0.18)", border: "rgba(77,201,138,0.35)", text: "#4DC98A" },
  reserved:  { bg: "rgba(200,150,40,0.12)", border: "rgba(200,150,40,0.3)",  text: "#E8C97A" },
  sold:      { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.3)",   text: "#E07070" },
};

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: "1.5rem",
};
const modalCardStyle = {
  background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.3)",
  borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 380,
  maxHeight: "70vh", overflowY: "auto", boxSizing: "border-box",
};
const modalHeaderRow = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 };
const modalTitleStyle = { fontFamily: "Georgia, serif", fontSize: 16, color: "#F0EDE6" };
const closeBtnStyle = {
  background: "transparent", border: "none", color: "#6B6762",
  fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "4px 8px",
};
const emptyModalText = { fontSize: 13, color: "#6B6762", textAlign: "center", padding: "1rem 0" };

const cardStyle = {
  background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)",
  borderRadius: 10, padding: "12px 14px",
};
const cardLabelStyle = { fontSize: 9, color: "#6B6762", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" };
const cardValueStyle = { fontSize: 14, fontWeight: 500, color: "#E8C97A" };

export default function ProjectDetails({
  land, developer, location, mapsUrl, whatsappUrl,
  landAreas, installmentPlans, priceRows,
}) {
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const selectedArea = landAreas.find((a) => a.id === selectedAreaId) ?? null;
  const selectedPlan = installmentPlans.find((p) => p.id === selectedPlanId) ?? null;
  const bothSelected = Boolean(selectedArea && selectedPlan);

  const totalPrice = bothSelected
    ? priceRows.find(
        (r) => r.land_area_id === selectedAreaId && r.installment_plan_id === selectedPlanId
      )?.total_price ?? null
    : null;

  function pickArea(area) {
    if (area.status !== "available") return;
    setSelectedAreaId(area.id);
    setShowAreaModal(false);
  }

  function pickPlan(plan) {
    setSelectedPlanId(plan.id);
    setShowPlanModal(false);
  }

  return (
    <>
      {/* KEY INFO */}
      <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#F0EDE6", lineHeight: 1.3, marginBottom: 16 }}>
          {land.title}
        </h1>

        {/* Row 1 — static */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 10 }}>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Price / m²</div>
            <div style={cardValueStyle}>
              {land.price_per_meter ? `EGP ${Number(land.price_per_meter).toLocaleString()}/m²` : "On request"}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Project area</div>
            <div style={cardValueStyle}>
              {land.area_sqm ? `${Number(land.area_sqm).toLocaleString()} m²` : "TBC"}
            </div>
          </div>
        </div>

        {/* Row 2 — clickable */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: land.description ? 16 : 0 }}>
          <button
            onClick={() => setShowAreaModal(true)}
            style={{ ...cardStyle, textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
          >
            <div style={cardLabelStyle}>Available Area</div>
            <div style={{ ...cardValueStyle, color: selectedArea ? "#E8C97A" : "#9A9489" }}>
              {selectedArea ? `${Number(selectedArea.area_sqm).toLocaleString()} m²` : "Select size →"}
            </div>
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            style={{ ...cardStyle, textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
          >
            <div style={cardLabelStyle}>Installment Plan</div>
            <div style={{ ...cardValueStyle, color: selectedPlan ? "#E8C97A" : "#9A9489" }}>
              {selectedPlan ? `${selectedPlan.down_payment_percent}% / ${selectedPlan.years} yrs` : "Select plan →"}
            </div>
          </button>
        </div>

        {land.description && (
          <p style={{ fontSize: 14, color: "#9A9489", lineHeight: 1.7, borderTop: "0.5px solid rgba(201,151,58,0.12)", paddingTop: 16 }}>
            {land.description}
          </p>
        )}
      </div>

      {/* EXACT LOCATION — unchanged */}
      {mapsUrl && (
        <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 12 }}>Exact location</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "13px 16px", textDecoration: "none", color: "#F0EDE6", fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            View on Google Maps
            <span style={{ marginLeft: "auto", color: "#C9973A", fontSize: 12 }}>Open →</span>
          </a>
        </div>
      )}

      {/* INLINE NOTE — shown until both area and plan are selected */}
      {!bothSelected && (
        <div style={{ margin: "0.75rem 1.5rem 0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B6762" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6762" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Select an area and plan above to enable reservation
        </div>
      )}

      {/* DEVELOPER — unchanged */}
      {developer && (
        <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 14 }}>Developer</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: developer.bio ? 12 : 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 18, color: "#C9973A", flexShrink: 0, overflow: "hidden" }}>
              {developer.logo_url ? (
                <Image src={developer.logo_url} alt={developer.name} width={44} height={44} style={{ objectFit: "cover" }} />
              ) : (
                developer.name?.charAt(0)
              )}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "#F0EDE6" }}>{developer.name}</div>
          </div>
          {developer.bio && (
            <p style={{ fontSize: 13, color: "#9A9489", lineHeight: 1.7 }}>{developer.bio}</p>
          )}
        </div>
      )}

      {/* CONTACT INVEGATE */}
      <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 10 }}>Contact Invegate</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#6B6762" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          All inquiries go directly to Invegate — we handle everything for you
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(30,120,70,0.18)", border: "0.5px solid rgba(77,201,138,0.35)", color: "#4DC98A", borderRadius: 12, padding: "14px", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            WhatsApp Invegate
          </a>

          <ReserveButton
            landTitle={land.title}
            landId={land.id}
            selectedArea={selectedArea}
            selectedPlan={selectedPlan}
            totalPrice={totalPrice}
          />
        </div>
      </div>

      {/* AREA MODAL */}
      {showAreaModal && (
        <div onClick={() => setShowAreaModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalCardStyle}>
            <div style={modalHeaderRow}>
              <span style={modalTitleStyle}>Select area</span>
              <button onClick={() => setShowAreaModal(false)} style={closeBtnStyle}>×</button>
            </div>
            {landAreas.length === 0 ? (
              <p style={emptyModalText}>No area options listed yet for this project.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {landAreas.map((area) => {
                  const st = AREA_STATUS_STYLES[area.status] ?? AREA_STATUS_STYLES.available;
                  const disabled = area.status !== "available";
                  return (
                    <button
                      key={area.id}
                      onClick={() => pickArea(area)}
                      disabled={disabled}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#3A3A3D",
                        border: area.id === selectedAreaId ? "0.5px solid #C9973A" : "0.5px solid rgba(201,151,58,0.15)",
                        borderRadius: 10, padding: "12px 14px", textAlign: "left",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1, fontFamily: "inherit", width: "100%",
                      }}
                    >
                      <span style={{ fontSize: 14, color: "#F0EDE6" }}>{Number(area.area_sqm).toLocaleString()} m²</span>
                      <span style={{
                        fontSize: 10, background: st.bg, border: `0.5px solid ${st.border}`, color: st.text,
                        padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", letterSpacing: "0.06em",
                      }}>
                        {area.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSTALLMENT PLAN MODAL */}
      {showPlanModal && (
        <div onClick={() => setShowPlanModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalCardStyle}>
            <div style={modalHeaderRow}>
              <span style={modalTitleStyle}>Select installment plan</span>
              <button onClick={() => setShowPlanModal(false)} style={closeBtnStyle}>×</button>
            </div>
            {installmentPlans.length === 0 ? (
              <p style={emptyModalText}>No installment plans listed yet for this project.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {installmentPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => pickPlan(plan)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 2,
                      background: "#3A3A3D",
                      border: plan.id === selectedPlanId ? "0.5px solid #C9973A" : "0.5px solid rgba(201,151,58,0.15)",
                      borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
                      fontFamily: "inherit", width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#F0EDE6" }}>{plan.label}</span>
                    <span style={{ fontSize: 11, color: "#9A9489" }}>
                      {plan.down_payment_percent}% down payment · {plan.years} years
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

#### `src/app/components/ReserveButton.js`

Lines: 267. One sensitive token is redacted in this documentation copy.

```
"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wfxrtbfyvyslglyhbwdq.supabase.co",
  "<SUPABASE_ANON_KEY_REDACTED>"
);

export default function ReserveButton({ landTitle, landId, selectedArea, selectedPlan, totalPrice }) {
  const [step, setStep] = useState("idle");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canReserve = Boolean(selectedArea && selectedPlan);

  async function handleSubmit() {
    if (!form.name || !form.phone || !selectedArea || !selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      let frontUrl = null;
      let backUrl = null;

      // Upload front ID photo
      if (idFront) {
        const frontPath = `${landId}/${Date.now()}_front_${idFront.name}`;
        const { error: frontError } = await supabase.storage
          .from("reservations")
          .upload(frontPath, idFront);
        if (frontError) throw new Error("Failed to upload front ID: " + frontError.message);
        frontUrl = frontPath;
      }

      // Upload back ID photo
      if (idBack) {
        const backPath = `${landId}/${Date.now()}_back_${idBack.name}`;
        const { error: backError } = await supabase.storage
          .from("reservations")
          .upload(backPath, idBack);
        if (backError) throw new Error("Failed to upload back ID: " + backError.message);
        backUrl = backPath;
      }

      // Save reservation to database
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          land_id: landId,
          land_area_id: selectedArea.id,
          installment_plan_id: selectedPlan.id,
          full_name: form.name,
          phone: form.phone,
          national_id_front: frontUrl,
          national_id_back: backUrl,
          status: "pending",
        });

      if (insertError) throw new Error("Failed to save reservation: " + insertError.message);

      setStep("payment");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => canReserve && setStep("form")}
        disabled={!canReserve}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: canReserve ? "rgba(201,151,58,0.08)" : "rgba(201,151,58,0.04)",
          border: `0.5px solid ${canReserve ? "rgba(201,151,58,0.35)" : "rgba(201,151,58,0.15)"}`,
          color: canReserve ? "#E8C97A" : "#6B6762",
          borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 500, width: "100%",
          cursor: canReserve ? "pointer" : "not-allowed", fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={canReserve ? "#E8C97A" : "#6B6762"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Reserve this project
      </button>
    );
  }

  if (step === "form") {
    return (
      <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {["Info", "Payment"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "rgba(201,151,58,0.15)" : "transparent", border: `0.5px solid ${i === 0 ? "#C9973A" : "rgba(201,151,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 0 ? "#C9973A" : "#6B6762" }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: i === 0 ? "#C9973A" : "#6B6762" }}>{label}</span>
              {i === 0 && <div style={{ width: 30, height: 0.5, background: "rgba(201,151,58,0.2)" }} />}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#F0EDE6", marginBottom: 4 }}>Reserve your project</div>
        <div style={{ fontSize: 11, color: "#6B6762", marginBottom: 20 }}>
          {landTitle} · {selectedArea ? `${Number(selectedArea.area_sqm).toLocaleString()} m²` : ""} · {selectedPlan ? selectedPlan.label : ""}
        </div>

        {/* Full name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>Full name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ahmed Mohamed"
            style={{ width: "100%", background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#F0EDE6", fontFamily: "Inter, Arial, sans-serif", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>Phone number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+20 1XX XXX XXXX"
            style={{ width: "100%", background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#F0EDE6", fontFamily: "Inter, Arial, sans-serif", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* National ID front */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>National ID — front</label>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#2C2C2E", border: idFront ? "0.5px solid rgba(77,201,138,0.35)" : "0.5px dashed rgba(201,151,58,0.25)", borderRadius: 8, padding: "20px", cursor: "pointer", textAlign: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={idFront ? "#4DC98A" : "rgba(201,151,58,0.3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, color: idFront ? "#4DC98A" : "#6B6762" }}>{idFront ? idFront.name : "Tap to upload front"}</span>
            <span style={{ fontSize: 10, color: "#6B6762", opacity: 0.6 }}>JPG or PNG · max 5MB</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setIdFront(e.target.files[0])} />
          </label>
        </div>

        {/* National ID back */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>National ID — back</label>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#2C2C2E", border: idBack ? "0.5px solid rgba(77,201,138,0.35)" : "0.5px dashed rgba(201,151,58,0.25)", borderRadius: 8, padding: "20px", cursor: "pointer", textAlign: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={idBack ? "#4DC98A" : "rgba(201,151,58,0.3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, color: idBack ? "#4DC98A" : "#6B6762" }}>{idBack ? idBack.name : "Tap to upload back"}</span>
            <span style={{ fontSize: 10, color: "#6B6762", opacity: 0.6 }}>JPG or PNG · max 5MB</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setIdBack(e.target.files[0])} />
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: "rgba(200,60,60,0.1)", border: "0.5px solid rgba(200,60,60,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#E07070", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep("idle")} style={{ flex: 1, background: "transparent", border: "0.5px solid rgba(201,151,58,0.2)", color: "#6B6762", borderRadius: 10, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, Arial, sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.phone || loading}
            style={{ flex: 2, background: form.name && form.phone ? "rgba(201,151,58,0.12)" : "rgba(201,151,58,0.04)", border: `0.5px solid ${form.name && form.phone ? "#C9973A" : "rgba(201,151,58,0.15)"}`, color: form.name && form.phone ? "#E8C97A" : "#6B6762", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 500, cursor: form.name && form.phone && !loading ? "pointer" : "not-allowed", fontFamily: "Inter, Arial, sans-serif", transition: "all 0.2s" }}
          >
            {loading ? "Saving..." : "Confirm & proceed to payment →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    const waMessage = encodeURIComponent(`Reservation confirmation for: ${landTitle}\nName: ${form.name}\nPhone: ${form.phone}`);
    const waUrl = `https://wa.me/201000000000?text=${waMessage}`;
    const depositLabel = totalPrice ? `EGP ${Number(totalPrice).toLocaleString()}` : "Price on request";

    return (
      <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(91,155,213,0.3)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {["Info", "Payment"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 1 ? "rgba(91,155,213,0.15)" : "rgba(77,201,138,0.15)", border: `0.5px solid ${i === 1 ? "#5B9BD5" : "#4DC98A"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 1 ? "#5B9BD5" : "#4DC98A" }}>{i === 0 ? "✓" : "2"}</div>
              <span style={{ fontSize: 11, color: i === 1 ? "#5B9BD5" : "#4DC98A" }}>{label}</span>
              {i === 0 && <div style={{ width: 30, height: 0.5, background: "rgba(91,155,213,0.3)" }} />}
            </div>
          ))}
        </div>

        {/* Success note */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(77,201,138,0.08)", border: "0.5px solid rgba(77,201,138,0.25)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#4DC98A" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Your details have been saved — complete payment to confirm
        </div>

        {/* Amount */}
        <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.15)", borderRadius: 10, padding: "16px", textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Reservation deposit</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#C9973A" }}>{depositLabel}</div>
          <div style={{ fontSize: 11, color: "#6B6762", marginTop: 4 }}>Secures your project with Invegate</div>
        </div>

        {/* InstaPay number */}
        <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(91,155,213,0.3)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#5B9BD5", marginBottom: 6 }}>InstaPay number</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#F0EDE6", letterSpacing: "0.04em", marginBottom: 3 }}>01XX XXX XXXX</div>
          <div style={{ fontSize: 11, color: "#6B6762" }}>Invegate Real Estate</div>
        </div>

        {/* Steps */}
        <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 12 }}>How to pay</div>
          {[
            "Open your banking app and go to InstaPay",
            `Enter the number above and send ${depositLabel}`,
            "Take a screenshot of the confirmation",
            "Send the screenshot to Invegate on WhatsApp below",
          ].map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#C9973A", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: "#9A9489", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Shield note */}
        <div style={{ display: "flex", gap: 10, background: "rgba(201,151,58,0.04)", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 11, color: "#6B6762", lineHeight: 1.6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Your reservation is confirmed once Invegate verifies the payment. You will receive a confirmation within 24 hours.
        </div>

        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(91,155,213,0.12)", border: "0.5px solid rgba(91,155,213,0.35)", color: "#5B9BD5", borderRadius: 10, padding: "13px", textDecoration: "none", fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5B9BD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Send confirmation screenshot on WhatsApp
        </a>

        <button onClick={() => setStep("idle")} style={{ width: "100%", background: "transparent", border: "none", color: "#6B6762", fontSize: 12, cursor: "pointer", padding: "8px", fontFamily: "Inter, Arial, sans-serif" }}>
          ← Back to project
        </button>
      </div>
    );
  }
}
```
