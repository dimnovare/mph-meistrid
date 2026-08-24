# MPH Meistrid — Full Claude Code Build Prompt

Build a complete production-ready website for **MPH Meistrid OÜ**, an Estonian construction/building company.

Company registry code:

**17317439**

This is intentionally a **very small €200 website project**.

The most important instruction is:

> DO NOT OVERENGINEER THIS PROJECT.

I need a polished construction-company landing page with an extremely simple portfolio administration area.

The end result should be reliable, fast, SEO-friendly and so easy to administer that a builder with no technical knowledge can use it from a phone.

---

# 1. Analyse Before Building

First inspect the existing repository if one exists.

Understand:

- current stack
- current components
- current deployment configuration
- available environment variables
- existing DIIP conventions if present

Then prepare a concise implementation plan.

Do not introduce unnecessary frameworks, services or abstraction layers.

Prefer boring, simple and reliable solutions.

---

# 2. Technology

Use:

- Next.js latest stable
- App Router
- TypeScript
- Tailwind CSS

Deployment will use my existing DIIP infrastructure.

Images should be stored in:

**Cloudflare R2**

Choose the simplest reliable solution for storing:

- projects
- project metadata
- pricing
- basic site settings

There is only:

- one website
- one administrator
- a relatively small portfolio
- low traffic
- infrequent admin edits

Therefore do not build an enterprise backend.

A lightweight JSON/R2 or similarly simple architecture is acceptable if implemented safely.

If there is a materially better lightweight solution already available in the project/infrastructure, use it.

Document the choice.

---

# 3. Public Website

Create a single-page website with these sections:

## Header

- MPH Meistrid logo
- navigation
- phone CTA
- request quote CTA

Navigation:

- Teenused
- Tehtud tööd
- Hinnad
- Meist
- Kontakt

Smooth-scroll to sections.

Keep navigation extremely simple.

---

# 4. Hero

The hero should immediately communicate:

1. what MPH Meistrid does
2. where they work
3. how to contact them

Use one strong CTA:

**Küsi pakkumist**

Secondary CTA:

**Helista**

Do not write generic marketing fluff.

Use short, believable construction-company language.

---

# 5. Services

Create a clean services section.

Architecture must allow services to be changed easily later.

Use approximately 4–8 services.

Do not invent claims such as years of experience, certifications or warranties unless provided.

Use placeholder service names if final content is not yet available.

Clearly mark editable content.

---

# 6. Completed Work / Portfolio

This is the most important visual section.

Display projects as image-led cards.

Each project supports:

- id
- slug
- title
- location, optional
- description, optional
- cover image
- additional images
- published state
- display order
- creation/update date

Clicking a project should provide an excellent image-viewing experience.

Either:

- modal/lightbox

or

- dedicated project page

Choose the simplest solution that provides good UX and SEO.

If dedicated project pages are implemented, use SEO-friendly URLs such as:

`/tood/vannitoa-remont-tallinn`

Project images must:

- load efficiently
- use responsive sizes
- lazy load when appropriate
- preserve quality
- avoid layout shift

---

# 7. Pricing

Create a straightforward price section.

Each item supports:

- service name
- price text
- optional unit
- optional note
- display order

Example:

`Seinte värvimine — alates 12 €/m²`

Display a simple disclaimer:

Exact pricing depends on the scope of work and is confirmed in the final quotation.

Do not create a price calculator.

---

# 8. About

Short, factual section.

Company:

**MPH Meistrid OÜ**

Registry code:

**17317439**

Do not invent information.

Use placeholders for information that must come from the client.

---

# 9. Contact

Make contacting the company extremely easy.

Support:

- clickable phone number
- clickable email
- CTA to request a quote

On mobile, phone CTA should be particularly prominent.

Do not create a complicated contact workflow unless necessary.

---

# 10. Admin

Create:

`/admin`

This must be substantially simpler than a normal CMS.

Think:

> Can someone who rarely uses computers understand this without instructions?

Use large buttons, clear wording and obvious actions.

Avoid developer terminology.

---

# 11. Authentication

Only one administrator is needed.

Implement simple but secure authentication.

Requirements:

- credentials/secrets stored in environment variables
- passwords never stored in plain text in source control
- secure session cookie
- HttpOnly
- Secure in production
- SameSite protection
- logout

No registration.

No forgotten-password flow.

No user management.

No OAuth unless it genuinely makes the implementation simpler.

---

# 12. Admin Dashboard

Main page should contain two very large actions:

### + Lisa uus töö

### Muuda hindu

Below that:

**Tehtud tööd**

Show current projects visually.

For every project:

- thumbnail
- title
- published/unpublished status
- edit
- delete

Keep interactions obvious.

---

# 13. Add Project UX

This workflow is extremely important.

Creating a project should take roughly one minute.

Form:

### Töö nimi

Required.

### Asukoht

Optional.

### Kirjeldus

Optional.

### Fotod

Large upload area.

Support:

- multiple photo selection
- drag & drop desktop
- phone photo library
- phone camera where supported

