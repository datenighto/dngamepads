# DNGamepads #

DNGamepads is an easy-to-use library which unifies and extends the [W3C gamepad API](https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html) that Chrome and Firefox implement. 

DNGamepads is developed by [Date Nighto](http://datenighto.com/), whose goal is to bring visual novels to the web.

## Compatibility ##

The library has been tested in the following browsers:

* Chrome 34
* Firefox 29

## Usage ##

Include DNGamepads.js in your JavaScript bundle or add it to your HTML page like this:

```html
<script type='application/javascript' src='/path/to/DNGamepads.js'></script>
```

The script must be loaded prior to referencing DNGamepads.

To respond to gamepad messages, simply use the `buttondown` and `buttonup` messages in association with the `gamepadconnected` and `gamepaddisconnected`. (DNGamepads will raise `gamepadconnected` even on Chrome, where it is technically not supported).

```js
function gamepadButtonPressed(event) {
	var pad = event.gamepad;
	var button = event.button;
	console.log( "Button " + button + " on pad " + pad.id + " pushed!");
}

function gamepadAttached(event) {
	var pad = event.gamepad;
	pad.addEventListener('buttondown', gamepadButtonPressed);
}

function gamepadDetached(event) {
	var pad = event.gamepad;
	pad.removeEventListener('buttondown', gamepadButtonPressed);

}

document.addEventListener("DOMContentLoaded", function(event) {
	var gamepads = window.DNGamepads;
	gamepads.addEventListener('gamepadconnected', gamepadAttached);
	gamepads.addEventListener('gamepaddisconnected', gamepadDetached);
	gamepads.startPolling();
});
```

Or, simply poll during using `requestAnimationFrame`:

```js
function update(){
	var gamepads = window.DNGamepads;
	var pad = gamepads.getPad(0);
	if( pad && pad.isButtonPushed(0) ) {
		// perform game logic!
	}
	window.requestAnimationFrame(update);	
}

document.addEventListener("DOMContentLoaded", function(event) {
	window.DNGamepads.startPolling();
	window.requestAnimationFrame(update);
});
```

Note that `startPolling` must be called for attach / detach logic to run in Chrome, as well as the `buttondown` and `buttonup` logic. The update loop, however, may be driven externally:

```js
var lastTime = 0;
function update(time){
	var gamepads = window.DNGamepads;
	// calculate delta time in ms
	gamepads.update(time - lastTime);
	lastTime = time;
	window.requestAnimationFrame(update);	
}

document.addEventListener("DOMContentLoaded", function(event) {
	// note we do not call startPolling here
	window.requestAnimationFrame(update);
});
```

Also note that `on` is an alias for `addEventListener`, and `off` is an alias for `removeEventListener` on all objects:

```js
// ...
document.addEventListener("DOMContentLoaded", function(event) {
	var gamepads = window.DNGamepads;
	// does not depend on JQuery!
	gamepads.on('gamepadconnected', gamepadAttached);
	gamepads.on('gamepaddisconnected', gamepadDetached);
	gamepads.startPolling();
});
```

### AMD ###

DNGamepads has AMD (Asynchronous Module Definition) support. This allows it to be lazy-loaded with an AMD loader, such as [RequireJS](http://requirejs.org/). 

### Package managers ###

You can install DNGamepads using [Bower](http://bower.io/). Requests for alternate delivery mechanisms are welcome.

## Credits and collaboration ##

DNGamepads is maintained by [Conrad Kreyling](http://twitter.com/konistehdev), as part of [Date Nighto](http://datenighto.com). Please feel free to raise an issue or pull request.

Special thanks to [Nicholas C. Zakas](http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/) for his EventTarget implementation, [Marcin Wichary](http://www.html5rocks.com/en/tutorials/doodles/gamepad/) for his excellent write-up on cross browser controller support, [David Walsh](http://davidwalsh.name/javascript-objects-deconstruction) for the pointers on Object.create-based inheritance and [FTLabs'](https://github.com/ftlabs/fastclick) for their excellent, small bower project folder. 
