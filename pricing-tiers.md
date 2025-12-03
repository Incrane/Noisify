# Noisify Pricing Tiers & Feature Logic

This document outlines the logic for the Free tier and Paid tiers (Pro & Enterprise) for the Noisify platform.

## 1. Overview

The pricing model is designed to allow small youth centers to get started easily (Free), while offering advanced features, higher capacity, and better management tools for growing and large organizations (Pro & Enterprise).

## 2. Tier Definitions

### 2.1 Free Tier ("Start")
**Target:** Small, single-location youth centers or pilot programs.
**Cost:** 0 SEK / month

**Allowed:**
- **Members:** Up to 50 active members.
- **Staff:** Up to 3 staff accounts (Role 1 & 2).
- **Activities:** Unlimited creation of activities.
- **Storage:** 500 MB for images/media.
- **Basic Reporting:** View simple attendance lists.
- **Support:** Community support / Documentation only.

**Create activities limitations:** 
- Anmälningsregler must be "Öppen för alla", "Endast medlemmar" och "Endast inbjudna" are blocked.
- Inga reserveringar kan skapas.
- Inga anmälningslappar kan skapas.
- Inga återkommande anmälningar kan skapas.
- Inga samarbete med andra organisationer kan skapas.
- Inga sista anmälningsdatum kan skapas.

**Courses limitations:**
- Max 2 kurser kan skapas.
- Behörighet måste vara "Öppen för alla", "Endast medlemmar" och "välj medlemmar" är blockerade.

**Rumsbokningar**
- Allt är tillgängligt.

**Chatt**
- Kan ej skapa grupper.
- Kan endast chatta med medlemmar.

**Not Allowed:**
- **Multiple Organizations:** Cannot create or manage more than 1 organization.
- **Advanced Roles:** No access to Role 3+ (Senior Staff/Admin features).
- **Export Data:** Cannot export member lists to Excel/CSV.
- **SMS Notifications:** No SMS integration for urgent alerts.
- **SLA:** No guaranteed uptime SLA.

---

### 2.2 Pro Tier ("Växa")
**Target:** Established youth centers with moderate traffic.
**Cost:** 2000 SEK / month (ex moms) per organization.

**Allowed:**
- **Members:** Unlimited active members.
- **Staff:** Unlimited staff accounts.
- **Activities:** Unlimited.
- **Storage:** 10 GB for images/video.
- **Advanced Reporting:** Export data, detailed statistics on attendance and demographics.
- **Priority Support:** Email support with 48h response time.
- **Waitlist Management:** Automated waitlist promotion rules.
- **SLA:** No guaranteed uptime SLA.

---

### 2.3 Enterprise Tier ("Stad")
**Target:** Municipalities or large networks of youth centers.
**Cost:** Custom pricing

**Allowed:**
- **Members:** Unlimited.
- **Staff:** Unlimited.
- **Activities:** Unlimited.
- **Storage:** 100 GB+.
- **Multi-Org Management:** Manage multiple youth centers under one umbrella (Municipality view).
- **SSO:** Single Sign-On integration (BankID, AD, etc.).
- **Dedicated Account Manager.**
- **SLA:** 99.9% Uptime guarantee.
- **API Access:** Access to API for integrations with other municipal systems.
- **Audit Logs:** Full detailed logs of all staff actions.

## 3. Feature Flags & Logic Implementation

To implement this, we will need a `subscriptions` table or similar in the database linked to the `organisation` table.

### Database Schema Addition (Proposed)
```sql
ALTER TABLE organisation
ADD COLUMN tier VARCHAR(20) DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
ADD COLUMN max_members INT DEFAULT 100,
ADD COLUMN max_staff INT DEFAULT 3,
ADD COLUMN max_storage_mb INT DEFAULT 500;
```

### Logic Checks

**1. Adding a new member:**
```typescript
if (currentMemberCount >= org.max_members) {
  throw new Error("Medlemsgräns uppnådd. Uppgradera för att lägga till fler.");
}
```

**2. Adding a new staff member:**
```typescript
if (currentStaffCount >= org.max_staff) {
  throw new Error("Personalgräns uppnådd. Uppgradera för att lägga till fler.");
}
```

**3. Uploading Media:**
```typescript
if (currentStorageUsage + newFileSize > org.max_storage_mb) {
  throw new Error("Lagringsutrymme fullt.");
}
```
