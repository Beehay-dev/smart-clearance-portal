import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Welcome from './Pages/Welcome/Welcome';
import SignIn from './Pages/Sign-in/SignIn';
import SignUp from './Pages/Sign-up/SignUp';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForgotPassword from './Component/LoginComp/ForgotPassword/ForgotPassword';

// Layout for student dashboard
import Dashboard from './Pages/Dashboard/Dashboard';

// Student pages
import Bursary from "./Pages/Student/Bursary/Bursary"
import Library from "./Pages/Student/Library/Library"
import Notification from "./Pages/Student/Notification/Notification"
import Overview from './Pages/Student/Overview/Overview';
import Security from "./Pages/Student/Security/Security"
import Buth from './Pages/Student/BUTH/Buth';
import Hod from './Pages/Student/HOD/Hod';
import Chatbot from './Pages/Student/Chatbot/Chatbot';

// Layout for admin dashboard (super admin)
import AdminDashboard from './Pages/Admin/AdminDashboard';

// Super admin pages
import BursaryReview from './Pages/Admin/Clearance/bursary/BursaryReview'
import ButhReview from './Pages/Admin/Clearance/buth/ButhReview'
import HodReview from './Pages/Admin/Clearance/hod/HodReview'
import LibraryReview from './Pages/Admin/Clearance/library/LibraryReview'
import SecurityReview from './Pages/Admin/Clearance/security/SecurityReview'
import AdminOverview from './Pages/Admin/Clearance/overview/AdminOverview';
import StudentsManagement from './Pages/Admin/Students/StudentsManagement';

// Department admin layout + pages
import DeptDashboard from "./Pages/Admin/DeptDashboard/DeptDashboard";
import DeptOverview from "./Pages/Admin/DeptDashboard/DeptOverview";

function App() {
  return (
    <>
      <Router>
        <ToastContainer
          position="top-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />

        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Student dashboard */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="bursary" element={<Bursary />} />
            <Route path="buth" element={<Buth />} />
            <Route path="hod" element={<Hod />} />
            <Route path="library" element={<Library />} />
            <Route path="security" element={<Security />} />
            <Route path="Notifications" element={<Notification />} />
            <Route path="Chatbot" element={<Chatbot />} />
          </Route>

          {/* Super admin dashboard */}
          <Route path="/admindashboard" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="bursary-review" element={<BursaryReview />} />
            <Route path="buth-review" element={<ButhReview />} />
            <Route path="hod-review" element={<HodReview />} />
            <Route path="library-review" element={<LibraryReview />} />
            <Route path="security-review" element={<SecurityReview />} />
          </Route>

          {/* ── Department admin dashboards ── */}
          <Route
            path="/admindashboard/bursary"
            element={<DeptDashboard dept="bursary" adminType="bursary_admin" />}
          >
            <Route index element={<DeptOverview dept="bursary" />} />
            <Route path="pending"       element={<DeptOverview dept="bursary" filter="pending" />} />
            <Route path="approved"      element={<DeptOverview dept="bursary" filter="approved" />} />
            <Route path="notifications" element={<DeptOverview dept="bursary" filter="notifications" />} />
          </Route>

          <Route
            path="/admindashboard/hod"
            element={<DeptDashboard dept="hod" adminType="hod_admin" />}
          >
            <Route index element={<DeptOverview dept="hod" />} />
            <Route path="pending"       element={<DeptOverview dept="hod" filter="pending" />} />
            <Route path="approved"      element={<DeptOverview dept="hod" filter="approved" />} />
            <Route path="notifications" element={<DeptOverview dept="hod" filter="notifications" />} />
          </Route>

          <Route
            path="/admindashboard/library"
            element={<DeptDashboard dept="library" adminType="library_admin" />}
          >
            <Route index element={<DeptOverview dept="library" />} />
            <Route path="pending"       element={<DeptOverview dept="library" filter="pending" />} />
            <Route path="approved"      element={<DeptOverview dept="library" filter="approved" />} />
            <Route path="notifications" element={<DeptOverview dept="library" filter="notifications" />} />
          </Route>

          <Route
            path="/admindashboard/buth"
            element={<DeptDashboard dept="buth" adminType="buth_admin" />}
          >
            <Route index element={<DeptOverview dept="buth" />} />
            <Route path="pending"       element={<DeptOverview dept="buth" filter="pending" />} />
            <Route path="approved"      element={<DeptOverview dept="buth" filter="approved" />} />
            <Route path="notifications" element={<DeptOverview dept="buth" filter="notifications" />} />
          </Route>

          <Route
            path="/admindashboard/security"
            element={<DeptDashboard dept="security" adminType="security_admin" />}
          >
            <Route index element={<DeptOverview dept="security" />} />
            <Route path="pending"       element={<DeptOverview dept="security" filter="pending" />} />
            <Route path="approved"      element={<DeptOverview dept="security" filter="approved" />} />
            <Route path="notifications" element={<DeptOverview dept="security" filter="notifications" />} />
          </Route>

        </Routes>
      </Router>
    </>
  );
}

export default App;