"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/taskdrawer.module.css";
import { 
  X, 
  Calendar, 
  User, 
  AlertCircle, 
  Send, 
  Trash2, 
  Edit3, 
  Check,
  MessageSquare
} from "lucide-react";

export default function TaskDrawer({ 
  isOpen, 
  onClose, 
  task, 
  currentUserRole, 
  projectMembers = [], 
  onTaskUpdated, 
  onTaskDeleted 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // Editing state for Admin
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDesc, setEditedDesc] = useState("");
  const [editedPriority, setEditedPriority] = useState("");
  const [editedDueDate, setEditedDueDate] = useState("");
  const [editedAssigneeId, setEditedAssigneeId] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = currentUserRole === "ADMIN";

  // Fetch comments when task changes
  useEffect(() => {
    if (!task) return;
    let mounted = true;
    fetch(`/api/tasks/${task.id}/comments`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted) setComments(data?.comments || []);
      })
      .catch(err => console.error("Error fetching comments:", err))
      .finally(() => { if (mounted) setCommentsLoading(false); });
    return () => { mounted = false; };
  }, [task]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        onTaskUpdated(data.task);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editedTitle.trim()) {
      setError("Title is required");
      return;
    }

    setUpdatingTask(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDesc,
          priority: editedPriority,
          dueDate: editedDueDate || null,
          assigneeId: editedAssigneeId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        onTaskUpdated(data.task);
      } else {
        setError(data.error || "Failed to update task details");
      }
    } catch (err) {
      console.error("Task details save error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onClose();
        onTaskDeleted(task.id);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete task");
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Comment submission error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!isOpen || !task) return null;

  // Format date for display
  const displayDueDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) 
    : "No due date set";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <span className={styles.headerSub}>Task Details</span>
            <div className={styles.headerTitle}>{task.title}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          
          {/* Quick Status Select (Accessible by Members & Admins) */}
          <div className={styles.section}>
            <span className={styles.label}>Task Status</span>
            <select
              className="input-field"
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ fontWeight: 500 }}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Edit Mode Toggle & Actions for ADMIN */}
          {isAdmin && (
            <div className={styles.adminActions}>
              {!isEditing ? (
                <>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditedTitle(task.title || "");
                      setEditedDesc(task.description || "");
                      setEditedPriority(task.priority || "LOW");
                      setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
                      setEditedAssigneeId(task.assigneeId || "");
                      setError("");
                      setIsEditing(true);
                    }}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    <Edit3 size={14} />
                    Edit Details
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteTask}
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          )}

          {/* Details / Edit Form */}
          {!isEditing ? (
            <>
              {/* Description Display */}
              <div className={styles.section}>
                <span className={styles.label}>Description</span>
                {task.description ? (
                  <p className={styles.descText}>{task.description}</p>
                ) : (
                  <span className={styles.noDesc}>No description provided.</span>
                )}
              </div>

              {/* Meta Grid */}
              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Priority</span>
                  <span className={styles.metaVal}>
                    <AlertCircle size={16} style={{ color: `var(--priority-${task.priority.toLowerCase()})` }} />
                    <span style={{ textTransform: "capitalize" }}>{task.priority.toLowerCase()}</span>
                  </span>
                </div>

                <div className={styles.metaCard}>
                  <span className={styles.label}>Due Date</span>
                  <span className={styles.metaVal}>
                    <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.8rem" }}>{displayDueDate}</span>
                  </span>
                </div>
              </div>

              {/* Assignee & Creator */}
              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Assignee</span>
                  <span className={styles.metaVal}>
                    <User size={16} style={{ color: "var(--text-muted)" }} />
                    <span>{task.assignee ? task.assignee.name : "Unassigned"}</span>
                  </span>
                </div>

                <div className={styles.metaCard}>
                  <span className={styles.label}>Created By</span>
                  <span className={styles.metaVal}>
                    <User size={16} style={{ color: "var(--text-muted)" }} />
                    <span>{task.creator ? task.creator.name : "System"}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Admin Edit Form */
            <form onSubmit={handleSaveDetails} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.85rem", background: "var(--danger-glow)", padding: "10px", borderRadius: "6px" }}>
                  {error}
                </div>
              )}
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Task Title</span>
                <input
                  type="text"
                  className="input-field"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Description</span>
                <textarea
                  className="input-field"
                  rows={3}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  placeholder="Describe the task details..."
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className={styles.metaGrid}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Priority</span>
                  <select
                    className="input-field"
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Due Date</span>
                  <input
                    type="date"
                    className="input-field"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Assignee</span>
                <select
                  className="input-field"
                  value={editedAssigneeId}
                  onChange={(e) => setEditedAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member.id} value={member.user.id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatingTask}
                style={{ marginTop: "8px" }}
              >
                <Check size={16} />
                {updatingTask ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {/* Comments Section (Accessible to all project members) */}
          <div className={styles.commentSection}>
            <span className={styles.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MessageSquare size={14} />
              Comments ({comments.length})
            </span>

            <div className={styles.commentList}>
              {commentsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet. Start the conversation!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className={styles.commentCard}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentUser}>{comment.user.name}</span>
                      <span className={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className={styles.commentBody}>{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className={styles.commentInputForm}>
              <textarea
                className={styles.commentTextarea}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
              <button
                type="submit"
                className={styles.commentSubmitBtn}
                disabled={submittingComment || !newComment.trim()}
                title="Post Comment"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
