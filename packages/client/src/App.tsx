import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);

  console.log("isConnected", isConnected);

  useEffect(() => {
    const onConnect = () => {
      console.log("connected");
      setIsConnected(true);
    }
    const onDisconnect = () => {
      setIsConnected(false);
    }
    const onHello = (data: any) => {
      console.log('hello', data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('hello', onHello);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('hello', onHello);

    }
  }, [])

  return (
    <div>
      <Topbar />
    </div>
  )
}

export default App
