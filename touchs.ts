type TouchEvt = TouchEvent & { initEvent: any; initUIEvent: any; initTouchEvent: any };
class TouchEvents {
	touchable = this.isTouchDevice();
	destory() {}
	constructor(el: HTMLElement) {
		if (this.isTouchDevice()) return;
		console.warn("触摸兼容模式");
		try {
			const touchstart = this.createEvent("touchstart")!;
			const touchmove = this.createEvent("touchmove")!;
			const touchend = this.createEvent("touchend")!;
			const touchcancel = this.createEvent("touchcancel")!;

			const offMousedown = this.on(el, "mousedown", touchstart, "touches");
			const offMousemove = this.on(el, "mousemove", touchmove, "touches");
			const offMouseup = this.on(el, "mouseup", touchend, "changedTouches");

			this.destory = () => {
				offMousedown();
				offMousemove();
				offMouseup();
			};
		} catch (error) {}
	}

	isTouchDevice() {
		return (
			"ontouchstart" in window ||
			navigator.maxTouchPoints > 0 ||
			//@ts-ignore
			navigator.msMaxTouchPoints > 0
		);
	}
	createEvent(evtName: string) {
		let e: TouchEvt;
		try {
			e = document.createEvent("TouchEvent") as TouchEvt;
			e.initTouchEvent(evtName, true, true);
			return e;
		} catch (error) {
			try {
				e = document.createEvent("UIEvent") as TouchEvt;
				e.initUIEvent(evtName, true, true);
				return e;
			} catch (error) {
				try {
					e = document.createEvent("Event") as TouchEvt;
					e.initEvent(evtName, true, true);
					return e;
				} catch (error) {}
			}
		}
	}
	on(el: Element, evtName: "mousedown" | "mousemove" | "mouseup", evt: any, touch: any) {
		const fn = (e: any) => {
			evt[touch] = [
				{
					pageX: e.pageX,
					pageY: e.pageY,
				},
			];
			el.dispatchEvent(evt);
		};
		el.addEventListener(evtName, fn, false);

		return () => el.removeEventListener(evtName, fn, false);
	}
}
