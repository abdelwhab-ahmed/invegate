from __future__ import annotations

import html
import re
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output"
PDF_DIR = OUTPUT_DIR / "pdf"
MD_PATH = OUTPUT_DIR / "INVEGATE_COMPLETE_PROJECT_HANDOFF.md"
PDF_PATH = PDF_DIR / "INVEGATE_COMPLETE_PROJECT_HANDOFF.pdf"

GENERATED_ON = date(2026, 8, 6).strftime("%B %-d, %Y") if False else "August 6, 2026"

SOURCE_FILES = [
    "package.json",
    "next.config.mjs",
    "jsconfig.json",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "src/lib/supabase.js",
    "src/lib/supabaseServer.js",
    "src/app/layout.js",
    "src/app/globals.css",
    "src/app/page.js",
    "src/app/location/[id]/page.js",
    "src/app/land/[id]/page.js",
    "src/app/admin/layout.js",
    "src/app/admin/middleware.js",
    "src/app/admin/page.js",
    "src/app/admin/login/page.js",
    "src/app/admin/locations/page.js",
    "src/app/admin/lands/page.js",
    "src/app/admin/developers/page.js",
    "src/app/admin/reservations/page.js",
    "src/app/components/SplashScreen.js",
    "src/app/components/LocationSearch.js",
    "src/app/components/LocationCard.js",
    "src/app/components/ProjectCard.js",
    "src/app/components/PhotoGallery.js",
    "src/app/components/ProjectDetails.js",
    "src/app/components/ReserveButton.js",
]


JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")


def redact_sensitive(text: str) -> tuple[str, bool]:
    redacted = JWT_RE.sub("<SUPABASE_ANON_KEY_REDACTED>", text)
    return redacted, redacted != text


def file_line_count(path: Path) -> int:
    if not path.exists():
        return 0
    return len(read_text(path).splitlines())


def register_fonts() -> dict[str, str]:
    font_candidates = {
        "Body": [
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/segoeui.ttf"),
        ],
        "BodyBold": [
            Path("C:/Windows/Fonts/arialbd.ttf"),
            Path("C:/Windows/Fonts/segoeuib.ttf"),
        ],
        "Code": [
            Path("C:/Windows/Fonts/consola.ttf"),
            Path("C:/Windows/Fonts/cour.ttf"),
        ],
        "CodeBold": [
            Path("C:/Windows/Fonts/consolab.ttf"),
            Path("C:/Windows/Fonts/courbd.ttf"),
        ],
    }
    registered = {}
    fallbacks = {
        "Body": "Helvetica",
        "BodyBold": "Helvetica-Bold",
        "Code": "Courier",
        "CodeBold": "Courier-Bold",
    }
    for name, candidates in font_candidates.items():
        for candidate in candidates:
            if candidate.exists():
                pdfmetrics.registerFont(TTFont(name, str(candidate)))
                registered[name] = name
                break
        else:
            registered[name] = fallbacks[name]
    return registered


FONTS = register_fonts()