Show upload progress.

Show previews immediately.

Allow:

- remove image
- reorder images
- choose cover image

Then one obvious button:

### Avalda töö

Also support:

### Salvesta mustandina

Do not require unnecessary metadata.

---

# 14. Image Processing

Automatically optimize uploads.

Handle:

- JPEG
- PNG
- WebP
- HEIC if reasonably possible without introducing a fragile dependency

Generate or serve appropriate optimized sizes.

Preserve originals only if useful.

Prevent huge uploads from unnecessarily increasing storage/bandwidth usage.

Use Cloudflare R2.

Structure storage clearly, for example:

`projects/{project-id}/...`

Deleting a project should clean up its associated images when safe.

---

# 15. Price Administration

Extremely simple interface.

Rows such as:

| Teenus | Hind |
|---|---|
| Seinte värvimine | alates 12 €/m² |

Allow:

- add
- edit
- delete
- reorder

Use inline editing if that makes it simpler.

One Save button.

---

# 16. Responsive UX

Design mobile-first.

Test particularly at:

- ~360px
- ~390px
- tablet
- desktop
- large desktop

Admin must also work exceptionally well on mobile.

The administrator may upload project photos directly from the construction site using a phone.

Design around this use case.

---

# 17. SEO

Implement proper technical SEO.

Include:

- metadata
- title templates
- meta descriptions
- canonical URLs
- sitemap
- robots
- Open Graph
- Twitter metadata where useful
- semantic HTML
- descriptive alt text
- optimized heading hierarchy
- Schema.org

Use appropriate structured data such as:

- Organization
- LocalBusiness
- GeneralContractor where appropriate

Do not keyword-stuff.

Prepare architecture for local terms such as:

- ehitustööd Tallinn
- remont Tallinn
- siseviimistlus
- korteri remont
- maja remont

but only integrate keywords naturally.

---

# 18. Performance

The website should be extremely fast.

Avoid unnecessary:

- client-side rendering
- JavaScript
- animation libraries
- dependencies
- large fonts
- UI frameworks

Use server components by default.

Use client components only where interaction requires them.

Target strong Lighthouse results.

---

# 19. Accessibility

Implement basic accessibility correctly.

Include:

- keyboard navigation
- visible focus states
- sufficient contrast
- accessible buttons
- semantic labels
- alt text
- correct heading hierarchy

---

# 20. Design Direction

This is a construction company.

The site should feel:

- strong
- practical
- reliable
- professional
- modern
- clean

It should NOT feel:

- like a SaaS company
- like a crypto site
- overly luxurious
- overly animated
- complicated
- template-heavy

Photography should carry much of the visual design.

Use generous spacing and strong typography.

---

# 21. Logo

Do not design the final logo in Claude Code.

Use a temporary logo placeholder/component.

The actual MPH Meistrid branding will be created separately with Claude Design.

Make the site architecture easy to update with:

- SVG logo
- icon
- favicon
- light logo
- dark logo

---

# 22. Content

Do not invent:

- customer testimonials
- employee count
- experience years
- certifications
- warranties
- completed project statistics
- addresses
- claims about being the best/cheapest

Use clearly identifiable placeholders where actual customer information is missing.

---

# 23. Error Handling

Handle:

- failed uploads
- storage errors
- invalid images
- unauthorized admin access
- deleted/missing projects
- malformed project data

Show normal human-readable Estonian errors in the admin.

Never show stack traces or technical errors to the administrator.

---

# 24. Security

Perform a simple security review before completion.

Check:

- admin authentication
- API authorization
- file upload validation
- upload size limits
- file type validation
- path traversal
- XSS
- CSRF where relevant
- environment variables
- public/private R2 access
- sensitive information leakage

---

# 25. Final Audit

After implementation, audit the site from four perspectives.

## Customer

Can a potential client immediately understand:

- what MPH Meistrid does?
- examples of their work?
- approximate pricing?
- how to contact them?

## Builder / Administrator

Can a non-technical person:

- log in?
- add a project?
- upload photos from a phone?
- delete the wrong photo?
- change prices?

without instructions?

## Search Engine

Can Google:

- crawl everything important?
- understand the company?
- understand completed projects?
- discover project pages?
- correctly index metadata?

## Developer

Is the project:

- small?
- understandable?
- maintainable?
- secure?
- easy to deploy?
- free of unnecessary architecture?

---

# 26. Final Cleanup

Before considering the project complete:

- remove dead code
- remove unused dependencies
- remove placeholder developer content
- resolve TypeScript errors
- resolve lint warnings
- test production build
- test admin
- test mobile upload flow
- test project deletion
- test image management
- test pricing editing
- test responsive layout
- test SEO output
- document required environment variables
- write concise deployment instructions

Keep the README short and practical.

---

# Core Principle

If there are two ways to build something, choose the simpler solution unless the more complex one creates a clear user benefit.

This website does not need to be technically impressive.

It needs to:

**look professional, load fast, generate enquiries and be extremely easy for MPH Meistrid to maintain.**