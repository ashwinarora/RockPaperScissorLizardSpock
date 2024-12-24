import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);

  console.log("isConnected", isConnected);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    }
    const onDisconnect = () => {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    }
  }, [])

  return (
    <div>
      <Topbar />
    </div>
  )
}

export default App
