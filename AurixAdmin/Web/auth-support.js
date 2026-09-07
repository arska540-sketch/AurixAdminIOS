/* Firebase owns HTTP status validation, JSON parsing and token persistence.
 * Never display raw SDK messages/response bodies: they can contain credentials.
 */
(function (root) {
  "use strict";
  function friendly(error) {
    const code = typeof error?.code === "string" ? error.code : "";
    const messages = {
      "auth/invalid-credential": "Wrong username or password.",
      "auth/invalid-login-credentials": "Wrong username or password.",
      "auth/wrong-password": "Wrong username or password.",
      "auth/user-not-found": "Wrong username or password.",
      "auth/user-disabled": "This account is disabled. Contact an administrator.",
      "auth/email-already-in-use": "That username is taken.",
      "auth/requires-recent-login": "Enter your current password and try again.",
      "auth/weak-password": "New password needs at least 6 characters.",
      "auth/operation-not-allowed": "Email/password sign-in is unavailable. Contact an administrator.",
      "auth/too-many-requests": "Too many sign-in attempts. Wait a few minutes and try again.",
      "auth/network-request-failed": "Cannot reach the sign-in service. Check your connection and try again.",
      "auth/timeout": "The sign-in service took too long to respond. Try again.",
      "auth/invalid-api-key": "The sign-in service configuration is invalid. Contact an administrator.",
      "auth/app-not-authorized": "This app is not authorized to sign in. Contact an administrator.",
      "auth/internal-error": "The sign-in service returned an unexpected response. Try again later. (auth/internal-error)",
      "PERMISSION_DENIED": "Account data access was denied. Contact an administrator.",
      "permission-denied": "Account data access was denied. Contact an administrator.",
      "app/invalid-username": "Username must be 3-24 letters, numbers, dots, dashes, or underscores.",
      "app/name-required": "Name is required.",
      "app/password-required": "Enter your current password and try again."
    };
    if (Object.hasOwn(messages, code)) return messages[code];
    if (error?.name === "SyntaxError") {
      return "The sign-in service returned unreadable data instead of a valid response. Try again later.";
    }
    // Unknown errors are deliberately not interpolated, even when they have a code.
    return "The request could not be completed. Check your connection and try again. If it continues, contact an administrator.";
  }
  root.AurixAuthSupport = { friendly };
  if (typeof module !== "undefined") module.exports = { friendly };
})(typeof window !== "undefined" ? window : globalThis);
