Server-side debugging engines using the WebKit remote debugger.


Prerequisites
-------------

At a minimum this requires [`node`](http://nodejs.org/) and [`npm`](https://npmjs.org/) to get started. I am currently
using:

    $ node -v
    v0.10.1
    $ npm -v
    1.2.15

For best results, use a recent WebKit-based browser like [Google Chrome](https://www.google.com/intl/en/chrome/browser/)
or [Apple Safari](http://www.apple.com/safari/) to connect to the `ti-debug` server.


Installation
------------

    git clone https://github.com/dpb587/ti-debug
    cd ti-debug/
    npm install


Usage
-----

By default `bin/ti-debug` will start a web server on `localhost:9222` for you to connect and get started debugging. When
a new debug session is available the page will redirect to the debugging tools for the session. To see a full list of
configuration options run `bin/ti-debug --help`.


### DBGp

The DBGp service is enabled by default. Simple run `bin/ti-debug`, point your browser to `localhost:9222`, and configure
your DBGp engine to connect to the DBGp client at `localhost:9000`. If you need to support multiple developers, enable
the DBGp proxy server by adding the `--dbgp-proxy` option to the command - both browser-based and IDEs are supported.


#### PHP

You'll probably want to ensure the [`xdebug`](http://pecl.php.net/package/xdebug) extension is installed and configured.

See Also:

 * [`xdebug_break`](http://xdebug.org/docs/remote#xdebug_break)


#### Python

You'll probably want to ensure the [`komodo-remote-debugging`](http://docs.activestate.com/komodo/8.0/debugpython.html#debugpython_top)
module is installed. Be sure to invoke scripts with the included `pydbgp`.

See Also:

 * [`dbgp.client.brk`](http://docs.activestate.com/komodo/8.0/debugpython.html#debugpython_dbgpclient_functions)


Functionality
-------------

<table>
    <thead>
        <tr>
            <th style="text-align:left;">Feature</th>
            <th>DBGp<br/><small>php/xdebug</small></th>
            <th>DBGp<br /><small>python/komodo</small></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="vertical-align:top;">stepping &ndash; into</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">stepping &ndash; over</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">stepping &ndash; out</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">stepping &ndash; resume</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">stepping &ndash; break</td>
            <td style="text-align:center;">&Dagger;<br /><small>&nbsp;</small></td>
            <td style="text-align:center;">&Dagger;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">variable &ndash; popups</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">variable &ndash; functions</td>
            <td style="color:#993333;text-align:center;">&#10005;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">variable &ndash; editing</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#993333;text-align:center;">&#10005;<br /><small><a href="https://github.com/dpb587/ti-debug/issues/7">#7</a></small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">breakpoints &ndash; add</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">breakpoints &ndash; remove</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">call stack &ndash; enumeration</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">call stack &ndash; jumping</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">source &ndash; viewing</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">source &ndash; highlighting</td>
            <td style="text-align:center;">&Dagger;<br /><small>&nbsp;</small></td>
            <td style="text-align:center;">&Dagger;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">console</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#993333;text-align:center;">&#10005;<br /><small><a href="https://github.com/dpb587/ti-debug/issues/6">#6</a></small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">dbgp-specific &ndash; proxying (browser)</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
        <tr>
            <td style="vertical-align:top;">dbgp-specific &ndash; proxying (ide)</td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
            <td style="color:#339933;text-align:center;">&#10003;<br /><small>&nbsp;</small></td>
        </tr>
    </tbody>
</table>

<span style="color:#339933;">&#10003;</span> &ndash; full support  
&Dagger; &ndash; partial support  
<span style="color:#993333;">&#10005;</span> &ndash; no support


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
    [mocha](https://npmjs.org/package/mocha),
    [node-expat](https://npmjs.org/package/node-expat),
    [node-uuid](https://npmjs.org/package/node-uuid),
    [socket.io](https://npmjs.org/package/socket.io),
    [xml2json](https://npmjs.org/package/xml2json)


License
-------

[MIT License](./LICENSE)
