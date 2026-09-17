const PASSWORD = Deno.env.get("SITE_PASSWORD") || "MUSICFIGHT2026";
const COOKIE_NAME = "mf_auth_session";
const COOKIE_VALUE = "authenticated_user_ok";

export default async (request: Request, context: any) => {
  const url = new URL(request.url);

  // Bypass API proxy requests and static asset extensions if needed
  if (url.pathname.startsWith('/api-deezer')) {
    return context.next();
  }

  // Handle logout
  if (url.pathname === '/logout') {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict`
      }
    });
  }

  // Handle password submit (POST)
  if (request.method === "POST" && url.pathname === "/") {
    try {
      const formData = await request.formData();
      const submittedPass = formData.get("password");

      if (submittedPass === PASSWORD) {
        // Correct password -> set cookie and redirect to /
        return new Response(null, {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000` // 30 days
          }
        });
      } else {
        return renderLoginPage(true);
      }
    } catch (_) {
      return renderLoginPage(true);
    }
  }

  // Check Cookie for GET requests
  const cookieHeader = request.headers.get("cookie") || "";
  const isAuthenticated = cookieHeader.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);

  if (isAuthenticated) {
    return context.next();
  }

  // Render Login Page if not authenticated
  return renderLoginPage(false);
};

function renderLoginPage(isError = false) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accès Restreint • MusicFight</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', -apple-system, sans-serif; }
    body {
      min-height: 100vh;
      background: radial-gradient(circle at top left, #1a0826 0%, #0d0317 60%, #05010a 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .auth-card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .auth-logo {
      font-size: 42px;
      margin-bottom: 12px;
      display: inline-block;
    }
    .auth-title {
      font-size: 26px;
      font-weight: 800;
      background: linear-gradient(135deg, #ff007f, #7928ca, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .auth-subtitle {
      color: rgba(255, 255, 255, 0.65);
      font-size: 14px;
      margin-bottom: 28px;
    }
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    .input-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }
    .input-field {
      width: 100%;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      color: #fff;
      font-size: 16px;
      outline: none;
      transition: all 0.2s ease;
    }
    .input-field:focus {
      border-color: #ff007f;
      box-shadow: 0 0 15px rgba(255, 0, 127, 0.3);
    }
    .error-msg {
      background: rgba(255, 50, 50, 0.15);
      border: 1px solid rgba(255, 50, 50, 0.4);
      color: #ff4d4d;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 20px;
      text-align: left;
    }
    .btn-submit {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #ff007f, #7928ca);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(255, 0, 127, 0.4);
      transition: all 0.2s ease;
    }
    .btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(255, 0, 127, 0.6);
    }
  </style>
</head>
<body>
  <div class="auth-card">
    <div class="auth-logo">🎵</div>
    <h1 class="auth-title">MusicFight Private</h1>
    <p class="auth-subtitle">Accès privé réservé. Veuillez saisir le mot de passe pour continuer.</p>

    ${isError ? '<div class="error-msg">⚠️ Mot de passe incorrect. Réessayez !</div>' : ''}

    <form method="POST" action="/">
      <div class="form-group">
        <label class="input-label" for="password">Mot de passe secret</label>
        <input type="password" id="password" name="password" class="input-field" placeholder="••••••••" required autoFocus>
      </div>
      <button type="submit" class="btn-submit">Entrer sur le Blind Test 🚀</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
