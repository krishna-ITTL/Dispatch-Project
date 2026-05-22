# MAIN DISPATCH PROJECT

A modern **Vehicle Management System** built with React, Vite, and Supabase.

## Key Features
- Role‑Based Access Control (RBAC) with a dedicated **Security** role that redirects directly to the Vehicle Management module.
- Sleek, professional login page using glass‑morphism, dark theme, and animated role cards.
- Comprehensive database security fixes: strict RLS policies, revoked excessive privileges, and enabled leaked‑password protection.
- Optimized performance (search_path fixes, policy consolidation) and visual enhancements (custom icons, fonts, color palette).
- Fully responsive UI with modern animations and accessibility improvements.

## Getting Started
```bash
npm install
npm run dev
```

## Deployment
The project is hosted on Supabase for authentication and database. Follow the Supabase dashboard steps to enable password‑leaked protection and apply the provided SQL scripts (`strict_rls_policies.sql`, `setup_rbac.sql`, etc.).

## Contributing
Feel free to open issues or submit pull requests. Ensure code follows the project's style guidelines and runs `npm run lint` before committing.

---
For more details, see the source files in the `src/` directory.

