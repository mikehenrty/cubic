window.Sound = (() => {
  'use strict';

  const VOLUME_BG = 0.25;
  const VOLUME_EF = 0.25;

  function Sound(){
    this.context = new AudioContext();
    this.sounds = {};
    this.backgroundSrc = null;
  }

  Sound.prototype._getBufSrc = function(buffer, options) {
    var src = this.context.createBufferSource();
    src.loop = options && options.loop;
    src.buffer = buffer;

    // If volume was provided, set up gain node to handle it.
    if (options && typeof options.volume !== 'undefined') {
      var gainNode = this.context.createGain();
      gainNode.gain.value = options.volume;
      src.connect(gainNode);
      gainNode.connect(this.context.destination);
    } else {
      src.connect(this.context.destination);
    }
    return src;
  };

  Sound.prototype.loadSound = function(name, url) {
    console.log('loading sound', name, url);
    return new Promise((res, rej) => {
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'arraybuffer';
      req.onload = () => {
        this.context.decodeAudioData(req.response, buffer => {
          console.log('decoded sound', name);
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
    var soundInfo = this.sounds[name];
    if (!soundInfo) {
      console.log('attempted to play non-loaded sound', name);
      return;
    }

    if (!soundInfo.source) {
      soundInfo.source = this._getBufSrc(soundInfo.buffer, options);
    }

    var src = soundInfo.source;
    src.start(0);
    soundInfo.source = this._getBufSrc(soundInfo.buffer, options);
    return src;
  };

  Sound.prototype.play = function(name) {
    this._playWithOptions(name, { volume: VOLUME_EF });
  };

  Sound.prototype.stopBackground = function() {
    if (!this.backgroundSrc) {
      return;
    }

    this.backgroundSrc.stop();
    this.backgroundSrc = null;
  };

  Sound.prototype.playBackground = function(name) {
    this.stopBackground();
    this.backgroundSrc = this._playWithOptions(name, {
      loop: true,
      volume: VOLUME_BG,
    });
  };

  return Sound;
})();
