"use strict";
class Flexbox extends HTMLElement {
    constructor() {
        super();
        this._innerElt = document.createElement('mu-flexbox-inner');
        this.init();
        this.notice();
    }
    get diffWidth() { return this.offsetWidth - this._innerElt.offsetWidth; }
    notice() {
        this.style.paddingLeft = `${this.diffWidth / 2}px`;
    }
    init() {
        this._innerElt.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.appendChild(this._innerElt);
    }
}
customElements.define('mu-flexbox', Flexbox);
