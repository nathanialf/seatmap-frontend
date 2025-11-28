"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bell, Trash2 } from 'lucide-react'
import { BookmarkItem } from "@/components/saved-item-card"

interface BookmarkAlertModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookmark: BookmarkItem | null
  mode: 'create' | 'view' | 'edit'
  onSaveAlert?: (bookmarkId: string, threshold: number) => Promise<void>
  onRemoveAlert?: (bookmarkId: string) => Promise<void>
  className?: string
}

const BookmarkAlertModal: React.FC<BookmarkAlertModalProps> = ({
  isOpen,
  onOpenChange,
  bookmark,
  mode,
  onSaveAlert,
  onRemoveAlert,
  className = ""
}) => {
  const [alertThreshold, setAlertThreshold] = useState(
    bookmark?.alertConfig?.alertThreshold || (bookmark?.itemType === 'BOOKMARK' ? 10 : 25)
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveAlert = async () => {
    if (!bookmark || !onSaveAlert) return

    setIsLoading(true)
    try {
      await onSaveAlert(bookmark.bookmarkId, alertThreshold)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save alert:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAlert = async () => {
    if (!bookmark || !onRemoveAlert) return

    setIsLoading(true)
    try {
      await onRemoveAlert(bookmark.bookmarkId)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to remove alert:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!bookmark) return null

  const isFlightBookmark = bookmark.itemType === 'BOOKMARK'
  const thresholdLabel = isFlightBookmark ? 'seats' : '%'
  const thresholdDescription = isFlightBookmark 
    ? 'Get notified when available seats drop below this number'
    : 'Get notified when flights on this route have availability above this percentage'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {mode === 'create' ? 'Set Alert' : mode === 'view' ? 'View Alert' : 'Edit Alert'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Configure an alert for this bookmark'
              : mode === 'view'
              ? 'Alert details and settings'
              : 'Update your alert settings'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bookmark Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">{bookmark.title}</div>
            <div className="text-sm text-gray-600">
              {bookmark.itemType === 'BOOKMARK' ? 'Flight Bookmark' : 'Saved Search'}
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="space-y-3">
            <Label htmlFor="threshold" className="text-sm font-medium">
              Alert Threshold
            </Label>
            <p className="text-xs text-gray-500">{thresholdDescription}</p>
            
            <div className="flex items-center gap-3">
              <Input
                id="threshold"
                type="number"
                min="1"
                max={isFlightBookmark ? "200" : "100"}
                step={isFlightBookmark ? "1" : "5"}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                disabled={mode === 'view'}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{thresholdLabel}</span>
            </div>
          </div>

          {/* Alert Status (for view/edit modes) */}
          {mode !== 'create' && bookmark.alertConfig && (
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current threshold:</span>
                  <span className="font-medium">{bookmark.alertConfig.alertThreshold} {thresholdLabel}</span>
                </div>
                {bookmark.alertConfig.lastEvaluated && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last checked:</span>
                    <span className="font-medium">
                      {new Date(bookmark.alertConfig.lastEvaluated).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {bookmark.alertConfig.lastTriggered && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last triggered:</span>
                    <span className="font-medium text-orange-600">
                      {new Date(bookmark.alertConfig.lastTriggered).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full"
          >
            Cancel
          </Button>
          
          {mode !== 'create' && mode !== 'view' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveAlert}
              disabled={isLoading}
              className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Alert
            </Button>
          )}
          
          {mode !== 'view' && (
            <Button
              type="button"
              onClick={handleSaveAlert}
              disabled={isLoading}
              className="bg-teal-600 text-white hover:bg-teal-700 rounded-full"
            >
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Alert' : 'Update Alert'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { BookmarkAlertModal }