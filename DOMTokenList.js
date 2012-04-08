"use strict";
if (!window.DOMTokenList2) {
	//create DOMTokenList implementation 
	(function createDOMTokenList(window) {
		var DOMTokenListproto = function DOMTokenList() {
				//WebIDL default prop structure for an attribute
				//http://www.w3.org/TR/WebIDL/#dfn-interface-object
				var prop = {
					writable: true,
					enumerable: false,
					configurable: true,
					value: null
				}
				prop.value = add;
				Object.defineProperty(this, "add", prop);
				prop.value = contains;
				Object.defineProperty(this, "contains", prop);
				prop.value = item;
				Object.defineProperty(this, "item", prop);
				prop.value = remove;
				Object.defineProperty(this, "remove", prop);
				prop.value = toggle;
				Object.defineProperty(this, "toggle", prop);

				//set up stringifier
				var props = {
					writable: true,
					enumerable: true,
					configurable: true,
					value: toString
				};
				Object.defineProperty(this, "toString", props);

				function toString() {
					return "function DOMTokenList() { [native code] }"
				}

				function generalTokenChecks(token) {
					//webIDL checks	
					if (token === undefined) {
						throw TypeError("Wrong argument error.");
					}

					//ECMAScript ToString();  
					token = (String.valueOf())(token);

					//If token is the empty string, then throw a "SyntaxError" exception 
					//and terminate these steps.
					if (token === "") {
						throw new SyntaxError("Token was an empty string");
					}

					//If token contains any space characters, then throw an "InvalidCharacterError" 
					//exception and terminate these steps.
					if (/\s/g.test(token)) {
						throw TypeError("InvalidCharacterError: spaces not allowed.");
					}
					return token;
				}

				function add(token) {
					//If token is the empty string, then throw a "SyntaxError" exception 
					//and terminate these steps.
					//If token contains any space characters, then throw an "InvalidCharacterError" 
					//exception and terminate these steps.
					token = generalTokenChecks(token);

					//Split the underlying string on spaces to get the list of tokens.
					var tokenList = splitUnderlyingString.call(this);

					//If token is a case-sensitive match for one of the tokens in the list found in the 
					//previous step, then terminate these steps.
					if (contains.call(this, token)) {
						return;
					}

					//If the underlying string is not the empty string and the last character of that 
					//string is not a space character, then append a U+0020 SPACE character to that string.
					var uString = this._underlyingString.value;
					if (uString !== "" && uString.charAt(uString.length - 1) !== "\u0020") {
						uString += "\u0020";
					}
					//Append token to the underlying string.
					uString += token;
					this._underlyingString.value = uString;
				}

				//The contains(token) method must run these steps:
				function contains(token) {
					token = generalTokenChecks(token);

					//Split the underlying string on spaces to get the list of tokens.
					var tokenList = splitUnderlyingString.call(this);

					//Return true if token is a case-sensitive match for one of the tokens in the list 
					//found in the previous step, or false otherwise
					for (var i = 0; i < tokenList.length; i++) {
						if (tokenList[i] === token) {
							return true;
						}
					}
					return false;
				}

				//Splits the underlying string into a list of tokens
				function splitUnderlyingString() {
					var underString = this.toString();
					var cleanString = underString.replace(/\s\s+/g, "\u0020").trim();
					return cleanString.split("\u0020");
				}

				function remove(token) {
					//If token is the empty string, then throw a "SyntaxError" exception and terminate these steps.
					//If token contains any space characters, then throw an "InvalidCharacterError" exception and terminate these steps.
					token = generalTokenChecks(token);
					//Remove token from the underlying string.
					if (contains.call(this, token)) {
						var oldValue = this._underlyingString.value;
						var newValue = oldValue.replace(token, "");
						this._underlyingString.value = newValue;
					}
				}

				function item(x) {
					//perform WebIDL type check. 
					//ECMAScript ToNumber
					x = (Number.valueOf())(x);
					//If number is NaN, +0, −0, +∞, or −∞, return +0.
					//to uInt32
					if (isNaN(x) || x === +0 || x === -Infinity || x === +Infinity) {
						x = +0;
					}
					var sign = (x > 0) ? 1 : -1;
					//correct Math.abs to be "abs" as defined in ECMAScript5
					var posInt = sign * Math.floor(sign * Math.abs(x));
					var int32bit = posInt % Math.pow(2, 32);

					//If index is equal to or greater than the length attribute value, 
					//return null and terminate these steps.
					if (x >= this.length) {
						return null;
					}

					//Split the underlying string on spaces, preserving the order of the tokens as found
					//in the underlying string, to get the list of tokens.
					var tokenList = splitUnderlyingString.call(this);

					//Return the indexth item in this list.
					return ((tokenList[x]) ? tokenList[x] : null);
				};

				function toggle(token) {
					//webIDL checks	
					//If token is the empty string, then throw a "SyntaxError" exception and terminate these steps.
					//If token contains any space characters, then throw an "InvalidCharacterError" exception and terminate these steps.
					token = generalTokenChecks(token);

					//Split the underlying string on spaces to get the list of tokens.
					var tokenList = splitUnderlyingString.call(this);

					//If token is a case-sensitive match for one of the tokens in the list 
					//found in the previous step, then remove token from the underlying string, 
					//return false and terminate these steps.
					if (contains.call(this, token)) {
						this.remove(token);
						return false;
					}

					//If the underlying string is not the empty string 
					//and the last character of that string is not a space character, 
					//Append the value of token to the underlying string.	
					add.call(this, token);

					//Return true.
					return true;
				};
			}
		var tokenFactory = new TokenListFactory();
		var prop = {
			get: function () {
				var domtokenobj = tokenFactory.getTokenList(this);
				return domtokenobj;
			}
		};
		//add to Element
		Object.defineProperty(window.Element.prototype, "classList2", prop);
		Object.defineProperty(window, "DOMTokenList2", {
			value: DOMTokenListproto
		})

		function TokenListFactory() {
			//holds tokens that are created, so we don't send out duplicates.  
			var elementTokens = [];

			//create method
			Object.defineProperty(this, "getTokenList", {
				value: getTokenList
			});

			function getTokenList(elem) {
				var tokenList = getToken(elem);
				if (!tokenList) {
					tokenList = (function () {
						var e = elem;
						return new DOMTokenList(e)
					})();
					elementTokens.push({
						element: elem,
						token: tokenList
					});
				}
				return tokenList;
			}

			function getToken(elem) {
				for (var i = 0; i < elementTokens.length; i++) {
					var pair = elementTokens[i];
					if (pair.element === elem) {
						return pair.token;
					}
				}
				return null;
			}

			function DOMTokenList(elem) {
				var underlyingString = Object.create({});
				var self = this;
				var oldList = [];
				var prop = {
					get: function () {
						return elem.className
					},

					set: function (value) {
						elem.className = value;
						var str = underlyingString.value;
						str = str.replace(/\s\s+/g, "\u0020").trim();
						var list = str.split("\u0020");

						for (var i = 0; i < oldList.length; i++) {
							delete self[i.toString()]
						}

						for (var i = 0; i < list.length; i++) {
							self[i.toString()] = list[i]
						}
						oldList = list;
					}
				}

				Object.defineProperty(underlyingString, "value", prop);
				Object.defineProperty(this, "_underlyingString", {
					value: underlyingString
				});

				Object.defineProperty(this, "_elem", {
					value: elem
				});

				underlyingString.value = underlyingString.value;

				Object.defineProperty(this, "length", {
					get: function () {
						var str = underlyingString.value;
						str = str.replace(/\s\s+/g, "\u0020").trim();
						var list = str.split("\u0020");
						return list.length;
					}
				});


				this.__proto__.toString = function () {
					return this._underlyingString.value;
				}
			}
			Object.defineProperty(DOMTokenList, "prototype", {
				value: new DOMTokenListproto
			});
		}
	})(this);
}

