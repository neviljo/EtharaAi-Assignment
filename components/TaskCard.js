"use client";

import styles from "@/styles/taskcard.module.css";
import { Clock, Calendar, MessageSquare, User } from "lucide-react";

export default function TaskCard({ task, onClick }) {
  const { title, description, priority, dueDate, assignee } = task;

  // Format date helper
  const getDueDateInfo = () => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    
    // Clear hours for comparison
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = compareDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const isOverdue = diffDays < 0 && task.status !== "DONE";

    return {
      text: isOverdue ? `Overdue (${formattedDate})` : formattedDate,
      isOverdue,
      daysLeft: diffDays,
    };
  };

  const dateInfo = getDueDateInfo();

  // Priority styling class mapping
  const priorityClass = 
    priority === "HIGH" 
      ? styles.priorityHigh 
      : priority === "MEDIUM" 
      ? styles.priorityMedium 
      : styles.priorityLow;

  const getPriorityBadgeClass = () => {
    if (priority === "HIGH") return "badge-high";
    if (priority === "MEDIUM") return "badge-medium";
    return "badge-low";
  };

  return (
    <div className={`${styles.card} ${priorityClass}`} onClick={onClick}>
      <div className={styles.header}>
        <span className={`badge ${getPriorityBadgeClass()}`}>
          {priority.toLowerCase()}
        </span>
      </div>

      <div className={styles.title}>{title}</div>
      
      {description && (
        <div className={styles.desc}>{description}</div>
      )}

      <div className={styles.footer}>
        <div className={styles.dateContainer}>
          {dateInfo && (
            <span className={`${styles.date} ${dateInfo.isOverdue ? styles.dateOverdue : ""}`}>
              <Calendar size={12} />
              {dateInfo.text}
            </span>
          )}
        </div>

        <div className={styles.assigneeContainer}>
          {assignee ? (
            <div 
              className={styles.assigneeAvatar} 
              title={`Assigned to ${assignee.name}`}
            >
              {assignee.name.substring(0, 2)}
            </div>
          ) : (
            <div 
              className={`${styles.assigneeAvatar} ${styles.unassigned}`} 
              title="Unassigned"
            >
              <User size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
