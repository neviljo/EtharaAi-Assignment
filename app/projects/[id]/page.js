"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import TaskCard from "@/components/TaskCard";
import TaskDrawer from "@/components/TaskDrawer";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";
import styles from "@/styles/project.module.css";
import { 
  UserPlus, 
  Plus, 
  KanbanSquare, 
  List, 
  Trash2, 
  Trash
} from "lucide-react";

export default function ProjectPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const { id: projectId } = use(params);

  const [project, setProject] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("kanban"); // "kanban" or "list"

  // Drawer States
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  // Modal States
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // New Task Form States
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("LOW");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskCreating, setTaskCreating] = useState(false);
  const [taskError, setTaskError] = useState("");

  // New Member Form States
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [memberAdding, setMemberAdding] = useState(false);
  const [memberError, setMemberError] = useState("");

  const isAdmin = currentUserRole === "ADMIN";

  useEffect(() => {
    let mounted = true;
    fetch(`/api/projects/${projectId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!mounted) return;
        if (data?.project) {
          setProject(data.project);
          setCurrentUserRole(data.currentUserRole);
        } else {
          router.push("/dashboard");
        }
      })
      .catch(err => {
        console.error("Error fetching project details:", err);
        if (mounted) router.push("/dashboard");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [projectId, router]);

  // Task Handlers
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    // Update local task state in project object
    setProject((prev) => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map((t) => 
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      );
      return { ...prev, tasks: updatedTasks };
    });

    // If updated task is open in drawer, update its details
    setSelectedTask((prev) => (prev && prev.id === updatedTask.id ? { ...prev, ...updatedTask } : prev));
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.filter((t) => t.id !== deletedTaskId) };
    });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setTaskCreating(true);
    setTaskError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssigneeId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setTaskPriority("LOW");
        setTaskDueDate("");
        setTaskAssigneeId("");
        setIsAddTaskOpen(false);
        // Refresh project tasks
        setProject((prev) => ({
          ...prev,
          tasks: [data.task, ...prev.tasks],
        }));
      } else {
        setTaskError(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error("Add task error:", err);
      setTaskError("An unexpected error occurred.");
    } finally {
      setTaskCreating(false);
    }
  };

  // Member Handlers
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setMemberAdding(true);
    setMemberError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: memberEmail,
          role: memberRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMemberEmail("");
        setMemberRole("MEMBER");
        setIsAddMemberOpen(false);
        // Append member
        setProject((prev) => ({
          ...prev,
          members: [...prev.members, data.member],
        }));
      } else {
        setMemberError(data.error || "Failed to add member");
      }
    } catch (err) {
      console.error("Add member error:", err);
      setMemberError("An unexpected error occurred.");
    } finally {
      setMemberAdding(false);
    }
  };

  const handleMemberRoleChange = async (memberId, newRole) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setProject((prev) => {
          if (!prev) return prev;
          const updatedMembers = prev.members.map((m) =>
            m.id === memberId ? { ...m, role: data.member.role } : m
          );
          return { ...prev, members: updatedMembers };
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
        fetchProjectDetails(); // Re-sync to restore select value
      }
    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProject((prev) => {
          if (!prev) return prev;
          // Filter out deleted member
          const updatedMembers = prev.members.filter((m) => m.id !== memberId);
          // If the deleted member was an assignee, set assigneeId to null in local state
          const targetMember = prev.members.find((m) => m.id === memberId);
          const updatedTasks = prev.tasks.map((t) => 
            t.assigneeId === targetMember?.userId ? { ...t, assigneeId: null, assignee: null } : t
          );
          return { ...prev, members: updatedMembers, tasks: updatedTasks };
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Remove member error:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this project and all its tasks/comments. Proceed?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <Loading />
      </ProtectedLayout>
    );
  }

  if (!project) return null;

  // Filter tasks into board columns
  const tasksTodo = project.tasks.filter((t) => t.status === "TODO");
  const tasksInProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS");
  const tasksInReview = project.tasks.filter((t) => t.status === "IN_REVIEW");
  const tasksDone = project.tasks.filter((t) => t.status === "DONE");

  return (
    <ProtectedLayout>
      <div className={styles.container}>
        
        {/* Project Header Banner */}
        <div className={styles.header}>
          <div className={styles.meta}>
            <h1 className={styles.title}>{project.name}</h1>
            {project.description && <p className={styles.desc}>{project.description}</p>}
          </div>

          <div className={styles.actions}>
            {isAdmin && (
              <>
                <button className="btn btn-secondary" onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus size={16} />
                  <span className={styles.btnLabel}>Add Member</span>
                </button>
                <button className="btn btn-primary" onClick={() => setIsAddTaskOpen(true)}>
                  <Plus size={16} />
                  <span className={styles.btnLabel}>Add Task</span>
                </button>
                <button className="btn btn-danger" onClick={handleDeleteProject} title="Delete Project">
                  <Trash size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Board vs List Tabs Toggle */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "kanban" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("kanban")}
          >
            <KanbanSquare size={16} />
            Kanban Board
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "list" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <List size={16} />
            All Tasks ({project.tasks.length})
          </button>
        </div>

        {/* Main Work Area Layout */}
        <div className={styles.workspaceGrid}>
          
          {/* Main Board view */}
          {activeTab === "kanban" ? (
            <div className={styles.boardColumns}>
              
              {/* To Do Column */}
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnTitle} ${styles.todoTitle}`}>To Do</span>
                  <span className={styles.columnCount}>{tasksTodo.length}</span>
                </div>
                <div className={styles.columnBody}>
                  {tasksTodo.length === 0 ? (
                    <div className={styles.columnEmpty}>No tasks to do</div>
                  ) : (
                    tasksTodo.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                    ))
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnTitle} ${styles.inProgressTitle}`}>In Progress</span>
                  <span className={styles.columnCount}>{tasksInProgress.length}</span>
                </div>
                <div className={styles.columnBody}>
                  {tasksInProgress.length === 0 ? (
                    <div className={styles.columnEmpty}>No tasks in progress</div>
                  ) : (
                    tasksInProgress.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                    ))
                  )}
                </div>
              </div>

              {/* In Review Column */}
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnTitle} ${styles.inReviewTitle}`}>In Review</span>
                  <span className={styles.columnCount}>{tasksInReview.length}</span>
                </div>
                <div className={styles.columnBody}>
                  {tasksInReview.length === 0 ? (
                    <div className={styles.columnEmpty}>No tasks in review</div>
                  ) : (
                    tasksInReview.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                    ))
                  )}
                </div>
              </div>

              {/* Done Column */}
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnTitle} ${styles.doneTitle}`}>Done</span>
                  <span className={styles.columnCount}>{tasksDone.length}</span>
                </div>
                <div className={styles.columnBody}>
                  {tasksDone.length === 0 ? (
                    <div className={styles.columnEmpty}>No completed tasks</div>
                  ) : (
                    tasksDone.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Tabular List View */
            <div className={styles.listView}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Task Title</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Priority</th>
                    <th className={styles.th}>Assignee</th>
                    <th className={styles.th}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {project.tasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={styles.td} style={{ textAlign: "center", fontStyle: "italic", padding: "40px" }}>
                        No tasks created in this project.
                      </td>
                    </tr>
                  ) : (
                    project.tasks.map((task) => (
                      <tr key={task.id} className={styles.tr} onClick={() => handleTaskClick(task)}>
                        <td className={`${styles.td} ${styles.listTitle}`}>{task.title}</td>
                        <td className={styles.td}>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            fontWeight: "600",
                            color: task.status === "DONE" 
                              ? "var(--success)" 
                              : task.status === "IN_REVIEW" 
                              ? "var(--warning)" 
                              : task.status === "IN_PROGRESS" 
                              ? "var(--info)" 
                              : "var(--text-muted)"
                          }}>
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={`badge ${
                            task.priority === "HIGH" 
                              ? "badge-high" 
                              : task.priority === "MEDIUM" 
                              ? "badge-medium" 
                              : "badge-low"
                          }`}>
                            {task.priority.toLowerCase()}
                          </span>
                        </td>
                        <td className={styles.td}>{task.assignee ? task.assignee.name : "Unassigned"}</td>
                        <td className={styles.td}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sidebar - Team Management Panel */}
          <div className={styles.membersPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Project Team</span>
              <span className={styles.columnCount}>{project.members.length} members</span>
            </div>

            <div className={styles.membersList}>
              {project.members.map((member) => {
                const isMemberAdmin = member.role === "ADMIN";
                const isSelf = member.user.id === member.projectId; // Wait, actually compare member.userId to user session ID. But let's check: can this member edit? Yes, if current user is ADMIN, and member.userId !== currentUserId.
                // To keep it simple: project admin can change anyone else's role, but cannot remove/downgrade the last admin.
                return (
                  <div key={member.id} className={styles.memberRow}>
                    <div className={styles.memberInfo}>
                      <div className={`${styles.avatar} ${isMemberAdmin ? styles.avatarAdmin : ""}`}>
                        {member.user.name.substring(0, 2)}
                      </div>
                      <div className={styles.memberDetails}>
                        <span className={styles.memberName} title={member.user.name}>{member.user.name}</span>
                        <span className={styles.memberEmail} title={member.user.email}>{member.user.email}</span>
                      </div>
                    </div>

                    <div className={styles.memberActions}>
                      {isAdmin && member.userId !== user?.id ? (
                        <>
                          <select
                            className={styles.roleSelect}
                            value={member.role}
                            onChange={(e) => handleMemberRoleChange(member.id, e.target.value)}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button 
                            className={styles.removeBtn} 
                            onClick={() => handleRemoveMember(member.id, member.user.name)}
                            title="Remove from project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <span className={`${styles.roleBadge} ${isMemberAdmin ? styles.roleBadgeAdmin : ""}`}>
                          {isMemberAdmin ? "Admin" : "Member"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Task Detail Drawer */}
        <TaskDrawer
          isOpen={isTaskDrawerOpen}
          onClose={() => setIsTaskDrawerOpen(false)}
          task={selectedTask}
          currentUserRole={currentUserRole}
          projectMembers={project.members}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />

        {/* Modal: Create Task (Admin Only) */}
        <Modal 
          isOpen={isAddTaskOpen} 
          onClose={() => {
            setIsAddTaskOpen(false);
            setTaskError("");
          }} 
          title="Create New Task"
        >
          <form onSubmit={handleAddTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {taskError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", background: "var(--danger-glow)", padding: "10px", borderRadius: "6px" }}>
                {taskError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Task Title</label>
              <input
                type="text"
                className="input-field"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Describe the objective..."
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description (Optional)</label>
              <textarea
                className="input-field"
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Provide task context, requirements, etc."
                style={{ resize: "vertical" }}
              />
            </div>

            <div className={styles.boardColumns} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 0 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Priority</label>
                <select
                  className="input-field"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Due Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Assignee</label>
              <select
                className="input-field"
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {project.members.map((member) => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={taskCreating || !taskTitle.trim()}>
                {taskCreating ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Add Member (Admin Only) */}
        <Modal 
          isOpen={isAddMemberOpen} 
          onClose={() => {
            setIsAddMemberOpen(false);
            setMemberError("");
          }} 
          title="Add Team Member"
        >
          <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {memberError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", background: "var(--danger-glow)", padding: "10px", borderRadius: "6px" }}>
                {memberError}
              </div>
            )}

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Enter the email address of a registered user to add them to this project.
            </p>

            <div className="input-group">
              <label className="input-label">User Email Address</label>
              <input
                type="email"
                className="input-field"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="collaborator@company.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Project Role</label>
              <select
                className="input-field"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
              >
                <option value="MEMBER">Member (Read board, write comments, update assigned task status)</option>
                <option value="ADMIN">Admin (Full write access to tasks, project memberships, roles, settings)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={memberAdding || !memberEmail.trim()}>
                {memberAdding ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedLayout>
  );
}
