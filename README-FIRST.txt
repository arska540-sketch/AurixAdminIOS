AURIX ADMIN FOR IPHONE
======================

This is the real iPhone app project. GitHub uses a Mac to turn it into an IPA.

BUILD THE IPA
-------------
1. Open the existing AurixAdminIOS GitHub repository.
2. Replace the files with everything INSIDE this folder, including .github and tests.
3. Open the repository's Actions tab, select Build IPA, and press
   Run workflow.
4. When it finishes, open the run and download AurixAdmin-IPA under Artifacts.
5. Unzip that download, then open AurixAdmin.ipa with AltStore.

See FIX-NOTES.md for the diagnosis, exact changes, and validation limits.

The app uses the same Firebase accounts, messages, roles, controls, updates,
announcements, and database as the website. It opens the Admin panel after an
Admin or Owner signs in.

AltStore free signing expires after 7 days. Keep AltServer running sometimes so
AltStore can refresh the app before it expires.
