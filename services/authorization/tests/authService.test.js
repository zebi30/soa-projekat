require("./helpers/testEnv");

const test = require("node:test");
const assert = require("node:assert/strict");

const { createAuthService } = require("../src/services/authService");

function createInMemoryUserRepository() {
  const users = [];
  let nextId = 1;

  return {
    async createUser({ username, email, passwordHash, role }) {
      const timestamp = new Date().toISOString();
      const user = {
        id: nextId++,
        username,
        email,
        password_hash: passwordHash,
        role,
        is_blocked: false,
        created_at: timestamp,
        updated_at: timestamp
      };

      users.push(user);

      return { ...user };
    },
    async findByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },
    async findByUsername(username) {
      return users.find((user) => user.username === username) || null;
    },
    async listAllSafeUsers() {
      return users.map(({ password_hash, ...user }) => ({ ...user }));
    }
  };
}

test("registerUser rejects admin role", async () => {
  const service = createAuthService({
    userRepository: createInMemoryUserRepository(),
    hashPassword: async (value) => `hashed:${value}`,
    comparePassword: async (plainText, passwordHash) => passwordHash === `hashed:${plainText}`,
    generateToken: () => "token"
  });

  await assert.rejects(
    () =>
      service.registerUser({
        username: "new-user",
        email: "new-user@soa.local",
        password: "secret123",
        role: "admin"
      }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, "Role must be guide or tourist.");

      return true;
    }
  );
});

test("registerUser stores guide users and returns a safe response", async () => {
  const repository = createInMemoryUserRepository();
  const service = createAuthService({
    userRepository: repository,
    hashPassword: async (value) => `hashed:${value}`,
    comparePassword: async (plainText, passwordHash) => passwordHash === `hashed:${plainText}`,
    generateToken: () => "token"
  });

  const registeredUser = await service.registerUser({
    username: "guide-user",
    email: "GUIDE@soa.local",
    password: "secret123",
    role: "guide"
  });

  assert.equal(registeredUser.username, "guide-user");
  assert.equal(registeredUser.email, "guide@soa.local");
  assert.equal(registeredUser.role, "guide");
  assert.equal(registeredUser.is_blocked, false);
  assert.equal("password_hash" in registeredUser, false);
  assert.equal("password" in registeredUser, false);

  const storedUser = await repository.findByEmail("guide@soa.local");
  assert.equal(storedUser.password_hash, "hashed:secret123");
});

test("loginUser returns a bearer token for valid admin credentials", async () => {
  const repository = createInMemoryUserRepository();
  const service = createAuthService({
    userRepository: repository,
    hashPassword: async (value) => `hashed:${value}`,
    comparePassword: async (plainText, passwordHash) => passwordHash === `hashed:${plainText}`,
    generateToken: ({ sub, role }) => `token:${sub}:${role}`
  });

  await repository.createUser({
    username: "admin",
    email: "admin@soa.local",
    passwordHash: "hashed:admin123",
    role: "admin"
  });

  const loginResult = await service.loginUser({
    email: "ADMIN@soa.local",
    password: "admin123"
  });

  assert.equal(loginResult.token, "token:1:admin");
  assert.equal(loginResult.user.email, "admin@soa.local");
  assert.equal(loginResult.user.role, "admin");
  assert.equal("password_hash" in loginResult.user, false);
});

test("listUsers returns safe account data only", async () => {
  const repository = createInMemoryUserRepository();
  const service = createAuthService({
    userRepository: repository,
    hashPassword: async (value) => `hashed:${value}`,
    comparePassword: async (plainText, passwordHash) => passwordHash === `hashed:${plainText}`,
    generateToken: () => "token"
  });

  await repository.createUser({
    username: "tourist-user",
    email: "tourist@soa.local",
    passwordHash: "hashed:tourist123",
    role: "tourist"
  });

  const users = await service.listUsers();

  assert.equal(users.length, 1);
  assert.equal(users[0].username, "tourist-user");
  assert.equal(users[0].email, "tourist@soa.local");
  assert.equal("password_hash" in users[0], false);
});
