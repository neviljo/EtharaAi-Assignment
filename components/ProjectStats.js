"use client";

import styles from "@/styles/projectstats.module.css";
import { Folder, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ProjectStats({ projects = [] }) {
  // Aggregate stats across all projects
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((sum, p) => sum + (p.tasksCount || 0), 0);
  const completedTasks = projects.reduce((sum, p) => sum + (p.completedTasksCount || 0), 0);
  const overdueTasks = projects.reduce((sum, p) => sum + (p.overdueTasksCount || 0), 0);
  
  // Calculate completion percentage
  const totalCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // SVG parameters for circular chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalCompletionRate / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* Metrics Row */}
      <div className={styles.grid}>
        
        {/* Total Projects */}
        <div className={`${styles.statCard} ${styles.glowPrimary}`}>
          <span className={styles.statCardTitle}>Projects</span>
          <span className={styles.statCardValue}>{totalProjects}</span>
          <span className={styles.statCardIcon}>
            <Folder size={24} />
          </span>
        </div>

        {/* Total Tasks */}
        <div className={`${styles.statCard} ${styles.glowPrimary}`}>
          <span className={styles.statCardTitle}>Total Tasks</span>
          <span className={styles.statCardValue}>{totalTasks}</span>
          <span className={styles.statCardIcon}>
            <Folder size={24} />
          </span>
        </div>

        {/* Completed Tasks */}
        <div className={`${styles.statCard} ${styles.glowSuccess}`}>
          <span className={styles.statCardTitle}>Completed</span>
          <span className={styles.statCardValue}>{completedTasks}</span>
          <span className={styles.statCardIcon}>
            <CheckCircle size={24} />
          </span>
        </div>

        {/* Overdue Tasks */}
        <div className={`${styles.statCard} ${styles.glowDanger}`}>
          <span className={styles.statCardTitle}>Overdue Tasks</span>
          <span className={styles.statCardValue}>{overdueTasks}</span>
          <span className={styles.statCardIcon}>
            <AlertTriangle size={24} />
          </span>
        </div>

      </div>

      {/* Analytics Visualization Panel */}
      <div className={styles.analyticsArea}>
        
        {/* Radial Progress Chart */}
        <div className={styles.radialCard}>
          <span className={styles.statCardTitle} style={{ marginBottom: "8px" }}>Overall Progress</span>
          
          <div className={styles.circleWrapper}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              {/* Track */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="10"
              />
              {/* Fill Indicator */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
            </svg>
            <div className={styles.circleText}>
              <span className={styles.percentage}>{totalCompletionRate}%</span>
              <span className={styles.percentageLabel}>Completed</span>
            </div>
          </div>
        </div>

        {/* Individual Project Progress Tracker */}
        <div className={styles.projectListCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Project Breakdown</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{totalProjects} active</span>
          </div>

          <div className={styles.projectRows}>
            {projects.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px" }}>
                Create a project to start tracking analytics!
              </div>
            ) : (
              projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className={styles.projectRow}>
                  <div className={styles.projectMeta}>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectPercent}>{project.progress}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div 
                      className={styles.progressBarFill} 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
