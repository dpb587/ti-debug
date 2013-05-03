Server-side debugging engines using the WebKit remote debugger This currently works as a PHP debugger via xdebug.

 * *currently works* - breakpoints, source code, stepping, variable/scope browsing, simple console evaluations
 * *short-term goals* - dbgp-proxying to IDEs, changing runtime values inline, more complex console evaluations (e.g. returning objects/arrays), proper socket termination, code cleanup/documentation
 * *long-term goals* - zend/pdt protocol, v8


Prerequisites
-------------

At a minimum this requires `node` and `npm` to get started. I am currently using:

    $ node -v
    v0.10.1
    $ npm -v
    1.2.15

When debugging PHP, it also requires [`php`](http://php.net/) and [`xdebug`](http://pecl.php.net/package/xdebug). I am currently using:

    $ php -v
    PHP 5.4.14-1~precise+1 (cli) (built: Apr 11 2013 17:09:50) 
    $ php --re xdebug | head -n1
    Extension [ <persistent> extension #49 xdebug version 2.2.2 ] {


Installation
------------

    git clone https://github.com/dpb587/ti-debug
    cd ti-debug/
    npm install


Usage
-----

### DBGp

A common debugger protocol for languages and debugger UI communications ([read more](http://xdebug.org/docs-dbgp.php)).
The server will listen on `*:9000`.

Single Developer (debug via browser):

    ./bin/dbgp
    open http://localhost:9222/

Multiple Developers (debug via browser or IDE):

    ./bin/dbgp-proxy
    open http://localhost:9222/dbgp/proxy.html?idekey=$USER


References
----------

 * [DBGp Protocol](http://xdebug.org/docs-dbgp.php)
 * [Zend/PDT Protocol](http://www.eclipse.org/pdt/documents/PDT%20-%20Debug%20Protocol.pdf)
 * [V8 Protocol](http://code.google.com/p/v8/wiki/DebuggerProtocol)
 * [WebKit Announcement](http://www.webkit.org/blog/1875/announcing-remote-debugging-protocol-v1-0/)


Credits
-------

 * Created by Danny Berger &lt;<dpb587@gmail.com>&gt;
 * [WebKit](http://www.webkit.org/) - [front-end](http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/) (r149292, 2013-04-29 09:24:18)
 * npm packages:
    [commander](https://npmjs.org/package/commander),
    [express](https://npmjs.org/package/express),
    [node-uuid](https://npmjs.org/package/node-uuid),
    [node-expat](https://npmjs.org/package/node-expat),
    [xml2json](https://npmjs.org/package/xml2json),
    [socket.io](https://npmjs.org/package/socket.io)


License
-------

[BSD License](https://github.com/dpb587/ti-debug/blob/master/LICENSE)
