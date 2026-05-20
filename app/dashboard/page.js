"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import ProjectStats from "@/components/ProjectStats";
import Loading from "@/components/Loading";
import { Folder, ArrowRight, KanbanSquare, Shield } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/projects")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted) setProjects(data?.projects || []);
      })
      .catch(err => console.error("Dashboard projects fetch error:", err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <ProtectedLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }} className="animate-fade-in">
        
        {/* Top Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Workspace Dashboard
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Overview of your team&apos;s project progression and active tasks.
            </p>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : projects.length === 0 ? (
          /* Empty State */
          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "80px 24px",
              background: "var(--glass-bg)",
              border: "1px dashed var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              gap: "20px"
            }}
          >
            <div style={{ padding: "16px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.05)", color: "var(--primary)" }}>
              <Folder size={48} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                No Active Projects
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "380px" }}>
                You aren&apos;t a member of any projects yet. Create a project to start assigning and tracking tasks.
              </p>
            </div>
            {/* Note: The "+" button in the sidebar will also trigger project creation */}
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Click the <strong style={{ color: "var(--primary)" }}>+</strong> icon in the sidebar to create your first project.
            </span>
          </div>
        ) : (
          /* Analytics & Project Cards Grid */
          <>
            {/* Stat Widgets */}
            <ProjectStats projects={projects} />

            {/* Detailed Projects Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--text-primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                Active Workspaces
              </h2>
              
              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                  gap: "20px" 
                }}
              >
                {projects.map((project) => {
                  const isAdmin = project.role === "ADMIN";
                  return (
                    <div key={project.id} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* Project Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>
                            {project.name}
                          </h3>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span 
                          className="badge" 
                          style={{ 
                            background: isAdmin ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.05)",
                            color: isAdmin ? "var(--primary)" : "var(--text-secondary)",
                            border: `1px solid ${isAdmin ? "rgba(99, 102, 241, 0.15)" : "var(--glass-border)"}`,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Shield size={10} />
                          {isAdmin ? "Admin" : "Member"}
                        </span>
                      </div>

                      {/* Project Description */}
                      {project.description ? (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineLength: "1.4", minHeight: "38px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {project.description}
                        </p>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", minHeight: "38px" }}>
                          No description provided.
                        </span>
                      )}

                      {/* Project Stats Summary */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Tasks</span>
                          <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{project.tasksCount} total</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Members</span>
                          <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{project.membersCount} active</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                          <span style={{ color: "var(--text-muted)" }}>Completion</span>
                          <span style={{ fontWeight: 600 }}>{project.progress}%</span>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden" }}>
                          <div 
                            style={{ 
                              height: "100%", 
                              background: "linear-gradient(90deg, var(--primary) 0%, var(--info) 100%)", 
                              width: `${project.progress}%` 
                            }} 
                          />
                        </div>
                      </div>

                      {/* Action Link */}
                      <Link 
                        href={`/projects/${project.id}`}
                        className="btn btn-secondary" 
                        style={{ marginTop: "8px", justifyContent: "space-between", fontSize: "0.85rem", padding: "10px 16px" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <KanbanSquare size={14} />
                          Open Board
                        </span>
                        <ArrowRight size={14} />
                      </Link>

                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </ProtectedLayout>
  );
}
