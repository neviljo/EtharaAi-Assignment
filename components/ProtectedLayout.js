"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDesc }),
      });

      const data = await res.json();
      if (res.ok) {
        setProjectName("");
        setProjectDesc("");
        setIsModalOpen(false);
        // Redirect to the new project detail board
        router.push(`/projects/${data.project.id}`);
      } else {
        setError(data.error || "Failed to create project");
      }
    } catch (err) {
      console.error("Create project error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (!user) {
    return null; // Will trigger redirect in AuthContext
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Sidebar navigation */}
      <Sidebar onAddProject={() => setIsModalOpen(true)} />

      {/* Main content body */}
      <main 
        style={{ 
          marginLeft: "var(--sidebar-width)", 
          padding: "40px 48px", 
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

      {/* Reusable Create Project Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setError("");
        }} 
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div 
              style={{ 
                color: "var(--danger)", 
                fontSize: "0.85rem", 
                background: "var(--danger-glow)", 
                padding: "10px", 
                borderRadius: "6px" 
              }}
            >
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Project Name</label>
            <input
              type="text"
              className="input-field"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Website Launch, App Redesign"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea
              className="input-field"
              rows={3}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Brief description of the project goals..."
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setIsModalOpen(false);
                setError("");
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={creating || !projectName.trim()}
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
