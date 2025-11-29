"use client"

import React, { useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { type BookmarkItem } from "@/components/saved-item-card"

interface NotificationItem {
  id: string
  type: string
  message: string
  time: string
  flight?: string
  bookmarkTitle?: string
}

interface NotificationsListProps {
  bookmarksData: BookmarkItem[] | null
  isRealDashboard: boolean
}

export function NotificationsList({ bookmarksData, isRealDashboard }: NotificationsListProps) {
  // Remove unused auth check
  useAuth() // Keep hook call for consistency but don't destructure

  // Helper function to format notification timestamps
  const formatNotificationTime = useCallback((timestamp: string | number) => {
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
      if (isNaN(date.getTime())) return 'Unknown time'
      
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Unknown time'
    }
  }, [])

  // Helper function to extract flight number from bookmark
  const extractFlightNumber = useCallback((bookmark: BookmarkItem) => {
    try {
      if (bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData) {
        const offer = JSON.parse(bookmark.flightOfferData)
        const segment = offer.itineraries?.[0]?.segments?.[0]
        if (segment) {
          return `${segment.carrierCode} ${segment.number}`
        }
      } else if (bookmark.itemType === 'SAVED_SEARCH' && bookmark.flightNumber) {
        return bookmark.flightNumber
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined
  }, [])

  // Parse notifications from bookmark trigger history
  const parseNotificationsFromBookmarks = useCallback((bookmarks: BookmarkItem[]) => {
    if (!bookmarks || !Array.isArray(bookmarks)) {
      console.log('NotificationsList: No bookmarks data provided')
      return []
    }
    
    console.log('NotificationsList: Processing bookmarks for notifications:', bookmarks.length)
    
    const notifications: NotificationItem[] = []
    
    bookmarks.forEach(bookmark => {
      console.log('NotificationsList: Checking bookmark:', bookmark.bookmarkId, 'has alertConfig:', !!bookmark.alertConfig, 'has triggerHistory:', !!bookmark.alertConfig?.triggerHistory)
      
      if (bookmark.alertConfig?.triggerHistory) {
        try {
          // Parse trigger history JSON string
          const triggerEvents = JSON.parse(bookmark.alertConfig.triggerHistory)
          console.log('NotificationsList: Parsed trigger events:', triggerEvents)
          
          if (Array.isArray(triggerEvents)) {
            triggerEvents.forEach((event, index) => {
              // Create notification from trigger event
              const notification = {
                id: `${bookmark.bookmarkId}-${index}`,
                type: 'alert_triggered',
                message: event.message || `Alert triggered for ${bookmark.title}`,
                time: event.timestamp ? formatNotificationTime(event.timestamp) : 'Unknown time',
                flight: event.flightNumber || extractFlightNumber(bookmark),
                bookmarkTitle: bookmark.title
              }
              console.log('NotificationsList: Created notification:', notification)
              notifications.push(notification)
            })
          }
        } catch (err) {
          console.error('Failed to parse trigger history for bookmark:', bookmark.bookmarkId, err)
        }
      }
    })
    
    // Sort by most recent first
    return notifications.sort((a, b) => {
      if (a.time === 'Unknown time' && b.time === 'Unknown time') return 0
      if (a.time === 'Unknown time') return 1
      if (b.time === 'Unknown time') return -1
      return b.time.localeCompare(a.time)
    }).slice(0, 10) // Limit to 10 most recent
  }, [formatNotificationTime, extractFlightNumber])

  // Parse notifications from bookmarks data
  const recentNotifications = useMemo(() => {
    if (isRealDashboard && bookmarksData) {
      return parseNotificationsFromBookmarks(bookmarksData)
    }
    return []
  }, [isRealDashboard, bookmarksData, parseNotificationsFromBookmarks])

  // Debug: Show alert config data for bookmarks that have alerts
  const bookmarksWithAlerts = useMemo(() => {
    if (!bookmarksData || !Array.isArray(bookmarksData)) return []
    
    const alertItems: Array<{
      bookmarkId: string
      bookmarkTitle: string
      rawAlertConfig: unknown
      hasTriggerHistory: boolean
      rawTriggerHistory: string | undefined
    }> = []
    
    bookmarksData.forEach(bookmark => {
      // Only include bookmarks that have alert configs
      if (bookmark.alertConfig) {
        alertItems.push({
          bookmarkId: bookmark.bookmarkId,
          bookmarkTitle: bookmark.title,
          rawAlertConfig: bookmark.alertConfig,
          hasTriggerHistory: !!bookmark.alertConfig.triggerHistory,
          rawTriggerHistory: bookmark.alertConfig.triggerHistory
        })
      }
    })
    
    return alertItems
  }, [bookmarksData])

  return (
    <Card className="p-6">
      {recentNotifications.length > 0 ? (
        <div className="space-y-4">
          {recentNotifications.map((notification) => (
            <div key={notification.id} className="pb-4 border-b last:border-b-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-teal-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{notification.time}</span>
                    {notification.flight && (
                      <span className="text-xs text-gray-600 font-medium">{notification.flight}</span>
                    )}
                  </div>
                  {notification.bookmarkTitle && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-400 italic">{notification.bookmarkTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-700">No Notifications Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              {isRealDashboard 
                ? "Notifications will appear here when your alerts are triggered"
                : "Create alerts to start receiving notifications about seat availability"}
            </p>
          </div>
          
          {/* Debug: Show alert config data */}
          {bookmarksWithAlerts.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-600">Debug: Bookmarks with Alert Configs</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bookmarksWithAlerts.map((item) => (
                  <div key={item.bookmarkId} className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium mb-2">Bookmark: {item.bookmarkTitle}</div>
                    <div className="space-y-2 text-gray-600">
                      <div>ID: {item.bookmarkId}</div>
                      <div>Has Trigger History: {item.hasTriggerHistory ? 'Yes' : 'No'}</div>
                      
                      <div className="mt-2">
                        <div className="font-medium text-gray-700 mb-1">Raw Alert Config:</div>
                        <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                          {JSON.stringify(item.rawAlertConfig, null, 2)}
                        </pre>
                      </div>
                      
                      {item.hasTriggerHistory && (
                        <div className="mt-2">
                          <div className="font-medium text-gray-700 mb-1">Raw Trigger History:</div>
                          <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                            {item.rawTriggerHistory}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}