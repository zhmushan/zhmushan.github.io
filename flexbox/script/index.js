"use strict";
class Flexbox extends HTMLElement {
    constructor() {
        super();
        this._innerElt = document.createElement('mu-flexbox-inner');
        this._content = '';
        this.init();
        this.notice();
    }
    set content(content) { this._content = content; }
    get content() { return this._content; }
    get diffWidth() { return this.offsetWidth - this._innerElt.offsetWidth; }
    notice() {
        this.style.paddingLeft = `${this.diffWidth / 2}px`;
    }
    init() {
        this.content = this.innerHTML;
        this.innerText = '';
        this._innerElt.innerHTML = this.content;
        this.appendChild(this._innerElt);
    }
}
customElements.define('mu-flexbox', Flexbox);
