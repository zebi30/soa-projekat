const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const env = require("./config/env");
const purchaseService = require("./services/purchaseService");
const { verifyToken } = require("./utils/token");

const protoPath = path.resolve(__dirname, "../proto/purchase.proto");
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const purchaseProto = grpc.loadPackageDefinition(packageDefinition).purchase;

function grpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function statusToGrpcCode(statusCode) {
  if (statusCode === 400) return grpc.status.INVALID_ARGUMENT;
  if (statusCode === 401) return grpc.status.UNAUTHENTICATED;
  if (statusCode === 403) return grpc.status.PERMISSION_DENIED;
  if (statusCode === 404) return grpc.status.NOT_FOUND;
  if (statusCode === 409) return grpc.status.FAILED_PRECONDITION;
  if (statusCode === 502) return grpc.status.UNAVAILABLE;
  return grpc.status.INTERNAL;
}

function getUserFromAuthorization(authorization) {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw grpcError(grpc.status.UNAUTHENTICATED, "Authorization token is required.");
  }

  try {
    return verifyToken(authorization.slice("Bearer ".length));
  } catch (_error) {
    throw grpcError(grpc.status.UNAUTHENTICATED, "Invalid or expired token.");
  }
}

async function wrapGrpc(call, callback, handler) {
  try {
    const response = await handler(call.request);
    callback(null, response);
  } catch (error) {
    callback({
      code: error.code || statusToGrpcCode(error.statusCode),
      message: error.message || "Internal server error."
    });
  }
}

function requireRole(user, role) {
  if (!user || user.role !== role) {
    throw grpcError(grpc.status.PERMISSION_DENIED, `${role} access required.`);
  }
}

function checkout(call, callback) {
  wrapGrpc(call, callback, async (request) => {
    const user = getUserFromAuthorization(request.authorization);
    requireRole(user, "tourist");

    const result = await purchaseService.checkout(user.sub);
    return { resultJson: JSON.stringify(result) };
  });
}

function listMyPurchases(call, callback) {
  wrapGrpc(call, callback, async (request) => {
    const user = getUserFromAuthorization(request.authorization);
    requireRole(user, "tourist");

    const purchases = await purchaseService.listMyPurchases(user.sub);
    return { purchasesJson: JSON.stringify(purchases) };
  });
}

function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(purchaseProto.PurchaseService.service, {
    Checkout: checkout,
    ListMyPurchases: listMyPurchases
  });

  const address = `0.0.0.0:${env.GRPC_PORT}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error("Failed to start purchase gRPC server:", error);
      process.exit(1);
    }

    console.log(`Purchase gRPC server is running on port ${env.GRPC_PORT}.`);
  });

  return server;
}

module.exports = {
  startGrpcServer
};
