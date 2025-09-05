// src/components/Layout/Layout.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

// Example Header component (you can customize further)
const Header = ({ role }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center">
    <h1 className="text-xl font-bold">My App</h1>
    <span className="text-gray-600">Role: {role}</span>
  </header>
);

const Layout = ({ children, showHeader = true }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Render header only if allowed */}
      {showHeader && user?.role && <Header role={user.role} />}

      {/* Main content always expands */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
