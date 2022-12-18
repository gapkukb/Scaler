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

class Scaler {
	private _value = 0;
	declare canvas: HTMLCanvasElement;
	declare ctx: CanvasRenderingContext2D;
	declare decimal: number;
	declare width: number;
	declare height: number;
	declare toucher: any;
	touching = false;
	val: number = 0;
	constructor(props: ScalerProps) {
		this.init(props);
		this.resize = this.resize.bind(this);
		this.setSize();
		this.setGlobalStyle();
		this.decimal = props.decimal || 1;
		this.value = props.defaultValue || 0;
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
		this.toucher = new PhyTouch({
			touch: this.canvas, //反馈触摸的dom
			vertical: false, //不必需，默认是true代表监听竖直方向touch
			// target: this, //运动的对象
			// property: "value", //被运动的属性
			min: 0, //不必需,运动属性的最小值
			// max: 100, //不必需,滚动属性的最大值
			sensitivity: -1, //不必需,触摸区域的灵敏度，默认值为1，可以为负数
			factor: 0.5, //不必需,表示触摸位移运动位移与被运动属性映射关系，默认值是1
			moveFactor: 0.5, //不必需,表示touchmove位移与被运动属性映射关系，默认值是1
			// outFactor: 0.1,
			step: 0.01, //用于校正到step的整数倍
			// bindSelf: false,
			// maxSpeed: 1, //不必需，触摸反馈的最大速度限制
			value: 0,
			time: 300,
			change: throttle((value: number) => {
				self.value = Math.floor(value);
			}, 1000 / 30),
			// touchStart(evt: TouchEvent, value: number) {},
			// touchMove(evt: TouchEvent, value: number) {},
			// touchEnd(evt: TouchEvent, value: number) {},
			// tap(evt: TouchEvent, value: number) {},
			// pressMove(evt: TouchEvent, value: number) {},
			animationEnd(value: number) {
				self.value = Math.floor(value);
			},
		});
	}

	resize() {
		this.setSize();
		this.render();
	}
	to(target: number, duration?: number) {
		this.toucher.to(target, duration);
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

	private drawScale(ctx: CanvasRenderingContext2D, value: number, x: number, y: number, h: number) {
		ctx.moveTo(x, y);
		ctx.lineTo(x, y - h);
	}

	private drawText(ctx: CanvasRenderingContext2D, value: number, x: number, y: number, h: number) {
		ctx.fillText(value.toString(), x, y - h);
	}
	/** 绘制刻度 */
	private drawScales() {
		const { ctx, cx, height, length, drawScale, drawText } = this;
		const half = Math.ceil(length / 2);
		const value = this.value;
		ctx.beginPath();
		for (let i = 0; i < length; i++) {
			const x = i < half ? Math.round(cx - i * mm2px) : Math.round(cx + (i - half) * mm2px);
			const val = i < half ? value - i : value + i - half;
			let h = 4;
			if (val % 10 === 0) {
				h = 10;
				drawText(ctx, val, x, height, 18);
			} else if (val % 5 === 0) {
				h = 7;
			}

			drawScale(ctx, val, x, height, h);
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
	defaultValue: 0,
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

// console.log(scaler.toucher);
