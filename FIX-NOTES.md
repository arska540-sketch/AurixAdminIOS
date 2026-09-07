# AurixAdmin startup and login fix

Based on repository commit `76b11b93629252d65db30f09716b415af9e3d85b`.

## Diagnosis

The supplied IPA contains the native app executable and icons but no HTML or JavaScript web resources. `project.yml` excludes `AurixAdmin/Web` from sources and puts it in a target-level `resources` field. XcodeGen expects resource entries under `sources`. The native view silently returned an empty WKWebView when it could not find `index.html`.

This repository has no URLSession login request or Swift JSON decoder. Its login is Firebase JavaScript email/password authentication inside WKWebView, with usernames mapped to `username@aurix.local`. The original code displayed Firebase's raw localized message for unrecognized failures, which can produce the reported generic format error when the SDK receives an unexpected response. The fix maps that failure to a safe, useful message while preserving known credential and network errors.

## Exact changes

- `project.yml`: adds `AurixAdmin/Web` under `sources` as `type: folder`, `buildPhase: resources`, preserving the `Web` directory in the app bundle.
- `AurixAdmin/ContentView.swift`: shows an installation error if the HTML is missing instead of silently displaying an empty view.
- `AurixAdmin/Web/auth-support.js`: maps known Firebase errors, SDK internal-response errors and JSON SyntaxErrors to safe, actionable text. Unknown errors do not expose raw bodies, messages, custom data, tokens or arbitrary error codes. Firebase continues to own HTTP/JSON handling and session persistence; no alternate authentication transport was introduced.
- `AurixAdmin/Web/index.html`: catches dynamic Firebase import/initialization failures, disables login until startup completes, displays a connection timeout after 20 seconds, offers a reload/retry button, and prevents default form navigation even if Firebase fails to load. Uses the safe error mapper for login/account settings. Failed initial account-data reads reset the UI, attempt sign-out and retain an actionable error on the login screen.
- `.github/workflows/build.yml`: runs the regression tests, supports pull requests, keeps manual/main-branch triggers, builds an unsigned device app on macOS 15, checks both web files exist and match source before packaging, validates the ZIP, and fails if the artifact is missing. No Apple credentials or signing secrets are required by the workflow.
- `tests/login.test.cjs`: five tests covering error sanitization, common error messages, failed CDN startup, SDK login failures/retry availability, and failed account-data reads. Tests use mocked SDK calls and never contact the production database.
- `README-FIRST.txt`: corrects workflow/artifact instructions for this repository.

## Validation and limits

`node --test tests/login.test.cjs`: 5 passed, 0 failed on Node 24.20.0. The tests also parse and execute the inline app module with mocked Firebase imports and a minimal DOM. They do not replace a real WKWebView/device test or verify Firebase's backend rules.

The configured Firebase authentication SDK URL returned HTTP 200 during inspection. No real account sign-in or production database mutation was performed.

The previous GitHub Actions run succeeded: https://github.com/arska540-sketch/AurixAdminIOS/actions/runs/34089675797 . That is the ORIGINAL build, not a build of these changes. The corrected Xcode project and IPA have not been compiled here: this host is Windows and the available GitHub browser is signed out.

## Apply and build

1. Replace the repository files with the contents of this corrected source folder, including `.github/workflows/build.yml`, `auth-support.js` and `tests/login.test.cjs`. Keep these at the repository root; do not nest the entire folder one level deeper.
2. Commit to `main`, or open a pull request. The Build IPA workflow runs automatically. It can also be started under Actions > Build IPA > Run workflow.
3. Open the new successful run and download `AurixAdmin-IPA`. Extract `AurixAdmin.ipa` and install it through AltStore.
4. Launch **Aurix Admin**. Its screen asks for Name, Username and Password. Use the Aurix account credentials. This app does not ask for an Apple ID.
5. Verify a wrong Aurix password produces a readable error; a valid Admin/Owner account opens the admin panel. Test startup while offline, then reconnect and use Retry connection.

No Apple ID password, access token, or new secret was added. The existing public Firebase web configuration is unchanged.

XcodeGen resource schema: https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md#target-source
