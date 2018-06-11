////////////  BGcolor recognizer
const input = document.querySelector("input");
const txtBox = document.querySelector("#text-box");
const network = new brain.NeuralNetwork();

network.train([
  // training dataset
  { input: { r: 0.62, g: 0.72, b: 0.88 }, output: { light: 1 } },
  { input: { r: 0.1, g: 0.84, b: 0.72 }, output: { light: 1 } },
  { input: { r: 0.33, g: 0.24, b: 0.29 }, output: { dark: 1 } },
  { input: { r: 0.74, g: 0.78, b: 0.86 }, output: { light: 1 } },
  { input: { r: 0.31, g: 0.35, b: 0.41 }, output: { dark: 1 } },
  { input: {r: 1, g: 0.99, b: 0}, output: { light: 1 } },
  { input: {r: 1, g: 0.42, b: 0.52}, output: { dark: 1 } }
]);

input.addEventListener('change', function(e){
	const rgb = getRgb(e.target.value);
	const result = brain.likely(rgb, network);

	document.querySelector('.txt-bg-color').innerHTML = result+' background';
	txtBox.style.background = e.target.value;
	txtBox.style.color = result === 'dark' ? 'white' : 'black';

});

function getRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: Math.round(parseInt(result[1], 16) / 2.55) / 100,
      g: Math.round(parseInt(result[2], 16) / 2.55) / 100,
      b: Math.round(parseInt(result[3], 16) / 2.55) / 100,
  } : null;
}

////////////  Image classifier

class CanvasData {
  constructor(canvas, options) {
    if(typeof canvas === "string") {
        canvas = document.querySelector(canvas);
    }
    this.config = Object.assign({}, {
        "width": 1,
        "height": 1
    }, options);
    this.canvas = canvas || document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ready = {
        aInternal: 10,
        aListener: function(val) {},
        set value(val) {
            this.aInternal = val;
            this.aListener(val);
        },
        get value() {
            return this.aInternal;
        },
        registerListener: function(listener) {
            this.aListener = listener;
        },
        unregisterListener: function() {
            this.aListener = function(val) {};
        }
    };
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
  }
  setImage(src, options) { // add image in canvas
    this.ready.value = false;
    let image;
    const self = this;
    if(typeof src === "string") {
        image = new Image();
        image.src = src;
        image.onload = () => {
            drawImage();
        };
    } else {
        image = src;
        drawImage();
    }
    function drawImage() {
        if(typeof options.imageSize === "object") {
            self.canvas.width = options.imageSize.width ? image.width : self.canvas.width;
            self.canvas.height = options.imageSize.height ? image.height : self.canvas.height;
        }
        self.ctx.drawImage(image, options.x || 0, options.y || 0);
        self.ready.value = true;
    }
    return self;
  }
  // Get pixalData from canvas
  getData() {
    this.prom = new Promise((resolve, reject) => {
      if(this.ready.value) {
          resolve(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
      } else {
          console.log(this.ready.value);
          this.ready.registerListener(val => {
              this.ready.unregisterListener();
              resolve(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
          });
      }
    }).then(rawdata => {
      const compiled = [];
      for(let i = 0; i < rawdata.data.length / 4; i++) {
          const x = { r: round(rawdata.data[i * 4] / 255),
              g: round(rawdata.data[i * 4 + 1] / 255),
              b: round(rawdata.data[i * 4 + 2] / 255),
              a: round(rawdata.data[i * 4 + 3] / 255)
          };
          compiled.push(x);
      }
      function round(a) {
          return Math.round(a * 100) / 100;
      }
      return compiled;
    }).then(compiled => {
      const data = [ 0, 0 ];
      for(const c of compiled) {
          const dl = net.run(c);
          if(dl.light > dl.dark) {
              data[0]++;
          } else {
              data[1]++;
          }
      }
      document.querySelector('.container h2').className = (data[0] > data[1]) ? 'light' : 'dark';
      document.querySelector('.img-bg-color').innerHTML = (data[0] > data[1]) ? 'light' : 'dark';
    });
    return this;
  }
}


const net = new brain.NeuralNetwork();
net.train([
  // training dataset
  { input: { r: 0.62, g: 0.72, b: 0.88, a: 0 }, output: { light: 1 } },
  { input: { r: 0.1, g: 0.84, b: 0.72, a: 0 }, output: { light: 1 } },
  { input: { r: 0.33, g: 0.24, b: 0.29, a: 0 }, output: { dark: 1 } },
  { input: { r: 0.74, g: 0.78, b: 0.86, a: 0 }, output: { light: 1 } },
  { input: { r: 0.31, g: 0.35, b: 0.41, a: 0 }, output: { dark: 1 } },
  { input: {r: 1, g: 0.99, b: 0, a: 0}, output: { light: 1 } },
  { input: {r: 1, g: 0.42, b: 0.52, a: 0}, output: { dark: 1 } }
]);

new CanvasData().setImage(document.getElementById("img"), {imageSize: {width: true, height: true}}).getData();
