"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { BookmarksList, type BookmarkItem, type BookmarksData } from "@/components/bookmarks-list"
import { SeatMapModal } from "@/components/seat-map-modal"
import { AlertManagementDialog, type AlertConfig } from "@/components/alert-management-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DashboardClientProps {
  onBookmarksDataChange?: (data: BookmarksData | null) => void
  onSeatMapOpen?: (bookmark: BookmarkItem) => void
}

export function DashboardClient({ onBookmarksDataChange, onSeatMapOpen }: DashboardClientProps) {
  const [selectedBookmarkForSeatMap, setSelectedBookmarkForSeatMap] = useState<BookmarkItem | null>(null)
  const [selectedBookmarkForAlert, setSelectedBookmarkForAlert] = useState<BookmarkItem | null>(null)
  const [alertManagementOpen, setAlertManagementOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookmarkToDelete, setBookmarkToDelete] = useState<BookmarkItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [seatMapLoading, setSeatMapLoading] = useState(false)
  const [loadingBookmarkId, setLoadingBookmarkId] = useState<string | null>(null)

  // Function to handle viewing seat map
  const handleViewSeatMap = useCallback((bookmark: BookmarkItem) => {
    if (onSeatMapOpen) {
      onSeatMapOpen(bookmark)
    } else {
      // Fallback to local state if no callback provided
      setLoadingBookmarkId(bookmark.bookmarkId)
      setSelectedBookmarkForSeatMap(bookmark)
      setSeatMapLoading(true)
    }
  }, [onSeatMapOpen])

  // Function to handle setting an alert
  const handleSetAlert = useCallback((bookmark: BookmarkItem) => {
    console.log('Set alert for bookmark:', bookmark.bookmarkId, bookmark.title)
  }, [])

  // Function to handle viewing/managing an existing alert
  const handleViewAlert = useCallback((bookmark: BookmarkItem) => {
    setSelectedBookmarkForAlert(bookmark)
    setAlertManagementOpen(true)
  }, [])

  // Function to handle delete confirmation
  const handleDeleteClick = useCallback((bookmark: BookmarkItem) => {
    setBookmarkToDelete(bookmark)
    setDeleteModalOpen(true)
  }, [])

  // Function to delete bookmark
  const deleteBookmark = useCallback(async () => {
    if (!bookmarkToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkToDelete.bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Close modal and reset state
        setDeleteModalOpen(false)
        setBookmarkToDelete(null)
        // Trigger a refresh of the bookmarks list
        window.location.reload()
      } else {
        console.error('Delete failed:', result.message)
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [bookmarkToDelete])

  // Function to cancel delete
  const cancelDelete = useCallback(() => {
    setDeleteModalOpen(false)
    setBookmarkToDelete(null)
  }, [])

  // Function to update an alert
  const handleUpdateAlert = useCallback(async (bookmarkId: string, alertConfig: AlertConfig) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}/alert`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ alertThreshold: alertConfig.alertThreshold }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the selected bookmark if it's the same one being edited
        if (selectedBookmarkForAlert?.bookmarkId === bookmarkId) {
          setSelectedBookmarkForAlert(prev => prev ? { ...prev, alertConfig } : null)
        }
        // Refresh the page to update bookmark list and stats
        window.location.reload()
      } else {
        console.error('Failed to update alert:', result.message)
      }
    } catch (error) {
      console.error('Failed to update alert:', error)
    }
  }, [selectedBookmarkForAlert])

  // Function to delete an alert
  const handleDeleteAlert = useCallback(async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}/alert`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Alert deleted successfully, refresh the page to update the list
        console.log('Alert deleted successfully')
        window.location.reload()
      } else {
        console.error('Failed to delete alert:', result.message)
      }
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }, [])

  // Handle closing seat map modal
  const handleCloseSeatMap = useCallback(() => {
    setSelectedBookmarkForSeatMap(null)
    setLoadingBookmarkId(null)
    setSeatMapLoading(false)
  }, [])

  // If seat map is open, show the modal
  if (selectedBookmarkForSeatMap) {
    return (
      <SeatMapModal
        selectedBookmark={selectedBookmarkForSeatMap}
        onClose={handleCloseSeatMap}
        seatMapLoading={seatMapLoading}
        setSeatMapLoading={setSeatMapLoading}
      />
    )
  }

  return (
    <>
      <BookmarksList
        onViewSeatMap={handleViewSeatMap}
        onSetAlert={handleSetAlert}
        onViewAlert={handleViewAlert}
        onDeleteClick={handleDeleteClick}
        seatMapLoading={loadingBookmarkId}
        onBookmarksDataChange={onBookmarksDataChange}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Bookmark
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this bookmark? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {bookmarkToDelete && (
            <div className="bg-gray-50 rounded-lg p-3 my-4">
              <div className="font-medium text-gray-900">{bookmarkToDelete.title}</div>
              <div className="text-sm text-gray-600">
                {bookmarkToDelete.itemType === 'BOOKMARK' ? 'Flight Bookmark' : 'Saved Search'}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteBookmark}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Management Dialog */}
      <AlertManagementDialog
        isOpen={alertManagementOpen}
        onOpenChange={setAlertManagementOpen}
        bookmark={selectedBookmarkForAlert}
        onUpdateAlert={handleUpdateAlert}
        onDeleteAlert={handleDeleteAlert}
      />
    </>
  )
}