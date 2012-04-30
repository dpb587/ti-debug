Protocol Server
===============

Events
------

 * **`handshake`** (`Socket socket`) - a connection has been established and is ready to be handled by a listener
 * **`listening`** () - a server is ready and listening



BackendSession
==============

 * **`attach`** () - a frontend has attached to a session
 * **`detach`** () - a frontend has detached from a session
 * **`close`** () - a session has been closed

