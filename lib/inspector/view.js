module.exports = {
    standard : function (patch) {
        return '' +
            '<!--' +
            'Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.' +
            '' +
            'Redistribution and use in source and binary forms, with or without' +
            'modification, are permitted provided that the following conditions' +
            'are met:' +
            '' +
            '1.  Redistributions of source code must retain the above copyright' +
            '    notice, this list of conditions and the following disclaimer.' +
            '2.  Redistributions in binary form must reproduce the above copyright' +
            '    notice, this list of conditions and the following disclaimer in the' +
            '    documentation and/or other materials provided with the distribution.' +
            '3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of' +
            '    its contributors may be used to endorse or promote products derived' +
            '    from this software without specific prior written permission.' +
            '' +
            'THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY' +
            'EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED' +
            'WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE' +
            'DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY' +
            'DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES' +
            '(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;' +
            'LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND' +
            'ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT' +
            '(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF' +
            'THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.' +
            '-->' +
            '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '    <title>ti-debug - loading</title>' +
            '    <meta http-equiv="content-type" content="text/html; charset=utf-8">' +
            '' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/dialog.css">' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/inspector.css">' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/inspectorCommon.css">' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/inspectorSyntaxHighlight.css">' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/helpScreen.css">' +
            '    <link rel="stylesheet" type="text/css" href="/inspector/webkit/popover.css">' +
            '' +
            '    <script type="text/javascript" src="/inspector/webkit/utilities.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMExtension.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/treeoutline.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/inspector.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/UIUtils.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/InspectorBackend.js"></script>' +
            '    <!--<script type="text/javascript" src="/inspector/webkit/InspectorBackendStub.js"></script>-->' +
            '    <script type="text/javascript" src="/inspector/webkit/ExtensionRegistryStub.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/InspectorFrontendAPI.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Object.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Settings.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/InspectorFrontendHostStub.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Checkbox.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ContextMenu.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SoftContextMenu.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/KeyboardShortcut.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TextPrompt.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Popover.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Placard.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/View.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TabbedPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Drawer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ConsoleModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ConsoleMessage.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ConsoleView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Panel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/InspectorView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AdvancedSearchController.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelineGrid.js"></script>    ' +
            '    <script type="text/javascript" src="/inspector/webkit/ContentProvider.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Resource.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NetworkRequest.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CSSStyleModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NetworkManager.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NavigatorOverlayController.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NavigatorView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NetworkLog.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceTreeModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceUtils.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceType.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelineManager.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelineModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/UserAgentSupport.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Database.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMStorage.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMStorageItemsView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DataGrid.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ShowMoreDataGridNode.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CookiesTable.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CookieItemsView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ApplicationCacheModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ApplicationCacheItemsView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/IndexedDBModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/IndexedDBViews.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Script.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Spectrum.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ElementsTreeOutline.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMPresentationUtils.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SidebarTreeElement.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Section.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/PropertiesSection.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RemoteObject.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ObjectPropertiesSection.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ObjectPopoverHelper.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/BreakpointsSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMBreakpointsSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CallStackSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScopeChainSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/WatchExpressionsSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/WorkersSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/MetricsSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/PropertiesSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/EventListenersSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Color.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CSSCompletions.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CSSKeywordCompletions.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/StylesSidebarPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/PanelEnablerView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/StatusBarButton.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ElementsPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NetworkPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/InjectedFakeWorker.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TextViewer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SourceFrame.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/JavaScriptSourceFrame.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SplitView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TabbedEditorContainer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScriptsPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScriptsNavigator.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourcesPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ProfilesPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ConsolePanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ExtensionAPI.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ExtensionAuditCategory.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ExtensionServer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ExtensionPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditsPanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditResultView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditLauncherView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditRules.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditCategories.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/AuditFormatters.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/NetworkItemView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/EmptyView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestHeadersView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestCookiesView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestTimingView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestJSONView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestHTMLView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestResponseView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RequestPreviewView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceWebSocketFrameView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScriptFormatter.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMSyntaxHighlighter.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TextEditorModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TextEditorHighlighter.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SourceTokenizer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SourceCSSTokenizer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SourceHTMLTokenizer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SourceJavaScriptTokenizer.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/FontView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ImageView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DatabaseTableView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DatabaseQueryView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ProfileLauncherView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ProfileDataGridTree.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/BottomUpProfileDataGridTree.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TopDownProfileDataGridTree.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ProfileView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CSSSelectorProfileView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshot.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotProxy.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotWorkerDispatcher.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotGridNodes.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotLoader.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotDataGrids.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HeapSnapshotView.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DebuggerModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScriptMapping.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/UISourceCode.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/JavaScriptSource.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Linkifier.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DebuggerPresentationModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/BreakpointManager.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ContentProviders.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/RawSourceCode.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ResourceScriptMapping.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CompilerScriptMapping.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ScriptsSearchScope.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/DOMAgent.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelinePresentationModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelinePanel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelineOverviewPane.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TimelineFrameController.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/TestController.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HelpScreen.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Dialog.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/GoToLineDialog.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/FilteredItemSelectionDialog.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SidebarOverlay.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SettingsScreen.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/ShortcutsScreen.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HAREntry.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/CookieParser.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/Toolbar.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SearchController.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/WorkerManager.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/UserMetrics.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/JavaScriptContextManager.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/HandlerRegistry.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/MemoryStatistics.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/SnippetsModel.js"></script>' +
            '    <script type="text/javascript" src="/inspector/webkit/StylesPanel.js"></script>' +
            patch +
            '</head>' +
            '' +
            '<body id="-webkit-web-inspector">' +
            '    <div id="toolbar">' +
            '        <div class="toolbar-item close-left"><button id="close-button-left"></button></div>' +
            '        <div id="toolbar-controls">' +
            '            <div class="toolbar-item"><button id="toolbar-dropdown-arrow" class="toolbar-label">&raquo;</button></div>' +
            '            <div class="toolbar-item hidden" id="search-results-matches"></div>' +
            '            <div class="toolbar-item toolbar-search-item" >' +
            '                <input id="search" type="search" incremental results="0">' +
            '                <div id="search-toolbar-label" class="toolbar-label"></div><div id="toolbar-search-navigation-control"></div>' +
            '            </div>' +
            '            <div class="toolbar-item close-right"><button id="close-button-right"></button></div>' +
            '        </div>' +
            '    </div>' +
            '    <div id="main">' +
            '        <div id="main-status-bar" class="status-bar"><div id="anchored-status-bar-items"><div id="counters"><div id="error-warning-count" class="hidden"></div></div></div></div>' +
            '    </div>' +
            '    <div id="drawer"></div>' +
            '</body>' +
            '</html>'
        ;
    }
};
