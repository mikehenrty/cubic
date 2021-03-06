window.Sound = (() => {
  'use strict';

  const MUTE = CONST.MUTE;

  const VOLUME_BG = 0.25;
  const VOLUME_EF = 0.25;

  function Sound(){
    this.context = new AudioContext();
    this.sounds = {};
    this.backgroundSrc = null;
    this.backgroundSrc2 = null;
  }

  Sound.prototype._getBufSrc = function(buffer, options) {
    options = options || {};
    options.volume = typeof options.volume !== 'undefined' ? options.volume : 1;

    var src = this.context.createBufferSource();
    var gainNode = this.context.createGain();
    src.loop = options.loop;
    src.buffer = buffer;
    src.connect(gainNode);
    gainNode.connect(this.context.destination);

    // If volume was provided, set up gain node to handle it.
    if (options.fade) {
      gainNode.gain.setValueAtTime(0.001, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(options.volume,
        this.context.currentTime + options.fade);
    } else {
      gainNode.gain.value = options.volume;
    }
    return src;
  };

  Sound.prototype.loadSound = function(name, url) {
    return new Promise((res, rej) => {
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'arraybuffer';
      req.onload = () => {
        this.context.decodeAudioData(req.response, buffer => {
          this.sounds[name] = {
            buffer: buffer,
          };
          res();
        });
      };
      req.onerror = (e) => {
        rej(e);
      };
      req.send();
    });
  };

  Sound.prototype._playWithOptions = function(name, options) {
    options = options || {};
    var soundInfo = this.sounds[name];
    if (!soundInfo) {
      console.log('attempted to play non-loaded sound', name);
      return;
    }

    if (MUTE) {
      return;
    }

    var src = this._getBufSrc(soundInfo.buffer, options);
    options.delay = options.delay || 0;
    src.start(this.context.currentTime + options.delay);
    return src;
  };

  Sound.prototype.play = function(name, options) {
    options = options || {};
    options.volume = VOLUME_EF;

    this._playWithOptions(name, options);
  };

  Sound.prototype.stopBackground = function() {
    if (this.backgroundSrc) {
      this.backgroundSrc.stop();
      this.backgroundSrc = null;
    }

    if (this.backgroundSrc2) {
      this.backgroundSrc2.stop();
      this.backgroundSrc2 = null;
    }
  };

  Sound.prototype.playBackground = function(name, options) {
    options = options || {};
    options.loop = true;
    options.volume = VOLUME_BG;
    options.fade = options.fade || 2;

    if (options.double) {
      this.backgroundSrc2 = this._playWithOptions(name, options);
      return;
    }

    this.stopBackground();
    this.backgroundSrc = this._playWithOptions(name, options);
  };

  return Sound;
})();
