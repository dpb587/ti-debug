server-side debugging engines using the webkit remote debugger


Installation
------------

This requires [`node.js`](http://nodejs.org/) - developed and tested under `v0.6.13`.

    git clone https://github.com/dpb587/ti-debug
    cd ti-debug/
    npm install


Usage
-----

Start the server by running `./bin/ti-debug`, and point your browser to [localhost:9222](http://localhost:9222).


Protocols
---------

### DBGp

A common debugger protocol for languages and debugger UI communications ([read more](http://xdebug.org/docs-dbgp.php)).
The server will listen on `*9000`. A DBGp proxy will also listen on `*9001`.

**PHP** - make sure the [`xdebug`](http://pecl.php.net/package/xdebug) extension is installed and properly configured
for [remote debugging](http://xdebug.org/docs/remote).


Credits
-------

 * [WebKit](http://www.webkit.org/) - [front-end](http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/) (r115569, 2012-04-28 10:20:37 -0400)


License
-------

[BSD License](./LICENSE)
