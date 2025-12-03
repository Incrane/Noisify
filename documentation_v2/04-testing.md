# Testing Documentation

## Test Users
**Organization**: Test Fritidsgård
**Password for all users**: `123456`

### Staff Users
| Name | Email | Role |
| :--- | :--- | :--- |
| **Anna Test** | `anna_test@noisify.se` | Role 2 (Staff) |
| **Diogo Test** | `diogo_test@noisify.se` | Role 2 (Staff) |
| **Ricardo Test** | `ricardo_test@noisify.se` | Role 2 (Staff) |
| **Fergie Test** | `fergie_test@noisify.se` | Role 3 (Unit Manager) |
| **Taboo Test** | `taboo_test@noisify.se` | Role 4 (Org Admin) |
| **Will Test** | `will_test@noisify.se` | Role 5 (System Developer) |

### Member Users
| Alias | Email | Age | Persona |
| :--- | :--- | :--- | :--- |
| **Goku** | `goku@test.se` | 15 | Active, sporty. |
| **Bulma** | `bulma@test.se` | 17 | Tech-savvy, creative. |
| **Piccolo** | `piccolo@test.se` | 14 | Quiet, introspective. |
| **Android 18** | `android18@test.se` | 19 | Independent, athletic. |
| **Vegeta** | `vegeta@test.se` | 16 | Competitive, ambitious. |

## Testing Scenarios

### 1. Staff Login & Dashboard
- Log in as **Anna Test** (Role 2).
- Verify access to: Activities, Members, Quiz.
- Verify restricted access: Organization Settings (Read-only or limited).

### 2. Member Login & Registration
- Log in as **Goku**.
- Browse activities on `/app/aktiviteter`.
- Register for an activity.
- Check "Mina anmalningar".

### 3. Live Quiz Flow
- **Host**: Log in as Staff -> Create Quiz -> Start Session (Org Only).
- **Player**: Log in as Member -> Enter PIN -> Join.
- **Guest**: Go to `/join` -> Enter PIN -> Join (Only if session is OPEN).

## Automated Tests
- **Staff Onboarding**: Playwright test covering login, dashboard, org settings, and activity management.
- **New Org Onboarding**: Playwright test for `/for-organisationer/registrera` flow.
