import React, { useEffect, useState } from 'react';
import { Tldraw, useEditor, createTLStore, throttle } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// This is a small helper component that sits inside Tldraw
// Its only job is to handle the socket communication
const TldrawSocketWrapper = ({ socket, roomID }) => {
  const editor = useEditor();

  // 1. Send our changes to others
  useEffect(() => {
    if (!socket) return;

    // This function runs every time the user makes a change
    const handleChange = (change) => {
      // We only care about changes made by the user
      if (change.source !== 'user') return;
      
      const snapshot = editor.getSnapshot();
      socket.emit("tldraw-changed", { roomID, snapshot });
    };
    
    // We "throttle" the function to avoid sending too many messages
    // This sends an update a maximum of once every 50ms
    const throttledHandleChange = throttle(handleChange, 50); 

    // Listen for changes and call our throttled function
    const unsubscribe = editor.store.listen(throttledHandleChange);
    return () => unsubscribe();
  }, [editor, socket, roomID]);

  // 2. Receive changes from others
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ snapshot }) => {
      // Load the snapshot from the other user
      // We wrap this in requestAnimationFrame to prevent flickers
      requestAnimationFrame(() => {
        editor.loadSnapshot(snapshot);
      });
    };

    socket.on("tldraw-update", handleUpdate);
    return () => {
      socket.off("tldraw-update", handleUpdate);
    };
  }, [editor, socket]);

  return null; // This component renders nothing itself
};

// This is the main Whiteboard component
const Whiteboard = ({ socket, roomID }) => {
  // Create a store for the Tldraw editor
  const [store] = useState(() => createTLStore());
  
  return (
    // This div MUST be absolute to fill its 'relative' parent
    <div className="absolute top-0 left-0 w-full h-full z-10">
      <Tldraw 
        store={store} 
        persistenceKey={`ranbhoomi_${roomID}`} // Optional: saves drawing to local storage
        forceMobile={false}
      >
        {/* Pass the socket and roomID to our helper */}
        <TldrawSocketWrapper socket={socket} roomID={roomID} />
      </Tldraw>
    </div>
  );
};

export default Whiteboard;