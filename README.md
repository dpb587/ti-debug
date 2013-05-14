Server-side debugging engines using the WebKit remote debugger This currently works as a PHP debugger via xdebug.

 * *currently works* - breakpoints, source code, stepping, variable/scope browsing, simple console evaluations, changing runtime values inline
 * *short-term goals* - dbgp-proxying to IDEs, more complex console evaluations (e.g. returning objects/arrays), proper socket termination, code cleanup/documentation
 * *long-term goals* - zend/pdt protocol, v8


Prerequisites
-------------

At a minimum this requires [`node`](http://nodejs.org/) and [`npm`](https://npmjs.org/) to get started. I am currently
using:

    $ node -v
    v0.10.1
    $ npm -v
    1.2.15


Installation
------------

    git clone https://github.com/dpb587/ti-debug
    cd ti-debug/
    npm install


Usage
-----

To use the debugger, ensure you're using a recent WebKit-based browser like
[Google Chrome](https://www.google.com/intl/en/chrome/browser/) or
[Apple Safari](http://www.apple.com/safari/). By default `ti-debug` will start a web server on `localhost:9222` for you
to connect and get started debugging. When new debug sessions are started, they will automatically open in a new window
-- be sure any popup blockers are disabled for `localhost`.


### PHP (DBGp)

When debugging PHP, you will want [`php`](http://php.net/) and [`xdebug`](http://pecl.php.net/package/xdebug) installed.
I am currently using:

    $ php -v
    PHP 5.4.14-1~precise+1 (cli) (built: Apr 11 2013 17:09:50) 
    $ php --re xdebug | head -n1
    Extension [ <persistent> extension #49 xdebug version 2.2.2 ] {

Single Developer (debug via browser):

    $ ./bin/dbgp
    $ open http://localhost:9222/

Multiple Developers (debug via browser or IDE):

    $ ./bin/dbgp-proxy
    $ open http://localhost:9222/dbgp/proxy.html?idekey=$USER

### Python (DBGp)

**work in progress**

When debugging Python, you will want [`python`](http://python.org/) and [`komodo-remote-debugging`](http://docs.activestate.com/komodo/8.0/debugpython.html#debugpython_top)
installed.

    $ wget 'http://downloads.activestate.com/Komodo/releases/8.0.2/remotedebugging/Komodo-PythonRemoteDebugging-8.0.2-78971-linux-x86_64.tar.gz'
    $ tar -xzf Komodo-PythonRemoteDebugging-8.0.2-78971-linux-x86_64.tar.gz
    $ cp -r Komodo-PythonRemoteDebugging-8.0.2-78971-linux-x86_64/pythonlib/dbgp venv/lib/python2.7/site-packages/
    $ cp Komodo-PythonRemoteDebugging-8.0.2-78971-linux-x86_64/pydbgp venv/bin/

Single Developer (debug via browser):

    $ ./bin/dbgp
    $ open http://localhost:9222/


Architecture
------------

The main purpose of `ti-debug` is to allow debugging protocols to be accessible through a browser interface. Currently
the WebKit Inspector powers the interface and communications occur:

    frontend debugger <-- frontend protocol --> ti-debug <-- debugger protocol --> debugger engine

In the case of DBGp, a client is started to wait for connections from the DBGp server. When a connection is received, it
checks to see if there's a browser waiting to debug and creates a debug session for the browser to connect to. From
there, [Inspector-friendly agents](./lib/dbgp/protocol/inspector/agent) handle translating DBGp commands into WebKit
commands. For example:

<pre><code>
      <strong>inspector &gt; ti-debug</strong>: {
                                "method": "Debugger.stepOver",
                                "id": 43
                            }
    <strong>ti-debug &gt; dbgp-engine</strong>: step_over -i 19
    <strong>dbgp-engine &gt; ti-debug</strong>: &lt;response ... command="step_over" transaction_id="19" status="break" reason="ok"&gt;
                                &lt;xdebug:message filename="file:///home/vagrant/dist/public/wordpress/wp-blog-header.php" lineno="10"&gt;&lt;/xdebug:message&gt;
                            &lt;/response&gt;
    <strong>ti-debug &gt; dbgp-engine</strong>: stack_get -i 20
    <strong>dbgp-engine &gt; ti-debug</strong>: &lt;response ... command="stack_get" transaction_id="20"&gt;
                                &lt;stack where="require" level="0" type="file" filename="file:///home/vagrant/dist/public/wordpress/wp-blog-header.php" lineno="10"&gt;&lt;/stack&gt;
                                &lt;stack where="{main}" level="1" type="file" filename="file:///home/vagrant/dist/public/index.php" lineno="1"&gt;&lt;/stack&gt;
                            &lt;/response&gt;
    <strong>ti-debug &gt; dbgp-engine</strong>: context_names -i 21 -d 0
    <strong>dbgp-engine &gt; ti-debug</strong>: &lt;response ... command="context_names" transaction_id="21"&gt;
                                &lt;context name="Locals" id="0"&gt;&lt;/context&gt;
                                &lt;context name="Superglobals" id="1"&gt;&lt;/context&gt;
                            &lt;/response&gt;
    <strong>ti-debug &gt; dbgp-engine</strong>: context_names -i 22 -d 1
    <strong>dbgp-engine &gt; ti-debug</strong>: &lt;response ... command="context_names" transaction_id="22"&gt;
                                &lt;context name="Locals" id="0"&gt;&lt;/context&gt;
                                &lt;context name="Superglobals" id="1"&gt;&lt;/context&gt;
                            &lt;/response&gt;
      <strong>ti-debug &gt; inspector</strong>: {
                                "method": "Debugger.paused",
                                "params": {
                                    "callFrames": [{
                                        "callFrameId": "0",
                                        "functionName": "require",
                                        "location": {
                                            "scriptId": "file:///home/vagrant/dist/public/wordpress/wp-blog-header.php",
                                            "lineNumber": 9,
                                            "columnNumber": 0
                                        },
                                        "scopeChain": [{
                                            "type": "local",
                                            "object": {
                                                "type": "object",
                                                "objectId": "|lvl0|ctx0"
                                            }
                                        }, {
                                            "type": "global",
                                            "object": {
                                                "type": "object",
                                                "objectId": "|lvl0|ctx1"
                                            }
                                        }],
                                        "this": null
                                    }, {
                                        "callFrameId": "1",
                                        "functionName": "{main}",
                                        "location": {
                                            "scriptId": "file:///home/vagrant/dist/public/index.php",
                                            "lineNumber": 0,
                                            "columnNumber": 0
                                        },
                                        "scopeChain": [{
                                            "type": "local",
                                            "object": {
                                                "type": "object",
                                                "objectId": "|lvl1|ctx0"
                                            }
                                        }, {
                                            "type": "global",
                                            "object": {
                                                "type": "object",
                                                "objectId": "|lvl1|ctx1"
                                            }
                                        }],
                                        "this": null
                                    }],
                                    "reason": "other"
                                }
                            }</code></pre>


References
----------

 * [DBGp Protocol](http://xdebug.org/docs-dbgp.php)
 * [Zend/PDT Protocol](http://www.eclipse.org/pdt/documents/PDT%20-%20Debug%20Protocol.pdf)
 * [V8 Protocol](http://code.google.com/p/v8/wiki/DebuggerProtocol)
 * [WebKit Announcement](http://www.webkit.org/blog/1875/announcing-remote-debugging-protocol-v1-0/)


Credits
-------

 * Created by [Danny Berger](http://dpb587.me)
 * [WebKit](http://www.webkit.org/) - [front-end](http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/) (r149292, 2013-04-29 09:24:18)
 * npm packages:
    [commander](https://npmjs.org/package/commander),
    [express](https://npmjs.org/package/express),
    [node-expat](https://npmjs.org/package/node-expat),
    [node-uuid](https://npmjs.org/package/node-uuid),
    [socket.io](https://npmjs.org/package/socket.io),
    [xml2json](https://npmjs.org/package/xml2json)


License
-------

[BSD License](./LICENSE)
