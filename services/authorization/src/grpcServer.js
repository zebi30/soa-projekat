const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const { createAuthService } = require("./services/authService");
const env = require("./config/env");

const authService = createAuthService();
const protoPath = path.resolve(__dirname, "../proto/auth.proto");
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

function statusToGrpcCode(statusCode) {
  if (statusCode === 400) return grpc.status.INVALID_ARGUMENT;
  if (statusCode === 401) return grpc.status.UNAUTHENTICATED;
  if (statusCode === 403) return grpc.status.PERMISSION_DENIED;
  if (statusCode === 404) return grpc.status.NOT_FOUND;
  if (statusCode === 409) return grpc.status.FAILED_PRECONDITION;
  return grpc.status.INTERNAL;
}

async function wrapGrpc(callback, handler) {
  try {
    const response = await handler();
    callback(null, response);
  } catch (error) {
    callback({
      code: error.code || statusToGrpcCode(error.statusCode),
      message: error.message || "Internal server error."
    });
  }
}

function register(call, callback) {
  wrapGrpc(callback, async () => {
    const user = await authService.registerUser(call.request);

    return {
      message: "User registered successfully.",
      userJson: JSON.stringify(user)
    };
  });
}

function login(call, callback) {
  wrapGrpc(callback, async () => {
    const result = await authService.loginUser(call.request);

    return {
      message: "Login successful.",
      token: result.token,
      userJson: JSON.stringify(result.user)
    };
  });
}

function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(authProto.AuthService.service, {
    Register: register,
    Login: login
  });

  const address = `0.0.0.0:${env.GRPC_PORT}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error("Failed to start authorization gRPC server:", error);
      process.exit(1);
    }

    server.start();
    console.log(`Authorization gRPC server is running on port ${env.GRPC_PORT}.`);
  });

  return server;
}

module.exports = {
  startGrpcServer
};