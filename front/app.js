const DEFAULT_BASE = "http://localhost:8080";
const BASE_KEY = "soa_base";
const TOKEN_KEY = "soa_token";
const USER_KEY = "soa_user";

function base() {
  return localStorage.getItem(BASE_KEY) || DEFAULT_BASE;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (e) {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  renderSession();
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  renderSession();
}

function renderSession() {
  const user = getUser();
  const info = document.getElementById("sessionInfo");
  if (user && getToken()) {
    info.textContent = `${user.email} | role: ${user.role} | id: ${user.id}`;
  } else {
    info.textContent = "Nisi prijavljen";
  }
}

async function api(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(base() + path, options);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    return { ok: response.ok, status: response.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: "Mreža/gateway nedostupan: " + e.message } };
  }
}

function show(outId, result) {
  const el = document.getElementById(outId);
  el.className = "output " + (result.ok ? "ok" : "err");
  el.textContent = `HTTP ${result.status}\n` + JSON.stringify(result.data, null, 2);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function num(id) {
  return Number(val(id));
}

function myId() {
  const user = getUser();
  return user ? Number(user.id) : null;
}

function tags(id) {
  return val(id)
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

const actions = {
  async register(out) {
    return api("POST", "/auth/register", {
      username: val("reg-username"),
      email: val("reg-email"),
      password: val("reg-password"),
      role: val("reg-role")
    });
  },

  async login(out) {
    const result = await api("POST", "/auth/login", {
      email: val("login-email"),
      password: val("login-password")
    });
    if (result.ok && result.data && result.data.token) {
      setSession(result.data.token, result.data.user);
    }
    return result;
  },

  async getProfile() {
    return api("GET", "/auth/me/profile");
  },

  async updateProfile() {
    return api("PATCH", "/auth/me/profile", {
      first_name: val("pf-first"),
      last_name: val("pf-last"),
      profile_image_url: val("pf-image"),
      biography: val("pf-bio"),
      motto: val("pf-motto")
    });
  },

  async createTour() {
    return api("POST", "/api/tours", {
      name: val("tour-name"),
      description: val("tour-desc"),
      difficulty: val("tour-diff"),
      tags: tags("tour-tags")
    });
  },

  async listMyTours() {
    return api("GET", "/api/tours/mine");
  },

  async getTour() {
    return api("GET", "/api/tours/" + val("tour-id"));
  },

  async addKeypoint() {
    return api("POST", "/api/tours/" + val("tour-id") + "/keypoints", {
      name: val("kp-name"),
      description: val("kp-desc"),
      latitude: num("kp-lat"),
      longitude: num("kp-lon"),
      imageUrl: val("kp-img") || null
    });
  },

  async listKeypoints() {
    return api("GET", "/api/tours/" + val("tour-id") + "/keypoints");
  },

  async addTransport() {
    return api("POST", "/api/tours/" + val("tour-id") + "/transport-times", {
      transport: val("tt-transport"),
      minutes: num("tt-minutes")
    });
  },

  async publishTour() {
    return api("POST", "/api/tours/" + val("tour-id") + "/publish");
  },

  async archiveTour() {
    return api("POST", "/api/tours/" + val("tour-id") + "/archive");
  },

  async activateTour() {
    return api("POST", "/api/tours/" + val("tour-id") + "/activate");
  },

  async listPublished() {
    return api("GET", "/api/tours/published");
  },

  async addToCart() {
    return api("POST", "/api/cart/items", { tourId: val("cart-tourId") });
  },

  async removeFromCart() {
    return api("DELETE", "/api/cart/items/" + val("cart-tourId"));
  },

  async getCart() {
    return api("GET", "/api/cart");
  },

  async checkout() {
    return api("POST", "/api/cart/checkout");
  },

  async listPurchases() {
    return api("GET", "/api/purchases");
  },

  async revealTour() {
    return api("GET", "/api/purchases/" + val("reveal-tourId") + "/tour");
  },

  async follow() {
    return api("POST", "/follows", { followingId: num("follow-id") });
  },

  async unfollow() {
    return api("DELETE", "/follows", { followingId: num("follow-id") });
  },

  async listFollowing() {
    return api("GET", "/me/following");
  },

  async recommendations() {
    return api("GET", "/me/recommendations");
  },

  async listBlogs() {
    return api("GET", "/api/blogs");
  },

  async createBlog() {
    return api("POST", "/api/blogs", {
      title: val("blog-title"),
      description: val("blog-desc"),
      authorId: myId(),
      status: "published"
    });
  },

  async getBlog() {
    return api("GET", "/api/blogs/" + val("blog-id"));
  },

  async voteBlog() {
    return api("POST", "/api/blogs/" + val("blog-id") + "/votes", { userId: myId() });
  },

  async commentBlog() {
    return api("POST", "/api/blogs/" + val("blog-id") + "/comments", {
      authorId: myId(),
      text: val("comment-text")
    });
  },

  async listUsers() {
    return api("GET", "/auth/users");
  },

  async blockUser() {
    return api("PATCH", "/auth/users/" + val("block-id") + "/block");
  }
};

const outputBySection = {
  auth: "auth-out",
  profile: "profile-out",
  "tours-guide": "tours-guide-out",
  "tours-tourist": "tours-tourist-out",
  purchase: "purchase-out",
  followers: "followers-out",
  blog: "blog-out",
  admin: "admin-out"
};

function activeOutputId() {
  const active = document.querySelector(".tab.active");
  return outputBySection[active.id] || "auth-out";
}

document.addEventListener("click", async (event) => {
  const target = event.target;

  if (target.matches("[data-action]")) {
    const name = target.getAttribute("data-action");
    const handler = actions[name];
    if (!handler) return;
    const outId = activeOutputId();
    show(outId, { ok: true, status: 0, data: { message: "..." } });
    const result = await handler();
    show(outId, result);
    return;
  }

  if (target.matches("[data-tab]")) {
    const tab = target.getAttribute("data-tab");
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b === target));
    document.querySelectorAll(".tab").forEach((s) => s.classList.toggle("active", s.id === tab));
    return;
  }

  if (target.id === "saveBase") {
    localStorage.setItem(BASE_KEY, val("apiBase"));
    return;
  }

  if (target.id === "logoutBtn") {
    clearSession();
    return;
  }
});

document.getElementById("apiBase").value = base();
renderSession();
