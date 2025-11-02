export function parseJwt(token) {
  try {
    const b = token.split('.')[1];
    return JSON.parse(atob(b.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return null;
  }
}