window.addEventListener("load", function setUp() {
	//article elements
	var articles = document.querySelectorAll("article");
	//diary entries
	var entries = [];
	//the main h1  
	var h1 = document.querySelector("body > h1");

	//Control showing/hidding all entries
	var controller = new DiaryController(entries, h1);

	//Create the diary entry objects 
	for (var i = 0; i < articles.length; i++) {
		var article = articles[i];
		var entry = new DiaryEntry(article);
		entries.push(entry);
	}

	//using eventing, link the diary entries together so 
	//that opening one closes the others. 
	for (var i = 0; i < entries.length; i++) {
		var target = entries[i];
		for (var j = 0; j < entries.length; j++) {
			var listener = entries[j];
			if (target !== listener) {
				target.on("show", listener.hide);
			}
		}
	}

	/*
DiaryController Class
Controls showing and hidding of all entries
*/
	function DiaryController(diaryEntries, elem) {
		var state = "hidden";
		elem.addEventListener("click", toggleAll, false);

		function toggleAll() {
			if (areAnyActive() === false && state === "hidden") {
				showAll();
				state = "showing";
				return;
			}
			if (areAnyActive() === true) {
				hideAll();
			}
			state = "hidden";
		}

		function areAnyActive() {
			for (var i = 0; i < diaryEntries.length; i++) {
				var entry = diaryEntries[i];
				if (entry.isActive) {
					return true;
				}
			}
			return false;
		}

		function showAll() {
			for (var i = 0; i < diaryEntries.length; i++) {
				var entry = diaryEntries[i];
				entry.show(true);
			}
		}

		function hideAll() {
			for (var i = 0; i < diaryEntries.length; i++) {
				var entry = diaryEntries[i];
				entry.hide();
			}
		}
	}


	function DiaryEntry(entry) {
		var para = entry.querySelector("p");
		var head = entry.querySelector("h2");
		var listeners = {
			"show": [],
			"hide": []
		}
		Object.defineProperty(this, "isActive", {
			get: isActive
		});
		this.show = show;
		this.hide = hide;
		window.addEventListener("resize", resize, false);

		this.on = function (event, listener) {
			switch (event) {
			case "show":
				{
					listeners.show.push(listener);
					break;
				}
			case "hide":
				{
					listeners.hide.push(listener);
					break;
				}
			}
		}

		//set up listener
		head.addEventListener("click", toggle, false)

		function isActive() {
			return para.classList2.contains("active");
		}


		function toggle() {
			if (para.classList2.contains("active")) {
				return hide();
			}
			show();
		}

		function hide() {
			para.classList2.remove("active");
			para.style.height = "0";
			for (var i = 0; i < listeners.hide.length; i++) {
				listeners.hide[i]();
			}
		}

		/*
	  @force force show, don't notify listeners
	   */
		function show(force) {
			para.classList2.add("active");
			resize();
			//lets listeners know
			if (!force) {
				for (var i = 0; i < listeners.show.length; i++) {
					listeners.show[i]();
				}
			}
		}

		function resize(e) {
			if (isActive()) {
				para.style.height = "0";
				para.style.height = para.scrollHeight + "px";
			}

		}
	}
}, false)