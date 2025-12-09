import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/Login";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { BuyCoins } from "./pages/dashboard/BuyCoins";
import { Coupon } from "./pages/dashboard/Coupon";
import { DailyReward } from "./pages/dashboard/DailyReward";
import { TitleShop } from "./pages/dashboard/TitleShop";
import { Roulette } from "./pages/dashboard/Roulette";
import { Tickets } from "./pages/dashboard/Tickets";
import { Unbug } from "./pages/dashboard/Unbug";
import { Avatar } from "./pages/dashboard/Avatar";
import { Shop } from "./pages/dashboard/Shop";
import { Password } from "./pages/dashboard/Password";
import Characters from "./pages/dashboard/Characters";
import Rankings from "./pages/dashboard/Rankings";
import Launcher from "./pages/Launcher";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";

// Admin imports
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminIPBan } from "./pages/admin/AdminIPBan";
import AdminBlockedIPs from "./pages/admin/AdminBlockedIPs";
import { AdminCoins } from "./pages/admin/AdminCoins";
import { AdminCoupons } from "./pages/admin/AdminCoupons";
import { AdminAnnouncements } from "./pages/admin/AdminAnnouncements";
import { AdminModeration } from "./pages/admin/AdminModeration";
import { AdminStats } from "./pages/admin/AdminStats";
import { AdminSettings } from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/launcher" element={<Launcher />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/buy-coins"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BuyCoins />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/coupon"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Coupon />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/daily"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DailyReward />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/titles"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TitleShop />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/roulette"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Roulette />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tickets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tickets />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/unbug"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Unbug />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/avatar"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Avatar />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/shop"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Shop />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/password"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Password />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/characters"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Characters />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/rankings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Rankings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Protected by CanUseCP > 1 */}
      <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/users" element={<ProtectedAdminRoute><AdminLayout><AdminUsers /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/ipban" element={<ProtectedAdminRoute><AdminLayout><AdminIPBan /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/blocked-ips" element={<ProtectedAdminRoute><AdminBlockedIPs /></ProtectedAdminRoute>} />
      <Route path="/admin/coins" element={<ProtectedAdminRoute><AdminLayout><AdminCoins /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminLayout><AdminCoupons /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/announcements" element={<ProtectedAdminRoute><AdminLayout><AdminAnnouncements /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/moderation" element={<ProtectedAdminRoute><AdminLayout><AdminModeration /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/stats" element={<ProtectedAdminRoute><AdminLayout><AdminStats /></AdminLayout></ProtectedAdminRoute>} />
      <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminLayout><AdminSettings /></AdminLayout></ProtectedAdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
