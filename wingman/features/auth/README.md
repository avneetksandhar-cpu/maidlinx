# Auth feature

Sprint 1: email/password signup, login, logout, and password reset against Neon
Postgres, with session cookies and role-aware route guards.

Roles are stored separately from membership tier, approval status, and permission
flags. Guest-list access is an entitlement flag, not a security role.

Apple/Google OAuth is not wired yet.
