Backend Socket
==============

Events
------

 * **`payload`** (`string data`) - protocol has received a message which can be handled by a listener
 * **`close`** () - a socket has been closed

Methods
-------

 * `getMetadata` () - should return `backend` (object with keys for `protocol`, `language`, `engine`), `faviconUrl` (optional), `title`, `url`
