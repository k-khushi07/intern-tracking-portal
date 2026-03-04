function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (!rawKey) return;
    cookies[rawKey] = decodeURIComponent(rawVal.join("="));
  });
  return cookies;
}

const ACCESS_COOKIE = "itp_access_token";
const REFRESH_COOKIE = "itp_refresh_token";
const REMEMBER_COOKIE = "itp_remember_me";

function cookieOptions({ rememberMe }) {
  const isProd = process.env.NODE_ENV === "production";
  const base = { httpOnly: true, sameSite: "lax", secure: isProd, path: "/" };
  if (!rememberMe) return base;
  return { ...base, maxAge: 1000 * 60 * 60 * 24 * 30 };
}

function setAuthCookies(res, { accessToken, refreshToken }, { rememberMe }) {
  const options = cookieOptions({ rememberMe });
  res.cookie(ACCESS_COOKIE, accessToken, options);
  res.cookie(REFRESH_COOKIE, refreshToken, options);
  if (rememberMe) {
    res.cookie(REMEMBER_COOKIE, "1", options);
  } else {
    res.clearCookie(REMEMBER_COOKIE, { path: "/" });
  }
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.clearCookie(REMEMBER_COOKIE, { path: "/" });
}

function getTokensFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return {
    accessToken: cookies[ACCESS_COOKIE] || null,
    refreshToken: cookies[REFRESH_COOKIE] || null,
    rememberMe: cookies[REMEMBER_COOKIE] === "1",
  };
}

module.exports = { setAuthCookies, clearAuthCookies, getTokensFromRequest };
