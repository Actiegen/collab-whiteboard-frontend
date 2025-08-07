'use client';

import { useState, useEffect } from 'react';

interface OnlineUser {
  user_id: string;
  username: string;
  is_online: boolean;
  timestamp: string;
}

interface OnlineUsersProps {
  roomId: string;
  currentUser: { email?: string; name?: string } | null;
  onlineUsers?: OnlineUser[];
}

export function OnlineUsers({ roomId, currentUser, onlineUsers: propOnlineUsers }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (propOnlineUsers && propOnlineUsers.length > 0) {
      // Use the online users from props
      setOnlineUsers(propOnlineUsers);
    } else {
      // Fallback to showing just current user
      setOnlineUsers([
        {
          user_id: currentUser?.email || 'current-user',
          username: currentUser?.name || currentUser?.email || 'You',
          is_online: true,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [currentUser, propOnlineUsers]);

  // Show current user as online if we have user data
  const showCurrentUser = currentUser && (currentUser.name || currentUser.email);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Online Users</h3>
      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No users online</p>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.user_id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                user.is_online ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-700">
                {user.username}
                {user.user_id === currentUser?.email && ' (You)'}
              </span>
            </div>
          ))
        )}
        {showCurrentUser && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Room: {roomId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
