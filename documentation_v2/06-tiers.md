# Pricing Tiers & Feature Limits

Noisify offers three tiers for organizations, designed to scale from small pilot programs to city-wide implementations.

## 1. Tiers Overview

| Feature | **Free** (Start) | **Pro** (Växa) | **Enterprise** (Stad) |
| :--- | :--- | :--- | :--- |
| **Target** | Small centers, pilots | Established centers | Municipalities |
| **Cost** | 0 SEK/mo | 2000 SEK/mo | Custom |
| **Max Members** | 50 | Unlimited | Unlimited |
| **Max Staff** | 3 | Unlimited | Unlimited |
| **Storage** | 500 MB | 10 GB | 100 GB+ |
| **Support** | Community/Docs | Email (48h) | Dedicated Manager |
| **SLA** | None | None | 99.9% Uptime |

## 2. Feature Comparison

### Activity Management
| Feature | Free | Pro | Enterprise |
| :--- | :--- | :--- | :--- |
| **Creation** | Unlimited | Unlimited | Unlimited |
| **Registration Rules** | "Open for all" only | All (Members Only, Invite) | All |
| **Waitlists** | ❌ No | ✅ Yes | ✅ Yes |
| **Recurring** | ❌ No | ✅ Yes | ✅ Yes |
| **Collaboration** | ❌ No | ✅ Yes | ✅ Yes |
| **Deadlines** | ❌ No | ✅ Yes | ✅ Yes |

### Course Platform
| Feature | Free | Pro | Enterprise |
| :--- | :--- | :--- | :--- |
| **Max Courses** | 2 | Unlimited | Unlimited |
| **Access Control** | "Open for all" only | All | All |

### Other Features
| Feature | Free | Pro | Enterprise |
| :--- | :--- | :--- | :--- |
| **Room Booking** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Chat** | Direct Messages Only | Groups & DMs | Groups & DMs |
| **Reporting** | Basic Attendance | Advanced Stats & Export | Audit Logs & API |
| **Multi-Org** | ❌ No | ❌ No | ✅ Yes |
| **SSO** | ❌ No | ❌ No | ✅ Yes |

## 3. Implementation Logic

Limits are enforced at the application level based on the organization's `tier` and configured limits in the database.

### Database Schema
The `organizations` table includes:
- `tier`: 'FREE', 'PRO', 'ENTERPRISE'
- `max_members`: Integer limit
- `max_staff`: Integer limit
- `max_storage_mb`: Integer limit

### Enforcement Examples

**Member Limit:**
```typescript
if (currentMemberCount >= org.max_members) {
  throw new Error("Medlemsgräns uppnådd. Uppgradera för att lägga till fler.");
}
```

**Storage Limit:**
```typescript
if (currentStorageUsage + newFileSize > org.max_storage_mb) {
  throw new Error("Lagringsutrymme fullt. Uppgradera för att lägga till mer lagringsutrymme.");
}
```
