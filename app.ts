const mm2px = 3.779528;

interface ScalerProps {
	defaultValue?: number;
	scale?: number;
	element: string | Element;
	width?: number;
	height?: number;
	background?: string;
	fps?: number;
	onUpdate?(value: number): void;
	drawText?(value: number): void;
	drawScale?(value: number): void;
}

function throttle(func: Function, limit: number) {
	let inThrottle: any;
	return function (this: any) {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

function getPrecision(scale: number) {
	const decimal = scale.toString().split(".")[1]?.length || 0;
	return Math.pow(10, decimal);
}

function precisionize(n: number, precision: number) {
	return Math.round(n * precision) / precision;
}

class Scaler {
	declare canvas: HTMLCanvasElement;
	declare ctx: CanvasRenderingContext2D;
	declare scale: number;
	declare width: number;
	declare height: number;
	declare fps: number;
	declare animation: any;

	private _value = 0;
	private precision = 0;

	constructor(props: ScalerProps) {
		this.init(props);
		this.resize = this.resize.bind(this);
		this.setSize();
		this.setGlobalStyle();
		this.scale = props.scale || 1;
		this.precision = getPrecision(this.scale);
		this.value = props.defaultValue || 0;
		this.fps = props.fps || 40;
		window.addEventListener("resize", this.resize, false);
		this.bindTouch();
		new TouchEvents(this.canvas);
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

	private bindTouch() {
		const self = this;
		this.animation = new PhyTouch({
			touch: this.canvas, //???????????????dom
			vertical: false, //?????????????????????true????????????????????????touch
			// target: this, //???????????????
			// property: "value", //??????????????????
			min: 0, //?????????,????????????????????????
			// max: 100, //?????????,????????????????????????
			// sensitivity: -1, //?????????????????????,???????????????reverse??????
			factor: 1, //?????????,???????????????????????????????????????????????????????????????????????????1
			moveFactor: 0.1, //?????????,??????touchmove???????????????????????????????????????????????????1
			outFactor: 0.1,
			step: 0.01, //???????????????step????????????
			deceleration: 0.004, // ??????
			// bindSelf: false,
			// maxSpeed: 1, //?????????????????????????????????????????????
			value: self._value,
			time: 300,
			reverse: true, //????????????
			change: throttle(self.setValue, 1000 / self.fps),
			// touchStart(evt: TouchEvent, value: number) {},
			// touchMove(evt: TouchEvent, value: number) {},
			// touchEnd(evt: TouchEvent, value: number) {},
			// tap(evt: TouchEvent, value: number) {},
			// pressMove(evt: TouchEvent, value: number) {},
			animationEnd: self.setValue,
		});
	}

	resize() {
		this.setSize();
		this.render();
	}
	to(target: number, duration?: number) {
		this.animation.to(target, duration);
	}
	destory() {
		window.removeEventListener("resize", this.resize, false);
		this.canvas = null as any;
		this.ctx = null as any;
	}

	get value() {
		return this.fixValue(this._value);
	}
	set value(n: number) {
		this._value = this.fixValue(n);
		this.render();
	}
	setValue = (n: number) => {
		this.value = n;
	};
	get length() {
		return Math.ceil(this.canvas.width / mm2px);
	}
	get cx() {
		return Math.floor(this.width / 2);
	}
	get cy() {
		return Math.floor(this.height / 2);
	}
	/** ???????????? */
	private fixValue(n: number) {
		console.log(n);

		return Math.round(n * this.precision) / this.precision;
	}

	private drawScale(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
		ctx.moveTo(x, y);
		ctx.lineTo(x, y - h);
	}

	private drawText(ctx: CanvasRenderingContext2D, value: number, x: number, y: number, h: number) {
		// console.log(value);
		ctx.fillText(value.toString(), x, y - h);
	}
	/** ???????????? */
	private drawScales() {
		const { ctx, cx, height, length, drawScale, drawText, scale, precision } = this;
		const half = Math.ceil(length / 2);
		const value = Math.floor(this.value);
		const decimal = Math.round((this.value % 1) * mm2px);
		const centry = cx + decimal;

		ctx.beginPath();
		for (let i = 0; i < length; i++) {
			const x = Math.round(i < half ? centry - i * mm2px : centry + (i - half) * mm2px);
			const val = i < half ? value - i : value + i - half;
			const text = precisionize(val * scale, precision);

			let h = 4;
			if (val % 10 === 0) {
				h = 10;
				drawText(ctx, text, x, height, 18);
			} else if (val % 5 === 0) {
				h = 7;
			}
			drawScale(ctx, x, height, h);
		}

		ctx.stroke();
	}
	/** ???????????? */
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
	/** ???????????? */
	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawOrigin();
		this.drawScales();
	}
}

const scaler = new Scaler({
	element: "#app",
	background: "#000",
	defaultValue: 5.4,
	scale: 0.02,
});

interface PhyTouch {
	[k: string]: (evt: TouchEvent, value: number) => void;
}
declare class PhyTouch {
	constructor(prop: any);
}

// let n = 1;
// setInterval(() => {
// 	scaler.to(n++);
// }, 1000 / 60);

// console.log(scaler.animation);
