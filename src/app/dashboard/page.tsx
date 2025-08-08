'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { OnlineUsers } from '@/components/chat/OnlineUsers';
import { TldrawCanvas } from '@/components/whiteboard/TldrawCanvas';
import { config } from '@/lib/config';

// TypeScript interfaces
interface ChatMessage {
  type: 'chat' | 'system';
  username?: string;
  content: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  timestamp: string;
}

interface OnlineUser {
  user_id: string;
  username: string;
  is_online: boolean;
  timestamp: string;
}

interface Room {
  id: string;
  name: string;
  created_at: string;
}

// File Preview Component
const FilePreview = ({ fileUrl, fileName, fileType }: { 
  fileUrl: string; 
  fileName: string; 
  fileType: string; 
}) => {
  console.log('FilePreview component called with:', { fileUrl, fileName, fileType });
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('word') || type.includes('document')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📎';
  };

  const isImage = fileType.startsWith('image/');
  const isPdf = fileType.includes('pdf');
  const isText = fileType.includes('text');

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="text-2xl flex-shrink-0">
          {getFileIcon(fileType)}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">
                {fileType}
              </p>
            </div>
            
            {/* Download Button */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
          </div>
          
          {/* Preview */}
          {isImage && (
            <div className="mt-2">
              <Image 
                src={fileUrl} 
                alt={fileName}
                width={200}
                height={128}
                className="max-w-full max-h-32 rounded border object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', fileUrl);
                  e.currentTarget.style.display = 'none';
                }}
                unoptimized={true}
              />
            </div>
          )}
          
          {isPdf && (
            <div className="mt-2">
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-32 border rounded"
                title={fileName}
              />
            </div>
          )}
          
          {isText && (
            <div className="mt-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View text content
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('test');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const connectWebSocket = () => {
    if (!isAuthenticated || !user || isConnecting) {
      console.log('User not authenticated or already connecting');
      return;
    }
    
    setIsConnecting(true);
    const userId = user.email || '975fb39b-a6b1-4a93-a093-bcd380125d85';
    const wsUrl = `${config.wsUrl}/ws/${selectedRoom}/${userId}`;
    
    console.log('Connecting to:', wsUrl);
    setConnectionStatus('Connecting...');
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected!');
      setConnectionStatus('Connected');
      setIsConnecting(false);
      setMessages(prev => [...prev, '✅ Connected to backend']);
    };
    
    websocket.onmessage = (event) => {
      console.log('Received message:', event.data);
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, `📨 Received: ${event.data}`]);
      
      // Debug: Log the structure of the data
      console.log('Parsed data structure:', JSON.stringify(data, null, 2));
      
      // Handle different message types
      if (data.type === 'room_joined') {
        setChatMessages(prev => [...prev, {
          type: 'system',
          content: data.message,
          timestamp: new Date().toISOString()
        }]);
              } else if (data.type === 'chat_message') {
          console.log('Processing chat message:', data);
          const newMessage: ChatMessage = {
            type: 'chat',
            username: data.message?.username || data.username,
            content: data.message?.content || data.content,
            file_url: data.message?.file_url,
            file_name: data.message?.file_name,
            file_type: data.message?.file_type,
            timestamp: new Date().toISOString()
          };
          console.log('Created new message object:', newMessage);
          
          // Debug: Check if file data exists
          if (newMessage.file_url) {
            console.log('✅ File data found in message:', {
              file_url: newMessage.file_url,
              file_name: newMessage.file_name,
              file_type: newMessage.file_type
            });
          } else {
            console.log('❌ No file data in message');
          }
          
          setChatMessages(prev => [...prev, newMessage]);
        } else if (data.type === 'whiteboard_action') {
          console.log('Processing whiteboard action:', data);
          // Handle whiteboard actions - this will be processed by the canvas component
          // The canvas component will listen to these events
        } else if (data.type === 'presence') {
          console.log('Processing presence update:', data);
          // Handle presence updates (user online/offline)
          if (data.users) {
            setOnlineUsers(data.users);
          }
        } else if (data.type === 'user_joined') {
          console.log('User joined:', data);
          setOnlineUsers(prev => {
            const newUser = {
              user_id: data.user_id,
              username: data.username,
              is_online: true,
              timestamp: new Date().toISOString()
            };
            // Check if user already exists
            const exists = prev.find(u => u.user_id === data.user_id);
            if (exists) {
              return prev.map(u => u.user_id === data.user_id ? newUser : u);
            } else {
              return [...prev, newUser];
            }
          });
        } else if (data.type === 'user_left') {
          console.log('User left:', data);
          setOnlineUsers(prev => prev.filter(u => u.user_id !== data.user_id));
        } else {
          console.log('Unknown message type:', data.type);
        }
    };
    
    websocket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      console.log('WebSocket close wasClean:', event.wasClean);
      console.log('WebSocket close target:', event.target);
      setConnectionStatus('Disconnected');
      setIsConnecting(false);
      setWs(null);
      
      setMessages(prev => [...prev, `❌ Disconnected: ${event.code} - ${event.reason}`]);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Error');
      setIsConnecting(false);
      setMessages(prev => [...prev, `🚨 Error: ${error}`]);
    };
    
    setWs(websocket);
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  const sendChatMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && inputMessage.trim()) {
      const message = {
        type: 'chat_message',
        content: inputMessage.trim(),
        message_type: 'text'
      };
      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `📤 Sent: ${JSON.stringify(message)}`]);
      setInputMessage('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ws || ws.readyState !== WebSocket.OPEN || !isAuthenticated || !user) return;

    setIsUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.email || '975fb39b-a6b1-4a93-a093-bcd380125d85');
      formData.append('room_id', selectedRoom);

      // Upload file
      const response = await fetch(`${config.apiUrl}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const fileData = await response.json();
      console.log('File uploaded:', fileData);

      // Send file message via WebSocket
      const message = {
        type: 'chat_message',
        content: `📎 ${file.name}`,
        message_type: 'file',
        file_url: fileData.download_url,
        file_name: file.name,
        file_type: file.type,
        username: user.name || user.email || 'Anonymous'
      };

      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `📤 Sent file: ${file.name}`]);

    } catch (error) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, `🚨 Upload failed: ${error}`]);
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };



  const loadRooms = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/chat/rooms/`);
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
        if (roomsData.length > 0) {
          setSelectedRoom(roomsData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user?.email) return;
    
    setIsCreatingRoom(true);
    try {
      const response = await fetch(`${config.apiUrl}/chat/rooms/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          created_by: user.email
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms(prev => [...prev, newRoom]);
        setSelectedRoom(newRoom.id);
        setNewRoomName('');
        console.log('Room created successfully:', newRoom);
      } else {
        console.error('Failed to create room:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const deleteRoom = async () => {
    if (!selectedRoom || selectedRoom === 'test') return;
    
    setIsDeletingRoom(true);
    try {
      const response = await fetch(`${config.apiUrl}/chat/rooms/${selectedRoom}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRooms(prev => prev.filter(room => room.id !== selectedRoom));
        // Select the first available room or set to 'test'
        const remainingRooms = rooms.filter(room => room.id !== selectedRoom);
        if (remainingRooms.length > 0) {
          setSelectedRoom(remainingRooms[0].id);
        } else {
          setSelectedRoom('test');
        }
        console.log('Room deleted successfully');
      } else {
        console.error('Failed to delete room:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  // Load rooms on component mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Helper function to get room name by ID
  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || roomId;
  };

  // Clear chat messages when room changes
  useEffect(() => {
    if (isAuthenticated && user && selectedRoom && selectedRoom !== 'test') {
      console.log('Room changed, clearing messages');
      setChatMessages([]);
      setMessages([]);
    }
  }, [selectedRoom, isAuthenticated, user]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Section - Title and Room Management */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Collab Whiteboard
              </h1>
              
              {/* Room Selection and Management */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-w-[200px]"
                >
                  {rooms.length === 0 ? (
                    <option value="test">Loading rooms...</option>
                  ) : (
                    rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name || room.id}
                      </option>
                    ))
                  )}
                </select>
                <button
                  onClick={loadRooms}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Load Rooms
                </button>
              </div>
            </div>
            
            {/* Center Section - Create Room */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="New room name..."
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-w-[200px]"
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                />
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim() || isCreatingRoom}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  {isCreatingRoom ? 'Creating...' : 'Create Room'}
                </button>
              </div>
              
              {/* Delete Room */}
              <button
                onClick={deleteRoom}
                disabled={selectedRoom === 'test' || isDeletingRoom}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm"
                title={`Delete room: ${getRoomName(selectedRoom)}`}
              >
                {isDeletingRoom ? 'Deleting...' : `Delete "${getRoomName(selectedRoom)}"`}
              </button>
            </div>
            
            {/* Right Section - Connection and Auth */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {/* Connection Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'Connecting...' ? 'bg-yellow-100 text-yellow-800' :
                  connectionStatus === 'Error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus === 'Connected' ? `🟢 ${getRoomName(selectedRoom)}` :
                   connectionStatus === 'Connecting...' ? '🟡 Connecting...' :
                   connectionStatus === 'Error' ? '🔴 Error' :
                   '⚪ Disconnected'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('Connect clicked');
                      connectWebSocket();
                    }}
                    disabled={isConnecting || connectionStatus === 'Connected'}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => {
                      console.log('Disconnect clicked');
                      disconnectWebSocket();
                    }}
                    disabled={!ws || ws.readyState === WebSocket.CLOSED}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              
              {/* Auth */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user?.image && (
                    <Image 
                      src={user.image} 
                      alt={user.name || 'User'} 
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full p-4 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
          {/* Whiteboard */}
          <div className="xl:col-span-3 bg-white rounded-lg shadow flex flex-col">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Room: {getRoomName(selectedRoom)}</h2>
            </div>
            <div className="flex-1 min-h-0">
              <TldrawCanvas
                roomId={selectedRoom}
                currentUser={user ? { email: user.email || undefined, name: user.name || undefined } : null}
                isConnected={connectionStatus === 'Connected'}
              />
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            </div>
            
            {/* Online Users */}
            <div className="p-4 border-b flex-shrink-0">
              <OnlineUsers roomId={getRoomName(selectedRoom)} currentUser={user ? { email: user.email || undefined, name: user.name || undefined } : null} onlineUsers={onlineUsers} />
            </div>
            
            {/* Messages */}
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500">
                  {connectionStatus === 'Connected' ? (
                    <p className="text-sm">No messages yet. Start chatting!</p>
                  ) : connectionStatus === 'Connecting...' ? (
                    <p className="text-sm">🟡 Connecting to room...</p>
                  ) : (
                    <p className="text-sm">⚪ Click Connect to join the room</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((message, index) => (
                    <div key={`chat-${index}-${message.timestamp || Date.now()}`} className={`text-sm ${
                      message.type === 'system' ? 'text-blue-600 italic' : 'text-gray-800'
                    }`}>
                      {message.type === 'system' ? (
                        <span>🔔 {message.content}</span>
                      ) : (
                        <div>
                          <span><strong>{message.username}:</strong> {message.content}</span>
                          {message.file_url && message.file_name && message.file_type && (
                            <div className="mt-2 ml-4">
                              <FilePreview 
                                fileUrl={message.file_url}
                                fileName={message.file_name}
                                fileType={message.file_type}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={!ws || ws.readyState !== WebSocket.OPEN}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!ws || ws.readyState !== WebSocket.OPEN || !inputMessage.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  Send
                </button>
              </div>
              
              {/* File Upload */}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={!ws || ws.readyState !== WebSocket.OPEN || isUploading}
                    className="hidden"
                    accept="image/*,application/pdf,text/plain,.doc,.docx"
                  />
                  <span className={`px-3 py-2 text-sm rounded border ${
                    !ws || ws.readyState !== WebSocket.OPEN || isUploading
                      ? 'bg-gray-100 text-gray-400 border-gray-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                  }`}>
                    {isUploading ? '📤 Uploading...' : '📎 Attach File'}
                  </span>
                </label>
                {isUploading && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
