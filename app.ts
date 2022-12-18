const mm2px = 3.779528;

interface ScalerProps {
	defaultValue?: number;
	decimal?: number;
	element: string | Element;
	width?: number;
	height?: number;
	background?: string;

	onUpdate?(value: number): void;
}

class Scaler {
	private _value = 0;
	declare canvas: HTMLCanvasElement;
	declare ctx: CanvasRenderingContext2D;
	declare decimal: number;
	declare width: number;
	declare height: number;

	constructor(props: ScalerProps) {
		this.init(props);
		this.resize = this.resize.bind(this);
		this.setSize();
		this.setGlobalStyle();
		this.decimal = props.decimal || 1;
		this.value = props.defaultValue || 0;
		window.addEventListener("resize", this.resize, false);
	}
	private init({ element, background }: ScalerProps) {
		let canvas: HTMLCanvasElement;
		if (typeof element === "string") {
			element = document.querySelector(element)!;
			if (!element) {
				throw new Error("cannot find the element by " + element);
			}
		}
		if (element instanceof HTMLCanvasElement) {
			canvas = element;
		} else if (element instanceof HTMLElement) {
			canvas = document.createElement("canvas");
			element.appendChild(canvas);
		} else {
			throw new Error("Invalid Element " + element);
		}

		canvas.style.background = background!;
		const ctx = canvas.getContext("2d")!;
		this.canvas = canvas;
		this.ctx = ctx;
	}

	private setSize() {
		const canvas = this.canvas;
		const { width, height } = (canvas.parentNode as HTMLDivElement).getBoundingClientRect();
		this.width = width;
		this.height = height;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		const ratio = window.devicePixelRatio;
		canvas.width = canvas.clientWidth * ratio;
		canvas.height = canvas.clientHeight * ratio;
		// this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.scale(ratio, ratio);
	}

	private setGlobalStyle() {
		const ctx = this.ctx;
		ctx.fillStyle = "#fff";
		ctx.strokeStyle = "#fff";
		ctx.strokeStyle = "#fff";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.lineWidth = 1;
		ctx.translate(0.5, 0.5);
	}

	resize() {
		this.setSize();
		this.render();
	}

	destory() {
		window.removeEventListener("resize", this.resize, false);
		this.canvas = null as any;
		this.ctx = null as any;
	}
	private __timer = 0;
	private easeInOutQuad(t: number, b: number, c: number, d: number) {
		t /= d / 2;
		if (t < 1) return (c / 2) * t * t + b;
		t--;
		return (-c / 2) * (t * (t - 2) - 1) + b;
	}
	get value() {
		return this._value;
	}
	set value(n: number) {
		// const distance = Math.abs(n) - Math.abs(this.value);
		// let time = 0;
		// let duration = 2;
		// let start = 0;
		// let fps = 30;

		// this.__timer = setInterval(() => {
		// 	time += 1 / fps;
		// 	const v = this.easeInOutQuad(time, start, distance, duration);
		// 	this._value = this.precisionize(n + v);
		// 	if (v >= distance) {
		// 		clearInterval(this.__timer);
		// 	}
		// 	this.render();
		// }, 1000 / fps);

		this._value = this.precisionize(n);
		this.render();
	}
	get precision() {
		return Math.pow(10, this.decimal);
	}
	get length() {
		return Math.ceil(this.canvas.width / mm2px);
	}
	get cx() {
		return Math.floor(this.width / 2);
	}
	get cy() {
		return Math.floor(this.height / 2);
	}
	/** 处理精度 */
	private precisionize(n: number) {
		return Math.round(n * this.precision) / this.precision;
	}
	private drawMM(ctx: CanvasRenderingContext2D, x: number, h: number) {
		ctx.moveTo(x, h);
		ctx.lineTo(x, h - 4);
	}
	private drawCM(ctx: CanvasRenderingContext2D, value: number, x: number, h: number) {
		ctx.moveTo(x, h);
		ctx.lineTo(x, h - 10);
		this.drawCMText(ctx, value, x, h);
	}
	private drawCMText(ctx: CanvasRenderingContext2D, value: number, x: number, h: number) {
		ctx.fillText(value.toString(), x, h - 20);
	}
	/** 绘制刻度 */
	private drawScales() {
		const { ctx, cx, height } = this;
		const half = Math.ceil(this.length / 2);
		const value = this.value;
		ctx.beginPath();
		// 绘制左侧 - 递减
		for (let i = 0, len = this.length; i < len; i++) {
			const x = Math.round(cx - i * mm2px);
			const val = value - i;
			if (val % 10 === 0) {
				this.drawCM(ctx, val, x, height);
			} else {
				this.drawMM(ctx, x, height);
			}
		}

		// 绘制右侧 - 递增
		for (let i = 1; i < half; i++) {
			const x = Math.round(cx + i * mm2px);
			const val = value + i;
			if (val % 10 === 0) {
				this.drawCM(ctx, val, x, height);
			} else {
				this.drawMM(ctx, x, height);
			}
		}
		ctx.stroke();
	}
	/** 绘制原点 */
	private drawOrigin() {
		const color = "yellow";
		const size = 20;
		const { cx, cy, ctx } = this;
		ctx.save();
		ctx.fillStyle = color;
		ctx.moveTo(cx - size / 2, 0);
		ctx.lineTo(cx + size / 2, 0);
		ctx.lineTo(cx, size);
		ctx.fill();
		ctx.restore();
	}
	/** 整体绘制 */
	render() {
		console.log("draw");

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawOrigin();
		this.drawScales();
	}
}

const scaler = new Scaler({
	element: "#app",
	background: "#000",
	defaultValue: 83,
});

setTimeout(() => {
	// scaler.value = 101;
}, 3000);