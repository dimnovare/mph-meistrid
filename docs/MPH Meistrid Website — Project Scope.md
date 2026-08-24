# MPH Meistrid OÜ — Website Scope

## Goal

Create a simple, professional website for **MPH Meistrid OÜ** that works as the company's online business card.

The website should quickly show:

- what the company does
- examples of completed work
- approximate pricing
- company/contact information
- how to contact MPH Meistrid for a quote

The site must be extremely easy to use on mobile and desktop.

The administration area must be simple enough that a non-technical person can add completed projects and photos without developer help.

---

## 1. Public Website

Single-page website.

### Hero

- MPH Meistrid logo
- short company message
- main services
- prominent CTA:
  - **Küsi pakkumist / Запросить цену**
  - phone number
- optional large completed-project image

### Services

Simple overview of the services MPH Meistrid provides.

No complicated service catalogue.

Approximately 4–8 service categories.

### Completed Work

Main visual part of the website.

Each project can contain:

- project title
- optional location
- optional short description
- cover image
- multiple additional images

Projects displayed as clean visual cards.

Clicking a project opens its image gallery.

### Pricing

Simple pricing section.

Can show:

- service
- starting price / approximate price
- unit, where relevant
- optional short note

Example:

**Seinte värvimine — alates XX €/m²**

Include a note that the exact price depends on the project and final quote.

### About / Company Information

Short company presentation.

Include official company information where appropriate:

**MPH Meistrid OÜ**  
Registry code: **17317439**

### Contacts

- phone
- email
- company name
- company details
- social links if available
- CTA to request a quote

Phone number should be clickable on mobile.

---

## 2. Admin Area

URL:

`/admin`

The admin interface must be intentionally simple.

### Login

One administrator account/password.

No complex user or role management.

### Completed Projects

Administrator can:

- view existing projects
- add a new project
- edit a project
- delete a project
- publish/unpublish a project

### Add Project

Very simple workflow:

**1. Add title**

**2. Upload photos**

**3. Optional description/location**

**4. Save**

Nothing more should be required.

### Images

Administrator can:

- upload several photos at once
- upload directly from a phone
- see image previews
- select the main/cover photo
- reorder photos
- delete photos

Images should automatically be resized/compressed for the web.

### Pricing

Simple pricing editor.

Administrator can:

- add price
- edit price
- delete price
- reorder prices

Fields:

- service
- price
- optional unit/note

---

## 3. Design

Style:

- professional
- construction-oriented
- clean
- trustworthy
- modern but not overly "tech"
- easy to understand
- strong photography
- minimal animations

The website should feel like a good construction company, not a software startup.

Mobile-first.

---

## 4. Logo / Basic Branding

Create a simple MPH Meistrid identity.

Deliverables:

- primary logo
- horizontal logo
- icon/mark
- light version
- dark version
- SVG
- PNG
- favicon
- basic brand colours
- typography recommendation

The logo should also work later on:

- work clothing
- vehicles
- invoices
- signs
- social media

---

## 5. Technology

Preferred:

- **Next.js**
- TypeScript
- Tailwind CSS
- existing DIIP Solutions hosting infrastructure
- existing Cloudflare infrastructure
- Cloudflare R2 for project photos

Keep the backend architecture minimal.

No full CMS.

No unnecessary external dependencies.

Because there is only one administrator and a small number of projects, use the simplest reliable content storage solution possible.

---

## 6. SEO

Basic but properly implemented local SEO.

Include:

- correct page title
- meta description
- Open Graph metadata
- canonical URL
- sitemap.xml
- robots.txt
- semantic HTML
- optimized images
- meaningful image alt text
- Schema.org structured data
- LocalBusiness / GeneralContractor information
- good Core Web Vitals
- correct H1/H2 structure

Website architecture should allow dedicated project URLs if they provide SEO value, for example:

`/tood/vannitoa-remont-tallinn`

Even if the visual website remains primarily one landing page.

---

## 7. Performance

Target:

- very fast first load
- optimized images
- lazy-loaded galleries
- minimal JavaScript
- good mobile performance
- no unnecessary libraries

Aim for strong Lighthouse scores.

---

## 8. Infrastructure

The website is hosted and technically maintained through **DIIP Solutions infrastructure**.

The customer does not need separate Railway, Vercel or Cloudflare accounts.

The customer should own the domain.

Recommended domain:

**mphmeistrid.ee**

Alternative:

- mphehitus.ee
- mph-meistrid.ee
- mphremont.ee
- mphviimistlus.ee

---

## 9. Out of Scope

To keep this a simple €200 website, do not add unless requested separately:

- customer accounts
- advanced CMS
- CRM
- online payments
- booking system
- newsletter system
- blog
- advanced quotation calculator
- multiple administrator roles
- complex analytics dashboard
- custom ERP integrations
- extensive animations

---

## 10. Delivery

Target delivery:

**approximately 3 weeks after receiving the required materials.**

Required from customer:

- company information
- phone/email
- list of services
- pricing
- existing project photos
- short company description

Final result should require almost no technical knowledge to maintain.