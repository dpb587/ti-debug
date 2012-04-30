server-side debugging engines using the webkit remote debugger

*So far I've only tested this as a debugger for PHP via xdebug.*

 * *works* - breakpoints, source code, stepping, variable/scope browsing, simple console evaluations
 * *sooner* - advanced console evaluations, changing runtime values, code cleanup/docs, ocd fixes, better memory cleanup
 * *soon* - profiling, meta-inspecting the running ti-debug process
 * *someday* - zend protocol, v8


Installation
------------

This requires [`node.js`](http://nodejs.org/) - developed and tested under `v0.6.13`.

    git clone https://github.com/dpb587/ti-debug
    cd ti-debug/
    git clone git://github.com/buglabs/node-xml2json.git node_modules/node-xml2json
    npm install


Usage
-----

Start the server by running `./bin/ti-debug`, and point your (WebKit-based) browser to
[localhost:9222](http://localhost:9222).


Protocols
---------

### DBGp

A common debugger protocol for languages and debugger UI communications ([read more](http://xdebug.org/docs-dbgp.php)).
The server will listen on `*9000`. A DBGp proxy will also listen on `*9001`.

**PHP** - make sure the [`xdebug`](http://pecl.php.net/package/xdebug) extension is installed and properly configured
for [remote debugging](http://xdebug.org/docs/remote).


Credits
-------

 * Created by Danny Berger &lt;<dpb587@gmail.com>&gt;
 * [WebKit](http://www.webkit.org/) - [front-end](http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/) (r115569, 2012-04-28 10:20:37 -0400)
 * npm packages - commander, express, node-uuid, node-expat, xml2json, socket.io


License
-------

[BSD License](./LICENSE)
