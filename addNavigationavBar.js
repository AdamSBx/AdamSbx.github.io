//========================================================================
// set "currentLoadedHtmlFileName"
// this file (addNavigationavBar.js) is included in each html so this will be set when a html is loaded)

var url = new URL(window.location.href);
var currentLoadedHtmlFileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

// Handle case where URL ends with a '/' or there is no specific file name in the URL (which is the case when index.html is initially loaded)
if (currentLoadedHtmlFileName === '' || !currentLoadedHtmlFileName.includes('.')) {
    currentLoadedHtmlFileName = 'index.html';
}

//========================================================================

function switchPage(pageId) {
    if (pageId == 0) {
        window.location = "index.html";
    }
    else if (pageId == 1) {
        window.location = "simpleAudioClass.html";
    }
    else if (pageId == 2) {
        window.location = "webAudioNoProcessor.html";
    }
    else if (pageId == 3) {
        window.location = "webAudioWithProcessor.html";
    }
}

//========================================================================

// add parent container
var parentNode = document.createElement("div");
// parentNode.style.backgroundColor = "gray";
document.body.appendChild(parentNode);

// add button
var indexBtn = document.createElement("button");
indexBtn.onclick = function() { switchPage(0); }
indexBtn.innerHTML = "index.html";
parentNode.appendChild(indexBtn);

// add button
var simpleAudioClassBtn = document.createElement("button");
simpleAudioClassBtn.onclick = function() { switchPage(1); }
simpleAudioClassBtn.innerHTML = "simpleAudioClass.html";
parentNode.appendChild(simpleAudioClassBtn);

// add button
var webAudioNoProcessorBtn = document.createElement("button");
webAudioNoProcessorBtn.onclick = function() { switchPage(2); }
webAudioNoProcessorBtn.innerHTML = "webAudioNoProcessor.html";
parentNode.appendChild(webAudioNoProcessorBtn);

// add button
var webAudioWithProcessorBtn = document.createElement("button");
webAudioWithProcessorBtn.onclick = function() { switchPage(3); }
webAudioWithProcessorBtn.innerHTML = "webAudioWithProcessor.html";
parentNode.appendChild(webAudioWithProcessorBtn);

// add label which shows the name of the current loaded html file
var currentFileLabel = document.createElement("label"); // span as dummy element
currentFileLabel.innerHTML = "<br/> loaded html file: " + currentLoadedHtmlFileName;
parentNode.appendChild(currentFileLabel);

//========================================================================