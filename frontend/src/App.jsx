import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Engagement Pages
import MeetingsPage from './pages/engagement/MeetingsPage';
import SchemesPage from './pages/engagement/SchemesPage';
import PollsPage from './pages/engagement/PollsPage';
import EventsPage from './pages/engagement/EventsPage';
import WorksPage from './pages/engagement/WorksPage';
import BudgetPage from './pages/engagement/BudgetPage';
import SuggestionsPage from './pages/engagement/SuggestionsPage';
import FAQsPage from './pages/engagement/FAQsPage';

// Detail Pages
import EventDetailPage from './pages/engagement/EventDetailPage';
import NewsDetailPage from './pages/engagement/NewsDetailPage';
import SchemeDetailPage from './pages/engagement/SchemeDetailPage';
import CalendarPage from './pages/engagement/CalendarPage';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import MyComplaints from './pages/citizen/MyComplaints';
import NewComplaint from './pages/citizen/NewComplaint';
import Announcements from './pages/citizen/Announcements';
import Profile from './pages/citizen/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManageEngagement from './pages/admin/ManageEngagement';
import Analytics from './pages/admin/Analytics';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Status Pages
import PendingApproval from './pages/status/PendingApproval';

function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'Poppins, sans-serif',
              },
            }}
          />
          <Routes>
            {/* Public Routes - HomePage has its own header */}
          <Route path="/" element={<HomePage />} />
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Public Engagement Pages - No Layout wrapper, pages have CitizenNav */}
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/schemes/:id" element={<SchemeDetailPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/faqs" element={<FAQsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />

          {/* Status Pages */}
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Citizen Protected Routes - Pages have their own CitizenNav */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/my-complaints" element={<MyComplaints />} />
            <Route path="/new-complaint" element={<NewComplaint />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/complaints" element={<ManageComplaints />} />
            <Route path="/admin/announcements" element={<ManageAnnouncements />} />
            <Route path="/admin/engagement" element={<ManageEngagement />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </TranslationProvider>
  );
}

export default App;
