# Security Specification - Original Store

## Data Invariants
1. A user can only create their own profile.
2. A user can only update their own profile (displayName and photoURL).
3. The `createdAt` field is immutable and must match server time.
4. User profiles are publicly readable by any signed-in user.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing**: Attempt to create a profile for `userB` while signed in as `userA`.
2. **Resource Poisoning**: Use a 2MB string for `displayName`.
3. **Ghost Field Injection**: Add `isAdmin: true` to the user document.
4. **ID Poisoning**: Use `../../etc/passwd` as a userId.
5. **PII Blanket Leak**: Attempt to list all users (Not implemented in UI, but checking rules).
6. **State Shortcutting**: Attempt to update `uid` of an existing document.
7. **Time Travel**: Provide a `createdAt` date from 2020.
8. **Unauthorized Update**: `userB` attempting to change `userA`'s photoURL.
9. **Blanket Read Access**: Unauthenticated user attempting to get a user profile.
10. **Query Scrape**: List query without filtering by userId (if implemented).
11. **Shadow Update**: Updating `email` which should be immutable for the user.
12. **Terminal State Break**: (N/A for users, but good to have) Attempting to delete own profile (if not allowed).

## Test Runner (TDD)
Verified via `firestore.rules.test.ts`.
