from __future__ import annotations

import html
import os
import re
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


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PDF = ROOT / "output" / "pdf" / "INVEGATE_UPDATED_PROJECT_HANDOFF_2026-08-21.pdf"

SOURCE_FILES = [
    ".gitignore",
    "README.md",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "jsconfig.json",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "src/middleware.js",
    "src/lib/supabase.js",
    "src/lib/supabaseBrowser.js",
    "src/lib/supabaseServer.js",
    "src/app/layout.js",
    "src/app/globals.css",
    "src/app/page.js",
    "src/app/location/[id]/page.js",
    "src/app/land/[id]/page.js",
    "src/app/admin/layout.js",
    "src/app/admin/page.js",
    "src/app/admin/login/page.js",
    "src/app/admin/locations/page.js",
    "src/app/admin/lands/page.js",
    "src/app/admin/developers/page.js",
    "src/app/admin/reservations/page.js",
    "src/app/admin/office-reservations/page.js",
    "src/app/admin/office-hours/page.js",
    "src/app/components/SplashScreen.js",
    "src/app/components/LocationSearch.js",
    "src/app/components/LocationCard.js",
    "src/app/components/ProjectCard.js",
    "src/app/components/PhotoGallery.js",
    "src/app/components/ProjectDetails.js",
    "src/app/components/UnitPickerCard.js",
    "src/app/components/ReserveButton.js",
    "src/app/components/MeetingRequestForm.js",
]

JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")

UNICODE_MAP = {
    "\ufeff": "",
    "\u00a0": " ",
    "\u00b2": "2",
    "\u2010": "-",
    "\u2011": "-",
    "\u2012": "-",
    "\u2013": "-",
    "\u2014": "-",
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2026": "...",
    "\u00d7": "x",
    "\u2190": "<-",
    "\u2192": "->",
    "\u00b7": " - ",
    "\u2713": "check",
    "\u2605": "*",
    "\u229e": "[dashboard]",
    "\u238b": "[logout]",
    "\U0001f4cd": "[location]",
    "\U0001f3d7": "[project]",
    "\U0001f3e2": "[developer]",
    "\U0001f4cb": "[reservations]",
    "\U0001f5d3": "[calendar]",
    "\U0001f4f8": "[camera]",
    "\U0001f5fa": "[map]",
    "\ufe0f": "",
}


def ascii_safe(text: str) -> str:
    for old, new in UNICODE_MAP.items():
        text = text.replace(old, new)
    return text.encode("ascii", errors="replace").decode("ascii").replace("?", "")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")


def redact_sensitive(text: str) -> tuple[str, bool]:
    redacted = JWT_RE.sub("<SUPABASE_ANON_KEY_REDACTED>", text)
    return redacted, redacted != text


