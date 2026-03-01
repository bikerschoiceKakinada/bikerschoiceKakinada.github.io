const ADMIN_EMAIL = "bikerschoicekakinada390@gmail.com";
const ADMIN_PASSWORD = "pavan390";
const AUTH_KEY = "bck_admin_auth";

export { ADMIN_EMAIL };

export function adminLogin(email: string, password: string): boolean {
  if (
    email.trim().toLowerCase() === ADMIN_EMAIL &&
    password.trim() === ADMIN_PASSWORD
  ) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function adminLogout(): void {
  localStorage.removeItem(AUTH_KEY);
}
