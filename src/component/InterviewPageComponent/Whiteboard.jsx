import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, createTLStore, throttle } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// ============================================================================
// --- Tldraw Helper & Socket Sync ---
// ============================================================================
const TldrawSocketWrapper = ({ socket, roomID }) => {
  const editor = useEditor();

  // 🚀 STRICT TUF THEME: Force tldraw into Dark Mode to match the IDE
  useEffect(() => {
    if (editor) {
      // FIX: Updated to Tldraw v2 API for theming
      editor.user.updateUserPreferences({ colorScheme: 'dark' });
    }
  }, [editor]);

  // 1. Send our changes to others
  useEffect(() => {
    if (!socket || !editor) return;

    const handleChange = (change) => {
      // Only broadcast changes actually made by the human user
      if (change.source !== 'user') return;
      
      const snapshot = editor.getSnapshot();
      socket.emit("tldraw-changed", { roomID, snapshot });
    };
    
    // Throttle to 50ms to prevent flooding the WebSockets
    const throttledHandleChange = throttle(handleChange, 50); 
    const unsubscribe = editor.store.listen(throttledHandleChange);
    
    return () => unsubscribe();
  }, [editor, socket, roomID]);

  // 2. Receive changes from others
  useEffect(() => {
    if (!socket || !editor) return;

    const handleUpdate = ({ snapshot }) => {
      // Load the snapshot inside requestAnimationFrame to prevent UI flickering
      requestAnimationFrame(() => {
        editor.loadSnapshot(snapshot);
      });
    };

    socket.on("tldraw-update", handleUpdate);
    return () => {
      socket.off("tldraw-update", handleUpdate);
    };
  }, [editor, socket]);

  return null; 
};

// ============================================================================
// --- Main Whiteboard Component ---
// ============================================================================
const Whiteboard = ({ socket, roomID }) => {
  // Create an isolated store for the Tldraw editor
  const [store] = useState(() => createTLStore());
  
  return (
    // 🚀 FIXED: Added bg-zinc-950 so there is no white flash before tldraw mounts
    <div className="absolute inset-0 w-full h-full z-10 bg-zinc-950 font-sans">
      <Tldraw 
        store={store} 
        persistenceKey={`ranbhoomi_${roomID}`} 
        forceMobile={false}
        onMount={(editor) => {
          // Double-lock the dark mode on mount for instant application
          editor.user.updateUserPreferences({ colorScheme: 'dark' });
        }}
      >
        <TldrawSocketWrapper socket={socket} roomID={roomID} />
      </Tldraw>
    </div>
  );
};

export default Whiteboard;