def register_fonts() -> dict[str, str]:
    candidates = {
        "Body": [
            Path("C:/Windows/Fonts/segoeui.ttf"),
            Path("C:/Windows/Fonts/arial.ttf"),
        ],
        "BodyBold": [
            Path("C:/Windows/Fonts/segoeuib.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
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
    fallbacks = {
        "Body": "Helvetica",
        "BodyBold": "Helvetica-Bold",
        "Code": "Courier",
        "CodeBold": "Courier-Bold",
    }
    registered = {}
    for name, paths in candidates.items():
        for path in paths:
            if path.exists():
                pdfmetrics.registerFont(TTFont(name, str(path)))
                registered[name] = name
                break
        else:
            registered[name] = fallbacks[name]
    return registered


FONTS = register_fonts()


class CodeLine(Flowable):
    def __init__(self, text: str, font_name: str, font_size: float = 5.8, leading: float = 7.7):
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
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#FBFAF7"))
        canvas.rect(0, 0, self.width, self.leading, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#222224"))
        canvas.setFont(self.font_name, self.font_size)
        canvas.drawString(4, 2.0, self.text)
        canvas.restoreState()


class HandoffDoc:
    def __init__(self):
        self.story: list = []
        self.page_width = A4[0] - (0.42 * inch * 2)
        self.max_code_width = self.page_width
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
                fontSize=9.6,
                leading=13,
                textColor=colors.HexColor("#4A4742"),
                alignment=TA_CENTER,
                spaceAfter=14,
            ),
            "h1": ParagraphStyle(
                "h1",
                fontName=FONTS["BodyBold"],
                fontSize=15.5,
                leading=19,
                textColor=colors.HexColor("#2C2C2E"),
                spaceBefore=15,
                spaceAfter=8,
            ),
            "h2": ParagraphStyle(
                "h2",
                fontName=FONTS["BodyBold"],
                fontSize=11.8,
                leading=15,
                textColor=colors.HexColor("#C9973A"),
                spaceBefore=9,
                spaceAfter=5,
            ),
            "h3": ParagraphStyle(
                "h3",
                fontName=FONTS["BodyBold"],
                fontSize=9.8,
                leading=12,
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
                fontSize=8.5,
                leading=11.8,
                textColor=colors.HexColor("#222224"),
                leftIndent=13,
                firstLineIndent=-7,
                spaceAfter=3,
            ),
            "small": ParagraphStyle(
                "small",
                fontName=FONTS["Body"],
                fontSize=7.6,
                leading=10,
                textColor=colors.HexColor("#555555"),
                spaceAfter=4,
            ),
            "table_header": ParagraphStyle(
                "table_header",
                fontName=FONTS["BodyBold"],
                fontSize=7.5,
                leading=9.5,
                textColor=colors.HexColor("#F0EDE6"),
            ),
        }

    def clean(self, text: str) -> str:
        return html.escape(ascii_safe(str(text))).replace("\n", "<br/>")

    def title(self, title: str, subtitle: str):
        self.story.append(Paragraph(self.clean(title), self.styles["title"]))
        self.story.append(Paragraph(self.clean(subtitle), self.styles["subtitle"]))

    def h1(self, text: str):
        self.story.append(Paragraph(self.clean(text), self.styles["h1"]))

    def h2(self, text: str):
        self.story.append(Paragraph(self.clean(text), self.styles["h2"]))

    def h3(self, text: str):
        self.story.append(Paragraph(self.clean(text), self.styles["h3"]))

    def p(self, text: str):
        self.story.append(Paragraph(self.clean(text), self.styles["body"]))

    def note(self, text: str):
        self.story.append(Paragraph(self.clean("Note: " + text), self.styles["small"]))

    def bullets(self, items: list[str]):
        for item in items:
            self.story.append(Paragraph(self.clean("- " + item), self.styles["bullet"]))
        self.story.append(Spacer(1, 4))

    def table(self, headers: list[str], rows: list[list[str]], widths: list[float] | None = None):
        if widths is None:
            widths = [1.0 for _ in headers]
        total = sum(widths)
        col_widths = [self.page_width * (w / total) for w in widths]

        data = [[Paragraph(self.clean(cell), self.styles["table_header"]) for cell in headers]]
        for row in rows:
            data.append([Paragraph(self.clean(cell), self.styles["small"]) for cell in row])

        table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C2C2E")),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FBFAF7")),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#DDD2BE")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
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
        normalized = ascii_safe(line).replace("\t", "  ").replace("\x00", "")
        pieces: list[str] = []
        current = prefix
        for char in normalized:
            candidate = current + char
            if pdfmetrics.stringWidth(candidate, FONTS["Code"], 5.8) <= self.max_code_width:
                current = candidate
            else:
                pieces.append(current)
                current = "     | " + char
        pieces.append(current)
        return pieces

    def code_file(self, rel_path: str, text: str, redacted: bool):
        line_count = len(text.splitlines())
        suffix = " Sensitive JWT-like token redacted." if redacted else ""
        self.h3(rel_path)
        self.story.append(Paragraph(self.clean(f"Lines: {line_count}.{suffix}"), self.styles["small"]))
        self.story.append(Spacer(1, 2))
        for index, line in enumerate(text.splitlines(), start=1):
            prefix = f"{index:04d} | "
            for visual in self.code_visual_lines(line, prefix):
                self.story.append(CodeLine(visual, FONTS["Code"]))
        self.story.append(Spacer(1, 8))


