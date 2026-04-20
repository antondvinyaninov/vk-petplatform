# Database Schema Documentation: PetPlatform & ZooPlatform 3.0

This document provides a comprehensive overview of the PostgreSQL database schema managed via Prisma.

## Core Entities Overview

### 1. User Management (`User`)
The central table for all actors in the system.
- **Identity**: `vk_id` (Unique VK User ID), `email`, `phone`.
- **RBAC**: Linked to `user_roles` for global permissions and `organization_members` for shelter-specific roles.
- **Extended Settings**: Linked to `vk_app_user_settings` for coordinates, onboarding status, and preferences.

### 2. Animals (`Pet`)
Stores all data about animals registered in the system.
- **Ownership**: Can belong to a `User` (B2C) or an `organizations` (B2B/Shelter).
- **VK Integration**: `vk_group_id` links the pet to a specific VK Community.
- **Medical History**: Linked to `medical_records`, `pet_vaccinations`, and `pet_treatments`.

### 3. Organizations (`organizations`)
Profiles for shelters, clinics, and foundations.
- **Ownership**: Linked to a `User` as the owner.
- **VK Link**: `organization_vk_settings` contains the group authentication tokens and automated posting rules.
- **Staff**: Managed via `organization_members`.

### 4. Ads & SOS-Radar (`petplatform_ads`, `vk_radar_pins`)
The functional layer for finding and helping pets.
- **Ads**: adoption listings, lost & found, services. Contains `vk_group_id` and geolocation.
- **Radar**: Temporary pins on the map for urgent events (SOS). Linked to `User` or `organizations`.

---

## Technical Mapping (Prisma Models)

### User Identity & Settings
| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| `User` | Main User Table | `vk_id`, `password_hash`, `verified` |
| `vk_app_user_settings` | App-specific metadata | `home_lat`, `home_lng`, `karma_score`, `achievements` |
| `user_sessions` | Auth & Tracking | `token`, `started_at`, `ip_address` |

### Organizations & Roles
| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| `organizations` | Entity profiles | `name`, `type`, `inn`, `owner_user_id` |
| `organization_vk_settings` | VK Integration config | `vk_group_id`, `access_token`, `duty_admin_user_id` |
| `organization_members` | Staffing | `role`, `permissions` (JSON) |

### Pets & Records
| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| `Pet` | Animal data | `vk_group_id`, `species`, `breed`, `microchip` |
| `medical_records` | Health tracking | `diagnosis`, `medications`, `clinic_id` |
| `pet_registrations` | Official logging | `chip_number`, `registered_at` |

### Engagement (Social & Maps)
| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| `petplatform_ads` | Adoption/Lost & Found | `status`, `type`, `lat`, `lng` |
| `vk_radar_pins` | SOS Map pins | `lat`, `lng`, `expires_at` |
| `posts` / `comments` | Social Feed | `author_id`, `content`, `media_urls` |
| `vk_post_publications` | VK Wall Mirroring | `vk_post_id`, `publish_date` |

---

## Critical Relationships (ER Summary)
- **User -> Pet**: One-to-many.
- **Organization -> Pet**: One-to-many.
- **Organization -> User**: Many-to-many via `organization_members`.
- **Ad -> Pet**: Optional one-to-one.

---

> [!NOTE]
> Database migrations are handled via `goose` and `prisma`. The schema file is located at `backend/prisma/schema.prisma`.
