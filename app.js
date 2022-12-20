"use strict";
const mm2px = 3.779528;
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
function getPrecision(scale) {
    var _a;
    const decimal = ((_a = scale.toString().split(".")[1]) === null || _a === void 0 ? void 0 : _a.length) || 0;
    return Math.pow(10, decimal);
}
function precisionize(n, precision) {
    return Math.round(n * precision) / precision;
}
class Scaler {
    constructor(props) {
        this._value = 0;
        this.precision = 0;
        this.setValue = (n) => {
            this.value = n;
        };
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
    init({ element, background }) {
        let canvas;
        if (typeof element === "string") {
            element = document.querySelector(element);
            if (!element) {
                throw new Error("cannot find the element by " + element);
            }
        }
        if (element instanceof HTMLCanvasElement) {
            canvas = element;
        }
        else if (element instanceof HTMLElement) {
            canvas = document.createElement("canvas");
            element.appendChild(canvas);
        }
        else {
            throw new Error("Invalid Element " + element);
        }
        canvas.style.background = background;
        const ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.ctx = ctx;
    }
    setSize() {
        const canvas = this.canvas;
        const { width, height } = canvas.parentNode.getBoundingClientRect();
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
    setGlobalStyle() {
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
    bindTouch() {
        const self = this;
        this.animation = new PhyTouch({
            touch: this.canvas,
            vertical: false,
            // target: this, //运动的对象
            // property: "value", //被运动的属性
            min: 0,
            // max: 100, //不必需,滚动属性的最大值
            // sensitivity: -1, //递增递减的方向,也可以实现reverse效果
            factor: 1,
            moveFactor: 0.1,
            outFactor: 0.1,
            step: 0.01,
            deceleration: 0.004,
            // bindSelf: false,
            // maxSpeed: 1, //不必需，触摸反馈的最大速度限制
            value: self._value,
            time: 300,
            reverse: true,
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
    to(target, duration) {
        this.animation.to(target, duration);
    }
    destory() {
        window.removeEventListener("resize", this.resize, false);
        this.canvas = null;
        this.ctx = null;
    }
    get value() {
        return this.fixValue(this._value);
    }
    set value(n) {
        this._value = this.fixValue(n);
        this.render();
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
    fixValue(n) {
        console.log(n);
        return Math.round(n * this.precision) / this.precision;
    }
    drawScale(ctx, x, y, h) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - h);
    }
    drawText(ctx, value, x, y, h) {
        // console.log(value);
        ctx.fillText(value.toString(), x, y - h);
    }
    /** 绘制刻度 */
    drawScales() {
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
            }
            else if (val % 5 === 0) {
                h = 7;
            }
            drawScale(ctx, x, height, h);
        }
        ctx.stroke();
    }
    /** 绘制原点 */
    drawOrigin() {
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
// let n = 1;
// setInterval(() => {
// 	scaler.to(n++);
// }, 1000 / 60);
// console.log(scaler.animation);