def source_line_rows() -> list[list[str]]:
    rows = []
    for rel in SOURCE_FILES:
        path = ROOT / rel
        if path.exists():
            rows.append([rel, str(len(read_text(path).splitlines())), "Included"])
        else:
            rows.append([rel, "0", "Missing"])
    return rows


def build_doc() -> HandoffDoc:
    doc = HandoffDoc()
    doc.title(
        "INVEGATE Updated Project Handoff",
        "Generated August 21, 2026 from the current workspace. Attached prior handoff was used as reference material, not as instructions.",
    )
    doc.note(
        "This PDF documents the codebase at C:/Users/Ahmed/Documents/GitHub/invegate. "
        "Database schema details are inferred from the source code and the attached reference handoff; confirm exact constraints and RLS policies in Supabase before production changes."
    )

    doc.h1("1. What Invegate Is")
    doc.p(
        "Invegate is a luxury Egyptian land real estate platform. Buyers browse curated locations and land projects, view project details, contact the developer or Invegate through WhatsApp, request office meetings, and submit reservation requests that move into a manual down-payment verification flow."
    )
    doc.bullets(
        [
            "Public path: home page -> location page -> project detail page.",
            "Buyer-facing project details show gallery images, status, project area, price per square meter, exact map link, developer profile, area/unit selection, installment-plan selection, reservation, down-payment instructions, and meeting requests.",
            "Admin path: email/password login -> dashboard -> CRUD for locations, developers, projects, reservations, office reservations, and office working hours.",
            "The business model is manual and concierge-style: no payment gateway exists in code; reservations and meetings are reviewed by admins.",
        ]
    )

    doc.h1("2. Current Tech Stack")
    doc.table(
        ["Layer", "Current implementation"],
        [
            ["Framework", "Next.js 16.2.9 App Router under src/app"],
            ["React", "React 19.2.4 and react-dom 19.2.4"],
            ["Language", "JavaScript only; no TypeScript source files"],
            ["Database/Auth/Storage", "Supabase PostgreSQL, Supabase Auth, and Supabase Storage"],
            ["Supabase packages", "@supabase/supabase-js 2.108.2 and @supabase/ssr 0.12.0"],
            ["Styling", "Mostly inline styles, global CSS variables, and Tailwind v4 import"],
            ["Fonts", "Cormorant Garamond and Manrope via next/font/google; older/admin files often hard-code Georgia or Inter"],
            ["Images", "next/image where used; next.config.mjs permits HTTPS images from any hostname"],
            ["Payments", "Manual bank/InstaPay/WhatsApp confirmation; no external payment API"],
            ["Maps", "External location_url links only; no embedded map SDK"],
        ],
        widths=[1, 2.7],
    )
    doc.bullets(
        [
            "package.json scripts: npm run dev, npm run build, npm run start, npm run lint.",
            "next.config.mjs has reactStrictMode: true, poweredByHeader: false, images.remotePatterns hostname '**', and allowedDevOrigins: ['192.168.100.4'].",
            "jsconfig.json maps @/* to ./src/*.",
            "Required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        ]
    )

    doc.h1("3. Architecture")
    doc.h2("Supabase Client Pattern")
    doc.bullets(
        [
            "src/lib/supabase.js exports a plain @supabase/supabase-js client for server/public data fetches and throws if env vars are missing.",
            "src/lib/supabaseBrowser.js exports a singleton createBrowserClient from @supabase/ssr. Admin login/layout use this so browser auth sessions are cookie-compatible with middleware/server components.",
            "src/lib/supabaseServer.js exports createSupabaseServerClient(), using Next cookies() and @supabase/ssr createServerClient for authenticated server components.",
            "Several admin pages and buyer components still instantiate createClient directly in client components. RLS is therefore the real security boundary.",
            "src/app/components/ReserveButton.js is the major outlier: it hard-codes the Supabase URL and anon key. The JWT-like anon key is redacted in this PDF appendix.",
        ]
    )
    doc.h2("Authentication And Route Protection")
    doc.bullets(
        [
            "src/middleware.js protects /admin/:path* and redirects unauthenticated users to /admin/login.",
            "The middleware intentionally skips routes outside /admin and skips /admin/login.",
            "AdminLoginPage signs in with supabase.auth.signInWithPassword(), then pushes to /admin and refreshes the router.",
            "AdminLayout handles sign-out through supabase.auth.signOut() and pushes back to /admin/login.",
        ]
    )
    doc.h2("Current Route Map")
    doc.table(
        ["Route", "File", "Purpose", "Main data"],
        [
            ["/", "src/app/page.js", "Home hero, stats, location search/cards", "locations, lands, developers"],
            ["/location/[id]", "src/app/location/[id]/page.js", "One location and its projects", "locations, lands, developers"],
            ["/land/[id]", "src/app/land/[id]/page.js", "Project detail, galleries, unit/plan selection, reservation, meeting request", "lands, developers, locations, land_images, land_areas, plans, prices, office_schedule"],
            ["/admin/login", "src/app/admin/login/page.js", "Admin sign-in", "Supabase Auth"],
            ["/admin", "src/app/admin/page.js", "Dashboard stats, pending reservations, recent projects, link to office hours", "locations, lands, developers, reservations"],
            ["/admin/locations", "src/app/admin/locations/page.js", "Location CRUD and cover upload", "locations, location-images"],
            ["/admin/lands", "src/app/admin/lands/page.js", "Project CRUD, galleries, masterplans, units, plans, price grid", "lands, land_images, land_areas, plans, prices"],
            ["/admin/developers", "src/app/admin/developers/page.js", "Developer CRUD, logo upload, bank account", "developers, developer-logos"],
            ["/admin/reservations", "src/app/admin/reservations/page.js", "Reservation inbox and manual status handling", "reservations plus joined lands/areas/plans"],
            ["/admin/office-reservations", "src/app/admin/office-reservations/page.js", "Meeting-request inbox", "meeting_requests plus joined lands/locations"],
            ["/admin/office-hours", "src/app/admin/office-hours/page.js", "Weekly office schedule editor", "office_schedule"],
        ],
        widths=[1.05, 1.65, 2.2, 1.8],
    )

    doc.h1("4. Buyer Workflows")
    doc.h2("Discovery")
    doc.bullets(
        [
            "Root layout wraps every page with SplashScreen. The splash logo fades in, fades out, and is removed after 3.4 seconds.",
            "Home fetches locations, lands, and developers in parallel. It counts available lands by location and shows total locations, available projects, and developers.",
            "LocationSearch filters locations client-side by name and renders LocationCard for each match.",
            "Location pages fetch one location, all lands for that location, and developer names for ProjectCard display.",
            "ProjectCard shows the thumbnail from lands.image_url, project title, developer name, status badge, and calculated price per meter if price and area_sqm exist.",
        ]
    )
    doc.h2("Project Detail")
    doc.bullets(
        [
            "LandPage fetches the land first. If not found, it renders a simple not-found page with a back link.",
            "If found, LandPage fetches developer, images, location, land_areas, installment plans, and office_schedule in parallel.",
            "land_images are split by is_masterplan: normal gallery images go to PhotoGallery; masterplan images go to UnitPickerCard.",
            "PhotoGallery is mobile-first scroll-snap on small screens and a desktop gallery with a main image, grayscale side peeks, auto-scroll on edge hover, and a thumbnail rail.",
            "ProjectDetails shows price per square meter, project area, selectable area, selectable installment plan, description, exact map link, developer block, contact card, ReserveButton, and MeetingRequestForm.",
        ]
    )
    doc.h2("Area, Unit, And Plan Selection")
    doc.bullets(
        [
            "ProjectDetails groups land_areas by area_sqm and bedrooms. The first modal shows one row per size/bedroom spec, not one row per physical unit.",
            "Each spec row shows a count of available units. Specs with zero available units are disabled and marked Sold out.",
            "Opening a spec displays UnitPickerCard, a full-screen overlay with optional masterplan gallery and a horizontal list of available unit rows.",
            "UnitPickerCard labels a unit with unit_label when present, otherwise with area_sqm and optional bedrooms.",
            "The selected physical land_areas row is passed into ReserveButton, so reservations store the unit row id, not just size.",
            "Installment plans are selected from a separate modal. If customize_plan_whatsapp exists, the modal includes a Customize plan WhatsApp button.",
        ]
    )
    doc.h2("Reservation And Down Payment")
    doc.bullets(
        [
            "ReserveButton is disabled until both selectedArea and selectedPlan are present.",
            "The idle button says Buy your unit now.",
            "The form collects full name, phone, optional national ID front image, and optional national ID back image.",
            "Uploaded ID files go to the private reservations bucket under {landId}/{timestamp}_front/back_{filename}. There is UI copy saying JPG or PNG max 5MB, but no code-level size/type validation beyond accept='image/*'.",
            "The reservations insert includes land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, and status pending.",
            "After successful insert, the component switches to Down Payment. It shows down_payment_amount if configured, otherwise To be confirmed.",
            "The down-payment UI shows the developer identity, developer.bank_account with a copy button when present, and an Amman card only when amman_whatsapp is set.",
            "The final WhatsApp confirmation link goes to developerWhatsapp when set. There is currently no fallback number for that specific payment-confirmation link.",
        ]
    )
    doc.h2("Meeting Request")
    doc.bullets(
        [
            "Request a meeting toggles MeetingRequestForm inline below the contact card.",
            "The form collects full name, phone, date, and time.",
            "office_schedule rows define open days and open_time/close_time. The selected date's JavaScript getDay() is compared to day_of_week where 0 is Sunday.",
            "When a selected date is closed, the form displays an inline error and blocks submission.",
            "Time slots are generated in 30-minute increments from open_time up to, but not including, close_time.",
            "On submit, the component combines date and time into a local Date, converts it to ISO, and inserts meeting_requests with status pending.",
            "No minimum date is enforced in the native date input, so past dates are currently possible unless the browser/user avoids them.",
        ]
    )

    doc.h1("5. Admin Workflows")
    doc.h2("Admin Layout")
    doc.bullets(
        [
            "AdminLayout is a client component with a collapsible desktop sidebar and fixed mobile bottom navigation.",
            "Navigation items: Dashboard, Locations, Projects, Developers, Reservations, Office.",
            "The Office nav item links to /admin/office-reservations. Office Working Hours is reached from the dashboard card, not the sidebar.",
            "The layout returns children directly for /admin/login so the login page is not wrapped in the admin chrome.",
        ]
    )
    doc.h2("Dashboard")
    doc.bullets(
        [
            "AdminDashboard is an async server component using createSupabaseServerClient().",
            "It fetches exact counts for locations, lands, developers, and reservations.",
            "It fetches up to five pending reservations and up to five recent lands.",
            "It includes a card linking to /admin/office-hours. The office-hours editor is not embedded inside the dashboard.",
        ]
    )
    doc.h2("Locations")
    doc.bullets(
        [
            "Locations page fetches locations ordered by created_at descending.",
            "The form supports name, description, and image_url through either existing URL or a new uploaded file.",
            "Uploads go to the public location-images bucket. The public URL is saved to locations.image_url.",
            "Deletion removes the database row only; it does not remove the storage object.",
        ]
    )
    doc.h2("Developers")
    doc.bullets(
        [
            "Developers page fetches developers ordered by name.",
            "The form supports name, bio, logo upload, and bank_account.",
            "Logo uploads go to the public developer-logos bucket. The public URL is saved to developers.logo_url.",
            "bank_account is later displayed on the buyer down-payment screen through the developer object.",
        ]
    )
    doc.h2("Projects")
    doc.bullets(
        [
            "Projects page fetches lands with joined locations/developers, plus location/developer option lists and the most recently created land for suggested placeholders.",
            "The project form covers title, location, developer, price, area_sqm, price_per_meter, down_payment_amount, status, description, location_url, contact_whatsapp, contact_phone, developer_whatsapp, amman_whatsapp, and customize_plan_whatsapp.",
            "Regular project images upload to land-images under lands/{landId}/... and insert land_images rows with is_masterplan false.",
            "Masterplan images upload to land-images under lands/{landId}/masterplan/... and insert land_images rows with is_masterplan true.",
            "lands.image_url is treated as the thumbnail. Existing images can be selected as thumbnail; the first newly uploaded regular image becomes the thumbnail if none exists.",
            "Area options are physical unit rows with area_sqm, status, bedrooms, and unit_label. Editing an existing project writes row changes immediately on blur/change.",
            "Installment plans have label, down_payment_percent, and years. New-project plans are staged locally until the land id exists.",
            "The price grid stores exact total_price rows for every area x plan combination in land_area_plan_prices. It is managed in admin and fetched for buyer pages, but current ReserveButton no longer displays totalPrice.",
            "Deleting a project deletes land_images database rows and the lands row, but does not remove files from the land-images storage bucket.",
        ]
    )
    doc.h2("Reservations")
    doc.bullets(
        [
            "Reservations page filters all/pending/confirmed/rejected.",
            "It joins each reservation to lands, nested locations, land_areas, and land_installment_plans.",
            "Selecting a reservation opens a sticky detail panel with project info, reservation details, buyer info, national ID previews, status controls, and two-step delete confirmation.",
            "ID preview URLs are generated through createSignedUrl() from the private reservations bucket and expire after 3600 seconds.",
            "Deleting a reservation removes national ID files from storage first, then deletes the reservation row.",
        ]
    )
    doc.h2("Office Reservations And Office Hours")
    doc.bullets(
        [
            "OfficeReservationsPage mirrors the Reservations page pattern for meeting_requests.",
            "It orders meeting requests by requested_datetime ascending and joins lands plus nested locations.",
            "Admins can set meeting request status to pending, confirmed, or rejected, and can delete a request after confirmation.",
            "OfficeHoursPage fetches office_schedule ordered by day_of_week.",
            "Each day row has an is_open checkbox. Open rows show From and To time inputs; closed rows display Closed.",
            "Schedule updates are optimistic: the UI updates first, then Supabase update runs. Successful updates flash Saved; failed updates currently have no visible error or rollback.",
        ]
    )

    doc.h1("6. Data Model Used By The Code")
    doc.table(
        ["Table", "Columns used", "Purpose"],
        [
            ["locations", "id, name, description, image_url, created_at", "Public location cards and admin-managed locations"],
            ["developers", "id, name, bio, logo_url, bank_account", "Developer identity, logo, bio, and payment bank account"],
            ["lands", "id, location_id, developer_id, title, price, area_sqm, price_per_meter, status, description, location_url, contact_whatsapp, contact_phone, image_url, customize_plan_whatsapp, developer_whatsapp, down_payment_amount, amman_whatsapp, created_at", "Core project/listing record"],
            ["land_images", "id, land_id, image_url, is_masterplan", "Normal gallery images and masterplan gallery images"],
            ["land_areas", "id, land_id, area_sqm, status, bedrooms, unit_label, created_at", "Physical unit rows; grouped by size/bedroom spec in buyer UI"],
            ["land_installment_plans", "id, land_id, label, down_payment_percent, years, created_at", "Project-specific payment plans"],
            ["land_area_plan_prices", "land_area_id, installment_plan_id, total_price", "Manual total price matrix for one unit row and one installment plan"],
            ["reservations", "id, land_id, land_area_id, installment_plan_id, full_name, phone, national_id_front, national_id_back, status, created_at", "Buyer reservation records"],
            ["office_schedule", "id, day_of_week, day_name, is_open, open_time, close_time", "Weekly office hours for meeting-request time slots"],
            ["meeting_requests", "id, land_id, full_name, phone, requested_datetime, status, created_at", "Buyer office meeting requests"],
        ],
        widths=[1.2, 3.5, 2.0],
    )
    doc.h2("Storage Buckets")
    doc.table(
        ["Bucket", "Access expected", "Used by", "Path / behavior"],
        [
            ["location-images", "Public read", "Admin locations", "{timestamp}_{random}.{ext}; public URL saved to locations.image_url"],
            ["developer-logos", "Public read", "Admin developers", "{timestamp}_{random}.{ext}; public URL saved to developers.logo_url"],
            ["land-images", "Public read", "Admin projects, public galleries", "lands/{landId}/... for regular images and lands/{landId}/masterplan/... for masterplans"],
            ["reservations", "Private read", "ReserveButton, Admin reservations", "{landId}/{timestamp}_front/back_{filename}; admin views through signed URLs"],
        ],
        widths=[1.2, 1.1, 1.5, 3.0],
    )
    doc.h2("RLS Expectations")
    doc.bullets(
        [
            "Public read is required for buyer-facing tables: locations, lands, developers, land_images, land_areas, land_installment_plans, land_area_plan_prices, and office_schedule.",
            "Unauthenticated insert is required for reservations and meeting_requests if buyers submit without logging in.",
            "Admin select/update/delete/write operations should require authenticated users. Since many admin pages use browser-side anon clients, Supabase RLS must enforce this.",
            "Reservation storage should allow buyer uploads and authenticated admin signed URL creation; raw public read should remain disabled.",
            "meeting_requests status is set to pending by client code, but database-side defaults/checks should also enforce safe values.",
        ]
    )

    doc.h1("7. Design System")
    doc.table(
        ["Token", "Value", "Where it appears"],
        [
            ["Gold", "#C9973A", "Primary accent, links, buttons, borders"],
            ["Gold Light", "#E8C97A", "Highlighted values and reserved status"],
            ["Background", "#2C2C2E", "Main page/admin background"],
            ["Card", "#343437", "Cards, admin panels, form surfaces"],
            ["Inset", "#3A3A3D", "Inputs and nested controls"],
            ["Text Primary", "#F0EDE6", "Main text and headings"],
            ["Text Secondary", "#9A9489", "Descriptions and helper text"],
            ["Text Muted", "#6B6762", "Labels, placeholders, metadata"],
            ["Available Green", "#4DC98A", "Available/success states"],
            ["Rejected/Sold Red", "#E07070", "Sold/rejected/error states"],
            ["Payment Blue", "#5B9BD5", "Down-payment step accent only"],
        ],
        widths=[1.4, 1.1, 3.2],
    )
    doc.bullets(
        [
            "The app uses dark charcoal surfaces with thin gold borders and small uppercase metadata labels.",
            "Most styling is inline in React components. There is no shared component library.",
            "Global CSS defines variables and basic body/html reset, scrollbar styling, and transition defaults for a/button/input.",
            "The codebase mixes modern font variables with older inline Georgia/Inter declarations.",
        ]
    )

    doc.h1("8. Corrections To The Attached Reference Handoff")
    doc.bullets(
        [
            "The attached handoff said admin middleware placement was a known issue. Current source has src/middleware.js in the standard location, so that warning is stale.",
            "The attached handoff said /logo.png was missing. Current public/logo.png exists and matches public/envegate_logo-removebg-preview.png at 498x501 and 70,886 bytes.",
            "The attached handoff treated admin/page.js office-hours editor status as unclear. Current source shows the dashboard links to /admin/office-hours; the editor lives on that dedicated page.",
            "The attached handoff omitted /admin/office-hours from the route map.",
            "The attached handoff did not describe UnitPickerCard, unit_label, or masterplan images. These are present in the current source.",
            "The attached handoff said admin developers, projects, and dashboard were not re-verified. They are verified in this pass.",
            "The previous generator script output/INVEGATE_COMPLETE_PROJECT_HANDOFF.md and PDF are August 6 artifacts and should not be treated as current.",
        ]
    )

    doc.h1("9. Known Risks And Open Items")
    doc.bullets(
        [
            "Move ReserveButton.js from hard-coded Supabase credentials to the shared env-based client pattern.",
            "Consolidate browser Supabase clients to reduce duplicate GoTrueClient warnings and make auth behavior easier to reason about.",
            "Add a fallback WhatsApp number for the down-payment confirmation link; it currently uses developerWhatsapp or an empty string.",
            "Remove or use the developerBankAccount prop passed from ProjectDetails to ReserveButton; current ReserveButton reads developer.bank_account directly.",
            "Decide whether totalPrice should be displayed again. It is still fetched and computed, but not shown in the current Down Payment screen.",
            "Add file size/type validation for national ID uploads and admin image uploads.",
            "Prevent buyers from choosing past meeting dates.",
            "Add error handling/rollback to OfficeHoursPage optimistic updates.",
            "Clean up land-images storage objects when project or image rows are deleted.",
            "Consider adding automated tests for reservation insert, meeting-request insert, admin status updates, and project area/plan/price editing.",
            "npm run lint was started during this documentation pass but produced no result after about two minutes and was interrupted. Treat lint status as unconfirmed.",
            "Confirm actual Supabase schema, constraints, seeded office_schedule rows, and RLS policies in the Supabase dashboard before shipping database-dependent features.",
        ]
    )

    doc.h1("10. Local Development And Deployment")
    doc.bullets(
        [
            "Install dependencies with npm install when node_modules is missing.",
            "Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
            "Run npm run dev and open http://localhost:3000.",
            "Use /admin/login after creating a Supabase Auth admin user.",
            "Run npm run build before deployment. This writes .next output.",
            "Run npm run lint, but be aware the latest read-only attempt in this documentation session did not complete within two minutes.",
            "Deployments must provide the same env vars and must have Supabase RLS/storage policies configured correctly.",
        ]
    )

    doc.h1("11. Source Inventory")
    doc.table(["File", "Lines", "PDF appendix"], source_line_rows(), widths=[3.8, 0.8, 1.2])
    doc.h2("Static Assets")
    doc.table(
        ["Asset", "Observed detail"],
        [
            ["public/logo.png", "498x501 PNG, 70,886 bytes; used by Home and SplashScreen"],
            ["public/envegate_logo-removebg-preview.png", "498x501 PNG, 70,886 bytes; duplicate/alternate logo asset"],
            ["public/file.svg, globe.svg, next.svg, vercel.svg, window.svg", "Default create-next-app SVG assets; not used by current app pages"],
            ["src/app/favicon.ico", "25,931 bytes"],
            ["output/pdf/INVEGATE_COMPLETE_PROJECT_HANDOFF.pdf", "Older generated handoff from August 6, 2026"],
            ["tmp/pdfs/*.png", "Old rendered QA images for the older handoff"],
        ],
        widths=[2.0, 3.8],
    )

    doc.page_break()
    doc.h1("12. Redacted Source Code Appendix")
    doc.note(
        "The appendix is generated from current workspace files. JWT-like tokens are redacted. "
        "For legible PDF rendering, non-ASCII UI glyphs in source lines are normalized to ASCII equivalents; the source files in the repo remain the exact originals."
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


def write_pdf(story: list):
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)

    def footer(canvas, pdf_doc):
        canvas.saveState()
        canvas.setFont(FONTS["Body"], 7)
        canvas.setFillColor(colors.HexColor("#777777"))
        canvas.drawString(pdf_doc.leftMargin, 0.35 * inch, "Invegate Updated Project Handoff")
        canvas.drawRightString(A4[0] - pdf_doc.rightMargin, 0.35 * inch, f"Page {pdf_doc.page}")
        canvas.restoreState()

    pdf = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        rightMargin=0.42 * inch,
        leftMargin=0.42 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.55 * inch,
        title="INVEGATE Updated Project Handoff",
        author="Codex",
    )
    pdf.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    doc = build_doc()
    write_pdf(doc.story)
    print(OUTPUT_PDF)


if __name__ == "__main__":
    main()
