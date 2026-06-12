# Admin Manual

---

## Table of Contents
| Section | Page |
|---|---|
| Introduction | 1 |
| Minimum Requirements | 2 |
| Logging In | 3 |
| Admin Capabilities | 4 |
| System Configuration (Technical) | 5 |
| Handling Errors | 6 |
| Frequently Asked Questions | 7 |
| Confidentiality & Ethics | 8 |
| Contact Information | 9 |
| Important Note on UAT Data | 10 |
| Credentials Placeholder | 11 |

---

## Introduction
This guide is for **Administrators** who manage users, roles, and system configuration in the Dispatch Management application.

## Minimum Requirements
- Modern web browser (Chrome, Edge, or Firefox).
- Admin credentials provided by the Digital Transformation Department.
- Basic familiarity with the application’s navigation (no deep technical knowledge required).

## Logging In
1. Open the application URL.
2. Enter **Admin Username** and **Admin Password**.
3. Click **Login**.

> *If you do not have admin credentials, request them from the Digital Transformation Department.*

## Admin Capabilities
- **User Management** – Create, deactivate, and assign roles (User, Supervisor, Dashboard, Security, Admin).
- **Role Configuration** – Define which features are visible for each role.
- **Data Retention Settings** – Configure how long dispatch data is retained.
- **System Monitoring** – View server health, logs, and usage statistics.
- **Backup & Restore** – Run manual backups of the database and restore from previous snapshots.

> **Changing a user’s password must be performed here; regular users cannot change their own passwords.**

## System Configuration (Technical)
The application is built with **Vite** and runs on a **Node.js** environment. Supabase is used as the backend database; connection details are stored in the `.env` file. Admins may need to edit the `supabase/config.json` file only when instructed by the Digital Transformation Department.

## Handling Errors
| Symptom | Possible Cause | Suggested Action |
|---|---|---|
| Unable to create user | Missing required fields or role conflict | Verify input; ensure role is valid. |
| Backup fails | File permission issue or storage quota | Check disk space; verify write permissions. |
| Server health shows “down” | Supabase service outage or network issue | Confirm Supabase status page; contact support. |
| Configuration changes not applied | Application not restarted | Restart the dev server (`npm run dev`) or ask the platform team to redeploy. |

If problems persist, see **Contact Information**.

## Frequently Asked Questions
**Q:** How do I add a new supervisor?
**A:** Use the **User Management** screen, click **Add User**, fill in details, assign the **Supervisor** role, and save.

**Q:** Where can I view audit logs?
**A:** From the **System Monitoring** tab → **Audit Logs** section.

**Q:** Can I change the UI theme?
**A:** Theme changes are controlled centrally; request the change via the Digital Transformation Department.

## Confidentiality & Ethics
- Do **not** share admin credentials or internal configuration files externally.
- Any export of data must be approved by the Data Governance team.
- Follow the organization’s security policy; unauthorized changes may lead to service disruption.

## Contact Information
For any administrative issue, reach out to the Digital Transformation Department:
- Email: ittldigitalization@indo-tech.com
- Email: Selvabhushan.V.K@indo-tech.com

## Important Note on UAT Data
**_The data/entries stored during the UAT period (testing period) may or may not be retrieved during the production live project. There may be practical difficulties to re‑enter the data again which was entered during the UAT time period._**

## Credentials Placeholder
**Username:** __________
**Password:** __________

---

*Fig 1. Admin dashboard – insert appropriate screenshot here.*
