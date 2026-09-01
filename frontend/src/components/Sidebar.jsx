import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  ListChecks,
  Users,
  Tags,
  Database,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth();

  const userLinks = [
    { to: '/user/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/user/my-complaints', icon: <MessageSquare size={20} />, label: 'My Complaints' },
    { to: '/user/my-organization', icon: <Building2 size={20} />, label: 'My Organization' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/organizations', icon: <Building2 size={20} />, label: 'Organizations' },
    { to: '/admin/categories', icon: <Tags size={20} />, label: 'Categories' },
    { to: '/admin/requests', icon: <Users size={20} />, label: 'Requests' },
    { to: '/admin/datasets', icon: <Database size={20} />, label: 'Datasets' },
  ];

  const secondaryAdminLinks = [
    { to: '/secondary-admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/secondary-admin/complaints', icon: <MessageSquare size={20} />, label: 'Complaints' },
    { to: '/secondary-admin/queue', icon: <ListChecks size={20} />, label: 'Priority Queue' },
    { to: '/secondary-admin/dataset', icon: <Database size={20} />, label: 'Dataset' },
  ];

  const links = user.role === 'MAIN_ADMIN'
    ? adminLinks
    : user.role === 'SECONDARY_ADMIN'
      ? secondaryAdminLinks
      : userLinks;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">COMPLAX</div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="nav-item logout-btn"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
