import socket
import sys
from contextlib import contextmanager

class NetworkBlockedError(RuntimeError):
    pass

@contextmanager
def network_disabled():
    """
    Context manager that blocks all socket connections except to localhost/127.0.0.1.
    Prevents any hidden LLM SDK or telemetry calls from hitting the network.
    """
    original_socket = socket.socket
    
    def mocked_socket(*args, **kwargs):
        sock = original_socket(*args, **kwargs)
        original_connect = sock.connect
        
        def mock_connect(address):
            if isinstance(address, tuple):
                host = address[0]
                if host not in ('127.0.0.1', 'localhost', '::1'):
                    raise NetworkBlockedError(f"DISQUALIFIER: Network access to {host} is strictly forbidden during offline ranking.")
            original_connect(address)
            
        sock.connect = mock_connect
        return sock

    # Apply mock
    socket.socket = mocked_socket
    try:
        yield
    finally:
        # Restore original
        socket.socket = original_socket
