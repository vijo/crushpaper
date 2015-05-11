/*
Copyright 2015 CrushPaper.com.

This file is part of CrushPaper.

CrushPaper is free software: you can redistribute it and/or modify
it under the terms of version 3 of the GNU Affero General Public
License as published by the Free Software Foundation.

CrushPaper is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with CrushPaper.  If not, see <http://www.gnu.org/licenses/>.
*/
chrome.tabs.executeScript(null, {
	file : "getSelectedText.js"
	});

Mousetrap.stopCallback = function() { return false; };

Mousetrap.bind("alt+s", function() {
	document.getElementById('save').click();
	return false;
	});

Mousetrap.bind("esc", function() {
	window.close();
	return false;
	});

/** Returns the element corresponding to the browser event. */
function getEventEl(ev) {
    if (!ev) {
        ev = window.event;
    }
    
    var eventEl = null;
    if (ev.target) {
        eventEl = ev.target;
    } else if (ev.srcElement) {
        eventEl = ev.srcElement;
    }
    
    if (eventEl && eventEl.nodeType === 3) {
        eventEl = eventEl.parentNode;
    }
    
    return eventEl;
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	document.getElementById("quotation").innerHTML = message.quotation;
	document.getElementById("url").value = ("url" in message) ? message.url : sender.tab.url;
	document.getElementById("title").value = ("title" in message) ? message.title : sender.tab.title;
});

/** Handles mouseover events for the close button of the popup window. */
function onMouseOverCloseButton(ev) {
    var eventEl = getEventEl(ev);
    eventEl.style.cursor = "pointer";
    eventEl.style.color = "black";
}

/** Handles mouseout events for the close button of the popup window. */
function onMouseOutCloseButton(ev) {
    var eventEl = getEventEl(ev);
    eventEl.style.color = "";
}

/** Handles mouseclick events for the close button of the popup window. */
function onMouseClickCloseButton() {
	window.close();
}

document.getElementById('closebutton').addEventListener('mouseout', onMouseOutCloseButton);
document.getElementById('closebutton').addEventListener('mouseover', onMouseOverCloseButton);
document.getElementById('closebutton').addEventListener('click', onMouseClickCloseButton);

function sentenceSaving() {
	return "Saving...";
}

function errorNotSaved() {
	return "Sorry, this was not saved.";
}

function errorProbablyNotSaved() {
	return "Sorry, this was probably not saved.";
}

function errorJsonCouldNotBeParsed(prefix) {
	return prefix + " The server returned JSON that could not be parsed.";
}

function errorNoReponseFromServer(prefix) {
	return prefix + " The server did not respond.";
}

function sentenceSuccessfullySaved() {
	return "Successfully saved.";
}

/** Returns the set of errors as a single string. */
function getErrorText(responseText, whatDidNotHappen, whatProbablyDidNotHappen) {
	var result;
	if(responseText === "") {
		result = errorNoReponseFromServer(whatProbablyDidNotHappen);
	} else {
		try {
			var response = JSON.parse(responseText);
			result = whatDidNotHappen;
			if("errors" in response) {
				for(var i = 0; i < response.errors.length; ++i) {
					result += "<br>" + response.errors[i];
				}
			}
		} catch(e) {
			result = errorJsonCouldNotBeParsed(whatProbablyDidNotHappen);
		}
	}
	
	return result;
}

/** Sets the response to the specified error text. */
function setError(errorText) {
	document.getElementById("response").innerHTML = "<span class=\"errorMessage\">" + errorText + "</span>";
}

function errorBlankTitle() {
	return "Sorry, the title must not be blank.";
}

function errorBlankUrl() {
	return "Sorry, the URL must not be blank.";
}

function errorBlankNoteAndQuotation() {
	return "Sorry, the note and quotation must not both be blank.";
}

/** Shows the options tab if it's not already shown. */
function showOptionsTab() {
	var optionsUrl = chrome.extension.getURL('options.html');

	showTab(optionsUrl, true);
}

var alreadyIndicatedNeedsConfiguration = false;
function indicateNeedsConfiguration() {
	if(alreadyIndicatedNeedsConfiguration) {
		return;
	}
	
	alreadyIndicatedNeedsConfiguration = true;

	document.getElementById("needsConfigurationMessage").innerHTML = "Please visit the options tab to configure this extension." +
		"<br>The options tab will be automatically opened in 5 seconds.";
	
	setTimeout(showOptionsTab, 5000);
}

var retrievedSessionId = null;

function setSessionIdCallback(sessionId) {
	retrievedSessionId = sessionId;
}

/** Check if the configuration is all filled in. */
function checkIfNeedsConfigurationAndSignIn() {
	var storage = chrome.storage.local;
	storage.get('service', function(items) {
		if (!items.service || items.service === "") {
			indicateNeedsConfiguration();
		} else {
			confirmSessionAndSignedIn(items.service, false, setSessionIdCallback);
		}
	});
}

checkIfNeedsConfigurationAndSignIn();

/** Saves the new note by sending it to the server. */
function save() {
	var title = document.getElementById('title').value.trim();
	if(title === "") {
		setError(errorBlankTitle());
		return;
	}

	var url = document.getElementById('url').value.trim();
	if(url === "") {
		setError(errorBlankUrl());
		return;
	}

	var quotation = document.getElementById('quotation').value.trim();
	var note = document.getElementById('note').value.trim();
	if(note === "" && quotation === "") {
		setError(errorBlankNoteAndQuotation());
		return;
	}
	
	document.getElementById('quotation').disabled = true;
	document.getElementById('note').disabled = true;
	document.getElementById('title').disabled = true;
	document.getElementById('url').disabled = true;
	document.getElementById('save').disabled = true;
	
	var storage = chrome.storage.local;
	storage
			.get(
					"service",
					function(items) {
						var xhr = new XMLHttpRequest();

						xhr.open("POST", items.service + "/createQuotationJson?" + getAnUrlUniquer(), true);

						xhr.setRequestHeader("Content-Type",
								"application/json; charset=utf-8");

						xhr.onreadystatechange = function() {
							if (xhr.readyState === 4) {
								if (xhr.status === 200) {
									document.getElementById("response").innerHTML = "<span class=\"successMessage\">" + sentenceSuccessfullySaved() + "</span>";
									setTimeout(function() { window.close(); }, 500);
								} else {
									var errorText = getErrorText(xhr.responseText, errorNotSaved(), errorProbablyNotSaved());
									setError(errorText);
									document.getElementById('quotation').disabled = false;
									document.getElementById('note').disabled = false;
									document.getElementById('title').disabled = false;
									document.getElementById('url').disabled = false;
									document.getElementById('save').disabled = false;
								}
							}
						};

						document.getElementById("response").innerHTML = sentenceSaving();
						
						xhr.send(JSON.stringify({
							"title": title,
							"url": url,
							"note": note,
							"quotation": quotation,
							"sessionId": retrievedSessionId
						}));
					});
}

document.getElementById('save').addEventListener('click', save);