class CodeLine(Flowable):
    def __init__(self, text: str, font_name: str, font_size: float = 6.1, leading: float = 8.2):
        super().__init__()
        self.text = text
        self.font_name = font_name
        self.font_size = font_size
        self.leading = leading
        self.width = 0
        self.height = leading

    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        return avail_width, self.leading

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.HexColor("#F7F5EF"))
        c.rect(0, 0, self.width, self.leading, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#222224"))
        c.setFont(self.font_name, self.font_size)
        c.drawString(4, 2.1, self.text)
        c.restoreState()


class Doc:
    def __init__(self):
        self.md: list[str] = []
        self.story: list = []
        self.max_code_width = 7.25 * inch

        self.styles = {
            "title": ParagraphStyle(
                "title",
                fontName=FONTS["BodyBold"],
                fontSize=24,
                leading=29,
                textColor=colors.HexColor("#C9973A"),
                alignment=TA_CENTER,
                spaceAfter=8,
            ),
            "subtitle": ParagraphStyle(
                "subtitle",
                fontName=FONTS["Body"],
                fontSize=9.5,
                leading=13,
                textColor=colors.HexColor("#444444"),
                alignment=TA_CENTER,
                spaceAfter=14,
            ),
            "h1": ParagraphStyle(
                "h1",
                fontName=FONTS["BodyBold"],
                fontSize=16,
                leading=20,
                textColor=colors.HexColor("#2C2C2E"),
                spaceBefore=16,
                spaceAfter=8,
            ),
            "h2": ParagraphStyle(
                "h2",
                fontName=FONTS["BodyBold"],
                fontSize=12.5,
                leading=16,
                textColor=colors.HexColor("#C9973A"),
                spaceBefore=10,
                spaceAfter=5,
            ),
            "h3": ParagraphStyle(
                "h3",
                fontName=FONTS["BodyBold"],
                fontSize=10.5,
                leading=13,
                textColor=colors.HexColor("#2C2C2E"),
                spaceBefore=8,
                spaceAfter=4,
            ),
            "body": ParagraphStyle(
                "body",
                fontName=FONTS["Body"],
                fontSize=8.8,
                leading=12.2,
                textColor=colors.HexColor("#222224"),
                spaceAfter=5,
            ),
            "bullet": ParagraphStyle(
                "bullet",
                fontName=FONTS["Body"],
                fontSize=8.6,
                leading=11.8,
                textColor=colors.HexColor("#222224"),
                leftIndent=14,
                firstLineIndent=-8,
                spaceAfter=3,
            ),
            "small": ParagraphStyle(
                "small",
                fontName=FONTS["Body"],
                fontSize=7.7,
                leading=10,
                textColor=colors.HexColor("#555555"),
                spaceAfter=4,
            ),
            "table_header": ParagraphStyle(
                "table_header",
                fontName=FONTS["BodyBold"],
                fontSize=7.7,
                leading=10,
                textColor=colors.HexColor("#F0EDE6"),
                spaceAfter=4,
            ),
        }

    def para_text(self, text: str) -> str:
        return html.escape(text).replace("\n", "<br/>")

    def title(self, title: str, subtitle: str):
        self.md.append(f"# {title}")
        self.md.append(f"> {subtitle}")
        self.md.append("")
        self.story.append(Paragraph(self.para_text(title), self.styles["title"]))
        self.story.append(Paragraph(self.para_text(subtitle), self.styles["subtitle"]))

    def h1(self, text: str):
        self.md.append(f"## {text}")
        self.md.append("")
        self.story.append(Paragraph(self.para_text(text), self.styles["h1"]))

    def h2(self, text: str):
        self.md.append(f"### {text}")
        self.md.append("")
        self.story.append(Paragraph(self.para_text(text), self.styles["h2"]))

    def h3(self, text: str):
        self.md.append(f"#### {text}")
        self.md.append("")
        self.story.append(Paragraph(self.para_text(text), self.styles["h3"]))

    def p(self, text: str):
        self.md.append(text)
        self.md.append("")
        self.story.append(Paragraph(self.para_text(text), self.styles["body"]))

    def note(self, text: str):
        self.md.append(f"> {text}")
        self.md.append("")
        self.story.append(Paragraph(self.para_text("Note: " + text), self.styles["small"]))

    def bullets(self, items: list[str]):
        for item in items:
            self.md.append(f"- {item}")
            self.story.append(Paragraph(self.para_text("- " + item), self.styles["bullet"]))
        self.md.append("")
        self.story.append(Spacer(1, 4))

    def table(self, headers: list[str], rows: list[list[str]]):
        self.md.append("| " + " | ".join(headers) + " |")
        self.md.append("| " + " | ".join("---" for _ in headers) + " |")
        for row in rows:
            self.md.append("| " + " | ".join(str(cell).replace("\n", "<br>") for cell in row) + " |")
        self.md.append("")

        data = [[Paragraph(self.para_text(cell), self.styles["table_header"]) for cell in headers]]
        for row in rows:
            data.append([Paragraph(self.para_text(str(cell)), self.styles["small"]) for cell in row])

        table = Table(data, repeatRows=1, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C2C2E")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#F0EDE6")),
                    ("FONTNAME", (0, 0), (-1, 0), FONTS["BodyBold"]),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FBFAF7")),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#DDD2BE")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        self.story.append(table)
        self.story.append(Spacer(1, 7))

    def page_break(self):
        self.story.append(PageBreak())

    def code_visual_lines(self, line: str, prefix: str) -> list[str]:
        normalized = line.replace("\t", "  ").replace("\x00", "")
        pieces: list[str] = []
        current = prefix
        for char in normalized:
            candidate = current + char
            if pdfmetrics.stringWidth(candidate, FONTS["Code"], 6.1) <= self.max_code_width:
                current = candidate
            else:
                pieces.append(current)
                current = "     | " + char
        pieces.append(current)
        return pieces

    def code_file(self, rel_path: str, text: str, redacted: bool):
        line_count = len(text.splitlines())
        redaction_note = " One sensitive token is redacted in this documentation copy." if redacted else ""

        self.md.append(f"#### `{rel_path}`")
        self.md.append("")
        self.md.append(f"Lines: {line_count}.{redaction_note}")
        self.md.append("")
        self.md.append("```")
        self.md.extend(text.splitlines())
        self.md.append("```")
        self.md.append("")

        self.story.append(Paragraph(self.para_text(rel_path), self.styles["h3"]))
        self.story.append(Paragraph(self.para_text(f"Lines: {line_count}.{redaction_note}"), self.styles["small"]))
        self.story.append(Spacer(1, 2))
        for index, line in enumerate(text.splitlines(), start=1):
            prefix = f"{index:04d} | "
            for visual in self.code_visual_lines(line, prefix):
                self.story.append(CodeLine(visual, FONTS["Code"]))
        self.story.append(Spacer(1, 8))


