import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import BlogsFeedPage from "./pages/blogs/BlogsFeedPage";
import CreateBlogPage from "./pages/blogs/CreateBlogPage";
import BlogDetailPage from "./pages/blogs/BlogDetailPage";
import ToursGuideListPage from "./pages/tours/ToursGuideListPage";
import TourManagePage from "./pages/tours/TourManagePage";
import ExploreToursPage from "./pages/tours/ExploreToursPage";
import TourDetailTouristPage from "./pages/tours/TourDetailTouristPage";
import SimulatorPage from "./pages/tours/SimulatorPage";
import ExecutionPage from "./pages/tours/ExecutionPage";
import PurchasePage from "./pages/purchase/PurchasePage";
import FollowersPage from "./pages/FollowersPage";
import AdminPage from "./pages/AdminPage";

// Sends each signed-in user to their natural landing area for their role.
function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/blogs" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/blogs"
          element={
            <ProtectedRoute roles={["guide", "tourist", "admin"]}>
              <BlogsFeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blogs/new"
          element={
            <ProtectedRoute roles={["guide", "tourist", "admin"]}>
              <CreateBlogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blogs/:id"
          element={
            <ProtectedRoute roles={["guide", "tourist", "admin"]}>
              <BlogDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/guide"
          element={
            <ProtectedRoute roles={["guide"]}>
              <ToursGuideListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/guide/:id"
          element={
            <ProtectedRoute roles={["guide"]}>
              <TourManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/tourist"
          element={
            <ProtectedRoute roles={["tourist"]}>
              <ExploreToursPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/tourist/:id"
          element={
            <ProtectedRoute roles={["tourist"]}>
              <TourDetailTouristPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulator"
          element={
            <ProtectedRoute roles={["tourist"]}>
              <SimulatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/execution"
          element={
            <ProtectedRoute roles={["tourist"]}>
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase"
          element={
            <ProtectedRoute roles={["tourist"]}>
              <PurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followers"
          element={
            <ProtectedRoute roles={["guide", "tourist", "admin"]}>
              <FollowersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["guide", "tourist", "admin"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}
