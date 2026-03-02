import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import CheckoutPage from './pages/CheckoutPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';
import TrackOrderPage from './pages/TrackOrderPage';
import RewardsPage from './pages/RewardsPage';
import OrdersPage from './pages/OrdersPage';
import LiveNotification from './components/LiveNotification';
import theme from './config/theme';

// Apply theme colors as CSS variables
function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-light', theme.colors.primaryLight);
    root.style.setProperty('--primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--secondary-light', theme.colors.secondaryLight);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-glow', theme.colors.accentGlow);
    root.style.setProperty('--border-brand', theme.colors.border);
    root.style.setProperty('--gradient-brand', theme.colors.gradient);
}

applyTheme();

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const isAdminPage = window.location.pathname === '/admin';
    // However, window.location.pathname won't update on internal navigation with React Router 
    // without a listener. It's better to use useLocation inside the Router.
    return (
        <>
            {children}
        </>
    );
}

import { useAuth } from './hooks/useAuth';
import { Navigate } from 'react-router-dom';

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin, loading } = useAuth();
    if (loading) return null;
    if (!isAdmin) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

import AdminUsers from './pages/admin/AdminUsers';

function ScrollToTop() {
    const { pathname } = useLocation();
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function MainContent() {
    const { isBanned, logout } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isBanned) {
            logout();
            navigate('/login');
        }
    }, [isBanned, logout, navigate]);

    return (
        <>
            <ScrollToTop />
            <ConditionalLayout />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/favorites" element={<UserRoute><FavoritesPage /></UserRoute>} />
                <Route path="/checkout" element={<UserRoute><CheckoutPage /></UserRoute>} />
                <Route path="/messages" element={<UserRoute><MessagesPage /></UserRoute>} />
                <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/track" element={<UserRoute><TrackOrderPage /></UserRoute>} />
                <Route path="/orders" element={<UserRoute><OrdersPage /></UserRoute>} />
                <Route path="/rewards" element={<UserRoute><RewardsPage /></UserRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            </Routes>
            <ConditionalFooter />

            <LiveNotification />
            <ToastContainer />
        </>
    );
}

import { useLocation } from 'react-router-dom';

function ConditionalLayout() {
    const location = useLocation();
    const isExcluded = location.pathname.startsWith('/admin') || location.pathname === '/login';
    if (isExcluded) return null;
    return (
        <>
            <Navbar />
            <CartSidebar />
        </>
    );
}

function ConditionalFooter() {
    const location = useLocation();
    const allowedPaths = ['/', '/products', '/favorites'];
    const isAllowed = allowedPaths.includes(location.pathname);

    if (!isAllowed) return null;
    return <Footer />;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

import { ThemeProvider } from './context/ThemeContext';
import { useStore } from './hooks/useStore';
import SplashScreen from './components/SplashScreen';

function RootContent() {
    const { state } = useStore();

    if (!state.isDataInitialized) {
        return <SplashScreen />;
    }

    return (
        <BrowserRouter>
            <MainContent />
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <StoreProvider>
                        <RootContent />
                    </StoreProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}


