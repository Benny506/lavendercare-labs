// When creating services. Allow for pickup of samples!



import { useState, useMemo } from "react";
import { Container, Offcanvas, Image } from "react-bootstrap";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiHome,
  FiCalendar,
  FiBox,
  FiClipboard,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import "./DashboardLayout.css";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import { supabase } from "../../lib/supabaseClient";
import { clearAuth } from "../../store/slices/authSlice";
import { clearDashboard } from "../../store/slices/dashboardSlice";
import { hideLoader, showLoader, showAlert } from "../../store/slices/uiSlice";

const routesMeta = [
  { path: "/dashboard", title: "Dashboard", subtitle: "Overview & quick stats" },
  { path: "/dashboard/services", title: "Services", subtitle: "Manage lab test services" },
  { path: "/dashboard/booking", title: "Bookings", subtitle: "Incoming & scheduled bookings" },
  { path: "/dashboard/availability", title: "Availability", subtitle: "Set operating hours & holidays" },
  { path: "/dashboard/profile", title: "Profile", subtitle: "Lab profile settings" },
];

const sidebarLinks = [
  {
    label: "Utility",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: <FiHome /> },
      { path: "/dashboard/availability", label: "Availability", icon: <FiCalendar /> },
    ],
  },
  {
    label: "Core",
    items: [
      { path: "/dashboard/services", label: "Services", icon: <FiBox /> },
      { path: "/dashboard/booking", label: "Bookings", icon: <FiClipboard /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { path: "/dashboard/profile", label: "Profile", icon: <FiUser /> },
      { path: "/login", label: "Logout", icon: <FiLogOut /> },
    ],
  },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { labProfile } = useSelector((s) => s.auth);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const meta = useMemo(
    () => routesMeta.find((r) => location.pathname.startsWith(r.path)) || routesMeta[0],
    [location.pathname]
  );

  const renderSidebarLinks = () =>
    sidebarLinks.map((section) => (
      <div key={section.label} className="lc-sidebar-section">
        <div className="lc-section-title">{section.label}</div>
        <div className="lc-section-items">
          {section.items.map((link) =>
            link.label.toLowerCase() === "logout" ? (
              <button
                key={link.path}
                type="button"
                className="lc-sidebar-link"
                onClick={() => setShowLogoutConfirm(true)}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ) : (
              <NavLink key={link.path} to={link.path} end={link.path === "/dashboard"} className="lc-sidebar-link">
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            )
          )}
        </div>
      </div>
    ));

  return (
    <div className="lc-shell">
      <div className="lc-dashboard">

        {/* Sidebar */}
        <aside className="lc-sidebar d-none d-lg-flex">
          <div className="lc-sidebar-brand">
            <img src="/logo.svg" alt="LavenderCare" />
            <span>LavenderCare</span>
          </div>
          <nav className="lc-sidebar-nav">{renderSidebarLinks()}</nav>
        </aside>

        {/* Main content */}
        <div className="lc-main-content">
          {/* Topbar */}
          <header className="lc-topbar">
            <button
              className="lc-menu-btn d-lg-none"
              onClick={() => setShowSidebar(true)}
            >
              ☰
            </button>
            <div className="lc-topbar-title">
              <h1>{meta.title}</h1>
              <p>{meta.subtitle}</p>
            </div>
            <div className="lc-topbar-user">
              <Image src={labProfile?.profile_img || "/logo.png"} roundedCircle />
              <span>{labProfile?.name || "Lab"}</span>
            </div>
          </header>

          {/* Content */}
          <main className="lc-content p-3">
            <Container fluid className="m-0 p-0">
              <Outlet />
            </Container>
          </main>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton />
        <Offcanvas.Body>
          <div className="lc-sidebar-brand">
            <img src="/logo.png" alt="LavenderCare" />
            <span>LavenderCare</span>
          </div>
          <nav className="lc-sidebar-nav">{renderSidebarLinks()}</nav>
        </Offcanvas.Body>
      </Offcanvas>
      <ConfirmModal
        show={showLogoutConfirm}
        title="Confirm Logout"
        text="Are you sure you want to sign out of LavenderCare Labs?"
        type="warning"
        confirmLabel="Logout"
        confirmVariant="danger"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          dispatch(showLoader("Signing out..."));
          try {
            await supabase.auth.signOut();
            dispatch(clearAuth());
            dispatch(clearDashboard());
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: "success",
                message: "Signed out successfully.",
                duration: 4000,
              })
            );
            navigate("/login", { replace: true });
          } catch (_e) {
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: "error",
                message: "Failed to sign out. Please try again.",
                duration: 6000,
              })
            );
          } finally {
            dispatch(hideLoader());
          }
        }}
      />
    </div>
  );
}
