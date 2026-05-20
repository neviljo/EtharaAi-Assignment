"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/sidebar.module.css";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Plus, 
  LogOut,
  Loader2 
} from "lucide-react";

export default function Sidebar({ onAddProject }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetch("/api/projects")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted) setProjects(data?.projects || []);
      })
      .catch(err => console.error("Error fetching projects for sidebar:", err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user, pathname]);

  if (!user) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>
          <FolderKanban size={24} />
        </span>
        Aetheria Tasks
      </div>

      <nav className={styles.nav}>
        <Link 
          href="/dashboard"
          className={`${styles.navItem} ${pathname === "/dashboard" ? styles.navItemActive : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        <div className={styles.projectsHeader}>
          <span>My Projects</span>
          <button 
            className={styles.addProjectBtn} 
            onClick={onAddProject}
            title="Create Project"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className={styles.projectList}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "12px" }}>
              <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "12px", textAlign: "center" }}>
              No projects yet
            </div>
          ) : (
            projects.map((project) => {
              const isActive = pathname === `/projects/${project.id}`;
              const isAdmin = project.role === "ADMIN";
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ""}`}
                >
                  <div className={styles.projectText} title={project.name}>
                    {project.name}
                  </div>
                  <span className={`${styles.projectRoleBadge} ${isAdmin ? styles.projectRoleBadgeAdmin : ""}`}>
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      <div className={styles.profileSection}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>
            {user.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className={styles.profileDetails}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.email}>{user.email}</span>
          </div>
        </div>
        
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
