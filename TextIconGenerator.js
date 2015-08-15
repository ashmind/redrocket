class TextIconGenerator {
    constructor(options) {
        this._width = options.size;
        this._height = options.size;
        this._options = options;

        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._context = this._canvas.getContext('2d');
    }

    generate(text, color, background) {
        let ctx = this._context;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, this._width, this._height);

        let fontFamily = this._options.fontFamily || 'sans-serif';
        let padding = this._options.padding || 0;
        let fontSize = this._height;
        let textWidth;
        do {
          ctx.font = fontSize + 'px ' + fontFamily;
          textWidth = ctx.measureText(text).width;
          fontSize -= 1;
        } while (textWidth >= this._width - padding);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(text, this._width / 2, this._height / 2);

        return this._canvas.toDataURL();
    }
}

export default TextIconGenerator;