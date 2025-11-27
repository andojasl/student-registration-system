'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { createGroup, updateGroup, deleteGroup, checkGroupMembers, getGroupsByCourse } from "@/app/lecturer/courses/actions";

interface Group {
  id: number;
  name: string;
  description: string | null;
  course_id: number;
  member_count: number;
}

interface GroupsManagementProps {
  courseId: number;
  initialGroups: Group[];
}

export function GroupsManagement({ courseId, initialGroups }: GroupsManagementProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadGroups() {
    setIsLoadingGroups(true);
    try {
      const groupsData = await getGroupsByCourse(courseId);
      setGroups(groupsData);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoadingGroups(false);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!formData. name. trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createGroup({
        name: formData.name,
        description: formData. description,
        course_id: courseId,
      });
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      await loadGroups();
    } catch (err) {
      console. error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGroup || !formData.name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateGroup(editingGroup.id, {
        name: formData.name,
        description: formData. description,
      });
      setEditingGroup(null);
      setFormData({ name: '', description: '' });
      await loadGroups();
    } catch (err) {
      console. error('Error updating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClick(group: Group) {
    try {
      const memberCount = await checkGroupMembers(group.id);
      setDeleteConfirmation({ groupId: group.id, memberCount, name: group.name });
    } catch (err) {
      console.error('Error checking members:', err);
      setError('Failed to check group members');
    }
  }

  async function handleConfirmDelete() {
    if (! deleteConfirmation) return;

    setLoading(true);
    setError(null);
    try {
      await deleteGroup(deleteConfirmation.groupId);
      setDeleteConfirmation(null);
      await loadGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(group: Group) {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
    setShowCreateForm(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Groups</CardTitle>
              <CardDescription>
                Create and manage student groups for this course
              </CardDescription>
            </div>
            {! showCreateForm && ! editingGroup && (
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingGroup) && (
            <div className="border border-input rounded-lg p-4 bg-accent/30">
              <h3 className="font-semibold mb-4">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h3>
              <form
                onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="group_name" className="block text-sm font-medium">
                    Group Name *
                  </label>
                  <input
                    id="group_name"
                    type="text"
                    placeholder="e.g., Group A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ... formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="group_description" className="block text-sm font-medium">
                    Description (Optional)
                  </label>
                  <textarea
                    id="group_description"
                    placeholder="Group description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                  >
                    {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingGroup(null);
                      setFormData({ name: '', description: '' });
                      setError(null);
                    }}
                    disabled={loading}
                    className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Groups List */}
          {isLoadingGroups ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading groups...
            </div>
          ) : groups. length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showCreateForm || editingGroup
                ? 'No groups yet. Create one above.'
                : 'No groups created yet. Click "New Group" to get started.'}
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="border border-input rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{group.name}</h4>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(group)}
                        className="p-2 hover:bg-background rounded-md transition-colors text-foreground hover:text-primary"
                        title="Edit group"
                        disabled={loading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(group)}
                        className="p-2 hover:bg-background rounded-md transition-colors text-foreground hover:text-destructive"
                        title="Delete group"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="border-destructive/50 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Group
              </CardTitle>
              <CardDescription>
                This action cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="font-semibold mb-2">
                  Are you sure you want to delete this group?
                </p>
                <div className="bg-background rounded p-3">
                  <p>
                    <span className="font-medium">Group Name:</span>{' '}
                    {deleteConfirmation.name}
                  </p>
                </div>
              </div>

              {deleteConfirmation.memberCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <span className="font-semibold">Warning:</span> This group has{' '}
                    <span className="font-semibold">
                      {deleteConfirmation.memberCount}
                    </span>{' '}
                    student member{deleteConfirmation.memberCount !== 1 ? 's' : ''}{' '}
                    associated with it.  Deleting this group will also remove all these
                    members. 
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {deleteConfirmation.memberCount > 0
                  ? 'All associated student members will be permanently removed along with this group.'
                  : 'This group has no members. '}
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  {loading ? 'Deleting.. .' : 'Delete Group'}
                </button>
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={loading}
                  className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}