import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Layout } from '@/components/layout';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useUIStore } from '@/store';
import { useInfiniteChatsQuery, useCurrentUserQuery } from '@/hooks/queries';
import { LoadingScreen } from '@/components/ui';
import { useGlobalStream, useStreamRestoration } from '@/hooks/useChatStreaming';
import { authService } from '@/services/authService';
import { toasterConfig } from '@/config/toaster';
import { AuthRoute } from '@/components/routes/AuthRoute';

const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const ChatPage = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const EmailVerificationPage = lazy(() =>
  import('@/pages/EmailVerificationPage').then((m) => ({ default: m.EmailVerificationPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function AppContent() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasToken = !!authService.getToken();
  const {
    data: user,
    error,
    isLoading,
  } = useCurrentUserQuery({
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    if (hasToken && user) {
      setAuthenticated(true);
    } else if (isAuthenticated && error) {
      setAuthenticated(false);
    }
  }, [user, hasToken, error, isAuthenticated, setAuthenticated]);

  const { data: chatsData, isLoading: isChatsLoading } = useInfiniteChatsQuery({
    enabled: isAuthenticated,
  });

  const allChats = chatsData?.pages.flatMap((page) => page.items) ?? [];

  useStreamRestoration({
    chats: allChats,
    isLoading: isChatsLoading,
    enabled: isAuthenticated,
  });

  const showLoading = hasToken && isLoading;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute isAuthenticated={isAuthenticated} requireAuth={false}>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRoute isAuthenticated={isAuthenticated} requireAuth={false}>
              <SignupPage />
            </AuthRoute>
          }
        />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route
          path="/forgot-password"
          element={
            <AuthRoute isAuthenticated={isAuthenticated} requireAuth={false}>
              <ForgotPasswordPage />
            </AuthRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthRoute isAuthenticated={isAuthenticated} requireAuth={false}>
              <ResetPasswordPage />
            </AuthRoute>
          }
        />
        <Route
          path="/"
          element={
            showLoading ? (
              <LoadingScreen />
            ) : (
              <Layout>
                <LandingPage />
              </Layout>
            )
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <AuthRoute
              isAuthenticated={isAuthenticated}
              requireAuth={true}
              showLoading={showLoading}
            >
              <ChatPage />
            </AuthRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthRoute
              isAuthenticated={isAuthenticated}
              requireAuth={true}
              showLoading={showLoading}
            >
              <SettingsPage />
            </AuthRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const theme = useUIStore((state) => state.theme);

  useGlobalStream();

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster {...toasterConfig} />
      <AppContent />
    </BrowserRouter>
  );
}
