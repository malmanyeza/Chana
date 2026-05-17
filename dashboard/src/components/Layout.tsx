import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ title }: { title: string }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title={title} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