def build_doc() -> Doc:
    doc = Doc()

    doc.title(
        "INVEGATE Complete Project Handoff",
        f"Last updated: {GENERATED_ON}. A single source of truth for understanding, maintaining, and extending this web app.",
    )
    doc.note(
        "This documentation is generated from the current workspace at "
        "C:/Users/Ahmed/OneDrive/bis/land-platform-optimized-before-admin. "
        "The source appendix includes every app page, component, library module, and key config file. "
        "The hard-coded Supabase anon key found in ReserveButton.js is intentionally redacted in the documentation copy."
    )

    doc.h1("1. What Is Invegate?")
    doc.p(
        "Invegate is a luxury Egyptian land real estate platform for browsing curated land projects, "
        "viewing location and project details, contacting Invegate on WhatsApp, and submitting reservation requests. "
        "The business team manages locations, developers, land projects, gallery images, installment options, and buyer reservations through a custom admin panel."
    )
    doc.bullets(
        [
            "Public users browse from the home page to a location page, then to a project detail page.",
            "Project details include gallery photos, status, price per square meter, total project area, selectable area options, installment plans, exact map link, developer information, WhatsApp contact, and reservation flow.",
            "Reservations collect buyer name, phone, national ID front/back uploads, selected land area, selected installment plan, and a pending status before manual payment verification.",
            "Admins can create, edit, and delete locations, developers, projects, images, area options, installment plans, price-grid values, and reservations.",
        ]
    )

    doc.h1("2. Tech Stack")
    doc.table(
        ["Layer", "Technology / Detail"],
        [
            ["Framework", "Next.js 16.2.9 with App Router in src/app"],
            ["React", "React 19.2.4 and react-dom 19.2.4"],
            ["Language", "JavaScript, no TypeScript source files"],
            ["Database", "Supabase PostgreSQL"],
            ["Auth", "Supabase Auth email/password for admin login"],
            ["Storage", "Supabase Storage buckets for locations, developers, land photos, and reservation ID files"],
            ["Styling", "Mostly inline React styles plus src/app/globals.css and Tailwind v4 import"],
            ["Fonts", "Cormorant Garamond for headings and Manrope for body via next/font/google"],
            ["Payments", "Manual InstaPay/payment confirmation flow; no payment gateway API in code"],
            ["Maps", "External location_url links; no embedded map component"],
        ],
    )

    doc.h1("3. Architecture")
    doc.h2("High Level Flow")
    doc.bullets(
        [
            "Server components fetch public Supabase data for home, location, project detail, and admin dashboard routes.",
            "Client components handle search, hover states, splash animation, gallery interaction, CRUD forms, uploads, reservation submission, and admin logout.",
            "The public Supabase client in src/lib/supabase.js uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
            "The admin dashboard uses createSupabaseServerClient in src/lib/supabaseServer.js to read authenticated server-side data using cookies.",
            "Most admin CRUD screens instantiate Supabase directly in client components and depend on Supabase Auth plus RLS policies for protection.",
        ]
    )
    doc.h2("Route Map")
    doc.table(
        ["Route", "File", "Purpose", "Main Data"],
        [
            ["/", "src/app/page.js", "Home page with hero, counts, search, and location cards", "locations, lands, developers"],
            ["/location/[id]", "src/app/location/[id]/page.js", "Shows one location and its projects", "locations, lands, developers"],
            ["/land/[id]", "src/app/land/[id]/page.js", "Shows project gallery, details, options, contact, and reserve flow", "lands, locations, developers, land_images, land_areas, installment plans, price rows"],
            ["/admin/login", "src/app/admin/login/page.js", "Admin email/password sign-in", "Supabase Auth"],
            ["/admin", "src/app/admin/page.js", "Admin dashboard stats and recent activity", "locations, lands, developers, reservations"],
            ["/admin/locations", "src/app/admin/locations/page.js", "Location CRUD and cover upload", "locations, location-images bucket"],
            ["/admin/lands", "src/app/admin/lands/page.js", "Project CRUD, gallery upload, thumbnail, area options, installment plans, price grid", "lands, land_images, land_areas, land_installment_plans, land_area_plan_prices"],
            ["/admin/developers", "src/app/admin/developers/page.js", "Developer CRUD and logo upload", "developers, developer-logos bucket"],
            ["/admin/reservations", "src/app/admin/reservations/page.js", "Reservation review, signed ID URLs, status updates, deletion", "reservations, lands, locations, land_areas, installment plans, reservations bucket"],
        ],
    )

    doc.h1("4. User Workflows")
    doc.h2("Buyer Discovery Flow")
    doc.bullets(
        [
            "The root layout wraps every page in SplashScreen, so first load shows a brief Invegate logo splash.",
            "Home fetches location cards and counts available projects per location.",
            "LocationSearch filters locations by name on the client.",
            "A location page fetches location details, all lands in that location, and developer names for cards.",
            "Project cards link to /land/[id], where the project page fetches gallery images, developer, location, area options, installment plans, and total prices.",
            "ProjectDetails requires the buyer to choose an available area and an installment plan before ReserveButton is enabled.",
            "The WhatsApp button opens wa.me with a pre-filled interest message.",
        ]
    )
    doc.h2("Reservation Flow")
    doc.bullets(
        [
            "ReserveButton starts disabled until selectedArea and selectedPlan are both present.",
            "The form collects buyer name, phone, optional national ID front image, and optional national ID back image.",
            "ID files upload to the private reservations storage bucket under {landId}/{timestamp}_front/back_{filename}.",
            "A row is inserted into reservations with land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, and status pending.",
            "After the database insert succeeds, the UI switches to a payment instruction step. Payment verification is manual and handled later by admin status updates.",
        ]
    )
    doc.h2("Admin Flow")
    doc.bullets(
        [
            "AdminLoginPage signs in with Supabase Auth and redirects to /admin.",
            "AdminLayout provides desktop sidebar navigation, mobile bottom navigation, and sign-out.",
            "AdminDashboard shows counts, recent pending reservations, and recent projects.",
            "Locations and developers are simple CRUD pages with public storage uploads for images/logos.",
            "Projects include basic fields, multiple gallery images, a thumbnail, area options, installment plans, and an exact price grid for every area-plan pair.",
            "Reservations can be filtered by all, pending, confirmed, or rejected; selecting one shows buyer/project/details plus signed private ID photo URLs for one hour.",
        ]
    )

    doc.h1("5. Design System")
    doc.table(
        ["Token", "Value", "Usage"],
        [
            ["Gold", "#C9973A", "Primary brand accent, borders, buttons, links"],
            ["Gold Light", "#E8C97A", "Highlighted price/status text"],
            ["Charcoal Background", "#2C2C2E", "Main app background"],
            ["Charcoal Card", "#343437", "Cards, panels, form surfaces"],
            ["Charcoal Inset", "#3A3A3D", "Inputs and nested controls"],
            ["Text Primary", "#F0EDE6", "Main copy and headings"],
            ["Text Secondary", "#9A9489", "Descriptions and helper text"],
            ["Text Muted", "#6B6762", "Labels, placeholders, metadata"],
            ["Available", "#4DC98A", "Available status"],
            ["Reserved", "#E8C97A", "Reserved status"],
            ["Sold / Rejected", "#E07070", "Sold or rejected status"],
        ],
    )
    doc.bullets(
        [
            "Headings use the Cormorant Garamond font variable where available; many admin pages still hard-code Georgia, serif.",
            "Body text uses Manrope globally, while several older page snippets still specify Inter, Arial, sans-serif inline.",
            "Cards use dark surfaces, thin gold borders, subtle hover lifts, and restrained rounded corners.",
            "Admin layouts are responsive through inline media-query style tags in AdminLayout.",
            "Most visual behavior lives directly inside component files rather than a shared component library.",
        ]
    )

    doc.h1("6. Data Model")
    doc.note("The schema below is inferred from the current application code and previous documentation. Confirm exact constraints in Supabase before migrations or production deployment.")
    doc.table(
        ["Table", "Columns Used By App", "Purpose"],
        [
            ["locations", "id, name, description, image_url, created_at", "Public browsing locations and admin-managed location covers"],
            ["developers", "id, name, bio, logo_url", "Developer profile shown on projects and managed by admin"],
            ["lands", "id, location_id, developer_id, title, price, area_sqm, price_per_meter, status, description, location_url, contact_whatsapp, contact_phone, image_url, created_at", "Core project/listing record"],
            ["land_images", "id, land_id, image_url", "Gallery images for a project"],
            ["land_areas", "id, land_id, area_sqm, status, created_at", "Selectable buyer plot sizes with availability per size"],
            ["land_installment_plans", "id, land_id, label, down_payment_percent, years, created_at", "Selectable payment plans per project"],
            ["land_area_plan_prices", "land_area_id, installment_plan_id, total_price", "Exact price for one area-plan combination; upsert expects unique land_area_id + installment_plan_id"],
            ["reservations", "id, land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, status, created_at", "Buyer reservation records and private ID file paths"],
        ],
    )
    doc.h2("Storage Buckets")
    doc.table(
        ["Bucket", "Access", "Used In", "Purpose / Path Pattern"],
        [
            ["location-images", "Public", "Admin locations", "{timestamp}_{random}.{ext}; public URL saved to locations.image_url"],
            ["developer-logos", "Public", "Admin developers", "{timestamp}_{random}.{ext}; public URL saved to developers.logo_url"],
            ["land-images", "Public", "Admin lands", "lands/{landId}/{timestamp}_{random}.{ext}; public URL saved to land_images and lands.image_url thumbnail"],
            ["reservations", "Private", "ReserveButton and Admin reservations", "{landId}/{timestamp}_front/back_{filename}; path saved in reservations and viewed through signed URLs"],
        ],
    )

    doc.h1("7. Configuration And Environment")
    doc.bullets(
        [
            "Required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
            "jsconfig.json maps @/* to ./src/*.",
            "next.config.mjs allows remote images from any HTTPS hostname using images.remotePatterns hostname **.",
            "next.config.mjs enables reactStrictMode and disables the powered-by header.",
            "The current code references /logo.png in SplashScreen and Home, but public/logo.png is not present in this workspace. The visible public asset is public/envegate_logo-removebg-preview.png.",
            "The admin middleware code is located at src/app/admin/middleware.js. Next.js middleware is normally discovered from middleware.js at the project root or src/middleware.js, so this file may not protect admin routes until moved or confirmed in the deployed runtime.",
        ]
    )

    doc.h1("8. Supabase And RLS Expectations")
    doc.bullets(
        [
            "Public read access is needed for locations, lands, developers, land_images, land_areas, land_installment_plans, and land_area_plan_prices.",
            "Public reservation insert access is needed if unauthenticated buyers can reserve, but it should be limited to expected columns and should force status to pending.",
            "Reservation ID files should remain private; buyers upload, admins generate signed read URLs.",
            "Admin writes for locations, developers, lands, images, areas, plans, prices, and reservations should require authenticated Supabase users.",
            "Because most admin screens use a browser-side Supabase anon client, RLS is the true security boundary. The app must not rely on hidden routes alone.",
        ]
    )

    doc.h1("9. Page And Component Responsibilities")
    doc.table(
        ["File", "Responsibility"],
        [
            ["src/app/layout.js", "Loads global CSS, Google fonts, metadata, and wraps app with SplashScreen."],
            ["src/app/page.js", "Home page: fetches locations, lands, developers; computes counts; renders hero and LocationSearch."],
            ["src/app/location/[id]/page.js", "Location details page: fetches one location, projects, developers; renders ProjectCard list."],
            ["src/app/land/[id]/page.js", "Project detail page: fetches land, developer, images, location, area options, installment plans, prices; renders PhotoGallery and ProjectDetails."],
            ["src/app/admin/layout.js", "Client admin shell: desktop sidebar, mobile top/bottom navigation, logout, active-route states."],
            ["src/app/admin/page.js", "Server admin dashboard: counts, pending reservations, recent projects."],
            ["src/app/admin/login/page.js", "Client login screen with Supabase Auth signInWithPassword."],
            ["src/app/admin/locations/page.js", "Client CRUD for locations and location cover uploads."],
            ["src/app/admin/lands/page.js", "Client CRUD for projects, images, thumbnails, area options, installment plans, and price grid."],
            ["src/app/admin/developers/page.js", "Client CRUD for developers and logo uploads."],
            ["src/app/admin/reservations/page.js", "Client reservation inbox, status controls, signed ID previews, and deletion."],
            ["SplashScreen.js", "Timed startup overlay with logo and fade-out phases."],
            ["LocationSearch.js", "Client search over locations and filtered card grid."],
            ["LocationCard.js", "Clickable location card with image fallback and project count."],
            ["ProjectCard.js", "Clickable project card with thumbnail, status, developer, and price-per-meter display."],
            ["PhotoGallery.js", "Responsive project gallery: mobile scroll-snap carousel and desktop main image with side peeks and thumbnails."],
            ["ProjectDetails.js", "Project summary, area/plan selection modals, map link, developer block, WhatsApp, and ReserveButton integration."],
            ["ReserveButton.js", "Buyer reservation form, ID upload, reservation insert, and payment instruction step."],
        ],
    )

    doc.h1("10. Local Development")
    doc.bullets(
        [
            "Install dependencies with npm install if node_modules is missing.",
            "Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
            "Run npm run dev and open http://localhost:3000.",
            "Use /admin/login for the admin panel after creating a Supabase Auth user.",
            "Run npm run build before deployment.",
            "Run npm run lint and fix lint errors before treating the project as clean.",
        ]
    )

    doc.h1("11. Verification Snapshot")
    doc.table(
        ["Check", "Result", "Details"],
        [
            ["Production build", "Passed", "npm.cmd run build completed successfully on August 6, 2026."],
            ["Generated routes", "10 app routes", "/, /admin, /admin/developers, /admin/lands, /admin/locations, /admin/login, /admin/reservations, /land/[id], /location/[id], /_not-found"],
            ["Lint", "Failed", "npm.cmd run lint reported 6 errors and 12 warnings."],
            ["Main lint errors", "React hook/lint rules", "set-state-in-effect in admin developers/lands/locations, immutability warning for fetchReservations declaration order, unescaped quotes in admin lands."],
            ["Main lint warnings", "Image optimization", "Several admin/gallery files use raw img tags instead of next/image."],
        ],
    )

    doc.h1("12. Important Implementation Notes")
    doc.bullets(
        [
            "Security: ReserveButton.js currently hard-codes the Supabase project URL and anon key. Move this to environment variables for consistency and reduce accidental sharing.",
            "Security: Admin protection depends on middleware placement and Supabase RLS. Verify middleware is actually discovered in the deployed app.",
            "Assets: Home and SplashScreen reference /logo.png, but that file is missing from public in this workspace.",
            "Storage cleanup: deleting land images/projects removes database rows but does not remove public storage objects from land-images. Reservation deletion does remove ID files.",
            "Data integrity: land_area_plan_prices relies on an onConflict unique key across land_area_id and installment_plan_id.",
            "Payment: the app records reservation details before payment verification. Admin confirmation is manual.",
            "Performance: next.config.mjs permits images from any HTTPS host, which is flexible but broad.",
            "Maintainability: inline styles dominate the codebase; extracting repeated admin styles/components would reduce future churn, but this document records the current implementation as-is.",
        ]
    )

    doc.h1("13. Full Source Code Appendix")
    doc.note(
        "This appendix includes the application code required to understand the current app. "
        "Long lines wrap visually in the PDF; the Markdown file preserves the source line breaks. "
        "The package-lock file is intentionally excluded because it is generated dependency metadata, not page/app code."
    )
    for rel in SOURCE_FILES:
        path = ROOT / rel
        if not path.exists():
            doc.h3(rel)
            doc.p("Missing from this workspace.")
            continue
        text, redacted = redact_sensitive(read_text(path))
        doc.code_file(rel, text, redacted)

    return doc


def write_pdf(story):
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont(FONTS["Body"], 7)
        canvas.setFillColor(colors.HexColor("#777777"))
        canvas.drawString(doc.leftMargin, 0.35 * inch, "Invegate Complete Project Handoff")
        canvas.drawRightString(A4[0] - doc.rightMargin, 0.35 * inch, f"Page {doc.page}")
        canvas.restoreState()

    pdf = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=0.42 * inch,
        leftMargin=0.42 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.55 * inch,
        title="INVEGATE Complete Project Handoff",
        author="Codex",
    )
    pdf.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    doc = build_doc()
    MD_PATH.write_text("\n".join(doc.md), encoding="utf-8")
    write_pdf(doc.story)
    print(f"Wrote {MD_PATH}")
    print(f"Wrote {PDF_PATH}")


if __name__ == "__main__":
    main()
