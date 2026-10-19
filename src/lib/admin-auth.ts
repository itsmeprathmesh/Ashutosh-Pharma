export function isAdminAuthorized(authorization: string | null) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  if (!authorization?.startsWith("Basic ") || !expectedUser || !expectedPass) return false;

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    return separator > -1
      && decoded.slice(0, separator) === expectedUser
      && decoded.slice(separator + 1) === expectedPass;
  } catch {
    return false;
  }
}
